<template>
  <div class="smart-workshop">
    <!-- 添加标题区域 -->
    <div class="header" v-show="false">
      <img src="@/assets/header.png" alt="header" class="header-bg">
      <div class="header-content">
        <div class="title">智慧灭菌大屏监控</div>
        <div class="current-time">{{ currentTime }}</div>
      </div>
    </div>
    <!-- 内容区包装器 -->
    <div class="content-wrapper">
      <!-- 左侧面板 -->
      <div class="side-info-panel">
        <!-- PLC状态与订单信息区域 -->
        <div class="plc-info-section">
          <div class="section-header">
            当前执行订单信息
          </div>
          <div class="scrollable-content" style="margin-top: 5px;">
            <div class="status-overview">
              <div class="data-card">
                <div class="data-card-border">
                  <div class="data-card-border-borderTop granient-text">当前批次id</div>
                  <div class="data-card-border-borderDown" style="font-size: 1.3vw;">{{ currentOrder ? currentOrder.orderId : '--' }}</div>
                </div>
              </div>
              <div class="data-card">
                <div class="data-card-border">
                  <div class="data-card-border-borderTop">产品名称</div>
                  <div class="data-card-border-borderDown">{{ currentOrder ? currentOrder.productName : '--' }}</div>
                </div>
              </div>
              <div class="data-card">
                <div class="data-card-border">
                  <div class="data-card-border-borderTop">指定预热房</div>
                  <div class="data-card-border-borderDown">{{ currentOrder ? currentOrder.isPrint1 : '--' }}</div>
                </div>
              </div>
              <div class="data-card">
                <div class="data-card-border">
                  <div class="data-card-border-borderTop">指定灭菌柜</div>
                  <div class="data-card-border-borderDown">{{ currentOrder ? currentOrder.isPrint2 : '--' }}</div>
                </div>
              </div>
              <div class="data-card">
                <div class="data-card-border">
                  <div class="data-card-border-borderTop">进货口</div>
                  <div class="data-card-border-borderDown">{{ currentOrder ? getInputText(currentOrder.inPut) : '--' }}</div>
                </div>
              </div>
              <div class="data-card">
                <div class="data-card-border">
                  <div class="data-card-border-borderTop">出货口</div>
                  <div class="data-card-border-borderDown">{{ currentOrder ? getOutputText(currentOrder.isPrint3) : '--' }}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <!-- 订单信息列表区域 -->
        <div class="order-list-section">
          <div class="section-header">
            <div class="section-title">
              订单信息列表
              <div class="refresh-btn" @click="refreshOrders" :class="{ 'is-loading': isRefreshing }">
                <i class="el-icon-refresh"></i>
              </div>
            </div>
            <div class="order-actions">
              <el-button 
                type="primary" 
                size="small" 
                @click="showHistoryOrders"
                icon="el-icon-time"
              >
                历史订单
              </el-button>
            </div>
          </div>
          <div class="scrollable-content">
            <div class="order-list" v-if="ordersList.length > 0">
              <div 
                v-for="order in ordersList" 
                :key="order.orderId"
                class="order-item"
                :class="order.orderStatus === '0' ? 'pending' : order.orderStatus === '1' ? 'running' : order.orderStatus === '2' ? 'paused' : 'complete'"
              >
                <div class="order-main">
                  <div class="order-header">
                    <span class="order-id">{{ order.orderId }}</span>
                    <span class="order-status" :class="{ 'running': order.orderStatus === '1' }">
                      <i v-if="order.orderStatus === '1'" class="el-icon-loading"></i>
                      {{ getStatusText(order.orderStatus) }}
                    </span>
                    <el-button v-if="order.orderStatus === '1'" type="text" size="small" @click="cancelOrder(order)" :loading="order.isLoading" style="padding: 0px;">
                      取消
                    </el-button>
                  </div>
                  <div class="order-info">
                    <div class="info-row">
                      <div class="info-item">
                        <span class="info-label">产品名称</span>
                        <span class="info-value">{{ order.productName }}</span>
                      </div>
                    </div>
                    <div class="info-row">
                      <div class="info-item">
                        <span class="info-label">订单时间</span>
                        <span class="info-value">{{ order.insertTime }}</span>
                      </div>
                    </div>
                    <div class="info-row">
                      <div class="info-item">
                        <span class="info-label">进货口</span>
                        <span class="info-value">{{ order.inPut === '1' ? '一楼进货' : order.inPut === '2' ? '二楼进货' : '三楼进货' }}</span>
                      </div>
                      <div class="info-item">
                        <span class="info-label">出货口</span>
                        <span class="info-value">{{ order.isPrint3 === '0' ? '不解析' : order.isPrint3 === '1' ? '解析库' : '立体库' }}</span>
                      </div>
                    </div>
                    <div class="info-row">
                      <div class="info-item">
                        <span class="info-label">灭菌柜</span>
                        <span class="info-value">{{ order.isPrint2 }}</span>
                      </div>
                      <div class="info-item">
                        <span class="info-label">预热房</span>
                        <span class="info-value">{{ order.isPrint1 }}</span>
                      </div>
                    </div>
                  </div>
                </div>
                <button 
                  v-if="order.orderStatus === '0'"
                  class="switch-order-btn" 
                  :class="{ 'loading': order.isLoading }"
                  @click="switchOrder(order)"
                  :disabled="order.isLoading"
                >
                  <i v-if="order.isLoading" class="el-icon-loading"></i>
                  <span>执行订单</span>
                </button>
                <button 
                  v-if="order.orderStatus === '1' && isLastQrCodeMatch"
                  class="switch-order-btn complete-btn" 
                  :class="{ 'loading': order.isLoading }"
                  @click="finishOrder(order)"
                  :disabled="order.isLoading"
                >
                  <i v-if="order.isLoading" class="el-icon-loading"></i>
                  <span>上货完成</span>
                </button>
              </div>
            </div>
            <!-- 添加空状态显示 -->
            <div v-else class="empty-state">
              <i class="el-icon-document"></i>
              <p>暂无订单信息</p>
              <el-button type="text" @click="refreshOrders">
                <i class="el-icon-refresh"></i>
                点击刷新
              </el-button>
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
                <img src="@/assets/floor1.png" alt="一楼平面图" class="floor-image" @load="updateMarkerPositions">
                <!-- 修改队列标识 -->
                <div 
                  v-for="marker in queueMarkers" 
                  :key="marker.id"
                  class="queue-marker"
                  :data-x="marker.x"
                  :data-y="marker.y"
                  @click="handleQueueMarkerClick(marker.id)"
                >
                  <div class="queue-marker-content">
                    <span class="queue-marker-count">{{ queues.find(q => q.id === marker.queueId)?.trayInfo?.length || 0 }}</span>
                    <span class="queue-marker-name">{{ marker.name }}</span>
                  </div>
                </div>
                <!-- 修改小车元素 -->
                <div 
                  v-for="cart in carts" 
                  :key="cart.id"
                  class="cart-container" 
                  :data-x="cart.x" 
                  :data-y="cart.y" 
                  :data-width="cart.width"
                >
                  <img :src="cart.image" :alt="cart.name" class="cart-image">
                </div>
                <div class="marker" data-x="200" data-y="150">
                  <div class="pulse"></div>
                  <div class="marker-label">电机101#</div>
                </div>
                <div class="marker marker-show-label" data-x="350" data-y="150">
                  <div class="pulse"></div>
                  <div class="marker-label">光电A</div>
                </div>
                <!-- 上货扫码区域提示 -->
                <div class="marker-with-panel" data-x="1365" data-y="1120">
                  <div class="pulse"></div>
                  <div class="data-panel" :class="['position-left', { 'always-show': true }]">
                    <div class="data-panel-header">上货扫码信息</div>
                    <div class="data-panel-content">
                      <div class="data-panel-row">
                        <span class="data-panel-label">当前批次：</span>
                        <span>{{ currentOrder ? currentOrder.orderId : '--' }}</span>
                      </div>
                      <div class="data-panel-row">
                        <span class="data-panel-label">当前上货扫码信息：</span>
                        <span>{{ currentUploadQrCode || '--' }}</span>
                      </div>
                      <div class="data-panel-row" v-if="currentOrder && currentOrder.qrCode && currentUploadQrCode && isLastQrCodeMatch">
                        <span>
                          <i class="el-icon-success" style="color: #67c23a;"></i>
                          <span class="data-panel-label" style="color: #67c23a; font-weight: bold;">当前批次上货完成，允许执行下一订单</span>
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
                <!-- 上货点信息 -->
                <div class="marker-with-panel" data-x="1490" data-y="900">
                  <div class="pulse"></div>
                  <div class="data-panel" style="width: 90px;" :class="['position-right', { 'always-show': true, 'vertical-layout': true }]">
                    <div class="data-panel-header">上货点信息</div>
                    <div class="data-panel-content">
                      <div class="data-panel-row" v-if="currentOrder && currentOrder.inPut === '1'">
                        <span>
                          <i class="el-icon-success" style="color: #67c23a;"></i>
                          <span style="color: #67c23a;font-weight: bold;">允许一楼送货</span>
                        </span>
                      </div>
                      <div class="data-panel-row">
                        <span class="data-panel-label">扫码信息：</span>
                        <div style="display: flex; flex-direction: column; gap: 4px;">
                          <span>{{ currentQrCodeUpload || '--' }}</span>
                          <span v-if="currentOrder && currentOrder.qrCode && currentQrCodeUpload && currentOrder.qrCode.includes(currentQrCodeUpload)">
                            <i class="el-icon-success" style="color: #67c23a;"></i>
                            <span style="color: #67c23a;font-weight: bold;">运行订单包含</span>
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <!-- 下货点信息 -->
                <div class="marker-with-panel" data-x="1230" data-y="62">
                  <div class="pulse"></div>
                  <div class="data-panel" style="padding: 4px 12px;" :class="['position-left', { 'always-show': true }]">
                    <div class="data-panel-content">
                      <div class="data-panel-row">
                        <span class="data-panel-label">扫码信息：</span>
                        <span>20240315001</span>
                      </div>
                      <div class="data-panel-row">
                        <span class="data-panel-label">运行订单信息：</span>
                        <span>20240315001A</span>
                      </div>
                      <div class="data-panel-row">
                        <span class="data-panel-label">指定出口：</span>
                        <span>立体库</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <!-- 右侧区域 -->
          <div class="floor-right" style="width:415px;">
            <!-- 右上区域 -->
            <div class="floor-right-top">
              <div class="floor-title">
                <i class="el-icon-office-building"></i> 二楼区域
              </div>
              <div class="floor-image-container">
                <div class="image-wrapper">
                  <img src="@/assets/floor2.png" alt="二楼平面图" class="floor-image" @load="updateMarkerPositions">
                  <!-- 二楼区域上货点信息-上部分 -->
                  <div class="marker-with-panel" data-x="500" data-y="610">
                    <div class="pulse"></div>
                    <div class="data-panel" style="padding: 4px 12px;width: 140px;" :class="['position-left', { 'always-show': true }]">
                      <div class="data-panel-content">
                        <div class="data-panel-row">
                          <span class="data-panel-label">扫码信息：</span>
                          <span>{{ currentQrCode2A || '--' }}</span>
                        </div>
                        <div class="data-panel-row" v-if="currentOrder && currentOrder.qrCode && currentQrCode2A && currentOrder.qrCode.includes(currentQrCode2A)">
                          <span>
                            <i class="el-icon-success" style="color: #67c23a;"></i>
                            <span class="data-panel-label" style="color: #67c23a; font-weight: bold;">运行订单信息包含</span>
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <!-- 二楼区域上货点信息-下部分 -->
                  <div class="marker-with-panel" data-x="500" data-y="752">
                    <div class="pulse"></div>
                    <div class="data-panel" style="padding: 4px 12px;width: 140px;" :class="['position-left', { 'always-show': true }]">
                      <div class="data-panel-content">
                        <div class="data-panel-row">
                          <span class="data-panel-label">扫码信息：</span>
                          <span>{{ currentQrCode2B || '--' }}</span>
                        </div>
                        <div class="data-panel-row" v-if="currentOrder && currentOrder.qrCode && currentQrCode2B && currentOrder.qrCode.includes(currentQrCode2B)">
                          <span>
                            <i class="el-icon-success" style="color: #67c23a;"></i>
                            <span class="data-panel-label" style="color: #67c23a; font-weight: bold;">运行订单信息包含</span>
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <!-- 二楼区域上货点信息-中间部分-允许2楼A/B上货 -->
                  <div class="marker-with-panel" data-x="620" data-y="502" v-show="currentOrder && currentOrder.inPut === '2'">
                    <div class="pulse"></div>
                    <div class="data-panel" style="padding: 4px 12px;width: 140px;" :class="['position-left', { 'always-show': true }]">
                      <div class="data-panel-content">
                        <div class="data-panel-row" style="margin-bottom: 0px;">
                          <span>
                            <i class="el-icon-success" style="color: #67c23a;"></i>
                            <span class="data-panel-label" style="color: #67c23a; font-weight: bold;">允许2楼A/B上货</span>
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <!-- 右下区域 -->
            <div class="floor-right-bottom">
              <div class="floor-title">
                <i class="el-icon-office-building"></i> 三楼区域
              </div>
              <div class="floor-image-container">
                <div class="image-wrapper">
                  <img src="@/assets/floor3.png" alt="三楼平面图" class="floor-image" @load="updateMarkerPositions">
                  <!-- 三楼区域上货点信息-上部分 -->
                  <div class="marker-with-panel" data-x="580" data-y="270">
                    <div class="pulse"></div>
                    <div class="data-panel" style="padding: 4px 12px;width: 140px;" :class="['position-left', { 'always-show': true }]">
                      <div class="data-panel-content">
                        <div class="data-panel-row">
                          <span class="data-panel-label">扫码信息：</span>
                          <span>{{ currentQrCode3A || '--' }}</span>
                        </div>
                        <div class="data-panel-row" v-if="currentOrder && currentOrder.qrCode && currentQrCode3A && currentOrder.qrCode.includes(currentQrCode3A)">
                          <span>
                            <i class="el-icon-success" style="color: #67c23a;"></i>
                            <span class="data-panel-label" style="color: #67c23a; font-weight: bold;">运行订单信息包含</span>
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <!-- 三楼区域上货点信息-下部分 -->
                  <div class="marker-with-panel" data-x="580" data-y="560">
                    <div class="pulse"></div>
                    <div class="data-panel" style="padding: 4px 12px;width: 140px;" :class="['position-left', { 'always-show': true }]">
                      <div class="data-panel-content">
                        <div class="data-panel-row">
                          <span class="data-panel-label">扫码信息：</span>
                          <span>{{ currentQrCode3B || '--' }}</span>
                        </div>
                        <div class="data-panel-row" v-if="currentOrder && currentOrder.qrCode && currentQrCode3B && currentOrder.qrCode.includes(currentQrCode3B)">
                          <span>
                            <i class="el-icon-success" style="color: #67c23a;"></i>
                            <span class="data-panel-label" style="color: #67c23a; font-weight: bold;">运行订单信息包含</span>
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <!-- 三楼区域上货点信息-中间部分-允许3楼A/B上货 -->
                  <div class="marker-with-panel" data-x="650" data-y="402" v-show="currentOrder && currentOrder.inPut === '3'">
                    <div class="pulse"></div>
                    <div class="data-panel" style="padding: 4px 12px;width: 140px;" :class="['position-left', { 'always-show': true }]">
                      <div class="data-panel-content">
                        <div class="data-panel-row" style="margin-bottom: 0px;">
                          <span>
                            <i class="el-icon-success" style="color: #67c23a;"></i>
                            <span class="data-panel-label" style="color: #67c23a; font-weight: bold;">允许3楼A/B上货</span>
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
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
                :key="queue.id"
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
                    v-for="tray in nowTrays"
                    :key="tray.id"
                    class="tray-item"
                    :class="{ 'dragging': isDragging && draggedTray?.id === tray.id }"
                    draggable="true"
                    @dragstart="handleDragStart($event, tray, selectedQueueIndex)"
                    @dragend="handleDragEnd"
                  >
                    <div class="tray-info">
                      <div class="tray-info-row">
                        <span class="tray-name">{{ tray.name }}</span>
                        <span class="tray-batch">批次号: {{ tray.batchId }}</span>
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
                v-for="pos in ['A1', 'B1', 'C1', 'D1', 'E1', 'F1', 'G1']" 
                :key="pos"
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
                v-for="pos in ['A3', 'B3', 'C3', 'D3', 'E3', 'F3', 'G3']" 
                :key="pos"
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
                v-for="pos in ['A3', 'B3', 'C3', 'D3', 'E3', 'F3', 'G3']" 
                :key="pos"
                @click="updateCartPosition(3, pos)"
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
                <div class="qrcode-label">二楼A点位:</div>
                <el-input 
                  v-model="currentQrCode2A" 
                  size="small" 
                  placeholder="输入扫码信息"
                  class="qrcode-input"
                ></el-input>
              </div>
              <div class="qrcode-input-group">
                <div class="qrcode-label">二楼B点位:</div>
                <el-input 
                  v-model="currentQrCode2B" 
                  size="small" 
                  placeholder="输入扫码信息"
                  class="qrcode-input"
                ></el-input>
              </div>
              <div class="qrcode-input-group">
                <div class="qrcode-label">三楼A点位:</div>
                <el-input 
                  v-model="currentQrCode3A" 
                  size="small" 
                  placeholder="输入扫码信息"
                  class="qrcode-input"
                ></el-input>
              </div>
              <div class="qrcode-input-group">
                <div class="qrcode-label">三楼B点位:</div>
                <el-input 
                  v-model="currentQrCode3B" 
                  size="small" 
                  placeholder="输入扫码信息"
                  class="qrcode-input"
                ></el-input>
              </div>
              <div class="qrcode-input-group">
                <div class="qrcode-label">上货点扫码:</div>
                <el-input 
                  v-model="currentQrCodeUpload" 
                  size="small" 
                  placeholder="输入扫码信息"
                  class="qrcode-input"
                ></el-input>
              </div>
              <div class="qrcode-input-group">
                <div class="qrcode-label">上货扫码信息:</div>
                <el-input 
                  v-model="currentUploadQrCode" 
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
          <!-- 添加队列托盘批量移动测试部分 -->
          <div class="test-section">
            <span class="test-label">队列托盘批量移动:</span>
            <div class="queue-move-container">
              <div class="queue-select-group">
                <div class="queue-move-label">源队列:</div>
                <el-select v-model="queueMoveForm.sourceQueueId" size="small" placeholder="请选择源队列">
                  <el-option
                    v-for="queue in queues"
                    :key="queue.id"
                    :label="queue.queueName"
                    :value="queue.id"
                  ></el-option>
                </el-select>
              </div>
              <div class="queue-select-group">
                <div class="queue-move-label">目标队列:</div>
                <el-select v-model="queueMoveForm.targetQueueId" size="small" placeholder="请选择目标队列">
                  <el-option
                    v-for="queue in queues"
                    :key="queue.id"
                    :label="queue.queueName"
                    :value="queue.id"
                  ></el-option>
                </el-select>
              </div>
              <div class="queue-move-actions">
                <el-button 
                  type="primary" 
                  size="small" 
                  @click="moveAllTrays"
                  :disabled="!queueMoveForm.sourceQueueId || !queueMoveForm.targetQueueId || queueMoveForm.sourceQueueId === queueMoveForm.targetQueueId"
                >移动全部托盘</el-button>
              </div>
            </div>
          </div>

          <!-- 添加托盘到上货区测试部分 -->
          <div class="test-section">
            <span class="test-label">托盘上货区操作:</span>
            <div class="upload-area-actions">
              <el-button 
                type="primary" 
                size="small" 
                @click="addCurrentTraysToQueue"
                :disabled="!currentOrder || !currentOrder.qrCode"
              >添加托盘到上货区</el-button>
            </div>
          </div>
        </div>
      </div>
    </div>
    <!-- 历史订单对话框 -->
    <el-dialog
      title="历史订单"
      :visible.sync="historyDialogVisible"
      width="70%"
      append-to-body
      :before-close="handleHistoryDialogClose"
    >
      <div>
        <el-table
          :data="historyOrders"
          style="width: 100%"
          border
          stripe
        >
          <el-table-column
            prop="orderId"
            label="订单编号"
            width="180"
          />
          <el-table-column
            prop="batchId"
            label="订单批号"
            width="180"
          />
          <el-table-column
            prop="insertTime"
            label="订单时间"
            width="180"
          />
          <el-table-column
            prop="productName"
            label="产品名称"
            width="180"
          />
          <el-table-column
            prop="isPrint1"
            label="指定预热房"
            width="100"
          />
          <el-table-column
            prop="isPrint2"
            label="指定灭菌柜"
            width="100"
          />
          <el-table-column
            prop="isPrint3"
            label="指定输出"
            width="100"
          >
            <template slot-scope="scope">
              {{ getOutputText(scope.row.isPrint3) }}
            </template>
          </el-table-column>
          <el-table-column
            prop="inPut"
            label="进货口信息"
            width="100"
          >
            <template slot-scope="scope">
              {{ getInputText(scope.row.inPut) }}
            </template>
          </el-table-column>
          <el-table-column
            prop="qrCode"
            label="托盘信息"
            min-width="200"
            show-overflow-tooltip
          >
            <template slot-scope="scope">
              <div style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                {{ scope.row.qrCode }}
              </div>
            </template>
          </el-table-column>
        </el-table>
        <div class="pagination-container" style="margin-top: 20px; text-align: right;">
          <el-pagination
            @size-change="handleSizeChange"
            @current-change="handleCurrentChange"
            :current-page="currentPage"
            :page-sizes="[10, 20, 50, 100]"
            :page-size="pageSize"
            layout="total, sizes, prev, pager, next, jumper"
            :total="totalHistoryOrders"
          >
          </el-pagination>
        </div>
      </div>
    </el-dialog>

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
      showTestPanel: false,
      buttonStates: {
        start: false,
        stop: false,
        reset: false,
        fault_reset: false,
        clear: false
      },
      activeLogType: 'running',
      activeOrderTab: 'current',
      ordersList: [],
      runningLogs: [],  // 修改为空数组
      alarmLogs: [],    // 修改为空数组
      currentTime: '',
      positions: {
        cart1: {
          A1: { x: 1220, y: 1740 },  // 最下面
          B1: { x: 1085, y: 1740 },
          C1: { x: 905, y: 1740 },  // 扫码位
          D1: { x: 775, y: 1740 },   // 中间
          E1: { x: 608, y: 1740 },
          F1: { x: 478, y: 1740 },   // 最上面
          G1: { x: 318, y: 1740 }     // 左边
        },
        cart2: {
          A3: { x: 1210, y: 795 },
          B3: { x: 1080, y: 795 },
          C3: { x: 905, y: 795 },
          D3: { x: 775, y: 795 },
          E3: { x: 610, y: 795 },
          F3: { x: 480, y: 795 },
          G3: { x: 330, y: 795 }
        },
        cart3: {
          A3: { x: 1210, y: 230 },
          B3: { x: 1080, y: 230 },
          C3: { x: 905, y: 230 },
          D3: { x: 778, y: 230 },
          E3: { x: 613, y: 230 },
          F3: { x: 485, y: 230 },
          G3: { x: 335, y: 230 }
        }
      },
      carts: [
        {
          id: 1,
          name: '小车1',
          cartKey: 'cart1',  // 添加cartKey用于关联positions
          currentPosition: 'A1',
          x: 1220,
          y: 1740,
          width: 150,
          image: require('@/assets/cart.png')
        },
        {
          id: 2,
          name: '小车2',
          cartKey: 'cart2',
          currentPosition: 'A1',
          x: 1210,
          y: 795,
          width: 150,
          image: require('@/assets/cart.png')
        },
        {
          id: 3,
          name: '小车3',
          cartKey: 'cart3',
          currentPosition: 'A1',
          x: 1210,
          y: 226,
          width: 145,
          image: require('@/assets/cart.png')
        }
      ],
      queues: [],
      nowTrays: [],
      draggedTray: null,
      dragSourceQueue: null,
      isQueueExpanded: false,
      selectedQueueIndex: 0,
      isDragging: false,
      isRefreshing: false,
      historyDialogVisible: false,
      historyOrders: [],
      currentPage: 1,
      pageSize: 10,
      totalHistoryOrders: 0,
      currentQrCode2A: '',  // 二楼A点位扫码信息
      currentQrCode2B: '',  // 二楼B点位扫码信息
      currentQrCode3A: '',  // 三楼A点位扫码信息
      currentQrCode3B: '',  // 三楼B点位扫码信息
      currentQrCodeUpload: '',  // 上货扫码区域信息
      currentUploadQrCode: '',  // 上货点扫码信息
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
      queueMoveForm: {
        sourceQueueId: '',
        targetQueueId: ''
      },
      // 添加队列位置标识数据
      queueMarkers: [
        { id: 1, name: '上货区', x: 1365, y: 1520 },
        { id: 3, name: 'A1', x: 1216, y: 1600 },
        { id: 4, name: 'B1', x: 1083, y: 1600 },
        { id: 5, name: 'C1', x: 905, y: 1600 },
        { id: 6, name: 'D1', x: 778, y: 1600 },
        { id: 7, name: 'E1', x: 608, y: 1600 },
        { id: 8, name: 'F1', x: 480, y: 1600 },
        { id: 9, name: 'G1', x: 321, y: 1600 },
        { id: 10, name: 'A2', x: 1214, y: 930 },
        { id: 11, name: 'B2', x: 1082, y: 930 },
        { id: 12, name: 'C2', x: 905, y: 930 },
        { id: 13, name: 'D2', x: 778, y: 930 },
        { id: 14, name: 'E2', x: 612, y: 930 },
        { id: 15, name: 'F2', x: 485, y: 930 },
        { id: 16, name: 'G2', x: 328, y: 930 },
        { id: 17, name: 'A3', x: 1214, y: 680 },
        { id: 18, name: 'B3', x: 1082, y: 680 },
        { id: 19, name: 'C3', x: 905, y: 680 },
        { id: 20, name: 'D3', x: 778, y: 680 },
        { id: 21, name: 'E3', x: 612, y: 680 },
        { id: 22, name: 'F3', x: 484, y: 680 },
        { id: 23, name: 'G3', x: 333, y: 680 },
        { id: 26, name: '下货区', x: 1235, y: 145 },
      ],
      logId: 1000,  // 添加一个日志ID计数器
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
    },
    currentOrder() {
      return this.ordersList.find(order => order.orderStatus === '1') || null;
    },
    isLastQrCodeMatch() {
      if (!this.currentOrder || !this.currentOrder.qrCode || !this.currentUploadQrCode) {
        return false;
      }
      const qrCodes = this.currentOrder.qrCode.split(',');
      return this.currentUploadQrCode === qrCodes[qrCodes.length - 1];
    }
  },
  mounted() {
    this.updateTime();
    setInterval(this.updateTime, 1000);
    this.initializeMarkers();
    this.refreshOrders()
    this.queryQueueList();
  },
  methods: {
    changeQueueExpanded() {
      this.isQueueExpanded = !this.isQueueExpanded;
      this.queryQueueList();
    },
    queryQueueList() {
      HttpUtil.post('/queue_info/queryQueueList', {}).then((res)=> {
        // 处理队列数据，解析trayInfo
        const processedQueues = res.data.map(queue => ({
          ...queue,
          trayInfo: queue.trayInfo ? JSON.parse(queue.trayInfo) : []
        }));
        this.queues = processedQueues;
        // 如果当前没有选中的队列，默认选中第一个
        if (this.selectedQueueIndex === 0) {
          this.showTrays(0);
        }
      }).catch((err)=> {
        this.$message.error('查询队列失败，请重试' + err);
      })
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
    getStatusText(status) {
      const statusMap = {
        '0': '待执行',
        '1': '正在执行',
        '2': '已暂停',
        '3': '已完成'
      };
      return statusMap[status] || status;
    },
    updateTime() {
      this.currentTime = new Date().toLocaleString('zh-CN', {
        hour12: false,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });
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

        const markers = imageWrapper.querySelectorAll('.marker, .marker-with-panel, .queue-marker');
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
    getCartPosition(cartId) {
      const cart = this.carts.find(c => c.id === cartId);
      return cart ? cart.currentPosition : null;
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
          batchId: tray.batchId || '--'
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

        await Promise.all([
          this.updateQueueTrays(sourceQueue.id, sourceQueue.trayInfo),
          this.updateQueueTrays(targetQueue.id, targetQueue.trayInfo)
        ]);

        await this.queryQueueList();

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
        await this.queryQueueList();
      } finally {
        this.draggedTray = null;
        this.dragSourceQueue = null;
        this.isDragging = false;
      }
    },
    handleOrderStatusChange(order, newStatus) {
      // 更新订单状态
      const index = this.ordersList.findIndex(o => o.id === order.id);
      if (index !== -1) {
        this.$set(this.ordersList[index], 'orderStatus', newStatus);
      }
      // 根据状态显示不同的消息
      if (newStatus === '1') {
        this.$message.success(`订单 ${order.id} 已开始执行`);
      } else if (newStatus === '3') {
        this.$message.success(`订单 ${order.id} 已完成`);
      }
      // 刷新订单列表
      this.refreshOrders();
    },
    async switchOrder(order) {
      try {
        const runningOrder = this.ordersList.find(order => order.orderStatus === '1');
        // 如果有正在运行的订单
        if (runningOrder) {
          if (this.isLastQrCodeMatch) {
            this.$message.warning('当前批次已完成上货，请先点击"上货完成"按钮完成当前订单');
            return;
          } else {
            this.$message.warning('当前批次上货未完成，请完成上货后再切换下一个订单');
            return;
          }
        }

        await this.$confirm('确认要执行该订单吗？', '提示', {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        });

        // 设置加载状态
        order.isLoading = true;
        const param = {
          id: order.id,
          orderStatus: '1'
        }
        await HttpUtil.post('/order_info/update', param).then((res)=> {
          if(res.code === '200') {
            this.handleOrderStatusChange(order, '1');
            // 根据订单信息调整小车位置
            this.adjustCartsPosition(order);
            // 添加开始订单日志
            this.addLog(`订单 ${order.orderId} 开始执行，产品：${order.productName}，进货口：${this.getInputText(order.inPut)}`);
          } else {
            this.$message.error('启动订单失败，请重试');
          }
        }).catch((err)=> {
          this.$message.error('启动订单失败，请重试');
        }).finally(() => {
          order.isLoading = false;
        });
      } catch (err) {
        // 用户取消操作，不做处理
      }
    },
    // 根据订单信息调整小车位置
    adjustCartsPosition(order) {
      // 小车1对应预热房
      if (order.isPrint1) {
        this.updateCartPosition(1, order.isPrint1);
      }

      // 小车2和小车3对应灭菌区
      if (order.isPrint2) {
          this.updateCartPosition(2, order.isPrint2);
          this.updateCartPosition(3, order.isPrint2);
      }
    },
    async finishOrder(order) {
      try {
        await this.$confirm('确认完成该订单吗？', '提示', {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        });

        // 设置加载状态
        order.isLoading = true;
        const param = {
          id: order.id,
          orderStatus: '3'
        }
        await HttpUtil.post('/order_info/update', param).then((res)=> {
          if(res.code === '200') {
            this.handleOrderStatusChange(order, '3');
            // 添加完成订单日志
            this.addLog(`订单 ${order.orderId} 已完成，产品：${order.productName}`);
          } else {
            this.$message.error('完成订单失败，请重试');
          }
        }).catch((err)=> {
          this.$message.error('完成订单失败，请重试');
        }).finally(() => {
          order.isLoading = false;
        });
      } catch (err) {
        // 用户取消操作，不做处理
      }
    },
    async cancelOrder(order) {
      try {
        await this.$confirm('确认要取消该订单的完成状态吗？', '提示', {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        });
        
        // 设置加载状态
        order.isLoading = true;
        const param = {
          id: order.id,
          orderStatus: '0'  // 改为0，表示待执行状态
        }
        await HttpUtil.post('/order_info/update', param).then((res)=> {
          if(res.code === '200') {
            this.handleOrderStatusChange(order, '0');  // 更新为待执行状态
            this.$message.success('订单状态已更新为待执行');
          } else {
            this.$message.error('取消订单失败，请重试');
          }
        }).catch((err)=> {
          this.$message.error('取消订单失败，请重试');
        }).finally(() => {
          order.isLoading = false;
        });
      } catch (err) {
        // 用户取消操作，不做处理
      }
    },
    async refreshOrders() {
      if (this.isRefreshing) return;
      this.isRefreshing = true;
      // 刷新订单 列表
      await HttpUtil.post('/order_info/queryOrderList', {}).then((res)=> {
        this.ordersList = res.data;
      }).catch((err)=> {
        this.$message.error('刷新订单列表失败，请重试');
      }).finally(()=> {
        this.isRefreshing = false;
      });
    },
    async showHistoryOrders() {
      this.historyDialogVisible = true;
      await this.loadHistoryOrders();
    },
    handleHistoryDialogClose(done) {
      this.historyOrders = [];
      this.currentPage = 1;
      done();
    },
    async loadHistoryOrders() {
      const params = {
        pageNum: this.currentPage,
        pageSize: this.pageSize,
      };
      
      try {
        const res = await HttpUtil.post('/order_info/queryHistoryOrderList', params);
        if (res.code === '200') {
          this.historyOrders = res.data.list;
          this.totalHistoryOrders = res.data.total;
        } else {
          this.$message.error('获取历史订单失败');
        }
      } catch (error) {
        this.$message.error('获取历史订单失败');
      }
    },
    handleSizeChange(val) {
      this.pageSize = val;
      this.loadHistoryOrders();
    },
    handleCurrentChange(val) {
      this.currentPage = val;
      this.loadHistoryOrders();
    },
    getInputText(input) {
      const inputMap = {
        '1': '一楼进货',
        '2': '二楼进货',
        '3': '三楼进货',
        '4': '不解析出口'
      };
      return inputMap[input] || '--';
    },
    getOutputText(output) {
      const outputMap = {
        '0': '不解析',
        '1': '解析库',
        '2': '立体库'
      };
      return outputMap[output] || '--';
    },
    clearAllQrCodes() {
      this.currentQrCode2A = '';
      this.currentQrCode2B = '';
      this.currentQrCode3A = '';
      this.currentQrCode3B = '';
      this.currentQrCodeUpload = '';
      this.currentUploadQrCode = '';
    },
    // 添加更新队列托盘的方法
    updateQueueTrays(queueId, trayInfo) {
      const param = {
        id: queueId,
        trayInfo: JSON.stringify(trayInfo)
      };
      HttpUtil.post('/queue_info/update', param).catch(err => {
        this.$message.error('更新队列信息失败');
        // 失败后刷新队列列表
        this.queryQueueList();
      });
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

          // 更新后端数据
          await this.updateQueueTrays(this.selectedQueue.id, this.selectedQueue.trayInfo);

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

        // 更新后端数据
        await this.updateQueueTrays(this.selectedQueue.id, this.selectedQueue.trayInfo);

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
    // 添加托盘到上货区队列的方法
    async addCurrentTraysToQueue() {
      if (!this.currentOrder || !this.currentOrder.qrCode) {
        this.$message.warning('当前没有运行中的订单或托盘信息为空');
        return;
      }
      
      try {
        const trays = this.currentOrder.qrCode.split(',');
        const currentTime = moment().format('YYYY-MM-DD HH:mm:ss');
        
        if (!this.queues[0]) {
          this.$message.error('上货区队列不存在');
          return;
        }
        
        if (!Array.isArray(this.queues[0].trayInfo)) {
          this.queues[0].trayInfo = [];
        }
        
        const addedTrays = [];
        trays.forEach(tray => {
          if (tray && tray.trim()) {
            const newTray = {
              trayCode: tray.trim(),
              trayTime: currentTime,
              batchId: this.currentOrder.orderId
            };
            this.queues[0].trayInfo.push(newTray);
            addedTrays.push(newTray.trayCode);
          }
        });

        await this.updateQueueTrays(this.queues[0].id, this.queues[0].trayInfo);
        await this.queryQueueList();
        
        // 添加托盘添加日志
        this.addLog(`已添加 ${addedTrays.length} 个托盘到上货区队列，托盘编号：${addedTrays.join('、')}`);
        
        this.$message.success(`成功添加 ${trays.length} 个托盘到上货区队列`);
      } catch (error) {
        console.error('添加托盘失败:', error);
        this.$message.error('添加托盘失败，请重试');
      }
    },
    // 批量移动托盘的方法
    async moveAllTrays() {
      try {
        const sourceQueue = this.queues.find(q => q.id === this.queueMoveForm.sourceQueueId);
        const targetQueue = this.queues.find(q => q.id === this.queueMoveForm.targetQueueId);
        
        if (!sourceQueue || !targetQueue) {
          this.$message.error('队列不存在');
          return;
        }

        sourceQueue.trayInfo = Array.isArray(sourceQueue.trayInfo) ? sourceQueue.trayInfo : [];
        targetQueue.trayInfo = Array.isArray(targetQueue.trayInfo) ? targetQueue.trayInfo : [];

        if (sourceQueue.trayInfo.length === 0) {
          this.$message.warning('源队列没有托盘可移动');
          return;
        }

        await this.$confirm(`确认要将 ${sourceQueue.queueName} 的所有托盘(${sourceQueue.trayInfo.length}个)移动到 ${targetQueue.queueName} 吗？`, '提示', {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        });

        const movedTraysCount = sourceQueue.trayInfo.length;
        const movedTrayCodes = sourceQueue.trayInfo.map(t => t.trayCode).join('、');
        
        targetQueue.trayInfo = [...targetQueue.trayInfo, ...sourceQueue.trayInfo];
        sourceQueue.trayInfo = [];

        await Promise.all([
          this.updateQueueTrays(sourceQueue.id, sourceQueue.trayInfo),
          this.updateQueueTrays(targetQueue.id, targetQueue.trayInfo)
        ]);

        await this.queryQueueList();

        // 添加批量移动日志，包含托盘编号信息
        this.addLog(`已将 ${sourceQueue.queueName} 的 ${movedTraysCount} 个托盘(${movedTrayCodes})移动到 ${targetQueue.queueName}`);

        this.$message.success('托盘批量移动成功');
        
        this.queueMoveForm.sourceQueueId = '';
        this.queueMoveForm.targetQueueId = '';
      } catch (error) {
        if (error !== 'cancel') {
          console.error('移动托盘失败:', error);
          this.$message.error('移动托盘失败，请重试');
        }
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
  }
};
</script>
<style scoped>
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
}

.header {
  position: relative;
  width: 100%;
  height: 80px;
  overflow: hidden;
  flex-shrink: 0;
}

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
}

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

.side-info-panel {
  width: 420px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 8px;
  box-sizing: border-box;
  flex-shrink: 0;
  overflow: hidden;
}

.plc-info-section,
.log-section,
.operation-panel {
  background: rgba(30, 42, 56, 0.8);
  padding: 10px;
  border-radius: 15px;
  box-shadow: 0 10px 20px rgba(0, 0, 0, 0.5);
  color: #f5f5f5;
  box-sizing: border-box;
}

.scrollable-content {
  overflow-y: auto;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 22px;
  color: #0ac5a8;
  font-weight: 900;
}

.section-title {
  display: flex;
  align-items: center;
  gap: 10px;
}

.status-overview {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}

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

.granient-text-order {
  background-image: linear-gradient(to right, rgba(112, 225, 245, 1), rgba(255, 209, 148, 1));
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

.operation-buttons {
  display: flex;
  justify-content: space-between;
  gap: 8px;
  margin-top: 5px;
  padding: 5px;
}

.operation-buttons button {
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
}

.operation-buttons button i {
  font-size: 1.8em;
}

.operation-buttons button span {
  font-size: 12px;
  margin-top: 4px;
}

.operation-buttons button:hover {
  background: linear-gradient(135deg, #4caf50, #0f6b58);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.4);
}

.operation-buttons button.pressed {
  background: linear-gradient(135deg, #4caf50, #2e8b57);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.5);
  transform: scale(0.95);
}

.log-section {
  background: rgba(30, 42, 56, 0.8);
  padding: 10px;
  border-radius: 15px;
  box-shadow: 0 10px 20px rgba(0, 0, 0, 0.5);
  height: 257px;
  display: flex;
  flex-direction: column;
}

.log-section .section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0px 0px 8px 0px;
  color: #0ac5a8;
  font-size: 22px;
  font-weight: 900;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.log-section .section-header .log-tabs {
  display: flex;
  gap: 5px;
}

.log-section .section-header .log-tab {
  position: relative;
  font-size: 14px;
  color: rgba(255, 255, 255, 0.6);
  cursor: pointer;
  padding: 5px 15px;
  border-radius: 4px;
  transition: all 0.3s ease;
}

.log-section .section-header .log-tab.active {
  color: #fff;
  background: rgba(10, 197, 168, 0.2);
}

.log-section .section-header .log-tab:hover:not(.active) {
  color: #0ac5a8;
}

.log-section .section-header .log-tab .alarm-badge {
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

.log-section .scrollable-content {
  flex: 1;
  overflow-y: auto;
  padding: 10px 0;
}

.log-section .scrollable-content::-webkit-scrollbar {
  width: 4px;
}

.log-section .scrollable-content::-webkit-scrollbar-track {
  background: transparent;
}

.log-section .scrollable-content::-webkit-scrollbar-thumb {
  background: rgba(10, 197, 168, 0.2);
  border-radius: 2px;
}

.log-section .scrollable-content::-webkit-scrollbar-thumb:hover {
  background: rgba(10, 197, 168, 0.4);
}

.log-section .log-list {
  padding: 0 10px;
  width: 100%;
  box-sizing: border-box;
}

.log-section .log-item {
  background: rgba(255, 255, 255, 0.03);
  border-radius: 4px;
  padding: 10px;
  margin-bottom: 8px;
  cursor: pointer;
  width: 100%;
  box-sizing: border-box;
}

.log-section .log-item:hover {
  background: rgba(255, 255, 255, 0.05);
}

.log-section .log-item.alarm {
  background: rgba(245, 108, 108, 0.05);
}

.log-section .log-item.alarm.unread {
  background: rgba(245, 108, 108, 0.1);
  border-left: 2px solid #f56c6c;
}

.log-section .log-item .log-time {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.4);
  margin-bottom: 6px;
}

.log-section .log-item .log-item-content {
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

.main-content {
  flex: 1;
  display: flex;
  padding: 8px 8px 8px 0px;
  box-sizing: border-box;
  overflow: hidden;
  height: 100%;
}

.order-list-section {
  background: rgba(30, 42, 56, 0.8);
  padding: 10px;
  border-radius: 15px;
  box-shadow: 0 10px 20px rgba(0, 0, 0, 0.5);
  height: 300px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.order-list-section .scrollable-content {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  padding-right: 10px;
  margin-right: -10px;
}

.order-list-section .scrollable-content::-webkit-scrollbar {
  width: 4px;
}

.order-list-section .scrollable-content::-webkit-scrollbar-track {
  background: transparent;
}

.order-list-section .scrollable-content::-webkit-scrollbar-thumb {
  background: rgba(10, 197, 168, 0.2);
  border-radius: 2px;
}

.order-list-section .scrollable-content::-webkit-scrollbar-thumb:hover {
  background: rgba(10, 197, 168, 0.4);
}

.order-tabs {
  display: flex;
  gap: 5px;
}

.order-tab {
  position: relative;
  font-size: 14px;
  color: rgba(255, 255, 255, 0.6);
  cursor: pointer;
  padding: 5px 15px;
  border-radius: 4px;
  transition: all 0.3s ease;
}

.order-tab.active {
  color: #fff;
  background: rgba(10, 197, 168, 0.2);
}

.order-tab:hover:not(.active) {
  color: #0ac5a8;
}

.order-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 8px 0;
  width: 100%;
  box-sizing: border-box;
}

.order-item {
  width: 100%;
  box-sizing: border-box;
  background: linear-gradient(90deg, 
    rgba(30, 42, 56, 0.95) 0%, 
    rgba(48, 65, 86, 0.85) 50%,
    rgba(48, 65, 86, 0.75) 100%
  );
  border-radius: 6px;
  padding: 12px 15px;
  transition: all 0.3s ease;
  position: relative;
  height: 120px;  /* 增加高度以适应新增的信息 */
  display: flex;
  align-items: center;
  gap: 15px;
  overflow: hidden;
  cursor: pointer;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}

.order-item:hover {
  background: linear-gradient(90deg, 
    rgba(30, 42, 56, 0.98) 0%, 
    rgba(48, 65, 86, 0.9) 50%,
    rgba(48, 65, 86, 0.85) 100%
  );
  transform: translateX(4px);
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.15);
}

.order-item::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  width: 3px;
  height: 100%;
  background: transparent;
  transition: all 0.3s ease;
}

.order-item.pending::before {
  background: #e6a23c;
}

.order-item.running::before {
  background: #409eff;
}

.order-item.completed::before {
  background: #67c23a;
}

.order-item:hover {
  background: linear-gradient(90deg, rgba(30, 42, 56, 0.9) 0%, rgba(48, 65, 86, 0.5) 100%);
  transform: translateX(4px);
}

.order-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
  padding-right: 100px;
}

.order-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin: 0;
  padding: 0;
  border: none;
}

.order-id {
  font-weight: 600;
  color: #fff;
  font-size: 14px;
  letter-spacing: 0.5px;
  white-space: nowrap;
}

.order-status {
  font-size: 11px;
  padding: 2px 8px;
  border-radius: 4px;
  background: rgba(255, 255, 255, 0.1);
  color: #fff;
  white-space: nowrap;
  display: flex;
  align-items: center;
  gap: 4px;
}

.order-status i {
  font-size: 12px;
}

.order-status.running {
  background: rgba(64, 158, 255, 0.15);
  color: #409eff;
}

.order-status.running i {
  animation: rotate 1s linear infinite;
}

.order-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 0;
}

