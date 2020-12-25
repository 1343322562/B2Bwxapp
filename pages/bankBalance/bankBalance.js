import API from '../../api/index.js'
import { goPage } from '../../tool/index.js'
Page({
  data: {
    partnerCode: getApp().data.partnerCode,
    tabIndex: 0,
    list: [[],[]],
    tabBer: [
      { name: '储值记录', icon:'bankBalance_icon_0'},
      { name: '授信明细', icon: 'bankBalance_icon_1' }
    ],
    availableCzAmt: 0, // 可用余额
    czAmt: 0.00, // 余额
    minCzAmt: 0.00, // 信用额度
    rebateAmt: 0.00, // 待返利
    partnerCode: getApp().data.partnerCode
  },
  goPage () {
    goPage('reconciliation')
  },
  getAccBranchInfoAmt () {
    API.Public.getAccBranchInfoAmt({
      data: this.requestData,
      success: res => {
        if (res.code == 0 && res.data) {
          let { availableCzAmt, minCzAmt, rebateAmt, czAmt} = res.data;
          console.log(czAmt)
          this.setData({ availableCzAmt, minCzAmt, rebateAmt, czAmt})
        }
      }
    })
  },
  getAccountFlow () {
    API.BankBalance.getAccountFlow({
      data: this.requestData,
      success: res => {
        if (res.code == 0 && res.data) {
          this.setListData(res.data, 0)
        }
      }
    })
  },
  getAccountFrozenFlow () {
    API.BankBalance.getAccountFrozenFlow({
      data: this.requestData,
      success: res => {
        if (res.code == 0 && res.data) {
          this.setListData(res.data,1)
        }
      }
    })
  },
  setListData (data,index) {
    let list = this.data.list
    data = data.filter(item => {
      const money = (item.busiAmt - (item.busiFrozenAmt||0))
      item.busiFrozenAmt = Number((money > 0?'+':'') + money).toFixed(2)
      item.createDate = item.createDate.split('.')[0]
      return money != 0
    })
    list[index] = data || []
    this.setData({ list })
  },
  changeTab (e) {
    const tabIndex = Number(e.currentTarget.dataset.index)
    wx.pageScrollTo({ scrollTop: 0, duration:0})
    this.setData({ tabIndex })
  },
  onLoad(opt) {
    const partnerCode = getApp().data.partnerCode
    if (partnerCode == 1060 || partnerCode == 1063) wx.setNavigationBarColor({ backgroundColor: '#ff9c01', frontColor: '#ffffff' }) 
    if (partnerCode == 1052) wx.setNavigationBarColor({ backgroundColor: '#e6c210', frontColor: '#ffffff' })

    const { branchNo, token, platform, username } = wx.getStorageSync('userObj')
    this.requestData = { branchNo, token, platform, username }
    this.getAccBranchInfoAmt()
    this.getAccountFlow()
    this.getAccountFrozenFlow()
  }
})