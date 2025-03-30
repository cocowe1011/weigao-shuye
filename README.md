# WCS-CAINA-AGV-JINAN

## Electron升级说明

本项目已从Electron v13.0.0升级到v20.3.12，主要更改内容如下：

### 依赖更新
- Electron: 从v13.0.0升级到v20.3.12
- 移除了@electron/remote模块，使用自定义ipcBridge替代

### 代码更改
1. 修改了BrowserWindow的webPreferences配置，移除了已弃用的enableRemoteModule选项
2. 创建了ipcBridge.js模块，替代@electron/remote功能
3. 更新了所有使用electron.remote的文件，改为使用ipcBridge
4. 简化了preload.js脚本
5. 添加了ipcMain处理程序来管理全局变量
6. 手动定义了__static变量，用于在Electron v20中正确处理静态资源路径

### 升级注意事项
- 如果遇到依赖安装问题，可以使用cnpm替代npm来安装依赖
- 升级后可能需要重新构建原生模块，可以使用electron-rebuild命令

### 兼容性处理
- 为了确保与Vue 2.6.14的兼容性，选择了Electron v20.3.12版本，而非最新的Electron版本
- 如需进一步升级到更高版本的Electron，需要评估与当前Vue版本的兼容性

### 2023.3.22 更新
- 移除了@electron/remote模块，解决了沙箱渲染器不兼容问题
- 使用ipcRenderer/ipcMain通信替代remote模块，遵循Electron最佳实践
- 创建了自定义ipcBridge实现跨进程通信

# 1
更换图标请先将icon.png放至pubilc目录，并用npm run electron:generate-icons 命令执行

# 2
install前首先将npm版本升级到8.2以上，否则下载的依赖包会报错（node14版本）。