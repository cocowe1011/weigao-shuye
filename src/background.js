import { app, BrowserWindow, globalShortcut, ipcMain, Menu, dialog, Tray, screen } from 'electron';
import { createProtocol } from 'vue-cli-plugin-electron-builder/lib';
import nodes7 from 'nodes7';
import HttpUtil from '@/utils/HttpUtil'
import logger from 'electron-log'
// 设置日志文件的保存路径
logger.transports.file.file = app.getPath("userData") + "/app.log";

// 初始化日志记录器
logger.transports.file.level = "info";
logger.transports.console.level = "info";
// 日期样式
logger.transports.file.format = '[{y}-{m}-{d} {h}:{i}:{s}.{ms}] [{level}]{scope} {text}'
console.log(app.getPath("userData"))
logger.transports.file.file = app.getPath("userData") + "/app.log";

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
var appTray = null;
let closeStatus = false;
var conn = new nodes7;
var pollingST = null;
// 定义__static变量，在Electron v20中需要手动定义
const __static = path.join(__dirname, '../public').replace(/\\/g, '\\\\');
// electron 开启热更新
try {
  // 仅在开发环境下启用reloader，并确保module.filename存在
  if (process.env.NODE_ENV === 'development' && module.filename) {
    require('electron-reloader')(module, {});
  }
} catch (err) {
  console.log('Electron reloader error:', err.message);
}

// 添加ipc通信处理
// 处理获取global对象的请求
ipcMain.on('get-global', (event, key) => {
  event.returnValue = global.sharedObject[key]
})

