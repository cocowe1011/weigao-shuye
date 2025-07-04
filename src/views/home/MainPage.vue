<template>
  <div class="smart-workshop">
    <!-- 内容区包装器 -->
    <div class="content-wrapper">
      <!-- 左侧面板 -->
      <div class="side-info-panel">
        <!-- PLC状态与订单信息区域 -->
        <div class="plc-info-section">
          <div class="section-header">当前扫码托盘信息</div>
          <div class="scrollable-content" style="margin-top: 5px">
            <div class="status-overview">
              <div class="data-card">
                <div class="data-card-border">
                  <div class="data-card-border-borderTop granient-text">
                    订单id
                  </div>
                  <div
                    class="data-card-border-borderDown"
                    style="font-size: 1.3vw"
                  >
                    {{ nowScanTrayInfo.orderId || '--' }}
                  </div>
                </div>
              </div>
              <div class="data-card">
                <div class="data-card-border">
                  <div class="data-card-border-borderTop">产品名称</div>
                  <div class="data-card-border-borderDown">
                    {{ nowScanTrayInfo.productName || '--' }}
                  </div>
                </div>
              </div>
              <div class="data-card">
                <div class="data-card-border">
                  <div class="data-card-border-borderTop">当前进货口</div>
                  <div class="data-card-border-borderDown">
                    {{ nowScanTrayInfo.inPut || '--' }}
                  </div>
                </div>
              </div>
              <div class="data-card">
                <div class="data-card-border">
                  <div class="data-card-border-borderTop">是否消毒</div>
                  <div class="data-card-border-borderDown">
                    {{ nowScanTrayInfo.isTerile || '--' }}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 操作区 -->
        <div class="operation-panel">
          <div class="section-header">
            <span>操作区</span>
            <el-button
              type="primary"
              size="mini"
              icon="el-icon-search"
              @click="showOrderQueryDialog"
            >
              查询订单
            </el-button>
          </div>
          <div class="operation-buttons">
            <button
              @click="toggleButtonState('start')"
              :class="{ pressed: buttonStates.start }"
            >
              <i class="el-icon-switch-button"></i><span>全线启动</span>
            </button>
            <button
              @click="toggleButtonState('stop')"
              :class="{ pressed: buttonStates.stop }"
            >
              <i class="el-icon-error"></i><span>全线停止</span>
            </button>
            <button
              @click="toggleButtonState('reset')"
              :class="{ pressed: buttonStates.reset }"
            >
              <i class="el-icon-video-pause"></i><span>全线暂停</span>
            </button>
            <button @click="toggleButtonState('fault_reset')">
              <i class="el-icon-refresh"></i><span>故障复位</span>
            </button>
            <button @click="toggleButtonState('clear')">
              <i class="el-icon-delete"></i><span>全线清空</span>
            </button>
          </div>
        </div>

        <!-- 日志区域 -->
        <div class="log-section">
          <div class="section-header">
            日志区
            <div class="log-tabs">
              <div
                class="log-tab"
                :class="{ active: activeLogType === 'running' }"
                @click="activeLogType = 'running'"
              >
                运行日志
              </div>
              <div
                class="log-tab"
                :class="{ active: activeLogType === 'alarm' }"
                @click="activeLogType = 'alarm'"
              >
                报警日志
                <div v-if="unreadAlarms > 0" class="alarm-badge">
                  {{ unreadAlarms }}
                </div>
              </div>
            </div>
          </div>
          <div class="scrollable-content">
            <div class="log-list">
              <template v-if="currentLogs.length > 0">
                <div
                  v-for="log in currentLogs"
                  :key="log.id"
                  :class="[
                    'log-item',
                    { alarm: log.type === 'alarm', unread: log.unread }
                  ]"
                  @click="markAsRead(log)"
                >
                  <div class="log-time">{{ formatTime(log.timestamp) }}</div>
                  <div class="log-item-content">{{ log.message }}</div>
                </div>
              </template>
              <div v-else class="empty-state">
                <i class="el-icon-chat-line-square"></i>
                <p>
                  {{
                    activeLogType === 'running'
                      ? '暂无运行日志'
                      : '暂无报警日志'
                  }}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
      <!-- 右侧内容区域 -->
      <div class="main-content">
        <div class="floor-container">
          <!-- 左侧区域 -->
          <div class="floor-left">
            <div class="floor-title">
              <i class="el-icon-office-building"></i> 一楼区域
            </div>
            <div class="floor-image-container">
              <div class="image-wrapper">
                <img
                  src="@/assets/changzhou-img/image.png"
                  alt="一楼平面图"
                  class="floor-image"
                  @load="updateMarkerPositions"
                />
                <!-- 修改队列标识 -->
                <div
                  v-for="marker in queueMarkers"
                  :key="marker.id"
                  class="queue-marker"
                  :data-x="marker.x"
                  :data-y="marker.y"
                  @click="handleQueueMarkerClick(marker.queueId)"
                >
                  <div class="queue-marker-content">
                    <span class="queue-marker-count" v-if="marker.id === 1">{{
                      queues.find((q) => q.id === marker.queueId)?.trayInfo
                        ?.length || 0
                    }}</span>
                    <span class="queue-marker-count" v-if="marker.id === 2">{{
                      queues.find((q) => q.id === marker.queueId)?.trayInfo
                        ?.length || 0
                    }}</span>
                    <span class="queue-marker-count" v-if="marker.id === 3">{{
                      bufferQuantity
                    }}</span>
                    <span class="queue-marker-count" v-if="marker.id === 4">{{
                      aLineQuantity.a1
                    }}</span>
                    <span class="queue-marker-count" v-if="marker.id === 5">{{
                      bLineQuantity.b1
                    }}</span>
                    <span class="queue-marker-count" v-if="marker.id === 6">{{
                      cLineQuantity.c1
                    }}</span>
                    <span class="queue-marker-count" v-if="marker.id === 7">{{
                      aLineQuantity.a2
                    }}</span>
                    <span class="queue-marker-count" v-if="marker.id === 8">{{
                      bLineQuantity.b2
                    }}</span>
                    <span class="queue-marker-count" v-if="marker.id === 9">{{
                      cLineQuantity.c2
                    }}</span>
                    <span class="queue-marker-count" v-if="marker.id === 10">{{
                      aLineQuantity.a3
                    }}</span>
                    <span class="queue-marker-count" v-if="marker.id === 11">{{
                      bLineQuantity.b3
                    }}</span>
                    <span class="queue-marker-count" v-if="marker.id === 12">{{
                      cLineQuantity.c3
                    }}</span>
                    <span class="queue-marker-count" v-if="marker.id === 13">{{
                      dLineQuantity
                    }}</span>
                    <span class="queue-marker-count" v-if="marker.id === 14">{{
                      eLineQuantity
                    }}</span>
                    <span class="queue-marker-count" v-if="marker.id === 15">{{
                      nonSterileunload
                    }}</span>
                    <span class="queue-marker-name">{{ marker.name }}</span>
                  </div>
                </div>
                <div
                  class="preheating-room-marker"
                  data-x="610"
                  data-y="1155"
                  v-show="showCar1SetPreheatingRoom"
                >
                  <div class="preheating-room-content">
                    <div class="preheating-room-header">预热房选择</div>
                    <div class="preheating-room-body">
                      <el-select
                        v-model="preheatingRoomSelected"
                        placeholder="选择"
                        size="mini"
                      >
                        <el-option label="A" value="A"></el-option>
                        <el-option label="B" value="B"></el-option>
                        <el-option label="C" value="C"></el-option>
                      </el-select>
                      <el-button
                        type="primary"
                        size="mini"
                        @click="sendToPreheatingRoom"
                        >执行</el-button
                      >
                      <span
                        style="font-size: 12px; color: greenyellow"
                        v-if="preWarmTrayCode"
                        >执行中：{{ preWarmTrayCode }}</span
                      >
                    </div>
                  </div>
                </div>
                <div
                  class="preheating-room-marker"
                  data-x="865"
                  data-y="380"
                  style="width: 160px"
                >
                  <div class="preheating-room-content">
                    <div class="preheating-room-header">预热房到灭菌柜选择</div>
                    <div class="preheating-room-body">
                      <div style="display: flex; align-items: center">
                        <el-select
                          v-model="disinfectionRoomSelectedFrom"
                          placeholder="预热"
                          size="mini"
                        >
                          <el-option label="A" value="A"></el-option>
                          <el-option label="B" value="B"></el-option>
                          <el-option label="C" value="C"></el-option>
                        </el-select>
                        <span
                          style="font-size: 12px; color: #fff; margin-left: 5px"
                          >到：</span
                        >
                        <el-select
                          v-model="disinfectionRoomSelectedTo"
                          placeholder="灭菌"
                          size="mini"
                        >
                          <el-option label="A" value="A"></el-option>
                          <el-option label="B" value="B"></el-option>
                          <el-option label="C" value="C"></el-option>
                        </el-select>
                      </div>
                      <el-button
                        type="primary"
                        size="mini"
                        @click="sendToDisinfectionRoom"
                        style="width: 100%"
                        >执行</el-button
                      >
                      <div style="display: flex; align-items: center">
                        <span
                          style="
                            font-size: 12px;
                            color: #fff;
                            color: greenyellow;
                          "
                          v-if="disinfectionTrayCode"
                          >执行中：{{ disinfectionTrayCode }}</span
                        >
                      </div>
                    </div>
                  </div>
                </div>
                <div
                  class="preheating-room-marker"
                  data-x="1215"
                  data-y="380"
                  style="width: 160px"
                >
                  <div class="preheating-room-content">
                    <div class="preheating-room-header">灭菌柜到解析房选择</div>
                    <div class="preheating-room-body">
                      <div style="display: flex; align-items: center">
                        <el-select
                          v-model="warehouseSelectedFrom"
                          placeholder="灭菌"
                          size="mini"
                        >
                          <el-option label="A" value="A"></el-option>
                          <el-option label="B" value="B"></el-option>
                          <el-option label="C" value="C"></el-option>
                        </el-select>
                        <span
                          style="font-size: 12px; color: #fff; margin-left: 5px"
                          >到：</span
                        >
                        <el-select
                          v-model="warehouseSelectedTo"
                          placeholder="解析"
                          size="mini"
                        >
                          <el-option label="A" value="A"></el-option>
                          <el-option label="B" value="B"></el-option>
                          <el-option label="C" value="C"></el-option>
                        </el-select>
                      </div>
                      <el-button
                        type="primary"
                        size="mini"
                        @click="sendDisinfectionRoomToWarehouse"
                        style="width: 100%"
                        >执行</el-button
                      >
                      <div style="display: flex; align-items: center">
                        <span
                          style="
                            font-size: 12px;
                            color: #fff;
                            color: greenyellow;
                          "
                          v-if="analysisTrayCode"
                          >执行中：{{ analysisTrayCode }}</span
                        >
                      </div>
                    </div>
                  </div>
                </div>
                <div class="preheating-room-marker" data-x="2620" data-y="750">
                  <div class="preheating-room-content">
                    <div class="preheating-room-header">出库选择</div>
                    <div class="preheating-room-body">
                      <el-select
                        v-model="outWarehouseSelected"
                        placeholder="选择"
                        size="mini"
                      >
                        <el-option label="A" value="A"></el-option>
                        <el-option label="B" value="B"></el-option>
                        <el-option label="C" value="C"></el-option>
                        <el-option label="D" value="D"></el-option>
                        <el-option label="E" value="E"></el-option>
                        <el-option label="DE" value="DE"></el-option>
                      </el-select>
                      <el-button
                        type="primary"
                        size="mini"
                        @click="sendToWarehouse"
                        >执行</el-button
                      >
                      <span
                        style="font-size: 12px; color: #fff; color: greenyellow"
                        v-if="outWarehouseTrayCode"
                        >执行中：{{ outWarehouseTrayCode }}</span
                      >
                    </div>
                  </div>
                </div>
                <div class="marker-with-button" data-x="1470" data-y="1228">
                  <el-button
                    type="primary"
                    class="warehouse-btn"
                    @click="showCarSelect"
                    >入库</el-button
                  >
                </div>
                <!-- 修改小车元素 -->
                <div
                  v-for="cart in carts"
                  :key="cart.name"
                  class="cart-container"
                  :data-x="cart.x"
                  :data-y="cart.y"
                  :data-width="cart.width"
                >
                  <img :src="cart.image" :alt="cart.name" class="cart-image" />
                </div>
                <!-- 上货扫码区域提示 -->
                <div class="marker-with-panel" data-x="480" data-y="1590">
                  <div
                    class="data-panel"
                    :class="['position-top', { 'always-show': true }]"
                  >
                    <div class="data-panel-content">
                      <div class="data-panel-row">
                        <span class="data-panel-label">一楼扫码信息：</span>
                        <span>{{ elevatorOneFloorScanCode || '--' }}</span>
                      </div>
                      <div class="data-panel-row checkbox-group">
                        <el-checkbox
                          v-model="allowUploadOne"
                          @change="handleAllowUpload('1')"
                          >允许上货</el-checkbox
                        >
                        <el-checkbox v-model="nonSterileOne"
                          >非灭菌</el-checkbox
                        >
                      </div>
                    </div>
                  </div>
                </div>
                <!-- 无码上货按钮 -->
                <div class="marker-with-button" data-x="200" data-y="1650">
                  <el-button
                    :type="noCodeUpload ? 'success' : 'primary'"
                    size="mini"
                    @click="toggleNoCodeUpload"
                    :icon="noCodeUpload ? 'el-icon-loading' : 'el-icon-setting'"
                  >
                    {{
                      noCodeUpload
                        ? '正在使用无码上货模式'
                        : '设置为无码上货模式'
                    }}
                  </el-button>
                </div>
                <!-- 下货信息展示 -->
                <div class="marker-with-panel" data-x="2750" data-y="130">
                  <div
                    class="data-panel"
                    :class="['position-left', { 'always-show': true }]"
                  >
                    <div class="data-panel-header">下货信息</div>
                    <div class="data-panel-content">
                      <div class="data-panel-row">
                        <span class="data-panel-label">产品名称：</span>
                        <span>{{
                          currentOutTrayInfo.productName
                            ? currentOutTrayInfo.productName
                            : '--'
                        }}</span>
                      </div>
                      <div class="data-panel-row">
                        <span class="data-panel-label">托盘号：</span>
                        <span>{{
                          currentOutTrayInfo.trayCode
                            ? currentOutTrayInfo.trayCode
                            : '--'
                        }}</span>
                      </div>
                      <div class="data-panel-row">
                        <span class="data-panel-label">是否灭菌：</span>
                        <span>{{
                          currentOutTrayInfo.trayCode
                            ? currentOutTrayInfo.isTerile === 1
                              ? '灭菌'
                              : '非灭菌'
                            : '--'
                        }}</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div class="marker-with-panel" data-x="480" data-y="920">
                  <div
                    class="data-panel"
                    :class="['position-top', { 'always-show': true }]"
                  >
                    <div class="data-panel-content">
                      <div class="data-panel-row">
                        <span class="data-panel-label">二楼扫码信息：</span>
                        <span>{{ elevatorTwoFloorScanCode || '--' }}</span>
                      </div>
                      <div class="data-panel-row checkbox-group">
                        <el-checkbox
                          v-model="allowUploadTwo"
                          @change="handleAllowUpload('2')"
                          >允许上货</el-checkbox
                        >
                        <el-checkbox v-model="nonSterileTwo"
                          >非灭菌</el-checkbox
                        >
                      </div>
                    </div>
                  </div>
                </div>
                <div class="marker-with-panel" data-x="480" data-y="535">
                  <div
                    class="data-panel"
                    :class="['position-top', { 'always-show': true }]"
                  >
                    <div class="data-panel-content">
                      <div class="data-panel-row">
                        <span class="data-panel-label">三楼扫码信息：</span>
                        <span>{{ elevatorThreeFloorScanCode || '--' }}</span>
                      </div>
                      <div class="data-panel-row checkbox-group">
                        <el-checkbox
                          v-model="allowUploadThree"
                          @change="handleAllowUpload('3')"
                          >允许上货</el-checkbox
                        >
                        <el-checkbox v-model="nonSterileThree"
                          >非灭菌</el-checkbox
                        >
                      </div>
                    </div>
                  </div>
                </div>
                <div class="marker-with-panel" data-x="480" data-y="200">
                  <div
                    class="data-panel"
                    :class="['position-top', { 'always-show': true }]"
                  >
                    <div class="data-panel-content">
                      <div class="data-panel-row">
                        <span class="data-panel-label">四楼扫码信息：</span>
                        <span>{{ elevatorFourFloorScanCode || '--' }}</span>
                      </div>
                      <div class="data-panel-row checkbox-group">
                        <el-checkbox
                          v-model="allowUploadFour"
                          @change="handleAllowUpload('4')"
                          >允许上货</el-checkbox
                        >
                        <el-checkbox v-model="nonSterileFour"
                          >非灭菌</el-checkbox
                        >
                      </div>
                    </div>
                  </div>
                </div>
                <div class="marker-with-panel" data-x="1560" data-y="600">
                  <div
                    class="data-panel"
                    :class="['position-top', { 'always-show': true }]"
                    style="width: 140px; padding-left: 8px; padding-right: 8px"
                  >
                    <div class="data-panel-content">
                      <div class="data-panel-row">
                        <span class="data-panel-label">D扫码：</span>
                        <span>{{ elevatorDDisinfectionScanCode || '--' }}</span>
                      </div>
                      <div class="data-panel-row checkbox-group">
                        <el-checkbox
                          v-model="allowUploadD"
                          @change="handleAllowUpload('D')"
                          >允许上货</el-checkbox
                        >
                        <el-checkbox v-model="nonSterileD">非灭菌</el-checkbox>
                      </div>
                    </div>
                  </div>
                </div>
                <div class="marker-with-panel" data-x="1560" data-y="450">
                  <div
                    class="data-panel"
                    :class="['position-top', { 'always-show': true }]"
                    style="width: 140px; padding-left: 8px; padding-right: 8px"
                  >
                    <div class="data-panel-content">
                      <div class="data-panel-row">
                        <span class="data-panel-label">E扫码：</span>
                        <span>{{ elevatorEDisinfectionScanCode || '--' }}</span>
                      </div>
                      <div class="data-panel-row checkbox-group">
                        <el-checkbox
                          v-model="allowUploadE"
                          @change="handleAllowUpload('E')"
                          >允许上货</el-checkbox
                        >
                        <el-checkbox v-model="nonSterileE">非灭菌</el-checkbox>
                      </div>
                    </div>
                  </div>
                </div>
                <div class="marker-with-panel" data-x="2200" data-y="1620">
                  <div
                    class="data-panel"
                    :class="['position-top', { 'always-show': true }]"
                  >
                    <div class="data-panel-content">
                      <div class="data-panel-row">
                        <span class="data-panel-label">缓冲区扫码：</span>
                        <span>{{ oneFloorElevatorScanCode || '--' }}</span>
                      </div>
                    </div>
                  </div>
                </div>
                <!-- 光电集合，光电标签默认在下方，可以控制标签位置：label-top、label-left、label-right -->
                <!-- 上货区输送线光电信号 -->
                <div
                  class="marker"
                  :class="{ scanning: upLoadPhotoelectricSignal.bit0 === '1' }"
                  data-x="640"
                  data-y="1380"
                  @click="toggleBitValue(upLoadPhotoelectricSignal, 'bit0')"
                >
                  <div class="marker-label">S-1#</div>
                </div>
                <div
                  class="marker"
                  :class="{ scanning: upLoadPhotoelectricSignal.bit1 === '1' }"
                  data-x="1440"
                  data-y="1380"
                  @click="toggleBitValue(upLoadPhotoelectricSignal, 'bit1')"
                >
                  <div class="marker-label">S-2#</div>
                </div>
                <div
                  class="marker label-left"
                  :class="{ scanning: upLoadPhotoelectricSignal.bit3 === '1' }"
                  data-x="2190"
                  data-y="1380"
                  @click="toggleBitValue(upLoadPhotoelectricSignal, 'bit3')"
                >
                  <div class="marker-label">S-4#</div>
                </div>
                <div
                  class="marker label-right"
                  :class="{ scanning: upLoadPhotoelectricSignal.bit5 === '1' }"
                  data-x="2475"
                  data-y="1340"
                  @click="toggleBitValue(upLoadPhotoelectricSignal, 'bit5')"
                >
                  <div class="marker-label">S-6#</div>
                </div>
                <div
                  class="marker label-top"
                  :class="{ scanning: upLoadPhotoelectricSignal.bit6 === '1' }"
                  data-x="2440"
                  data-y="1180"
                  @click="toggleBitValue(upLoadPhotoelectricSignal, 'bit6')"
                >
                  <div class="marker-label">S-7#</div>
                </div>
                <div
                  class="marker label-top"
                  :class="{ scanning: upLoadPhotoelectricSignal.bit7 === '1' }"
                  data-x="2290"
                  data-y="1180"
                  @click="toggleBitValue(upLoadPhotoelectricSignal, 'bit7')"
                >
                  <div class="marker-label">S-8#</div>
                </div>
                <div
                  class="marker label-right"
                  :class="{ scanning: upLoadPhotoelectricSignal.bit8 === '1' }"
                  data-x="2480"
                  data-y="1180"
                  @click="toggleBitValue(upLoadPhotoelectricSignal, 'bit8')"
                >
                  <div class="marker-label">S-9#</div>
                </div>
                <div
                  class="marker"
                  :class="{ scanning: upLoadPhotoelectricSignal.bit9 === '1' }"
                  data-x="1570"
                  data-y="1266"
                  @click="toggleBitValue(upLoadPhotoelectricSignal, 'bit9')"
                >
                  <div class="marker-label">S-10#</div>
                </div>
                <div
                  class="marker"
                  :class="{ scanning: upLoadPhotoelectricSignal.bit10 === '1' }"
                  data-x="860"
                  data-y="1266"
                  @click="toggleBitValue(upLoadPhotoelectricSignal, 'bit10')"
                >
                  <div class="marker-label">S-11#</div>
                </div>
                <!-- 电机点位示例，可以控制标签位置：label-top、label-left、label-right -->
                <!-- 上货区电机运行信号（扫码后入队） -->
                <div
                  class="motor-marker marker-show-label"
                  :class="{ running: upLoadMotorRunning.bit0 === '1' }"
                  data-x="1080"
                  data-y="1390"
                  @click="toggleBitValue(upLoadMotorRunning, 'bit0')"
                >
                  <div class="marker-label">S1#</div>
                </div>
                <div
                  class="motor-marker marker-show-label"
                  :class="{ running: upLoadMotorRunning.bit1 === '1' }"
                  data-x="1910"
                  data-y="1390"
                  @click="toggleBitValue(upLoadMotorRunning, 'bit1')"
                >
                  <div class="marker-label">S2#</div>
                </div>
                <div
                  class="motor-marker marker-show-label"
                  :class="{ running: upLoadMotorRunning.bit2 === '1' }"
                  data-x="2300"
                  data-y="1390"
                  @click="toggleBitValue(upLoadMotorRunning, 'bit2')"
                >
                  <div class="marker-label">S3#</div>
                </div>
                <div
                  class="motor-marker marker-show-label"
                  :class="{ running: upLoadMotorRunning.bit3 === '1' }"
                  data-x="2385"
                  data-y="1390"
                  @click="toggleBitValue(upLoadMotorRunning, 'bit3')"
                >
                  <div class="marker-label">S4#</div>
                </div>
                <div
                  class="motor-marker marker-show-label"
                  :class="{ running: upLoadMotorRunning.bit4 === '1' }"
                  data-x="2470"
                  data-y="1390"
                  @click="toggleBitValue(upLoadMotorRunning, 'bit4')"
                >
                  <div class="marker-label">S5#</div>
                </div>
                <div
                  class="motor-marker marker-show-label label-left"
                  :class="{ running: upLoadMotorRunning.bit5 === '1' }"
                  data-x="2330"
                  data-y="1287"
                  @click="toggleBitValue(upLoadMotorRunning, 'bit5')"
                >
                  <div class="marker-label">S6#</div>
                </div>
                <div
                  class="motor-marker marker-show-label label-top"
                  :class="{ running: upLoadMotorRunning.bit6 === '1' }"
                  data-x="2385"
                  data-y="1210"
                  @click="toggleBitValue(upLoadMotorRunning, 'bit6')"
                >
                  <div class="marker-label">S7#</div>
                </div>
                <div
                  class="motor-marker marker-show-label label-right"
                  :class="{ running: upLoadMotorRunning.bit7 === '1' }"
                  data-x="2460"
                  data-y="1230"
                  @click="toggleBitValue(upLoadMotorRunning, 'bit7')"
                >
                  <div class="marker-label">S8#</div>
                </div>
                <div
                  class="motor-marker marker-show-label label-left"
                  :class="{ running: upLoadMotorRunning.bit8 === '1' }"
                  data-x="2260"
                  data-y="1230"
                  @click="toggleBitValue(upLoadMotorRunning, 'bit8')"
                >
                  <div class="marker-label">S9#</div>
                </div>
                <div
                  class="motor-marker marker-show-label"
                  :class="{ running: upLoadMotorRunning.bit9 === '1' }"
                  data-x="1910"
                  data-y="1220"
                  @click="toggleBitValue(upLoadMotorRunning, 'bit9')"
                >
                  <div class="marker-label">S10#</div>
                </div>
                <div
                  class="motor-marker marker-show-label"
                  :class="{ running: upLoadMotorRunning.bit10 === '1' }"
                  data-x="1130"
                  data-y="1220"
                  @click="toggleBitValue(upLoadMotorRunning, 'bit10')"
                >
                  <div class="marker-label">S11#</div>
                </div>
                <!-- A线电机运行信号 -->
                <div
                  class="motor-marker marker-show-label label-right"
                  :class="{ running: aLineMotorRunning.bit0 === '1' }"
                  data-x="1150"
                  data-y="1098"
                  @click="toggleBitValue(aLineMotorRunning, 'bit0')"
                >
                  <div class="marker-label">A1-1#</div>
                </div>
                <div
                  class="motor-marker marker-show-label label-right"
                  :class="{ running: aLineMotorRunning.bit1 === '1' }"
                  data-x="1150"
                  data-y="1030"
                  @click="toggleBitValue(aLineMotorRunning, 'bit1')"
                >
                  <div class="marker-label">A1-2#</div>
                </div>
                <div
                  class="motor-marker marker-show-label label-left"
                  :class="{ running: aLineMotorRunning.bit2 === '1' }"
                  data-x="1820"
                  data-y="1098"
                  @click="toggleBitValue(aLineMotorRunning, 'bit2')"
                >
                  <div class="marker-label">A2-1#</div>
                </div>
                <div
                  class="motor-marker marker-show-label label-left"
                  :class="{ running: aLineMotorRunning.bit3 === '1' }"
                  data-x="1820"
                  data-y="1030"
                  @click="toggleBitValue(aLineMotorRunning, 'bit3')"
                >
                  <div class="marker-label">A2-2#</div>
                </div>
                <div
                  class="motor-marker marker-show-label label-right"
                  :class="{ running: aLineMotorRunning.bit4 === '1' }"
                  data-x="2320"
                  data-y="1090"
                  @click="toggleBitValue(aLineMotorRunning, 'bit4')"
                >
                  <div class="marker-label">A3-1#</div>
                </div>
                <div
                  class="motor-marker marker-show-label label-right"
                  :class="{ running: aLineMotorRunning.bit5 === '1' }"
                  data-x="2320"
                  data-y="1025"
                  @click="toggleBitValue(aLineMotorRunning, 'bit5')"
                >
                  <div class="marker-label">A3-2#</div>
                </div>
                <!-- A线光电检测信号 -->
                <div
                  class="marker label-right"
                  :class="{ scanning: aLinePhotoelectricSignal.bit0 === '1' }"
                  data-x="840"
                  data-y="1120"
                  @click="toggleBitValue(aLinePhotoelectricSignal, 'bit0')"
                >
                  <div class="marker-label">A-1#</div>
                </div>
                <div
                  class="marker label-right"
                  :class="{ scanning: aLinePhotoelectricSignal.bit1 === '1' }"
                  data-x="840"
                  data-y="1010"
                  @click="toggleBitValue(aLinePhotoelectricSignal, 'bit1')"
                >
                  <div class="marker-label">A-2#</div>
                </div>
                <div
                  class="marker label-right"
                  :class="{ scanning: aLinePhotoelectricSignal.bit2 === '1' }"
                  data-x="1320"
                  data-y="1120"
                  @click="toggleBitValue(aLinePhotoelectricSignal, 'bit2')"
                >
                  <div class="marker-label">A-3#</div>
                </div>
                <div
                  class="marker label-right"
                  :class="{ scanning: aLinePhotoelectricSignal.bit3 === '1' }"
                  data-x="1320"
                  data-y="1010"
                  @click="toggleBitValue(aLinePhotoelectricSignal, 'bit3')"
                >
                  <div class="marker-label">A-4#</div>
                </div>
                <div
                  class="marker label-right"
                  :class="{ scanning: aLinePhotoelectricSignal.bit4 === '1' }"
                  data-x="1435"
                  data-y="1120"
                  @click="toggleBitValue(aLinePhotoelectricSignal, 'bit4')"
                >
                  <div class="marker-label">A-5#</div>
                </div>
                <div
                  class="marker label-right"
                  :class="{ scanning: aLinePhotoelectricSignal.bit5 === '1' }"
                  data-x="1435"
                  data-y="1010"
                  @click="toggleBitValue(aLinePhotoelectricSignal, 'bit5')"
                >
                  <div class="marker-label">A-6#</div>
                </div>
                <div
                  class="marker label-right"
                  :class="{ scanning: aLinePhotoelectricSignal.bit6 === '1' }"
                  data-x="2020"
                  data-y="1120"
                  @click="toggleBitValue(aLinePhotoelectricSignal, 'bit6')"
                >
                  <div class="marker-label">A-7#</div>
                </div>
                <div
                  class="marker label-right"
                  :class="{ scanning: aLinePhotoelectricSignal.bit7 === '1' }"
                  data-x="2020"
                  data-y="1010"
                  @click="toggleBitValue(aLinePhotoelectricSignal, 'bit7')"
                >
                  <div class="marker-label">A-8#</div>
                </div>
                <div
                  class="marker label-bottom"
                  :class="{ scanning: aLinePhotoelectricSignal.bit8 === '1' }"
                  data-x="2470"
                  data-y="1120"
                  @click="toggleBitValue(aLinePhotoelectricSignal, 'bit8')"
                >
                  <div class="marker-label">A-9#</div>
                </div>
                <div
                  class="marker label-top"
                  :class="{ scanning: aLinePhotoelectricSignal.bit9 === '1' }"
                  data-x="2470"
                  data-y="1010"
                  @click="toggleBitValue(aLinePhotoelectricSignal, 'bit9')"
                >
                  <div class="marker-label">A-10#</div>
                </div>
                <!-- B线电机运行信号 -->
                <div
                  class="motor-marker marker-show-label label-right"
                  :class="{ running: bLineMotorRunning.bit0 === '1' }"
                  data-x="1150"
                  data-y="880"
                  @click="toggleBitValue(bLineMotorRunning, 'bit0')"
                >
                  <div class="marker-label">B1-1#</div>
                </div>
                <div
                  class="motor-marker marker-show-label label-right"
                  :class="{ running: bLineMotorRunning.bit1 === '1' }"
                  data-x="1150"
                  data-y="810"
                  @click="toggleBitValue(bLineMotorRunning, 'bit1')"
                >
                  <div class="marker-label">B1-2#</div>
                </div>
                <div
                  class="motor-marker marker-show-label label-left"
                  :class="{ running: bLineMotorRunning.bit2 === '1' }"
                  data-x="1820"
                  data-y="880"
                  @click="toggleBitValue(bLineMotorRunning, 'bit2')"
                >
                  <div class="marker-label">B2-1#</div>
                </div>
                <div
                  class="motor-marker marker-show-label label-left"
                  :class="{ running: bLineMotorRunning.bit3 === '1' }"
                  data-x="1820"
                  data-y="810"
                  @click="toggleBitValue(bLineMotorRunning, 'bit3')"
                >
                  <div class="marker-label">B2-2#</div>
                </div>
                <div
                  class="motor-marker marker-show-label label-right"
                  :class="{ running: bLineMotorRunning.bit4 === '1' }"
                  data-x="2320"
                  data-y="880"
                  @click="toggleBitValue(bLineMotorRunning, 'bit4')"
                >
                  <div class="marker-label">B3-1#</div>
                </div>
                <div
                  class="motor-marker marker-show-label label-right"
                  :class="{ running: bLineMotorRunning.bit5 === '1' }"
                  data-x="2320"
                  data-y="810"
                  @click="toggleBitValue(bLineMotorRunning, 'bit5')"
                >
                  <div class="marker-label">B3-2#</div>
                </div>
                <!-- B线光电检测信号 -->
                <div
                  class="marker label-right"
                  :class="{ scanning: bLinePhotoelectricSignal.bit0 === '1' }"
                  data-x="840"
                  data-y="900"
                  @click="toggleBitValue(bLinePhotoelectricSignal, 'bit0')"
                >
                  <div class="marker-label">B-1#</div>
                </div>
                <div
                  class="marker label-right"
                  :class="{ scanning: bLinePhotoelectricSignal.bit1 === '1' }"
                  data-x="840"
                  data-y="790"
                  @click="toggleBitValue(bLinePhotoelectricSignal, 'bit1')"
                >
                  <div class="marker-label">B-2#</div>
                </div>
                <div
                  class="marker label-right"
                  :class="{ scanning: bLinePhotoelectricSignal.bit2 === '1' }"
                  data-x="1320"
                  data-y="900"
                  @click="toggleBitValue(bLinePhotoelectricSignal, 'bit2')"
                >
                  <div class="marker-label">B-3#</div>
                </div>
                <div
                  class="marker label-right"
                  :class="{ scanning: bLinePhotoelectricSignal.bit3 === '1' }"
                  data-x="1320"
                  data-y="790"
                  @click="toggleBitValue(bLinePhotoelectricSignal, 'bit3')"
                >
                  <div class="marker-label">B-4#</div>
                </div>
                <div
                  class="marker label-right"
                  :class="{ scanning: bLinePhotoelectricSignal.bit4 === '1' }"
                  data-x="1435"
                  data-y="900"
                  @click="toggleBitValue(bLinePhotoelectricSignal, 'bit4')"
                >
                  <div class="marker-label">B-5#</div>
                </div>
                <div
                  class="marker label-right"
                  :class="{ scanning: bLinePhotoelectricSignal.bit5 === '1' }"
                  data-x="1435"
                  data-y="790"
                  @click="toggleBitValue(bLinePhotoelectricSignal, 'bit5')"
                >
                  <div class="marker-label">B-6#</div>
                </div>
                <div
                  class="marker label-right"
                  :class="{ scanning: bLinePhotoelectricSignal.bit6 === '1' }"
                  data-x="2020"
                  data-y="900"
                  @click="toggleBitValue(bLinePhotoelectricSignal, 'bit6')"
                >
                  <div class="marker-label">B-7#</div>
                </div>
                <div
                  class="marker label-right"
                  :class="{ scanning: bLinePhotoelectricSignal.bit7 === '1' }"
                  data-x="2020"
                  data-y="790"
                  @click="toggleBitValue(bLinePhotoelectricSignal, 'bit7')"
                >
                  <div class="marker-label">B-8#</div>
                </div>
                <div
                  class="marker label-right"
                  :class="{ scanning: bLinePhotoelectricSignal.bit8 === '1' }"
                  data-x="2470"
                  data-y="900"
                  @click="toggleBitValue(bLinePhotoelectricSignal, 'bit8')"
                >
                  <div class="marker-label">B-9#</div>
                </div>
                <div
                  class="marker label-right"
                  :class="{ scanning: bLinePhotoelectricSignal.bit9 === '1' }"
                  data-x="2470"
                  data-y="790"
                  @click="toggleBitValue(bLinePhotoelectricSignal, 'bit9')"
                >
                  <div class="marker-label">B-10#</div>
                </div>

                <!-- C线电机运行信号 -->
                <div
                  class="motor-marker marker-show-label label-right"
                  :class="{ running: cLineMotorRunning.bit0 === '1' }"
                  data-x="1150"
                  data-y="678"
                  @click="toggleBitValue(cLineMotorRunning, 'bit0')"
                >
                  <div class="marker-label">C1-1#</div>
                </div>
                <div
                  class="motor-marker marker-show-label label-right"
                  :class="{ running: cLineMotorRunning.bit1 === '1' }"
                  data-x="1150"
                  data-y="615"
                  @click="toggleBitValue(cLineMotorRunning, 'bit1')"
                >
                  <div class="marker-label">C1-2#</div>
                </div>
                <div
                  class="motor-marker marker-show-label label-left"
                  :class="{ running: cLineMotorRunning.bit2 === '1' }"
                  data-x="1820"
                  data-y="678"
                  @click="toggleBitValue(cLineMotorRunning, 'bit2')"
                >
                  <div class="marker-label">C2-1#</div>
                </div>
                <div
                  class="motor-marker marker-show-label label-left"
                  :class="{ running: cLineMotorRunning.bit3 === '1' }"
                  data-x="1820"
                  data-y="615"
                  @click="toggleBitValue(cLineMotorRunning, 'bit3')"
                >
                  <div class="marker-label">C2-2#</div>
                </div>
                <div
                  class="motor-marker marker-show-label label-right"
                  :class="{ running: cLineMotorRunning.bit4 === '1' }"
                  data-x="2320"
                  data-y="678"
                  @click="toggleBitValue(cLineMotorRunning, 'bit4')"
                >
                  <div class="marker-label">C3-1#</div>
                </div>
                <div
                  class="motor-marker marker-show-label label-right"
                  :class="{ running: cLineMotorRunning.bit5 === '1' }"
                  data-x="2320"
                  data-y="615"
                  @click="toggleBitValue(cLineMotorRunning, 'bit5')"
                >
                  <div class="marker-label">C3-2#</div>
                </div>
                <!-- C线光电检测信号 -->
                <div
                  class="marker label-right"
                  :class="{ scanning: cLinePhotoelectricSignal.bit0 === '1' }"
                  data-x="840"
                  data-y="690"
                  @click="toggleBitValue(cLinePhotoelectricSignal, 'bit0')"
                >
                  <div class="marker-label">C-1#</div>
                </div>
                <div
                  class="marker label-right"
                  :class="{ scanning: cLinePhotoelectricSignal.bit1 === '1' }"
                  data-x="840"
                  data-y="590"
                  @click="toggleBitValue(cLinePhotoelectricSignal, 'bit1')"
                >
                  <div class="marker-label">C-2#</div>
                </div>
                <div
                  class="marker label-right"
                  :class="{ scanning: cLinePhotoelectricSignal.bit2 === '1' }"
                  data-x="1320"
                  data-y="690"
                  @click="toggleBitValue(cLinePhotoelectricSignal, 'bit2')"
                >
                  <div class="marker-label">C-3#</div>
                </div>
                <div
                  class="marker label-right"
                  :class="{ scanning: cLinePhotoelectricSignal.bit3 === '1' }"
                  data-x="1320"
                  data-y="590"
                  @click="toggleBitValue(cLinePhotoelectricSignal, 'bit3')"
                >
                  <div class="marker-label">C-4#</div>
                </div>
                <div
                  class="marker label-right"
                  :class="{ scanning: cLinePhotoelectricSignal.bit4 === '1' }"
                  data-x="1435"
                  data-y="690"
                  @click="toggleBitValue(cLinePhotoelectricSignal, 'bit4')"
                >
                  <div class="marker-label">C-5#</div>
                </div>
                <div
                  class="marker label-right"
                  :class="{ scanning: cLinePhotoelectricSignal.bit5 === '1' }"
                  data-x="1435"
                  data-y="590"
                  @click="toggleBitValue(cLinePhotoelectricSignal, 'bit5')"
                >
                  <div class="marker-label">C-6#</div>
                </div>
                <div
                  class="marker label-right"
                  :class="{ scanning: cLinePhotoelectricSignal.bit6 === '1' }"
                  data-x="2020"
                  data-y="690"
                  @click="toggleBitValue(cLinePhotoelectricSignal, 'bit6')"
                >
                  <div class="marker-label">C-7#</div>
                </div>
                <div
                  class="marker label-right"
                  :class="{ scanning: cLinePhotoelectricSignal.bit7 === '1' }"
                  data-x="2020"
                  data-y="590"
                  @click="toggleBitValue(cLinePhotoelectricSignal, 'bit7')"
                >
                  <div class="marker-label">C-8#</div>
                </div>
                <div
                  class="marker label-right"
                  :class="{ scanning: cLinePhotoelectricSignal.bit8 === '1' }"
                  data-x="2470"
                  data-y="690"
                  @click="toggleBitValue(cLinePhotoelectricSignal, 'bit8')"
                >
                  <div class="marker-label">C-9#</div>
                </div>
                <div
                  class="marker label-right"
                  :class="{ scanning: cLinePhotoelectricSignal.bit9 === '1' }"
                  data-x="2470"
                  data-y="590"
                  @click="toggleBitValue(cLinePhotoelectricSignal, 'bit9')"
                >
                  <div class="marker-label">C-10#</div>
                </div>
                <!-- D线电机运行信号 -->
                <div
                  class="motor-marker marker-show-label label-right"
                  :class="{ running: dLineMotorRunning.bit0 === '1' }"
                  data-x="1850"
                  data-y="480"
                  @click="toggleBitValue(dLineMotorRunning, 'bit0')"
                >
                  <div class="marker-label">D1-1#</div>
                </div>
                <div
                  class="motor-marker marker-show-label label-left"
                  :class="{ running: dLineMotorRunning.bit1 === '1' }"
                  data-x="2420"
                  data-y="480"
                  @click="toggleBitValue(dLineMotorRunning, 'bit1')"
                >
                  <div class="marker-label">D1-2#</div>
                </div>
                <!-- D线光电检测信号 -->
                <div
                  class="marker label-bottom"
                  :class="{ scanning: dLinePhotoelectricSignal.bit1 === '1' }"
                  data-x="1830"
                  data-y="510"
                  @click="toggleBitValue(dLinePhotoelectricSignal, 'bit1')"
                >
                  <div class="marker-label">D-2#</div>
                </div>
                <div
                  class="marker label-bottom"
                  :class="{ scanning: dLinePhotoelectricSignal.bit2 === '1' }"
                  data-x="1860"
                  data-y="510"
                  @click="toggleBitValue(dLinePhotoelectricSignal, 'bit2')"
                >
                  <div class="marker-label">D-3#</div>
                </div>
                <div
                  class="marker label-bottom"
                  :class="{ scanning: dLinePhotoelectricSignal.bit3 === '1' }"
                  data-x="2420"
                  data-y="510"
                  @click="toggleBitValue(dLinePhotoelectricSignal, 'bit3')"
                >
                  <div class="marker-label">D-4#</div>
                </div>
                <div
                  class="marker label-bottom"
                  :class="{ scanning: dLinePhotoelectricSignal.bit4 === '1' }"
                  data-x="2460"
                  data-y="510"
                  @click="toggleBitValue(dLinePhotoelectricSignal, 'bit4')"
                >
                  <div class="marker-label">D-5#</div>
                </div>
                <!-- E线电机运行信号 -->
                <div
                  class="motor-marker marker-show-label label-right"
                  :class="{ running: eLineMotorRunning.bit0 === '1' }"
                  data-x="1850"
                  data-y="330"
                  @click="toggleBitValue(eLineMotorRunning, 'bit0')"
                >
                  <div class="marker-label">E1-1#</div>
                </div>
                <div
                  class="motor-marker marker-show-label label-left"
                  :class="{ running: eLineMotorRunning.bit1 === '1' }"
                  data-x="2420"
                  data-y="330"
                  @click="toggleBitValue(eLineMotorRunning, 'bit1')"
                >
                  <div class="marker-label">E1-2#</div>
                </div>
                <!-- E线光电检测信号 -->
                <div
                  class="marker label-bottom"
                  :class="{ scanning: eLinePhotoelectricSignal.bit1 === '1' }"
                  data-x="1830"
                  data-y="360"
                  @click="toggleBitValue(eLinePhotoelectricSignal, 'bit1')"
                >
                  <div class="marker-label">E-2#</div>
                </div>
                <div
                  class="marker label-bottom"
                  :class="{ scanning: eLinePhotoelectricSignal.bit2 === '1' }"
                  data-x="1860"
                  data-y="360"
                  @click="toggleBitValue(eLinePhotoelectricSignal, 'bit2')"
                >
                  <div class="marker-label">E-3#</div>
                </div>
                <div
                  class="marker label-bottom"
                  :class="{ scanning: eLinePhotoelectricSignal.bit3 === '1' }"
                  data-x="2420"
                  data-y="360"
                  @click="toggleBitValue(eLinePhotoelectricSignal, 'bit3')"
                >
                  <div class="marker-label">E-4#</div>
                </div>
                <div
                  class="marker label-bottom"
                  :class="{ scanning: eLinePhotoelectricSignal.bit4 === '1' }"
                  data-x="2460"
                  data-y="360"
                  @click="toggleBitValue(eLinePhotoelectricSignal, 'bit4')"
                >
                  <div class="marker-label">E-5#</div>
                </div>

                <!-- 扫码枪处光电信号 -->
                <div
                  class="marker marker-show-label label-left"
                  :class="{ scanning: scanPhotoelectricSignal.bit0 === '1' }"
                  data-x="335"
                  data-y="1360"
                  @click="toggleBitValue(scanPhotoelectricSignal, 'bit0')"
                >
                  <div class="marker-label">1-1#</div>
                </div>
                <div
                  class="marker marker-show-label label-left"
                  :class="{ scanning: scanPhotoelectricSignal.bit1 === '1' }"
                  data-x="2335"
                  data-y="1343"
                  @click="toggleBitValue(scanPhotoelectricSignal, 'bit1')"
                >
                  <div class="marker-label">1-2#</div>
                </div>
                <div
                  class="marker marker-show-label label-right"
                  :class="{ scanning: scanPhotoelectricSignal.bit2 === '1' }"
                  data-x="585"
                  data-y="915"
                  @click="toggleBitValue(scanPhotoelectricSignal, 'bit2')"
                >
                  <div class="marker-label">2-1#</div>
                </div>
                <div
                  class="marker marker-show-label label-right"
                  :class="{ scanning: scanPhotoelectricSignal.bit4 === '1' }"
                  data-x="515"
                  data-y="525"
                  @click="toggleBitValue(scanPhotoelectricSignal, 'bit4')"
                >
                  <div class="marker-label">3-1#</div>
                </div>
                <div
                  class="marker marker-show-label label-right"
                  :class="{ scanning: scanPhotoelectricSignal.bit5 === '1' }"
                  data-x="400"
                  data-y="270"
                  @click="toggleBitValue(scanPhotoelectricSignal, 'bit5')"
                >
                  <div class="marker-label">4-1#</div>
                </div>
                <div
                  class="marker marker-show-label label-bottom"
                  :class="{ scanning: scanPhotoelectricSignal.bit7 === '1' }"
                  data-x="1760"
                  data-y="500"
                  @click="toggleBitValue(scanPhotoelectricSignal, 'bit7')"
                >
                  <div class="marker-label">D-1#</div>
                </div>
                <div
                  class="marker marker-show-label label-bottom"
                  :class="{ scanning: scanPhotoelectricSignal.bit8 === '1' }"
                  data-x="1760"
                  data-y="350"
                  @click="toggleBitValue(scanPhotoelectricSignal, 'bit8')"
                >
                  <div class="marker-label">E-1#</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 右侧队列信息区 -->
    <div
      class="side-info-panel-queue"
      :style="{
        width: isQueueExpanded ? '800px' : 'auto',
        height: isQueueExpanded ? 'calc(100% - 40px)' : 'auto'
      }"
    >
      <!-- 队列信息区域 -->
      <div class="queue-section" :class="{ expanded: isQueueExpanded }">
        <div class="section-header" @click="changeQueueExpanded">
          <template v-if="isQueueExpanded">
            <span><i class="el-icon-s-data"></i> 队列信息</span>
            <span
              class="arrow-icon"
              :class="{ 'expanded-arrow': isQueueExpanded }"
              >▼</span
            >
          </template>
          <template v-else>
            <i class="el-icon-s-data"></i>
          </template>
        </div>
        <div v-if="isQueueExpanded" class="expandable-content-queue">
          <div class="queue-container">
            <!-- 左侧队列列表 -->
            <div class="queue-container-left">
              <div
                v-for="(queue, index) in queues"
                :key="'queue-' + queue.id + '-' + index"
                class="queue"
                :class="{ active: selectedQueueIndex === index }"
                @click="showTrays(index)"
                @dragover.prevent
                @drop="handleDrop(index)"
              >
                <span class="queue-name">{{ queue.queueName }}</span>
                <span class="tray-count">{{
                  queue.trayInfo?.length || 0
                }}</span>
              </div>
            </div>

            <!-- 右侧托盘列表 -->
            <div class="queue-container-right">
              <div class="selected-queue-header" v-if="selectedQueue">
                <h3>{{ selectedQueue.queueName }}</h3>
                <div class="queue-header-actions">
                  <el-button
                    type="primary"
                    size="small"
                    @click="showAddTrayDialog"
                    :disabled="!selectedQueue"
                    icon="el-icon-plus"
                  >
                    添加托盘
                  </el-button>
                  <span class="tray-total"
                    >托盘数量: {{ selectedQueue.trayInfo?.length || 0 }}</span
                  >
                </div>
              </div>
              <div class="tray-list">
                <template v-if="nowTrays && nowTrays.length > 0">
                  <div
                    v-for="(tray, index) in nowTrays"
                    :key="'tray-' + tray.id + '-' + index"
                    class="tray-item"
                    :class="{
                      dragging: isDragging && draggedTray?.id === tray.id
                    }"
                    draggable="true"
                    @dragstart="
                      handleDragStart($event, tray, selectedQueueIndex)
                    "
                    @dragend="handleDragEnd"
                  >
                    <div class="tray-info">
                      <div class="tray-info-row">
                        <span class="tray-name">{{ tray.name }}</span>
                        <span class="tray-batch">
                          <span
                            v-if="
                              tray.sendTo &&
                              ['A1', 'B1', 'C1'].includes(
                                selectedQueue.queueName
                              )
                            "
                            >预热房位置：{{ tray.sendTo }}</span
                          ><span v-else>
                            {{ tray.isTerile === 1 ? '消毒' : '不消毒' }}</span
                          ></span
                        >
                        <span
                          class="tray-batch"
                          v-if="selectedQueue.queueName == '分发区'"
                          >PLC命令：{{
                            tray.state === '0' ? '未执行' : '已执行'
                          }}</span
                        >
                      </div>
                      <span class="tray-time">{{ tray.time }}</span>
                    </div>
                    <el-button
                      type="danger"
                      size="mini"
                      icon="el-icon-delete"
                      circle
                      @click.stop="deleteTray(tray)"
                    ></el-button>
                  </div>
                </template>
                <div v-else class="empty-state">
                  <i class="el-icon-box"></i>
                  <p>暂无托盘信息</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 测试面板 -->
    <div class="test-panel-container">
      <!-- 测试按钮 -->
      <div class="test-toggle-btn" @click="showTestPanel = !showTestPanel">
        <i class="el-icon-setting"></i>
      </div>
      <!-- 测试面板 -->
      <div class="test-panel" :class="{ collapsed: !showTestPanel }">
        <div class="test-panel-header">
          <span>测试面板</span>
          <i class="el-icon-close" @click.stop="showTestPanel = false"></i>
        </div>
        <div class="test-panel-content">
          <div class="test-section">
            <span class="test-label">小车位置测试:</span>
            <div class="cart-position-test-container">
              <div class="cart-position-group">
                <div class="cart-position-label">
                  <span>小车1 (0-1450):</span>
                  <span class="cart-value">{{ cartPositionValues.cart1 }}</span>
                </div>
                <div class="cart-position-slider-container">
                  <el-slider
                    v-model="cartPositionValues.cart1"
                    :min="0"
                    :max="1450"
                    :step="1"
                    class="cart-position-slider"
                  ></el-slider>
                </div>
              </div>
              <div class="cart-position-group">
                <div class="cart-position-label">
                  <span>小车2 (0-1010):</span>
                  <span class="cart-value">{{ cartPositionValues.cart2 }}</span>
                </div>
                <div class="cart-position-slider-container">
                  <el-slider
                    v-model="cartPositionValues.cart2"
                    :min="0"
                    :max="1010"
                    :step="1"
                    class="cart-position-slider"
                  ></el-slider>
                </div>
              </div>
              <div class="cart-position-group">
                <div class="cart-position-label">
                  <span>小车3 (0-1010):</span>
                  <span class="cart-value">{{ cartPositionValues.cart3 }}</span>
                </div>
                <div class="cart-position-slider-container">
                  <el-slider
                    v-model="cartPositionValues.cart3"
                    :min="0"
                    :max="1010"
                    :step="1"
                    class="cart-position-slider"
                  ></el-slider>
                </div>
              </div>
              <div class="cart-position-group">
                <div class="cart-position-label">
                  <span>小车4 (0-1880):</span>
                  <span class="cart-value">{{ cartPositionValues.cart4 }}</span>
                </div>
                <div class="cart-position-slider-container">
                  <el-slider
                    v-model="cartPositionValues.cart4"
                    :min="0"
                    :max="1880"
                    :step="1"
                    class="cart-position-slider"
                  ></el-slider>
                </div>
              </div>
            </div>
          </div>
          <!-- 添加扫码测试部分 -->
          <div class="test-section">
            <span class="test-label">扫码信息测试:</span>
            <div class="qrcode-test-container">
              <div class="qrcode-input-group">
                <div class="qrcode-label">一楼扫码:</div>
                <el-input
                  v-model="elevatorOneFloorScanCode"
                  size="small"
                  placeholder="输入扫码信息"
                  class="qrcode-input"
                ></el-input>
              </div>
              <div class="qrcode-input-group">
                <div class="qrcode-label">二楼扫码:</div>
                <el-input
                  v-model="elevatorTwoFloorScanCode"
                  size="small"
                  placeholder="输入扫码信息"
                  class="qrcode-input"
                ></el-input>
              </div>
              <div class="qrcode-input-group">
                <div class="qrcode-label">三楼扫码:</div>
                <el-input
                  v-model="elevatorThreeFloorScanCode"
                  size="small"
                  placeholder="输入扫码信息"
                  class="qrcode-input"
                ></el-input>
              </div>
              <div class="qrcode-input-group">
                <div class="qrcode-label">四楼扫码:</div>
                <el-input
                  v-model="elevatorFourFloorScanCode"
                  size="small"
                  placeholder="输入扫码信息"
                  class="qrcode-input"
                ></el-input>
              </div>
              <div class="qrcode-input-group">
                <div class="qrcode-label">D灭菌柜扫码:</div>
                <el-input
                  v-model="elevatorDDisinfectionScanCode"
                  size="small"
                  placeholder="输入扫码信息"
                  class="qrcode-input"
                ></el-input>
              </div>
              <div class="qrcode-input-group">
                <div class="qrcode-label">E灭菌柜扫码:</div>
                <el-input
                  v-model="elevatorEDisinfectionScanCode"
                  size="small"
                  placeholder="输入扫码信息"
                  class="qrcode-input"
                ></el-input>
              </div>
              <div class="qrcode-input-group">
                <div class="qrcode-label">一楼缓冲区区扫码:</div>
                <el-input
                  v-model="oneFloorElevatorScanCode"
                  size="small"
                  placeholder="输入扫码信息"
                  class="qrcode-input"
                ></el-input>
              </div>
              <div class="qrcode-actions">
                <el-button type="primary" size="small" @click="clearAllQrCodes"
                  >清空所有</el-button
                >
              </div>
            </div>
          </div>

          <!-- 添加上位机下发任务测试部分 -->
          <div class="test-section">
            <span class="test-label">上位机下发任务测试:</span>
            <div class="task-test-container">
              <div class="task-buttons">
                <el-button
                  type="primary"
                  size="small"
                  @click="triggerRequestUploadTask"
                >
                  判断去灭/非灭菌 ({{ requestUploadTask }})
                </el-button>
                <el-button
                  type="primary"
                  size="small"
                  style="margin-left: 0px"
                  @click="triggerRequestUploadTaskPreheatingCar"
                >
                  预热小车前请求 ({{ requestUploadTaskPreheatingCar }})
                </el-button>
              </div>
            </div>
          </div>

          <!-- 添加数量控制测试部分 -->
          <div class="test-section">
            <span class="test-label">数量控制测试:</span>
            <div class="quantity-test-container">
              <!-- A线数量控制 -->
              <div class="quantity-group">
                <div class="quantity-title">A线数量:</div>
                <div class="quantity-controls">
                  <div class="quantity-item">
                    <span class="quantity-label">A1:</span>
                    <span class="quantity-value">{{ aLineQuantity.a1 }}</span>
                    <div class="quantity-buttons">
                      <button
                        @click="updateQuantity('aLineQuantity', 'a1', 1)"
                        class="quantity-btn plus"
                      >
                        +
                      </button>
                      <button
                        @click="updateQuantity('aLineQuantity', 'a1', -1)"
                        class="quantity-btn minus"
                      >
                        -
                      </button>
                    </div>
                  </div>
                  <div class="quantity-item">
                    <span class="quantity-label">A2:</span>
                    <span class="quantity-value">{{ aLineQuantity.a2 }}</span>
                    <div class="quantity-buttons">
                      <button
                        @click="updateQuantity('aLineQuantity', 'a2', 1)"
                        class="quantity-btn plus"
                      >
                        +
                      </button>
                      <button
                        @click="updateQuantity('aLineQuantity', 'a2', -1)"
                        class="quantity-btn minus"
                      >
                        -
                      </button>
                    </div>
                  </div>
                  <div class="quantity-item">
                    <span class="quantity-label">A3:</span>
                    <span class="quantity-value">{{ aLineQuantity.a3 }}</span>
                    <div class="quantity-buttons">
                      <button
                        @click="updateQuantity('aLineQuantity', 'a3', 1)"
                        class="quantity-btn plus"
                      >
                        +
                      </button>
                      <button
                        @click="updateQuantity('aLineQuantity', 'a3', -1)"
                        class="quantity-btn minus"
                      >
                        -
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <!-- B线数量控制 -->
              <div class="quantity-group">
                <div class="quantity-title">B线数量:</div>
                <div class="quantity-controls">
                  <div class="quantity-item">
                    <span class="quantity-label">B1:</span>
                    <span class="quantity-value">{{ bLineQuantity.b1 }}</span>
                    <div class="quantity-buttons">
                      <button
                        @click="updateQuantity('bLineQuantity', 'b1', 1)"
                        class="quantity-btn plus"
                      >
                        +
                      </button>
                      <button
                        @click="updateQuantity('bLineQuantity', 'b1', -1)"
                        class="quantity-btn minus"
                      >
                        -
                      </button>
                    </div>
                  </div>
                  <div class="quantity-item">
                    <span class="quantity-label">B2:</span>
                    <span class="quantity-value">{{ bLineQuantity.b2 }}</span>
                    <div class="quantity-buttons">
                      <button
                        @click="updateQuantity('bLineQuantity', 'b2', 1)"
                        class="quantity-btn plus"
                      >
                        +
                      </button>
                      <button
                        @click="updateQuantity('bLineQuantity', 'b2', -1)"
                        class="quantity-btn minus"
                      >
                        -
                      </button>
                    </div>
                  </div>
                  <div class="quantity-item">
                    <span class="quantity-label">B3:</span>
                    <span class="quantity-value">{{ bLineQuantity.b3 }}</span>
                    <div class="quantity-buttons">
                      <button
                        @click="updateQuantity('bLineQuantity', 'b3', 1)"
                        class="quantity-btn plus"
                      >
                        +
                      </button>
                      <button
                        @click="updateQuantity('bLineQuantity', 'b3', -1)"
                        class="quantity-btn minus"
                      >
                        -
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <!-- C线数量控制 -->
              <div class="quantity-group">
                <div class="quantity-title">C线数量:</div>
                <div class="quantity-controls">
                  <div class="quantity-item">
                    <span class="quantity-label">C1:</span>
                    <span class="quantity-value">{{ cLineQuantity.c1 }}</span>
                    <div class="quantity-buttons">
                      <button
                        @click="updateQuantity('cLineQuantity', 'c1', 1)"
                        class="quantity-btn plus"
                      >
                        +
                      </button>
                      <button
                        @click="updateQuantity('cLineQuantity', 'c1', -1)"
                        class="quantity-btn minus"
                      >
                        -
                      </button>
                    </div>
                  </div>
                  <div class="quantity-item">
                    <span class="quantity-label">C2:</span>
                    <span class="quantity-value">{{ cLineQuantity.c2 }}</span>
                    <div class="quantity-buttons">
                      <button
                        @click="updateQuantity('cLineQuantity', 'c2', 1)"
                        class="quantity-btn plus"
                      >
                        +
                      </button>
                      <button
                        @click="updateQuantity('cLineQuantity', 'c2', -1)"
                        class="quantity-btn minus"
                      >
                        -
                      </button>
                    </div>
                  </div>
                  <div class="quantity-item">
                    <span class="quantity-label">C3:</span>
                    <span class="quantity-value">{{ cLineQuantity.c3 }}</span>
                    <div class="quantity-buttons">
                      <button
                        @click="updateQuantity('cLineQuantity', 'c3', 1)"
                        class="quantity-btn plus"
                      >
                        +
                      </button>
                      <button
                        @click="updateQuantity('cLineQuantity', 'c3', -1)"
                        class="quantity-btn minus"
                      >
                        -
                      </button>
                    </div>
                  </div>
                </div>
              </div>
              <!-- D数量控制 -->
              <div class="quantity-group">
                <div class="quantity-title">D灭菌柜数量:</div>
                <div class="quantity-controls">
                  <div class="quantity-item">
                    <span class="quantity-value">{{ dLineQuantity }}</span>
                    <div class="quantity-buttons">
                      <button
                        @click="updateDLineQuantity(1)"
                        class="quantity-btn plus"
                      >
                        +
                      </button>
                      <button
                        @click="updateDLineQuantity(-1)"
                        class="quantity-btn minus"
                      >
                        -
                      </button>
                    </div>
                  </div>
                </div>
              </div>
              <!-- E数量控制 -->
              <div class="quantity-group">
                <div class="quantity-title">E灭菌柜数量:</div>
                <div class="quantity-controls">
                  <div class="quantity-item">
                    <span class="quantity-value">{{ eLineQuantity }}</span>
                    <div class="quantity-buttons">
                      <button
                        @click="updateELineQuantity(1)"
                        class="quantity-btn plus"
                      >
                        +
                      </button>
                      <button
                        @click="updateELineQuantity(-1)"
                        class="quantity-btn minus"
                      >
                        -
                      </button>
                    </div>
                  </div>
                </div>
              </div>
              <!-- 缓冲区数量控制 -->
              <div class="quantity-group">
                <div class="quantity-title">缓冲区数量:</div>
                <div class="quantity-controls">
                  <div class="quantity-item">
                    <span class="quantity-value">{{ bufferQuantity }}</span>
                    <div class="quantity-buttons">
                      <button
                        @click="updateBufferQuantity(1)"
                        class="quantity-btn plus"
                      >
                        +
                      </button>
                      <button
                        @click="updateBufferQuantity(-1)"
                        class="quantity-btn minus"
                      >
                        -
                      </button>
                    </div>
                  </div>
                </div>
              </div>
              <!-- 非灭菌缓存区数量控制 -->
              <div class="quantity-group">
                <div class="quantity-title">非灭菌缓存区数量:</div>
                <div class="quantity-controls">
                  <div class="quantity-item">
                    <span class="quantity-value">{{ nonSterileunload }}</span>
                    <div class="quantity-buttons">
                      <button
                        @click="updateNonSterileUnload(1)"
                        class="quantity-btn plus"
                      >
                        +
                      </button>
                      <button
                        @click="updateNonSterileUnload(-1)"
                        class="quantity-btn minus"
                      >
                        -
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 订单查询对话框 -->
    <OrderQueryDialog :visible.sync="orderQueryDialogVisible" />

    <!-- 添加托盘对话框 -->
    <el-dialog
      title="添加托盘"
      :visible.sync="addTrayDialogVisible"
      width="500px"
      append-to-body
      :close-on-click-modal="false"
    >
      <div class="add-tray-form">
        <el-form
          :model="newTrayForm"
          ref="newTrayForm"
          label-width="100px"
          :rules="trayFormRules"
        >
          <el-form-item label="托盘编号" prop="trayCode">
            <el-input
              v-model="newTrayForm.trayCode"
              placeholder="请输入托盘编号"
            ></el-input>
          </el-form-item>
          <el-form-item label="批次号" prop="batchId">
            <el-input
              v-model="newTrayForm.batchId"
              placeholder="请输入批次号"
            ></el-input>
          </el-form-item>
        </el-form>
      </div>
      <div slot="footer" class="dialog-footer">
        <el-button @click="addTrayDialogVisible = false">取 消</el-button>
        <el-button type="primary" @click="submitAddTray" :loading="isSubmitting"
          >确 定</el-button
        >
      </div>
    </el-dialog>
  </div>
