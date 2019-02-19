//index.js
const AV = require('../../libs/av-weapp-min.js');
const app = getApp()
// stateCode 
// 0 默认值
// 100 开始验证
// 101 未验证通过，继续轮询验证
// 200 通过
// 201 设备已验证过
// 403 未通过
// 503 超时
// stepCode/currentSetp
// 0 初始值
// 1 重新检测
// 2 检测M26
// 3 检测wifi
// 4 已验证通过

Page({
  data: {
    sn: '',  
    id: '',
    isPass: '',
    time: 0,
    stateCode: 0,
    wifiStateCode: 0,
    pressStateCode: 0,
    isAudioPlay: false,
    currentStep: 1,
    wifiTime: 120
  },
  onLoad() {
    console.log(this.data.currentStep);
  },
  scanCode() {
    this.setData({
      sn: '',
      isPass: '',
      time: 0,
      stateCode: 0,
      wifiStateCode: 0,
      pressStateCode: 0,
      isAudioPlay: false,
      currentStep: 2,
      wifiTime: 120
    })
    clearInterval(this.loop);
    clearInterval(this.timeLoop);
    clearInterval(this.wifiLoop);
    wx.scanCode({
      success:res => {
        this.setData({
          sn: res.result
        });
        let sn = this.data.sn;
        new AV.Query('OQC')
          .equalTo('deviceSN', sn)
          .first()
          .then(device => {
            if(device) {
              let step = device.get('step');
              console.log(step);
              let id = device.get('objectId');
              if (step == 0) { 
                this.setData({
                  currentStep: 2,
                })
              } else if (step == 5) {
                this.setData({
                  currentStep: 1,
                  id: id
                })
              } else if (step == 1 || step == 2 || step == 3||step == 4) {
                let device = AV.Object.createWithoutData('OQC', id);
                device.destroy().then(success => {
                  this.setData({
                    currentStep: 2
                  });
                  console.log('无效记录删除成功');
                });
              }
            } else {
              let Device = new AV.Object.extend('OQC')
              let device = new Device();
              device.set('deviceSN', sn);
              device.set('step', 2);
              device.save().then(device => {
                this.setData({
                  currentStep: 2,
                })
              })
            }
          })
      }
    })
  },
  error(e) {
    console.log(e.detail)
  },
  recheck() {
    let id = this.data.id;
    let isReChecking = false;
    if(id && !isReChecking) {
      isReChecking = true;
      let device = AV.Object.createWithoutData('OQC', id);
      device.destroy().then(success => {
        this.setData({
          currentStep: 2
        });
        isReChecking = false;
      });
    }
  },
  checkM26() {
    this.setData({
      stateCode: 100
    });
    var sn = this.data.sn;
    new AV.Query('OQC')
      .equalTo('deviceSN', sn)
      .first()
      .then(device => {
        if(device) {
          device.set('step', 2);
          device.save();
          const radarStatus = device.get('radarStatus');
          const wifiMac = device.get('wifiMac');
          const workStatus = device.get('workStatus');
          const isMobileEnabled = device.get('isMobileEnabled');
          if (wifiMac && workStatus == 1 && radarStatus == 1 && isMobileEnabled == 1) {
            console.log('m26验证通过');
            device.set('step', 3);
            device.save().then(result => {
              this.setData({
                stateCode: 200,
                currentStep: 3
              });
            });
          } else {
            console.log('验证失败，尝试轮询验证');
            console.log(radarStatus);
            console.log(wifiMac);
            console.log(workStatus);
            // var i = 1;
            this.loop = setInterval(() => {
              new AV.Query('OQC')
                .equalTo('deviceSN', sn)
                .first()
                .then(device => {
                  console.log('已尝试' + this.data.time + '次');
                  var i = this.data.time+1;
                  this.setData({
                    stateCode: 101,
                    time: i
                  })
                  // i++;
                  if (i == 40) {
                    clearInterval(this.loop);
                    console.log('超时失败');
                    this.setData({
                      stateCode: 503
                    })
                  } else {
                    if (device) {
                      const isPass = device.get('isPass');
                      const radarStatus = device.get('radarStatus');
                      const wifiMac = device.get('wifiMac');
                      const workStatus = device.get('workStatus');
                      const isMobileEnabled = device.get('isMobileEnabled');
                      if (wifiMac && workStatus == 1 && radarStatus == 1 && isMobileEnabled == 1) {
                        console.log('m26验证通过');
                        device.set('step', 3);
                        device.save().then(result => {
                          this.setData({
                            stateCode: 200,
                            currentStep: 3
                          });
                        });
                        clearInterval(this.loop);
                      } else {
                        console.log('第' + this.data.time + '次重试验证失败');
                      }
                    }
                  }
                })
            }, 3000);
          }
        } else {
          // 新建、轮询等待
          var Device = new AV.Object.extend('OQC')
          var device = new Device();
          device.set('deviceSN', sn);
          device.set('step', 2);
          device.save().then(device => {
            console.log('设备记录初始化');
            this.loop = setInterval(() => {
              new AV.Query('OQC')
                .equalTo('deviceSN', sn)
                .first()
                .then(device => {
                  console.log('已尝试' + this.data.time + '次');
                  var i = this.data.time+1;
                  this.setData({
                    time: i,
                    stateCode: 101
                  })
                  if (this.data.time == 20) {
                    clearInterval(this.loop);
                    console.log('超时失败');
                    this.setData({
                      stateCode: 503
                    })
                  } else {
                    if (device) {
                      const isPass = device.get('isPass');
                      const radarStatus = device.get('radarStatus');
                      const wifiMac = device.get('wifiMac');
                      const workStatus = device.get('workStatus');
                      const isMobileEnabled = device.get('isMobileEnabled');
                      if (wifiMac && workStatus == 1 && radarStatus == 1 && isMobileEnabled == 1) {
                        console.log('m26验证通过');
                        device.set('step', 3);
                        device.save().then(result => {
                          this.setData({
                            stateCode: 200,
                            currentStep: 3
                          });
                        });
                        clearInterval(this.loop);
                      } else {
                        console.log('第' + this.data.time + '次重试验证失败');
                      }
                    }
                  }
                })
            }, 3000);
          })
          .catch(console.error);
        }
      })
      .catch(console.error);
  },
  configNet() {
    const innerAudioContext = wx.createInnerAudioContext();
    innerAudioContext.autoplay = true
    innerAudioContext.src = 'cloud://oqc-d93079.6f71-oqc-d93079/confignet.m4a'
    innerAudioContext.loop = true
    innerAudioContext.onPlay(() => {
      console.log('播放一次');
    })
    this.setData({
      isAudioPlay: true,
      wifiStateCode: 101,
      wifiTime: 120
    });
    var sn = this.data.sn;
    this.wifiLoop = setInterval(() => {
      new AV.Query('OQC')
        .equalTo('deviceSN', sn)
        .first()
        .then(device => {
          if (device) {
            const isWifiEnabled = device.get('isWifiEnabled');
            if (isWifiEnabled == 1) {
              console.log('设备wifi验证通过');
              device.set('step', 4);
              device.save().then(result => {
                this.setData({
                  wifiStateCode: 200,
                  currentStep: 4,
                  wifiTime: 120,
                  isAudioPlay: false
                }),
                clearInterval(this.wifiLoop);
                clearInterval(this.timeLoop);
                innerAudioContext.stop();
              });
            } else {
              console.log('继续验证wifi');
            }
          }
        })
    }, 3000);
    this.timeLoop = setInterval(() => {
      var time = this.data.wifiTime;
      if (this.data.wifiTime == 0) {
        this.setData({
          wifiStateCode: 503
        });
        clearInterval(this.wifiLoop);
        clearInterval(this.timeLoop);
        innerAudioContext.stop();
      } else {
        this.setData({
          wifiTime: time - 1
        })
      }
    }, 1000)
    innerAudioContext.onError((res) => {
      console.log(res.errMsg)
      console.log(res.errCode)
    })
  },
  pressBtn() {
    let sn = this.data.sn;
    new AV.Query('OQC')
      .equalTo('deviceSN', sn)
      .first()
      .then(device => {
        device.set('step', 5);
        device.set('isPass', 1);
        return device.save().then(success => {
          this.setData({
            currentStep: 5,
            pressStateCode: 200,
            isPass: 1
          });
        });
      })
  }
})
