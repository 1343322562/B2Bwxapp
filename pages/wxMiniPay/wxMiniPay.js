import { showLoading, hideLoading, getGoodsImgSize, deepCopy, getGoodsTag, toast, alert, getTime, goPage } from '../../tool/index.js'
import API from '../../api/index.js'
import dispatch from '../../store/actions.js'
import * as types from '../../store/types.js'
Page({
  data: {
    pageLoading: false,
    error:'',// ''=成功   1支付取消  2获取openId失败 3 微信支付配置问题
    orderNo:'',
    payMoney:'',
    payType:'',
  },
  launchAppError (e) {
    if (e.detail.errMsg =='invalid scene') {
      alert('无法跳转到APP，请手动切换到APP')
    }
  },
  wxPay(openId, { platform, username, orderNo, payType, dc_branch_no, branch_no, payAmt, recharge_id}) {
    wx.login({
      success: (codeData) => {
        let request = {
          code: codeData.code,
          out_trade_no: orderNo,
          body: '具体信息请查看小程序订单中心',
          openId,
          platform,
          username
        }
        if (payType == 'CZ') {
          request.out_trade_no = payType
          request.dc_branch_no = dc_branch_no
          request.branch_no = branch_no
          request.pay_amt = payAmt
          request.recharge_id = recharge_id
        }
        console.log(request)
        API.Liquidation.getMiniPayParameters({
          data: request ,
          success: res => {
            console.log(res)
            if (res.code == 0 && res.data) {
              wx.requestPayment({
                'timeStamp': res.data.timeStamp,
                'nonceStr': res.data.nonceStr,
                'package': res.data.package,
                'signType': res.data.signType,
                'paySign': res.data.sign,
                success: ret => {
                  this.result('支付成功','')
                },
                fail: () => {
                  this.result('支付失败',1)
                }
              })
            } else {
              this.result(res.msg,3)
            }
          },
          error: () => {
            this.result('获取支付配置失败,请检查网络是否正常。',3)
          }
        })
      },
      fail: () => {
        this.result('获取code失败',3)
      }
    })
  },
  result (msg,types) {
    hideLoading()
    alert(msg,{
      success: ()=> {
        this.setData({ pageLoading: true, error:types})
      }
    })
  },
  onLoad (opt) {
    if (!opt.payType&&!opt.orderNo) {
      this.result('获取订单失败', 3)
      return
    }
    showLoading('微信支付')
    this.setData({ orderNo: opt.orderNo || '', payMoney: opt.payAmt, payType: opt.payType})
    dispatch[types.GET_OPEN_ID]((openId)=>{
      if (openId) {
        this.wxPay(openId, opt)
      }else {
        this.result('获取微信支付配置失败:openId',2)
      }
    })
  },
  onShow () {
    if (this.data.pageLoading) {
      setTimeout(() => {
        wx.redirectTo({
          url: '/pages/login/login'
        })
      }, 200)
    }
  },
})