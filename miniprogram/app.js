//app.js
App({
  onLaunch: function () {
    const AV = require('./libs/av-weapp-min.js');
    const APP_ID = 'F9tyT5VsLXLCAqxKvTHqzmvP-gzGzoHsz';
    const APP_KEY = '17eIyz42rRL1YubtKE5MgLHm';
    const Chance = './libs/chance.min.js';

    AV.init({
      appId: APP_ID,
      appKey: APP_KEY
    });
    
    if (!wx.cloud) {
      console.error('请使用 2.2.3 或以上的基础库以使用云能力')
    } else {
      wx.cloud.init({
        traceUser: true,
      })
    }

    this.globalData = {
      abc: '123'
    }

    setTimeout(() => {
      const updateManager = wx.getUpdateManager();
      updateManager.onCheckForUpdate(res => {
        // 请求完新版本信息的回调
        console.log(res.hasUpdate);
      })

      updateManager.onUpdateReady(() => {
        wx.showModal({
          title: '更新提示',
          content: '发现新版本，是否更新？',
          success: res => {
            if (res.confirm) {
              // 新的版本已经下载好，调用 applyUpdate 应用新版本并重启
              updateManager.applyUpdate();
            }
          }
        });
      })

      updateManager.onUpdateFailed(() => {
        // 新的版本下载失败
        wx.showModal({
          title: '更新提示',
          content: '新版本更新失败',
          showCancel: false
        })
      })
    }, 3000);
  }
})
