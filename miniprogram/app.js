//app.js
App({
  onLaunch: function () {
    const AV = require('./libs/av-weapp-min.js');
    const APP_ID = 'F9tyT5VsLXLCAqxKvTHqzmvP-gzGzoHsz';
    const APP_KEY = '17eIyz42rRL1YubtKE5MgLHm';

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
  }
})
