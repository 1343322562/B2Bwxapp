import * as types from '../../store/types.js'
import API from '../../api/index.js'
import dispatch from '../../store/actions.js'
import { showLoading, hideLoading, toast, alert, getGoodsImgSize, getGoodsTag, goPage, MsAndDrCount } from '../../tool/index.js'
Page({
  data: {
    isLoading:false,
    goodsList: [],
    partnerCode: getApp().data.partnerCode,
    cartsObj:{}
  },
  getCartsData() {
    dispatch[types.GET_CHANGE_CARTS]({
      format: true,
      nowUpdate: true,
      success: (cartsObj) => {
        let obj = { cartsObj }
        let isUpDate = false
        const goodsList = this.data.goodsList
        goodsList.forEach(item => {
          if (cartsObj[item.itemNo]) {
            const newGoods = MsAndDrCount(item, cartsObj[item.itemNo], '')
            if (newGoods) {
              item = newGoods
              isUpDate =  true
            }
          }
        })
        isUpDate && (obj.goodsList = goodsList)
        this.setData(obj)
      }
    })
  },
  getAllPromotion() {
    dispatch[types.GET_ALL_PROMOTION]({
      success: (res) => {
        this.promotionObj = res
        this.getGoodsList()
      }
    })
  },
  backPage () {
    wx.navigateBack({data:1})
  },
  getGoodsList() {
    const { branchNo, token, username, platform } = this.userObj
    showLoading('请稍后...')
    API.Goods.itemSearch({
      data: {
        branchNo: branchNo,
        token: token,
        username: username,
        platform: platform,
        condition: '',
        modifyDate: '',
        supcustNo: '',
        parentItemNo:this.itemNo,
        pageIndex: 1,
        pageSize: 1000,
        itemClsNo: ''
      },
      success: (res) => {
        console.time()
        let goodsList = []
        const promotionObj = this.promotionObj
        if (res.code == 0 && res.data) {
          const list = res.data.itemData || []
          list.forEach(goods => {
            const itemNo = goods.itemNo
            goods.goodsImgUrl = this.goodsUrl + goods.itemNo + '/' + getGoodsImgSize(goods.picUrl)
            const tag = getGoodsTag(goods, promotionObj)
            if (Object.keys(tag).length) { // 促销商品
              if (tag.FS || tag.SD || tag.ZK || tag.MS) {
                goods.orgiPrice = goods.price
                goods.price
              }
              goods = Object.assign(goods, tag)
            }
            goods.isStock = (goods.stockQty > 0 || goods.deliveryType == '3' || goods.specType == '2') ? true : false
            if (this.productionDateFlag != '0' && goods.isStock) {
              let dateArr = []
              if ((this.productionDateFlag == '1' || this.productionDateFlag == '3') && goods.productionDate) dateArr.push(goods.productionDate.replace(new RegExp(/(-)/g), '.'))
              if ((this.productionDateFlag == '2' || this.productionDateFlag == '3') && goods.newProductionDate) dateArr.push(goods.newProductionDate.replace(new RegExp(/(-)/g), '.'))
              goods.productionTime = dateArr.join('-')
            }
            goodsList.push(goods)
          })
          this.setData({ goodsList })
          this.getCartsData()
        } else {
          alert(res.msg,{
            success: ()=> {
              this.backPage()
            }
          })
        }
        console.timeEnd()
      },
      complete: () => {
        hideLoading()
        this.setData({ isLoading: true })
      }
    })
  },
  goGoodsDetails(e) {
    const itemNo = e.currentTarget.dataset.no
    goPage('goodsDetails', { itemNo })
  },
  changeCarts(e) {
    const { type, index } = e.currentTarget.dataset
    let allGoods = this.data.goodsList
    const goods = allGoods[index]
    const { dbBranchNo, branchNo } = this.userObj
    const config = {
      sourceType: '0',
      sourceNo: dbBranchNo,
      branchNo: branchNo
    }
    const cartsObj = dispatch[types.CHANGE_CARTS]({ goods, type, config })
    if (cartsObj) {
      let obj = { cartsObj }
      const newGoods = MsAndDrCount(goods, cartsObj[goods.itemNo], type)
      if (newGoods) {
        allGoods[index] = newGoods
        obj.goodsList = allGoods
      }
      this.setData(obj)
    }
  },
  onLoad (opt) {
    this.itemNo = opt.itemNo
    this.userObj = wx.getStorageSync('userObj')
    this.productionDateFlag = wx.getStorageSync('').productionDateFlag
    this.goodsUrl = getApp().data.goodsUrl
    this.getAllPromotion()
  },
  onReady () {
  },
  onShow () {
    if (this.pageLoading) {
      this.getCartsData()
    } else {
      this.pageLoading = true
    }
    
  },
  onHide () {
  }
})