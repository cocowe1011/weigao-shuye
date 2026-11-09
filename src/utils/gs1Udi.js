/**
 * 把扫码枪读到的 GS1 串转成 MES 要求的带括号格式。
 * 有 GS（ASCII 29）时按标准切：定长 AI 取固定位数，变长 AI 读到 GS 或结尾。
 * 没有分隔符（手输、粘贴）时，沿用批号后「11+日期+17+日期」的兜底。
 * 加括号后必须保留完整的码内容（兼容省略 01 的旧输入），否则退回裸串。
 */

const GS = '\x1d';

/** 2 位定长 AI → 数据位数（不含 AI 本身）。00/01/02 必须带引号，否则会丢前导零 */
const FIXED_AI_LENGTH = {
  '00': 18,
  '01': 14,
  '02': 14,
  11: 6,
  12: 6,
  13: 6,
  15: 6,
  16: 6,
  17: 6,
  20: 2
};

function alnum(value) {
  return String(value || '').replace(/[^0-9A-Za-z]/g, '');
}

function isVariableAi(ai) {
  return ai === '10' || ai === '21' || (ai >= '90' && ai <= '99');
}

/**
 * 沿用参考项目的变长字段上限：批号/序列号 20 位、厂商字段 30 位。
 * 超过上限说明分隔符缺失、字段被串读（如 (10) 把后面的 11/17/91/21 全吞了），
 * 此时必须判定本次按 GS 解析无效，退回日期兜底重解析，不能把错分段直接交给 MES。
 */
function maxVariableLength(ai) {
  if (ai >= '90' && ai <= '99') return 30;
  return 20;
}

function normalizeUdiRaw(raw) {
  let text = String(raw).trim();
  text = text.replace(/^\](?:d2|C1|e0|Q3)/i, '');
  text = text.replace(/^F<\s*'?/, '').split('*')[0];
  text = text.replace(/<GS>/gi, GS).replace(/\{GS\}/gi, GS);
  text = text.replace(/\u241d/g, GS);
  return text;
}

/**
 * 按 GS 分隔符解析。无法识别的 AI 返回空串，交给日期兜底。
 */
function parseByGroupSeparator(source, anchors) {
  let index = 0;
  let result = '';
  while (index < source.length) {
    if (source.charAt(index) === GS) {
      index += 1;
      continue;
    }
    if (index + 2 > source.length) return '';
    const fieldStart = index;
    const ai = source.substr(index, 2);
    index += 2;
    const fixedLength = FIXED_AI_LENGTH[ai];
    let value = '';
    if (fixedLength) {
      if (index + fixedLength > source.length) return '';
      value = source.substr(index, fixedLength);
      if (value.indexOf(GS) !== -1) return '';
      index += fixedLength;
    } else if (isVariableAi(ai)) {
      const gsAt = source.indexOf(GS, index);
      const end = gsAt === -1 ? source.length : gsAt;
      value = source.substring(index, end);
      if (!value || value.length > maxVariableLength(ai)) return '';
      if (gsAt !== -1) {
        anchors.push({
          ai,
          start: alnum(source.substring(0, fieldStart)).length,
          end: alnum(source.substring(0, end)).length
        });
      }
      index = end;
    } else {
      return '';
    }
    result += `(${ai})${value}`;
  }
  return result;
}

/**
 * 旧版字段读取顺序保持不变。扩展的 (91) 末尾字段、值以 21 开头的处理
 * 只在旧规则无法完整解析时启用，不能使错误的早期边界抢占旧结果。
 */
function parseTail(source, start, extended = false) {
  let position = start;
  let result = '';
  for (const ai of ['11', '17']) {
    if (source.substr(position, 2) !== ai) continue;
    const value = source.substr(position + 2, 6);
    if (value.length !== 6) return '';
    result += `(${ai})${value}`;
    position += 8;
  }
  if (source.substr(position, 2) === '91') {
    const valueStart = position + 2;
    let next = source.indexOf('21', valueStart);
    if (extended && next === valueStart) {
      next = source.indexOf('21', next + 2);
    }
    if (next === -1) {
      if (!extended || valueStart === source.length) return '';
      result += `(91)${source.substring(valueStart)}`;
      position = source.length;
    } else {
      if (next === valueStart) return ''; // 不允许生成空的 (91)
      result += `(91)${source.substring(valueStart, next)}`;
      position = next;
    }
  }
  if (source.substr(position, 2) === '21') {
    const serial = source.substring(position + 2);
    if (!serial) return '';
    result += `(21)${serial}`;
    position = source.length;
  }
  return position === source.length ? result : '';
}

function validDate(value) {
  if (!/^\d{6}$/.test(value)) return false;
  const month = Number(value.substr(2, 2));
  const day = Number(value.substr(4, 2));
  // 保持旧版的日期判断口径，不在这次修复中增加新的日期限制。
  return month >= 1 && month <= 12 && day >= 1 && day <= 31;
}

function hasNonemptyFields(parsed) {
  return /^(?:\(\d{2}\)[0-9A-Za-z]+)+$/.test(parsed);
}

/**
 * 无分隔符的兼容路径：
 * 1. 先执行旧版最早的 11+日期边界（没有则取 8 位批号），完整结果立即保留。
 * 2. 旧结果被截断时，按先后顺序尝试其他日期边界，仍沿用旧版尾部规则。
 * 3. 上述均失败才启用 (91) 扩展；先尝试连续的生产日期/有效期组合。
 *
 * 不用批号最小长度、(91) 长度、字段数量等分数改变旧版完整结果。
 * 裸串本身可能存在多个合法含义，已知 GS/括号边界由上层优先处理。
 */
