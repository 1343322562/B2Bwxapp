import API from '../../api/index.js'
import { showLoading, hideLoading, alert, toast, deepCopy, getGoodsImgSize } from '../../tool/index.js'
Page({
  data: {
    pageLoading: false,
    list: [],
    money: 0,
    nameStr:'积分'
  },
  getUserInfo () {
    API.Integral.getBranchPoint({
      data: this.requestData,
      success: res => {
        if (res.code == 0 && res.data) {
          this.setData({ money: res.data })
        }
      }
    })
  },
  getPageData () {
    showLoading('请稍后...')
    const goodsUrl = getApp().data.goodsUrl
    API.Integral.searchIntegralStoreGoods({
      data: this.requestData,
      success: res => {
        console.log(res)
        if (res.code == 0&& res.data) {
          const list = res.data
          list.forEach(goods => {
            goods.goodsImgUrl = goodsUrl + goods.itemNo + '/' + getGoodsImgSize(goods.picUrl)
            if (goods.type == '1' && goods.couponsOutVo) {
              let startTime = goods.couponsOutVo.startDate
              let endTime = goods.couponsOutVo.endDate
              startTime && (goods.couponsOutVo.startTime = startTime.split(' ')[0])
              endTime && (goods.couponsOutVo.endTime = endTime.split(' ')[0])
              const filterType = goods.couponsOutVo.filterType
              goods.cupType = (filterType == '0' ? '商品' : (filterType == '1' ? '类别' : (filterType == '2' ? '品牌' : '全场')))
            }
          })
          this.setData({ list})
        }
      },
      complete: () => {
        hideLoading()
        this.setData({ pageLoading:true})
      }
    })
  },
  integral (e) {
    const index = e.currentTarget.dataset.index
    const item = this.data.list[index]
    let data = deepCopy(this.requestData)
    data.itemNos = item.itemNo
    if (item.residueQty <= 0) return
    alert('您确定兑换此商品吗?', {
      title: '温馨提示',
      showCancel: true,
      success: ret => {
        if (ret.confirm) {
          showLoading('兑换中...')
          data.data = JSON.stringify([{ itemNo: item.itemNo, size: '1' }])
          API.Integral.submitIntegralStoreGoods({
            data: data,
            success: res => {
              alert(res.msg)
              if (res.code == 0) {
                this.getUserInfo()
              }
            },
            error: () => {
              alert('兑换商品失败，请检查网络是否正常')
            },
            complete: () => {
              hideLoading()
            }
          })
        }
      }
    })
    
  },
  onShareAppMessage() { },
  onLoad () {
    const { dbBranchNo: dbranchNo, token, platform, branchNo, username} = wx.getStorageSync('userObj')
    this.requestData = { dbranchNo, token, platform, branchNo, username}
    this.getPageData()
    this.getUserInfo()
  }
})