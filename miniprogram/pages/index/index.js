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

Page({
  data: {
    sn: '',
    isPass: '',
    time: 0,
    stateCode: 0,
    wifiStateCode: 0,
    passStateCode: 0,
    isAudioPlay: false,
    currentStep: 2,
    wifiTime: 60
  },
  scanCode() {
    this.setData({
      sn: '',
      isPass: '',
      time: 0,
      stateCode: 0,
      wifiStateCode: 0,
      passStateCode: 0,
      isAudioPlay: false,
      currentStep: 2,
      wifiTime: 60
    })
    clearInterval(this.loop);
    clearInterval(this.timeLoop);
    clearInterval(this.wifiLoop);
    wx.scanCode({
      success:res => {
        this.setData({
          sn: res.result
        })
      }
    })
  },
  error(e) {
    console.log(e.detail)
  },
  checkM26() {
    this.setData({
      stateCode: 100
    })
    var sn = this.data.sn;
    new AV.Query('OQC')
      .equalTo('deviceSN', sn)
      .first()
      .then(device => {
        if(device) {
          const radarStatus = device.get('radarStatus');
          const wifiMac = device.get('wifiMac');
          const workStatus = device.get('workStatus');
          const isMobileEnabled = device.get('isMobileEnabled');
          if (wifiMac && workStatus == 1 && radarStatus == 1 && isMobileEnabled == 1) {
            console.log('m26验证通过');
            this.setData({
              stateCode: 200,
              currentStep: 3
            })
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
                  if (i == 20) {
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
                        this.setData({
                          stateCode: 200,
                          currentStep: 3
                        })
                        clearInterval(this.loop);
                      } else {
                        // this.setData({
                        //   stateCode: 101
                        // })
                        console.log('第' + this.data.time + '次重试验证失败');
                        console.log(radarStatus);
                        console.log(wifiMac);
                        console.log(workStatus);
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
                        this.setData({
                          stateCode: 200,
                          currentStep: 3
                        })
                        clearInterval(this.loop);
                      } else {
                        console.log('第' + this.data.time + '次重试验证失败');
                        // this.setData({
                        //   stateCode: 101,
                        //   time: i
                        // })
                        console.log(radarStatus);
                        console.log(wifiMac);
                        console.log(workStatus);
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
    innerAudioContext.src = 'cloud://oqc-d93079.6f71-oqc-d93079/confignet2.m4a'
    innerAudioContext.loop = true
    innerAudioContext.onPlay(() => {
      console.log('开始播放');
      this.setData({
        isAudioPlay: true
      }),
        this.setData({
          wifiStateCode: 101
        });
      var sn = this.data.sn;
      new AV.Query('OQC')
        .equalTo('deviceSN', sn)
        .first()
        .then(device => {
          if (device) {
            const isWifiEnabled = device.get('isWifiEnabled');
            if (isWifiEnabled == 1) {
              console.log('设备wifi验证通过');
              this.setData({
                wifiStateCode: 200,
                currentStep: 4,
                wifiTime: 60
              }),
                clearInterval(this.timeLoop);
            }
          }
        })
      this.wifiLoop = setInterval(() => {
        new AV.Query('OQC')
          .equalTo('deviceSN', sn)
          .first()
          .then(device => {
            if (device) {
              const isWifiEnabled = device.get('isWifiEnabled');
              if (isWifiEnabled == 1) {
                console.log('设备wifi验证通过');
                this.setData({
                  wifiStateCode: 200,
                  currentStep: 4,
                  wifiTime: 60,
                  isAudioPlay: false
                }),
                clearInterval(this.wifiLoop);
                clearInterval(this.timeLoop);
                innerAudioContext.stop();
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
    })
    innerAudioContext.onError((res) => {
      console.log(res.errMsg)
      console.log(res.errCode)
    })
  },
  preePass() {
    var sn = this.data.sn;
    new AV.Query('OQC')
      .equalTo('deviceSN', sn)
      .first()
      .then(device => {
        if (device) {
          const isPass = device.get('isPass');
          if (isPass == 1) {
            console.log('设备已验证通过，请勿重复验证');
            this.setData({
              passStateCode: 201,
            })
          } else {
            device.set('isPass', 1);
            return device.save().then(device => {
              this.setData({
                passStateCode: 200,
              })
            });
          }
        }
      })
  }
})
