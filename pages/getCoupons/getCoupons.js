import API from '../../api/index.js'
import { showLoading, hideLoading, alert, toast, deepCopy } from '../../tool/index.js'
Page({
  data: {
    list: [],
    pageLoading: false,
    cupInfo: []
  },
  getPageData () {
    showLoading('请稍后...')
    API.GetCoupons.getCouponsBatchNo({
      data: this.reuqestData,
      success: res => {
        console.log(res)
        if (res.code == 0) {
          const list = res.data || []
          this.setData({ list })
        }
      },
      complete: ()=> {
        hideLoading()
        this.setData({ pageLoading: true})
      }
    })
  },
  getCouponsExplain () {
    // const { couponsUseRule } = wx.getStorageSync('configObj')
    // const cupInfo = couponsUseRule.split('<br/>')
    // this.setData({ cupInfo })
    API.GetCoupons.getCouponsExplain({
      data: this.reuqestData,
      success: res => {
        console.log(res)
        if (res.code == 0&& res.data) {
          const cupInfo = res.data.split('<br/>')
          this.setData({ cupInfo })
        }
      }
    })
  },
  getCoupons (e) {
    const index = e.currentTarget.dataset.index
    const list = this.data.list
    const _this = this
    if (list[index].isGet || list[index].couldReceive == '1') return
    showLoading('领取中...')
    let data = deepCopy(this.reuqestData)
    data.giveOutBatch = list[index].giveOutBatch
    data.giveOutNo = data.branchNo
    API.GetCoupons.getCouponsByBatchNo({
      data: data,
      success: res => {
        console.log(res)
        alert(res.msg)
        _this.getPageData()
        if (res.code!=0) {
          list[index].isGet = true
          this.setData({ list })
        }
      },
      error: () => {
        alert('领取失败，请检查网络是否正常')
      },
      complete: ()=> {
        hideLoading()
      }
    })
  },
  onLoad (opt) {
    const { branchNo, token, platform, username} = wx.getStorageSync('userObj')
    this.reuqestData = { branchNo, token, platform, username }
    this.data.couponsUseRule = wx.getStorageSync('configObj').couponsUseRule ? wx.getStorageSync('configObj').couponsUseRule.split('<br/>') : '' 
    this.getPageData()
    this.getCouponsExplain()
  },
  onShareAppMessage() { }
})