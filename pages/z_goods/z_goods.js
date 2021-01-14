import API from '../../api/index.js'
import { showLoading, hideLoading, alert, getTime, getGoodsImgSize, deepCopy,goPage } from '../../tool/index.js'
Page({
  data: {
    nowSelectedCls: 'all',
    clsList: [],
    supplierObj: {},
    supplierKey: {},
    pageLoading: false,
    username: ''
  },
  changeCls (e) {
    this.setData({ nowSelectedCls: e.currentTarget.dataset.no})
  },
  goSearch () {
    goPage('searchGoods', { openType: 'zhipei' })
  },
  goGoodsList (e) {
    const no = e.currentTarget.dataset.no
    const supplierObj = this.data.supplierObj
    const { goodsImgUrl, supplierName, itemClsName, supplierTel, minDeliveryMomey, supplierNo} = supplierObj[no]
    // 跳转页面传参
    goPage('supplierGoods',{
      config: { goodsImgUrl, supplierName, itemClsName, supplierTel, minDeliveryMomey, supplierNo}
    })
  },
  getList () {
    const { branchNo, token, platform, username} = wx.getStorageSync('userObj')
    const imgUrl = getApp().data.imgUrl
    API.Supplier.searchSupcust({
      data: { branchNo, token, platform, username, condition:''},
      success: res => {
        console.log(res)
        const list = res.data
        if (res.code == 0 && list) {
          let supplierObj = {}
          let supplierKey = this.data.supplierKey
          const { username } = wx.getStorageSync('userObj')
          list.forEach((item, index) => {
            const cls = item.managementType
            const no = item.supplierNo
            console.log(!!item.picUrl)
            item.goodsImgUrl = item.picUrl ? imgUrl + '/upload/images/supplier/' + item.picUrl : '../../images/sup-h.png'
            supplierObj[no] = item
            supplierKey['all'].push(no)
            if (cls && supplierKey[cls]) {
              supplierKey[cls].push(no)
            }
          })
          console.log(list, supplierObj)
          this.setData({ supplierObj })
          setTimeout(()=>{
            this.setData({ supplierKey })
          },150)
        }
      },
      complete: () => {
        wx.hideLoading()
        this.setData({ pageLoading: true})
      }
    })
  },
  onShareAppMessage() { },
  onLoad (opt) {
    const { username } = wx.getStorageSync('userObj')
    // 此处缓存在 login 页面中设置
    const clsList = wx.getStorageSync('supcustAllCls')||[]
    let supplierKey = {all:[]}
    clsList.forEach(item => {
      supplierKey[item.supcustCls] = []
    })
    this.setData({ clsList, supplierKey, username})
    this.getList()
  },
  onShow () {
  }
})