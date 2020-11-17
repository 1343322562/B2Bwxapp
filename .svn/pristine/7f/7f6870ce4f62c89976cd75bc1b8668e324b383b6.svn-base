import API from '../../../api/index.js'
import { showLoading, hideLoading, goPage, alert } from '../../../tool/index.js'
Page({
  data: {
    tgGoodsUrl:'',
    pageObj: {},
    mzSelect: null,
    timeObj: {},
    payMoney: 0,
    cartsObj: {}
  },
  getPageData () {
    showLoading('请稍后...')
    const id = this.id
    const { token, platform, username} = this.userObj
    API.Group.searchSupplyTeamDetail({
      data: { id, token, platform, username},
      success: res => {
        if (res.code == 0) {
          let pageObj = res.data;
          if (pageObj.teamType == '1') {
            pageObj.relationOutVos.forEach(goods => {
              goods.totalMoney = Number((goods.buyQty * pageObj.price).toFixed(2));
              goods.cpTotalMoney = Number((goods.sendQty * pageObj.price).toFixed(2));
            })
          }
          pageObj.detailUrl = pageObj.detailUrl ? pageObj.detailUrl.substr(0, pageObj.detailUrl.length - 1).split(',') : [];
          wx.setNavigationBarTitle({ title: pageObj.itemName})
          this.setData({ pageObj });
        } else {
          alert(res.msg,{
            success: ()=> {
              wx.navigateBack({data:1})
            }
          })
        }
      },
      complete: () => {
        hideLoading()
      }
    })
  },
  selectMz (e) {
    let i = e.currentTarget.dataset.index, obj = this.data.pageObj, item = obj.relationOutVos[i], payMoney = item.totalMoney, cartsObj;
    cartsObj = { qty: item.buyQty, sentQty: item.sendQty };
    this.setData({ mzSelect: i, payMoney: payMoney, cartsObj: cartsObj });
  },
  changeNum (e) {
    let t = this, type = e.target.dataset.type,
      n = t.data.cartsObj.qty || 0,
      obj = t.data.pageObj, cartsObj, payMoney,
      step = obj.itemQty || 1,
      min = obj.minQty || 1;
    if (!n && type == '0') return;
    if (type == '0') {
      n -= (n - step >= min ? step : min);
    } else if (type == '1') {
      n += (n ? step : min);
      if (obj.maxQty && obj.maxQty < n) { alert('已达到单人购买最大数量!'); return; }
    }
    cartsObj = { qty: n, amt: Number((n * obj.price).toFixed(2)) }
    payMoney = cartsObj.amt;
    t.setData({ payMoney: payMoney, cartsObj: cartsObj })
  },
  goPay () {
    const { payMoney, cartsObj, pageObj} =  this.data
    const { username, branchNo, platform, token, dbBranchNo: dcBranchNo} = this.userObj
    const _this = this
    if (!payMoney) return
    showLoading('下单中...')
    let data = {
      branchNo,
      dcBranchNo,
      payWay: 'wx',
      payAmt: String(payMoney),
      buyQty: String(cartsObj.qty),
      detailId: pageObj.id,
      teamSheetNo: pageObj.sheetNo,
      itemNo: pageObj.itemNo,
      price: String(pageObj.price),
      batchNo: pageObj.batchNo,
      teamType: pageObj.teamType,
      username,
      sendQty: String(cartsObj.sentQty || 0),
      token,
      platform,
      username,
      mobilePlatform: 'mini'
    }
    API.Group.saveTeamOrder({
      data: data,
      success: res => {
        if (res.code == 0 && res.data) {
          const sheetNo = res.data
          this.sheetNo = sheetNo
          const openId = wx.getStorageSync('openId')
          wx.login({
            success(codeData) {
              const code = codeData.code
              API.Group.getMiniTeamPayParameters({
                data: { code , sheetNo, body: '具体信息请查看团购订单', openId, platform, username, token},
                success: ret => {
                  console.log(10, ret)
                  const config = ret.data
                  if (ret.code == 0 && config) {
                    wx.requestPayment({
                      'timeStamp': config.timeStamp,
                      'nonceStr': config.nonceStr,
                      'package': config.package,
                      'signType': config.signType,
                      'paySign': config.sign,
                      'success':  (res)=> {
                        console.log(1000, res)
                        _this.goSuccessPage(true)
                      },
                      'fail': (err)=> {
                        console.log(100,err)
                        _this.errorMsg('支付已取消')
                      }
                    })
                  } else  {
                    _this.errorMsg(ret.msg)
                  }
                },
                error: ()=> {
                  _this.errorMsg('获取支付配置失败,请检查网络是否正常。')
                }
              })
            }
          })
        } else {
          hideLoading()
          alert(res.msg)
        }
      },
      error: ()=> {
        hideLoading()
        alert('下单失败，请检查网络是否正常')
      }
    })
    console.log(data)
  },
  goSuccessPage(type) {
    setTimeout(() => {
      wx.redirectTo({
        url: '/pages/groupBuying/GB_payOk/GB_payOk?pageType=' + (type ? 1 : 2) + '&sheetNo=' + this.sheetNo,
      })
    }, 200)
  },
  onShareAppMessage() {
    console.log('share')
    const { branchName, dbBranchName } = wx.getStorageSync('userObj')
    return {
      title: branchName || dbBranchName,
      path: '/pages/groupBuying/GB_index/GB_index'
    }
  },
  errorMsg(msg) {
    hideLoading()
    alert(msg || '系统异常，请稍后再试', {
      success: () => {
        this.goSuccessPage(false)
      }
    })
  },
  onLoad (opt) {
    this.id = opt.id
    this.userObj = wx.getStorageSync('userObj')
    const tgGoodsUrl = getApp().data.tgGoodsUrl
    this.getPageData()
    this.setData({ tgGoodsUrl})
  },
  onShow () {
  },
  onHide () {
  }
})