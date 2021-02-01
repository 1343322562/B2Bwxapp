import * as types from '../../store/types.js'
import API from '../../api/index.js'
import dispatch from '../../store/actions.js'
import { goPage,toast,alert, setUrlObj } from '../../tool/index.js'
import { tim, timCurrentDay } from '../../tool/date-format.js'
const app = getApp()
Page({
  data: {
    partnerCode: getApp().data.partnerCode,
    userObj: {},
    salesmanObj:null,
    orderNum: {},
    isInvoice:'',
    couponsNum: 0,
    isShowPicker: false,
    startDate: timCurrentDay(0).slice(0, 8) + '01',   // picker 选择时间
    endDate: timCurrentDay(0),      // picker 选择时间
    currentMonthData: { diAmt: 0.0, doAmt: 0.0, drAmt: 0.0 } // 当月订单数据
  },
  scanCodePayClick() {
    wx.scanCode({
      success: res => {
        const data = res.result
        console.log(data)
        if (!data.includes('payWay') || !data.includes('type') || !data.includes('payAmt') || !data.includes('sheetNo')) return alert('二维码有误, 二维码信息如下' + data)
        if (data.includes('code')) {
          const codeObj = setUrlObj(data.slice(data.indexOf('?')+1))
          let { payWay, type, payAmt, sheetNo: orderNo } = codeObj
          goPage('wxMiniPay', { payWay, type, payAmt, orderNo, paymentType: '1' })
          return 
        }
        const { branchNo, token, username, platform, dbBranchNo } = wx.getStorageSync('userObj')
        let { payWay, type, payAmt, sheetNo: orderNo } = JSON.parse(data)
        goPage('wxMiniPay', { payWay, type, payAmt, orderNo, paymentType: '1' })
      }
    })
  },
  // picker 组件传值
  orderTimeValue(e) {
    console.log(e)
    let { startDate, endDate } = e.detail
    this.setData({ startDate, endDate, isShowPicker: false })
    this.getOrderData(startDate, endDate)
  },
  // 跳转当月订单页
  toDetailOrderClick(e) {
    // 1：在途订单  2：到货订单 3：退货订单
    console.log(e)
    const { type } = e.currentTarget.dataset
    const name = type == 1 ? '在途订单' : (type == 2 ? '到货订单' : '退货订单')
    const { startDate, endDate } = this.data
    goPage('currentMonthOrder', { startDate, endDate, type , name })
  },
  goLogin () {
    goPage('login',{
      isLogin: true
    })
  },
  showSelectTime() {
    this.setData({ isShowPicker: true })
  },
  goPage (e) {
    console.log(e)
    if (this.data.userObj.isLogin) {
      this.goLogin()
      return
    }
    const {page,type} = e.currentTarget.dataset
    if (page =='null') {
      toast('功能暂未开放')
      return
    }
    console.log(page)
    goPage(page, { openType: type||''})
  },
  goCollectList  () {
    const type = '101'
    const collectObj = wx.getStorageSync('collectObj')
    const value = Object.keys(collectObj).join(',')
    goPage('activity', { type, value })
  },
  // 退出登录时,保存购物车
  saveCarts() {
    return new Promise(resolve => {
      dispatch[types.GET_CHANGE_CARTS]({
        success: (ret) => {
          console.log(ret)
          resolve(ret)
        }
      })
    })
  },
  quit () {
    alert('确定是否退出?',{
      showCancel: true,
      title:'温馨提示',
      success: async ret => {
        if (ret.confirm) {
          // 保存购物车 并退出
          await this.saveCarts().then(res => res)
          getApp().backLogin()
        }
      }
    })
  },
  callPhone (e) {
    // const partnerCode = getApp().data.partnerCode
    // if (partnerCode == '1027') {
    // var current = 'http://erp.yizhangou.vip/1.gif'
    //   wx.previewImage({
    //     current: current,
    //     urls: [current]
    //   })
    // } else {
      const phone = e.currentTarget.dataset.phone
      if (!phone) return
      wx.makePhoneCall({phoneNumber: phone})
    // }
  },
  // 获取当月订单数据
  getOrderData(startDate = timCurrentDay(0).slice(0, 8) + '01', endDate = timCurrentDay(0)) {
    const { branchNo, token, username, platform, dbBranchNo } = wx.getStorageSync('userObj')
    const _this = this
    API.Orders.sheetAmtSearch({
      data: { branchNo, token, username, platform, dbBranchNo, startDate, endDate },
      success(res) {
        console.log(res)
        _this.setData({ currentMonthData: res.data})
      }
    })
  },
  onLoad (opt) {
    const partnerCode = getApp().data.partnerCode
    if (partnerCode == 1060 || partnerCode == 1063) wx.setNavigationBarColor({ backgroundColor: '#ff9c01', frontColor: '#ffffff' })
    const baseImgUrl = app.data.baseImgUrl
    if (partnerCode == 1052) {wx.setNavigationBarColor({ backgroundColor: '#e6c210', frontColor: '#ffffff' })}
    
    const userObj = wx.getStorageSync('userObj')
    if (userObj.picHeader) userObj['picHeader'] = baseImgUrl + 'upload/images/icon/' + userObj.picHeader
    this.setData({ userObj, isInvoice: wx.getStorageSync('configObj').isInvoice })
    this.requestObj = {
      branchNo: userObj.branchNo,
      token: userObj.token,
      username: userObj.username,
      platform: userObj.platform,
      dbranchNo: userObj.dbBranchNo
    }
    this.getOrderNum()
    this.getSalesman()
    if (partnerCode == '1029') this.getOrderData()
    this.setData({ partnerCode })
  },
  // 跳转批次查询
  goPCPage() {
    goPage('pcSearch')
  },
  getOrderNum () {
    
    API.My.searchOrderCount({ // 获取订单数量
      data: this.requestObj,
      success: res => {
        if (res.code == 0 && res.data) {
          this.setData({
            orderNum: res.data
          })
        }
      }
    })
    API.My.getUnusedCouponsSum({ // 获取优惠券数量
      data: this.requestObj,
      success: res => {
        if (res.code == 0 && res.data) {
          this.setData({
            couponsNum: res.data.couponsCount||0
          })
        }
      }
    })
  },
  getSalesman () {
    API.My.findSalesManInfo({
      data: this.requestObj,
      success: res => {
        if (res.code == 0) {
          const salesmanObj = {
            phone: res.data.phone,
            name: res.data.name
          }
          this.setData({ salesmanObj})
        }
      }
    })
  },
  // 跳转箱货查询页
  toSeach () {
    wx.navigateTo({
      url: '../boxGoodSeach/boxGoodSeach',
    })
  },
  onReady () {
  },
  onShow () {
    if (getApp().data.partnerCode == 1060) wx.setNavigationBarColor({ backgroundColor: '#ff9c01', frontColor: '#ffffff' })
    const userObj = wx.getStorageSync('userObj')
    const baseImgUrl = app.data.baseImgUrl
    if (userObj) {
      if (userObj.picHeader) userObj['picHeader'] = baseImgUrl + 'upload/images/icon/' + userObj.picHeader
      this.setData({ userObj })
      this.requestObj.token = userObj.token
    } 
    const pageLoadingTime = this.pageLoadingTime
    if (pageLoadingTime) {
      const now = +new Date()
      const time = now - pageLoadingTime
      if (time > (1000 * 15)) {
        this.pageLoadingTime = now
        this.getOrderNum()
      }
    } else {
      this.pageLoadingTime = +new Date()
    }
  },
  onHide () {
  }
})