function parseCompact(cleanUdi, accept) {
  const gtinStart = cleanUdi.substr(0, 2) === '01' ? 2 : 0;
  if (gtinStart + 14 > cleanUdi.length) return '';
  const prefix = `(01)${cleanUdi.substr(gtinStart, 14)}`;
  const position = gtinStart + 14;
  const complete = (parsed) =>
    hasNonemptyFields(parsed) && alnum(parsed) === cleanUdi && accept(parsed)
      ? parsed
      : '';
  if (cleanUdi.substr(position, 2) !== '10') {
    return (
      complete(prefix + parseTail(cleanUdi, position)) ||
      complete(prefix + parseTail(cleanUdi, position, true))
    );
  }
  const batchStart = position + 2;
  const candidates = [];
  for (let end = batchStart + 1; end + 8 <= cleanUdi.length; end++) {
    if (
      cleanUdi.substr(end, 2) === '11' &&
      validDate(cleanUdi.substr(end + 2, 6))
    )
      candidates.push(end);
  }
  const tryBoundary = (end, extended = false) => {
    if (end <= batchStart || end > cleanUdi.length) return '';
    return complete(
      prefix +
        `(10)${cleanUdi.substring(batchStart, end)}` +
        parseTail(cleanUdi, end, extended)
    );
  };
  const fixedBatchEnd = batchStart + 8;
  const legacyEnd = candidates.length ? candidates[0] : fixedBatchEnd;
  const legacy = tryBoundary(legacyEnd);
  if (legacy) return legacy;

  // 现场 20261101 的第一个假日期边界会丢失后续内容，尝试后续真实边界。
  for (const end of candidates.slice(1)) {
    const parsed = tryBoundary(end);
    if (parsed) return parsed;
  }

  // 支持没有 (21) 的码，以及 (91) 内容以 21 开头的码。
  const paired = candidates.filter(
    (end) =>
      cleanUdi.substr(end + 8, 2) === '17' &&
      validDate(cleanUdi.substr(end + 10, 6))
  );
  const extendedEnds = paired.concat(
    candidates.filter((end) => !paired.includes(end))
  );
  for (const end of extendedEnds) {
    const parsed = tryBoundary(end, true);
    if (parsed) return parsed;
  }
  // 保留旧版无日期时的 8 位批号路径，不增加新的批号长度假设。
  return fixedBatchEnd <= cleanUdi.length
    ? tryBoundary(fixedBatchEnd, true)
    : '';
}

/** 明确括号边界优先；不把字段值中的 AI 数字重新切开。 */
function parseParenthesized(source) {
  if (!hasNonemptyFields(source)) return '';
  return source;
}

function segmentsOf(parsed) {
  const segments = [];
  const pattern = /\((\d{2})\)([0-9A-Za-z]+)/g;
  let match;
  let offset = 0;
  while ((match = pattern.exec(parsed))) {
    const start = offset;
    offset += 2 + match[2].length;
    segments.push({ ai: match[1], start, end: offset });
  }
  return segments;
}

/** 兜底不能跨过任何已有 GS；已按 GS 确定的变长字段也不能被重新切分。 */
function respectsSeparators(source, parsed, anchors) {
  const segments = segmentsOf(parsed);
  let offset = 0;
  for (let i = 0; i < source.length; i++) {
    if (source[i] !== GS) {
      offset += 1;
      continue;
    }
    if (offset === 0) continue;
    if (!segments.some((segment) => segment.end === offset)) return false;
    const anchored = anchors.find(
      (segment) => segment.end === offset && isVariableAi(segment.ai)
    );
    if (
      anchored &&
      !segments.some(
        (segment) =>
          segment.ai === anchored.ai &&
          segment.start === anchored.start &&
          segment.end === anchored.end
      )
    )
      return false;
  }
  return true;
}

export function parseUDICode(rawUdi) {
  if (!rawUdi) return '';
  // 与旧版一样清除包装字符，但保留 GS 和括号以确定真实字段边界。
  // eslint-disable-next-line no-control-regex
  const normalized = normalizeUdiRaw(rawUdi).replace(/[^0-9A-Za-z\x1d()]/g, '');
  const digits = alnum(normalized);
  if (!digits) return '';
  try {
    const explicit = parseParenthesized(normalized);
    if (explicit) return explicit;
    let source = normalized.replace(/[()]/g, '');
    // 旧版支持直接从 14 位 GTIN 开始的输入，继续补回 (01)。
    if (source.substr(0, 2) !== '01' && /^\d{14}/.test(source)) {
      source = '01' + source;
    }
    const cleanUdi = alnum(source);
    const hasGS = source.indexOf(GS) !== -1;
    const anchors = [];
    const direct = hasGS ? parseByGroupSeparator(source, anchors) : '';
    // GS 路径完整成功时直接采信，不允许日期兜底凭更多字段重切变长值。
    if (hasNonemptyFields(direct) && alnum(direct) === cleanUdi) {
      return direct;
    }
    const fallback = parseCompact(
      cleanUdi,
      (parsed) => !hasGS || respectsSeparators(source, parsed, anchors)
    );
    const fallbackValid =
      alnum(fallback) === cleanUdi &&
      (!hasGS || respectsSeparators(source, fallback, anchors));
    const result = fallbackValid ? fallback : '';
    // 空字段（如 (91) 无值）在 GS1 中非法，不能送 MES
    if (!hasNonemptyFields(result)) return digits;
    // 不向 MES 发送被截断的“解析成功”结果。
    return alnum(result) === cleanUdi ? result : digits;
  } catch (error) {
    console.error('UDI解析失败:', error);
    return digits;
  }
}