// 处理设置global对象的请求
ipcMain.on('set-global', (event, key, value) => {
  global.sharedObject[key] = value
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

global.sharedObject = {
  userInfo: {}
}
let mainWindow = null;
app.on('ready', () => {
  // Create the browser window.
  mainWindow = new BrowserWindow({
    width: 1100,
    height: 600,
    frame: false,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      webSecurity: false,
      sandbox: false,
      preload: path.join(__dirname, process.env.NODE_ENV === 'production' ? 'preload.js' : '../src/preload.js')
    },
    icon: './build/icons/icon.ico'
  });

  if (process.env.WEBPACK_DEV_SERVER_URL) {
    // Load the url of the dev server if in development mode
    mainWindow.loadURL(process.env.WEBPACK_DEV_SERVER_URL);
    if (!process.env.IS_TEST) mainWindow.webContents.openDevTools();
  } else {
    createProtocol('app');
    // Load the index.html when not in development
    mainWindow.loadURL('app://./index.html');
    // mainWindow.webContents.openDevTools();
  }
  ipcMain.on('logStatus', (event, arg) => {
    console.log(arg)
    if(arg === 'login') {
      mainWindow.setResizable(true)
      mainWindow.setBounds({ x: 0, y: 0, width: screen.getPrimaryDisplay().workAreaSize.width, height: screen.getPrimaryDisplay().workAreaSize.height });
    } else {
      // 太几把坑了，windows系统setSize center方法失效 必须先mainWindow.unmaximize()
      mainWindow.unmaximize()
      mainWindow.setSize(1100, 600);
      mainWindow.center();
      global.sharedObject.userInfo = {}
      // mainWindow.setResizable(false)
    }
  })
  // 定义自定义事件
  ipcMain.on('close-window', function() {
    mainWindow.close();
  })
  // 定义自定义事件
  ipcMain.on('min-window', (event, arg) => {
    mainWindow.minimize();
  })
  // writeValuesToPLC
  ipcMain.on('writeValuesToPLC', (event, arg1, arg2) => {
    writeValuesToPLC(arg1, arg2);
  })
  // 定义自定义事件
  ipcMain.on('max-window', (event, arg) => {
    if (arg === 'max-window') {
      return mainWindow.maximize()
    }
    mainWindow.unmaximize()
    mainWindow.setBounds({ x: 10, y: 10, width: screen.getPrimaryDisplay().workAreaSize.width - 20, height: screen.getPrimaryDisplay().workAreaSize.height - 20 });
  })
  // 启动plc conPLC
  ipcMain.on('conPLC', (event, arg1, arg2) => {
    if (process.env.NODE_ENV === 'production') {
      conPLC();
    }
    // setInterval(() => {
    //   console.log(writeStrArr.toString());
    // }, 50);
    // sendHeartToPLC()
  })
  mainWindow.on('maximize', () => {
    mainWindow.webContents.send('mainWin-max', 'max-window')
  })
  mainWindow.on('unmaximize', () => {
    mainWindow.webContents.send('mainWin-max', 'unmax-window')
  })
  mainWindow.on('close', (e) => {
    closeStatus = true;
    e.preventDefault(); //先阻止一下默认行为，不然直接关了，提示框只会闪一下
    dialog.showMessageBox({
      type: 'warning',
      title: '提醒！',
      message:'确认关闭程序吗？',
      buttons: ['关闭程序', '放入托盘','取消'],   //选择按钮，点击确认则下面的idx为0，取消为1
      cancelId: 2, //这个的值是如果直接把提示框×掉返回的值，这里设置成和"取消"按钮一样的值，下面的idx也会是1
    }).then(idx => {
      if (idx.response == 2) {
        e.preventDefault();
      } else if(idx.response == 0) {
        mainWindow = null
        app.exit();
      }else{
        mainWindow.setSkipTaskbar(true);
        mainWindow.hide();
      }
    })
  });
  if (process.env.NODE_ENV === 'development') {
    let revert = false;
    setInterval(() => {
      if(mainWindow) {
        if(revert) {
          mainWindow.webContents.send('receivedMsg', {DBW60:0,DBW62:0, DBW68:35580,DBW70:512,DBW72: -1793,DBB100:'HF800SR-1-H                   ',DBB130:'83048880004868800784          ',DBW76:195,DBW80:6000,DBW82:6000,DBW84:6000}, writeStrArr.toString())
        } else {
          mainWindow.webContents.send('receivedMsg', {DBW60:1,DBW62:0, DBW68:35580,DBW70:512,DBW72: -1793,DBB100:'HF800SR-1-H                   ',DBB130:'83048880004868800784          ',DBW76:195,DBW80:6000,DBW82:6000,DBW84:6000}, writeStrArr.toString())
        }
        revert = !revert;
      }
    }, 100);
  }
  setAppTray();
  if (process.env.NODE_ENV === 'production') {
    // 启动Java进程
    spawn(path.join(__static, './jre', 'jre1.8.0_251', 'bin', 'java'), ['-Xmx4096m', '-Xms4096m', '-jar', path.join(__static, './jarlib', 'ccs-deliver-middle.jar')]);
  }

  // 开发者工具
  globalShortcut.register('CommandOrControl+L', () => {
    mainWindow.webContents.openDevTools()
  })
  globalShortcut.register('CommandOrControl+F11', () => {
    mainWindow.isFullScreen() ? mainWindow.setFullScreen(false) : mainWindow.setFullScreen(true);
  })
  // 定义自定义事件
  ipcMain.on('full_screen', function() {
    mainWindow.isFullScreen() ? mainWindow.setFullScreen(false) : mainWindow.setFullScreen(true);
  })
  // 程序启动时判断是否存在报表、日志等本地文件夹，没有就创建
  createFile('batchReport.grf');
  createFile('boxreport.grf');
  // 定义自定义事件
  ipcMain.on('writeLogToLocal', (event, arg) => {
    fs.appendFile("D://css_temp_data/log/" + ((new Date()).toLocaleDateString() + ".txt").replaceAll('/','-'), arg + '\n', function(err) {});
  })
  // 同步映射加速器数据
  // synAccData();
});

function synAccData() {
  HttpUtil.get('/box/synAccData').then(() => {
    pollingST = setTimeout(() => {
      clearTimeout(pollingST);
      synAccData();
    }, 2000);
  }).catch((err)=> {
    HttpUtil.get('/box/recoverAccData').catch(()=> {});
    pollingST = setTimeout(() => {
      clearTimeout(pollingST);
      synAccData();
    }, 2000);
  });
}

function conPLC() {
  logger.info('开始连接PLC')
  // 查询配置
  HttpUtil.get('/cssConfig/getConfig').then((res)=> {
    logger.info(JSON.stringify(res))
    if(!res.data.plcPort) {
      logger.info('配置查询失败')
      // We have an error. Maybe the PLC is not reachable.
      conPLC();
      return false;
    }
    conn.initiateConnection( { port: Number(res.data.plcPort), host: res.data.plcIp, rack: 0, slot: 1, debug: false }, (err) => {
      if (typeof(err) !== "undefined") {
        logger.info('连接PLC失败' + JSON.stringify(err))
        // We have an error. Maybe the PLC is not reachable.
        conPLC();
        return false;
        // process.exit();
      }
      conn.setTranslationCB(function(tag) { return variables[tag]; }); // This sets the "translation" to allow us to work with object names
      logger.info('连接PLC成功')
      // 输送线看门狗心跳
      conn.addItems('DBW0')
      // 输送线当前运行状态
      conn.addItems('DBW2')
      // 允许进料反馈
      conn.addItems('DBW4')
      // A线电机运行信号
      conn.addItems('DBW6')
      // A线光电检测信号
      conn.addItems('DBW8')
      // B线电机运行信号
      conn.addItems('DBW10');
      // B线光电检测信号
      conn.addItems('DBW12');
      // C线电机运行信号
      conn.addItems('DBW14');
      // C线光电检测信号
      conn.addItems('DBW16');
      // D线电机运行信号
      conn.addItems('DBW18');
      // D线光电检测信号
      conn.addItems('DBW20');
      // E线电机运行信号
      conn.addItems('DBW22');
      // E线光电检测信号
      conn.addItems('DBW24');
      // 输送线故障反馈
      conn.addItems('DBW26');
      // 缓存区数量
      conn.addItems('DBW28');
      // 请求上位机下发任务(判断去灭菌还是非灭菌）
      conn.addItems('DBW30');
      // A1数量
      conn.addItems('DBW34');
      // A2数量
      conn.addItems('DBW36');
      // A3数量
      conn.addItems('DBW38');
      // B1数量
      conn.addItems('DBW40');
      // B2数量
      conn.addItems('DBW42');
      // B3数量
      conn.addItems('DBW44');
      // C1数量
      conn.addItems('DBW46');
      // C2数量
      conn.addItems('DBW48');
      // C3数量
      conn.addItems('DBW50');
      // D数量
      conn.addItems('DBW52');
      // E数量
      conn.addItems('DBW58');
      // 上货区电机运行信号（扫码后入队）
      conn.addItems('DBW64');
      // 上货区输送线光电信号
      conn.addItems('DBW66');
      // 预热前小车电机运行信号1#车
      conn.addItems('DBW68');
      // 预热前小车检测信号1#车
      conn.addItems('DBW70');
      // 灭菌前小车电机运行信号2#车
      conn.addItems('DBW72');
      // 灭菌前小车检测信号2#车
      conn.addItems('DBW74');
      // 解析前小车电机运行信号3#车
      conn.addItems('DBW76');
      // 解析前小车检测信号3#车
      conn.addItems('DBW78');
      // 解析后小车电机运行信号4#车
      conn.addItems('DBW80');
      // 解析后小车检测信号4#车
      conn.addItems('DBW82');
      // 扫码枪处光电信号
      conn.addItems('DBW84');
      // 请求上位机下发任务(预热小车前）
      conn.addItems('DBW86');
      // 提升机一楼接货站台扫码数据（托盘号）
      conn.addItems('DBB160');
      // 一楼顶升移栽区扫码数据（扫码后判断方向）（托盘号）
      conn.addItems('DBB190');
      // 提升机二楼接货站台扫码数据（托盘号）
      conn.addItems('DBB220');
      // 提升机三楼接货站台扫码数据（托盘号）
      conn.addItems('DBB250');
      // 提升机四楼接货站台扫码数据（托盘号）
      conn.addItems('DBB280');
      setInterval(() => {
        conn.readAllItems(valuesReady);
      }, 50);
      setInterval(() => {
        // nodes7 代码
        conn.writeItems(writeAddArr, writeStrArr, valuesWritten);
      }, 100);
      // 发送心跳
      sendHeartToPLC()
    });
  }).catch((err)=> {
    logger.info('config error!')
  });
}
let times = 1;
let nowValue = 0;
function sendHeartToPLC() {
  setInterval(() => {
    if(times > 5) {
        times = 1;
        nowValue = 1 - nowValue;
    }
    times++;
    writeValuesToPLC('DBW0', nowValue);
  }, 200); // 每200毫秒执行一次交替
}

function createFile(fileNameVal) {
  const sourcePath = path.join(__static, './report', fileNameVal);// 要复制的文件的路径=
  const destinationPath = 'D://css_temp_data/report'; // 目标文件夹的路径

  // 检查源文件是否存在
  if (!fs.existsSync(sourcePath)) {
    console.error('源文件不存在');
    return;
  }

  // 获取源文件的文件名
  const fileName = path.basename(sourcePath);

  // 构建目标文件的完整路径
  const destinationFilePath = path.join(destinationPath, fileName);

  // 检查目标文件夹是否存在，如果不存在则创建它
  if (!fs.existsSync(destinationPath)) {
    try {
      fs.mkdirSync(destinationPath, { recursive: true });
      console.log('目标文件夹已成功创建');
    } catch (err) {
      console.error('创建目标文件夹时出现错误：', err);
      return;
    }
  }

  const destinationLogPath = 'D://css_temp_data/log'; // 目标文件夹的路径

  // 创建日志的文件夹
  if (!fs.existsSync(destinationLogPath)) {
    try {
      fs.mkdirSync(destinationLogPath, { recursive: true });
      console.log('目标文件夹已成功创建');
    } catch (err) {
      console.error('创建目标文件夹时出现错误：', err);
      return;
    }
  }

  // 检查目标文件是否已经存在
  if (fs.existsSync(destinationFilePath)) {
    console.log('目标文件已存在，跳过复制操作');
  } else {
    try {
      // 使用流的方式复制文件
      fs.copyFileSync(sourcePath, destinationFilePath);
      console.log('文件已成功复制到目标文件夹');
    } catch (err) {
      console.error('文件复制过程中出现错误：', err);
    }
  }
}

var variables = {
  DBW0: 'DB101,INT0', // 心跳
  DBW2: 'DB101,INT2', // 输送线当前运行状态
  DBW4: 'DB101,INT4', // 允许进料反馈
  DBW6: 'DB101,INT6', // A线电机运行信号
  DBW8: 'DB101,INT8', // A线光电检测信号
  DBW10: 'DB101,INT10', // B线电机运行信号
  DBW12: 'DB101,INT12', // B线光电检测信号
  DBW14: 'DB101,INT14', // C线电机运行信号
  DBW16: 'DB101,INT16', // C线光电检测信号
  DBW18: 'DB101,INT18', // D线电机运行信号
  DBW20: 'DB101,INT20', // D线光电检测信号
  DBW22: 'DB101,INT22', // E线电机运行信号
  DBW24: 'DB101,INT24', // E线光电检测信号
  DBW26: 'DB101,INT26', // 输送线故障反馈
  DBW28: 'DB101,INT28', // 缓存区数量
  DBW30: 'DB101,INT30', // 请求上位机下发任务(判断去灭菌还是非灭菌）
  DBW34: 'DB101,INT34', // A1数量
  DBW36: 'DB101,INT36', // A2数量
  DBW38: 'DB101,INT38', // A3数量
  DBW40: 'DB101,INT40', // B1数量
  DBW42: 'DB101,INT42', // B2数量
  DBW44: 'DB101,INT44', // B3数量
  DBW46: 'DB101,INT46', // C1数量
  DBW48: 'DB101,INT48', // C2数量
  DBW50: 'DB101,INT50', // C3数量
  DBW52: 'DB101,INT52', // D数量
  DBW58: 'DB101,INT58', // E数量
  DBW64: 'DB101,INT64', // 上货区电机运行信号（扫码后入队）
  DBW66: 'DB101,INT66', // 上货区输送线光电信号
  DBW68: 'DB101,INT68', // 预热前小车电机运行信号1#车
  DBW70: 'DB101,INT70', // 预热前小车检测信号1#车
  DBW72: 'DB101,INT72', // 灭菌前小车电机运行信号2#车
  DBW74: 'DB101,INT74', // 灭菌前小车检测信号2#车
  DBW76: 'DB101,INT76', // 解析前小车电机运行信号3#车
  DBW78: 'DB101,INT78', // 解析前小车检测信号3#车
  DBW80: 'DB101,INT80', // 解析后小车电机运行信号4#车
  DBW82: 'DB101,INT82', // 解析后小车检测信号4#车
  DBW84: 'DB101,INT84', // 扫码枪处光电信号
  DBW86: 'DB101,INT86', // 请求上位机下发任务(预热小车前）
  DBB160: 'DB101,C160.30', // 提升机一楼接货站台扫码数据（托盘号）
  DBB190: 'DB101,C190.30', // 一楼顶升移栽区扫码数据（扫码后判断方向）（托盘号）
  DBB220: 'DB101,C220.30', // 提升机二楼接货站台扫码数据（托盘号）
  DBB250: 'DB101,C250.30', // 提升机三楼接货站台扫码数据（托盘号）
  DBB280: 'DB101,C280.30', // 提升机四楼接货站台扫码数据（托盘号）
  DBW500: 'DB101,INT500', // WCS看门狗心跳
  DBW502: 'DB101,INT502', // WCS-全线启动
  DBW504: 'DB101,INT504', // WCS-全线停止
  DBW506: 'DB101,INT506', // WCS看门狗心跳
  DBW508: 'DB101,INT508', // WCS-故障复位
  DBW510: 'DB101,INT510', // 接货口全部禁用→写1禁用；写0不禁用
  DBW512: 'DB101,INT512', // 一楼接货口启用→写1启用；写0不启用
  DBW514: 'DB101,INT514', // 二楼接货口启用→写1启用；写0不启用
  DBW516: 'DB101,INT516', // 三楼接货口启用→写1启用；写0不启用
  DBW518: 'DB101,INT518', // 四楼接货口启用→写1启用；写0不启用
  DBW520: 'DB101,INT520', // 一楼D灭菌接货口启用→写1启用；写0不启用
  DBW522: 'DB101,INT522', // 一楼E灭菌接货口启用→写1启用；写0不启用
  DBW524: 'DB101,INT524', // WCS执行进货预热房编号预热房
  DBW526: 'DB101,INT526', // WCS执行出货预热房编号
  DBW528: 'DB101,INT528', // WCS执行进货灭菌柜编号
  DBW530: 'DB101,INT530', // WCS执行出货灭菌柜编号
  DBW532: 'DB101,INT532', // WCS执行进货解析柜编号
  DBW534: 'DB101,INT534', // WCS执行出货解析柜编号
  DBW536: 'DB101,INT536', // WCS执行出货DE灭菌柜编号
  DBW540: 'DB101,INT540', // WCS下发任务完成
  DBW542: 'DB101,INT542', // WCS下发顶升移栽目的地
  DBW544: 'DB101,INT544', // WCS-接货口进货错误
  DBW546: 'DB101,INT546', // WCS-预热柜当前需要进货数量
  DBW548: 'DB101,INT548', // WCS-灭菌柜当前需要进货数量
  DBW550: 'DB101,INT550', // WCS-解析柜当前需要进货数量
  DBW552: 'DB101,INT552', // WCS-D灭菌柜当前需要进货数量
  DBW554: 'DB101,INT554', // WCS-E灭菌柜当前需要进货数量
  
  
};

var writeStrArr = [ 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
var writeAddArr = ['DBW500', 'DBW502', 'DBW504', 'DBW506', 'DBW508', 'DBW510', 'DBW512', 'DBW514', 'DBW516', 'DBW518', 'DBW520', 'DBW522', 'DBW524', 'DBW526', 'DBW528', 'DBW530', 'DBW532', 'DBW534', 'DBW536', 'DBW540', 'DBW542', 'DBW544', 'DBW546', 'DBW548', 'DBW550', 'DBW552', 'DBW554'];

// 给PLC写值
function writeValuesToPLC(add, values) {
  const index = writeAddArr.indexOf(add);
  if (index !== -1) {
    writeStrArr[index] = values;
  } else {
    console.warn(`Address ${add} not found in writeAddArr.`);
  }
}

function valuesWritten(anythingBad) {
  if (anythingBad) { console.log("SOMETHING WENT WRONG WRITING VALUES!!!!"); }
}

function valuesReady(anythingBad, values) {
  if (anythingBad) { console.log("SOMETHING WENT WRONG READING VALUES!!!!"); }
  // console.log(values)
  mainWindow.webContents.send('receivedMsg', values, writeStrArr.toString())
}

const setAppTray = () => {  
  // 系统托盘右键菜单
  var trayMenuTemplate = [
      {
          label: '退出',
          click: function() {
              app.quit()
          }
      }
  ]

  // 系统托盘图标目录
  appTray = new Tray(path.join(__static, './icon.ico'))

  // 图标的上下文菜单
  const contextMenu = Menu.buildFromTemplate(trayMenuTemplate)

  // 设置此托盘图标的悬停提示内容
  appTray.setToolTip('WCS系统')

  // 设置此图标的上下文菜单
  appTray.setContextMenu(contextMenu)

  appTray.on("click", function(){
    //主窗口显示隐藏切换
    if(mainWindow.isVisible()){
      mainWindow.hide();
      mainWindow.setSkipTaskbar(true);
    }else{
      mainWindow.show();
      mainWindow.setSkipTaskbar(false);
    }
  })
}