.info-row {
  display: flex;
  align-items: center;
  gap: 20px; /* 增加间距 */
}

.info-item {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
  min-width: 0;
}

.info-label {
  color: rgba(255, 255, 255, 0.45);
  font-size: 12px;
  white-space: nowrap;
  width: 50px;  /* 调整标签宽度 */
  flex-shrink: 0;
}

.info-value {
  color: rgba(255, 255, 255, 0.85);
  font-size: 12px;
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  flex: 1;
  min-width: 0;
}

/* 基础按钮样式 */
.switch-order-btn {
  position: absolute;
  right: 15px;
  top: 50%;
  transform: translateY(-50%);
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: rgba(255, 255, 255, 0.85);
  padding: 0 15px;
  border-radius: 4px;
  font-size: 12px;
  height: 28px;
  min-width: 85px;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  cursor: pointer;
}

/* 普通按钮hover效果 */
.switch-order-btn:not(.complete-btn):hover {
  background: rgba(255, 255, 255, 0.1);
  border-color: rgba(255, 255, 255, 0.2);
}

/* 完成订单按钮样式 */
.switch-order-btn.complete-btn {
  background: linear-gradient(45deg, #67c23a 0%, #85ce61 100%);
  border: 1px solid rgba(103, 194, 58, 0.2);
  color: #fff;
  font-weight: 500;
}

/* 完成订单按钮hover效果，提高优先级 */
.order-item .switch-order-btn.complete-btn:hover {
  border-color: rgba(103, 194, 58, 0.4);
}

/* 禁用和加载状态 */
.switch-order-btn:disabled,
.switch-order-btn.loading {
  cursor: not-allowed;
  opacity: 0.8;
}

.loading-spinner {
  width: 14px;
  height: 14px;
  border: 2px solid rgba(255, 255, 255, 0.2);
  border-top-color: #fff;
}

.floor-container {
  display: flex;
  gap: 10px;
  height: 100%;
  width: 100%;
  min-height: 0;
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
}

.floor-right {
  display: flex;
  flex-direction: column;
  gap: 10px;
  min-height: 0;
  height: 100%;
}

.floor-right-top,
.floor-right-bottom {
  flex: 1;
  background: rgba(30, 42, 56, 0.8);
  padding: 10px;
  border-radius: 15px;
  box-shadow: 0 10px 20px rgba(0, 0, 0, 0.5);
  color: #f5f5f5;
  display: flex;
  flex-direction: column;
  min-height: 0;
  height: calc(50% - 5px);
  overflow: hidden;
}

.floor-title {
  font-size: 22px;
  color: #0ac5a8;
  font-weight: 900;
  padding-bottom: 10px;
  flex-shrink: 0;
}

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
}

