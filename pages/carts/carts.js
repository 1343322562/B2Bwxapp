import { showLoading, hideLoading, getGoodsImgSize, getGoodsTag } from '../../tool/index.js'
import * as types from '../../store/types.js'
import API from '../../api/index.js'
import dispatch from '../../store/actions.js'
import commit from '../../store/mutations.js'
Page({
  data: {
    // promotionDialogObj: [], // 换促销数据
    pageLoading: false,
    cartsObj: {},
    cartsList: [],
    replenish: {}, // 是否可以补货
  },
  goAllGoodsPage () {
    wx.switchTab({url: '/pages/t_goods/t_goods'})
  },
  deleteCarts (e) {
    const type = e.detail
    const cartsList = this.data.cartsList.filter(i => i !== type)
    let cartsObj = this.data.cartsObj
    delete cartsObj[type]
    this.setData({ cartsList, cartsObj })
  },
  getCartsData() {
    const { goodsUrl,zcGoodsUrl,zhGoodsUrl} = getApp().data
    const promotionObj = wx.getStorageSync('allPromotion')
    dispatch[types.GET_CHANGE_CARTS]({
      success: (ret) => {
        console.log(ret)
        wx.stopPullDownRefresh()
        hideLoading()
        let obj = { pageLoading: true}
        if (ret.code == 0 ) {
          console.log(JSON.parse(JSON.stringify(ret)))
          let list = ret.data||[]
          let cartsList = []
          let cartsObj = {}
          let S_cartObj = commit[types.GET_CARTS]()
          console.log(S_cartObj)
          list.forEach(config => {
            config.datas.forEach(goods => {
              const type = config.sourceType == '0' ? (goods.stockType == '0' ? 'cw' : 'dw') : config.sourceNo
              if (!cartsObj[type]) {
                (type == 'cw' || type == 'dw') ? cartsList.unshift(type) : cartsList.push(type)
                cartsObj[type] = {
                  branchNo: config.branchNo,
                  sourceName: config.sourceName,
                  sourceNo: config.sourceNo,
                  sourceType: config.sourceType,
                  startPrice: (type == 'cw' ? config.normalTemperature : (type == 'dw' ? config.refrigeration : config.startPrice)) || 0,
                  data: [],
                  type: type,
                  cartsType: (type == 'cw' || type == 'dw')?type:'sup',
                  cartsTypeName: type == 'cw'?'常温统配':(type=='dw'?'低温统配':'商家直配')
                }
              }
              goods.carstBasePrice =  goods.orgiPrice
              goods.currentPromotionNo = S_cartObj[goods.itemNo].currentPromotionNo || ''
              const tag = getGoodsTag(goods, promotionObj,true)
              goods = Object.assign(goods, tag)
              goods.goodsImgUrl = (config.sourceType == '0' ? (goods.specType == '2' ? zhGoodsUrl : goodsUrl): zcGoodsUrl) + goods.itemNo + '/' + getGoodsImgSize(goods.picUrl)
              cartsObj[type].data.push(goods)
            })
          })
          obj.cartsList = cartsList
          obj.cartsObj = cartsObj
        }
        this.setData(obj)
        console.log(obj)
      }
    })
  },
  isReplenish () {
    const { platform, username, branchNo, token } = wx.getStorageSync('userObj')
    API.Carts.couldReplenishment({
      data: { platform, username, branchNo, token},
      success: res => {
        const data = res.data
        if (res.code == '0' && data) {
          let replenish = {}
          let Fun = (arr,types)=>{
            return types == '0' ? (this.replenishSheet == '1' ? ((arr && arr.length) ? arr[0].sheetNo : ''):'all'):''
          }
          replenish['cw'] = Fun(data.normalData, data.normal)
          replenish['dw'] = Fun(data.coldData, data.cold)
          this.setData({ replenish })
        }
      }
    })
  },
  onLoad (opt) {
    const { replenishFlag, replenishSheet } = wx.getStorageSync('configObj')
    this.replenishFlag = replenishFlag||'0'
    this.replenishSheet = replenishSheet||'0'
  },
  onReady () {},
  onShow() {
    this.refreshCarts()
    this.replenishFlag != '0' && this.isReplenish()
  },
  onShareAppMessage: function () { },
  onHide () {
    this.setData({ pageLoading: false })
  },
  refreshCarts (){
    showLoading('请稍候...')
    this.getCartsData()
  },
  onPullDownRefresh() {
    this.refreshCarts()
    const cpn = this.selectComponent('.carts-items')
    console.log(cpn)
    cpn.attached()
    // this.onLoad()
    // this.onShow()
  },
  onReachBottom () {
    console.log(this.data.cartsObj, this.data)
  }
})