<template>
  <div class="smart-workshop">
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
  </div>
</template>

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

.left-panel {
  left: 0;
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

<script>
export default {
  name: "MainPage",
  data() {
    return {
      buttonStates: {
        start: false,
        stop: false,
        reset: false,
        fault_reset: false,
        clear: false
      },
      activeLogType: 'running',
      runningLogs: [
        // ... [保留原有的运行日志数据]
      ],
      alarmLogs: [
        // ... [保留原有的报警日志数据]
      ],
    };
  },
  computed: {
    currentLogs() {
      return this.activeLogType === 'running' ? this.runningLogs : this.alarmLogs;
    },
    unreadAlarms() {
      return this.alarmLogs.filter(log => log.unread).length;
    }
  },
  methods: {
    toggleButtonState(button) {
      this.buttonStates = {
        start: false,
        stop: false,
        reset: false,
        fault_reset: false,
        clear: false
      }
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
    }
  }
};
</script>
