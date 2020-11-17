import API from '../../api/index.js'
import { toast, alert, showLoading, hideLoading } from '../../tool/index.js'
let app = getApp()
Component({
  properties: {
    show: Boolean,
    order: {
      type: Object,
      observer(newVal, oldVal) {
        console.log('newVal', newVal)
        // if (typeof newVal == 'number') return
        newVal.czPayAmt = Number(String(newVal.czPayAmt) || newVal)
        newVal.sheetAmt = Number((newVal.sheetAmt - newVal.czPayAmt).toFixed(2))
        this.setData({ order: newVal})
        this.init(newVal.payWay=='4')
        this.baseOrderObj = newVal
        this.setOrderAction()
      }
    },
    storedValue: Number
  },
  data: {
    payWayList: [
      { name: '储值支付', type: '2', icon: 'yue', show: true },
      { name: '微信支付', type: '1', icon: 'wx', show: true },
      { name: '货到付款', type: '0', icon: 'hdfk', show: true }
    ],
    payWay: '', // 支付方式 0货到付款 1在线支付 2储值支付 4混合支付
    totalMoney: 0, // 商品总金额
    discountsMoney: 0,// 优惠总金额
    realPayAmt: 0, // 实付金额
    isUseBlendWay: false, // 混合支付
    wxPayRate: '', //微信手续费率
    wxPayRateOpen: 0 ,  //微信手续费开关 0:关
  },
  attached () {
    console.log(this)
    console.log(this.data)
    console.log(this.data.order)
    //this.init()
  },
  methods: {
    // 混合支付选事件
    checkboxChange (e) {
      let isUseBlendWay = e.detail.value[0] ? true : false
      const payWayList = this.data.payWayList
      const newPayWay = payWayList[1].show ? '1' : (payWayList[2].show ? '0' : '')
      let storedValue = this.data.storedValue
      let czPayAmt
      console.log('选择混合支付' ,e, newPayWay)
      czPayAmt = Number(isUseBlendWay ? storedValue : 0)
      console.log(storedValue)
      if (isUseBlendWay && newPayWay) {
        this.changePayWay(newPayWay)
      } else if (isUseBlendWay&&!newPayWay) {
        toast('没有其他的支付方式了')
        isUseBlendWay= false
      } else {
        this.changePayWay('2','auto')
      }
      console.log('isUseBlendWay', isUseBlendWay)
      this.setData({ isUseBlendWay,  ['order.czPayAmt']: czPayAmt })
      this.setOrderAction(newPayWay, isUseBlendWay)
    },
    
    init (type) {
      console.log('init', this.data.order)
      this.userObj = wx.getStorageSync('userObj')
      const {
        defaultPayWay, // 默认为空   0货到付款   1储值支付    2微信支付  3支付宝支付  4易宝支付
        codPay, // 货到付款
        czPay, // 储值支付
        wxPay, // 微信支付
        codPayMjFlag, // 货到付款是否支持满减 1:支持
        autoCoupons, // 货到付款是否支持优惠券 1:支持
        codPayMzFlag, // 货到付款是否支持满赠 1:支持
        wxPayRate,
        wxPayRateOpen
      } = wx.getStorageSync('configObj')
      this.data.wxPayRate = wxPayRate
      this.data.wxPayRateOpen = wxPayRateOpen
      this.codPayMjFlag = codPayMjFlag
      this.autoCoupons = autoCoupons
      this.codPayMzFlag = codPayMzFlag
      let payWayList = this.data.payWayList
      payWayList[0].show = type ? false : czPay == '1'
      payWayList[1].show = wxPay == '1'
      payWayList[2].show = codPay == '1'
      this.setData({
        wxPayRate,
        wxPayRateOpen,
        payWayList: payWayList,
        payWay: (defaultPayWay ? (
          (defaultPayWay == '1' && payWayList[0].show) ? '2' :
            ((defaultPayWay == '2' && payWayList[1].show) ? '1' :
              ((defaultPayWay == '0' && payWayList[2].show) ? defaultPayWay : ''))) : ''
        )
      })
    },
    // order.discountsTotalAmt + order.vouchersAmt
    setOrderAction(payWay, isUseBlendWay) { // discountAmt 满减  couponsAmt 优惠券
      if(payWay == this.data.payWay) return
      const { sheetAmt, couponsAmt, discountAmt, realSheetAmt } = this.baseOrderObj
      const order = this.data.order
      const storedValue = this.data.storedValue
      // const isUseBlendWay = this.data.isUseBlendWay
      const nowPayWay = payWay ? payWay : this.data.payWay
      const nowIsUseBlendWay = isUseBlendWay ? isUseBlendWay : this.data.isUseBlendWay
      
      let totalMoney = Number(realSheetAmt)||sheetAmt
      let realPayAmt = totalMoney
      let discountsMoney = 0
      if ((payWay != '0' || this.autoCoupons == '1') && order.vouchersAmt) {
        // discountsMoney += couponsAmt
        discountsMoney += order.vouchersAmt
      }
      if ((payWay != '0' || this.codPayMjFlag == '1') && order.discountsTotalAmt) {
        // discountsMoney += discountAmt
        discountsMoney += order.discountsTotalAmt
      }
      console.log(nowPayWay, nowIsUseBlendWay, discountsMoney)
      
      
      // realPayAmt = Number((realPayAmt - discountsMoney).toFixed(2))
      realPayAmt = order.onlinePayway == 'WX' ? Number(Number(order.onlinePayAmt).toFixed(2)) : Number(order.realPayAmt || 0)
      if (payWay == '0' && this.data.discountsMoney && discountsMoney == 0) { // 货到付款，不支持优惠时，要加上优惠的金额
        realPayAmt = realPayAmt + this.data.discountsMoney
        console.log(100, realPayAmt)
      }
      if (nowIsUseBlendWay) {
        realPayAmt = Number((realPayAmt - discountsMoney - storedValue).toFixed(2))
      }
      console.log(payWay, discountsMoney, this.data.discountsMoney)
      console.log(nowPayWay,this.data.payWay, nowIsUseBlendWay, realPayAmt)
      this.setData({ totalMoney, realPayAmt, discountsMoney})
    },
    quit () {
      this.triggerEvent('hidePay')
    },
    changePayWay(e, auto) {
      console.log(e)
      let payWay = typeof e =='object' ? e.currentTarget.dataset.type : e
      let { isUseBlendWay } = this.data
      console.log(payWay)
      if (isUseBlendWay && payWay == '2' && auto!='auto') return   // 混合支付
      this.setOrderAction(payWay)
      this.setData({ payWay })
    },
    payError (msg) {
      hideLoading()
      alert(msg)
    },
    paySuccess () {
      wx.removeStorage({ key: 'promotionTime' })
      setTimeout(() => {
        wx.reLaunch({
          url: '/pages/paySuccess/paySuccess?payType=ok&orderNo=' + this.baseOrderObj.sheetNo,
        })
      }, 200)
    },
    confirmPay (ignore) {
      let { payWay, realPayAmt, storedValue, isUseBlendWay, order, wxPayRateOpen, wxPayRate} = this.data
      if (!payWay) { toast('请选择支付方式'); return }
      if (payWay == '2' && storedValue < realPayAmt) { toast('余额不足'); return }
      if (wxPayRateOpen == '1' && payWay == '1' && ignore !='ignore') { 
        alert('使用微信支付将额外收取您' + wxPayRate + '%的手续费-(手续费:' + Number((((realPayAmt + (order.transportFeeAmt || 0) - (isUseBlendWay ? Number(storedValue):0)) * wxPayRate) / 100).toFixed(2))+')',{
          showCancel: true,
          success: ret => {
            if (ret.confirm) {
              this.confirmPay('ignore')
            }
          }
        })
        return
      }
      showLoading('支付中...')
      const { memo, itemNos, sheetNo, transNo, ticketType, couponsAmt, payWay: orderPayWay, czPayAmt} = this.baseOrderObj
      console.log(czPayAmt)
      const { username, platform, token, branchNo, dbBranchNo } = this.userObj
      let request = {
        token,
        platform,
        username,
        itemNos,
        sheetNo,
        transNo,
        payWay: orderPayWay == '4' ? '4' : payWay,
        branchNo,
        ticketType,
        couponsAmt: ((payWay != '0' || this.autoCoupons == '1') && couponsAmt)?String(couponsAmt):'0',
        memo: memo,
        poundage:'0',
        inBranchNo: branchNo,
        outBranchNo: dbBranchNo,
        transportFee: order.transportFeeAmt || 0,
        onlinePayway: payWay == '1' ? 'WX' : '',/* 在线支付方式  WX微信支付ZFB支付宝YEE易宝支付TL通联支付UN银联支付 */
        onlinePayAmtString: String(payWay == '1' ? realPayAmt : 0),/*线上支付金额*/
        czPayAmtString: String(payWay == '2' ? realPayAmt : 0), // 储值支付金额
        codPayAmtString: String(payWay == '0' ? realPayAmt : 0), // 货到付款
      }

      console.log('realPayAmt', realPayAmt)
      if (orderPayWay == '4') {
        request.czPayAmtString = String(czPayAmt)
        // request.czPayAmtString = String(storedValue)
        request[payWay == '0' ? 'codPayAmtString' : 'onlinePayAmtString'] = String(realPayAmt)
        // request[payWay == '0' ? 'codPayAmtString' : 'onlinePayAmtString'] = (realPayAmt - storedValue).toFixed(2)
        // console.log('realPayAmt',realPayAmt )
        // console.log('czPayAmt', czPayAmt )
        // console.log('realPayAmt - storedValue', realPayAmt - storedValue , storedValue)
        // console.log("request['onlinePayAmtString']", request['onlinePayAmtString']) // 线上支付金额
        // console.log("request['czPayAmtString']", request['czPayAmtString'])         // 储值金额
        // console.log("request['codPayAmtString']", request['codPayAmtString']) 
      }
      if (isUseBlendWay) {
        request['payWay'] = '4'
        request.czPayAmtString = String(storedValue)
        if (payWay == 0) {
          request['codPayAmtString'] = (realPayAmt - storedValue).toFixed(2)
        } else if (payWay == 1) {
          request['onlinePayAmtString'] = (realPayAmt - storedValue).toFixed(2)
          request['onlinePayway'] = 'WX'
        } else if (payWay == 2) {
          request['czPayAmtString'] = (realPayAmt - storedValue).toFixed(2)
        }
        // request[payWay == '0' ? 'codPayAmtString' : 'onlinePayAmtString'] = (realPayAmt - storedValue).toFixed(2)
        console.log("request['onlinePayAmtString']", request['onlinePayAmtString']) // 线上支付金额
        console.log("request['czPayAmtString']", request['czPayAmtString'])         // 储值金额
        console.log("request['payWay']",  request['payWay'])
        console.log("request['onlinePayway']",  request['onlinePayway'])
      } else {
        if (payWay == 0) {
          request['codPayAmtString'] = realPayAmt.toFixed(2)
        } else if (payWay == 1) {
          request['onlinePayAmtString'] = realPayAmt.toFixed(2)
          request['onlinePayway'] = 'WX'
        } else if (payWay == 2) {
          request['czPayAmtString'] = realPayAmt.toFixed(2)
        }
        console.log(czPayAmt)
        // request.czPayAmtString = String(czPayAmt)
        // request[payWay == '0' ? 'codPayAmtString' : 'onlinePayAmtString'] = realPayAmt.toFixed(2)
        console.log('czPayAmtString', request.czPayAmtString)
        console.log('onlinePayAmtString', request.onlinePayAmtString)
      }
      console.log('支付参数', request)
      console.log(wx.getStorageSync('configObj'))
      const { codPay, czPay, wxPay } = wx.getStorageSync('configObj')
      // if (payWay == 0) {
      //   if (codPay != 1) return toast('货到付款暂未开启，请重新选择')
      // } else if (payWay == 1) {
      //   if (wxPay != 1) return toast('微信支付暂未开启，请重新选择')
      // } else if (payWay == 2) {
      //   if (czPay != 1) return toast('储值支付暂未开启，请重新选择')
      // }
      
      if (this.data.partnerCode == 1053 && payWay == 0) return toast('货到付款暂未开启，请重新选择')
      API.Orders.orderpay({
        data: request,
        success: res => {
          console.log(res, request)
          if (res.msg == '第一次使用混合支付第二次必须也为混合支付') return toast('请选择储蓄混合支付')
          if (res.code == 0) {
            if (payWay == '1') { // 微信支付
              this.wxPay()
            } else {
              this.paySuccess()
            }
          } else {
            this.payError(res.msg||'系统异常')
          }
        },
        error: () => {
          this.payError('支付失败，请检查网络是否正常.')
        }
      })
    },
    wxPay() {
      const openId = wx.getStorageSync('openId')
      const {  username, platform } = this.userObj
      const sheetNo = this.baseOrderObj.sheetNo
      wx.login({
        success: (codeData)=> {
          console.log({ code: codeData.code, out_trade_no: sheetNo, body: '具体信息请查看小程序订单中心', openId: openId, platform, username })
          API.Liquidation.getMiniPayParameters({
            data: { 
              code: codeData.code,
              out_trade_no: sheetNo,
              body: '具体信息请查看小程序订单中心',
              openId: openId, 
              platform, 
              username,
              userIp: app.data.userIp
            },
            success: res => {
              console.log('成功',res)
              if (res.code == 0 && res.data) {
                wx.requestPayment({
                  'timeStamp': res.data.timeStamp || JSON.parse(res.data).timeStamp, // 时间戳
                  'nonceStr': res.data.nonceStr || JSON.parse(res.data).nonceStr,
                  'package': res.data.package || JSON.parse(res.data).package,   // prepay_id 参数值
                  'signType': res.data.signType || JSON.parse(res.data).signType,
                  'paySign': res.data.sign || res.data.paySign || JSON.parse(res.data).paySign,
                  success: ret => {
                    this.paySuccess()
                  },
                  fail: (res) => {
                    console.log('失败',res)
                    this.payError('支付已取消')
                  }
                })
              } else {
                this.payError(res.msg)
              }
            },
            error: () => {
              this.payError('获取支付配置失败,请检查网络是否正常。')
            }
          })
        },
        fail: () => {
          this.payError('获取code失败')
        }
      })
      
    }
  }
})
