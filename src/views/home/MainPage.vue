<template>
  <div class="smart-workshop">
    <!-- 内容区包装器 -->
    <div class="content-wrapper">
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
                <div class="marker" data-x="200" data-y="150">
                  <div class="pulse"></div>
                  <div class="marker-label">电机101#</div>
                </div>
                <div class="marker marker-show-label" data-x="350" data-y="150">
                  <div class="pulse"></div>
                  <div class="marker-label">光电A</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import HttpUtil from '@/utils/HttpUtil'
import moment from 'moment';

export default {
  name: 'MonitorScreen',
  data() {
    return {
    };
  },
  computed: {},
  mounted() {
    this.initializeMarkers();
  },
  methods: {
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

        const markers = imageWrapper.querySelectorAll('.marker, .marker-with-panel');
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
      });
    },
    beforeDestroy() {
      window.removeEventListener('resize', this.updateMarkerPositions);
    }
  }
};
</script>

<style scoped>
/* 只保留必要的样式 */
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

.content-wrapper {
  flex: 1;
  display: flex;
  min-height: 0;
  overflow: hidden;
}

.main-content {
  flex: 1;
  display: flex;
  padding: 8px 8px 8px 0px;
  box-sizing: border-box;
  overflow: hidden;
  height: 100%;
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

.marker:hover .marker-label {
  opacity: 1;
}

.marker-show-label .marker-label {
  opacity: 1;
}

/* 删除不必要的样式 */
.data-panel {
  display: none; /* 由于没有使用，删除 */
}

.queue-marker {
  display: none; /* 由于没有使用，删除 */
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
    transform: scale(2.5);
    opacity: 0;
  }
}
</style>