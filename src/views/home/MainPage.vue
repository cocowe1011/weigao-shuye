<template>
  <div class="smart-workshop">
    <!-- 内容区包装器 -->
    <div class="content-wrapper">
      <!-- 左侧面板 -->
      <div class="side-info-panel">
        <!-- PLC状态与订单信息区域 -->
        <div class="plc-info-section">
          <div class="section-header">
            当前扫码托盘信息
          </div>
          <div class="scrollable-content" style="margin-top: 5px;">
            <div class="status-overview">
              <div class="data-card">
                <div class="data-card-border">
                  <div class="data-card-border-borderTop granient-text">订单id</div>
                  <div class="data-card-border-borderDown" style="font-size: 1.3vw;">{{ nowScanTrayInfo.orderId || '--' }}</div>
                </div>
              </div>
              <div class="data-card">
                <div class="data-card-border">
                  <div class="data-card-border-borderTop">产品名称</div>
                  <div class="data-card-border-borderDown">{{ nowScanTrayInfo.productName || '--' }}</div>
                </div>
              </div>
              <div class="data-card">
                <div class="data-card-border">
                  <div class="data-card-border-borderTop">进货口</div>
                  <div class="data-card-border-borderDown">{{ nowScanTrayInfo.inPut || '--' }}</div>
                </div>
              </div>
              <div class="data-card">
                <div class="data-card-border">
                  <div class="data-card-border-borderTop">是否消毒</div>
                  <div class="data-card-border-borderDown">{{ nowScanTrayInfo.isTerile || '--' }}</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 操作区 -->
        <div class="operation-panel">
          <div class="section-header">
            操作区
          </div>
          <div class="operation-buttons">
            <button @click="toggleButtonState('start')" :class="{'pressed': buttonStates.start}">
              <i class="el-icon-switch-button"></i><span>全线启动</span>
            </button>
            <button @click="toggleButtonState('stop')" :class="{'pressed': buttonStates.stop}">
              <i class="el-icon-error"></i><span>全线停止</span>
            </button>
            <button @click="toggleButtonState('reset')" :class="{'pressed': buttonStates.reset}">
              <i class="el-icon-video-pause"></i><span>全线暂停</span>
            </button>
            <button @click="toggleButtonState('fault_reset')" :class="{'pressed': buttonStates.fault_reset}">
              <i class="el-icon-refresh"></i><span>故障复位</span>
            </button>
            <button @click="toggleButtonState('clear')" :class="{'pressed': buttonStates.clear}">
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
                <div v-if="unreadAlarms > 0" class="alarm-badge">{{ unreadAlarms }}</div>
              </div>
            </div>
          </div>
          <div class="scrollable-content">
            <div class="log-list">
              <template v-if="currentLogs.length > 0">
                <div 
                  v-for="log in currentLogs" 
                  :key="log.id"
                  :class="['log-item', { 'alarm': log.type === 'alarm', 'unread': log.unread }]" 
                  @click="markAsRead(log)"
                >
                  <div class="log-time">{{ formatTime(log.timestamp) }}</div>
                  <div class="log-item-content">{{ log.message }}</div>
                </div>
              </template>
              <div v-else class="empty-state">
                <i class="el-icon-chat-line-square"></i>
                <p>{{ activeLogType === 'running' ? '暂无运行日志' : '暂无报警日志' }}</p>
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
                <img src="@/assets/changzhou-img/image.png" alt="一楼平面图" class="floor-image" @load="updateMarkerPositions">
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
                    <span class="queue-marker-count">{{ queues.find(q => q.id === marker.queueId)?.trayInfo?.length || 0 }}</span>
                    <span class="queue-marker-name">{{ marker.name }}</span>
                  </div>
                </div>
                <div 
                  class="preheating-room-marker"
                  data-x="610"
                  data-y="1155"
                >
                  <div class="preheating-room-content">
                    <div class="preheating-room-header">预热房选择</div>
                    <div class="preheating-room-body">
                      <el-select v-model="preheatingRoomSelected" placeholder="选择" size="mini">
                        <el-option label="A" value="A"></el-option>
                        <el-option label="B" value="B"></el-option>
                        <el-option label="C" value="C"></el-option>
                      </el-select>
                      <el-button type="primary" size="mini" @click="sendToPreheatingRoom">执行</el-button>
                    </div>
                  </div>
                </div>
                <div 
                  class="preheating-room-marker"
                  data-x="1200"
                  data-y="355"
                >
                  <div class="preheating-room-content">
                    <div class="preheating-room-header">灭菌房选择</div>
                    <div class="preheating-room-body">
                      <el-select v-model="disinfectionRoomSelectedFrom" placeholder="选择" size="mini">
                        <el-option label="A" value="A"></el-option>
                        <el-option label="B" value="B"></el-option>
                        <el-option label="C" value="C"></el-option>
                      </el-select>
                      <span style="font-size: 12px; color: #fff;">发送到：</span>
                      <el-select v-model="disinfectionRoomSelectedTo" placeholder="选择" size="mini">
                        <el-option label="A" value="A"></el-option>
                        <el-option label="B" value="B"></el-option>
                        <el-option label="C" value="C"></el-option>
                      </el-select>
                      <el-button type="primary" size="mini" @click="sendToDisinfectionRoom">执行</el-button>
                    </div>
                  </div>
                </div>
                <div 
                  class="preheating-room-marker"
                  data-x="1600"
                  data-y="400"
                >
                  <div class="preheating-room-content">
                    <div class="preheating-room-header">立库选择</div>
                    <div class="preheating-room-body">
                      <el-select v-model="warehouseSelectedFrom" placeholder="选择" size="mini">
                        <el-option label="A" value="A"></el-option>
                        <el-option label="B" value="B"></el-option>
                        <el-option label="C" value="C"></el-option>
                      </el-select>
                      <span style="font-size: 12px; color: #fff;">发送到：</span>
                      <el-select v-model="warehouseSelectedTo" placeholder="选择" size="mini">
                        <el-option label="A" value="A"></el-option>
                        <el-option label="B" value="B"></el-option>
                        <el-option label="C" value="C"></el-option>
                      </el-select>
                      <el-button type="primary" size="mini" @click="sendToWarehouse">执行</el-button>
                    </div>
                  </div>
                </div>
                <div class="marker-with-button" data-x="1470" data-y="1228">
                  <el-button type="primary" class="warehouse-btn">入库</el-button>
                </div>
                <!-- 修改小车元素 -->
                <div 
                  v-for="cart in carts" 
                  :key="cart.name"
                  class="cart-container" 
                  :data-x="cart.x" 
                  :data-y="cart.y" 
                  :data-width="cart.width"
                  @click="handleCartClick(cart.id)"
                >
                  <img :src="cart.image" :alt="cart.name" class="cart-image">
                </div>
                <!-- 上货扫码区域提示 -->
                <div class="marker-with-panel" data-x="300" data-y="1590">
                  <div class="data-panel" :class="['position-top', { 'always-show': true }]">
                    <div class="data-panel-content">
                      <div class="data-panel-row">
                        <span class="data-panel-label">一楼扫码信息：</span>
                        <span>{{ nowScanTrayInfo.trayCode || '--' }}</span>
                      </div>
                      <div class="data-panel-row checkbox-group">
                        <el-checkbox v-model="allowUploadOne">允许上货</el-checkbox>
                        <el-checkbox v-model="nonSterileOne">非灭菌</el-checkbox>
                      </div>
                    </div>
                  </div>
                </div>
                <div class="marker-with-panel" data-x="490" data-y="920">
                  <div class="data-panel" :class="['position-top', { 'always-show': true }]">
                    <div class="data-panel-content">
                      <div class="data-panel-row">
                        <span class="data-panel-label">二楼扫码信息：</span>
                        <span>{{ nowScanTrayInfo.trayCode || '--' }}</span>
                      </div>
                      <div class="data-panel-row checkbox-group">
                        <el-checkbox v-model="allowUploadTwo">允许上货</el-checkbox>
                        <el-checkbox v-model="nonSterileTwo">非灭菌</el-checkbox>
                      </div>
                    </div>
                  </div>
                </div>
                <div class="marker-with-panel" data-x="490" data-y="535">
                  <div class="data-panel" :class="['position-top', { 'always-show': true }]">
                    <div class="data-panel-content">
                      <div class="data-panel-row">
                        <span class="data-panel-label">三楼扫码信息：</span>
                        <span>{{ nowScanTrayInfo.trayCode || '--' }}</span>
                      </div>
                      <div class="data-panel-row checkbox-group">
                        <el-checkbox v-model="allowUploadThree">允许上货</el-checkbox>
                        <el-checkbox v-model="nonSterileThree">非灭菌</el-checkbox>
                      </div>
                    </div>
                  </div>
                </div>
                <div class="marker-with-panel" data-x="640" data-y="320">
                  <div class="data-panel" :class="['position-top', { 'always-show': true }]">
                    <div class="data-panel-content">
                      <div class="data-panel-row">
                        <span class="data-panel-label">四楼扫码信息：</span>
                        <span>{{ nowScanTrayInfo.trayCode || '--' }}</span>
                      </div>
                      <div class="data-panel-row checkbox-group">
                        <el-checkbox v-model="allowUploadFour">允许上货</el-checkbox>
                        <el-checkbox v-model="nonSterileFour">非灭菌</el-checkbox>
                      </div>
                    </div>
                  </div>
                </div>
                <div class="marker-with-panel" data-x="2200" data-y="1620">
                  <div class="data-panel" :class="['position-top', { 'always-show': true }]">
                    <div class="data-panel-content">
                      <div class="data-panel-row">
                        <span class="data-panel-label">缓冲区扫码信息：</span>
                        <span>{{ nowScanTrayInfo.trayCode || '--' }}</span>
                      </div>
                    </div>
                  </div>
                </div>
                <!-- 光电集合，光电标签默认在下方，可以控制标签位置：label-top、label-left、label-right -->
                <!-- 上货区输送线光电信号 -->
                <div class="marker"
                    :class="{ 'scanning': upLoadPhotoelectricSignal.bit0 === '1' }" 
                    data-x="640" data-y="1380" 
                    @click="toggleBitValue(upLoadPhotoelectricSignal, 'bit0')">
                  <div class="marker-label">S-1#</div>
                </div>
                <div class="marker"
                    :class="{ 'scanning': upLoadPhotoelectricSignal.bit1 === '1' }" 
                    data-x="1440" data-y="1380" 
                    @click="toggleBitValue(upLoadPhotoelectricSignal, 'bit1')">
                  <div class="marker-label">S-2#</div>
                </div>
                <div class="marker label-left"
                     :class="{ 'scanning': upLoadPhotoelectricSignal.bit3 === '1' }" 
                     data-x="2190" data-y="1380"
                     @click="toggleBitValue(upLoadPhotoelectricSignal, 'bit3')">
                  <div class="marker-label">S-4#</div>
                </div>
                <div class="marker label-right"
                     :class="{ 'scanning': upLoadPhotoelectricSignal.bit5 === '1' }" 
                     data-x="2475" data-y="1340"
                     @click="toggleBitValue(upLoadPhotoelectricSignal, 'bit5')">
                  <div class="marker-label">S-6#</div>
                </div>
                <div class="marker label-top"
                     :class="{ 'scanning': upLoadPhotoelectricSignal.bit6 === '1' }" 
                     data-x="2440" data-y="1180"
                     @click="toggleBitValue(upLoadPhotoelectricSignal, 'bit6')">
                  <div class="marker-label">S-7#</div>
                </div>
                <div class="marker label-top"
                     :class="{ 'scanning': upLoadPhotoelectricSignal.bit7 === '1' }" 
                     data-x="2290" data-y="1180"
                     @click="toggleBitValue(upLoadPhotoelectricSignal, 'bit7')">
                  <div class="marker-label">S-8#</div>
                </div>
                <div class="marker label-right"
                     :class="{ 'scanning': upLoadPhotoelectricSignal.bit8 === '1' }" 
                     data-x="2480" data-y="1180"
                     @click="toggleBitValue(upLoadPhotoelectricSignal, 'bit8')">
                  <div class="marker-label">S-9#</div>
                </div>
                <div class="marker"
                     :class="{ 'scanning': upLoadPhotoelectricSignal.bit10 === '1' }" 
                     data-x="1570" data-y="1266"
                     @click="toggleBitValue(upLoadPhotoelectricSignal, 'bit9')">
                  <div class="marker-label">S-10#</div>
                </div>
                <div class="marker"
                     :class="{ 'scanning': upLoadPhotoelectricSignal.bit12 === '1' }" 
                     data-x="860" data-y="1266"
                     @click="toggleBitValue(upLoadPhotoelectricSignal, 'bit10')">
                  <div class="marker-label">S-11#</div>
                </div>
                <!-- 电机点位示例，可以控制标签位置：label-top、label-left、label-right -->
                <!-- 上货区电机运行信号（扫码后入队） -->
                <div class="motor-marker marker-show-label"
                     :class="{ 'running': upLoadMotorRunning.bit0 === '1' }"
                     data-x="1080" data-y="1390"
                     @click="toggleBitValue(upLoadMotorRunning, 'bit0')">
                  <div class="marker-label">S1#</div>
                </div>
                <div class="motor-marker marker-show-label"
                     :class="{ 'running': upLoadMotorRunning.bit1 === '1' }"
                     data-x="1910" data-y="1390"
                     @click="toggleBitValue(upLoadMotorRunning, 'bit1')">
                  <div class="marker-label">S2#</div>
                </div>
                <div class="motor-marker marker-show-label"
                     :class="{ 'running': upLoadMotorRunning.bit2 === '1' }"
                     data-x="2300" data-y="1390"
                     @click="toggleBitValue(upLoadMotorRunning, 'bit2')">
                  <div class="marker-label">S3#</div>
                </div>
                <div class="motor-marker marker-show-label"
                     :class="{ 'running': upLoadMotorRunning.bit3 === '1' }"
                     data-x="2385" data-y="1390"
                     @click="toggleBitValue(upLoadMotorRunning, 'bit3')">
                  <div class="marker-label">S4#</div>
                </div>
                <div class="motor-marker marker-show-label"
                     :class="{ 'running': upLoadMotorRunning.bit4 === '1' }"
                     data-x="2470" data-y="1390"
                     @click="toggleBitValue(upLoadMotorRunning, 'bit4')">
                  <div class="marker-label">S5#</div>
                </div>
                <div class="motor-marker marker-show-label label-left"
                     :class="{ 'running': upLoadMotorRunning.bit5 === '1' }"
                     data-x="2330" data-y="1287"
                     @click="toggleBitValue(upLoadMotorRunning, 'bit5')">
                  <div class="marker-label">S6#</div>
                </div>
                <div class="motor-marker marker-show-label label-top"
                     :class="{ 'running': upLoadMotorRunning.bit6 === '1' }"
                     data-x="2385" data-y="1210"
                     @click="toggleBitValue(upLoadMotorRunning, 'bit6')">
                  <div class="marker-label">S7#</div>
                </div>
                <div class="motor-marker marker-show-label label-right"
                     :class="{ 'running': upLoadMotorRunning.bit7 === '1' }"
                     data-x="2460" data-y="1230"
                     @click="toggleBitValue(upLoadMotorRunning, 'bit7')">
                  <div class="marker-label">S8#</div>
                </div>
                <div class="motor-marker marker-show-label label-left"
                     :class="{ 'running': upLoadMotorRunning.bit8 === '1' }"
                     data-x="2260" data-y="1230"
                     @click="toggleBitValue(upLoadMotorRunning, 'bit8')">
                  <div class="marker-label">S9#</div>
                </div>
                <div class="motor-marker marker-show-label"
                     :class="{ 'running': upLoadMotorRunning.bit9 === '1' }"
                     data-x="1910" data-y="1220"
                     @click="toggleBitValue(upLoadMotorRunning, 'bit9')">
                  <div class="marker-label">S10#</div>
                </div>
                <div class="motor-marker marker-show-label"
                     :class="{ 'running': upLoadMotorRunning.bit10 === '1' }"
                     data-x="1130" data-y="1220"
                     @click="toggleBitValue(upLoadMotorRunning, 'bit10')">
                  <div class="marker-label">S11#</div>
                </div>
                <!-- A线电机运行信号 -->
                <div class="motor-marker marker-show-label label-right"
                     :class="{ 'running': aLineMotorRunning.bit0 === '1' }"
                     data-x="1150" data-y="1098"
                     @click="toggleBitValue(aLineMotorRunning, 'bit0')">
                  <div class="marker-label">A1-1#</div>
                </div>
                <div class="motor-marker marker-show-label label-right"
                     :class="{ 'running': aLineMotorRunning.bit1 === '1' }"
                     data-x="1150" data-y="1030"
                     @click="toggleBitValue(aLineMotorRunning, 'bit1')">
                  <div class="marker-label">A1-2#</div>
                </div>
                <div class="motor-marker marker-show-label label-left"
                     :class="{ 'running': aLineMotorRunning.bit2 === '1' }"
                     data-x="1820" data-y="1098"
                     @click="toggleBitValue(aLineMotorRunning, 'bit2')">
                  <div class="marker-label">A2-1#</div>
                </div>
                <div class="motor-marker marker-show-label label-left"
                     :class="{ 'running': aLineMotorRunning.bit3 === '1' }"
                     data-x="1820" data-y="1030"
                     @click="toggleBitValue(aLineMotorRunning, 'bit3')">
                  <div class="marker-label">A2-2#</div>
                </div>
                <div class="motor-marker marker-show-label label-right"
                     :class="{ 'running': aLineMotorRunning.bit4 === '1' }"
                     data-x="2320" data-y="1090"
                     @click="toggleBitValue(aLineMotorRunning, 'bit4')">
                  <div class="marker-label">A3-1#</div>
                </div>
                <div class="motor-marker marker-show-label label-right"
                     :class="{ 'running': aLineMotorRunning.bit5 === '1' }"
                     data-x="2320" data-y="1025"
                     @click="toggleBitValue(aLineMotorRunning, 'bit5')">
                  <div class="marker-label">A3-2#</div>
                </div>
                <!-- A线光电检测信号 -->
                <div class="marker label-right"
                     :class="{ 'scanning': aLinePhotoelectricSignal.bit0 === '1' }"
                     data-x="840" data-y="1120"
                     @click="toggleBitValue(aLinePhotoelectricSignal, 'bit0')">
                  <div class="marker-label">A-1#</div>
                </div>
                <div class="marker label-right"
                     :class="{ 'scanning': aLinePhotoelectricSignal.bit1 === '1' }"
                     data-x="840" data-y="1010"
                     @click="toggleBitValue(aLinePhotoelectricSignal, 'bit1')">
                  <div class="marker-label">A-2#</div>
                </div>
                <div class="marker label-right"
                     :class="{ 'scanning': aLinePhotoelectricSignal.bit2 === '1' }"
                     data-x="1320" data-y="1120"
                     @click="toggleBitValue(aLinePhotoelectricSignal, 'bit2')">
                  <div class="marker-label">A-3#</div>
                </div>
                <div class="marker label-right"
                     :class="{ 'scanning': aLinePhotoelectricSignal.bit3 === '1' }"
                     data-x="1320" data-y="1010"
                     @click="toggleBitValue(aLinePhotoelectricSignal, 'bit3')">
                  <div class="marker-label">A-4#</div>
                </div>
                <div class="marker label-right"
                     :class="{ 'scanning': aLinePhotoelectricSignal.bit4 === '1' }"
                     data-x="1435" data-y="1120"
                     @click="toggleBitValue(aLinePhotoelectricSignal, 'bit4')">
                  <div class="marker-label">A-5#</div>
                </div>
                <div class="marker label-right"
                     :class="{ 'scanning': aLinePhotoelectricSignal.bit5 === '1' }"
                     data-x="1435" data-y="1010"
                     @click="toggleBitValue(aLinePhotoelectricSignal, 'bit5')">
                  <div class="marker-label">A-6#</div>
                </div>
                <div class="marker label-right"
                     :class="{ 'scanning': aLinePhotoelectricSignal.bit6 === '1' }"
                     data-x="2020" data-y="1120"
                     @click="toggleBitValue(aLinePhotoelectricSignal, 'bit6')">
                  <div class="marker-label">A-7#</div>
                </div>
                <div class="marker label-right"
                     :class="{ 'scanning': aLinePhotoelectricSignal.bit7 === '1' }"
                     data-x="2020" data-y="1010"
                     @click="toggleBitValue(aLinePhotoelectricSignal, 'bit7')">
                  <div class="marker-label">A-8#</div>
                </div>
                <div class="marker label-bottom"
                     :class="{ 'scanning': aLinePhotoelectricSignal.bit8 === '1' }"
                     data-x="2470" data-y="1120"
                     @click="toggleBitValue(aLinePhotoelectricSignal, 'bit8')">
                  <div class="marker-label">A-9#</div>
                </div>
                <div class="marker label-top"
                     :class="{ 'scanning': aLinePhotoelectricSignal.bit9 === '1' }"
                     data-x="2470" data-y="1010"
                     @click="toggleBitValue(aLinePhotoelectricSignal, 'bit9')">
                  <div class="marker-label">A-10#</div>
                </div>
                <!-- B线电机运行信号 -->
                <div class="motor-marker marker-show-label label-right"
                     :class="{ 'running': bLineMotorRunning.bit0 === '1' }"
                     data-x="1150" data-y="880"
                     @click="toggleBitValue(bLineMotorRunning, 'bit0')">
                  <div class="marker-label">B1-1#</div>
                </div>
                <div class="motor-marker marker-show-label label-right"
                     :class="{ 'running': bLineMotorRunning.bit1 === '1' }"
                     data-x="1150" data-y="810"
                     @click="toggleBitValue(bLineMotorRunning, 'bit1')">
                  <div class="marker-label">B1-2#</div>
                </div>
                <div class="motor-marker marker-show-label label-left"
                     :class="{ 'running': bLineMotorRunning.bit2 === '1' }"
                     data-x="1820" data-y="880"
                     @click="toggleBitValue(bLineMotorRunning, 'bit2')">
                  <div class="marker-label">B2-1#</div>
                </div>
                <div class="motor-marker marker-show-label label-left"
                     :class="{ 'running': bLineMotorRunning.bit3 === '1' }"
                     data-x="1820" data-y="810"
                     @click="toggleBitValue(bLineMotorRunning, 'bit3')">
                  <div class="marker-label">B2-2#</div>
                </div>
                <div class="motor-marker marker-show-label label-right"
                     :class="{ 'running': bLineMotorRunning.bit4 === '1' }"
                     data-x="2320" data-y="880"
                     @click="toggleBitValue(bLineMotorRunning, 'bit4')">
                  <div class="marker-label">B3-1#</div>
                </div>
                <div class="motor-marker marker-show-label label-right"
                     :class="{ 'running': bLineMotorRunning.bit5 === '1' }"
                     data-x="2320" data-y="810"
                     @click="toggleBitValue(bLineMotorRunning, 'bit5')">
                  <div class="marker-label">B3-2#</div>
                </div>
                <!-- B线光电检测信号 -->
                <div class="marker label-right"
                     :class="{ 'scanning': bLinePhotoelectricSignal.bit0 === '1' }" 
                     data-x="840" data-y="900"
                     @click="toggleBitValue(bLinePhotoelectricSignal, 'bit0')">
                  <div class="marker-label">B-1#</div>
                </div>
                <div class="marker label-right"
                     :class="{ 'scanning': bLinePhotoelectricSignal.bit1 === '1' }" 
                     data-x="840" data-y="790"
                     @click="toggleBitValue(bLinePhotoelectricSignal, 'bit1')">
                  <div class="marker-label">B-2#</div>
                </div>
                <div class="marker label-right"
                     :class="{ 'scanning': bLinePhotoelectricSignal.bit2 === '1' }" 
                     data-x="1320" data-y="900"
                     @click="toggleBitValue(bLinePhotoelectricSignal, 'bit2')">
                  <div class="marker-label">B-3#</div>
                </div>
                <div class="marker label-right"
                     :class="{ 'scanning': bLinePhotoelectricSignal.bit3 === '1' }" 
                     data-x="1320" data-y="790"
                     @click="toggleBitValue(bLinePhotoelectricSignal, 'bit3')">
                  <div class="marker-label">B-4#</div>
                </div>
                <div class="marker label-right"
                     :class="{ 'scanning': bLinePhotoelectricSignal.bit4 === '1' }" 
                     data-x="1435" data-y="900"
                     @click="toggleBitValue(bLinePhotoelectricSignal, 'bit4')">
                  <div class="marker-label">B-5#</div>
                </div>
                <div class="marker label-right"
                     :class="{ 'scanning': bLinePhotoelectricSignal.bit5 === '1' }" 
                     data-x="1435" data-y="790"
                     @click="toggleBitValue(bLinePhotoelectricSignal, 'bit5')">
                  <div class="marker-label">B-6#</div>
                </div>
                <div class="marker label-right"
                     :class="{ 'scanning': bLinePhotoelectricSignal.bit6 === '1' }" 
                     data-x="2020" data-y="900"
                     @click="toggleBitValue(bLinePhotoelectricSignal, 'bit6')">
                  <div class="marker-label">B-7#</div>
                </div>
                <div class="marker label-right"
                     :class="{ 'scanning': bLinePhotoelectricSignal.bit7 === '1' }" 
                     data-x="2020" data-y="790"
                     @click="toggleBitValue(bLinePhotoelectricSignal, 'bit7')">
                  <div class="marker-label">B-8#</div>
                </div>
                <div class="marker label-right"
                     :class="{ 'scanning': bLinePhotoelectricSignal.bit8 === '1' }" 
                     data-x="2470" data-y="900"
                     @click="toggleBitValue(bLinePhotoelectricSignal, 'bit8')">
                  <div class="marker-label">B-9#</div>
                </div>
                <div class="marker label-right"
                     :class="{ 'scanning': bLinePhotoelectricSignal.bit9 === '1' }" 
                     data-x="2470" data-y="790"
                     @click="toggleBitValue(bLinePhotoelectricSignal, 'bit9')">
                  <div class="marker-label">B-10#</div>
                </div>
                
                <!-- C线电机运行信号 -->
                <div class="motor-marker marker-show-label label-right"
                     :class="{ 'running': cLineMotorRunning.bit0 === '1' }"
                     data-x="1150" data-y="678"
                     @click="toggleBitValue(cLineMotorRunning, 'bit0')">
                  <div class="marker-label">C1-1#</div>
                </div>
                <div class="motor-marker marker-show-label label-right"
                     :class="{ 'running': cLineMotorRunning.bit1 === '1' }"
                     data-x="1150" data-y="615"
                     @click="toggleBitValue(cLineMotorRunning, 'bit1')">
                  <div class="marker-label">C1-2#</div>
                </div>
                <div class="motor-marker marker-show-label label-left"
                     :class="{ 'running': cLineMotorRunning.bit2 === '1' }"
                     data-x="1820" data-y="678"
                     @click="toggleBitValue(cLineMotorRunning, 'bit2')">
                  <div class="marker-label">C2-1#</div>
                </div>
                <div class="motor-marker marker-show-label label-left"
                     :class="{ 'running': cLineMotorRunning.bit3 === '1' }"
                     data-x="1820" data-y="615"
                     @click="toggleBitValue(cLineMotorRunning, 'bit3')">
                  <div class="marker-label">C2-2#</div>
                </div>
                <div class="motor-marker marker-show-label label-right"
                     :class="{ 'running': cLineMotorRunning.bit4 === '1' }"
                     data-x="2320" data-y="678"
                     @click="toggleBitValue(cLineMotorRunning, 'bit4')">
                  <div class="marker-label">C3-1#</div>
                </div>
                <div class="motor-marker marker-show-label label-right"
                     :class="{ 'running': cLineMotorRunning.bit5 === '1' }"
                     data-x="2320" data-y="615"
                     @click="toggleBitValue(cLineMotorRunning, 'bit5')">
                  <div class="marker-label">C3-2#</div>
                </div>
                <!-- C线光电检测信号 -->
                <div class="marker label-right"
                     :class="{ 'scanning': cLinePhotoelectricSignal.bit0 === '1' }" 
                     data-x="840" data-y="690"
                     @click="toggleBitValue(cLinePhotoelectricSignal, 'bit0')">
                  <div class="marker-label">C-1#</div>
                </div>
                <div class="marker label-right"
                     :class="{ 'scanning': cLinePhotoelectricSignal.bit1 === '1' }" 
                     data-x="840" data-y="590"
                     @click="toggleBitValue(cLinePhotoelectricSignal, 'bit1')">
                  <div class="marker-label">C-2#</div>
                </div>
                <div class="marker label-right"
                     :class="{ 'scanning': cLinePhotoelectricSignal.bit2 === '1' }" 
                     data-x="1320" data-y="690"
                     @click="toggleBitValue(cLinePhotoelectricSignal, 'bit2')">
                  <div class="marker-label">C-3#</div>
                </div>
                <div class="marker label-right"
                     :class="{ 'scanning': cLinePhotoelectricSignal.bit3 === '1' }" 
                     data-x="1320" data-y="590"
                     @click="toggleBitValue(cLinePhotoelectricSignal, 'bit3')">
                  <div class="marker-label">C-4#</div>
                </div>
                <div class="marker label-right"
                     :class="{ 'scanning': cLinePhotoelectricSignal.bit4 === '1' }" 
                     data-x="1435" data-y="690"
                     @click="toggleBitValue(cLinePhotoelectricSignal, 'bit4')">
                  <div class="marker-label">C-5#</div>
                </div>
                <div class="marker label-right"
                     :class="{ 'scanning': cLinePhotoelectricSignal.bit5 === '1' }" 
                     data-x="1435" data-y="590"
                     @click="toggleBitValue(cLinePhotoelectricSignal, 'bit5')">
                  <div class="marker-label">C-6#</div>
                </div>
                <div class="marker label-right"
                     :class="{ 'scanning': cLinePhotoelectricSignal.bit6 === '1' }" 
                     data-x="2020" data-y="690"
                     @click="toggleBitValue(cLinePhotoelectricSignal, 'bit6')">
                  <div class="marker-label">C-7#</div>
                </div>
                <div class="marker label-right"
                     :class="{ 'scanning': cLinePhotoelectricSignal.bit7 === '1' }" 
                     data-x="2020" data-y="590"
                     @click="toggleBitValue(cLinePhotoelectricSignal, 'bit7')">
                  <div class="marker-label">C-8#</div>
                </div>
                <div class="marker label-right"
                     :class="{ 'scanning': cLinePhotoelectricSignal.bit8 === '1' }" 
                     data-x="2470" data-y="690"
                     @click="toggleBitValue(cLinePhotoelectricSignal, 'bit8')">
                  <div class="marker-label">C-9#</div>
                </div>
                <div class="marker label-right"
                     :class="{ 'scanning': cLinePhotoelectricSignal.bit9 === '1' }" 
                     data-x="2470" data-y="590"
                     @click="toggleBitValue(cLinePhotoelectricSignal, 'bit9')">
                  <div class="marker-label">C-10#</div>
                </div>
                
                <!-- 扫码枪处光电信号 -->
                <div class="marker marker-show-label label-left"
                     :class="{ 'scanning': scanPhotoelectricSignal.bit0 === '1' }" 
                     data-x="335" data-y="1360"
                     @click="toggleBitValue(scanPhotoelectricSignal, 'bit0')">
                  <div class="marker-label">1-1#</div>
                </div>
                <div class="marker marker-show-label label-left"
                     :class="{ 'scanning': scanPhotoelectricSignal.bit1 === '1' }" 
                     data-x="2335" data-y="1340"
                     @click="toggleBitValue(scanPhotoelectricSignal, 'bit1')">
                  <div class="marker-label">1-2#</div>
                </div>
                <div class="marker marker-show-label label-right"
                     :class="{ 'scanning': scanPhotoelectricSignal.bit2 === '1' }" 
                     data-x="585" data-y="915"
                     @click="toggleBitValue(scanPhotoelectricSignal, 'bit2')">
                  <div class="marker-label">2-1#</div>
                </div>
                <div class="marker marker-show-label label-right"
                     :class="{ 'scanning': scanPhotoelectricSignal.bit4 === '1' }" 
                     data-x="515" data-y="525"
                     @click="toggleBitValue(scanPhotoelectricSignal, 'bit4')">
                  <div class="marker-label">3-1#</div>
                </div>
                <div class="marker marker-show-label label-top"
                     :class="{ 'scanning': scanPhotoelectricSignal.bit5 === '1' }" 
                     data-x="400" data-y="145"
                     @click="toggleBitValue(scanPhotoelectricSignal, 'bit5')">
                  <div class="marker-label">4-1#</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 右侧队列信息区 -->
    <div class="side-info-panel-queue" :style="{'width' : isQueueExpanded? '800px': 'auto'}">
      <!-- 队列信息区域 -->
      <div class="queue-section" :class="{ 'expanded': isQueueExpanded }">
        <div class="section-header" @click="changeQueueExpanded">
          <template v-if="isQueueExpanded">
            <span><i class="el-icon-s-data"></i> 队列信息</span>
            <span class="arrow-icon" :class="{'expanded-arrow': isQueueExpanded}">▼</span>
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
                <span class="tray-count">{{ queue.trayInfo?.length || 0 }}</span>
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
                  <span class="tray-total">托盘数量: {{ selectedQueue.trayInfo?.length || 0 }}</span>
                </div>
              </div>
              <div class="tray-list">
                <template v-if="nowTrays && nowTrays.length > 0">
                  <div
                    v-for="(tray, index) in nowTrays"
                    :key="'tray-' + tray.id + '-' + index"
                    class="tray-item"
                    :class="{ 'dragging': isDragging && draggedTray?.id === tray.id }"
                    draggable="true"
                    @dragstart="handleDragStart($event, tray, selectedQueueIndex)"
                    @dragend="handleDragEnd"
                  >
                    <div class="tray-info">
                      <div class="tray-info-row">
                        <span class="tray-name">{{ tray.name }}</span>
                        <span class="tray-batch">是否消毒: {{ tray.isTerile === '1' ? '消毒' : '不消毒' }}</span>
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
      <div class="test-panel" :class="{ 'collapsed': !showTestPanel }">
        <div class="test-panel-header">
          <span>测试面板</span>
          <i class="el-icon-close" @click.stop="showTestPanel = false"></i>
        </div>
        <div class="test-panel-content">
          <div class="test-section">
            <span class="test-label">小车1测试:</span>
            <div class="position-buttons">
              <button 
                v-for="pos in ['O1', 'A1', 'B1', 'C1']" 
                :key="'test-cart1-pos-' + pos"
                @click="updateCartPosition(1, pos)"
                class="position-btn"
              >
                {{pos}}
              </button>
            </div>
          </div>
          <div class="test-section">
            <span class="test-label">小车2测试:</span>
            <div class="position-buttons">
              <button 
                v-for="pos in ['A2', 'B2', 'C2']" 
                :key="'test-cart2-pos-' + pos"
                @click="updateCartPosition(2, pos)"
                class="position-btn"
              >
                {{pos}}
              </button>
            </div>
          </div>
          <div class="test-section">
            <span class="test-label">小车3测试:</span>
            <div class="position-buttons">
              <button 
                v-for="pos in ['A3', 'B3', 'C3']" 
                :key="'test-cart3-pos-' + pos"
                @click="updateCartPosition(3, pos)"
                class="position-btn"
              >
                {{pos}}
              </button>
            </div>
          </div>
          <div class="test-section">
            <span class="test-label">小车4测试:</span>
            <div class="position-buttons">
              <button 
                v-for="pos in ['A', 'B', 'C', 'D', 'E', 'P']" 
                :key="'test-cart4-pos-' + pos"
                @click="updateCartPosition(4, pos)"
                class="position-btn"
              >
                {{pos}}
              </button>
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
                <div class="qrcode-label">一楼缓冲区区扫码:</div>
                <el-input 
                  v-model="oneFloorElevatorScanCode"
                  size="small" 
                  placeholder="输入扫码信息"
                  class="qrcode-input"
                ></el-input>
              </div>
              <div class="qrcode-actions">
                <el-button 
                  type="primary" 
                  size="small" 
                  @click="clearAllQrCodes"
                >清空所有</el-button>
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
                    <span class="quantity-value">{{aLineQuantity.a1}}</span>
                    <div class="quantity-buttons">
                      <button @click="updateQuantity('aLineQuantity', 'a1', 1)" class="quantity-btn plus">+</button>
                      <button @click="updateQuantity('aLineQuantity', 'a1', -1)" class="quantity-btn minus">-</button>
                    </div>
                  </div>
                  <div class="quantity-item">
                    <span class="quantity-label">A2:</span>
                    <span class="quantity-value">{{aLineQuantity.a2}}</span>
                    <div class="quantity-buttons">
                      <button @click="updateQuantity('aLineQuantity', 'a2', 1)" class="quantity-btn plus">+</button>
                      <button @click="updateQuantity('aLineQuantity', 'a2', -1)" class="quantity-btn minus">-</button>
                    </div>
                  </div>
                  <div class="quantity-item">
                    <span class="quantity-label">A3:</span>
                    <span class="quantity-value">{{aLineQuantity.a3}}</span>
                    <div class="quantity-buttons">
                      <button @click="updateQuantity('aLineQuantity', 'a3', 1)" class="quantity-btn plus">+</button>
                      <button @click="updateQuantity('aLineQuantity', 'a3', -1)" class="quantity-btn minus">-</button>
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
                    <span class="quantity-value">{{bLineQuantity.b1}}</span>
                    <div class="quantity-buttons">
                      <button @click="updateQuantity('bLineQuantity', 'b1', 1)" class="quantity-btn plus">+</button>
                      <button @click="updateQuantity('bLineQuantity', 'b1', -1)" class="quantity-btn minus">-</button>
                    </div>
                  </div>
                  <div class="quantity-item">
                    <span class="quantity-label">B2:</span>
                    <span class="quantity-value">{{bLineQuantity.b2}}</span>
                    <div class="quantity-buttons">
                      <button @click="updateQuantity('bLineQuantity', 'b2', 1)" class="quantity-btn plus">+</button>
                      <button @click="updateQuantity('bLineQuantity', 'b2', -1)" class="quantity-btn minus">-</button>
                    </div>
                  </div>
                  <div class="quantity-item">
                    <span class="quantity-label">B3:</span>
                    <span class="quantity-value">{{bLineQuantity.b3}}</span>
                    <div class="quantity-buttons">
                      <button @click="updateQuantity('bLineQuantity', 'b3', 1)" class="quantity-btn plus">+</button>
                      <button @click="updateQuantity('bLineQuantity', 'b3', -1)" class="quantity-btn minus">-</button>
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
                    <span class="quantity-value">{{cLineQuantity.c1}}</span>
                    <div class="quantity-buttons">
                      <button @click="updateQuantity('cLineQuantity', 'c1', 1)" class="quantity-btn plus">+</button>
                      <button @click="updateQuantity('cLineQuantity', 'c1', -1)" class="quantity-btn minus">-</button>
                    </div>
                  </div>
                  <div class="quantity-item">
                    <span class="quantity-label">C2:</span>
                    <span class="quantity-value">{{cLineQuantity.c2}}</span>
                    <div class="quantity-buttons">
                      <button @click="updateQuantity('cLineQuantity', 'c2', 1)" class="quantity-btn plus">+</button>
                      <button @click="updateQuantity('cLineQuantity', 'c2', -1)" class="quantity-btn minus">-</button>
                    </div>
                  </div>
                  <div class="quantity-item">
                    <span class="quantity-label">C3:</span>
                    <span class="quantity-value">{{cLineQuantity.c3}}</span>
                    <div class="quantity-buttons">
                      <button @click="updateQuantity('cLineQuantity', 'c3', 1)" class="quantity-btn plus">+</button>
                      <button @click="updateQuantity('cLineQuantity', 'c3', -1)" class="quantity-btn minus">-</button>
                    </div>
                  </div>
                </div>
              </div>
              
              <!-- 缓冲区数量控制 -->
              <div class="quantity-group">
                <div class="quantity-title">缓冲区数量:</div>
                <div class="quantity-controls">
                  <div class="quantity-item">
                    <span class="quantity-value">{{bufferQuantity}}</span>
                    <div class="quantity-buttons">
                      <button @click="updateBufferQuantity(1)" class="quantity-btn plus">+</button>
                      <button @click="updateBufferQuantity(-1)" class="quantity-btn minus">-</button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 添加托盘对话框 -->
    <el-dialog
      title="添加托盘"
      :visible.sync="addTrayDialogVisible"
      width="500px"
      append-to-body
      :close-on-click-modal="false"
    >
      <div class="add-tray-form">
        <el-form :model="newTrayForm" ref="newTrayForm" label-width="100px" :rules="trayFormRules">
          <el-form-item label="托盘编号" prop="trayCode">
            <el-input v-model="newTrayForm.trayCode" placeholder="请输入托盘编号"></el-input>
          </el-form-item>
          <el-form-item label="批次号" prop="batchId">
            <el-input v-model="newTrayForm.batchId" placeholder="请输入批次号"></el-input>
          </el-form-item>
        </el-form>
      </div>
      <div slot="footer" class="dialog-footer">
        <el-button @click="addTrayDialogVisible = false">取 消</el-button>
        <el-button type="primary" @click="submitAddTray" :loading="isSubmitting">确 定</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import HttpUtil from '@/utils/HttpUtil'
