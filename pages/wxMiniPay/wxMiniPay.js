import { showLoading, hideLoading, getGoodsImgSize, deepCopy, getGoodsTag, toast, alert, getTime, goPage, getIP } from '../../tool/index.js'
import API from '../../api/index.js'
import dispatch from '../../store/actions.js'
import * as types from '../../store/types.js'
Page({
  data: {
    pageLoading: false,
    error:'',// ''=成功   1支付取消  2获取openId失败 3 微信支付配置问题
    orderNo:'',
    payMoney:'',
    paymentType: '',
    payType:'',
    userIp: ''  // 用户当前 IP 地址
  },
  launchAppError (e) {
    if (e.detail.errMsg =='invalid scene') {
      alert('无法跳转到APP，请手动切换到APP')
    }
  },
  wxPay(openId, { platform, username, orderNo, payType, dc_branch_no, branch_no, payAmt, recharge_id}) {
    const { userIp } = this.data
    console.log(21, userIp)
    wx.login({
      success: (codeData) => {
        console.log('获取code', codeData)
        let request = {
          code: codeData.code,
          out_trade_no: orderNo,
          body: '具体信息请查看小程序订单中心',
          userIp,
          openId,
          platform,
          merchantTerminalId: wx.getSystemInfoSync().system, // 用户当前设备号
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
            console.log(40,res)
            if (res.code == 0 && res.data) {
              wx.requestPayment({
                'timeStamp': res.data.timeStamp || JSON.parse(res.data).timeStamp,
                'nonceStr': res.data.nonceStr || JSON.parse(res.data).nonceStr,
                'package': res.data.package || JSON.parse(res.data).package,
                'signType': res.data.signType || JSON.parse(res.data).signType,
                'paySign': res.data.sign || res.data.paySign || JSON.parse(res.data).paySign,
                success: ret => {
                  console.log(49, ret)
                  this.result('支付成功','')
                },
                fail: (err) => {
                  console.log(53, err)
                  this.result('支付失败',1)
                }
              })
            } else {
              console.log(43, res)
              this.result(res.msg,3)
            }
          },
          error: (err) => {
            console.log(67, err)
            this.result('获取支付配置失败,请检查网络是否正常。',3)
          }
        })
      },
      fail: (err) => {
        console.log(73, err)
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
  // 有时候会请求不到 ip 地址，请求不到时重复请求
  repeatGetIp(openId, opt) {
    const _this = this
    getIP({
      complete(ip) {
        console.log(89, ip)
        if (!ip) return _this.repeatGetIp(openId)
        _this.data.userIp = ip
        _this.wxPay(openId, opt)
      }
    })
  },
  onLoad (opt) {
    const _this = this
    console.log(80, opt)
    if (opt.paymentType === 1) this.setData({ paymentType: 1 }) // 1: 由小程序我的界面扫码进入
    if (!opt.payType&&!opt.orderNo) {
      this.result('获取订单失败', 3)
      return
    }
    showLoading('微信支付')
    this.setData({ orderNo: opt.orderNo || '', payMoney: opt.payAmt, payType: opt.payType})
    dispatch[types.GET_OPEN_ID]((openId)=>{
      if (openId) {
        _this.repeatGetIp(openId, opt)
      }else {
        console.log('获取微信支付配置失败 openid', openId)
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