.image-wrapper {
  position: relative;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.floor-image {
  display: block;
  max-width: 100%;
  max-height: 100%;
  width: auto;
  height: auto;
  object-fit: contain;
}

.content-wrapper {
  flex: 1;
  display: flex;
  min-height: 0;
  overflow: hidden;
}

.marker {
  position: absolute;
  width: 16px;
  height: 16px;
  transform: translate(-50%, -50%);
  cursor: pointer;
  z-index: 2;
  pointer-events: auto;
}

.marker::before {
  content: '';
  position: absolute;
  width: 100%;
  height: 100%;
  background: rgba(10, 197, 168, 0.8);
  border-radius: 50%;
  animation: glow 2s infinite;
}

.pulse {
  position: absolute;
  width: 100%;
  height: 100%;
  background: rgba(10, 197, 168, 0.4);
  border-radius: 50%;
  animation: pulse 2s infinite;
}

.marker-label {
  position: absolute;
  white-space: nowrap;
  background: rgba(0, 0, 0, 0.8);
  color: #fff;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  bottom: 150%;
  left: 50%;
  transform: translateX(-50%);
  opacity: 0;
  transition: opacity 0.3s;
}

/* 默认隐藏标签，hover时显示 */
.marker:hover .marker-label {
  opacity: 1;
}

/* 始终显示标签的点位 */
.marker-show-label .marker-label {
  opacity: 1;
}

@keyframes glow {
  0% {
    box-shadow: 0 0 0 0 rgba(10, 197, 168, 0.4);
  }
  70% {
    box-shadow: 0 0 0 8px rgba(10, 197, 168, 0);
  }
  100% {
    box-shadow: 0 0 0 0 rgba(10, 197, 168, 0);
  }
}

@keyframes pulse {
  0% {
    transform: scale(1);
    opacity: 1;
  }
  100% {
    transform: scale(2.8);
    opacity: 0;
  }
}

/* 带数据面板的标识点样式 */
.marker-with-panel {
  position: absolute;
  width: 16px;
  height: 16px;
  transform: translate(-50%, -50%);
  cursor: pointer;
  z-index: 2;
}

.marker-with-panel::before {
  content: '';
  position: absolute;
  width: 100%;
  height: 100%;
  background: rgba(64, 158, 255, 0.8);
  border-radius: 50%;
  animation: glow-blue 2s infinite;
}

.marker-with-panel .pulse {
  background: rgba(64, 158, 255, 0.4);
}

.marker-line {
  position: absolute;
  width: 100px;
  height: 2px;
  background: linear-gradient(90deg, rgba(64, 158, 255, 0.8), rgba(64, 158, 255, 0.2));
  transform-origin: left center;
  transition: all 0.3s ease;
}

.data-panel {
  position: absolute;
  background: rgba(30, 42, 56, 0.95);
  border: 1px solid rgba(64, 158, 255, 0.3);
  border-radius: 8px;
  padding: 12px;
  width: 200px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  opacity: 0;
  transition: all 0.3s ease;
  pointer-events: none;
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

/* 悬停时显示面板 */
.marker-with-panel:hover .data-panel:not(.always-show) {
  opacity: 1;
}

/* 始终显示的面板 */
.data-panel.always-show {
  opacity: 1;
}

.data-panel-header {
  font-size: 14px;
  color: #409eff;
  margin-bottom: 8px;
  padding-bottom: 8px;
  border-bottom: 1px solid rgba(64, 158, 255, 0.2);
}

.data-panel-content {
  font-size: 12px;
}

.data-panel-row {
  display: flex;
  justify-content: space-between;
  margin-bottom: 6px;
  color: rgba(255, 255, 255, 0.9);
}

.data-panel-label {
  color: rgba(255, 255, 255, 0.6);
  font-size: 12px;
}

/* 竖向布局样式 */
.data-panel.vertical-layout {
  width: 110px;
  padding: 8px;
}

.data-panel.vertical-layout .data-panel-row {
  flex-direction: column;
  gap: 4px;
  margin-bottom: 8px;
  padding-bottom: 8px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.data-panel.vertical-layout .data-panel-label {
  margin-bottom: 2px;
}

@keyframes glow-blue {
  0% {
    box-shadow: 0 0 0 0 rgba(64, 158, 255, 0.4);
  }
  70% {
    box-shadow: 0 0 0 8px rgba(64, 158, 255, 0);
  }
  100% {
    box-shadow: 0 0 0 0 rgba(64, 158, 255, 0);
  }
}

/* 添加小车样式 */
.cart-container {
  position: absolute;
  transform: translate(-50%, -50%);
  z-index: 3;
  display: flex;
  align-items: center;
  justify-content: center;
}

.cart-image {
  width: 100%;
  height: auto;
  object-fit: contain;
}

/* 添加测试按钮样式 */
.test-buttons {
  margin-top: 10px;
  padding: 10px;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 8px;
}

.test-section {
  margin-bottom: 10px;
}

.test-label {
  display: block;
  color: #0ac5a8;
  margin-bottom: 5px;
  font-size: 14px;
}

.position-buttons {
  display: flex;
  gap: 5px;
  flex-wrap: wrap;
}

.position-btn {
  padding: 4px 8px;
  background: rgba(10, 197, 168, 0.2);
  border: 1px solid rgba(10, 197, 168, 0.5);
  color: #fff;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
  transition: all 0.3s ease;
}

.position-btn:hover {
  background: rgba(10, 197, 168, 0.4);
}

.position-btn:active {
  transform: scale(0.95);
}

/* 添加新的测试面板样式 */
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
  transition: transform 0.3s ease;
  margin-left: 10px;
}

.test-panel-header i.rotated {
  transform: rotate(180deg);
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

/* 移除旧的测试面板样式，添加新的样式 */
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

.queue-section.expanded .section-header {
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
}

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
}

.queue-container-left {
  width: 280px;
  display: flex;
  flex-direction: column;
  overflow-y: auto;
  padding-right: 15px;
  border-right: 1px solid rgba(255, 255, 255, 0.1);
  height: 100%;
  min-height: 0;
}

.queue-container-right {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  padding: 0 15px;
  height: 100%;
  min-height: 0;
}

.queue-container-right .selected-queue-header {
  flex-shrink: 0;
  margin-bottom: 15px;
  padding-bottom: 10px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.queue-container-right .tray-list {
  flex: 1;
  overflow-y: auto;
  min-height: 0;
  padding-right: 5px;
}

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

.tray-count {
  background: rgba(255, 255, 255, 0.1);
  color: rgba(255, 255, 255, 0.7);
  font-size: 12px;
  padding: 2px 8px;
  border-radius: 10px;
  min-width: 24px;
  text-align: center;
}

.tray-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: rgba(48, 65, 85, 0.9);
  margin: 8px 0;
  padding: 12px 15px;
  border-radius: 8px;
  cursor: move;
  transition: all 0.3s ease;
  border: 1px solid rgba(255, 255, 255, 0.15);
}

.tray-item:hover {
  background: rgba(48, 65, 85, 1);
  border-color: rgba(10, 197, 168, 0.5);
  transform: translateX(2px);
}

.tray-item.dragging {
  opacity: 0.6;
  transform: scale(0.98);
  border: 1px dashed rgba(255, 255, 255, 0.3);
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

/* 标题样式 */
.selected-queue-header h3 {
  margin: 0;
  color: rgba(255, 255, 255, 0.9);
  font-size: 16px;
}

.tray-total {
  background: rgba(255, 255, 255, 0.1);
  color: rgba(255, 255, 255, 0.7);
  font-size: 13px;
  padding: 4px 12px;
  border-radius: 15px;
}

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
}

.tray-item:last-child {
  margin-bottom: 0;
}

.tray-item:hover {
  background: rgba(48, 65, 85, 1);
  border-color: rgba(10, 197, 168, 0.5);
}

.tray-item .tray-name {
  font-weight: 500;
  color: rgba(255, 255, 255, 0.9);
  font-size: 14px;
}

.tray-item.dragging {
  opacity: 0.6;
  transform: scale(0.98);
  border: 1px dashed rgba(255, 255, 255, 0.3);
}

/* 收起状态的样式 */
.queue-section:not(.expanded) {
  width: 40px;
  height: 40px;
  padding: 0;
  background: none;
  box-shadow: none;
  border: none;
}

.queue-section:not(.expanded) .section-header {
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
}

.queue-section:not(.expanded) .section-header:hover {
  transform: scale(1.1);
  background: #0db196;
}

.queue-section:not(.expanded) .section-header span {
  display: none;
}

.queue-section:not(.expanded) .section-header i {
  color: #fff;
  font-size: 20px;
  animation: rotate 10s linear infinite;
}

/* 基础样式 */
.queue-section {
  background: rgba(30, 42, 56, 0.95);
  border-radius: 15px;
  box-shadow: 0 10px 20px rgba(0, 0, 0, 0.5);
  color: #f5f5f5;
  box-sizing: border-box;
  transition: all 0.3s ease;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

/* 添加切换订单按钮样式 */
.switch-order-btn {
  position: absolute;
  right: 15px;
  top: 50%;
  transform: translateY(-50%);
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: rgba(255, 255, 255, 0.85);
  padding: 0 15px;
  border-radius: 4px;
  font-size: 12px;
  height: 28px;
  min-width: 85px;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  cursor: pointer;
}

/* 普通按钮hover效果 */
.switch-order-btn:not(.complete-btn):hover {
  background: rgba(255, 255, 255, 0.1);
  border-color: rgba(255, 255, 255, 0.2);
}

/* 完成订单按钮样式 */
.switch-order-btn.complete-btn {
  background: linear-gradient(45deg, #67c23a 0%, #85ce61 100%);
  border: 1px solid rgba(103, 194, 58, 0.2);
  color: #fff;
  font-weight: 500;
}

/* 完成订单按钮hover效果，提高优先级 */
.order-item .switch-order-btn.complete-btn:hover {
  border-color: rgba(103, 194, 58, 0.4);
}

/* 禁用和加载状态 */
.switch-order-btn:disabled,
.switch-order-btn.loading {
  cursor: not-allowed;
  opacity: 0.8;
}

.loading-spinner {
  width: 14px;
  height: 14px;
  border: 2px solid rgba(255, 255, 255, 0.2);
  border-top-color: #fff;
}

.refresh-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.3s ease;
  margin-left: 0; /* 移除左边距 */
  margin-right: 0; /* 移除右边距 */
  background: rgba(10, 197, 168, 0.2);
  border: 1px solid rgba(10, 197, 168, 0.3);
}

.refresh-btn:hover {
  background: rgba(10, 197, 168, 0.3);
  border-color: rgba(10, 197, 168, 0.5);
}

.refresh-btn i {
  font-size: 16px;
  color: #0ac5a8;
  transition: all 0.3s ease;
}

.refresh-btn:hover i {
  color: #fff;
}

.refresh-btn.is-loading i {
  animation: rotate 1s linear infinite;
}

@keyframes rotate {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.order-actions {
  display: flex;
  align-items: center;
  gap: 10px;
}

.order-actions .el-button {
  background: rgba(10, 197, 168, 0.2);
  border: 1px solid rgba(10, 197, 168, 0.3);
  color: #0ac5a8;
  font-size: 12px;
  height: 28px;
  padding: 0 12px;
  display: flex;
  align-items: center;
  gap: 4px;
  transition: all 0.3s ease;
}

.order-actions .el-button:hover {
  background: rgba(10, 197, 168, 0.3);
  border-color: rgba(10, 197, 168, 0.5);
  color: #fff;
}

.order-actions .el-button i {
  font-size: 14px;
}
/* 添加空状态样式 */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 0;
  color: rgba(255, 255, 255, 0.6);
}

.empty-state i {
  font-size: 48px;
  margin-bottom: 16px;
  color: rgba(255, 255, 255, 0.3);
}

.empty-state p {
  font-size: 14px;
  margin: 0 0 16px 0;
}

.empty-state .el-button {
  color: #0ac5a8;
  font-size: 14px;
}

.empty-state .el-button:hover {
  color: #0db196;
}

.empty-state .el-button i {
  font-size: 14px;
  margin-right: 4px;
  color: inherit;
}

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

.tray-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
  width: 100%;
}

.tray-info-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 10px;
}

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

.tray-time {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.5);
}

