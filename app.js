import { getIp } from './tool/index.js'
App({
  data: { 
    // partnerCode: '1027',
    // baseImgUrl:'http://39.98.78.85:8080/',
    // partnerCode: '1029',
    // baseImgUrl:'http://39.98.164.194:8081/',
    // partnerCode: '1013',
    // baseImgUrl:'http://erp.365wdyp.com/',
    // partnerCode: '1012',
    // baseImgUrl:'http://erp.hnhlgyl.net/',
    // partnerCode: '00',
    // partnerCode: '05', 
    // partnerCode: '1000', 
    // baseImgUrl: 'http://mmj.zksr.cn:8888/',
    // 15576615400 
    // partnerCode: '1005',
    // baseImgUrl: 'http://erp.djlscs.cn/',
    // partnerCode: '1047',
    // baseImgUrl: 'http://106.124.142.203:8081/',
    // lttest001
    // partnerCode: '1034',
    // baseImgUrl:'https://39.100.103.135:8080/',
    // partnerCode: '10522',
    // partnerCode: '1011',
    // partnerCode: '1034',
    // baseImgUrl:'https://39.100.103.135:8080/',
    // partnerCode: '1026',
    
    // partnerCode: '1051',
    // partnerCode: '10510',
    // baseImgUrl:'http://app.tmzyz.com/',
    partnerCode: '1059',
    // partnerCode: '1054',
    // partnerCode: '1055',
    // partnerCode: '2222',

    // partnerCode: '1039',
    // partnerCode: '1058',
    
    
    //  partnerCode: '1056', 
    //  partnerCode: '1057',

    // partnerCode: '1050',
    // baseImgUrl:'http://erp.wgjnh.com',
    // 18569429872
    supplierNo: '', // 首页跳转入驻商类别
    ww:'', // 屏幕宽度
    hh:'', // 屏幕高
    imgUrl: '', // erp图片域名
    goodsUrl: '', // 普通商品图片
    tgGoodsUrl: '', // 团购商品图片
    zcGoodsUrl: '', // 直配商品图片
    zhGoodsUrl: '', // 组合商品图片 
    indexImgUrl: '', // 首页活动图
    userObj: '',
    bounding: {}, // 右上角胶囊信息
    phoneType:'',// 手机系统
    userIp: '' // 用户的ip地址
  },
  editData (key ,val) {
    this.setData({
      [key]: val
    })
  },
  backLogin() {
    wx.removeStorage({ key: 'userObj' })
    wx.removeStorage({ key: 'allPromotion' })
    wx.removeStorage({ key: 'configObj' })
    wx.removeStorage({ key: 'cartsObj' })
    wx.removeStorage({ key: 'updateCartsTime' })    
    wx.reLaunch({ url: '/pages/login/login' })
  },
  onLaunch () {
    // 绵阳鸭子tabbar 
    console.log(wx)
    if (wx.getSystemInfo) {
      wx.getSystemInfo({
        success: (res) => {
          this.data.ww = res.windowWidth
          this.data.hh = res.windowHeight
          this.data.phoneType = res.system.indexOf('IOS') != -1 ? 'IOS' :'Android'
        }
      })
    }
  },
  // 获取用户ip地址
  getIp() {
    const _this = this
    wx.request({
      url: 'https://open.onebox.so.com/dataApi?type=ip&src=onebox&tpl=0&num=1&query=ip&url=ip',
      data: {
      },
      method: 'POST',
      header: {
        'content-type': 'application/x-www-form-urlencoded'
      },
      success: function (res) {
        console.log(92,res)
        if(!res.data) _this.getIp() // 没有ip则再次请求
       _this.data.userIp = res.data.ip
      }
    })
  },
  onShow(opt) {
    this.getIp()
    setTimeout(()=>console.log(this.data.userIp), 10000)
    
    let bounding = wx.getMenuButtonBoundingClientRect()
    this.data.bounding = bounding
    if (wx.getUpdateManager) {
      const updateManager = wx.getUpdateManager()
      updateManager.onUpdateReady( () =>{
        wx.showModal({
          title: '更新提示',
          content: '新版本已经准备好，是否重启应用？',
          showCancel: false,
          success: res => {
            if (res.confirm) {
              updateManager.applyUpdate()
            }
          }
        })
      })
    }
  }
  
})