</template>

<script>
import HttpUtil from '@/utils/HttpUtil';
import HttpUtilwms from '@/utils/HttpUtilwms';
import moment from 'moment';
import { ipcRenderer } from 'electron';
import OrderQueryDialog from '@/components/OrderQueryDialog.vue';
export default {
  name: 'MonitorScreen',
  components: {
    OrderQueryDialog
  },
  data() {
    return {
      nowScanTrayInfo: {},
      showTestPanel: false,
      orderQueryDialogVisible: false,
      buttonStates: {
        start: false,
        stop: false,
        reset: false,
        fault_reset: false,
        clear: false
      },
      activeLogType: 'running',
      runningLogs: [], // 修改为空数组
      alarmLogs: [], // 修改为空数组
      // 小车y轴范围配置
      cartYRanges: {
        cart1: { min: 615, max: 1230 }, // y轴范围615-1230
        cart2: { min: 647, max: 1067 }, // y轴范围647-1067
        cart3: { min: 647, max: 1066 }, // y轴范围647-1066
        cart4: { min: 425, max: 1230 } // y轴范围425-1230
      },
      carts: [
        {
          id: 1,
          name: '小车1',
          x: 790,
          y: 615, // 对应PLC值0的位置（y轴最小值）
          width: 72,
          image: require('@/assets/changzhou-img/cart1.png')
        },
        {
          id: 2,
          name: '小车2',
          x: 1375,
          y: 647, // 对应PLC值0的位置（y轴最小值）
          width: 68,
          image: require('@/assets/changzhou-img/cart2.png')
        },
        {
          id: 3,
          name: '小车3',
          x: 1945,
          y: 647, // 对应PLC值0的位置（y轴最小值）
          width: 72,
          image: require('@/assets/changzhou-img/cart3.png')
        },
        {
          id: 4,
          name: '小车4',
          x: 2510,
          y: 425, // 对应PLC值0的位置（y轴最小值）
          width: 72,
          image: require('@/assets/changzhou-img/cart4.png')
        }
      ],
      nowTrays: [],
      draggedTray: null,
      dragSourceQueue: null,
      isQueueExpanded: false,
      selectedQueueIndex: 0,
      isDragging: false,
      isRefreshing: false,
      addTrayDialogVisible: false,
      isSubmitting: false,
      newTrayForm: {
        trayCode: '',
        batchId: ''
      },
      trayFormRules: {
        trayCode: [
          { required: true, message: '请输入托盘编号', trigger: 'blur' },
          { min: 1, max: 50, message: '长度在 1 到 50 个字符', trigger: 'blur' }
        ],
        batchId: [
          { required: true, message: '请输入批次号', trigger: 'blur' },
          { min: 1, max: 50, message: '长度在 1 到 50 个字符', trigger: 'blur' }
        ]
      },
      queues: [
        {
          id: 1,
          queueName: '上货区',
          trayInfo: []
        },
        {
          id: 2,
          queueName: '分发区',
          trayInfo: []
        },
        {
          id: 3,
          queueName: '缓存区',
          trayInfo: []
        },
        {
          id: 4,
          queueName: 'A1',
          trayInfo: []
        },
        {
          id: 5,
          queueName: 'B1',
          trayInfo: []
        },
        {
          id: 6,
          queueName: 'C1',
          trayInfo: []
        },
        {
          id: 7,
          queueName: 'A2',
          trayInfo: []
        },
        {
          id: 8,
          queueName: 'B2',
          trayInfo: []
        },
        {
          id: 9,
          queueName: 'C2',
          trayInfo: []
        },
        {
          id: 10,
          queueName: 'A3',
          trayInfo: []
        },
        {
          id: 11,
          queueName: 'B3',
          trayInfo: []
        },
        {
          id: 12,
          queueName: 'C3',
          trayInfo: []
        },
        {
          id: 13,
          queueName: 'D',
          trayInfo: []
        },
        {
          id: 14,
          queueName: 'E',
          trayInfo: []
        },
        {
          id: 15,
          queueName: '非灭菌缓存区',
          trayInfo: []
        }
      ],
      // 添加队列位置标识数据
      queueMarkers: [
        { id: 1, name: '上货区', queueId: 1, x: 1325, y: 1350 },
        { id: 2, name: '分发区', queueId: 2, x: 2500, y: 1530 },
        { id: 3, name: '缓冲区', queueId: 3, x: 1325, y: 1230 },
        { id: 4, name: 'A1', queueId: 4, x: 1050, y: 1065 },
        { id: 5, name: 'B1', queueId: 5, x: 1050, y: 845 },
        { id: 6, name: 'C1', queueId: 6, x: 1050, y: 645 },
        { id: 7, name: 'A2', queueId: 7, x: 1610, y: 1065 },
        { id: 8, name: 'B2', queueId: 8, x: 1610, y: 845 },
        { id: 9, name: 'C2', queueId: 9, x: 1610, y: 645 },
        { id: 10, name: 'A3', queueId: 10, x: 2190, y: 1065 },
        { id: 11, name: 'B3', queueId: 11, x: 2190, y: 845 },
        { id: 12, name: 'C3', queueId: 12, x: 2190, y: 645 },
        { id: 13, name: 'D', queueId: 13, x: 2165, y: 490 },
        { id: 14, name: 'E', queueId: 14, x: 2165, y: 340 },
        { id: 15, name: '非灭菌缓存区', queueId: 15, x: 2630, y: 1280 }
      ],
      logId: 1000, // 添加一个日志ID计数器
      // 输送线当前运行状态-读取PLC
      conveyorStatus: '',
      // 允许进料反馈-读取PLC
      allowFeedBack: {
        bit0: '0', // 值为1时，全部接货口不允许进货
        bit1: '0', // 值为1时，一楼接货口允许进货；值为0时，不允许
        bit2: '0', // 值为1时，二楼1#接货口允许进货；值为0时，不允许
        bit3: '0', // 值为1时，二楼2#接货口允许进货；值为0时，不允许
        bit4: '0', // 值为1时，三楼1#接货口允许进货；值为0时，不允许
        bit5: '0' // 值为1时，三楼2#接货口允许进货；值为0时，不允许
      },
      // A线电机运行信号-读取PLC
      aLineMotorRunning: {
        bit0: '0', // A1-1#电机运行信号
        bit1: '0', // A1-2#电机运行信号
        bit2: '0', // A2-1#电机运行信号
        bit3: '0', // A2-2#电机运行信号
        bit4: '0', // A3-1#电机运行信号
        bit5: '0' // A3-2#电机运行信号
      },
      // A线光电检测信号-读取PLC
      aLinePhotoelectricSignal: {
        bit0: '0', // A-1#光电
        bit1: '0', // A-2#光电
        bit2: '0', // A-3#光电
        bit3: '0', // A-4#光电
        bit4: '0', // A-5#光电
        bit5: '0', // A-6#光电
        bit6: '0', // A-7#光电
        bit7: '0', // A-8#光电
        bit8: '0', // A-9#光电
        bit9: '0' // A-10#光电
      },
      // B线电机运行信号-读取PLC
      bLineMotorRunning: {
        bit0: '0', // B1-1#电机运行信号
        bit1: '0', // B1-2#电机运行信号
        bit2: '0', // B2-1#电机运行信号
        bit3: '0', // B2-2#电机运行信号
        bit4: '0', // B3-1#电机运行信号
        bit5: '0' // B3-2#电机运行信号
      },
      // B线光电检测信号-读取PLC
      bLinePhotoelectricSignal: {
        bit0: '0', // B-1#光电
        bit1: '0', // B-2#光电
        bit2: '0', // B-3#光电
        bit3: '0', // B-4#光电
        bit4: '0', // B-5#光电
        bit5: '0', // B-6#光电
        bit6: '0', // B-7#光电
        bit7: '0', // B-8#光电
        bit8: '0', // B-9#光电
        bit9: '0' // B-10#光电
      },
      // C线电机运行信号-读取PLC
      cLineMotorRunning: {
        bit0: '0', // C1-1#电机运行信号
        bit1: '0', // C1-2#电机运行信号
        bit2: '0', // C2-1#电机运行信号
        bit3: '0', // C2-2#电机运行信号
        bit4: '0', // C3-1#电机运行信号
        bit5: '0' // C3-2#电机运行信号
      },
      // C线光电检测信号-读取PLC
      cLinePhotoelectricSignal: {
        bit0: '0', // C-1#光电
        bit1: '0', // C-2#光电
        bit2: '0', // C-3#光电
        bit3: '0', // C-4#光电
        bit4: '0', // C-5#光电
        bit5: '0', // C-6#光电
        bit6: '0', // C-7#光电
        bit7: '0', // C-8#光电
        bit8: '0', // C-9#光电
        bit9: '0' // C-10#光电
      },
      // D线电机运行信号-读取PLC
      dLineMotorRunning: {
        bit0: '0', // D-1#电机运行信号
        bit1: '0' // D-2#电机运行信号
      },
      // D线光电检测信号-读取PLC
      dLinePhotoelectricSignal: {
        bit0: '0', // D-1#光电
        bit1: '0', // D-2#光电
        bit2: '0', // D-3#光电
        bit3: '0', // D-4#光电
        bit4: '0' // D-5#光电
      },
      // E线电机运行信号-读取PLC
      eLineMotorRunning: {
        bit0: '0', // E-1#电机运行信号
        bit1: '0' // E-2#电机运行信号
      },
      // E线光电检测信号-读取PLC
      eLinePhotoelectricSignal: {
        bit0: '0', // E-1#光电
        bit1: '0', // E-2#光电
        bit2: '0', // E-3#光电
        bit3: '0', // E-4#光电
        bit4: '0' // E-5#光电
      },
      // 输送线故障反馈-读取PLC
      conveyorFaultFeedback: {
        bit0: '0', // A1预热故障
        bit1: '0', // A2灭菌故障
        bit2: '0', // A3解析故障
        bit3: '0', // B1预热故障
        bit4: '0', // B2灭菌故障
        bit5: '0', // B3解析故障
        bit6: '0', // C1预热故障
        bit7: '0', // C2灭菌故障
        bit8: '0', // C3解析故障
        bit9: '0', // D灭菌故障
        bit10: '0', // E灭菌故障
        bit11: '0', // 提升机故障
        bit12: '0', // 1#小车故障
        bit13: '0', // 2#小车故障
        bit14: '0', // 3#小车故障
        bit15: '0' // 主柜急停
      },
      // A线数量-读取PLC
      aLineQuantity: {
        a1: 0,
        a2: 0,
        a3: 0
      },
      // B线数量-读取PLC
      bLineQuantity: {
        b1: 0,
        b2: 0,
        b3: 0
      },
      // C线数量-读取PLC
      cLineQuantity: {
        c1: 0,
        c2: 0,
        c3: 0
      },
      // 缓冲区数量
      bufferQuantity: 0,
      // D线数量-读取PLC
      dLineQuantity: 0,
      // E线数量-读取PLC
      eLineQuantity: 0,
      // 非灭菌下货区数量-读取PLC
      nonSterileunload: 0,
      //上货区电机运行信号（扫码后入队）-读取PLC
      upLoadMotorRunning: {
        bit0: '0', // S1#电机运行信号
        bit1: '0', // S2#电机运行信号
        bit2: '0', // S3#电机运行信号
        bit3: '0', // S4#电机运行信号
        bit4: '0', // S5#电机运行信号
        bit5: '0', // S6#电机运行信号
        bit6: '0', // S7#电机运行信号
        bit7: '0', // S8#电机运行信号
        bit8: '0', // S9#电机运行信号
        bit9: '0', // S10#电机运行信号
        bit10: '0', // S11#电机运行信号
        bit11: '0' // S12#电机运行信号
      },
      // 上货区输送线光电信号-读取PLC
      upLoadPhotoelectricSignal: {
        bit0: '0', // S-1#光电
        bit1: '0', // S-2#光电
        bit2: '0', // S-3#光电
        bit3: '0', // S-4#光电
        bit4: '0', // S-5#光电
        bit5: '0', // S-6#光电
        bit6: '0', // S-7#光电
        bit7: '0', // S-8#光电
        bit8: '0', // S-9#光电
        bit9: '0', // S-10#光电
        bit10: '0', // S-11#光电
        bit11: '0', // S-12#光电
        bit12: '0', // S-13#光电
        bit13: '0' // S-14#光电
      },
      // 小车位置数值-读取PLC
      cartPositionValues: {
        cart1: 0, // DBW88, 范围0-1450
        cart2: 0, // DBW90, 范围0-1010
        cart3: 0, // DBW92, 范围0-1010
        cart4: 0 // DBW94, 范围0-1880
      },
      // 扫码枪处光电信号-读取PLC
      scanPhotoelectricSignal: {
        bit0: '0', // 一楼接货站台"有载信号"/光电占位
        bit1: '0', // 一楼缓存区（扫码后入队或者去立库）处"有载信号"/光电占位
        bit2: '0', // 二楼接货占位"有载信号"/光电占位
        bit3: '0', // 无解释
        bit4: '0', // 三楼接货占位"有载信号"/光电占位
        bit5: '0', // 四楼接货占位"有载信号"/光电占位
        bit6: '0', // 进预热处"扫码枪处"有载信号"/光电占位
        bit7: '0', // 一楼D灭菌"有载信号"/光电占位
        bit8: '0' // 一楼E灭菌"有载信号"/光电占位
      },
      // 请求上位机下发任务(判断去灭菌还是非灭菌）
      requestUploadTask: '0',
      // 请求上位机下发任务(预热小车前）
      requestUploadTaskPreheatingCar: '0',
      // 提升机一楼接货站台扫码数据（托盘号）
      elevatorOneFloorScanCode: '',
      // 一楼顶升移栽区扫码数据（扫码后判断方向）（托盘号）
      oneFloorElevatorScanCode: '',
      // 提升机二楼接货站台扫码数据（托盘号）
      elevatorTwoFloorScanCode: '',
      // 提升机三楼接货站台扫码数据（托盘号）
      elevatorThreeFloorScanCode: '',
      // 提升机四楼接货站台扫码数据（托盘号）
      elevatorFourFloorScanCode: '',
      // 一楼D灭菌柜接货站台扫码数据（托盘号）
      elevatorDDisinfectionScanCode: '',
      // 一楼E灭菌柜接货站台扫码数据（托盘号）
      elevatorEDisinfectionScanCode: '',
      // 添加复选框状态-一楼允许上货
      allowUploadOne: false,
      // 添加复选框状态-一楼是否非灭菌（默认灭菌）
      nonSterileOne: false,
      // 添加复选框状态-二楼允许上货
      allowUploadTwo: false,
      // 添加复选框状态-二楼是否非灭菌（默认灭菌）
      nonSterileTwo: false,
      // 添加复选框状态-三楼允许上货
      allowUploadThree: false,
      // 添加复选框状态-三楼是否非灭菌（默认灭菌）
      nonSterileThree: false,
      // 添加复选框状态-四楼允许上货
      allowUploadFour: false,
      // 添加复选框状态-四楼是否非灭菌（默认灭菌）
      nonSterileFour: false,
      // 添加复选框状态-D灭菌柜允许上货
      allowUploadD: false,
      // 添加复选框状态-D灭菌柜是否非灭菌（默认灭菌）
      nonSterileD: false,
      // 添加复选框状态-E灭菌柜允许上货
      allowUploadE: false,
      // 添加复选框状态-E灭菌柜是否非灭菌（默认灭菌）
      nonSterileE: false,
      // 显示小车1设置去哪个预热房的按钮
      showCar1SetPreheatingRoom: false,
      // 显示小车设置去哪个预热房的按钮
      preheatingRoomSelected: '',
      // 灭菌出发地
      disinfectionRoomSelectedFrom: '',
      // 灭菌目的地
      disinfectionRoomSelectedTo: '',
      // 立库出发地
      warehouseSelectedFrom: '',
      // 立库目的地
      warehouseSelectedTo: '',
      // 出库选择
      outWarehouseSelected: '',
      // 当前出库托盘数据
      currentOutTrayInfo: {
        trayCode: '',
        productName: '',
        isTerile: ''
      },
      // 正在执行的预热托盘号
      preWarmTrayCode: '',
      // 正在执行出库的预热托盘号
      disinfectionTrayCode: '',
      // 正在执行出库的解析托盘号
      analysisTrayCode: '',
      // 正在执行的出库托盘号
      outWarehouseTrayCode: '',
      // 无码上货模式开关
      noCodeUpload: false
    };
  },
  computed: {
    currentLogs() {
      return this.activeLogType === 'running'
        ? this.runningLogs
        : this.alarmLogs;
    },
    unreadAlarms() {
      return this.alarmLogs.filter((log) => log.unread).length;
    },
    selectedQueue() {
      return this.queues[this.selectedQueueIndex];
    }
  },
  mounted() {
    this.initializeMarkers();
    this.loadQueueInfoFromDatabase();
    ipcRenderer.on('receivedMsg', (event, values, values2) => {
      // 使用位运算优化赋值
      const getBit = (word, bitIndex) => ((word >> bitIndex) & 1).toString();

      // 允许进料反馈
      let word4 = this.convertToWord(values.DBW4);
      this.allowFeedBack.bit0 = getBit(word4, 8);
      this.allowFeedBack.bit1 = getBit(word4, 9);
      this.allowFeedBack.bit2 = getBit(word4, 10);
      this.allowFeedBack.bit3 = getBit(word4, 11);
      this.allowFeedBack.bit4 = getBit(word4, 12);
      this.allowFeedBack.bit5 = getBit(word4, 13);

      // A线电机运行信号 (DBW6)
      let word6 = this.convertToWord(values.DBW6);
      this.aLineMotorRunning.bit0 = getBit(word6, 8);
      this.aLineMotorRunning.bit1 = getBit(word6, 9);
      this.aLineMotorRunning.bit2 = getBit(word6, 10);
      this.aLineMotorRunning.bit3 = getBit(word6, 11);
      this.aLineMotorRunning.bit4 = getBit(word6, 12);
      this.aLineMotorRunning.bit5 = getBit(word6, 13);

      // A线光电检测信号 (DBW8)
      let word8 = this.convertToWord(values.DBW8);
      this.aLinePhotoelectricSignal.bit0 = getBit(word8, 8);
      this.aLinePhotoelectricSignal.bit1 = getBit(word8, 9);
      this.aLinePhotoelectricSignal.bit2 = getBit(word8, 10);
      this.aLinePhotoelectricSignal.bit3 = getBit(word8, 11);
      this.aLinePhotoelectricSignal.bit4 = getBit(word8, 12);
      this.aLinePhotoelectricSignal.bit5 = getBit(word8, 13);
      this.aLinePhotoelectricSignal.bit6 = getBit(word8, 14);
      this.aLinePhotoelectricSignal.bit7 = getBit(word8, 15);
      this.aLinePhotoelectricSignal.bit8 = getBit(word8, 0);
      this.aLinePhotoelectricSignal.bit9 = getBit(word8, 1);

      // B线电机运行信号 (DBW10)
      let word10 = this.convertToWord(values.DBW10);
      this.bLineMotorRunning.bit0 = getBit(word10, 8);
      this.bLineMotorRunning.bit1 = getBit(word10, 9);
      this.bLineMotorRunning.bit2 = getBit(word10, 10);
      this.bLineMotorRunning.bit3 = getBit(word10, 11);
      this.bLineMotorRunning.bit4 = getBit(word10, 12);
      this.bLineMotorRunning.bit5 = getBit(word10, 13);

      // B线光电检测信号 (DBW12)
      let word12 = this.convertToWord(values.DBW12);
      this.bLinePhotoelectricSignal.bit0 = getBit(word12, 8);
      this.bLinePhotoelectricSignal.bit1 = getBit(word12, 9);
      this.bLinePhotoelectricSignal.bit2 = getBit(word12, 10);
      this.bLinePhotoelectricSignal.bit3 = getBit(word12, 11);
      this.bLinePhotoelectricSignal.bit4 = getBit(word12, 12);
      this.bLinePhotoelectricSignal.bit5 = getBit(word12, 13);
      this.bLinePhotoelectricSignal.bit6 = getBit(word12, 14);
      this.bLinePhotoelectricSignal.bit7 = getBit(word12, 15);
      this.bLinePhotoelectricSignal.bit8 = getBit(word12, 0);
      this.bLinePhotoelectricSignal.bit9 = getBit(word12, 1);

      // C线电机运行信号 (DBW14)
      let word14 = this.convertToWord(values.DBW14);
      this.cLineMotorRunning.bit0 = getBit(word14, 8);
      this.cLineMotorRunning.bit1 = getBit(word14, 9);
      this.cLineMotorRunning.bit2 = getBit(word14, 10);
      this.cLineMotorRunning.bit3 = getBit(word14, 11);
      this.cLineMotorRunning.bit4 = getBit(word14, 12);
      this.cLineMotorRunning.bit5 = getBit(word14, 13);

      // C线光电检测信号 (DBW16)
      let word16 = this.convertToWord(values.DBW16);
      this.cLinePhotoelectricSignal.bit0 = getBit(word16, 8);
      this.cLinePhotoelectricSignal.bit1 = getBit(word16, 9);
      this.cLinePhotoelectricSignal.bit2 = getBit(word16, 10);
      this.cLinePhotoelectricSignal.bit3 = getBit(word16, 11);
      this.cLinePhotoelectricSignal.bit4 = getBit(word16, 12);
      this.cLinePhotoelectricSignal.bit5 = getBit(word16, 13);
      this.cLinePhotoelectricSignal.bit6 = getBit(word16, 14);
      this.cLinePhotoelectricSignal.bit7 = getBit(word16, 15);
      this.cLinePhotoelectricSignal.bit8 = getBit(word16, 0);
      this.cLinePhotoelectricSignal.bit9 = getBit(word16, 1);

      // 缓冲区数量-读取PLC
      this.bufferQuantity = Number(values.DBW28);

      // 请求上位机下发任务(判断去灭菌还是非灭菌）
      this.requestUploadTask = Number(values.DBW30);

      // A线数量-读取PLC
      this.aLineQuantity.a1 = Number(values.DBW34);
      this.aLineQuantity.a2 = Number(values.DBW36);
      this.aLineQuantity.a3 = Number(values.DBW38);

      // B线数量-读取PLC
      this.bLineQuantity.b1 = Number(values.DBW40);
      this.bLineQuantity.b2 = Number(values.DBW42);
      this.bLineQuantity.b3 = Number(values.DBW44);

      // C线数量-读取PLC
      this.cLineQuantity.c1 = Number(values.DBW46);
      this.cLineQuantity.c2 = Number(values.DBW48);
      this.cLineQuantity.c3 = Number(values.DBW50);
      // D灭菌柜数量-读取PLC
      this.dDisinfectionQuantity = Number(values.DBW52);
      // E灭菌柜数量-读取PLC
      this.eDisinfectionQuantity = Number(values.DBW58);
      // 非灭菌区数量-读取PLC
      this.nonSterileunload = Number(values.DBW32);
      // 上货区电机运行信号（扫码后入队） (DBW64)
      let word64 = this.convertToWord(values.DBW64);
      this.upLoadMotorRunning.bit0 = getBit(word64, 8);
      this.upLoadMotorRunning.bit1 = getBit(word64, 9);
      this.upLoadMotorRunning.bit2 = getBit(word64, 10);
      this.upLoadMotorRunning.bit3 = getBit(word64, 11);
      this.upLoadMotorRunning.bit4 = getBit(word64, 12);
      this.upLoadMotorRunning.bit5 = getBit(word64, 13);
      this.upLoadMotorRunning.bit6 = getBit(word64, 14);
      this.upLoadMotorRunning.bit7 = getBit(word64, 15);
      this.upLoadMotorRunning.bit8 = getBit(word64, 0);
      this.upLoadMotorRunning.bit9 = getBit(word64, 1);
      this.upLoadMotorRunning.bit10 = getBit(word64, 2);

      //上货区输送线光电信号 (DBW66)
      let word66 = this.convertToWord(values.DBW66);
      this.upLoadPhotoelectricSignal.bit0 = getBit(word66, 8);
      this.upLoadPhotoelectricSignal.bit1 = getBit(word66, 9);
      this.upLoadPhotoelectricSignal.bit2 = getBit(word66, 10);
      this.upLoadPhotoelectricSignal.bit3 = getBit(word66, 11);
      this.upLoadPhotoelectricSignal.bit4 = getBit(word66, 12);
      this.upLoadPhotoelectricSignal.bit5 = getBit(word66, 13);
      this.upLoadPhotoelectricSignal.bit6 = getBit(word66, 14);
      this.upLoadPhotoelectricSignal.bit7 = getBit(word66, 15);
      this.upLoadPhotoelectricSignal.bit8 = getBit(word66, 0);
      this.upLoadPhotoelectricSignal.bit9 = getBit(word66, 1);
      this.upLoadPhotoelectricSignal.bit10 = getBit(word66, 2);

      // 扫码枪处光电信号 (DBW84)
      let word84 = this.convertToWord(values.DBW84);
      this.scanPhotoelectricSignal.bit0 = getBit(word84, 8);
      this.scanPhotoelectricSignal.bit1 = getBit(word84, 9);
      this.scanPhotoelectricSignal.bit2 = getBit(word84, 10);
      this.scanPhotoelectricSignal.bit3 = getBit(word84, 11);
      this.scanPhotoelectricSignal.bit4 = getBit(word84, 12);
      this.scanPhotoelectricSignal.bit5 = getBit(word84, 13);
      this.scanPhotoelectricSignal.bit6 = getBit(word84, 14);
      this.scanPhotoelectricSignal.bit7 = getBit(word84, 15);
      this.scanPhotoelectricSignal.bit8 = getBit(word84, 0);

      // 请求上位机下发任务(预热小车前）
      this.requestUploadTaskPreheatingCar = Number(values.DBW86);

      // 提升机一楼接货站台扫码数据（托盘号）
      this.elevatorOneFloorScanCode = values.DBB160 ?? '';

      // 一楼顶升移栽区扫码数据（扫码后判断方向）（托盘号）
      this.oneFloorElevatorScanCode = values.DBB190;

      // 提升机二楼接货站台扫码数据（托盘号）
      this.elevatorTwoFloorScanCode = values.DBB220 ?? '';

      // 提升机三楼接货站台扫码数据（托盘号）
      this.elevatorThreeFloorScanCode = values.DBB250 ?? '';

      // 提升机四楼接货站台扫码数据（托盘号）
      this.elevatorFourFloorScanCode = values.DBB280 ?? '';

      // 一楼D灭菌柜接货站台扫码数据（托盘号）
      this.elevatorDDisinfectionScanCode = values.DBB310 ?? '';

      // 一楼E灭菌柜接货站台扫码数据（托盘号）
      this.elevatorEDisinfectionScanCode = values.DBB340 ?? '';

      // 读取小车位置数值
      this.cartPositionValues.cart1 = Number(values.DBW88 ?? 0);
      this.cartPositionValues.cart2 = Number(values.DBW90 ?? 0);
      this.cartPositionValues.cart3 = Number(values.DBW92 ?? 0);
      this.cartPositionValues.cart4 = Number(values.DBW94 ?? 0);
    });
  },
  watch: {
    // 一楼接货站台光电信号
    'scanPhotoelectricSignal.bit0'(newVal) {
      if (newVal === '0') {
        this.elevatorOneFloorScanCode = '';
        this.addLog('一楼接货站台光电信号无货，已清空一楼接货站台扫码数据');
      }
      if (newVal === '1') {
        if (this.noCodeUpload) {
          // 无码上货模式，直接添加托盘信息
          this.addLog('一楼接货站台触发光电信号，无码上货模式启用');
          this.addNoCodeTrayToUpLoadQueue('一楼接货站台', this.nonSterileOne);
        } else if (this.elevatorOneFloorScanCode !== '') {
          this.addLog(`一楼接货站台扫码数据：${this.elevatorOneFloorScanCode}`);
          this.addToUpLoadQueue(
            this.elevatorOneFloorScanCode,
            '一楼接货站台',
            this.nonSterileOne
          );
        }
      }
    },
    // 一楼接货站台扫码数据
    elevatorOneFloorScanCode: {
      async handler(newVal) {
        if (
          newVal !== '' &&
          this.scanPhotoelectricSignal.bit0 === '1' &&
          !this.noCodeUpload
        ) {
          this.addLog(`一楼接货站台扫码数据：${newVal}`);
          this.addToUpLoadQueue(newVal, '一楼接货站台', this.nonSterileOne);
        }
      }
    },
    // 一楼缓存区光电信号
    'scanPhotoelectricSignal.bit1'(newVal) {
      if (newVal === '0') {
        this.oneFloorElevatorScanCode = '';
        this.addLog('一楼缓存区光电信号无货，已清空一楼缓存区扫码数据');
      }
      if (newVal === '1' && this.oneFloorElevatorScanCode !== '') {
        this.addLog(`一楼缓存区扫码数据：${this.oneFloorElevatorScanCode}`);
        // 判断是否消毒，如果消毒则此托盘进入下一队列，如果不消毒直接发走
        this.addToCartLoadQueue(this.oneFloorElevatorScanCode);
      }
    },
    // 一楼缓存区扫码数据
    oneFloorElevatorScanCode: {
      async handler(newVal) {
        if (newVal !== '' && this.scanPhotoelectricSignal.bit1 === '1') {
          this.addLog(`一楼缓存区扫码数据：${newVal}`);
          this.addToCartLoadQueue(newVal);
        }
      }
    },
    // 二楼接货站台光电信号
    'scanPhotoelectricSignal.bit2'(newVal) {
      if (newVal === '0') {
        this.elevatorTwoFloorScanCode = '';
        this.addLog('二楼接货站台光电信号无货，已清空二楼接货站台扫码数据');
      }
      if (newVal === '1') {
        if (this.noCodeUpload) {
          // 无码上货模式，直接添加托盘信息
          this.addLog('二楼接货站台触发光电信号，无码上货模式启用');
          this.addNoCodeTrayToUpLoadQueue('二楼接货站台', this.nonSterileTwo);
        } else if (this.elevatorTwoFloorScanCode !== '') {
          this.addLog(`二楼接货站台扫码数据：${this.elevatorTwoFloorScanCode}`);
          this.addToUpLoadQueue(
            this.elevatorTwoFloorScanCode,
            '二楼接货站台',
            this.nonSterileTwo
          );
        }
      }
    },
    // 二楼接货站台扫码数据
    elevatorTwoFloorScanCode: {
      async handler(newVal) {
        if (newVal !== '' && this.scanPhotoelectricSignal.bit2 === '1') {
          this.addLog(`二楼接货站台扫码数据：${newVal}`);
          this.addToUpLoadQueue(newVal, '二楼接货站台', this.nonSterileTwo);
        }
      }
    },
    // 三楼接货站台光电信号
    'scanPhotoelectricSignal.bit4'(newVal) {
      if (newVal === '0') {
        this.elevatorThreeFloorScanCode = '';
        this.addLog('三楼接货站台光电信号无货，已清空三楼接货站台扫码数据');
      }
      if (newVal === '1') {
        if (this.noCodeUpload) {
          // 无码上货模式，直接添加托盘信息
          this.addLog('三楼接货站台触发光电信号，无码上货模式启用');
          this.addNoCodeTrayToUpLoadQueue('三楼接货站台', this.nonSterileThree);
        } else if (this.elevatorThreeFloorScanCode !== '') {
          this.addLog(
            `三楼接货站台扫码数据：${this.elevatorThreeFloorScanCode}`
          );
          this.addToUpLoadQueue(
            this.elevatorThreeFloorScanCode,
            '三楼接货站台',
            this.allowUploadThree,
            this.nonSterileThree
          );
        }
      }
    },
    // 三楼接货站台扫码数据
    elevatorThreeFloorScanCode: {
      async handler(newVal) {
        if (newVal !== '' && this.scanPhotoelectricSignal.bit4 === '1') {
          this.addLog(`三楼接货站台扫码数据：${newVal}`);
          this.addToUpLoadQueue(
            newVal,
            '三楼接货站台',
            this.allowUploadThree,
            this.nonSterileThree
          );
        }
      }
    },
    // 四楼接货站台光电信号
    'scanPhotoelectricSignal.bit5'(newVal) {
      if (newVal === '0') {
        this.elevatorFourFloorScanCode = '';
        this.addLog('四楼接货站台光电信号无货，已清空四楼接货站台扫码数据');
      }
      if (newVal === '1') {
        if (this.noCodeUpload) {
          // 无码上货模式，直接添加托盘信息
          this.addLog('四楼接货站台触发光电信号，无码上货模式启用');
          this.addNoCodeTrayToUpLoadQueue('四楼接货站台', this.nonSterileFour);
        } else if (this.elevatorFourFloorScanCode !== '') {
          this.addLog(
            `四楼接货站台扫码数据：${this.elevatorFourFloorScanCode}`
          );
          this.addToUpLoadQueue(
            this.elevatorFourFloorScanCode,
            '四楼接货站台',
            this.nonSterileFour
          );
        }
      }
    },
    // 四楼接货站台扫码数据
    elevatorFourFloorScanCode: {
      async handler(newVal) {
        if (newVal !== '' && this.scanPhotoelectricSignal.bit5 === '1') {
          this.addLog(`四楼接货站台扫码数据：${newVal}`);
          this.addToUpLoadQueue(newVal, '四楼接货站台', this.nonSterileFour);
        }
      }
    },
    // 一楼D灭菌"有载信号"/光电占位,
    'scanPhotoelectricSignal.bit7'(newVal) {
      if (newVal === '0') {
        this.elevatorDDisinfectionScanCode = '';
        this.addLog('D扫码数据清空');
      }
      if (newVal === '1' && this.elevatorDDisinfectionScanCode !== '') {
        this.addLog(`D扫码数据：${this.elevatorDDisinfectionScanCode}`);
        this.addToUpLoadQueueDE(
          this.elevatorDDisinfectionScanCode,
          'D',
          this.nonSterileD
        );
      }
    },
    // 一楼D灭菌"有载信号"/光电占位,扫码数据
    elevatorDDisinfectionScanCode: {
      async handler(newVal) {
        if (newVal !== '' && this.scanPhotoelectricSignal.bit7 === '1') {
          this.addLog(`D扫码数据：${newVal}`);
          this.addToUpLoadQueueDE(newVal, 'D', this.nonSterileD);
        }
      }
    },
    // 一楼E灭菌"有载信号"/光电占位,
    'scanPhotoelectricSignal.bit8'(newVal) {
      if (newVal === '0') {
        this.elevatorEDisinfectionScanCode = '';
        this.addLog('E扫码数据清空');
      }
      if (newVal === '1' && this.elevatorEDisinfectionScanCode !== '') {
        this.addLog(`E扫码数据：${this.elevatorEDisinfectionScanCode}`);
        this.addToUpLoadQueueDE(
          this.elevatorEDisinfectionScanCode,
          'E',
          this.nonSterileE
        );
      }
    },
    // 一楼E灭菌"有载信号"/光电占位,扫码数据
    elevatorEDisinfectionScanCode: {
      async handler(newVal) {
        if (newVal !== '' && this.scanPhotoelectricSignal.bit8 === '1') {
          this.addLog(`E扫码数据：${newVal}`);
          this.addToUpLoadQueueDE(
            newVal,
            'E',
            this.allowUploadE,
            this.nonSterileE
          );
        }
      }
    },
    // 请求上位机下发任务(判断去灭菌还是非灭菌）
    requestUploadTask: {
      async handler(newVal) {
        if (newVal === '1') {
          this.addLog('请求上位机下发任务(判断去灭菌还是非灭菌）');
          // 先筛选出分发区中未处理过的第一个托盘数据，属性state等于'1'代表已经处理过。'0'代表没有处理过
          if (this.queues[1]?.trayInfo) {
            const targetIndex = this.queues[1].trayInfo.findIndex(
              (tray) => tray.state === '0'
            );

            if (targetIndex !== -1) {
              const targetTray = this.queues[1].trayInfo[targetIndex];
              if (targetTray.isTerile === 0) {
                // 给PLC发送去立库的命令
                ipcRenderer.send('writeValuesToPLC', 'DBW542', 1);
                setTimeout(() => {
                  ipcRenderer.send('writeValuesToPLC', 'DBW542', 0);
                }, 500);
              } else {
                // 给PLC发送去预热房的命令
                ipcRenderer.send('writeValuesToPLC', 'DBW542', 2);
                setTimeout(() => {
                  ipcRenderer.send('writeValuesToPLC', 'DBW542', 0);
                }, 500);
              }
              this.queues[1].trayInfo[targetIndex] = {
                ...targetTray,
                state: '1'
              };
            } else {
              // 报错
              this.addLog('分发区中未处理过的第一个托盘数据不存在', 'error');
            }
          }
        }
      }
    },
    requestUploadTaskPreheatingCar: {
      async handler(newVal) {
        // 请求上位机下发任务(预热小车前）
        if (newVal === '1') {
          this.sendToPreheatingRoom();
        }
      }
    },
    // 监听缓冲区数量变化
    bufferQuantity: {
      async handler(newVal, oldVal) {
        // 判断与老数据相比是增加1还是减少1，如果增加1则把分发区的第一个托盘信息加入到缓冲区，同时把原队列的第一个托盘信息删除
        if (newVal > oldVal) {
          if (this.queues[1].trayInfo.length > 0) {
            // 查找state为1，并且isTerile为1的第一个托盘，加入到缓冲区队列
            const targetTrayIndex = this.queues[1].trayInfo.findIndex(
              (tray) => tray.state === '1' && tray.isTerile === 1
            );
            if (targetTrayIndex !== -1) {
              // 找到符合条件的托盘
              this.addLog(
                this.queues[1].trayInfo[targetTrayIndex].trayCode +
                  '进入缓冲区。'
              );
              // 把符合条件的托盘信息加入到缓冲区
              this.queues[2].trayInfo.push(
                this.queues[1].trayInfo[targetTrayIndex]
              );
              // 从分发区删除该托盘信息
              this.queues[1].trayInfo.splice(targetTrayIndex, 1);
            } else {
              this.addLog('分发区没有找到符合条件的托盘(已执行且灭菌的托盘)');
            }
            // 如果bufferQuantity达到16个，则显示小车1设置去哪个预热房的按钮
            if (newVal === 16) {
              this.showCar1SetPreheatingRoom = true;
            }
          }
        } else {
          // 减少到0说明不再执行了。
          if (newVal === 0) {
            this.preWarmTrayCode = '';
          }
        }
      }
    },
    // 监听非灭菌缓存区数量变化,
    nonSterileunload: {
      async handler(newVal, oldVal) {
        if (newVal > oldVal) {
          if (this.queues[1].trayInfo.length > 0) {
            // 查找state为1，并且isTerile为1的第一个托盘，加入到缓冲区队列
            const targetTrayIndex = this.queues[1].trayInfo.findIndex(
              (tray) => tray.state === '1' && tray.isTerile === 0
            );
            if (targetTrayIndex !== -1) {
              // 找到符合条件的托盘
              this.addLog(
                this.queues[1].trayInfo[targetTrayIndex].trayCode +
                  '进入非灭菌缓存区。'
              );
              // 把符合条件的托盘信息加入到缓冲区
              this.queues[14].trayInfo.push(
                this.queues[1].trayInfo[targetTrayIndex]
              );
              // 从分发区删除该托盘信息
              this.queues[1].trayInfo.splice(targetTrayIndex, 1);
            } else {
              this.addLog('分发区没有找到符合条件的托盘(已执行且不灭菌的托盘)');
            }
            // 如果bufferQuantity达到16个，则显示小车1设置去哪个预热房的按钮
            if (newVal === 16) {
              this.showCar1SetPreheatingRoom = true;
            }
          }
        } else {
          // 说明是减少了,说明是出库了
          if (newVal < oldVal) {
            if (this.queues[14].trayInfo.length > 0) {
              // 把B3队列的第一个元素数据展示到下货
              this.addLog(
                `托盘信息：${this.queues[14].trayInfo[0].trayCode} 出库`
              );
              this.currentOutTrayInfo = this.queues[14].trayInfo[0];
              console.log(this.currentOutTrayInfo);
              // 删除B3队列的第一个元素
              this.queues[14].trayInfo.shift();
            }
          }
        }
      }
    },
    // 监听A1数量变化
    'aLineQuantity.a1'(newVal, oldVal) {
      // 判断与老数据相比是增加1还是减少1，如果增加1则把缓冲区的第一个托盘信息加入到A1队列，同时把原队列的第一个托盘信息删除
      if (newVal > oldVal) {
        if (this.queues[2].trayInfo.length > 0) {
          this.addLog(this.queues[2].trayInfo[0].trayCode + '进入A1队列。');
          // 把缓冲区的托盘信息加入到A1队列
          this.queues[3].trayInfo.push(this.queues[2].trayInfo[0]);
          this.queues[2].trayInfo.shift();
          // 如果缓冲区队列数量变为0，则重新隐藏小车1设置去哪个预热房的按钮
          if (this.queues[2].trayInfo.length === 0) {
            this.showCar1SetPreheatingRoom = false;
          }
        }
      } else {
        // 说明是减少了,说明是出库了
        console.log('a1减少', newVal);
        if (newVal === 0) {
          console.log('a1减少为0');
          this.disinfectionTrayCode = '';
        }
      }
    },
    // 监听B1数量变化
    'bLineQuantity.b1'(newVal, oldVal) {
      // 判断与老数据相比是增加1还是减少1，如果增加1则把A1队列的第一个托盘信息加入到B1队列，同时把原队列的第一个托盘信息删除
      if (newVal > oldVal) {
        if (this.queues[2].trayInfo.length > 0) {
          this.addLog(this.queues[2].trayInfo[0].trayCode + '进入B1队列。');
          // 把A1队列的托盘信息加入到B1队列
          this.queues[4].trayInfo.push(this.queues[2].trayInfo[0]);
          this.queues[2].trayInfo.shift();
          // 如果缓冲区队列数量变为0，则重新隐藏小车1设置去哪个预热房的按钮
          if (this.queues[2].trayInfo.length === 0) {
            this.showCar1SetPreheatingRoom = false;
          }
        }
      } else {
        // 说明是减少了,说明是出库了
        if (newVal === 0) {
          this.disinfectionTrayCode = '';
        }
      }
    },
    // 监听C1数量变化
    'cLineQuantity.c1'(newVal, oldVal) {
      // 判断与老数据相比是增加1还是减少1，如果增加1则把B1队列的第一个托盘信息加入到C1队列，同时把原队列的第一个托盘信息删除
      if (newVal > oldVal) {
        if (this.queues[2].trayInfo.length > 0) {
          this.addLog(this.queues[2].trayInfo[0].trayCode + '进入C1队列。');
          // 把B1队列的托盘信息加入到C1队列
          this.queues[5].trayInfo.push(this.queues[2].trayInfo[0]);
          this.queues[2].trayInfo.shift();
          // 如果缓冲区队列数量变为0，则重新隐藏小车1设置去哪个预热房的按钮
          if (this.queues[2].trayInfo.length === 0) {
            this.showCar1SetPreheatingRoom = false;
          }
        }
      } else {
        // 说明是减少了,说明是出库了
        if (newVal === 0) {
          this.disinfectionTrayCode = '';
        }
      }
    },
    // 监听A2数量变化
    'aLineQuantity.a2'(newVal, oldVal) {
      // 说明是增加了
      if (newVal > oldVal) {
        // 先判断当前选择发送的是A2么
        if (this.disinfectionRoomSelectedTo === 'A') {
          // 看看A2是从disinfectionRoomSelectedFrom哪个口发过来
          if (this.disinfectionRoomSelectedFrom === 'A') {
            // 把A1的第一个元素加到A2队列,同时删除A1的第一个元素
            // 判断A1队列是否为空
            if (this.queues[3].trayInfo.length > 0) {
              this.queues[6].trayInfo.push(this.queues[3].trayInfo[0]);
              this.queues[3].trayInfo.shift();
            } else {
              this.addLog('A1队列空，无法发送A2');
            }
          } else if (this.disinfectionRoomSelectedFrom === 'B') {
            // 把B1的第一个元素加到A2队列,同时删除B1的第一个元素
            // 判断B1队列是否为空
            if (this.queues[4].trayInfo.length > 0) {
              this.queues[6].trayInfo.push(this.queues[4].trayInfo[0]);
              this.queues[4].trayInfo.shift();
            } else {
              this.addLog('B1队列空，无法发送A2');
            }
          } else if (this.disinfectionRoomSelectedFrom === 'C') {
            // 把C1的第一个元素加到A2队列,同时删除C1的第一个元素
            // 判断C1队列是否为空
            if (this.queues[5].trayInfo.length > 0) {
              this.queues[6].trayInfo.push(this.queues[5].trayInfo[0]);
              this.queues[5].trayInfo.shift();
            } else {
              this.addLog('C1队列空，无法发送A2');
            }
          }
        } else {
          // 不是设置发往A2的，但是A2却减少了，说明有问题，直接报警
          this.addLog('未设置发送到A2，程序错误！报警！');
        }
      } else {
        // 说明是减少了,说明是出库了
        if (newVal === 0) {
          this.analysisTrayCode = '';
        }
      }
    },
    // 监视B2数量变化
    'bLineQuantity.b2'(newVal, oldVal) {
      // 说明是增加了
      if (newVal > oldVal) {
        // 先判断当前选择发送的是B2么
        if (this.disinfectionRoomSelectedTo === 'B') {
          // 看看B2是从disinfectionRoomSelectedFrom哪个口发过来
          if (this.disinfectionRoomSelectedFrom === 'A') {
            // 把A1的第一个元素加到B2队列,同时删除A1的第一个元素
            // 判断A1队列是否为空
            if (this.queues[3].trayInfo.length > 0) {
              this.queues[7].trayInfo.push(this.queues[3].trayInfo[0]);
              this.queues[3].trayInfo.shift();
            } else {
              this.addLog('A1队列空，无法发送B2');
            }
          } else if (this.disinfectionRoomSelectedFrom === 'B') {
            // 把B1的第一个元素加到B2队列,同时删除B1的第一个元素
            // 判断B1队列是否为空
            if (this.queues[4].trayInfo.length > 0) {
              this.queues[7].trayInfo.push(this.queues[4].trayInfo[0]);
              this.queues[4].trayInfo.shift();
            } else {
              this.addLog('B1队列空，无法发送B2');
            }
          } else if (this.disinfectionRoomSelectedFrom === 'C') {
            // 把C1的第一个元素加到B2队列,同时删除C1的第一个元素
            // 判断C1队列是否为空
            if (this.queues[5].trayInfo.length > 0) {
              this.queues[7].trayInfo.push(this.queues[5].trayInfo[0]);
              this.queues[5].trayInfo.shift();
            } else {
              this.addLog('C1队列空，无法发送B2');
            }
          }
        } else {
          // 不是设置发往B2的，但是B2却减少了，说明有问题，直接报警
          this.addLog('未设置发送到B2，程序错误！报警！');
        }
      } else {
        // 说明是减少了,说明是出库了
        if (newVal === 0) {
          this.analysisTrayCode = '';
        }
      }
    },
    // 监视C2数量变化
    'cLineQuantity.c2'(newVal, oldVal) {
      // 说明是增加了
      if (newVal > oldVal) {
        // 先判断当前选择发送的是C2么
        if (this.disinfectionRoomSelectedTo === 'C') {
          // 看看C2是从disinfectionRoomSelectedFrom哪个口发过来
          if (this.disinfectionRoomSelectedFrom === 'A') {
            // 把A1的第一个元素加到C2队列,同时删除A1的第一个元素
            // 判断A1队列是否为空
            if (this.queues[3].trayInfo.length > 0) {
              this.queues[8].trayInfo.push(this.queues[3].trayInfo[0]);
              this.queues[3].trayInfo.shift();
            } else {
              this.addLog('A1队列空，无法发送C2');
            }
          } else if (this.disinfectionRoomSelectedFrom === 'B') {
            // 把B1的第一个元素加到C2队列,同时删除B1的第一个元素
            // 判断B1队列是否为空
            if (this.queues[4].trayInfo.length > 0) {
              this.queues[8].trayInfo.push(this.queues[4].trayInfo[0]);
              this.queues[4].trayInfo.shift();
            } else {
              this.addLog('B1队列空，无法发送C2');
            }
          } else if (this.disinfectionRoomSelectedFrom === 'C') {
            // 把C1的第一个元素加到C2队列,同时删除C1的第一个元素
            // 判断C1队列是否为空
            if (this.queues[5].trayInfo.length > 0) {
              this.queues[8].trayInfo.push(this.queues[5].trayInfo[0]);
              this.queues[5].trayInfo.shift();
            } else {
              this.addLog('C1队列空，无法发送C2');
            }
          }
        } else {
          // 不是设置发往C2的，但是C2却减少了，说明有问题，直接报警
          this.addLog('未设置发送到C2，程序错误！报警！');
        }
      } else {
        // 说明是减少了,说明是出库了
        if (newVal === 0) {
          this.analysisTrayCode = '';
        }
      }
    },
    // 监听A3数量变化
    'aLineQuantity.a3'(newVal, oldVal) {
      // 说明是增加了
      if (newVal > oldVal) {
        // 先判断当前选择发送的是A3么
        if (this.warehouseSelectedTo === 'A') {
          // 看看A3是从disinfectionRoomSelectedFrom哪个口发过来
          if (this.warehouseSelectedFrom === 'A') {
            // 把A2的第一个元素加到A3队列,同时删除A2的第一个元素
            // 判断A2队列是否为空
            if (this.queues[6].trayInfo.length > 0) {
              this.queues[9].trayInfo.push(this.queues[6].trayInfo[0]);
              this.queues[6].trayInfo.shift();
            } else {
              this.addLog('A2队列空，无法发送A3');
            }
          } else if (this.warehouseSelectedFrom === 'B') {
            // 把B2的第一个元素加到A3队列,同时删除B2的第一个元素
            // 判断B2队列是否为空
            if (this.queues[7].trayInfo.length > 0) {
              this.queues[9].trayInfo.push(this.queues[7].trayInfo[0]);
              this.queues[7].trayInfo.shift();
            } else {
              this.addLog('B2队列空，无法发送A3');
            }
          } else if (this.warehouseSelectedFrom === 'C') {
            // 把C2的第一个元素加到A3队列,同时删除C2的第一个元素
            // 判断C2队列是否为空
            if (this.queues[8].trayInfo.length > 0) {
              this.queues[9].trayInfo.push(this.queues[8].trayInfo[0]);
              this.queues[8].trayInfo.shift();
            } else {
              this.addLog('C2队列空，无法发送A3');
            }
          }
        } else {
          // 不是设置发往A3的，但是A3却减少了，说明有问题，直接报警
          this.addLog('未设置发送到A3，程序错误！报警！');
        }
      } else {
        // 说明是减少了,说明是出库了
        if (newVal < oldVal) {
          // 先判断当前选择发送的是A3么
          if (this.outWarehouseSelected === 'A') {
            // 把A3第一个元素数据展示到下货 删除，同时把A3队列的第一个元素删除
            if (this.queues[9].trayInfo.length > 0) {
              // 把A3队列的第一个元素数据展示到下货
              this.addLog(
                `托盘信息：${this.queues[9].trayInfo[0].trayCode} 出库`
              );
              this.currentOutTrayInfo = this.queues[9].trayInfo[0];
              // 删除A3队列的第一个元素
              this.queues[9].trayInfo.shift();
            } else {
              this.addLog('A3队列空，无法出库');
            }
            if (newVal === 0) {
              this.outWarehouseTrayCode = '';
            }
          } else {
            // 不是设置出库A3的，但是A3却减少了，说明有问题，直接报警
            this.addLog('未设置出库A3，程序错误！报警！');
          }
        }
      }
    },
    // 监听B3数量变化
    'bLineQuantity.b3'(newVal, oldVal) {
      // 说明是增加了
      if (newVal > oldVal) {
        // 先判断当前选择发送的是B3么
        if (this.warehouseSelectedTo === 'B') {
          // 看看B3是从disinfectionRoomSelectedFrom哪个口发过来
          if (this.warehouseSelectedFrom === 'A') {
            // 把A2的第一个元素加到B3队列,同时删除A2的第一个元素
            // 判断A2队列是否为空
            if (this.queues[6].trayInfo.length > 0) {
              this.queues[10].trayInfo.push(this.queues[6].trayInfo[0]);
              this.queues[6].trayInfo.shift();
            } else {
              this.addLog('A2队列空，无法发送B3');
            }
          } else if (this.warehouseSelectedFrom === 'B') {
            // 把B2的第一个元素加到B3队列,同时删除B2的第一个元素
            // 判断B2队列是否为空
            if (this.queues[7].trayInfo.length > 0) {
              this.queues[10].trayInfo.push(this.queues[7].trayInfo[0]);
              this.queues[7].trayInfo.shift();
            } else {
              this.addLog('B2队列空，无法发送B3');
            }
          } else if (this.warehouseSelectedFrom === 'C') {
            // 把C2的第一个元素加到B3队列,同时删除C2的第一个元素
            // 判断C2队列是否为空
            if (this.queues[8].trayInfo.length > 0) {
              this.queues[10].trayInfo.push(this.queues[8].trayInfo[0]);
              this.queues[8].trayInfo.shift();
            } else {
              this.addLog('C2队列空，无法发送B3');
            }
          }
        } else {
          // 不是设置发往B3的，但是B3却减少了，说明有问题，直接报警
          this.addLog('未设置发送到B3，程序错误！报警！');
        }
      } else {
        // 说明是减少了,说明是出库了
        if (newVal < oldVal) {
          // 先判断当前选择发送的是B3么
          if (this.outWarehouseSelected === 'B') {
            // 把B3第一个元素数据展示到下货 删除，同时把B3队列的第一个元素删除
            if (this.queues[10].trayInfo.length > 0) {
              // 把B3队列的第一个元素数据展示到下货
              this.addLog(
                `托盘信息：${this.queues[10].trayInfo[0].trayCode} 出库`
              );
              this.currentOutTrayInfo = this.queues[10].trayInfo[0];
              // 删除B3队列的第一个元素
              this.queues[10].trayInfo.shift();
            }
          } else {
            // 不是设置出库B3的，但是B3却减少了，说明有问题，直接报警
            this.addLog('未设置出库B3，程序错误！报警！');
          }
          if (newVal === 0) {
            this.outWarehouseTrayCode = '';
          }
        }
      }
    },
    // 监听C3数量变化
    'cLineQuantity.c3'(newVal, oldVal) {
      // 说明是增加了
      if (newVal > oldVal) {
        // 先判断当前选择发送的是C3么
        if (this.warehouseSelectedTo === 'C') {
          // 看看C3是从disinfectionRoomSelectedFrom哪个口发过来
          if (this.warehouseSelectedFrom === 'A') {
            // 把A2的第一个元素加到C3队列,同时删除A2的第一个元素
            // 判断A2队列是否为空
            if (this.queues[6].trayInfo.length > 0) {
              this.queues[11].trayInfo.push(this.queues[6].trayInfo[0]);
              this.queues[6].trayInfo.shift();
            } else {
              this.addLog('A2队列空，无法发送C3');
            }
          } else if (this.warehouseSelectedFrom === 'B') {
            // 把B2的第一个元素加到C3队列,同时删除B2的第一个元素
            // 判断B2队列是否为空
            if (this.queues[7].trayInfo.length > 0) {
              this.queues[11].trayInfo.push(this.queues[7].trayInfo[0]);
              this.queues[7].trayInfo.shift();
            } else {
              this.addLog('B2队列空，无法发送C3');
            }
          } else if (this.warehouseSelectedFrom === 'C') {
            // 把C2的第一个元素加到C3队列,同时删除C2的第一个元素
            // 判断C2队列是否为空
            if (this.queues[8].trayInfo.length > 0) {
              this.queues[11].trayInfo.push(this.queues[8].trayInfo[0]);
              this.queues[8].trayInfo.shift();
            } else {
              this.addLog('C2队列空，无法发送C3');
            }
          }
        } else {
          // 不是设置发往C3的，但是C3却减少了，说明有问题，直接报警
          this.addLog('未设置发送到C3，程序错误！报警！');
        }
      } else {
        // 说明是减少了,说明是出库了
        if (newVal < oldVal) {
          // 先判断当前选择发送的是C3么
          if (this.outWarehouseSelected === 'C') {
            // 把C3第一个元素数据展示到下货 删除，同时把C3队列的第一个元素删除
            if (this.queues[11].trayInfo.length > 0) {
              // 把C3队列的第一个元素数据展示到下货
              this.addLog(
                `托盘信息：${this.queues[11].trayInfo[0].trayCode} 出库`
              );
              this.currentOutTrayInfo = this.queues[11].trayInfo[0];
              // 删除C3队列的第一个元素
              this.queues[11].trayInfo.shift();
            } else {
              this.addLog('C3队列空，无法出库');
            }
          } else {
            // 不是设置出库C3的，但是C3却减少了，说明有问题，直接报警
            this.addLog('未设置出库C3，程序错误！报警！');
          }
          if (newVal === 0) {
            this.outWarehouseTrayCode = '';
          }
        }
      }
    },
    // 监听D数量变化,
    dLineQuantity(newVal, oldVal) {
      // 说明是减少了,说明是出库了
      if (newVal < oldVal) {
        // 先判断当前选择发送的是D么
        if (this.outWarehouseSelected === 'D') {
          // 把D第一个元素数据展示到下货 删除，同时把D队列的第一个元素删除
          if (this.queues[12].trayInfo.length > 0) {
            // 把D队列的第一个元素数据展示到下货
            this.addLog(
              `托盘信息：${this.queues[12].trayInfo[0].trayCode} 出库`
            );
            this.currentOutTrayInfo = this.queues[12].trayInfo[0];
            // 删除D队列的第一个元素
            this.queues[12].trayInfo.shift();
          } else {
            this.addLog('D队列空，无法出库');
          }
        } else {
          // 不是设置出库D的，但是D却减少了，说明有问题，直接报警
          this.addLog('未设置出库D，程序错误！报警！');
        }
      }
    },
    // 监听E数量变化,
    eLineQuantity(newVal, oldVal) {
      // 说明是减少了,说明是出库了
      if (newVal < oldVal) {
        // 先判断当前选择发送的是E么
        if (this.outWarehouseSelected === 'E') {
          // 把E第一个元素数据展示到下货 删除，同时把E队列的第一个元素删除
          if (this.queues[13].trayInfo.length > 0) {
            // 把E队列的第一个元素数据展示到下货
            this.addLog(
              `托盘信息：${this.queues[13].trayInfo[0].trayCode} 出库`
            );
            this.currentOutTrayInfo = this.queues[13].trayInfo[0];
            // 删除E队列的第一个元素
            this.queues[13].trayInfo.shift();
          } else {
            this.addLog('E队列空，无法出库');
          }
        } else {
          // 不是设置出库E的，但是E却减少了，说明有问题，直接报警
          this.addLog('未设置出库E，程序错误！报警！');
        }
      }
    },
    // ---- 新增：监听小车位置数值变化 ----
    'cartPositionValues.cart1'(newVal) {
      this.updateCartPositionByValue(1, newVal);
    },
    'cartPositionValues.cart2'(newVal) {
      this.updateCartPositionByValue(2, newVal);
    },
    'cartPositionValues.cart3'(newVal) {
      this.updateCartPositionByValue(3, newVal);
    },
    'cartPositionValues.cart4'(newVal) {
      this.updateCartPositionByValue(4, newVal);
    },
    // ---- 监听小车位置数值变化结束 ----

    // ---- 新增：监听指定队列的 trayInfo 变化 ----
    'queues.0.trayInfo': {
      // 监听上货区 (ID: 1)
      deep: true,
      handler(newVal, oldVal) {
        this.updateQueueInfo(1);
      }
    },
    'queues.1.trayInfo': {
      // 监听分发区 (ID: 2)
      deep: true,
      handler(newVal, oldVal) {
        this.updateQueueInfo(2);
      }
    },
    'queues.2.trayInfo': {
      // 监听缓存区 (ID: 3)
      deep: true,
      handler(newVal, oldVal) {
        this.updateQueueInfo(3);
      }
    },
    'queues.3.trayInfo': {
      // 监听 A1 (ID: 4)
      deep: true,
      handler(newVal, oldVal) {
        this.updateQueueInfo(4);
      }
    },
    'queues.4.trayInfo': {
      // 监听 B1 (ID: 5)
      deep: true,
      handler(newVal, oldVal) {
        this.updateQueueInfo(5);
      }
    },
    'queues.5.trayInfo': {
      // 监听 C1 (ID: 6)
      deep: true,
      handler(newVal, oldVal) {
        this.updateQueueInfo(6);
      }
    },
    'queues.6.trayInfo': {
      // 监听 A2 (ID: 7)
      deep: true,
      handler(newVal, oldVal) {
        this.updateQueueInfo(7);
      }
    },
    'queues.7.trayInfo': {
      // 监听 B2 (ID: 8)
      deep: true,
      handler(newVal, oldVal) {
        this.updateQueueInfo(8);
      }
    },
    'queues.8.trayInfo': {
      // 监听 C2 (ID: 9)
      deep: true,
      handler(newVal, oldVal) {
        this.updateQueueInfo(9);
      }
    },
    'queues.9.trayInfo': {
      // 监听 A3 (ID: 10)
      deep: true,
      handler(newVal, oldVal) {
        this.updateQueueInfo(10);
      }
    },
    'queues.10.trayInfo': {
      // 监听 B3 (ID: 11)
      deep: true,
      handler(newVal, oldVal) {
        this.updateQueueInfo(11);
      }
    },
    'queues.11.trayInfo': {
      // 监听 C3 (ID: 12)
      deep: true,
      handler(newVal, oldVal) {
        this.updateQueueInfo(12);
      }
    },
    'queues.12.trayInfo': {
      // 监听 D (ID: 13)
      deep: true,
      handler(newVal, oldVal) {
        this.updateQueueInfo(13);
      }
    },
    'queues.13.trayInfo': {
      // 监听 E (ID: 14)
      deep: true,
      handler(newVal, oldVal) {
        this.updateQueueInfo(14);
      }
    },
    'queues.14.trayInfo': {
      // 监听非灭菌缓存区 (ID: 15)
      deep: true,
      handler(newVal, oldVal) {
        this.updateQueueInfo(15);
      }
    }
    // ---- 监听指定队列的 trayInfo 变化结束 ----
  },
  methods: {
    // 判断是否消毒，如果消毒则此托盘进入分发区队列，如果不消毒直接发走
    addToCartLoadQueue(trayCode) {
      // 判断上货区队列是否有托盘信息
      if (this.queues[0].trayInfo.length > 0) {
        // 如果启用无码上货模式，直接处理第一个托盘，不检查托盘号匹配
        if (this.noCodeUpload) {
          // 取出队列中的第一个托盘信息
          const trayInfo = this.queues[0].trayInfo.shift();
          // 托盘信息进入下一队列
          this.queues[1].trayInfo.push(trayInfo);
          this.addLog(
            `无码上货模式 - 托盘信息：${trayInfo.trayCode} 进入分发区`
          );
        } else {
          // 正常模式下检查第一个托盘的托盘号是否与入参匹配
          if (this.queues[0].trayInfo[0].trayCode === trayCode) {
            // 取出队列中的第一个托盘信息
            const trayInfo = this.queues[0].trayInfo.shift();
            // 托盘信息进入下一队列
            this.queues[1].trayInfo.push(trayInfo);
            this.addLog(`托盘信息：${trayInfo.trayCode} 进入分发区`);
          } else {
            this.addLog(
              `托盘号不匹配，读码：${trayCode}，队列第一个托盘：${this.queues[0].trayInfo[0].trayCode}`
            );
          }
        }
      } else {
        this.addLog(`上货区队列为空，无法执行出库操作`);
      }
    },
    // 添加货物到上货区队列
    addToUpLoadQueue(trayCode, trayFrom, nonSterile) {
      // 遍历上货区托盘号，先通过托盘号判断此托盘是不是已经在上货区上货了
      if (this.queues[0].trayInfo.length > 0) {
        for (const tray of this.queues[0].trayInfo) {
          if (tray.trayCode === trayCode) {
            this.addLog(`托盘号：${trayCode} 已在上货区上货`);
            this.$message.warning(`托盘号：${trayCode} 已在上货区上货`);
            return; // 这样就会跳出整个 addToUpLoadQueue 方法
          }
        }
      }
      // 通过trayCode 查询erp数据
      const params = {
        trayCode: trayCode.trim()
      };
      HttpUtilwms.post('/api/app/query_received_record', params)
        .then((res) => {
          // this.queues[0]： 上货区
          if (res.data && res.data.items && res.data.items.length > 0) {
            const paramInsert = {
              orderId: res.data.items[0].orderId,
              productCode: res.data.items
                .map((item) => item.materialCode)
                .join('/'),
              productName: res.data.items
                .map((item) => item.materialName)
                .join('/'),
              trayCode: trayCode,
              receiptOrderCode: res.data.receiptOrderCode,
              inPut: res.data.items[0].inPut,
              isTerile: nonSterile ? 0 : res.data.items[0].isTerile,
              detailList: JSON.stringify(res.data.items),
              orderStatus: '0'
            };
            HttpUtil.post('/order/insert', paramInsert).then((resInsert) => {
              if (resInsert.data == 1) {
                this.addLog(
                  trayFrom + `上货区队列添加货物：${trayCode}，插入成功`
                );
                const trayInfo = {
                  trayCode: trayCode,
                  trayTime: moment().format('YYYY-MM-DD HH:mm:ss'),
                  orderId: paramInsert.orderId,
                  productCode: paramInsert.productCode,
                  productName: paramInsert.productName,
                  isTerile: paramInsert.isTerile,
                  receiptOrderCode: paramInsert.receiptOrderCode,
                  state: '0',
                  sendTo: '' // 发到哪个预热房，发送的时候更新
                };
                this.queues[0].trayInfo.push(trayInfo);
                this.addLog(trayFrom + `上货区队列添加货物：${trayCode}`);
                this.nowScanTrayInfo = {
                  trayCode: trayInfo.trayCode,
                  orderId: trayInfo.orderId,
                  productName: trayInfo.productName,
                  isTerile: trayInfo.isTerile === 1 ? '消毒' : '不消毒',
                  inPut: trayFrom
                };
              }
            });
          } else {
            this.addLog(
              trayFrom +
                `托盘信息接口查询失败！：${trayCode}，远程托盘接口返回信息${res.data}`
            );
            this.nowScanTrayInfo = {};
          }
        })
        .catch((err) => {
          this.$message.error('查询队列失败，请重试' + err);
          // 没查询到货物信息，直接报警
          this.addLog(trayFrom + `上货区队列添加货物失败：${trayCode}`);
          this.nowScanTrayInfo = {};
        });
    },
    // 添加扫码数据到D队列,
    addToUpLoadQueueDE(trayCode, trayFrom, nonSterile) {
      // 通过trayCode 查询erp数据
      const params = {
        trayCode: trayCode,
        invalidFlag: 0,
        orderStatus: 0
      };
      HttpUtil.post('/order/selectList', params)
        .then((res) => {
          // this.queues[0]： 上货区
          if (res.data && res.data.length > 0) {
            const trayInfo = {
              trayCode: res.data[0].trayCode,
              trayTime: moment().format('YYYY-MM-DD HH:mm:ss'),
              orderId: res.data[0].orderId,
              productCode: res.data[0].productCode,
              productName: res.data[0].productName,
              isTerile: nonSterile ? 0 : res.data[0].isTerile
            };
            const queueIndex = trayFrom === 'D' ? 12 : 13;
            this.queues[queueIndex].trayInfo.push(trayInfo);
            this.addLog(trayFrom + `${trayFrom}队列添加货物：${trayCode}`);
            this.nowScanTrayInfo = {
              trayCode: trayInfo.trayCode,
              orderId: trayInfo.orderId,
              productName: trayInfo.productName,
              isTerile: trayInfo.isTerile === 1 ? '消毒' : '不消毒',
              inPut: trayFrom
            };
          } else {
            this.addLog(trayFrom + `${trayFrom}队列添加货物失败：${trayCode}`);
            this.nowScanTrayInfo = {};
          }
        })
        .catch((err) => {
          this.$message.error('查询队列失败，请重试' + err);
          // 没查询到货物信息，直接报警
          this.addLog(trayFrom + `${trayFrom}队列添加货物失败：${trayCode}`);
          this.nowScanTrayInfo = {};
        });
    },
    // 无码上货直接添加托盘信息
    addNoCodeTrayToUpLoadQueue(trayFrom, nonSterile) {
      const trayInfo = {
        trayCode: 'no-tray-code',
        trayTime: moment().format('YYYY-MM-DD HH:mm:ss'),
        orderId: 'NO-ORDER',
        productCode: 'NO-PRODUCT',
        productName: '无码产品',
        isTerile: nonSterile ? 0 : 1,
        state: '0',
        sendTo: ''
      };
      this.queues[0].trayInfo.push(trayInfo);
      this.addLog(trayFrom + `无码上货区队列添加货物：no-tray-code`);
      this.nowScanTrayInfo = {
        trayCode: trayInfo.trayCode,
        orderId: trayInfo.orderId,
        productName: trayInfo.productName,
        isTerile: trayInfo.isTerile === 1 ? '消毒' : '不消毒',
        inPut: trayFrom
      };
    },
    // 切换无码上货状态
    toggleNoCodeUpload() {
      this.noCodeUpload = !this.noCodeUpload;
      if (this.noCodeUpload) {
        this.$message.success('已启用无码上货模式，触发光电信号将直接添加托盘');
        this.addLog('无码上货模式已启用');
      } else {
        this.$message.info('已关闭无码上货模式，恢复正常扫码流程');
        this.addLog('无码上货模式已关闭');
      }
    },
    changeQueueExpanded() {
      this.isQueueExpanded = !this.isQueueExpanded;
      // 当展开面板时，刷新当前选中队列的托盘信息
      if (this.isQueueExpanded && this.selectedQueueIndex !== -1) {
        this.showTrays(this.selectedQueueIndex);
      }
    },
    // 显示订单查询对话框
    showOrderQueryDialog() {
      this.orderQueryDialogVisible = true;
    },
    toggleButtonState(button) {
      this.buttonStates = {
        start: false,
        stop: false,
        reset: false,
        fault_reset: false,
        clear: false
      };
      if (button === 'start') {
        this.$confirm('确定要全线启动吗？', '提示', {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        })
          .then(() => {
            ipcRenderer.send('writeValuesToPLC', 'DBW502', 1);
            setTimeout(() => {
              ipcRenderer.send('writeValuesToPLC', 'DBW502', 0);
            }, 500);
            this.buttonStates[button] = !this.buttonStates[button];
            this.$message.success('全线启动成功');
            this.addLog('全线启动成功');
          })
          .catch(() => {
            // 用户取消操作，不做任何处理
          });
      } else if (button === 'stop') {
        this.$confirm('确定要全线停止吗？', '提示', {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        })
          .then(() => {
            ipcRenderer.send('writeValuesToPLC', 'DBW504', 1);
            setTimeout(() => {
              ipcRenderer.send('writeValuesToPLC', 'DBW504', 0);
            }, 500);
            this.buttonStates[button] = !this.buttonStates[button];
            this.$message.success('全线停止成功');
            this.addLog('全线停止成功');
          })
          .catch(() => {
            // 用户取消操作，不做任何处理
          });
      } else if (button === 'reset') {
        this.$confirm('确定要全线暂停吗？', '提示', {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        })
          .then(() => {
            this.buttonStates[button] = !this.buttonStates[button];
            ipcRenderer.send('writeValuesToPLC', 'DBW506', 1);
            setTimeout(() => {
              ipcRenderer.send('writeValuesToPLC', 'DBW506', 0);
            }, 500);
            this.$message.success('全线暂停成功');
            this.addLog('全线暂停成功');
          })
          .catch(() => {
            // 用户取消操作，不做任何处理
          });
      } else if (button === 'fault_reset') {
        this.$confirm('确定要故障复位吗？', '提示', {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        })
          .then(() => {
            ipcRenderer.send('writeValuesToPLC', 'DBW508', 1);
            setTimeout(() => {
              ipcRenderer.send('writeValuesToPLC', 'DBW508', 0);
            }, 500);
            this.$message.success('故障复位成功');
            this.addLog('故障复位成功');
          })
          .catch(() => {
            // 用户取消操作，不做任何处理
          });
      } else if (button === 'clear') {
        this.$confirm('确定要全线清空吗？', '提示', {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        })
          .then(() => {
            // 把所有的队列，初试状态都清空
            this.queues.forEach((queue) => {
              queue.trayInfo = [];
            });
            this.nowScanTrayInfo = {};
            this.runningLogs = []; // 修改为空数组
            this.alarmLogs = []; // 修改为空数组
            this.nowTrays = [];
            // 添加复选框状态-一楼允许上货
            this.allowUploadOne = false;
            // 添加复选框状态-一楼是否非灭菌（默认灭菌）
            this.nonSterileOne = false;
            // 添加复选框状态-二楼允许上货
            this.allowUploadTwo = false;
            // 添加复选框状态-二楼是否非灭菌（默认灭菌）
            this.nonSterileTwo = false;
            // 添加复选框状态-三楼允许上货
            this.allowUploadThree = false;
            // 添加复选框状态-三楼是否非灭菌（默认灭菌）
            this.nonSterileThree = false;
            // 添加复选框状态-四楼允许上货
            this.allowUploadFour = false;
            // 添加复选框状态-四楼是否非灭菌（默认灭菌）
            this.nonSterileFour = false;
            // 添加复选框状态-D灭菌柜允许上货
            this.allowUploadD = false;
            // 添加复选框状态-D灭菌柜是否非灭菌（默认灭菌）
            this.nonSterileD = false;
            // 添加复选框状态-E灭菌柜允许上货
            this.allowUploadE = false;
            // 添加复选框状态-E灭菌柜是否非灭菌（默认灭菌）
            this.nonSterileE = false;
            // 显示小车1设置去哪个预热房的按钮
            this.showCar1SetPreheatingRoom = false;
            // 显示小车设置去哪个预热房的按钮
            this.preheatingRoomSelected = '';
            // 灭菌出发地
            this.disinfectionRoomSelectedFrom = '';
            // 灭菌目的地
            this.disinfectionRoomSelectedTo = '';
            // 立库出发地
            this.warehouseSelectedFrom = '';
            // 立库目的地
            this.warehouseSelectedTo = '';
            // 出库选择
            this.outWarehouseSelected = '';
            // 当前出库托盘数据
            this.currentOutTrayInfo = {
              trayCode: '',
              productName: '',
              isTerile: ''
            };
            this.$message.success('全线清空成功');
            this.addLog('全线清空成功');
          })
          .catch(() => {
            // 用户取消操作，不做任何处理
          });
      }
    },
    formatTime(timestamp) {
      const date = new Date(timestamp);
      return date.toLocaleTimeString('zh-CN', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });
    },
    markAsRead(log) {
      if (log.type === 'alarm') {
        log.unread = false;
      }
    },
    initializeMarkers() {
      this.$nextTick(() => {
        this.updateMarkerPositions();
        window.addEventListener('resize', this.updateMarkerPositions);
      });
    },
    updateMarkerPositions() {
      const images = document.querySelectorAll('.floor-image');
      images.forEach((image) => {
        const imageWrapper = image.parentElement;
        if (!imageWrapper) return;

        const markers = imageWrapper.querySelectorAll(
          '.marker, .marker-with-panel, .marker-with-button, .queue-marker, .motor-marker, .preheating-room-marker'
        );
        const carts = imageWrapper.querySelectorAll('.cart-container');
        const wrapperRect = imageWrapper.getBoundingClientRect();

        // 计算图片的实际显示区域
        const displayedWidth = image.width;
        const displayedHeight = image.height;
        const scaleX = displayedWidth / image.naturalWidth;
        const scaleY = displayedHeight / image.naturalHeight;

        // 计算图片在容器中的偏移量
        const imageOffsetX = (wrapperRect.width - displayedWidth) / 2;
        const imageOffsetY = (wrapperRect.height - displayedHeight) / 2;

        markers.forEach((marker) => {
          const x = parseFloat(marker.dataset.x);
          const y = parseFloat(marker.dataset.y);
          if (!isNaN(x) && !isNaN(y)) {
            marker.style.left = `${imageOffsetX + x * scaleX}px`;
            marker.style.top = `${imageOffsetY + y * scaleY}px`;
          }
        });

        // 更新小车位置和大小
        carts.forEach((cart) => {
          const x = parseFloat(cart.dataset.x);
          const y = parseFloat(cart.dataset.y);
          const width = parseFloat(cart.dataset.width);
          if (!isNaN(x) && !isNaN(y)) {
            cart.style.left = `${imageOffsetX + x * scaleX}px`;
            cart.style.top = `${imageOffsetY + y * scaleY}px`;
            if (!isNaN(width)) {
              cart.style.width = `${width * scaleX}px`;
            }
          }
        });
      });
    },
    beforeDestroy() {
      window.removeEventListener('resize', this.updateMarkerPositions);
    },
    // 根据PLC数值更新小车位置
    updateCartPositionByValue(cartId, value) {
      const cart = this.carts.find((c) => c.id === cartId);
      if (!cart) return;

      // 获取对应小车的y轴范围
      const yRange = this.cartYRanges[`cart${cartId}`];
      if (!yRange) return;

      // 获取PLC数值范围
      const plcRanges = {
        cart1: { min: 0, max: 1450 },
        cart2: { min: 0, max: 1010 },
        cart3: { min: 0, max: 1010 },
        cart4: { min: 0, max: 1880 }
      };

      const plcRange = plcRanges[`cart${cartId}`];
      if (!plcRange) return;

      // 计算比例
      const ratio = value / plcRange.max;

      // 根据比例计算y轴位置（PLC原点对应y轴最小值，PLC终点对应y轴最大值）
      const yPosition = yRange.min + (yRange.max - yRange.min) * ratio;

      // 更新小车位置
      cart.y = Math.round(yPosition);

      // 更新视图
      this.$nextTick(() => {
        this.updateMarkerPositions();
      });
    },
    showTrays(index) {
      if (index < 0 || index >= this.queues.length) {
        this.nowTrays = [];
        return;
      }

      this.selectedQueueIndex = index;
      const selectedQueue = this.queues[index];

      if (!selectedQueue) {
        this.nowTrays = [];
        return;
      }

      try {
        // 确保 trayInfo 是数组
        const trayInfo = Array.isArray(selectedQueue.trayInfo)
          ? selectedQueue.trayInfo
          : [];

        this.nowTrays = trayInfo
          .map((tray) => ({
            id: tray.trayCode || '',
            name: tray.trayCode ? `托盘 ${tray.trayCode}` : '未知托盘',
            time: tray.trayTime || '',
            isTerile: tray.isTerile,
            sendTo: tray.sendTo || '', // 添加sendTo属性
            state: tray.state || '' // 添加state属性
          }))
          .filter((tray) => tray.id); // 过滤掉没有 id 的托盘
      } catch (error) {
        console.error('处理托盘信息时出错:', error);
        this.nowTrays = [];
      }
    },
    handleDragStart(event, tray, queueIndex) {
      if (!tray || queueIndex === undefined) return;

      this.isDragging = true;
      this.draggedTray = tray;
      this.dragSourceQueue = queueIndex;

      event.dataTransfer.effectAllowed = 'move';
      event.dataTransfer.setData('text/plain', tray.id);

      setTimeout(() => {
        event.target.classList.add('dragging');
      }, 0);
    },
    handleDragEnd(event) {
      this.isDragging = false;
      event.target.classList.remove('dragging');
    },
    async handleDrop(targetQueueIndex) {
      if (
        !this.draggedTray ||
        this.dragSourceQueue === null ||
        targetQueueIndex === null
      )
        return;
      if (this.dragSourceQueue === targetQueueIndex) return;

      const sourceQueue = this.queues[this.dragSourceQueue];
      const targetQueue = this.queues[targetQueueIndex];

      if (!sourceQueue || !targetQueue) {
        this.$message.error('队列不存在，无法移动托盘');
        return;
      }

      sourceQueue.trayInfo = Array.isArray(sourceQueue.trayInfo)
        ? sourceQueue.trayInfo
        : [];
      targetQueue.trayInfo = Array.isArray(targetQueue.trayInfo)
        ? targetQueue.trayInfo
        : [];

      try {
        if (!this.draggedTray.id) {
          throw new Error('托盘信息无效');
        }

        const trayIndex = sourceQueue.trayInfo.findIndex(
          (t) => t.trayCode === this.draggedTray.id
        );
        if (trayIndex === -1) {
          throw new Error('找不到要移动的托盘');
        }

        const [movedTray] = sourceQueue.trayInfo.splice(trayIndex, 1);
        targetQueue.trayInfo.push(movedTray);

        // 更新队列数据
        this.updateQueueTrays(sourceQueue.id, sourceQueue.trayInfo);
        this.updateQueueTrays(targetQueue.id, targetQueue.trayInfo);

        const currentQueueIndex = this.selectedQueueIndex;
        if (
          currentQueueIndex === targetQueueIndex ||
          currentQueueIndex === this.dragSourceQueue
        ) {
          this.$nextTick(() => {
            this.showTrays(currentQueueIndex);
          });
        }

        // 添加托盘移动日志
        this.addLog(
          `托盘 ${movedTray.trayCode} 从 ${sourceQueue.queueName} 移动到 ${targetQueue.queueName}`
        );

        this.$message({
          type: 'success',
          message: `托盘 ${movedTray.trayCode} 已成功移动到 ${targetQueue.queueName}`,
          duration: 2000
        });
      } catch (error) {
        console.error('移动托盘时出错:', error);
        this.$message.error(error.message || '移动托盘失败，请重试');
      } finally {
        this.draggedTray = null;
        this.dragSourceQueue = null;
        this.isDragging = false;
      }
    },
    clearAllQrCodes() {
      this.elevatorOneFloorScanCode = '';
      this.elevatorTwoFloorScanCode = '';
      this.elevatorThreeFloorScanCode = '';
      this.elevatorFourFloorScanCode = '';
      this.oneFloorElevatorScanCode = '';
    },
    // 添加更新队列托盘的方法
    updateQueueTrays(queueId, trayInfo) {
      // 查找对应ID的队列
      const queueIndex = this.queues.findIndex((queue) => queue.id === queueId);
      if (queueIndex !== -1) {
        // 直接更新前端队列数据
        this.queues[queueIndex].trayInfo = trayInfo;
        // 添加日志
        this.addLog(`队列 ${this.queues[queueIndex].queueName} 数据已更新`);
      } else {
        this.$message.error('找不到队列ID: ' + queueId);
      }
    },
    async deleteTray(tray) {
      if (!this.selectedQueue) return;

      try {
        // 确认是否删除
        await this.$confirm('确认要删除该托盘吗？', '提示', {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        });

        // 从队列中移除托盘
        const trayIndex = this.selectedQueue.trayInfo.findIndex(
          (t) => t.trayCode === tray.id
        );
        if (trayIndex > -1) {
          this.selectedQueue.trayInfo.splice(trayIndex, 1);

          // 更新队列数据
          this.updateQueueTrays(
            this.selectedQueue.id,
            this.selectedQueue.trayInfo
          );

          // 刷新显示
          this.showTrays(this.selectedQueueIndex);

          // 添加删除托盘日志
          this.addLog(
            `托盘 ${tray.id} 已从 ${this.selectedQueue.queueName} 删除`
          );

          this.$message.success('托盘删除成功');
        }
      } catch (error) {
        if (error !== 'cancel') {
          this.$message.error('删除托盘失败，请重试');
        }
      }
    },
    showAddTrayDialog() {
      this.addTrayDialogVisible = true;
      this.newTrayForm = {
        trayCode: '',
        batchId: ''
      };
    },
    async submitAddTray() {
      if (!this.selectedQueue) return;

      try {
        // 表单验证
        await this.$refs.newTrayForm.validate();

        this.isSubmitting = true;
        const currentTime = moment().format('YYYY-MM-DD HH:mm:ss');
        const newTray = {
          trayCode: this.newTrayForm.trayCode,
          trayTime: currentTime,
          batchId: this.newTrayForm.batchId
        };

        // 确保trayInfo是数组
        if (!Array.isArray(this.selectedQueue.trayInfo)) {
          this.selectedQueue.trayInfo = [];
        }

        // 添加新托盘
        this.selectedQueue.trayInfo.push(newTray);

        // 更新队列数据
        this.updateQueueTrays(
          this.selectedQueue.id,
          this.selectedQueue.trayInfo
        );

        // 刷新显示
        this.showTrays(this.selectedQueueIndex);

        // 添加新托盘日志
        this.addLog(
          `新托盘 ${newTray.trayCode} 已添加到 ${this.selectedQueue.queueName}，批次号：${newTray.batchId}`
        );

        this.$message.success('托盘添加成功');
        this.addTrayDialogVisible = false;
      } catch (error) {
        if (error !== 'cancel') {
          this.$message.error('添加托盘失败，请重试');
        }
      } finally {
        this.isSubmitting = false;
      }
    },
    // 点击队列标识
    handleQueueMarkerClick(queueId) {
      // 展开队列面板
      this.isQueueExpanded = true;

      // 找到队列在数组中的索引
      const queueIndex = this.queues.findIndex((q) => q.id === queueId);
      if (queueIndex !== -1) {
        // 选中并显示对应队列
        this.selectedQueueIndex = queueIndex;
        this.showTrays(queueIndex);
      }
    },
    // 添加新的日志方法
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
    },
    toggleBitValue(obj, bit) {
      obj[bit] = obj[bit] === '1' ? '0' : '1';
    },
    updateQuantity(quantityObj, key, change) {
      this[quantityObj][key] = Math.max(
        0,
        parseInt(this[quantityObj][key]) + change
      );
    },
    updateBufferQuantity(change) {
      this.bufferQuantity = Math.max(0, parseInt(this.bufferQuantity) + change);
    },
    updateNonSterileUnload(change) {
      this.nonSterileunload = Math.max(
        0,
        parseInt(this.nonSterileunload) + change
      );
    },
    updateDLineQuantity(change) {
      this.dLineQuantity = Math.max(0, parseInt(this.dLineQuantity) + change);
    },
    updateELineQuantity(change) {
      this.eLineQuantity = Math.max(0, parseInt(this.eLineQuantity) + change);
    },
    // 发送到预热房的方法
    sendToPreheatingRoom() {
      if (!this.preheatingRoomSelected) {
        this.$message.warning('请先选择预热房');
        return;
      }
      // 映射预热房选项到队列索引和子队列名称前缀
      const roomMappings = {
        A: { queueIndex: 3, prefix: 'A1' },
        B: { queueIndex: 4, prefix: 'B1' },
        C: { queueIndex: 5, prefix: 'C1' }
      };

      const mapping = roomMappings[this.preheatingRoomSelected];

      if (mapping) {
        const targetQueue = this.queues[mapping.queueIndex];
        if (!targetQueue || !Array.isArray(targetQueue.trayInfo)) {
          console.error(`队列 ${mapping.prefix} 或其 trayInfo 无效`);
          this.$message.error(`处理 ${mapping.prefix} 预热房队列时出错`);
          return;
        }

        const subQueue1 = `${mapping.prefix}-1`;
        const subQueue2 = `${mapping.prefix}-2`;

        // 统计目标队列中托盘信息中已分配到两个子队列的数量
        const count1 = targetQueue.trayInfo.filter(
          (tray) => tray.sendTo === subQueue1
        ).length;
        const count2 = targetQueue.trayInfo.filter(
          (tray) => tray.sendTo === subQueue2
        ).length;

        // 决定发送到哪个子队列（数量少的优先，相等则优先第一个）
        const targetSendTo = count1 <= count2 ? subQueue1 : subQueue2;

        let trayFoundAndUpdated = false;
        // 遍历缓冲区队列，找到第一个未分配发送目标的托盘
        if (this.queues[2] && Array.isArray(this.queues[2].trayInfo)) {
          for (const tray of this.queues[2].trayInfo) {
            // 确保 tray 是一个有效对象并且有 sendTo 属性
            if (tray && typeof tray === 'object' && tray.sendTo === '') {
              tray.sendTo = targetSendTo;
              trayFoundAndUpdated = true;
              this.addLog(`托盘 ${tray.trayCode} 将发送到 ${targetSendTo}`);
              this.preWarmTrayCode = tray.trayCode;
              this.sendPreheatingToPLC(targetSendTo);
              break; // 找到并更新后退出循环
            }
          }
        } else {
          this.$message.error('处理缓冲区队列时出错');
          return;
        }

        if (!trayFoundAndUpdated) {
          this.$message.warning('缓冲区队列没有需要发送的托盘信息');
          return;
        }
        this.$message.success(`已将托盘分配到预热房 ${targetSendTo}`);
      } else {
        this.$message.error('无效的预热房选项');
      }
    },
    sendPreheatingToPLC(targetSendTo) {
      if (targetSendTo === 'A1-1') {
        // 使用nodeS7协议，给PLC发送 011预热房A1-1启用进货、012预热房A1-2启用进货
        ipcRenderer.send('writeValuesToPLC', 'DBW524', 11);
        setTimeout(() => {
          ipcRenderer.send('writeValuesToPLC', 'DBW524', 0);
        }, 500);
      } else if (targetSendTo === 'A1-2') {
        ipcRenderer.send('writeValuesToPLC', 'DBW524', 12);
        setTimeout(() => {
          ipcRenderer.send('writeValuesToPLC', 'DBW524', 0);
        }, 500);
      } else if (targetSendTo === 'B1-1') {
        ipcRenderer.send('writeValuesToPLC', 'DBW524', 21);
        setTimeout(() => {
          ipcRenderer.send('writeValuesToPLC', 'DBW524', 0);
        }, 500);
      } else if (targetSendTo === 'B1-2') {
        ipcRenderer.send('writeValuesToPLC', 'DBW524', 22);
        setTimeout(() => {
          ipcRenderer.send('writeValuesToPLC', 'DBW524', 0);
        }, 500);
      } else if (targetSendTo === 'C1-1') {
        ipcRenderer.send('writeValuesToPLC', 'DBW524', 31);
        setTimeout(() => {
          ipcRenderer.send('writeValuesToPLC', 'DBW524', 0);
        }, 500);
      } else if (targetSendTo === 'C1-2') {
        ipcRenderer.send('writeValuesToPLC', 'DBW524', 32);
        setTimeout(() => {
          ipcRenderer.send('writeValuesToPLC', 'DBW524', 0);
        }, 500);
      }
    },
    // 发送到灭菌房的方法
    sendToDisinfectionRoom() {
      if (
        !this.disinfectionRoomSelectedFrom ||
        !this.disinfectionRoomSelectedTo
      ) {
        this.$message.warning('请先选择完整');
        return;
      }
      if (this.disinfectionRoomSelectedFrom === 'A') {
        ipcRenderer.send('writeValuesToPLC', 'DBW526', 1);
        setTimeout(() => {
          ipcRenderer.send('writeValuesToPLC', 'DBW526', 0);
        }, 500);
        this.disinfectionTrayCode = this.queues[3].trayInfo[0].trayCode;
      } else if (this.disinfectionRoomSelectedFrom === 'B') {
        ipcRenderer.send('writeValuesToPLC', 'DBW526', 2);
        setTimeout(() => {
          ipcRenderer.send('writeValuesToPLC', 'DBW526', 0);
        }, 500);
        this.disinfectionTrayCode = this.queues[4].trayInfo[0].trayCode;
      } else if (this.disinfectionRoomSelectedFrom === 'C') {
        ipcRenderer.send('writeValuesToPLC', 'DBW526', 3);
        setTimeout(() => {
          ipcRenderer.send('writeValuesToPLC', 'DBW526', 0);
        }, 500);
        this.disinfectionTrayCode = this.queues[5].trayInfo[0].trayCode;
      }
      if (this.disinfectionRoomSelectedTo === 'A') {
        ipcRenderer.send('writeValuesToPLC', 'DBW528', 1);
        setTimeout(() => {
          ipcRenderer.send('writeValuesToPLC', 'DBW528', 0);
        }, 500);
      } else if (this.disinfectionRoomSelectedTo === 'B') {
        ipcRenderer.send('writeValuesToPLC', 'DBW528', 2);
        setTimeout(() => {
          ipcRenderer.send('writeValuesToPLC', 'DBW528', 0);
        }, 500);
      } else if (this.disinfectionRoomSelectedTo === 'C') {
        ipcRenderer.send('writeValuesToPLC', 'DBW528', 3);
        setTimeout(() => {
          ipcRenderer.send('writeValuesToPLC', 'DBW528', 0);
        }, 500);
      }
      this.addLog(
        `执行发送从${this.disinfectionRoomSelectedFrom}预热房到${this.disinfectionRoomSelectedTo}灭菌房操作`
      );
      this.$message.success(
        `已发送从${this.disinfectionRoomSelectedFrom}预热房到${this.disinfectionRoomSelectedTo}灭菌房`
      );
    },
    sendDisinfectionRoomToWarehouse() {
      if (!this.warehouseSelectedFrom || !this.warehouseSelectedTo) {
        this.$message.warning('请先选择完整');
        return;
      }
      if (this.warehouseSelectedFrom === 'A') {
        ipcRenderer.send('writeValuesToPLC', 'DBW530', 1);
        setTimeout(() => {
          ipcRenderer.send('writeValuesToPLC', 'DBW530', 0);
        }, 500);
        this.analysisTrayCode = this.queues[6].trayInfo[0].trayCode;
      } else if (this.warehouseSelectedFrom === 'B') {
        ipcRenderer.send('writeValuesToPLC', 'DBW530', 2);
        setTimeout(() => {
          ipcRenderer.send('writeValuesToPLC', 'DBW530', 0);
        }, 500);
        this.analysisTrayCode = this.queues[7].trayInfo[0].trayCode;
      } else if (this.warehouseSelectedFrom === 'C') {
        ipcRenderer.send('writeValuesToPLC', 'DBW530', 3);
        setTimeout(() => {
          ipcRenderer.send('writeValuesToPLC', 'DBW530', 0);
        }, 500);
        this.analysisTrayCode = this.queues[8].trayInfo[0].trayCode;
      }
      if (this.warehouseSelectedTo === 'A') {
        ipcRenderer.send('writeValuesToPLC', 'DBW532', 1);
        setTimeout(() => {
          ipcRenderer.send('writeValuesToPLC', 'DBW532', 0);
        }, 500);
      } else if (this.warehouseSelectedTo === 'B') {
        ipcRenderer.send('writeValuesToPLC', 'DBW532', 2);
        setTimeout(() => {
          ipcRenderer.send('writeValuesToPLC', 'DBW532', 0);
        }, 500);
      } else if (this.warehouseSelectedTo === 'C') {
        ipcRenderer.send('writeValuesToPLC', 'DBW532', 3);
        setTimeout(() => {
          ipcRenderer.send('writeValuesToPLC', 'DBW532', 0);
        }, 500);
      }
      this.addLog(
        `执行发送从灭菌柜${this.warehouseSelectedFrom}出库到解析库${this.warehouseSelectedTo}入库操作`
      );
      this.$message.success(
        `已发送从灭菌柜${this.warehouseSelectedFrom}出库到解析库${this.warehouseSelectedTo}入库`
      );
    },
    // 发送到立库的方法
    sendToWarehouse() {
      if (!this.outWarehouseSelected) {
        this.$message.warning('请先选择完整');
        return;
      }
      if (this.outWarehouseSelected === 'A') {
        ipcRenderer.send('writeValuesToPLC', 'DBW534', 1);
        setTimeout(() => {
          ipcRenderer.send('writeValuesToPLC', 'DBW534', 0);
        }, 500);
        this.outWarehouseTrayCode = this.queues[9].trayInfo[0].trayCode;
      } else if (this.outWarehouseSelected === 'B') {
        ipcRenderer.send('writeValuesToPLC', 'DBW534', 2);
        setTimeout(() => {
          ipcRenderer.send('writeValuesToPLC', 'DBW534', 0);
        }, 500);
        this.outWarehouseTrayCode = this.queues[10].trayInfo[0].trayCode;
      } else if (this.outWarehouseSelected === 'C') {
        ipcRenderer.send('writeValuesToPLC', 'DBW534', 3);
        setTimeout(() => {
          ipcRenderer.send('writeValuesToPLC', 'DBW534', 0);
        }, 500);
        this.outWarehouseTrayCode = this.queues[11].trayInfo[0].trayCode;
      } else if (this.outWarehouseSelected === 'D') {
        ipcRenderer.send('writeValuesToPLC', 'DBW536', 1);
        setTimeout(() => {
          ipcRenderer.send('writeValuesToPLC', 'DBW536', 0);
        }, 500);
        this.outWarehouseTrayCode = this.queues[12].trayInfo[0].trayCode;
      } else if (this.outWarehouseSelected === 'E') {
        ipcRenderer.send('writeValuesToPLC', 'DBW536', 2);
        setTimeout(() => {
          ipcRenderer.send('writeValuesToPLC', 'DBW536', 0);
        }, 500);
        this.outWarehouseTrayCode = this.queues[13].trayInfo[0].trayCode;
      } else if (this.outWarehouseSelected === 'DE') {
        ipcRenderer.send('writeValuesToPLC', 'DBW536', 3);
        setTimeout(() => {
          ipcRenderer.send('writeValuesToPLC', 'DBW536', 0);
        }, 500);
      }
      this.addLog(`${this.outWarehouseSelected}执行发送出库操作`);
    },
    // 显示小车选择按钮
    showCarSelect() {
      // 判断缓冲区队列有没有托盘信息，没有托盘信息直接返回
      if (this.queues[2].trayInfo.length === 0) {
        this.$message.warning('缓冲区队列没有托盘信息，无法入库');
        return;
      }
      this.showCar1SetPreheatingRoom = true;
    },
    convertToWord(value) {
      if (value < 0) {
        return (value & 0xffff) >>> 0; // 负数转换为无符号的16位整数
      } else {
        return value; // 非负数保持不变
      }
    },
    // 触发请求上位机下发任务(判断去灭菌还是非灭菌)
    triggerRequestUploadTask() {
      this.requestUploadTask = '1';
      setTimeout(() => {
        this.requestUploadTask = '0';
      }, 1000);
    },
    // 触发请求上位机下发任务(预热小车前)
    triggerRequestUploadTaskPreheatingCar() {
      this.requestUploadTaskPreheatingCar = '1';
      setTimeout(() => {
        this.requestUploadTaskPreheatingCar = '0';
      }, 1000);
    },
    handleAllowUpload(type) {
      if (type === '1') {
        console.log('一楼', this.allowUploadOne);
        if (this.allowUploadOne) {
          ipcRenderer.send('writeValuesToPLC', 'DBW512', 1);
          this.addLog('一楼允许上货');
        } else {
          ipcRenderer.send('writeValuesToPLC', 'DBW512', 0);
          this.addLog('一楼禁止上货');
        }
      } else if (type === '2') {
        if (this.allowUploadTwo) {
          ipcRenderer.send('writeValuesToPLC', 'DBW514', 1);
          this.addLog('二楼允许上货');
        } else {
          ipcRenderer.send('writeValuesToPLC', 'DBW514', 0);
          this.addLog('二楼禁止上货');
        }
      } else if (type === '3') {
        if (this.allowUploadThree) {
          ipcRenderer.send('writeValuesToPLC', 'DBW516', 1);
          this.addLog('三楼允许上货');
        } else {
          ipcRenderer.send('writeValuesToPLC', 'DBW516', 0);
          this.addLog('三楼禁止上货');
        }
      } else if (type === '4') {
        if (this.allowUploadFour) {
          ipcRenderer.send('writeValuesToPLC', 'DBW518', 1);
          this.addLog('四楼允许上货');
        } else {
          ipcRenderer.send('writeValuesToPLC', 'DBW518', 0);
          this.addLog('四楼禁止上货');
        }
      } else if (type === 'D') {
        if (this.allowUploadD) {
          ipcRenderer.send('writeValuesToPLC', 'DBW520', 1);
          this.addLog('D允许上货');
        } else {
          ipcRenderer.send('writeValuesToPLC', 'DBW520', 0);
          this.addLog('D禁止上货');
        }
      } else if (type === 'E') {
        if (this.allowUploadE) {
          ipcRenderer.send('writeValuesToPLC', 'DBW522', 1);
          this.addLog('E允许上货');
        } else {
          ipcRenderer.send('writeValuesToPLC', 'DBW522', 0);
          this.addLog('E禁止上货');
        }
      }
    },
    // 更新数据库队列信息
    updateQueueInfo(id) {
      const param = {
        id: id,
        trayInfo: JSON.stringify(this.queues[id - 1].trayInfo)
      };
      HttpUtil.post('/queue_info/update', param).catch((err) => {
        this.$message.error(err);
      });
    },
    // 从数据库加载队列信息
    loadQueueInfoFromDatabase() {
      HttpUtil.post('/queue_info/queryQueueList', {})
        .then((res) => {
          if (res.data && res.data.length > 0) {
            // 遍历数据库返回的队列信息
            res.data.forEach((queueData) => {
              const queueId = queueData.id;
              const queueIndex = queueId - 1; // 数组索引从0开始，队列ID从1开始

              // 确保队列索引有效
              if (queueIndex >= 0 && queueIndex < this.queues.length) {
                try {
                  // 解析托盘信息JSON字符串
                  const trayInfo = queueData.trayInfo
                    ? JSON.parse(queueData.trayInfo)
                    : [];
                  // 赋值给对应的队列
                  this.queues[queueIndex].trayInfo = Array.isArray(trayInfo)
                    ? trayInfo
                    : [];
                  this.addLog(
                    `已加载队列${queueData.queueName || queueId}的托盘信息，共${
                      this.queues[queueIndex].trayInfo.length
                    }个托盘`
                  );
                } catch (error) {
                  console.error(`解析队列${queueId}的托盘信息失败:`, error);
                  this.queues[queueIndex].trayInfo = [];
                  this.addLog(`队列${queueId}托盘信息解析失败，已重置为空`);
                }
              }
            });
            this.addLog('队列信息加载完成');
          } else {
            this.addLog('数据库中暂无队列信息');
          }
        })
        .catch((err) => {
          console.error('加载队列信息失败:', err);
          this.$message.error('加载队列信息失败: ' + err);
          this.addLog('队列信息加载失败');
        });
    }
  }
};
</script>
<style lang="less" scoped>
.smart-workshop {
  width: 100%;
  height: 100%;
  position: relative;
  display: flex;
  flex-direction: column;
  background: radial-gradient(circle, #1a2035, #0f1620);
  padding: 0;
  font-family: 'Roboto', sans-serif;
  overflow: hidden;
  box-sizing: border-box;
  user-select: none;
  .header {
    position: relative;
    width: 100%;
    height: 80px;
    overflow: hidden;
    flex-shrink: 0;
    .header-bg {
      position: absolute;
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .header-content {
      position: relative;
      height: 100%;
      display: flex;
      justify-content: center;
      align-items: center;
      gap: 20px;
      z-index: 1;
      .title {
        font-size: 32px;
        font-weight: bold;
        color: #fff;
        text-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
        letter-spacing: 2px;
      }

      .current-time {
        font-size: 24px;
        color: #fff;
        text-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
      }
    }
  }
  .content-wrapper {
    flex: 1;
    display: flex;
    min-height: 0;
    overflow: hidden;
    .side-info-panel {
      width: 420px;
      display: flex;
      flex-direction: column;
      gap: 10px;
      padding: 8px;
      box-sizing: border-box;
      flex-shrink: 0;
      overflow: hidden;
      .plc-info-section,
      .operation-panel {
        background: rgba(30, 42, 56, 0.8);
        padding: 10px;
        border-radius: 15px;
        box-shadow: 0 10px 20px rgba(0, 0, 0, 0.5);
        color: #f5f5f5;
        box-sizing: border-box;
        .section-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 22px;
          color: #0ac5a8;
          font-weight: 900;
          margin-bottom: 5px;
          .section-title {
            display: flex;
            align-items: center;
            gap: 10px;
          }
          .el-button {
            background: rgba(10, 197, 168, 0.2);
            border: 1px solid rgba(10, 197, 168, 0.3);
            color: #0ac5a8;
            font-size: 12px;
          }
          .el-button:hover {
            background: rgba(10, 197, 168, 0.3);
            border-color: rgba(10, 197, 168, 0.5);
            color: #fff;
          }
        }
        .scrollable-content {
          overflow-y: auto;
        }
      }
      .plc-info-section {
        .scrollable-content {
          .status-overview {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 10px;
            .data-card {
              box-sizing: border-box;
              height: 65px;
              width: 185px;
            }

            .data-card-border {
              width: 100%;
              height: 100%;
              border-radius: 20px;
              background: linear-gradient(135deg, #2b3d51, #3c4c63);
              box-shadow: 0 8px 16px rgba(0, 0, 0, 0.4);
            }

            .data-card-border-borderTop {
              font-weight: 400;
              letter-spacing: 0px;
              color: rgba(189, 189, 189, 1);
              text-align: left;
              vertical-align: top;
              font-size: 13px;
              line-height: 34px;
              padding-left: 12px;
            }
            .granient-text {
              background-image: linear-gradient(
                to right,
                rgba(72, 146, 254, 1),
                rgba(71, 207, 245, 1)
              );
              background-clip: text;
              -webkit-background-clip: text;
              color: transparent;
            }

            .data-card-border-borderDown {
              font-weight: 700;
              letter-spacing: 0px;
              color: rgba(255, 255, 255, 1);
              text-align: left;
              vertical-align: top;
              font-size: 24px;
              line-height: 21px;
              padding-left: 12px;
              /* 添加省略号效果 */
              white-space: nowrap;
              overflow: hidden;
              text-overflow: ellipsis;
              max-width: 100%;
              display: block;
            }
          }
        }
      }
      .log-section {
        background: rgba(30, 42, 56, 0.8);
        padding: 10px;
        border-radius: 15px;
        box-shadow: 0 10px 20px rgba(0, 0, 0, 0.5);
        height: 257px;
        display: flex;
        flex-direction: column;
        flex: 1;
        .section-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0px 0px 8px 0px;
          color: #0ac5a8;
          font-size: 22px;
          font-weight: 900;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
          .log-tabs {
            display: flex;
            gap: 5px;
          }
          .log-tab {
            position: relative;
            font-size: 14px;
            color: rgba(255, 255, 255, 0.6);
            cursor: pointer;
            padding: 5px 15px;
            border-radius: 4px;
            transition: all 0.3s ease;
            .alarm-badge {
              position: absolute;
              top: -8px;
              right: -8px;
              background: #f56c6c;
              color: #fff;
              font-size: 12px;
              padding: 2px 6px;
              border-radius: 10px;
              min-width: 16px;
              height: 16px;
              display: flex;
              align-items: center;
              justify-content: center;
            }
          }
          .log-tab.active {
            color: #fff;
            background: rgba(10, 197, 168, 0.2);
          }
          .log-tab:hover:not(.active) {
            color: #0ac5a8;
          }
        }
        .scrollable-content {
          flex: 1;
          overflow-y: auto;
          padding: 10px 0;
          .log-list {
            padding: 0 10px;
            width: 100%;
            box-sizing: border-box;
            .log-item {
              background: rgba(255, 255, 255, 0.03);
              border-radius: 4px;
              padding: 10px;
              margin-bottom: 8px;
              cursor: pointer;
              width: 100%;
              box-sizing: border-box;
              .log-time {
                font-size: 12px;
                color: rgba(255, 255, 255, 0.4);
                margin-bottom: 6px;
              }
              .log-item-content {
                color: rgba(255, 255, 255, 0.9);
                font-size: 13px;
                line-height: 1.6;
                overflow-wrap: break-word;
                word-wrap: break-word;
                word-break: normal;
                hyphens: auto;
                display: block;
                width: 100%;
                padding-right: 10px;
              }
            }
            .log-item:hover {
              background: rgba(255, 255, 255, 0.05);
            }

            .log-item.alarm {
              background: rgba(245, 108, 108, 0.05);
            }

            .log-item.alarm.unread {
              background: rgba(245, 108, 108, 0.1);
              border-left: 2px solid #f56c6c;
            }
            /* 添加空状态样式 */
            .empty-state {
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              padding: 40px 0;
              color: rgba(255, 255, 255, 0.6);
              i {
                font-size: 48px;
                margin-bottom: 16px;
                color: rgba(255, 255, 255, 0.3);
              }
              p {
                font-size: 14px;
                margin: 0 0 16px 0;
              }
              .el-button {
                color: #0ac5a8;
                font-size: 14px;
                i {
                  font-size: 14px;
                  margin-right: 4px;
                  color: inherit;
                }
              }
              .el-button:hover {
                color: #0db196;
              }
            }
          }
        }
        .scrollable-content::-webkit-scrollbar {
          width: 4px;
        }

        .scrollable-content::-webkit-scrollbar-track {
          background: transparent;
        }

        .scrollable-content::-webkit-scrollbar-thumb {
          background: rgba(10, 197, 168, 0.2);
          border-radius: 2px;
        }

        .scrollable-content::-webkit-scrollbar-thumb:hover {
          background: rgba(10, 197, 168, 0.4);
        }
      }
      .operation-panel {
        .operation-buttons {
          display: flex;
          justify-content: space-between;
          gap: 8px;
          margin-top: 5px;
          padding: 5px;
          button {
            width: 70px;
            height: 70px;
            font-size: 0.8em;
            color: #fff;
            background: linear-gradient(135deg, #0ac5a8, #0f6b58);
            border: none;
            border-radius: 12px;
            box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
            cursor: pointer;
            transition: all 0.3s ease;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            text-align: center;
            padding: 8px;
            gap: 5px;
            i {
              font-size: 1.8em;
            }
            span {
              font-size: 12px;
              margin-top: 4px;
            }
          }
          button:hover {
            background: linear-gradient(135deg, #4caf50, #0f6b58);
            box-shadow: 0 8px 20px rgba(0, 0, 0, 0.4);
          }
          button.pressed {
            background: linear-gradient(135deg, #4caf50, #2e8b57);
            box-shadow: 0 8px 20px rgba(0, 0, 0, 0.5);
            transform: scale(0.95);
          }
        }
      }
    }
    .main-content {
      flex: 1;
      display: flex;
      padding: 8px 8px 8px 0px;
      box-sizing: border-box;
      overflow: hidden;
      height: 100%;
      .floor-container {
        display: flex;
        gap: 10px;
        height: 100%;
        width: 100%;
        min-height: 0;

        .floor-left {
          .floor-image-container {
            flex: 1;
            background: rgba(0, 0, 0, 0.2);
            border-radius: 8px;
            padding: 5px;
            display: flex;
            align-items: center;
            justify-content: center;
            border: 1px solid rgba(255, 255, 255, 0.1);
            min-height: 0;
            height: calc(100% - 50px);
            position: relative;
            .image-wrapper {
              position: relative;
              width: 100%;
              height: 100%;
              display: flex;
              align-items: center;
              justify-content: center;
              .floor-image {
                display: block;
                max-width: 100%;
                max-height: 100%;
                width: auto;
                height: auto;
                object-fit: contain;
              }
              /* --- 光电点位样式 --- */
              .marker {
                position: absolute;
                width: 12px;
                height: 12px;
                transform: translate(-50%, -50%);
                cursor: pointer;
                z-index: 2;
                pointer-events: auto;
                .marker-label {
                  position: absolute;
                  white-space: nowrap;
                  background: #0ac5a8;
                  color: #fff;
                  padding: 4px 8px;
                  border-radius: 4px;
                  font-size: 12px;
                  /* 默认定位在下方 */
                  top: calc(100% + 5px);
                  left: 50%;
                  transform: translateX(-50%);
                  opacity: 0;
                  transition: opacity 0.3s;
                  pointer-events: none; /* 添加此行 */
                }
              }
              .marker::before {
                content: '';
                position: absolute;
                width: 100%;
                height: 100%;
                border-radius: 50%;
                background: rgba(128, 128, 128, 0.8); /* 默认灰色核心 */
              }
              /* 扫描状态 (红色) */
              .marker.scanning::before {
                background: rgba(255, 0, 0, 0.8); /* 红色核心 */
              }

              /* 默认隐藏标签，hover时显示 */
              .marker:hover .marker-label {
                opacity: 1;
                box-shadow: 0 0 0 0 rgba(255, 0, 0, 0); /* 灰色辉光 */
              }
              /* 始终显示标签的点位 */
              .marker-show-label .marker-label {
                opacity: 1;
              }
              /* 控制标签位置的样式 */
              .marker.label-top .marker-label {
                top: auto; /* 重置默认 top */
                bottom: calc(100% + 5px); /* 定位到上方 */
                left: 50%;
                transform: translateX(-50%);
              }
              .marker.label-left .marker-label {
                top: 50%; /* 垂直居中 */
                left: auto; /* 重置默认 left */
                right: calc(100% + 5px); /* 定位到左方 */
                transform: translateY(-50%); /* 垂直居中 */
              }
              .marker.label-right .marker-label {
                top: 50%; /* 垂直居中 */
                left: calc(100% + 5px); /* 定位到右方 */
                transform: translateY(-50%); /* 垂直居中 */
              }
              /* --- 光电点位样式结束 --- */

              /* --- 新增电机点位样式 --- */
              .motor-marker {
                position: absolute;
                width: 12px;
                height: 12px;
                transform: translate(-50%, -50%);
                cursor: pointer;
                z-index: 2;
                pointer-events: auto;
                .marker-label {
                  position: absolute;
                  white-space: nowrap;
                  background: rgba(0, 0, 0, 0.8);
                  color: #fff;
                  padding: 4px 8px;
                  border-radius: 4px;
                  font-size: 12px;
                  /* 默认定位在下方 */
                  top: calc(100% + 5px);
                  left: 50%;
                  transform: translateX(-50%);
                  opacity: 0; /* 默认隐藏 */
                  transition: opacity 0.3s;
                }
              }

              .motor-marker::before {
                content: '';
                position: absolute;
                width: 100%;
                height: 100%;
                background: rgba(128, 128, 128, 0.8); /* 默认灰色方块 */
                /* 无 border-radius，保持方形 */
              }

              .motor-marker.running::before {
                background: #00ff3f; /* 运行状态绿色方块 */
              }

              /* 始终显示电机标签 */
              .motor-marker.marker-show-label .marker-label {
                opacity: 1;
              }
              /* 悬停显示电机标签 */
              .motor-marker:hover .marker-label {
                opacity: 1;
              }

              /* 控制电机标签位置的样式 (复制并适配) */
              .motor-marker.label-top .marker-label {
                top: auto;
                bottom: calc(100% + 5px);
                left: 50%;
                transform: translateX(-50%);
              }
              .motor-marker.label-left .marker-label {
                top: 50%;
                left: auto;
                right: calc(100% + 5px);
                transform: translateY(-50%);
              }
              .motor-marker.label-right .marker-label {
                top: 50%;
                left: calc(100% + 5px);
                transform: translateY(-50%);
              }
              /* --- 电机点位样式结束 --- */

              /* 带数据面板的标识点样式 */
              .marker-with-panel {
                position: absolute;
                width: 16px;
                height: 16px;
                transform: translate(-50%, -50%);
                cursor: pointer;
                z-index: 2;
                .data-panel {
                  position: absolute;
                  background: linear-gradient(135deg, #0e1a27, #3c4c63);
                  border: 1px solid rgba(64, 158, 255, 0.3);
                  border-radius: 8px;
                  padding: 12px;
                  width: 170px;
                  // box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
                  opacity: 0;
                  transition: all 0.3s ease;
                  pointer-events: none;
                  .data-panel-header {
                    font-size: 14px;
                    color: #409eff;
                    margin-bottom: 6px;
                    padding-bottom: 6px;
                    border-bottom: 1px solid rgba(64, 158, 255, 0.2);
                  }
                  .data-panel-content {
                    font-size: 12px;
                    .data-panel-row {
                      display: flex;
                      justify-content: space-between;
                      color: rgba(255, 255, 255, 0.9);
                      .data-panel-label {
                        color: rgba(255, 255, 255, 0.6);
                        font-size: 12px;
                      }
                    }
                    /* 新增：复选框组样式 */
                    .checkbox-group {
                      display: flex;
                      justify-content: space-between; /* 或 space-between */
                      align-items: center;
                      padding-top: 5px; /* 增加一点顶部间距 */
                    }

                    .checkbox-group .el-checkbox {
                      margin-right: 10px; /* 增加复选框之间的间距 */
                    }

                    /* 调整复选框标签颜色 */
                    .checkbox-group :deep(.el-checkbox__label) {
                      color: rgba(255, 255, 255, 0.8); /* 调整标签颜色 */
                      font-size: 12px; /* 调整标签字体大小 */
                    }

                    /* 调整选中状态下的颜色 */
                    .checkbox-group
                      :deep(
                        .el-checkbox__input.is-checked + .el-checkbox__label
                      ) {
                      color: #0ac5a8; /* 选中时标签颜色 */
                    }

                    .checkbox-group
                      :deep(
                        .el-checkbox__input.is-checked .el-checkbox__inner
                      ) {
                      background-color: #0ac5a8; /* 选中时背景色 */
                      border-color: #0ac5a8; /* 选中时边框色 */
                    }
                  }
                }
                /* 面板位置样式 */
                .data-panel.position-right {
                  left: calc(100% + 15px);
                  top: 50%;
                  transform: translateY(-50%);
                }
                .data-panel.position-left {
                  right: calc(100% + 15px);
                  top: 50%;
                  transform: translateY(-50%);
                }
                .data-panel.position-top {
                  bottom: calc(100% + 15px);
                  left: 50%;
                  transform: translateX(-50%);
                }
                .data-panel.position-bottom {
                  top: calc(100% + 15px);
                  left: 50%;
                  transform: translateX(-50%);
                }
                /* 始终显示的面板 */
                .data-panel.always-show {
                  opacity: 1;
                  pointer-events: auto; /* 重新启用指针事件 */
                }
                /* 竖向布局样式 */
                .data-panel.vertical-layout {
                  width: 110px;
                  padding: 8px;
                  .data-panel-row {
                    flex-direction: column;
                    gap: 4px;
                    margin-bottom: 8px;
                    padding-bottom: 8px;
                    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
                  }
                  .data-panel-label {
                    margin-bottom: 2px;
                  }
                }
              }
              /* 悬停时显示面板 */
              .marker-with-panel:hover .data-panel:not(.always-show) {
                opacity: 1;
              }

              /* 带按钮的标识点样式 */
              .marker-with-button {
                position: absolute;
                transform: translate(-50%, -50%);
                z-index: 5;
                cursor: pointer;
              }
              .marker-with-button .warehouse-btn {
                background: linear-gradient(135deg, #0e1a27, #3c4c63);
                color: white;
                font-weight: bold;
                border: none;
                box-shadow: 0 2px 6px rgba(0, 0, 0, 0.4);
                border-radius: 4px;
                padding: 10px 15px;
                transition: all 0.3s ease;
              }
              .marker-with-button .warehouse-btn:hover {
                transform: scale(1.05);
                box-shadow: 0 4px 10px rgba(0, 0, 0, 0.5);
              }

              /* 预热房选择样式 */
              .preheating-room-marker {
                position: absolute;
                transform: translate(-50%, -50%);
                z-index: 10;
                background: linear-gradient(135deg, #005aff 0%, #000000 100%);
                border-radius: 5px;
                box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
                overflow: hidden;
                width: 80px;
                .preheating-room-content {
                  display: flex;
                  flex-direction: column;
                  width: 100%;
                  .preheating-room-header {
                    width: 100%;
                    text-align: center;
                    padding: 4px 0;
                    font-size: 11px;
                    color: white;
                    background-color: rgba(0, 0, 0, 0.2);
                    font-weight: bold;
                  }
                  .preheating-room-body {
                    padding: 6px 8px;
                    display: flex;
                    flex-direction: column;
                    align-items: flex-start;
                    gap: 6px;
                  }
                }
              }
              .preheating-room-marker :deep(.el-select) {
                width: 100%;
              }
              .preheating-room-marker :deep(.el-input__inner) {
                background-color: rgba(255, 255, 255, 0.15);
                border-color: rgba(255, 255, 255, 0.2);
                color: #fff;
                height: 24px;
                line-height: 24px;
                font-size: 11px;
                border-radius: 3px;
                padding: 0 8px;
              }
              .preheating-room-marker :deep(.el-button) {
                background-color: rgba(255, 255, 255, 0.2);
                border-color: rgba(255, 255, 255, 0.3);
                font-size: 11px;
                height: 24px;
                width: 100%;
                padding: 4px 8px;
              }
            }
          }
        }
        .floor-left {
          flex: 1;
          background: rgba(30, 42, 56, 0.8);
          padding: 10px;
          border-radius: 15px;
          box-shadow: 0 10px 20px rgba(0, 0, 0, 0.5);
          color: #f5f5f5;
          display: flex;
          flex-direction: column;
          min-height: 0;
          height: 100%;
          overflow: hidden;
          box-sizing: border-box;
          .floor-title {
            font-size: 22px;
            color: #0ac5a8;
            font-weight: 900;
            padding-bottom: 10px;
            flex-shrink: 0;
          }
          .floor-image-container {
            .image-wrapper {
              .queue-marker {
                position: absolute;
                transform: translate(-50%, -50%);
                cursor: pointer;
                z-index: 10;
                background: rgba(10, 30, 50, 0.85);
                padding: 4px 8px;
                border-radius: 4px;
                border: 1px solid rgba(64, 158, 255, 0.5);
                transition: all 0.3s ease;
                min-width: 40px;
                text-align: center;
                box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);
                color: #ffffff;
                .queue-marker-content {
                  display: flex;
                  flex-direction: column;
                  align-items: center;
                  color: #fff;
                  font-size: 12px;
                  .queue-marker-name {
                    color: #fff;
                  }

                  .queue-marker-count {
                    font-size: 14px;
                    font-weight: bold;
                    color: #409eff;
                  }
                }
              }
              .queue-marker:hover {
                background: rgba(24, 61, 97, 0.9);
                border-color: rgba(64, 158, 255, 0.6);
                box-shadow: 0 2px 8px rgba(0, 0, 0, 0.4);
              }
              /* 添加小车样式 */
              .cart-container {
                position: absolute;
                transform: translate(-50%, -50%);
                z-index: 3;
                display: flex;
                align-items: center;
                justify-content: center;
                cursor: pointer;
              }

              .cart-image {
                width: 100%;
                height: auto;
                object-fit: contain;
              }
            }
          }
        }
      }
    }
  }
  .side-info-panel-queue {
    position: absolute;
    top: 20px;
    right: 20px;
    z-index: 1000;
    display: flex;
    flex-direction: column;
    padding: 0;
    box-sizing: border-box;
    transition: all 0.3s ease;
    pointer-events: auto;
    /* 基础样式 */
    .queue-section {
      background: rgba(30, 42, 56, 0.95);
      border-radius: 15px;
      box-shadow: 0 10px 20px rgba(0, 0, 0, 0.5);
      color: #f5f5f5;
      box-sizing: border-box;
      border: 1px solid rgba(255, 255, 255, 0.1);
      .section-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        cursor: pointer;
        transition: color 0.3s ease;
        font-size: 20px;
        color: #0ac5a8;
        font-weight: 900;
        padding-bottom: 12px;
        margin-bottom: 12px;
        border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        flex-shrink: 0;
      }
      .expandable-content-queue {
        flex: 1;
        min-height: 0;
        display: flex;
        overflow: hidden;
        height: calc(100% - 50px);
        .queue-container {
          flex: 1;
          display: flex;
          background: rgba(30, 42, 56, 0.9);
          border-radius: 12px;
          backdrop-filter: blur(10px);
          padding: 15px;
          gap: 20px;
          overflow: hidden;
          border: 1px solid rgba(255, 255, 255, 0.1);
          height: 100%;
          min-height: 0;
          box-sizing: border-box;
          .queue-container-left {
            width: 280px;
            display: flex;
            flex-direction: column;
            overflow-y: auto;
            padding-right: 15px;
            border-right: 1px solid rgba(255, 255, 255, 0.1);
            height: 100%;
            min-height: 0;
            /* 队列项样式 */
            .queue {
              display: flex;
              justify-content: space-between;
              align-items: center;
              background: rgba(48, 65, 85, 0.9);
              border-radius: 8px;
              padding: 12px 15px;
              margin-bottom: 8px;
              cursor: pointer;
              transition: all 0.3s ease;
              border: 1px solid rgba(255, 255, 255, 0.15);
              .tray-count {
                background: rgba(255, 255, 255, 0.1);
                color: rgba(255, 255, 255, 0.7);
                font-size: 12px;
                padding: 2px 8px;
                border-radius: 10px;
                min-width: 24px;
                text-align: center;
              }
            }

            .queue:hover {
              background: rgba(48, 65, 85, 1);
              border-color: rgba(10, 197, 168, 0.5);
              transform: translateX(2px);
            }

            .queue.active {
              background: rgba(10, 197, 168, 0.15);
              border-color: rgba(10, 197, 168, 0.5);
            }
          }
          /* 滚动条样式 */
          .queue-container-left::-webkit-scrollbar,
          .tray-list::-webkit-scrollbar {
            width: 4px;
          }

          .queue-container-left::-webkit-scrollbar-track,
          .tray-list::-webkit-scrollbar-track {
            background: rgba(0, 0, 0, 0.1);
            border-radius: 2px;
          }

          .queue-container-left::-webkit-scrollbar-thumb,
          .tray-list::-webkit-scrollbar-thumb {
            background: rgba(255, 255, 255, 0.2);
          }

          .queue-container-left::-webkit-scrollbar-thumb:hover,
          .tray-list::-webkit-scrollbar-thumb:hover {
            background: rgba(255, 255, 255, 0.3);
          }
          .queue-container-right {
            flex: 1;
            display: flex;
            flex-direction: column;
            overflow: hidden;
            padding: 0 15px;
            height: 100%;
            min-height: 0;
            .selected-queue-header {
              flex-shrink: 0;
              margin-bottom: 15px;
              padding-bottom: 10px;
              border-bottom: 1px solid rgba(255, 255, 255, 0.1);
              display: flex;
              justify-content: space-between;
              align-items: center;
              h3 {
                margin: 0;
                color: rgba(255, 255, 255, 0.9);
                font-size: 16px;
              }
              .queue-header-actions {
                display: flex;
                align-items: center;
                gap: 12px;
                .el-button {
                  background: rgba(10, 197, 168, 0.2);
                  border: 1px solid rgba(10, 197, 168, 0.3);
                  color: #0ac5a8;
                }
                .el-button:hover:not(:disabled) {
                  background: rgba(10, 197, 168, 0.3);
                  border-color: rgba(10, 197, 168, 0.5);
                  color: #fff;
                }
                .tray-total {
                  background: rgba(255, 255, 255, 0.1);
                  color: rgba(255, 255, 255, 0.7);
                  font-size: 13px;
                  padding: 4px 12px;
                  border-radius: 15px;
                  cursor: pointer;
                }
              }
            }
            .tray-list {
              flex: 1;
              overflow-y: auto;
              min-height: 0;
              padding-right: 5px;

              /* 托盘项样式 */
              .tray-item {
                display: flex;
                justify-content: space-between;
                align-items: center;
                background: rgba(48, 65, 85, 0.9);
                margin: 0 0 8px 0;
                padding: 12px 15px;
                border-radius: 8px;
                cursor: move;
                transition: all 0.3s ease;
                border: 1px solid rgba(255, 255, 255, 0.15);
                position: relative;

                .tray-info {
                  display: flex;
                  flex-direction: column;
                  gap: 4px;
                  width: 100%;
                  .tray-info-row {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    gap: 10px;
                    .tray-name {
                      font-weight: 500;
                      color: rgba(255, 255, 255, 0.9);
                      font-size: 14px;
                    }

                    .tray-batch {
                      font-size: 12px;
                      color: #0ac5a8;
                      background: rgba(10, 197, 168, 0.1);
                      padding: 2px 8px;
                      border-radius: 4px;
                      white-space: nowrap;
                    }
                  }
                  .tray-time {
                    font-size: 12px;
                    color: rgba(255, 255, 255, 0.5);
                  }
                }
                .el-button {
                  position: absolute;
                  right: 10px;
                  top: 50%;
                  transform: translateY(-50%);
                  opacity: 0;
                  transition: opacity 0.3s ease;
                }
              }
              .tray-item:hover {
                background: rgba(48, 65, 85, 1);
                border-color: rgba(10, 197, 168, 0.5);
                transform: translateX(2px);
                .el-button {
                  opacity: 1;
                }
              }
              .tray-item:last-child {
                margin-bottom: 0;
              }
              .tray-item.dragging {
                opacity: 0.6;
                transform: scale(0.98);
                border: 1px dashed rgba(255, 255, 255, 0.3);
              }
              /* 添加空状态样式 */
              .empty-state {
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                padding: 40px 0;
                color: rgba(255, 255, 255, 0.6);
                i {
                  font-size: 48px;
                  margin-bottom: 16px;
                  color: rgba(255, 255, 255, 0.3);
                }
                p {
                  font-size: 14px;
                  margin: 0 0 16px 0;
                }
                .el-button {
                  color: #0ac5a8;
                  font-size: 14px;
                  i {
                    font-size: 14px;
                    margin-right: 4px;
                    color: inherit;
                  }
                }
                .el-button:hover {
                  color: #0db196;
                }
              }
            }
          }
        }
      }
    }
    /* 展开状态的样式 */
    .queue-section.expanded {
      padding: 15px;
      width: 800px;
      height: 100%;
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }
    /* 收起状态的样式 */
    .queue-section:not(.expanded) {
      width: 40px;
      height: 40px;
      padding: 0;
      background: none;
      box-shadow: none;
      border: none;
      .section-header {
        width: 40px;
        height: 40px;
        border-radius: 50%;
        background: #0ac5a8;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        box-shadow: 0 2px 12px rgba(0, 0, 0, 0.3);
        transition: all 0.3s ease;
        padding: 0;
        span {
          display: none;
        }
        i {
          color: #fff;
          font-size: 20px;
          animation: rotate 10s linear infinite;
        }
      }
      .section-header:hover {
        transform: scale(1.1);
        background: #0db196;
      }
    }
  }

  @keyframes rotate {
    from {
      transform: rotate(0deg);
    }
    to {
      transform: rotate(360deg);
    }
  }
}

/* 添加新的测试面板样式 */
.test-panel-container {
  position: absolute; /* 修改位置，为测试按钮留出空间 */
  right: 80px; /* 修改位置，为队列按钮留出空间 */
  top: 20px;
  z-index: 1000;
}

.test-toggle-btn {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: #0ac5a8;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.3);
  transition: all 0.3s ease;
}

.test-toggle-btn:hover {
  transform: scale(1.1);
  background: #0db196;
}

.test-toggle-btn i {
  color: #fff;
  font-size: 20px;
  animation: rotate 10s linear infinite;
}

@keyframes rotate {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.test-panel {
  position: absolute;
  right: 50px;
  top: 0;
  width: 300px;
  max-height: 80vh; /* 限制最大高度为视窗高度的80% */
  background: rgba(30, 42, 56, 0.98);
  border: 1px solid rgba(10, 197, 168, 0.3);
  border-radius: 15px;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.5);
  transition: all 0.3s ease;
  transform-origin: top right;
  opacity: 1;
  transform: scale(1);
  display: flex;
  flex-direction: column;
}

.test-panel.collapsed {
  opacity: 0;
  transform: scale(0);
  pointer-events: none;
}

.test-panel-header {
  padding: 15px;
  background: rgba(10, 197, 168, 0.3);
  border-radius: 15px 15px 0 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  color: #0ac5a8;
  font-weight: bold;
  pointer-events: auto;
  flex-shrink: 0;
}

.test-panel-content {
  padding: 15px;
  overflow-y: auto;
  pointer-events: auto;
  flex: 1;
}

/* 添加滚动条样式 */
.test-panel-content::-webkit-scrollbar {
  width: 4px;
}

.test-panel-content::-webkit-scrollbar-track {
  background: rgba(0, 0, 0, 0.1);
  border-radius: 2px;
}

.test-panel-content::-webkit-scrollbar-thumb {
  background: rgba(10, 197, 168, 0.3);
  border-radius: 2px;
}

.test-panel-content::-webkit-scrollbar-thumb:hover {
  background: rgba(10, 197, 168, 0.5);
}

.test-panel-header i {
  cursor: pointer;
  transition: all 0.3s ease;
}

.test-panel-header i:hover {
  color: #ff4d4f;
}

.test-section {
  margin-bottom: 20px;
  background: rgba(0, 0, 0, 0.4);
  padding: 10px;
  border-radius: 8px;
  border: 1px solid rgba(10, 197, 168, 0.1);
}

.test-label {
  display: block;
  color: #0ac5a8;
  margin-bottom: 10px;
  font-size: 14px;
  font-weight: bold;
}

.position-buttons {
  display: flex;
  gap: 5px;
  flex-wrap: wrap;
  pointer-events: auto;
}

.position-btn {
  padding: 6px 12px;
  background: rgba(10, 197, 168, 0.3);
  border: 1px solid rgba(10, 197, 168, 0.5);
  color: #fff;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
  transition: all 0.3s ease;
}

.position-btn:hover {
  background: rgba(10, 197, 168, 0.5);
}

.position-btn:active {
  transform: scale(0.95);
}

/* 小车位置滑块样式 */
.cart-position-test-container {
  display: flex;
  flex-direction: column;
  gap: 15px;
  padding: 10px;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 8px;
}

.cart-position-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.cart-position-label {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.8);
  font-weight: bold;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.cart-value {
  background: rgba(10, 197, 168, 0.2);
  border: 1px solid rgba(10, 197, 168, 0.3);
  color: #0ac5a8;
  padding: 2px 8px;
  border-radius: 4px;
  font-weight: bold;
  min-width: 50px;
  text-align: center;
}

.cart-position-slider-container {
  padding: 5px 0;
}

.cart-position-slider {
  width: 100%;
}

.cart-position-slider :deep(.el-slider__runway) {
  background-color: rgba(255, 255, 255, 0.1);
  height: 6px;
}

.cart-position-slider :deep(.el-slider__bar) {
  background-color: #0ac5a8;
  height: 6px;
}

.cart-position-slider :deep(.el-slider__button) {
  border: 2px solid #0ac5a8;
  background-color: #fff;
  width: 20px;
  height: 20px;
}

.cart-position-slider :deep(.el-slider__button:hover) {
  border-color: #0ac5a8;
  box-shadow: 0 0 5px rgba(10, 197, 168, 0.5);
}

/* 测试添加结束 */

.qrcode-test-container {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 10px;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 8px;
}

.qrcode-input-group {
  display: flex;
  align-items: center;
  gap: 10px;
}

.qrcode-label {
  width: 80px;
  font-size: 13px;
  color: rgba(255, 255, 255, 0.8);
  text-align: right;
}

.qrcode-input {
  flex: 1;
}

.qrcode-input :deep(.el-input__inner) {
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(10, 197, 168, 0.3);
  color: #fff;
}

.qrcode-input :deep(.el-input__inner:hover),
.qrcode-input :deep(.el-input__inner:focus) {
  border-color: #0ac5a8;
}

.qrcode-actions {
  display: flex;
  justify-content: flex-end;
  padding-top: 8px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  margin-top: 8px;
}

.qrcode-actions .el-button {
  background: rgba(10, 197, 168, 0.2);
  border: 1px solid rgba(10, 197, 168, 0.3);
  color: #0ac5a8;
}

.qrcode-actions .el-button:hover {
  background: rgba(10, 197, 168, 0.3);
  border-color: rgba(10, 197, 168, 0.5);
  color: #fff;
}

/* 添加队列移动相关样式 */
.queue-move-container {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 10px;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 8px;
}

.queue-select-group {
  display: flex;
  align-items: center;
  gap: 10px;
}

.queue-move-label {
  width: 60px;
  font-size: 13px;
  color: rgba(255, 255, 255, 0.8);
  text-align: right;
}

.queue-move-actions {
  display: flex;
  justify-content: flex-end;
  padding-top: 8px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  margin-top: 8px;
}

.upload-area-actions {
  padding: 10px;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 8px;
  display: flex;
  justify-content: center;
}

.upload-area-actions .el-button {
  background: rgba(10, 197, 168, 0.2);
  border: 1px solid rgba(10, 197, 168, 0.3);
  color: #0ac5a8;
  width: 100%;
}

.upload-area-actions .el-button:hover:not(:disabled) {
  background: rgba(10, 197, 168, 0.3);
  border-color: rgba(10, 197, 168, 0.5);
  color: #fff;
}

.upload-area-actions .el-button:disabled {
  background: rgba(255, 255, 255, 0.1);
  border-color: rgba(255, 255, 255, 0.1);
  color: rgba(255, 255, 255, 0.4);
  cursor: not-allowed;
}

.quantity-test-container {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 10px;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 8px;
}

.quantity-group {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.quantity-title {
  font-size: 14px;
  color: #0ac5a8;
  font-weight: bold;
}

.quantity-controls {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.quantity-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: rgba(30, 42, 56, 0.8);
  border-radius: 4px;
  padding: 8px;
  border: 1px solid rgba(10, 197, 168, 0.1);
  margin-bottom: 5px;

  .quantity-label {
    font-size: 12px;
    color: rgba(255, 255, 255, 0.8);
    min-width: 30px;
  }

  .quantity-value {
    font-size: 14px;
    color: #0ac5a8;
    font-weight: bold;
    min-width: 30px;
    text-align: center;
  }

  .quantity-buttons {
    display: flex;
    gap: 5px;

    .quantity-btn {
      width: 24px;
      height: 24px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 16px;
      background: rgba(10, 197, 168, 0.3);
      border: none;
      border-radius: 4px;
      color: #fff;
      cursor: pointer;
      transition: all 0.3s ease;

      &:hover {
        transform: scale(1.1);
      }

      &:active {
        transform: scale(0.95);
      }

      &.plus {
        background: rgba(10, 197, 168, 0.5);
        &:hover {
          background: rgba(10, 197, 168, 0.7);
        }
      }

      &.minus {
        background: rgba(245, 108, 108, 0.3);
        &:hover {
          background: rgba(245, 108, 108, 0.5);
        }
      }
    }
  }
}

/* 添加新的测试面板样式 */
.task-test-container {
  margin-top: 10px;

  .task-buttons {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }
}
</style>