import moment from 'moment';
export default {
  name: 'MonitorScreen',
  data() {
    return {
      nowScanTrayInfo: {},
      showTestPanel: false,
      buttonStates: {
        start: false,
        stop: false,
        reset: false,
        fault_reset: false,
        clear: false
      },
      activeLogType: 'running',
      ordersList: [],
      runningLogs: [],  // 修改为空数组
      alarmLogs: [],    // 修改为空数组
      positions: {
        cart1: {
          O1: { x: 790, y: 1230 },  // 最下面
          A1: { x: 790, y: 1068 },  // 最下面
          B1: { x: 790, y: 850 },
          C1: { x: 790, y: 645 },  // 扫码位
        },
        cart2: {
          A2: { x: 1375, y: 1067 },
          B2: { x: 1375, y: 849 },
          C2: { x: 1375, y: 647 },
        },
        cart3: {
          A3: { x: 1945, y: 1066 },
          B3: { x: 1945, y: 848 },
          C3: { x: 1945, y: 647 }
        },
        cart4: {
          A: { x: 2510, y: 1066 },
          B: { x: 2510, y: 848 },
          C: { x: 2510, y: 647 },
          D: { x: 2510, y: 490 },
          E: { x: 2510, y: 340 },
          P: { x: 2510, y: 425 }
        }
      },
      carts: [
        {
          id: 1,
          name: '小车1',
          cartKey: 'cart1',  // 添加cartKey用于关联positions
          currentPosition: 'O1',
          x: 790,
          y: 1230,
          width: 72,
          image: require('@/assets/changzhou-img/cart1.png')
        },
        {
          id: 2,
          name: '小车2',
          cartKey: 'cart2',
          currentPosition: 'A2',
          x: 1375,
          y: 647,
          width: 68,
          image: require('@/assets/changzhou-img/cart2.png')
        },
        {
          id: 3,
          name: '小车3',
          cartKey: 'cart3',
          currentPosition: 'A3',
          x: 1945,
          y: 1066,
          width: 72,
          image: require('@/assets/changzhou-img/cart3.png')
        },
        {
          id: 4,
          name: '小车4',
          cartKey: 'cart4',
          currentPosition: 'A',
          x: 2510,
          y: 1066,
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
      ],
      logId: 1000,  // 添加一个日志ID计数器
      // 输送线当前运行状态-读取PLC
      conveyorStatus: '',
      // 允许进料反馈-读取PLC
      allowFeedBack: {
        bit0: '0', // 值为1时，全部接货口不允许进货
        bit1: '0', // 值为1时，一楼接货口允许进货；值为0时，不允许
        bit2: '0', // 值为1时，二楼1#接货口允许进货；值为0时，不允许
        bit3: '0', // 值为1时，二楼2#接货口允许进货；值为0时，不允许
        bit4: '0', // 值为1时，三楼1#接货口允许进货；值为0时，不允许
        bit5: '0', // 值为1时，三楼2#接货口允许进货；值为0时，不允许
      },
      // A线电机运行信号-读取PLC
      aLineMotorRunning: {
        bit0: '0', // A1-1#电机运行信号
        bit1: '0', // A1-2#电机运行信号
        bit2: '0', // A2-1#电机运行信号
        bit3: '0', // A2-2#电机运行信号
        bit4: '0', // A3-1#电机运行信号
        bit5: '0', // A3-2#电机运行信号
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
      },
      // B线电机运行信号-读取PLC
      bLineMotorRunning: {
        bit0: '0', // B1-1#电机运行信号
        bit1: '0', // B1-2#电机运行信号
        bit2: '0', // B2-1#电机运行信号
        bit3: '0', // B2-2#电机运行信号
        bit4: '0', // B3-1#电机运行信号
        bit5: '0', // B3-2#电机运行信号
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
        bit9: '0', // B-10#光电
      },
      // C线电机运行信号-读取PLC
      cLineMotorRunning: {
        bit0: '0', // C1-1#电机运行信号
        bit1: '0', // C1-2#电机运行信号
        bit2: '0', // C2-1#电机运行信号
        bit3: '0', // C2-2#电机运行信号
        bit4: '0', // C3-1#电机运行信号
        bit5: '0', // C3-2#电机运行信号
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
        bit9: '0', // C-10#光电
      },
      // 这里DE先不写对接，如果写对接后续再添加代码-读取PLC
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
        bit15: '0', // 主柜急停
      },
      // A线数量-读取PLC
      aLineQuantity: {
        a1: '0',
        a2: '0',
        a3: '0',
      },
      // B线数量-读取PLC
      bLineQuantity: {
        b1: '0',
        b2: '0',
        b3: '0',
      },
      // C线数量-读取PLC
      cLineQuantity: {
        c1: '0',
        c2: '0',
        c3: '0',
      },
      // 缓冲区数量
      bufferQuantity: '0',
      // D线数量和E线数量先不对接-读取PLC
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
        bit11: '0', // S12#电机运行信号
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
        bit13: '0', // S-14#光电
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
        bit8: '0', // 一楼E灭菌"有载信号"/光电占位
      },
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
      // 请求上位机下发任务(判断去灭菌还是非灭菌）
      requestUploadTask: '0',
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
      // 显示小车1设置去哪个预热房的按钮
      showCar1SetPreheatingRoom: false,
      preheatingRoomSelected: '',
      disinfectionRoomSelectedFrom: '',
      disinfectionRoomSelectedTo: '',
      warehouseSelectedFrom: '',
      warehouseSelectedTo: '',
    };
  },
  computed: {
    currentLogs() {
      return this.activeLogType === 'running' ? this.runningLogs : this.alarmLogs;
    },
    unreadAlarms() {
      return this.alarmLogs.filter(log => log.unread).length;
    },
    selectedQueue() {
      return this.queues[this.selectedQueueIndex];
    }
  },
  mounted() {
    this.initializeMarkers();
  },
  watch: {
    // 一楼接货站台光电信号
    'scanPhotoelectricSignal.bit0'(newVal) {
      if (newVal === '0') {
        this.elevatorOneFloorScanCode = '';
        this.addLog('一楼接货站台光电信号无货，已清空一楼接货站台扫码数据');
      }
      if (newVal === '1' && this.elevatorOneFloorScanCode !== '') {
        this.addLog(`一楼接货站台扫码数据：${this.elevatorOneFloorScanCode}`);
        this.addToUpLoadQueue(this.elevatorOneFloorScanCode, '一楼接货站台', this.nonSterileOne);
      }
    },
    // 一楼接货站台扫码数据
    elevatorOneFloorScanCode: {
      async handler(newVal) {
        if (newVal !== '' && this.scanPhotoelectricSignal.bit0 === '1') {
          this.addLog(`一楼接货站台扫码数据：${newVal}`);
          this.addToUpLoadQueue(newVal, '一楼接货站台', this.nonSterileOne);
        }
      },
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
      },
    },
    // 二楼接货站台光电信号
    'scanPhotoelectricSignal.bit2'(newVal) {
      if (newVal === '0') {
        this.elevatorTwoFloorScanCode = '';
        this.addLog('二楼接货站台光电信号无货，已清空二楼接货站台扫码数据');
      }
      if (newVal === '1' && this.elevatorTwoFloorScanCode !== '') {
        this.addLog(`二楼接货站台扫码数据：${this.elevatorTwoFloorScanCode}`);
        this.addToUpLoadQueue(this.elevatorTwoFloorScanCode, '二楼接货站台', this.nonSterileTwo);
      }
    },
    // 二楼接货站台扫码数据
    elevatorTwoFloorScanCode: {
      async handler(newVal) {
        if (newVal !== '' && this.scanPhotoelectricSignal.bit2 === '1') {
          this.addLog(`二楼接货站台扫码数据：${newVal}`);
          this.addToUpLoadQueue(newVal, '二楼接货站台', this.nonSterileTwo);
        }
      },
    },
    // 三楼接货站台光电信号
    'scanPhotoelectricSignal.bit4'(newVal) {
      if (newVal === '0') {
        this.elevatorThreeFloorScanCode = '';
        this.addLog('三楼接货站台光电信号无货，已清空三楼接货站台扫码数据');
      }
      if (newVal === '1' && this.elevatorThreeFloorScanCode !== '') {
        this.addLog(`三楼接货站台扫码数据：${this.elevatorThreeFloorScanCode}`);
        this.addToUpLoadQueue(this.elevatorThreeFloorScanCode, '三楼接货站台', this.allowUploadThree, this.nonSterileThree);
      }
    },
    // 三楼接货站台扫码数据
    elevatorThreeFloorScanCode: {
      async handler(newVal) {
        if (newVal !== '' && this.scanPhotoelectricSignal.bit4 === '1') {
          this.addLog(`三楼接货站台扫码数据：${newVal}`);
          this.addToUpLoadQueue(newVal, '三楼接货站台', this.allowUploadThree, this.nonSterileThree);
        }
      },
    },
    // 四楼接货站台光电信号
    'scanPhotoelectricSignal.bit5'(newVal) {
      if (newVal === '0') {
        this.elevatorFourFloorScanCode = '';
        this.addLog('四楼接货站台光电信号无货，已清空四楼接货站台扫码数据');
      }
      if (newVal === '1' && this.elevatorFourFloorScanCode !== '') {
        this.addLog(`四楼接货站台扫码数据：${this.elevatorFourFloorScanCode}`);
        this.addToUpLoadQueue(this.elevatorFourFloorScanCode, '四楼接货站台', this.nonSterileFour);
      }
    },
    // 四楼接货站台扫码数据
    elevatorFourFloorScanCode: {
      async handler(newVal) {
        if (newVal !== '' && this.scanPhotoelectricSignal.bit5 === '1') {
          this.addLog(`四楼接货站台扫码数据：${newVal}`);
          this.addToUpLoadQueue(newVal, '四楼接货站台', this.nonSterileFour);
        }
      },
    },
    // 请求上位机下发任务(判断去灭菌还是非灭菌）
    requestUploadTask: {
      async handler(newVal) {
        if (newVal === '1') {
          this.addLog('请求上位机下发任务(判断去灭菌还是非灭菌）');
          // 这地方需要判断托盘数据有没有处理过，每次只处理没处理过的托盘数据
        }
      },
    },
    // 监听缓冲区数量变化
    bufferQuantity: {
      async handler(newVal, oldVal) {
        // 判断与老数据相比是增加1还是减少1，如果增加1则把分发区的第一个托盘信息加入到缓冲区，同时把原队列的第一个托盘信息删除
        if (newVal > oldVal) {
          this.addLog(this.queues[1].trayInfo[0].trayCode + '进入缓冲区。');
          // 把分发区的托盘信息加入到缓冲区
          this.queues[2].trayInfo.push(this.queues[1].trayInfo[0]);
          this.queues[1].trayInfo.shift();
          // 如果bufferQuantity达到16个，则显示小车1设置去哪个预热房的按钮
          if (newVal === 16) {
            this.showCar1SetPreheatingRoom = true;
          }
        }
      },
    },
  },
  methods: {
    // 判断是否消毒，如果消毒则此托盘进入分发区队列，如果不消毒直接发走
    addToCartLoadQueue(trayCode) {
      // 通过trayCode 查询this.queues[0].trayInfo的托盘信息
      const trayInfo = this.queues[0].trayInfo.find(tray => tray.trayCode === trayCode);
      // 托盘信息进入下一队列，并且把托盘信息从this.queues[0].trayInfo中删除
      this.queues[1].trayInfo.push(trayInfo);
      this.queues[0].trayInfo = this.queues[0].trayInfo.filter(tray => tray.trayCode !== trayCode);
      this.addLog(`托盘信息：${trayInfo.trayCode} 进入分发区`);
    },
    // 添加货物到上货区队列
    addToUpLoadQueue(trayCode, trayFrom, nonSterile) {
      // 通过trayCode 查询erp数据
      const params = {
        trayCode: trayCode,
        invalidFlag: '0',
        orderStatus: '0'
      }
      HttpUtil.post('/order_info/selectList', params).then((res)=> {
        // this.queues[0]： 上货区
        if (res.data && res.data.length > 0) {
          const trayInfo = { 
            trayCode: res.data[0].trayCode,
            trayTime: moment().format('YYYY-MM-DD HH:mm:ss'),
            orderId: res.data[0].orderId,
            productCode: res.data[0].productCode,
            productName: res.data[0].productName,
            isTerile: nonSterile ? '0' : res.data[0].isTerile,
            state: '0',
          };
          this.queues[0].trayInfo.push(trayInfo);
          this.addLog(trayFrom + `上货区队列添加货物：${trayCode}`);
          this.nowScanTrayInfo = {
            trayCode: trayInfo.trayCode,
            orderId: trayInfo.orderId,
            productName: trayInfo.productName,
            isTerile: trayInfo.isTerile === '1' ? '消毒' : '不消毒',
            inPut: trayFrom,
          };
        } else {
          this.addLog(trayFrom + `上货区队列添加货物失败：${trayCode}`);
          this.nowScanTrayInfo = {};
        }
      }).catch((err)=> {
        this.$message.error('查询队列失败，请重试' + err);
        // 没查询到货物信息，直接报警
        this.addLog(trayFrom + `上货区队列添加货物失败：${trayCode}`);
        this.nowScanTrayInfo = {};
      })
    },
    changeQueueExpanded() {
      this.isQueueExpanded = !this.isQueueExpanded;
    },
    toggleButtonState(button) {
      this.buttonStates = {
        start: false,
        stop: false,
        reset: false,
        fault_reset: false,
        clear: false
      };
      this.buttonStates[button] = !this.buttonStates[button];
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
      images.forEach(image => {
        const imageWrapper = image.parentElement;
        if (!imageWrapper) return;

        const markers = imageWrapper.querySelectorAll('.marker, .marker-with-panel, .marker-with-button, .queue-marker, .motor-marker, .preheating-room-marker');
        const carts = imageWrapper.querySelectorAll('.cart-container');
        const imageRect = image.getBoundingClientRect();
        const wrapperRect = imageWrapper.getBoundingClientRect();
        
        // 计算图片的实际显示区域
        const displayedWidth = image.width;
        const displayedHeight = image.height;
        const scaleX = displayedWidth / image.naturalWidth;
        const scaleY = displayedHeight / image.naturalHeight;
        
        // 计算图片在容器中的偏移量
        const imageOffsetX = (wrapperRect.width - displayedWidth) / 2;
        const imageOffsetY = (wrapperRect.height - displayedHeight) / 2;
        
        markers.forEach(marker => {
          const x = parseFloat(marker.dataset.x);
          const y = parseFloat(marker.dataset.y);
          if (!isNaN(x) && !isNaN(y)) {
            marker.style.left = `${imageOffsetX + (x * scaleX)}px`;
            marker.style.top = `${imageOffsetY + (y * scaleY)}px`;
          }
        });

        // 更新小车位置和大小
        carts.forEach(cart => {
          const x = parseFloat(cart.dataset.x);
          const y = parseFloat(cart.dataset.y);
          const width = parseFloat(cart.dataset.width);
          if (!isNaN(x) && !isNaN(y)) {
            cart.style.left = `${imageOffsetX + (x * scaleX)}px`;
            cart.style.top = `${imageOffsetY + (y * scaleY)}px`;
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
    updateCartPosition(cartId, position) {
      const cart = this.carts.find(c => c.id === cartId);
      if (cart && this.positions[cart.cartKey] && this.positions[cart.cartKey][position]) {
        cart.currentPosition = position;
        const newPos = this.positions[cart.cartKey][position];
        cart.x = newPos.x;
        cart.y = newPos.y;
        this.$nextTick(() => {
          this.updateMarkerPositions();
        });
      }
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
        const trayInfo = Array.isArray(selectedQueue.trayInfo) ? selectedQueue.trayInfo : [];
        
        this.nowTrays = trayInfo.map(tray => ({
          id: tray.trayCode || '',
          name: tray.trayCode ? `托盘 ${tray.trayCode}` : '未知托盘',
          time: tray.trayTime || '',
          isTerile: tray.isTerile
        })).filter(tray => tray.id); // 过滤掉没有 id 的托盘
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
      if (!this.draggedTray || this.dragSourceQueue === null || targetQueueIndex === null) return;
      if (this.dragSourceQueue === targetQueueIndex) return;

      const sourceQueue = this.queues[this.dragSourceQueue];
      const targetQueue = this.queues[targetQueueIndex];

      if (!sourceQueue || !targetQueue) {
        this.$message.error('队列不存在，无法移动托盘');
        return;
      }

      sourceQueue.trayInfo = Array.isArray(sourceQueue.trayInfo) ? sourceQueue.trayInfo : [];
      targetQueue.trayInfo = Array.isArray(targetQueue.trayInfo) ? targetQueue.trayInfo : [];

      try {
        if (!this.draggedTray.id) {
          throw new Error('托盘信息无效');
        }

        const trayIndex = sourceQueue.trayInfo.findIndex(t => t.trayCode === this.draggedTray.id);
        if (trayIndex === -1) {
          throw new Error('找不到要移动的托盘');
        }

        const [movedTray] = sourceQueue.trayInfo.splice(trayIndex, 1);
        targetQueue.trayInfo.push(movedTray);

        // 更新队列数据
        this.updateQueueTrays(sourceQueue.id, sourceQueue.trayInfo);
        this.updateQueueTrays(targetQueue.id, targetQueue.trayInfo);

        const currentQueueIndex = this.selectedQueueIndex;
        if (currentQueueIndex === targetQueueIndex || currentQueueIndex === this.dragSourceQueue) {
          this.$nextTick(() => {
            this.showTrays(currentQueueIndex);
          });
        }

        // 添加托盘移动日志
        this.addLog(`托盘 ${movedTray.trayCode} 从 ${sourceQueue.queueName} 移动到 ${targetQueue.queueName}`);

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
      const queueIndex = this.queues.findIndex(queue => queue.id === queueId);
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
        const trayIndex = this.selectedQueue.trayInfo.findIndex(t => t.trayCode === tray.id);
        if (trayIndex > -1) {
          this.selectedQueue.trayInfo.splice(trayIndex, 1);

          // 更新队列数据
          this.updateQueueTrays(this.selectedQueue.id, this.selectedQueue.trayInfo);

          // 刷新显示
          this.showTrays(this.selectedQueueIndex);

          // 添加删除托盘日志
          this.addLog(`托盘 ${tray.id} 已从 ${this.selectedQueue.queueName} 删除`);

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
        this.updateQueueTrays(this.selectedQueue.id, this.selectedQueue.trayInfo);

        // 刷新显示
        this.showTrays(this.selectedQueueIndex);

        // 添加新托盘日志
        this.addLog(`新托盘 ${newTray.trayCode} 已添加到 ${this.selectedQueue.queueName}，批次号：${newTray.batchId}`);

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
      const queueIndex = this.queues.findIndex(q => q.id === queueId);
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
    handleCartClick(cartId) {
      // 获取小车对象
      const cart = this.carts.find(c => c.id === cartId);
      if (!cart || !cart.queueId) return;
      
      // 展开队列面板
      this.isQueueExpanded = true;
      
      // 找到队列在数组中的索引
      const queueIndex = this.queues.findIndex(q => q.id === cart.queueId);
      if (queueIndex !== -1) {
        // 选中并显示对应队列
        this.selectedQueueIndex = queueIndex;
        this.showTrays(queueIndex);
      }
    },
    updateQuantity(quantityObj, key, change) {
      this[quantityObj][key] = Math.max(0, parseInt(this[quantityObj][key]) + change).toString();
    },
    updateBufferQuantity(change) {
      this.bufferQuantity = Math.max(0, parseInt(this.bufferQuantity) + change).toString();
    },
    // 发送到预热房的方法
    sendToPreheatingRoom() {
      if (!this.preheatingRoomSelected) {
        this.$message.warning('请先选择预热房');
        return;
      }
      this.addLog(`执行发送到${this.preheatingRoomSelected}预热房操作`);
      this.$message.success(`已发送到${this.preheatingRoomSelected}预热房`);
    },
    // 发送到灭菌房的方法
    sendToDisinfectionRoom() {
      if (!this.disinfectionRoomSelectedFrom || !this.disinfectionRoomSelectedTo) {
        this.$message.warning('请先选择完整');
        return;
      }
      this.addLog(`执行发送从${this.disinfectionRoomSelectedFrom}预热房到${this.disinfectionRoomSelectedTo}灭菌房操作`);
      this.$message.success(`已发送从${this.disinfectionRoomSelectedFrom}预热房到${this.disinfectionRoomSelectedTo}灭菌房`);
    },
    // 发送到立库的方法
    sendToWarehouse() {
      if (!this.warehouseSelectedFrom || !this.warehouseSelectedTo) {
        this.$message.warning('请先选择完整');
        return;
      }
      this.addLog(`执行发送从${this.warehouseSelectedFrom}灭菌房到${this.warehouseSelectedTo}立库操作`);
      this.$message.success(`已发送从${this.warehouseSelectedFrom}灭菌房到${this.warehouseSelectedTo}立库`);
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
      .operation-panel{
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
          .section-title {
            display: flex;
            align-items: center;
            gap: 10px;
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
              background-image: linear-gradient(to right, rgba(72, 146, 254, 1), rgba(71, 207, 245, 1));
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
                    .checkbox-group :deep(.el-checkbox__input.is-checked+.el-checkbox__label) {
                      color: #0ac5a8; /* 选中时标签颜色 */
                    }

                    .checkbox-group :deep(.el-checkbox__input.is-checked .el-checkbox__inner) {
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
    height: calc(100% - 40px);
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
                padding-right: 50px;

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
  right: 80px;  /* 修改位置，为队列按钮留出空间 */
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
</style>