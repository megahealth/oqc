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
    wx.scanCode({
      success: res=>{
        wx.showLoading({
          title: '检测中...',
        })
        let sn = res.result;
        new AV.Query('Device')
          .equalTo('deviceSN', sn)
          .first()
          .then(device=>{
            wx.hideLoading()
            if(device){
              const sn = device.get('deviceSN') || '未知sn';
              const versionNO = device.get('versionNO') || '无版本信息';
              let networkType = device.get('networkType')
              networkType = networkType == 1? 'wifi在线':(networkType == 0?'移动在线':'未知')
              wx.showModal({
                title: sn,
                content: `在线：${networkType}，版本：${versionNO}`,
                confirmText:'继续检测',
                success:res=> {
                  if (res.confirm) {
                    this.getFirmwareVersion()
                  } else if (res.cancel) {
                  }
                }
              })
            }else{
              wx.showToast({
                title: '检测失败，系统中不存在该设备！',
                icon: "none",
                duration: 2000
              })
            }
          },error=>{
            console.log('error',error);
            wx.hideLoading()
            wx.showToast({
              title: '检测失败，发生未知错误！',
              icon: "none",
              duration: 2000
            })
          })
      }
    })
  }
})