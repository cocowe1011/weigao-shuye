<template>
  <div class="main-page-container">
    <!-- 配置读取失败遮罩 -->
    <div class="config-error-mask" v-if="!configLoaded">
      <div class="config-error-content">
        <div class="config-error-icon">
          <i class="el-icon-warning"></i>
        </div>
        <div class="config-error-text">未获取到机器配置</div>
      </div>
    </div>

    <!-- 主要内容区域 -->
    <div class="main-content" v-else>
      <!-- 顶部标题区域 -->
      <div class="header">
        <div class="header-content">
          <div class="header-title">威高专用输液器重量复核系统</div>
          <div class="header-time">{{ currentDateTime }}</div>
        </div>
        <div class="header-test-icon" @click="toggleTestPanel">
          <i class="el-icon-setting"></i>
        </div>
      </div>

      <!-- 测试面板 -->
      <div class="test-panel" v-if="showTestPanel">
        <div class="test-panel-header">
          <span>测试面板</span>
          <i class="el-icon-close" @click="closeTestPanel"></i>
        </div>
        <div class="test-panel-content">
          <div class="test-row">
            <label>当前重量:</label>
            <input type="number" v-model.number="currentWeight" />
          </div>
          <div class="test-row">
            <label>A-1读码信息:</label>
            <input type="text" v-model="scanInfo1" />
          </div>
          <div class="test-row">
            <label>A-2读码信息:</label>
            <input type="text" v-model="scanInfo2" />
          </div>
          <div class="test-row">
            <label>允许读码:</label>
            <button @click="triggerScan" :disabled="allowScan === 1">
              触发读码
            </button>
          </div>
        </div>
      </div>

      <!-- 主要内容区域 -->
      <div class="main-container">
        <!-- 上半部分：产品信息和称重 -->
        <div class="top-section">
          <!-- 左侧卡片区域 -->
          <div class="left-cards">
            <div class="info-card udi-card">
              <i class="el-icon-camera card-background-icon"></i>
              <div class="card-label">UDI码</div>
              <div class="card-value" style="font-size: 18px">
                {{ scanInfo1 || '待扫描' }}
              </div>
            </div>
            <div class="info-card product-card">
              <i class="el-icon-box card-background-icon"></i>
              <div class="card-label">产品名称</div>
              <div class="card-value">
                {{ productInfo ? productInfo.productName : '待获取' }}
              </div>
            </div>
          </div>

          <!-- 实时重量显示区域 -->
          <div class="weight-display">
            <div class="weight-circle">
              <div class="weight-label">当前重量</div>
              <div class="weight-value">{{ Math.round(currentWeight) }}</div>
              <div class="weight-unit">g</div>
            </div>
            <div class="weight-status" :class="weightStatusClass">
              {{ weightStatusText }}
              <span
                v-if="errorUpper !== null && errorLower !== null"
                style="color: red; font-size: 12px; margin-left: 10px"
              >
                误差: -{{ errorLower }}g ~ +{{ errorUpper }}g
              </span>
            </div>
          </div>

          <!-- 右侧卡片区域 -->
          <div class="right-cards">
            <div class="info-card code-card">
              <i class="el-icon-postcard card-background-icon"></i>
              <div class="card-label">产品货号</div>
              <div class="card-value">
                {{ productInfo ? productInfo.productCode : '待获取' }}
              </div>
            </div>
            <div class="info-card weight-card">
              <i class="el-icon-odometer card-background-icon"></i>
              <div class="card-label">目标重量</div>
              <div class="card-value">
                {{ productInfo ? productInfo.productWeight + ' g' : '待获取' }}
              </div>
            </div>
          </div>
        </div>

        <!-- 日志显示区域 -->
        <div class="log-container">
          <div class="log-header">系统日志</div>
          <div class="log-content">
            <div v-for="log in runningLogs" :key="log.id" class="log-entry">
              <span class="log-time">{{ formatTime(log.timestamp) }}</span>
              <span class="log-message">{{ log.message }}</span>
              <span class="log-level" :class="getLogLevelClass(log.type)">{{
                getLogLevelText(log.type)
              }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import HttpUtilMes from '@/utils/HttpUtilMes';
import HttpUtil from '@/utils/HttpUtil';
import moment from 'moment';
import { ipcRenderer } from 'electron';
export default {
  name: '',
  components: {},
  props: {},
  data() {
    return {
      // 当前重量
      currentWeight: 0,
      // 允许读码
      allowScan: 0,
      // 读码信息
      scanInfo1: '',
      // 读码信息
      scanInfo2: '',
      // 配置类型
      configType: null,
      // 配置数据
      configData: {},
      // 配置是否加载成功
      configLoaded: false,
      logId: 1000, // 添加一个日志ID计数器
      runningLogs: [], // 运行日志
      alarmLogs: [], // 报警日志
      // 产品信息
      productInfo: null,
      // 当前时间
      currentDateTime: '',
      // 误差上限
      errorUpper: null,
      // 误差下限
      errorLower: null,
      // 时间更新定时器
      timeTimer: null,
      // 测试面板相关
      showTestPanel: false
    };
  },
  watch: {
    // 监听allowScan变化
    allowScan(newVal, oldVal) {
      if (newVal === 1 && oldVal !== 1) {
        this.handleScanTrigger();
      }
    }
  },
  computed: {
    // 重量状态样式类
    weightStatusClass() {
      if (
        !this.productInfo ||
        this.errorUpper === null ||
        this.errorLower === null
      )
        return 'status-normal';
      const diff = Math.abs(
        this.currentWeight - this.productInfo.productWeight
      );
      if (diff <= this.errorLower) {
        return 'status-normal';
      } else if (diff <= this.errorUpper) {
        return 'status-warning';
      } else {
        return 'status-error';
      }
    },
    // 重量状态文本
    weightStatusText() {
      if (
        !this.productInfo ||
        this.errorUpper === null ||
        this.errorLower === null
      )
        return '等待产品信息';
      const diff = Math.abs(
        this.currentWeight - this.productInfo.productWeight
      );
      if (diff <= this.errorLower) {
        return '重量正常';
      } else if (diff <= this.errorUpper) {
        return '重量偏差';
      } else {
        return '重量异常';
      }
    }
  },
  methods: {
    // 加载配置数据
    async loadConfig() {
      try {
        this.configData = await ipcRenderer.invoke('read-config-file');
        if (this.configData) {
          this.configType = this.configData.configType;
          this.configLoaded = true;
          console.log('配置加载成功:', this.configData);
        } else {
          console.warn('配置文件不存在或读取失败');
          this.configLoaded = false;
          // 不设置默认配置，保持原有值
        }
      } catch (error) {
        console.error('配置加载失败:', error);
        this.configLoaded = false;
        // 不设置默认配置，保持原有值
      }
    },
    async getConfig() {
      // 查询配置
      await HttpUtil.get('/cssConfig/getConfig')
        .then((res) => {
          if (res.data) {
            this.errorUpper = res.data.oneOneLength;
            this.errorLower = res.data.twoLength;
          } else {
            this.$message.error('config error! 更新配置错误！');
          }
        })
        .catch((err) => {
          this.$message.error('config error! 更新配置错误！');
        });
    },
    addLog(message, type = 'running') {
      const log = {
        id: this.logId++,
        type,
        message,
        timestamp: new Date().getTime(),
        unread: type === 'alarm'
      };

      if (type === 'running') {
        this.runningLogs.unshift(log);
        // 保持日志数量在合理范围内
        if (this.runningLogs.length > 100) {
          this.runningLogs.pop();
        }
      } else {
        this.alarmLogs.unshift(log);
        if (this.alarmLogs.length > 100) {
          this.alarmLogs.pop();
        }
      }
      // 同时写入本地文件
      const logTypeText = type === 'running' ? '运行日志' : '报警日志';
      const logMessage = `[${logTypeText}] ${message}`;
      ipcRenderer.send('writeLogToLocal', logMessage);
    },

    // 处理读码触发
    async handleScanTrigger() {
      this.addLog('检测到读码信号，开始处理...');

      // 检查两个读码信息是否一致
      if (this.scanInfo1 !== this.scanInfo2) {
        this.addLog(
          `读码不一致 - 码1: ${this.scanInfo1}, 码2: ${this.scanInfo2}`
        );
        return;
      }

      if (!this.scanInfo1 || !this.scanInfo2) {
        this.addLog('读码信息为空，跳过处理');
        return;
      }

      this.addLog(`读码一致: ${this.scanInfo1}`);

      try {
        // 调用MES接口获取产品信息
        const productData = await this.getProductInfo(this.scanInfo1);
        this.productInfo = productData;

        // 比较重量
        const weightDiff = Math.abs(
          this.currentWeight - productData.productWeight
        );
        const isQualified =
          this.errorUpper !== null ? weightDiff <= this.errorUpper : false;

        // 输出日志
        const logMessage = `${productData.productName} ${
          productData.productCode
        } 实际重量：${Math.round(this.currentWeight)}g 目标重量：${
          productData.productWeight
        }g ${isQualified ? '合格' : '不合格'}`;
        this.addLog(logMessage);
      } catch (error) {
        this.addLog(`获取产品信息失败: ${error.message}`);
      }
    },

    // 获取产品信息（Mock数据）
    async getProductInfo(udi) {
      // 模拟API调用延迟
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Mock数据 - 根据UDI返回不同的产品信息
      const mockProducts = {
        default: {
          productName: '一次性使用输液器',
          productCode: '01.01.31.0562',
          productWeight: 1300
        },
        test1: {
          productName: '精密过滤输液器',
          productCode: '01.01.31.0563',
          productWeight: 1500
        },
        test2: {
          productName: '避光输液器',
          productCode: '01.01.31.0564',
          productWeight: 1200
        }
      };

      // 根据UDI选择不同的产品（这里简化处理）
      const productKey = udi.includes('test1')
        ? 'test1'
        : udi.includes('test2')
        ? 'test2'
        : 'default';

      return mockProducts[productKey];
    },

    // 更新时间
    updateDateTime() {
      this.currentDateTime = moment().format('YYYY-MM-DD HH:mm:ss');
    },

    // 格式化时间
    formatTime(timestamp) {
      return moment(timestamp).format('HH:mm:ss');
    },

    // 获取日志级别样式类
    getLogLevelClass(type) {
      const levelClasses = {
        running: 'log-info',
        alarm: 'log-error'
      };
      return levelClasses[type] || 'log-info';
    },

    // 获取日志级别文本
    getLogLevelText(type) {
      const levelTexts = {
        running: '信息',
        alarm: '错误'
      };
      return levelTexts[type] || '信息';
    },

    // 测试面板相关方法
    toggleTestPanel() {
      this.showTestPanel = !this.showTestPanel;
    },

    closeTestPanel() {
      this.showTestPanel = false;
    },

    triggerScan() {
      this.allowScan = 1;
      this.addLog('测试触发读码');
      setTimeout(() => {
        this.allowScan = 0;
        this.addLog('读码信号恢复');
      }, 1000);
    }
  },
  created() {},
  async mounted() {
    // 加载配置
    await this.loadConfig();

    await this.getConfig();

    // 初始化时间显示
    this.updateDateTime();
    this.timeTimer = setInterval(this.updateDateTime, 1000);

    // 监听PLC数据
    // ipcRenderer.on('receivedMsg', (event, values, values2) => {
    //   if (this.configType === 'A') {
    //     // A配置的变量映射
    //     this.currentWeight = Number(values.DBW4); // A称当前重量
    //     this.allowScan = Number(values.DBW8); // A线允许读码
    //     this.scanInfo1 = values.DBB20 ?? ''; // A-1读码信息
    //     this.scanInfo2 = values.DBB50 ?? ''; // A-2读码信息
    //   } else {
    //     // B配置的变量映射
    //     this.currentWeight = Number(values.DBW6); // B称当前重量
    //     this.allowScan = Number(values.DBW10); // B线允许读码
    //     this.scanInfo1 = values.DBB80 ?? ''; // B-1读码信息
    //     this.scanInfo2 = values.DBB110 ?? ''; // B-2读码信息
    //   }
    // });
  },
  beforeDestroy() {
    // 清理定时器
    if (this.timeTimer) {
      clearInterval(this.timeTimer);
    }
  }
};
</script>
<style lang="less" scoped>
.main-page-container {
  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }

  font-family: 'Microsoft YaHei', Arial, sans-serif;
  background: linear-gradient(135deg, #1a3b5c 0%, #2d5a87 100%);
  height: 100%;
  width: 100%;
  overflow: hidden;
  position: relative;

  .config-error-mask {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: rgba(0, 0, 0, 0.7);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 9999;

    .config-error-content {
      background-color: #fff;
      padding: 40px 60px;
      border-radius: 8px;
      text-align: center;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);

      .config-error-icon {
        font-size: 48px;
        color: #f56c6c;
        margin-bottom: 20px;
      }

      .config-error-text {
        font-size: 18px;
        color: #333;
        font-weight: 500;
      }
    }
  }

  .main-content {
    position: relative;
    height: 100%;
    width: 100%;
    display: flex;
    flex-direction: column;
    overflow: hidden;

    .header {
      height: 80px;
      background: linear-gradient(90deg, #4a90e2 0%, #1e3c72 50%, #4a90e2 100%);
      border-radius: 0 0 15px 15px;
      display: flex;
      justify-content: center;
      align-items: center;
      padding: 0 40px;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
      position: relative;
      overflow: hidden;

      &::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: linear-gradient(
          45deg,
          rgba(255, 255, 255, 0.1) 0%,
          transparent 100%
        );
      }

      .header-content {
        text-align: center;
        z-index: 2;
        position: relative;
        flex: 1;
      }

      .header-test-icon {
        position: absolute;
        right: 20px;
        top: 50%;
        transform: translateY(-50%);
        cursor: pointer;
        color: white;
        font-size: 24px;
        z-index: 3;
        padding: 8px;
        border-radius: 4px;
        transition: background-color 0.3s;

        &:hover {
          background-color: rgba(255, 255, 255, 0.2);
        }
      }

      .header-title {
        color: white;
        font-size: 28px;
        font-weight: bold;
        text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.5);
        margin-bottom: 5px;
      }

      .header-time {
        color: rgba(255, 255, 255, 0.9);
        font-size: 18px;
        font-weight: 500;
        text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.3);
      }

      @media (max-width: 768px) {
        flex-direction: column;
        gap: 10px;
        height: auto;
        padding: 15px;
      }
    }

    .test-panel {
      position: absolute;
      top: 80px;
      right: 20px;
      width: 320px;
      background: white;
      border-radius: 8px;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
      z-index: 1000;

      .test-panel-header {
        padding: 12px 16px;
        background: #4a90e2;
        color: white;
        border-radius: 8px 8px 0 0;
        display: flex;
        justify-content: space-between;
        align-items: center;

        .el-icon-close {
          cursor: pointer;
          padding: 4px;
          border-radius: 2px;

          &:hover {
            background-color: rgba(255, 255, 255, 0.2);
          }
        }
      }

      .test-panel-content {
        padding: 16px;

        .test-row {
          display: flex;
          align-items: center;
          margin-bottom: 12px;
          gap: 8px;

          label {
            min-width: 80px;
            font-size: 14px;
          }

          input {
            flex: 1;
            padding: 6px 8px;
            border: 1px solid #ddd;
            border-radius: 4px;
            font-size: 14px;
          }

          button {
            padding: 6px 12px;
            background: #4a90e2;
            color: white;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            font-size: 14px;

            &:hover:not(:disabled) {
              background: #357abd;
            }

            &:disabled {
              background: #ccc;
              cursor: not-allowed;
            }
          }
        }
      }
    }

    .main-container {
      padding: 20px;
      box-sizing: border-box;
      display: flex;
      flex-direction: column;
      height: calc(100% - 80px);
      overflow: hidden;

      .top-section {
        flex-shrink: 0;
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 20px;
        margin-bottom: 20px;

        .left-cards {
          display: flex;
          flex-direction: column;
          gap: 20px;
          flex: 1;

          @media (max-width: 768px) {
            gap: 15px;
          }
        }

        .right-cards {
          display: flex;
          flex-direction: column;
          gap: 20px;
          flex: 1;

          @media (max-width: 768px) {
            gap: 15px;
          }
        }

        .info-card {
          background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
          border-radius: 12px;
          padding: 24px;
          box-shadow: 0 4px 20px rgba(74, 144, 226, 0.15);
          border: 1px solid rgba(74, 144, 226, 0.1);
          position: relative;
          overflow: hidden;
          transition: all 0.3s ease;

          &:hover {
            transform: translateY(-2px);
            box-shadow: 0 8px 30px rgba(74, 144, 226, 0.25);
          }

          &::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            height: 3px;
            background: linear-gradient(
              90deg,
              #4a90e2 0%,
              #357abd 50%,
              #1e3c72 100%
            );
          }

          .card-label {
            color: #64748b;
            font-size: 16px;
            margin-bottom: 12px;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            position: relative;
            z-index: 2;
          }

          .card-value {
            color: #1e293b;
            font-size: 20px;
            font-weight: 700;
            word-break: break-all;
            line-height: 1.3;
            position: relative;
            z-index: 2;
          }

          .card-background-icon {
            position: absolute;
            top: 50%;
            right: 20px;
            transform: translateY(-50%);
            font-size: 48px;
            z-index: 1;
            opacity: 0.5;
          }

          &.udi-card {
            background: linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%);
            border-color: rgba(74, 144, 226, 0.2);
            position: relative;

            &::before {
              background: linear-gradient(90deg, #2196f3 0%, #1976d2 100%);
            }

            &:hover {
              box-shadow: 0 8px 30px rgba(33, 150, 243, 0.3);
            }

            .card-background-icon {
              color: rgba(33, 150, 243, 0.5);
            }
          }

          &.product-card {
            background: linear-gradient(135deg, #e8f5e8 0%, #c8e6c9 100%);
            border-color: rgba(76, 175, 80, 0.2);
            position: relative;

            &::before {
              background: linear-gradient(90deg, #4caf50 0%, #388e3c 100%);
            }

            &:hover {
              box-shadow: 0 8px 30px rgba(76, 175, 80, 0.3);
            }

            .card-background-icon {
              color: rgba(76, 175, 80, 0.5);
            }
          }

          &.code-card {
            background: linear-gradient(135deg, #f3e5f5 0%, #e1bee7 100%);
            border-color: rgba(156, 39, 176, 0.2);
            position: relative;

            &::before {
              background: linear-gradient(90deg, #9c27b0 0%, #7b1fa2 100%);
            }

            &:hover {
              box-shadow: 0 8px 30px rgba(156, 39, 176, 0.3);
            }

            .card-background-icon {
              color: rgba(156, 39, 176, 0.5);
            }
          }

          &.weight-card {
            background: linear-gradient(135deg, #fff3e0 0%, #ffcc80 100%);
            border-color: rgba(255, 152, 0, 0.2);
            position: relative;

            &::before {
              background: linear-gradient(90deg, #ff9800 0%, #f57c00 100%);
            }

            &:hover {
              box-shadow: 0 8px 30px rgba(255, 152, 0, 0.3);
            }

            .card-background-icon {
              color: rgba(255, 152, 0, 0.5);
            }
          }
        }

        .weight-display {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 20px;
          flex-shrink: 0;
          width: 350px;

          .weight-circle {
            width: 280px;
            height: 280px;
            border-radius: 50%;
            background: linear-gradient(
              135deg,
              rgba(255, 255, 255, 0.95) 0%,
              rgba(255, 255, 255, 0.85) 100%
            );
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.2),
              inset 0 1px 0 rgba(255, 255, 255, 0.8),
              inset 0 -1px 0 rgba(0, 0, 0, 0.1);
            border: 8px solid rgba(74, 144, 226, 0.3);
            position: relative;
            overflow: hidden;

            .weight-label {
              color: #666;
              font-size: 16px;
              margin-bottom: 10px;
              z-index: 2;
            }

            .weight-value {
              color: #2c3e50;
              font-size: 48px;
              font-weight: bold;
              z-index: 2;
              text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.1);
            }

            .weight-unit {
              color: #7f8c8d;
              font-size: 20px;
              z-index: 2;
              margin-top: 5px;
            }

            @media (max-width: 1200px) {
              width: 250px;
              height: 250px;
            }

            @media (max-width: 768px) {
              width: 200px;
              height: 200px;
            }
          }

          .weight-status {
            margin-top: 20px;
            padding: 12px 30px;
            border-radius: 25px;
            font-weight: bold;
            font-size: 16px;
            width: 290px;

            &.status-normal {
              background: linear-gradient(135deg, #27ae60, #2ecc71);
              color: white;
              box-shadow: 0 4px 15px rgba(39, 174, 96, 0.3);
            }

            &.status-warning {
              background: linear-gradient(135deg, #f39c12, #e67e22);
              color: white;
              box-shadow: 0 4px 15px rgba(243, 156, 18, 0.3);
            }

            &.status-error {
              background: linear-gradient(135deg, #e74c3c, #c0392b);
              color: white;
              box-shadow: 0 4px 15px rgba(231, 76, 60, 0.3);
            }
          }

          @media (max-width: 768px) {
            width: 100%;
            margin: 15px 0;
          }
        }

        @media (max-width: 768px) {
          flex-direction: column;
          gap: 15px;
        }
      }

      .log-container {
        flex: 1;
        background: rgba(255, 255, 255, 0.95);
        border-radius: 10px;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
        backdrop-filter: blur(10px);
        border: 1px solid rgba(255, 255, 255, 0.2);
        overflow: hidden;
        display: flex;
        flex-direction: column;
        min-height: 0;

        .log-header {
          padding: 15px 25px;
          background: linear-gradient(90deg, #4a90e2, #357abd);
          color: white;
          font-weight: bold;
          font-size: 16px;
        }

        .log-content {
          flex: 1;
          overflow-y: auto;
          padding: 15px;
          min-height: 0;

          &::-webkit-scrollbar {
            width: 8px;
          }

          &::-webkit-scrollbar-track {
            background: rgba(0, 0, 0, 0.1);
            border-radius: 4px;
          }

          &::-webkit-scrollbar-thumb {
            background: rgba(74, 144, 226, 0.5);
            border-radius: 4px;

            &:hover {
              background: rgba(74, 144, 226, 0.7);
            }
          }

          .log-entry {
            display: flex;
            justify-content: space-between;
            padding: 8px 0;
            border-bottom: 1px solid rgba(0, 0, 0, 0.1);
            font-size: 14px;

            &:last-child {
              border-bottom: none;
            }

            .log-time {
              color: #666;
              min-width: 120px;
            }

            .log-message {
              flex: 1;
              color: #2c3e50;
            }

            .log-level {
              min-width: 60px;
              text-align: center;
              padding: 2px 8px;
              border-radius: 12px;
              font-size: 12px;
              font-weight: bold;

              &.log-info {
                background: rgba(74, 144, 226, 0.2);
                color: #4a90e2;
              }

              &.log-success {
                background: rgba(39, 174, 96, 0.2);
                color: #27ae60;
              }

              &.log-warning {
                background: rgba(243, 156, 18, 0.2);
                color: #f39c12;
              }

              &.log-error {
                background: rgba(231, 76, 60, 0.2);
                color: #e74c3c;
              }
            }
          }
        }

        @media (max-width: 768px) {
          margin-top: 0;
        }
      }

      @media (max-width: 1200px) {
        padding: 15px;

        .top-section {
          gap: 15px;

          .weight-display {
            width: 300px;
          }
        }
      }

      @media (max-width: 768px) {
        padding: 15px 15px 0 15px;
      }
    }
  }

  .connection-status {
    @media (max-width: 768px) {
      position: static;
      margin: 10px auto;
      width: fit-content;
    }
  }
}
</style>
