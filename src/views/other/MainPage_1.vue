<template>
  <div class="smart-workshop">
    <!-- 添加标题区域 -->
    <div class="page-title">
      <div class="title-content">
        <div class="title-main">采纳监控系统</div>
        <div class="title-sub">Smart Factory Monitoring System</div>
      </div>
      <div class="system-time">
        {{ currentTime }}
        <div class="pulse-dot"></div>
      </div>
    </div>

    <!-- 流水线动画区，占整个主区域 -->
    <div class="conveyor-section">
      <SmartFactory class="conveyor-animation" ref="smartref" v-show="false"/>
    </div>

    <!-- 左右状态与其他信息区域，悬浮在流水线之上，不遮挡中间 -->
    <div class="side-info-panel left-panel">
      <!-- PLC状态与订单信息区域 -->
      <div class="plc-info-section">
        <div class="section-header">
          订单信息与PLC状态
        </div>
        <div class="scrollable-content" style="margin-top: 5px;">
          <div class="status-overview">
            <div class="data-card">
              <div class="data-card-border">
                <div class="data-card-border-borderTop granient-text">当前批次id</div>
                <div class="data-card-border-borderDown" style="font-size: 1.3vw;">123456678</div>
              </div>
            </div>
            <div class="data-card">
              <div class="data-card-border">
                <div class="data-card-border-borderTop">产品名称</div>
                <div class="data-card-border-borderDown">一次性口罩</div>
              </div>
            </div>
            <div class="data-card">
              <div class="data-card-border">
                <div class="data-card-border-borderTop">指定预热房</div>
                <div class="data-card-border-borderDown">A1</div>
              </div>
            </div>
            <div class="data-card">
              <div class="data-card-border">
                <div class="data-card-border-borderTop">指定灭菌柜</div>
                <div class="data-card-border-borderDown">1#</div>
              </div>
            </div>
            <div class="data-card">
              <div class="data-card-border">
                <div class="data-card-border-borderTop">进货口</div>
                <div class="data-card-border-borderDown">一楼</div>
              </div>
            </div>
            <div class="data-card">
              <div class="data-card-border">
                <div class="data-card-border-borderTop">出货口</div>
                <div class="data-card-border-borderDown">立体库</div>
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
            <div 
              v-for="log in currentLogs" 
              :key="log.id"
              :class="['log-item', { 'alarm': log.type === 'alarm', 'unread': log.unread }]"
              @click="markAsRead(log)"
            >
              <div class="log-time">{{ formatTime(log.timestamp) }}</div>
              <div class="log-item-content">{{ log.message }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 右侧队列信息区 -->
    <div class="side-info-panel-queue right-panel" :style="{'width' : isQueueExpanded? '800px': '20%'}">
      <!-- 队列信息区域 -->
      <div class="queue-section" :class="{ 'expanded': isQueueExpanded }">
        <div class="section-header" @click="isQueueExpanded = !isQueueExpanded">
          队列信息
          <span class="arrow-icon" :class="{'expanded-arrow': isQueueExpanded}">▼</span>
        </div>
        <div v-if="isQueueExpanded" class="expandable-content-queue">
          <div class="queue-container">
            <!-- 左侧队列列表 -->
            <div class="queue-container-left">
              <div
                v-for="(queue, index) in queues"
                :key="queue.id"
                class="queue"
                :class="[queue.type, { active: selectedQueueIndex === index }]"
                @click="showTrays(index)"
                @dragover.prevent
                @drop="handleDrop(index)"
              >
                <div class="queue-header">
                  <span class="queue-name">{{ queue.name }}</span>
                  <span class="tray-count">({{ queue.trays.length }})</span>
                </div>
                <!-- 显示当前队列的托盘预览 -->
                <div class="queue-preview" v-if="queue.trays.length > 0">
                  <span class="preview-item">{{ queue.trays[0].name }}</span>
                  <span v-if="queue.trays.length > 1" class="preview-count">+{{ queue.trays.length - 1 }}</span>
                </div>
              </div>
            </div>
            
            <!-- 右侧托盘列表 -->
            <div class="queue-container-right">
              <div class="selected-queue-header" v-if="selectedQueue">
                <h3>{{ selectedQueue.name }}</h3>
                <span class="tray-total">托盘数量: {{ nowTrays.length }}</span>
              </div>
              <div
                v-for="(tray, trayIndex) in nowTrays"
                :key="tray.id"
                class="tray-item"
                :class="{ 'dragging': isDragging && draggedTray?.id === tray.id }"
                draggable="true"
                @dragstart="handleDragStart($event, tray, selectedQueueIndex, trayIndex)"
                @dragend="handleDragEnd"
              >
                <span class="tray-name">{{ tray.name }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import SmartFactory from './SmartFactory.vue';
import debounce from 'lodash/debounce';
export default {
  name: "MainPage",
  components: {
    SmartFactory
  },
  data() {
    return {
      logs: [{'id':1, 'message': '托盘B 移动到 缓冲1区'}, {'id':2, 'message': '托盘B 移动到 预热区 A1-G2'}, {'id':3, 'message': '托盘B 移动到 缓冲2区'}, {'id':4, 'message': '托盘B 移动到 预热区 A1-G2'}, {'id':5, 'message': '托盘B 移动到 缓冲1区'}],
      plcStatus: '连接中',
      currentLoadInfo: '暂无',
      draggedTray: null,
      dragSourceQueue: null,
      isQueueExpanded: false,
      queues: [
        { 
          id: 1, 
          name: '上货区', 
          type: 'loading', 
          trays: [
            { id: 1, name: '托盘A-01', status: 'idle' },
            { id: 2, name: '托盘A-02', status: 'idle' },
            { id: 3, name: '托盘A-03', status: 'idle' },
            { id: 4, name: '托盘A-04', status: 'idle' },
            { id: 5, name: '托盘A-05', status: 'idle' }
          ]
        },
        { 
          id: 2, 
          name: '缓冲1区', 
          type: 'buffer', 
          trays: [
            { id: 6, name: '托盘B-01', status: 'waiting' },
            { id: 7, name: '托盘B-02', status: 'waiting' },
            { id: 8, name: '托盘B-03', status: 'waiting' }
          ] 
        },
        // 预热区 A1-G2
        ...Array.from({ length: 14 }, (_, i) => {
          const row = String.fromCharCode(65 + (i % 7)); // A-G
          const col = Math.floor(i / 7) + 1; // 1-2
          return {
            id: i + 3,
            name: `${row}${col}`,
            type: 'preheat',
            trays: i % 3 === 0 ? [ // 每隔三个区域添加一些托盘
              { id: 20 + i * 2, name: `托盘P-${row}${col}-01`, status: 'heating' },
              { id: 21 + i * 2, name: `托盘P-${row}${col}-02`, status: 'heating' }
            ] : []
          };
        }),
        { 
          id: 17, 
          name: '缓冲2区', 
          type: 'buffer', 
          trays: [
            { id: 50, name: '托盘C-01', status: 'waiting' },
            { id: 51, name: '托盘C-02', status: 'waiting' },
            { id: 52, name: '托盘C-03', status: 'waiting' },
            { id: 53, name: '托盘C-04', status: 'waiting' }
          ] 
        },
        // 消毒区 1#-7#
        ...Array.from({ length: 7 }, (_, i) => ({
          id: i + 18,
          name: `${i + 1}#`,
          type: 'sterilize',
          trays: i % 2 === 0 ? [ // 偶数消毒添加托盘
            { id: 60 + i * 3, name: `托盘S-${i + 1}-01`, status: 'sterilizing' },
            { id: 61 + i * 3, name: `托盘S-${i + 1}-02`, status: 'sterilizing' },
            { id: 62 + i * 3, name: `托盘S-${i + 1}-03`, status: 'sterilizing' }
          ] : []
        })),
        { 
          id: 25, 
          name: '缓冲3区', 
          type: 'buffer', 
          trays: [
            { id: 90, name: '托盘D-01', status: 'waiting' },
            { id: 91, name: '托盘D-02', status: 'waiting' }
          ] 
        },
        { 
          id: 26, 
          name: '下货区', 
          type: 'unloading', 
          trays: [
            { id: 95, name: '托盘E-01', status: 'completed' },
            { id: 96, name: '托盘E-02', status: 'completed' },
            { id: 97, name: '托盘E-03', status: 'completed' }
          ] 
        }
      ],
      nowTrays: [],
      buttonStates: {
        start: false,
        stop: false,
        reset: false,
        fault_reset: false,
        clear: false
      },
      orderNumber: 'ORD-12345',  // 新增订单号
      orderQuantity: 500,        // 新增订单数量
      currentLoadQuantity: 100,  // 新增当前上货数量
      selectedQueueIndex: 0, // 当前选的队列索引
      isDragging: false,
      activeLogType: 'running',
      runningLogs: [
        {
          id: 1,
          type: 'running',
          message: '托盘A-01 从上货区移动到缓冲1区，等待预热处理',
          timestamp: new Date().getTime() - 30000,
          unread: false
        },
        {
          id: 2,
          type: 'running',
          message: '托盘B-02 完成预热，从预热区A1移动到缓冲2区',
          timestamp: new Date().getTime() - 25000,
          unread: false
        },
        {
          id: 3,
          type: 'running',
          message: '托盘C-03 开始消毒处理，预计持续时间30分钟',
          timestamp: new Date().getTime() - 20000,
          unread: false
        },
        {
          id: 4,
          type: 'running',
          message: '系统自动调度：将托盘D-01从缓冲3区转移至下货区',
          timestamp: new Date().getTime() - 15000,
          unread: false
        },
        {
          id: 5,
          type: 'running',
          message: '批次#12345生产任务开始执行，计划生产数量: 500个',
          timestamp: new Date().getTime() - 10000,
          unread: false
        },
        {
          id: 6,
          type: 'running',
          message: '预热区A2温度已达标，开始执行预热程序',
          timestamp: new Date().getTime() - 5000,
          unread: false
        }
      ],
      alarmLogs: [
        {
          id: 101,
          type: 'alarm',
          message: '【严重警告】预热区A1温度超出正常范围（当前: 85℃，正常: 60-80℃），请立即检查！',
          timestamp: new Date().getTime() - 28000,
          unread: true
        },
        {
          id: 102,
          type: 'alarm',
          message: '【设备警告】消毒柜2#压力异常，当前压力值: 2.8MPa，超出正常范围',
          timestamp: new Date().getTime() - 23000,
          unread: true
        },
        {
          id: 103,
          type: 'alarm',
          message: '【系统警告】缓冲1区托盘堆积，当前数量超过预警值（8/6），请及时处理',
          timestamp: new Date().getTime() - 18000,
          unread: true
        },
        {
          id: 104,
          type: 'alarm',
          message: '【网络警告】与PLC通信延迟超过500ms，请检查网络连接状态',
          timestamp: new Date().getTime() - 13000,
          unread: true
        },
        {
          id: 105,
          type: 'alarm',
          message: '【维护提醒】消毒柜1#已运行超过1000小时，请按计划进行维护保养',
          timestamp: new Date().getTime() - 8000,
          unread: true
        }
      ],
      logSearchKey: '', // 日志搜索关键字
      currentTime: '',
    };
  },
  mounted() {
    this.updateTime();
    // 每秒更新时间
    setInterval(this.updateTime, 1000);
  },
  beforeDestroy() {
  },
  computed: {
    selectedQueue() {
      return this.queues[this.selectedQueueIndex];
    },
    currentLogs() {
      return this.activeLogType === 'running' ? this.runningLogs : this.alarmLogs;
    },
    unreadAlarms() {
      return this.alarmLogs.filter(log => log.unread).length;
    },
    filteredLogs() {
      const logs = this.currentLogs;
      if (!this.logSearchKey) return logs;
      
      const searchKey = this.logSearchKey.toLowerCase();
      return logs.filter(log => 
        log.message.toLowerCase().includes(searchKey) ||
        this.formatTime(log.timestamp).includes(searchKey)
      );
    }
  },
  methods: {
    showTrays(index) {
      this.selectedQueueIndex = index;
      this.nowTrays = this.queues[index].trays;
    },
    handleDragStart(event, tray, queueIndex, trayIndex) {
      this.isDragging = true;
      this.draggedTray = tray;
      this.dragSourceQueue = queueIndex;
      
      // 设置拖拽效果
      event.dataTransfer.effectAllowed = 'move';
      event.dataTransfer.setData('text/plain', tray.id);
      
      // 添加拖拽时的视觉反馈
      setTimeout(() => {
        event.target.classList.add('dragging');
      }, 0);
    },
    handleDragEnd(event) {
      this.isDragging = false;
      event.target.classList.remove('dragging');
    },
    handleDrop(targetQueueIndex) {
      if (!this.draggedTray || this.dragSourceQueue === null) return;
      if (this.dragSourceQueue === targetQueueIndex) return; // 防止拖到同一个队列

      const sourceQueue = this.queues[this.dragSourceQueue];
      const targetQueue = this.queues[targetQueueIndex];

      // 从源队列中移除托盘
      const trayIndex = sourceQueue.trays.findIndex(t => t.id === this.draggedTray.id);
      if (trayIndex > -1) {
        sourceQueue.trays.splice(trayIndex, 1);
      }

      // 添加到目标队列
      targetQueue.trays.push(this.draggedTray);

      // 如果当前显示的是目标队列，更新显示
      if (this.selectedQueueIndex === targetQueueIndex) {
        this.nowTrays = targetQueue.trays;
      }

      // 添加日志
      this.logs.push({
        id: Date.now(),
        message: `${this.draggedTray.name} 从 ${sourceQueue.name} 移动到 ${targetQueue.name}`
      });

      // 重置拖拽状态
      this.draggedTray = null;
      this.dragSourceQueue = null;
      this.isDragging = false;
    },
    toggleButtonState(button) {
      this.buttonStates = {
        start: false,
        stop: false,
        reset: false,
        fault_reset: false,
        clear: false
      }
      this.buttonStates[button] = !this.buttonStates[button]; // 切换按钮的按下/恢复状态
      if (button === 'start') {
        this.$refs.smartref.runbelt(true)
      }
      if (button === 'stop') {
        this.$refs.smartref.runbelt(false)
      }
    },
    handleOperation(action) {
      console.log(`执行操作: ${action}`);
      // 在这里处理操作逻辑
    },
    deleteTray(queueIndex, trayId) {
      const queue = this.queues[queueIndex];
      const trayIndex = queue.trays.findIndex(t => t.id === trayId);
      if (trayIndex > -1) {
        const deletedTray = queue.trays[trayIndex];
        queue.trays.splice(trayIndex, 1);
        this.logs.push({
          id: Date.now(),
          message: `${deletedTray.name} 从 ${queue.name} 中移除`
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
    addRunningLog(message) {
      this.runningLogs.unshift({
        id: Date.now(),
        type: 'running',
        message,
        timestamp: new Date().getTime(),
        unread: false
      });
    },
    addAlarmLog(message) {
      this.alarmLogs.unshift({
        id: Date.now(),
        type: 'alarm',
        message,
        timestamp: new Date().getTime(),
        unread: true
      });
    },
    updateTime() {
      const now = new Date();
      this.currentTime = now.toLocaleString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
      });
    },
  }
};
</script>

<style lang="less" scoped>
.smart-workshop {
  width: 100%;
  height: 100%;
  position: relative;
  display: flex;
  align-items: center;
  background: radial-gradient(circle, rgba(0, 0, 0, 0.85), rgba(15, 32, 39, 0.95));
  padding: 0;
  font-family: 'Roboto', sans-serif;
  overflow: hidden;
  box-sizing: border-box;
}

.conveyor-section {
  width: 100%;
  height: 100%;
}

.conveyor-animation {
  height: 100%;
  width: 100%;
  border-radius: 0;
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.6);
}

.side-info-panel {
  width: 420px;
  position: absolute;
  top: 0;
  z-index: 2;
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 8px;
  box-sizing: border-box;
}

.side-info-panel-queue {
  position: absolute;
  top: 0;
  z-index: 2;
  display: flex;
  flex-direction: column;
  padding: 8px;
  box-sizing: border-box;
  transition: width 0.3s ease-in-out;
  height: 100%;
  overflow: hidden;
}

.left-panel {
  left: 0;
}

.right-panel {
  right: 0;
}

.plc-info-section,
.log-section,
.queue-section,
.operation-panel {
  background: rgba(30, 42, 56, 0.8); /* 透明度略小，保持背景效果 */
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
  cursor: pointer;
  transition: color 0.3s ease;
  font-size: 22px;
  color: #0ac5a8;
  font-weight: 900;
}

h3 {
  margin: 0;
  font-size: 1.6em;
  color: #0ac5a8;
}

.arrow-icon {
  transition: transform 0.3s ease, color 0.3s ease;
}

.arrow-icon:hover {
  color: #0ac5a8;
}

.expanded-arrow {
  transform: rotate(180deg);
}

.expandable-content-queue {
  height: calc(100vh - 150px);
  width: 100%;
  display: flex;
  overflow: hidden;
}

.status-item {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
}

.status-label {
  font-weight: bold;
  font-size: 1.2em;
  color: #0ac5a8;
}

.status-value {
  font-size: 1.6em;
  color: #ffffff;
}

.status-value.connected {
  color: #4caf50;
}

.status-value.disconnected {
  color: #f44336;
}

.queue-container {
  display: flex;
  height: 100%;
  width: 100%;
  background: rgba(30, 42, 56, 0.4);
  border-radius: 15px;
  backdrop-filter: blur(10px);
  padding: 15px;
  gap: 20px;
  overflow: hidden;
}

.queue-container-left {
  width: 280px;
  max-height: 100%;
  overflow-y: auto;
  padding-right: 20px;
  border-right: 1px solid rgba(255, 255, 255, 0.1);

  // 自定义滚动条
  &::-webkit-scrollbar {
    width: 5px;
  }
  
  &::-webkit-scrollbar-track {
    background: rgba(0, 0, 0, 0.1);
    border-radius: 10px;
  }
  
  &::-webkit-scrollbar-thumb {
    background: linear-gradient(45deg, #0ac5a8, #2196F3);
    border-radius: 10px;
    
    &:hover {
      background: linear-gradient(45deg, #0ac5a8, #4CAF50);
    }
  }
}

.queue-container-right {
  flex: 1;
  max-height: 100%;
  overflow-y: auto;
  padding: 0 15px;
  
  // 自定义滚动条
  &::-webkit-scrollbar {
    width: 5px;
  }
  
  &::-webkit-scrollbar-track {
    background: rgba(0, 0, 0, 0.1);
    border-radius: 10px;
  }
  
  &::-webkit-scrollbar-thumb {
    background: linear-gradient(45deg, #0ac5a8, #2196F3);
    border-radius: 10px;
    
    &:hover {
      background: linear-gradient(45deg, #0ac5a8, #4CAF50);
    }
  }
}

.queue {
  background: rgba(48, 65, 85, 0.6);
  border-radius: 12px;
  padding: 15px;
  margin-bottom: 15px;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  border: 1px solid rgba(255, 255, 255, 0.1);
  position: relative;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: linear-gradient(135deg, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0));
    opacity: 0;
    transition: opacity 0.3s ease;
  }

  &:hover {
    transform: translateY(-3px);
    box-shadow: 0 8px 20px rgba(0, 0, 0, 0.2);
    border-color: rgba(10, 197, 168, 0.5);
    
    &::before {
      opacity: 1;
    }
  }

  &.loading { 
    border-left: 4px solid #4CAF50;
    background: linear-gradient(135deg, rgba(76, 175, 80, 0.1), rgba(48, 65, 85, 0.6));
  }
  &.buffer { 
    border-left: 4px solid #2196F3;
    background: linear-gradient(135deg, rgba(33, 150, 243, 0.1), rgba(48, 65, 85, 0.6));
  }
  &.preheat { 
    border-left: 4px solid #FF9800;
    background: linear-gradient(135deg, rgba(255, 152, 0, 0.1), rgba(48, 65, 85, 0.6));
  }
  &.sterilize { 
    border-left: 4px solid #9C27B0;
    background: linear-gradient(135deg, rgba(156, 39, 176, 0.1), rgba(48, 65, 85, 0.6));
  }
  &.unloading { 
    border-left: 4px solid #F44336;
    background: linear-gradient(135deg, rgba(244, 67, 54, 0.1), rgba(48, 65, 85, 0.6));
  }

  // 添加拖拽目标样式
  &.drag-over {
    border-color: #0ac5a8;
    box-shadow: 0 0 15px rgba(10, 197, 168, 0.3);
    transform: translateY(-2px);
  }

  // 添加托盘预览样式
  .queue-preview {
    margin-top: 8px;
    padding: 4px 8px;
    background: rgba(0, 0, 0, 0.2);
    border-radius: 6px;
    font-size: 0.9em;
    display: flex;
    align-items: center;
    justify-content: space-between;

    .preview-item {
      color: rgba(255, 255, 255, 0.9);
    }

    .preview-count {
      background: rgba(255, 255, 255, 0.1);
      padding: 2px 6px;
      border-radius: 10px;
      font-size: 0.8em;
      color: rgba(255, 255, 255, 0.7);
    }
  }
}

.queue-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
  padding: 5px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.queue-name {
  font-weight: bold;
  color: #0ac5a8;
}

.tray-count {
  color: #888;
  font-size: 0.9em;
}

.tray-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: linear-gradient(135deg, rgba(76, 106, 130, 0.7), rgba(44, 62, 80, 0.7));
  margin: 10px 0;
  padding: 15px;
  border-radius: 10px;
  cursor: move;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  border: 1px solid rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(5px);

  &:hover {
    transform: translateX(5px);
    background: linear-gradient(135deg, rgba(46, 90, 141, 0.8), rgba(44, 62, 80, 0.8));
    border-color: rgba(10, 197, 168, 0.5);
    box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);
  }

  .tray-name {
    font-weight: 500;
    color: rgba(255, 255, 255, 0.9);
  }

  &.dragging {
    opacity: 0.5;
    transform: scale(0.95);
    box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
  }
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

.operation-buttons button:active {
  transform: scale(0.95);
}

.status-overview {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
  .data-card {
    box-sizing: border-box;
    height: 75px;
    width: 185px;
    &-border {
      width: 100%;
      height: 100%;
      border-radius: 20px;
      background: linear-gradient(135deg, #2b3d51, #3c4c63);
      box-shadow: 0 8px 16px rgba(0, 0, 0, 0.4);
      &-borderTop {
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
        background-image: linear-gradient(to right, rgba(72, 146, 254, 1) , rgba(71, 207, 245, 1));
        background-clip: text;
        -webkit-background-clip: text;
        color: transparent;
      }
      .granient-text-order {
        background-image: linear-gradient(to right, rgba(112, 225, 245, 1) , rgba(255, 209, 148, 1));
        background-clip: text;
        -webkit-background-clip: text;
        color: transparent;
      }
      &-borderDown {
        font-weight: 700;
        letter-spacing: 0px;
        color: rgba(255, 255, 255, 1);
        text-align: left;
        vertical-align: top;
        font-size: 24px;
        line-height: 28px;
        padding-left: 12px;
      }
    }
  }
}
.tag {
  transition: transform 0.2s ease-in-out; // Smooth transitions for moving tags
}

.selected-queue-header {
  margin-bottom: 15px;
  padding-bottom: 10px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  display: flex;
  justify-content: space-between;
  align-items: center;

  h3 {
    margin: 0;
    color: #0ac5a8;
    font-size: 1.2em;
  }

  .tray-total {
    color: rgba(255, 255, 255, 0.7);
    font-size: 0.9em;
  }
}

.log-section {
  background: rgba(30, 42, 56, 0.8);
  padding: 10px;
  border-radius: 15px;
  box-shadow: 0 10px 20px rgba(0, 0, 0, 0.5);
  height: 300px;
  display: flex;
  flex-direction: column;

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

      &.active {
        color: #fff;
        background: rgba(10, 197, 168, 0.2);
      }

      &:hover:not(.active) {
        color: #0ac5a8;
      }

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
  }

  .scrollable-content {
    flex: 1;
    overflow-y: auto;
    padding: 10px 0;

    &::-webkit-scrollbar {
      width: 4px;
    }
    
    &::-webkit-scrollbar-track {
      background: transparent;
    }
    
    &::-webkit-scrollbar-thumb {
      background: rgba(10, 197, 168, 0.2);
      border-radius: 2px;
      
      &:hover {
        background: rgba(10, 197, 168, 0.4);
      }
    }
  }

  .log-list {
    padding: 0 10px;
    width: 100%;
    box-sizing: border-box;
  }

  .log-item {
    background: rgba(255, 255, 255, 0.03);
    border-radius: 4px;
    padding: 10px;
    margin-bottom: 8px;
    cursor: pointer;
    width: 100%;
    box-sizing: border-box;

    &:hover {
      background: rgba(255, 255, 255, 0.05);
    }

    &.alarm {
      background: rgba(245, 108, 108, 0.05);
      
      &.unread {
        background: rgba(245, 108, 108, 0.1);
        border-left: 2px solid #f56c6c;
      }
    }

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
}

.log-fade-enter-active, 
.log-fade-leave-active {
  transition: all 0.3s ease;
}

.log-fade-enter-from, 
.log-fade-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

.log-fade-move {
  transition: transform 0.3s ease;
}

/* 添加标题样式 */
.page-title {
  position: absolute;
  top: 8px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 1;
  display: flex;
  align-items: center;
  gap: 35px;
  padding: 15px 30px;
  background: linear-gradient(
    135deg, 
    rgba(30, 42, 56, 0.85), 
    rgba(30, 42, 56, 0.65)
  );
  border-radius: 20px;
  box-shadow: 
    0 8px 32px rgba(0, 0, 0, 0.2),
    inset 0 0 0 1px rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.05);
}

.title-content {
  text-align: center;
  padding: 0 10px;
}

.title-main {
  font-size: 28px;
  font-weight: 900;
  margin-bottom: 6px;
  letter-spacing: 3px;
  background: linear-gradient(
    45deg,
    #ffffff 10%,
    #0ac5a8 50%,
    #4cddff 90%
  );
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  text-shadow: 0 2px 15px rgba(10, 197, 168, 0.3);
  position: relative;
  
  &::after {
    content: '';
    position: absolute;
    bottom: -3px;
    left: 0;
    width: 100%;
    height: 2px;
    background: linear-gradient(
      90deg,
      transparent,
      rgba(10, 197, 168, 0.5),
      transparent
    );
  }
}

.title-sub {
  font-size: 15px;
  color: rgba(255, 255, 255, 0.7);
  letter-spacing: 1.5px;
  font-weight: 300;
}

.system-time {
  font-size: 17px;
  color: rgba(255, 255, 255, 0.9);
  padding-left: 25px;
  border-left: 1px solid rgba(255, 255, 255, 0.15);
  display: flex;
  align-items: center;
  gap: 12px;
  font-weight: 300;
  letter-spacing: 0.5px;
}

.pulse-dot {
  width: 8px;
  height: 8px;
  background: linear-gradient(45deg, #0ac5a8, #4cddff);
  border-radius: 50%;
  animation: pulse 2s infinite;
  box-shadow: 0 0 10px rgba(10, 197, 168, 0.5);
}

@keyframes pulse {
  0% {
    transform: scale(1);
    opacity: 1;
    box-shadow: 0 0 0 0 rgba(10, 197, 168, 0.7);
  }
  50% {
    transform: scale(1.1);
    opacity: 0.8;
    box-shadow: 0 0 0 8px rgba(10, 197, 168, 0);
  }
  100% {
    transform: scale(1);
    opacity: 1;
    box-shadow: 0 0 0 0 rgba(10, 197, 168, 0);
  }
}

@media screen and (max-width: 1600px) {
  .smart-workshop {
    grid-template-columns: 380px 1fr 20%;  // 从 400px 改为 380px
  }
  
  .side-info-panel.left-panel {
    width: 380px;  // 从 400px 改为 380px
  }
}

@media screen and (max-width: 1366px) {
  .smart-workshop {
    grid-template-columns: 320px 1fr 20%;  // 从 350px 改为 320px
  }
  
  .side-info-panel.left-panel {
    width: 320px;  // 从 350px 改为 320px
  }
}
</style>
