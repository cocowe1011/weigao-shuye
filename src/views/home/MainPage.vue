<template>
  <div class="main-page-container">
    <div>hi test for you</div>

    <!-- 配置读取失败遮罩 -->
    <div class="config-error-mask" v-if="!configLoaded">
      <div class="config-error-content">
        <div class="config-error-icon">
          <i class="el-icon-warning"></i>
        </div>
        <div class="config-error-text">未获取到机器配置</div>
      </div>
    </div>
  </div>
</template>

<script>
import HttpUtilMes from '@/utils/HttpUtilMes';
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
      configLoaded: false
    };
  },
  watch: {},
  computed: {},
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
    }
  },
  created() {},
  async mounted() {
    // 加载配置
    await this.loadConfig();
    // 监听PLC数据
    ipcRenderer.on('receivedMsg', (event, values, values2) => {
      if (this.configType === 'A') {
        // A配置的变量映射
        this.currentWeight = Number(values.DBW4); // A称当前重量
        this.allowScan = Number(values.DBW8); // A线允许读码
        this.scanInfo1 = values.DBB20 ?? ''; // A-1读码信息
        this.scanInfo2 = values.DBB50 ?? ''; // A-2读码信息
      } else {
        // B配置的变量映射
        this.currentWeight = Number(values.DBW6); // B称当前重量
        this.allowScan = Number(values.DBW10); // B线允许读码
        this.scanInfo1 = values.DBB80 ?? ''; // B-1读码信息
        this.scanInfo2 = values.DBB110 ?? ''; // B-2读码信息
      }
    });
  }
};
</script>
<style lang="less" scoped>
.main-page-container {
  position: relative;
  width: 100%;
  height: 100%;
}

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
</style>
