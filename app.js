App({
  data: { 
    // partnerCode: '1013',
    // baseImgUrl:'http://erp.365wdyp.com',
    // partnerCode: '1043',
    //    baseImgUrl:'http://erp.jhdd.cn/',
    //  partnerCode: '1029',
    //  baseImgUrl:'http://39.98.164.194:8081/',
     partnerCode: '1000', 
     baseImgUrl: 'http://mmj.zksr.cn:8888/',
    // 15576615400 
    // partnerCode: '1036',
    // baseImgUrl: 'http://erp.yhfws.cn/',
    // partnerCode: '1007',
    // baseImgUrl: 'http://erp.zfyxok.com/',
    // lttest001
    // partnerCode: '1034',
    // baseImgUrl:'https://39.100.103.135:8080/',
    // partnerCode: '10522',
    // partnerCode: '10511',
    // partnerCode: '1034',
    // baseImgUrl:'https://39.100.103.135:8080/',

    // partnerCode: '1053',

    // partnerCode: '1039',
    

    // partnerCode: '1050',
    // baseImgUrl:'http://erp.wgjnh.com',
    // 18569429872
    ww:'', // 屏幕宽度
    hh:'', // 屏幕高
    imgUrl: '', // erp图片域名
    goodsUrl: '', // 普通商品图片
    tgGoodsUrl: '', // 团购商品图片
    zcGoodsUrl: '', // 直配商品图片
    zhGoodsUrl: '', // 组合商品图片 
    indexImgUrl: '', // 首页活动图
    userObj: '',
    phoneType:'',// 手机系统
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
  onShow(opt) { 
    
    

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