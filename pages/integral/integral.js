import API from '../../api/index.js'
Page({
  data: {
    list: [],
    money: 0
  },
  getBranchPoint() {
    API.Integral.getBranchPoint({
      data: this.requestData,
      success: res => {
        if (res.code == 0 && res.data) {
          this.setData({ money: res.data})
        }
      }
    })
  },
  findSupplyAcclist() {
    API.Integral.findSupplyAcclist({
      data: this.requestData,
      success: res => {
        if (res.code == 0 && res.data) {
          const list = res.data
          list.forEach(item => {
            item.createDate = item.createDate.split('.')[0]
            item.accNum = item.accNum > 0 ? ('+' + item.accNum) : item.accNum
          })
          this.setData({ list})
        }
      }
    })
  },
  onLoad(opt) {
    const partnerCode = getApp().data.partnerCode
    if (partnerCode == 1052) wx.setNavigationBarColor({ backgroundColor: '#e6c210', frontColor: '#ffffff' })

    const { branchNo, token, platform, username } = wx.getStorageSync('userObj')
    this.requestData = { branchNo, token, platform, username }
    this.getBranchPoint()
    this.findSupplyAcclist()
  }
})