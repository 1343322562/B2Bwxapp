
import API from '../../api/index.js'
import { showLoading, hideLoading, alert, toast, gcj02tobd09 } from '../../tool/index.js'
import QQMapWX from '../../tool/qqmap-wx-jssdk.js'
Page({
  data: {
    businessTime: { openTime:'00:00', closeTime:'23:59'  },   // 营业的时间
    deliveryTime: { openTime: '00:00', closeTime: '23:59' }, // 送货时间
    bossName:'',
    branchName:'',
    areaName:'',
    selectedCity: [],
    shopAddrass:'',
    multiArray: [],         // 区域的多列选择器
    multiIndex: [0, 0, 0],
    areaId: '',               // 区域编号
    areaList: [],             // 区域数组列表
    areaListBefore: '',       // 区域原数组 （用来检索区域标号）
    pageLoading: false,
    read: false,
    partnerCode:'',
    onOffTakePhoto:false,                              // 是否开启了门头照、营业执照拍摄
    saleImageURL:'/images/register_add_sale.png',      // 营业执照照片路径
    headerImageURL:'/images/register_add_header.png',  // 门头照照片路径
    licencePic:'',                                     // 上传营业执照后台返回路径信息
    doorPic:'',                                        // 上传门头照后台返回路径信息
    formatted_addresses: ''                            // 具体地址
  },
  // 多列选择器确定时，触发
  bindMultiPickerChange: function (e) {
    this.setData({
      multiIndex: e.detail.value
    })
  },
  // 多列选择器，列表改变时触发
  bindMultiPickerColumnChange: function (e) {
    console.log('修改的列为', e.detail.column, '，值为', e.detail.value);
    // var data = {
    //   multiArray: this.data.multiArray,
    //   multiIndex: this.data.multiIndex
    // };
    // var da = this.data.areaList
    // console.log(da)
    // let indexArr = da.map(item => {
    //   if (item.branchClsparent == '') return item
    // }).filter(e => {return e})
    // let indexArr2 = []
    // indexArr.forEach((item, index) => {
    //   let tempArr = da.map((t, i) => {
    //     if (t.branchClsparent == item.branchClsno) return t
    //   })
    //   indexArr2.push(tempArr.filter(e => {return e}))
    // })
    
    // console.log(indexArr2)
    // let indexArr3 = []
    // indexArr2.forEach((item, index) => {
    //   indexArr3[index] = []
    //   item.forEach(it => {
    //     let tempArr = da.map(t => {
    //       if (t.branchClsparent == it.branchClsno) return t
    //     })
    //     indexArr3[index].push(tempArr.filter(e => {
    //       return e
    //     }))
    //   })
    // })
    // data.multiIndex[e.detail.column] = e.detail.value;
    console.log(this.data.areaList)
    let indexArr = this.data.areaList[0]
    let indexArr2 = this.data.areaList[1]
    let indexArr3 = this.data.areaList[2]
    console.log(1)
    indexArr = indexArr.map(e => {return e.branchClsname})
    console.log(1)
    // 选择首列，更改多列选择数据
    if (e.detail.column == 0) {                          
      if (indexArr2[e.detail.value].length) {
        indexArr2 = indexArr2[e.detail.value].map(e => { return e.branchClsname})
        console.log(1)
      } else {
        indexArr2 = []
      }
      if (indexArr3[e.detail.value].length) {
        if (indexArr3[e.detail.value].length > this.data.multiIndex[1]) {
          console.log(indexArr3[e.detail.value])
          indexArr3 = indexArr3[e.detail.value][this.data.multiIndex[1]].map(e => {return e.branchClsname})
          console.log(1)
        } else if (indexArr3[e.detail.value][0].length) {
          console.log(indexArr3[e.detail.value])
          indexArr3 = indexArr3[e.detail.value][0].map(e => {return e.branchClsname})
          console.log(1)
        } else {
          indexArr3 = []
        }
        
      } else {
        indexArr3 = []
      }
      this.setData({ 
        multiArray: [indexArr, indexArr2, indexArr3],
        multiIndex: [e.detail.value, this.data.multiIndex[1], this.data.multiIndex[2]]
      })
    }

    // 选择首列，更改多列选择数据
    if (e.detail.column == 1){
      console.log(indexArr3[e.detail.value])
      indexArr3 = indexArr3[this.data.multiIndex[0]][e.detail.value].map(e => {return e.branchClsname})
      this.setData({
        multiArray: [this.data.multiArray[0], this.data.multiArray[1] , indexArr3],
        multiIndex: [this.data.multiIndex[0], e.detail.value, this.data.multiIndex[2]]
      })
    }
  },
  // 选择时间后触发
  changeTime (e) {
    console.log(e)
    let currentID = Number(e.currentTarget.dataset.id) // 1：营业开始时间； 2.营业结束时间 3.送货开始时间 4.送货结束时间
    console.log(currentID)
    switch(currentID) {
      case 1:
      console.log(321)
        this.setData({
          'businessTime.openTime': e.detail.value 
        })
        break;
      case 2:
        this.setData({
          'businessTime.closeTime': e.detail.value
        })
        break;
      case 3:
        this.setData({
          'deliveryTime.openTime': e.detail.value
        })
        break;
      case 4:
        this.setData({
          'deliveryTime.closeTime': e.detail.value
        })
        break;
    }
  },
  getValue(e) {
    const k = e.currentTarget.dataset.type
    let obj = {}
    obj[k] = e.detail.value.trim()
    this.setData(obj)
  },
  selectCity(e) {
    const selectedCity = e.detail.value
    this.setData({ selectedCity })
  },
  getAreaList () {
    showLoading('请稍后...')
    API.Login.searchBranchArea({
      data: { platform:'3' },
      success: res => {
        console.log("res:", res)
        if (res.code == 0 && res.data) {
          let da = res.data
          console.log(1)
          let indexArr = da.map(item => {
            if (item.branchClsparent == '' || item.branchClsparent == '1.00') return item
          }).filter(e => {return e})
          let indexArr2 = []
          indexArr.forEach((item, index) => {
            console.log(1)
            let tempArr = da.map((t, i) => {
              if (t.branchClsparent == item.branchClsno) return t
            })
            indexArr2.push(tempArr.filter(e => {return e}))
          })
          
          console.log(indexArr2)
          let indexArr3 = []
          indexArr2.forEach((item, index) => {
            indexArr3[index] = []
            item.forEach(it => {
              console.log(1)
              let tempArr = da.map(t => {
                if (t.branchClsparent == it.branchClsno) return t
              })
              indexArr3[index].push(tempArr.filter(e => {
                return e
              }))
            })
          })
          console.log(1)
          console.log(indexArr)
          console.log(indexArr2)
          console.log(indexArr3)
          this.setData({ 
            areaListBefore: res.data,
            areaList: [indexArr, indexArr2, indexArr3],
            multiArray: [
              indexArr.map(e => {return e.branchClsname}),
              indexArr2[0].length ? indexArr2[0].map(e => {return e.branchClsname}) : [],
              indexArr3[0].length ? indexArr3[0][0].map(e => {return e.branchClsname}): []
            ]
          })
          console.log(1, indexArr.map(e => {return e.branchClsname}),)


        }
      },
      complete: ()=> {
        hideLoading()
        this.setData({ pageLoading: true})
      }
    })
  },
  submit () {
    const { bossName, branchName, selectedCity, shopAddrass, read, partnerCode,licencePic,doorPic, formatted_addresses} = this.data
    console.log(read)
    if (!read) return
    if (this.authorization === 'fail') {
      this.openLocation()
      return
    }
    let areaListBefore = this.data.areaListBefore
    let multiArray = this.data.multiArray
    let multiIndex = this.data.multiIndex
    let areaId
    if (multiArray[2].length) {
      areaListBefore.forEach(item => {
        if (item.branchClsname == multiArray[2][multiIndex[2]]) areaId = item.branchClsno
      })
    } else if (multiArray[1].length) {
      areaListBefore.forEach(item => {
        if (item.branchClsname == multiArray[1][multiIndex[1]]) areaId = item.branchClsno
      })
    } else {
      areaListBefore.forEach(item => {
        if (item.branchClsname == multiArray[0][multiIndex[0]]) areaId = item.branchClsno
      })
    }
    let data ={
      phone: this.phone||'',
      busiStartTime: this.data.businessTime.openTime, // 营业时间
      busiEndTime: this.data.businessTime.closeTime,  
      deliveryStartTime: this.data.deliveryTime.openTime, // 送货时间
      deliveryEndTime: this.data.deliveryTime.closeTime,
      bossName,
      branchClsno: areaId || ' ',
      branchName,
      address: selectedCity.join(''),
      x: String(this.point[1]),
      y: String(this.point[0]),
      property:'9',
      location: formatted_addresses || shopAddrass,
      platform:'2'
    }
    console.log(data)

    if(licencePic && licencePic.length >0)data.licencePic = licencePic;
    if(doorPic && doorPic.length >0)data.doorPic = doorPic;
    console.log(1000, data)
    for (let i in data) {
      if (!data[i] && (partnerCode != '1035' || i != 'branchClsno')) {
        toast('信息填写不完整')
        return
      }
    }
    showLoading('提交中...')
    API.Login.supplyRegister({
      data: data,
      success: res => {
        console.log(res)
        alert(res.msg,{
          success: () => {
            if (res.code == 0) wx.navigateBack({data:1})
          }
        })
      },
      error: ()=> {
        alert('提交失败，请检查网络是否正常')
      },
      complete: () => {
        hideLoading()
      }
    })
  },
  isRead (e) {
    this.setData({ read: e.detail.value.length})
  },
  openLocation() {
    alert('请开启定位功能', {
      confirmColor: '#d40000',
      confirmText: '去设置',
      success: () => {
        wx.openSetting({
          success: (ret) => {
            if (ret.authSetting['scope.userLocation']) {
              showLoading()
              setTimeout(() => {
                this.getUserLoaction(true)
                this.authorization = null
              }, 1000)
            }
          }
        })
      }
    })
  },
  lookAgreement () {
    alert(this.agreement || '获取失败，请稍后再试!',{
      confirmText: '知道了',
      title:'用户协议'
    })
  },
  getAgreement () {
    API.Login.getUserAgreementInfo({
      data: { platform: '3' },
      success: res => {
        if (res.code == 0) {
          this.agreement=res.data.agreementValue
        }
      }
    })
  },
  getAddress(lng, lat) {
    // 百度地图 API，返回定位的位置信息
    this.qqmapsdk.reverseGeocoder({
      location: {
        longitude: lng,
        latitude: lat
      },
      success: (ret) => {
        console.log(ret)
        if (ret.status === 0) {
          const info = ret.result.address_component
          const selectedCity = [info.province, info.city, info.district]
          const formatted_addresses = ret.result.formatted_addresses.recommend
          this.setData({ 
            selectedCity, // 级联选择器 预选择 地址
            formatted_addresses, // 初始化并渲染 详细地址
            shopAddrass: formatted_addresses
          })
        } else {
          alert('GPS定位失败,请检查网络是否正常')
        }
      },
      fail: (e) => {
        console.log(e)
        alert('GPS定位失败,请检查网络是否正常!')
      }
    })
  },
  // 用户选择地址
  chooseLocaltion () {
    const _this = this
    wx.chooseLocation({
      success: function (res) {
        console.log(res)
        _this.setData({
          formatted_addresses: res.address
        })
      },
    })
  },
  // 获取用户坐标
  getUserLoaction(type) {
    // console.log(type)
    const partnerCode = this.data.partnerCode
    wx.getLocation({
      type: 'gcj02',
      success: (res) => {
        // console.log(res)
        this.point = gcj02tobd09(res.longitude, res.latitude)
        // console.log(this.point)
        // if (partnerCode == '1035') {
          this.getAddress(res.longitude, res.latitude)
        // }
      },
      fail: (e) => {
        if (e.errMsg.indexOf('auth') !== -1) {
          this.authorization = 'fail'
        }
      },
      complete: () => {
        type && hideLoading()
      }
    })
  },

  /*********** action 事件 **********/
  /** 选择营业执照*/
  onTakePhotoSaleImage(){
   
    const _that = this;
    wx.chooseImage({
      count:1,
      sizeType:['original'],
      sourceType:['album','camera'],
      success(res){
        if(res.tempFilePaths.length >0){
          const saleImageURL = res.tempFilePaths[0];
          _that.setData({saleImageURL});
          // 上传图片
          showLoading('正在上传...');
          API.upload.uploadImage({
            filePath:saleImageURL,
            type:8,
            success:(uploadRes)=>{
              hideLoading();
              _that.setData({licencePic:uploadRes.data});
            },
            fail:(err)=>{
              hideLoading();
              alert('图片上传失败!');
            }
          });

        }

      }
    });
  },
  /** 拍摄门头照*/
  onTakePhotoHeaderImage(){
    const _that = this;
    wx.chooseImage({
      count:1,
      sizeType:['original'],
      sourceType:['camera'],
      success(res){
        if(res.tempFilePaths.length >0){
          const headerImageURL = res.tempFilePaths[0];
          _that.setData({headerImageURL});
          // 上传图片
          showLoading('正在上传...');
          API.upload.uploadImage({
            filePath:headerImageURL,
            type:8,
            success:(uploadRes)=>{
              hideLoading();
              _that.setData({doorPic:uploadRes.data});
            },
            fail:(err)=>{
              hideLoading();
              alert('图片上传失败!');
            }
          });
          
        }

      }
    });
  },
  /** 获取是否开启拍摄门头照*/
  fetchTakePhotoOnOff(){
    API.Login.getSetting({
     data:{"settingKey":"supplySetting.isRegisterPhone"},
     success: (res)=>{
      if(res.code == 0){
        let onOffTakePhoto = (res.data == '1');
        this.setData({onOffTakePhoto});
      }
     }
    })
  },

  /** 生命周期*/
  onLoad (opt) {
    console.log(opt)
    this.phone = opt.phone
    this.getAgreement()
    console.log(1)
    this.getAreaList()
    console.log(1)
    this.fetchTakePhotoOnOff()
    console.log(1)
    const partnerCode = getApp().data.partnerCode
    this.setData({ partnerCode })
    // if (partnerCode == '1035') {
      this.qqmapsdk = new QQMapWX({ key: 
        'O5DBZ-ODGCJ-3ECFZ-FKMGH-HCLRJ-V5FIS'
        // partnerCode == '1035' ? 'O5DBZ-ODGCJ-3ECFZ-FKMGH-HCLRJ-V5FIS' : ''
      })
    // }
    console.log(2)
    wx.getSetting({
      success: (data) => {
        if (!data.authSetting['scope.userLocation']) {
          wx.authorize({
            scope: 'scope.userLocation',
            success: () => {
              this.getUserLoaction()
            },
            fail: (e) => {
              this.authorization = 'fail'
            }
          })
        } else {
          this.getUserLoaction()
        }
      }
    })
    console.log(3)
  },
  onReady () {
  },
  onShareAppMessage() {
    return {
      title: '用户注册',
      path: '/pages/verificationPhone/verificationPhone'
    }
  }
})