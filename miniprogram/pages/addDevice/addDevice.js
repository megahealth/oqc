const AV = require('../../libs/av-weapp-min.js');
const app = getApp();
const Chance = require('../../libs/chance.min.js');
Page({
  data: {
    sn: '',
    lastName: '',
    firstName: '',
    phoneNumber: '',
    hasLogIn: false,
    idBaseOrg: '',
    orgName: ''
  },
  onLoad: function (options) {
  },
  scanCode() {
    wx.scanCode({
      success: res => {
        this.setData({
          sn: res.result,
          lastName: '',
          firstName: '',
          phoneNumber: ''
        });
      }
    })
  },
  bindLastName(e) {
    this.setData({
      lastName: e.detail.value
    })
  },
  bindFirstName(e) {
    this.setData({
      firstName: e.detail.value
    })
  },
  bindPhoneNumber(e) {
    this.setData({
      phoneNumber: e.detail.value
    })
  },
  bindIdBaseOrg(e) {
    this.setData({
      idBaseOrg: e.detail.value
    })
  },
  logIn() {
    let idBaseOrg = this.data.idBaseOrg;
    let idBaseOrgPointer = AV.Object.createWithoutData('BaseOrganizations', idBaseOrg);
    new AV.Query('Hotel')
      .equalTo('idBaseOrg', idBaseOrgPointer)
      .first()
      .then(hotel => {
        if (hotel) {
          let orgName = hotel.get('name');
          wx.showToast({
            title: '您的机构是【'+orgName+'】',
            icon: "none",
            duration: 2000
          });
          this.setData({
            hasLogIn: true,
            orgName: orgName
          });
        } else {
          wx.showToast({
            title: '请输入正确的机构ID!',
            icon: "none",
            duration: 2000
          });
        }
      })
  },
  logOut() {
    this.setData({
      hasLogIn: false,
      idBaseOrg: '',
      orgName: '',
    });
  },
  addDevice() {
    let lastname = this.data.lastName;
    let firstname = this.data.firstName;
    let phonenumber = this.data.phoneNumber;
    let idBaseOrg = this.data.idBaseOrg;

    if (this.data.sn == '') {
      wx.showToast({
        title: '请扫码!',
        icon: "none",
        duration: 2000
      });
      return;
    } else if (this.data.lastName == ''|| this.data.firstName == ''||this.data.phoneNumber=='') {
      wx.showToast({
        title: '请完整填写用户姓名和手机号!',
        icon: "none",
        duration: 2000
      });
      return;
    } else {
      let sn = this.data.sn;
      let idBaseOrgPointer = AV.Object.createWithoutData('BaseOrganizations', idBaseOrg);
      new AV.Query('Device')
        .equalTo('deviceSN', sn)
        .equalTo('idBaseOrg', idBaseOrgPointer)
        .first()
        .then(device => {
          if (device) {
            wx.showToast({
              title: '添加失败，系统中已存在该设备！',
              icon: "none",
              duration: 2000
            });
          } else {
            let AlarmSet = AV.Object.extend('AlarmSettings');
            let alarmSet = new AlarmSet();
            let period = {
              starttime: new Date('2018-05-18T14:00:00.655Z'),
              endtime: new Date('2018-05-18T22:00:00.655Z')
            }
            alarmSet.set('period', period);
            alarmSet.set('idBaseOrg', idBaseOrgPointer);
            alarmSet.save().then(function (set) {
              let setPointer = AV.Object.createWithoutData('AlarmSettings', set.id);
              let Patient = AV.Object.extend('Patients');
              let patient = new Patient();
              patient.set('lastname', lastname);
              patient.set('phone', phonenumber);
              patient.set('firstname', firstname);
              patient.set('name', lastname + firstname);
              patient.set('gender', 'M');
              patient.set('idAlarmSet', setPointer);
              patient.set('idBaseOrg', idBaseOrgPointer);
              patient.save().then(function (result) {
                let patientId = result.id;
                let Device = new AV.Object.extend('Device');
                let device = new Device();
                let idPatientPointer = AV.Object.createWithoutData('Patients', patientId);
                device.set('deviceSN', sn);
                device.set('period', '22:00-6:00');
                device.set('cCode','123456');
                device.set('idBaseOrg', idBaseOrgPointer);
                device.set('idPatient', idPatientPointer);
                device.save().then(device => {
                  wx.showToast({
                    title: '添加成功',
                    icon: "success",
                    duration: 1000
                  });
                  this.setData({
                    sn: '',
                    lastName: '',
                    firstName: '',
                    phoneNumber: ''
                  });
                }, error => {
                  console.log('设备添加失败');
                })
              }, function (error) {
                console.log('用户创建失败');
              });
            }, function(error) {
              console.log('告警设置创建失败');
            })
          }
        })
    }
  }
})