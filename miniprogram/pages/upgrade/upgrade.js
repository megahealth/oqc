// miniprogram/pages/upgrade/upgrade.js
const AV = require('../../libs/av-weapp-min.js');
const app = getApp();
const Chance = require('../../libs/chance.min.js');
Page({
  data: {
    deviceList: [],
    latestVersion: ''
  },
  onLoad: function (options) {
    new AV.Query('RkDeviceVersionForTest')
      .get('5af3c5ecac502e607660dbfa')
      .then(version => {
        this.setData({
          latestVersion: version.get('versionNum'),
        });
        let idBaseOrgPointer = AV.Object.createWithoutData('BaseOrganizations', '5c10b7000b61600067ea783b');
        new AV.Query('Device')
          .equalTo('idBaseOrg', idBaseOrgPointer)
          .find()
          .then(devices => {
            if(devices) {
              let devList = [];
              devices.forEach(device => {
                devList.push({
                  id: device.get('objectId'),
                  sn: device.get('deviceSN'),
                  version: device.get('versionNO'),
                  needUpdate: this.compareVersion(device.get('versionNO'), this.data.latestVersion),
                  workStatus: device.get('workStatus'),
                  networkType: device.get('networkType'),
                  isAutoUpdate: device.get('isAutoUpdate')
                });
                this.setData({
                  deviceList: devList,
                })
              })
            }
          })
      });
    this.loop = setInterval(() => {
      this.getDeviceList();
    }, 20000);
  },
  compareVersion(version1, version2) {
    const arrayA = version1.split('.');
    const arrayB = version2.split('.');

    let pointer = 0;
    while (pointer < arrayA.length && pointer < arrayB.length) {
        const res = arrayA[pointer] - arrayB[pointer];
        if (res === 0) {
            pointer++;
        } else {
            return res > 0 ? 1 : -1;
        }
    }
    // 若arrayA仍有小版本号
    while (pointer < arrayA.length) {
        if (+arrayA[pointer] > 0) {
            return 1;
        } else {
            pointer++;
        }
    }
    // 若arrayB仍有小版本号
    while (pointer < arrayB.length) {
        if (+arrayB[pointer] > 0) {
            return -1;
        } else {
            pointer++;
        }
    }
    // 版本号完全相同
    return 0;
  },
  addDevice() {
    wx.scanCode({
      success: res => {
        // this.setData({
        //   upgradeSn: res.result
        // });
        console.log('xff',res);
        
        let sn = res.result;
        let idBaseOrgPointer = AV.Object.createWithoutData('BaseOrganizations', '5c10b7000b61600067ea783b');
        new AV.Query('Device')
          .equalTo('deviceSN', sn)
          // .equalTo('idBaseOrg', idBaseOrgPointer)
          .first()
          .then(device => {
            if(device) {
              wx.showToast({
                title: '添加失败，系统中已存在该设备！',
                icon: "none",
                duration: 2000
              });
            } else {
              let Device = new AV.Object.extend('Device')
              let device = new Device();
              device.set('deviceSN', sn);
              device.set('idBaseOrg', idBaseOrgPointer);
              device.save().then(device => {
                let devList = this.data.deviceList;
                devList.push({
                  id: device.get('objectId'),
                  sn: device.get('deviceSN'),
                  version: device.get('versionNO'),
                  workStatus: device.get('workStatus'),
                  networkType: device.get('networkType'),
                  isAutoUpdate: device.get('isAutoUpdate')
                });
                this.setData({
                  deviceList: devList,
                });
                wx.showToast({
                  title: '添加成功',
                  icon: "success",
                  duration: 1000
                });
              })
            }
          })
      }
    })
  },
  updateDevice(e) {
    let id = e.currentTarget.dataset.id;
    const chance = new Chance();
    const device = AV.Object.createWithoutData('Device', id);
    device.set('isAutoUpdate', 1);
    device.set('cCode', chance.string({ length: 6 }));
    device.save().then(device => {
      getDeviceList();
    });
  },
  deleteDevice(e) {
    let id = e.currentTarget.dataset.id;
    var device = AV.Object.createWithoutData('Device', id);
    device.destroy().then(function (success) {
      getDeviceList();
    }, function (error) {
      // 删除失败
    });
  },
  getDeviceList() {
    let idBaseOrgPointer = AV.Object.createWithoutData('BaseOrganizations', '5c10b7000b61600067ea783b');
    new AV.Query('Device')
      .equalTo('idBaseOrg', idBaseOrgPointer)
      .find()
      .then(devices => {
        if (devices) {
          this.setData({
            deviceList: [],
          })
          let devList = [];
          devices.forEach(device => {
            devList.push({
              id: device.get('objectId'),
              sn: device.get('deviceSN'),
              version: device.get('versionNO'),
              needUpdate: this.compareVersion(device.get('versionNO'), this.data.latestVersion),
              workStatus: device.get('workStatus'),
              networkType: device.get('networkType'),
              isAutoUpdate: device.get('isAutoUpdate')
            });
            this.setData({
              deviceList: devList,
            })
          })
        }
      })
  },
  getFirmwareVersion(){
    const that = this;
    wx.scanCode({
      success: res=>{
        wx.showLoading({
          title: '检测中...',
        })
        let sn = res.result;
        if(sn){
          wx.request({
            url: `https://api-shcexam.megahealth.cn/1.1/classes/Device?where={"deviceSN":"${sn}"}`,
            method: 'GET',
            header: {
              'content-type': 'application/json', // 默认值
              'X-LC-Id': 'kHKidLm5ewtXeVffazOMUpJw-9Nh9j0Va',
              'X-LC-Key': 'nS05D0LMaYmsWf1Q6hPXzNVh',
            },
            data:{},
            success (res) {
              if(res.data&&res.data.results.length>0){
                const device = res.data.results[0]
                const currentSn = device.deviceSN || '未知sn';
                const versionNO = device.versionNO || '无版本信息';
                wx.request({
                  method: 'GET',
                  url: 'https://server-shcexam.megahealth.cn/redisApi/deviceDetail?sn='+sn,
                  data: {},
                  header: {
                    'content-type': 'application/json',
                  },
                  success (workStatusRes){
                    wx.hideLoading()
                    const data = workStatusRes.data
                    let workStatus = data.data.workStatus || '0'
                    let networkType = data.data.networkType
                    if(workStatus == '1'){
                      networkType = networkType == 1? 'wifi':(networkType == 0?'移动':'未知')
                    }else{
                      networkType = '不在线'
                    }
                    wx.showModal({
                      title: currentSn,
                      content: `网络：${networkType}，版本：${versionNO}`,
                      confirmText:'继续检测',
                      success:res=> {
                        if (res.confirm) {
                          that.getFirmwareVersion()
                        }
                      }
                    })
                  },
                  fail(error){
                    console.log('error', error);
                    wx.hideLoading();
                    wx.showToast({
                      title: '检测失败，请重试！',
                      icon: "none",
                      duration: 2000
                    })
                  }
                })
              }else{
                wx.hideLoading()
                wx.showToast({
                  title: '检测失败，系统中不存在该设备！',
                  icon: "none",
                  duration: 2000
                })
              }
            },
            fail(error){
              wx.hideLoading();
              wx.showToast({
                title: '检测失败，请重试！',
                icon: "none",
                duration: 2000
              })
            }
          })
        }else{
          wx.showToast({
            title: '二维码不包含sn信息，无法检测！',
            icon: "none",
            duration: 3000
          })
        }
      }
    })
  }
})