.queue-header-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.queue-header-actions .el-button {
  background: rgba(10, 197, 168, 0.2);
  border: 1px solid rgba(10, 197, 168, 0.3);
  color: #0ac5a8;
}

.queue-header-actions .el-button:hover:not(:disabled) {
  background: rgba(10, 197, 168, 0.3);
  border-color: rgba(10, 197, 168, 0.5);
  color: #fff;
}

.queue-header-actions .el-button:disabled {
  background: rgba(255, 255, 255, 0.1);
  border-color: rgba(255, 255, 255, 0.1);
  color: rgba(255, 255, 255, 0.4);
}

.tray-item {
  position: relative;
  padding-right: 50px;
}

.tray-item .el-button {
  position: absolute;
  right: 10px;
  top: 50%;
  transform: translateY(-50%);
  opacity: 0;
  transition: opacity 0.3s ease;
}

.tray-item:hover .el-button {
  opacity: 1;
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

.queue-marker {
  position: absolute;
  transform: translate(-50%, -50%);
  cursor: pointer;
  z-index: 10;
  background: rgba(0, 0, 0, 0.6);
  padding: 4px;
  border-radius: 4px;
  border: 1px solid rgba(64, 158, 255, 0.3);
  transition: all 0.3s ease;
  min-width: 40px;
  text-align: center;
}

.queue-marker:hover {
  background: rgba(64, 158, 255, 0.2);
  border-color: rgba(64, 158, 255, 0.5);
}

.queue-marker-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  color: #fff;
  font-size: 12px;
}

.queue-marker-name {
  color: #fff;
}

.queue-marker-count {
  font-size: 14px;
  font-weight: bold;
  color: #409eff;
}

@keyframes glow-blue {
  0% {
    box-shadow: 0 0 0 0 rgba(64, 158, 255, 0.4);
  }
  70% {
    box-shadow: 0 0 0 10px rgba(64, 158, 255, 0);
  }
  100% {
    box-shadow: 0 0 0 0 rgba(64, 158, 255, 0);
  }
}

@keyframes pulse {
  0% {
    transform: scale(1);
    opacity: 1;
  }
  100% {
    transform: scale(2.5);
    opacity: 0;
  }
}
</style>