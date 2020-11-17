import * as types from '../../store/types.js'
import API from '../../api/index.js'
import dispatch from '../../store/actions.js'
import { showLoading, hideLoading, alert, toast, getGoodsImgSize, getGoodsTag, deepCopy, setParentGoodsCartsObj, goPage, MsAndDrCount } from '../../tool/index.js'
const maxNum = 20
let baseGoodsList
Page({
  data: {
    pageLoading: false,
    cartsObj: {}, // 购物车数据
    goodsList: [],
    goodsObj: {},
    partnerCode: getApp().data.partnerCode,
    totalLength: '',
    isCollectGoods :false,
    opt: {}
  },
  goCartsPage () {
    wx.switchTab({
      url: '/pages/carts/carts'
    })
  },
  changeCarts(e) {
    const { type, no } = e.currentTarget.dataset
    let allGoods = this.data.goodsObj
    const goods = allGoods[no]
    const { dbBranchNo, branchNo } = this.userObj
    if (goods.specType != '2') {
      const config = {
        sourceType: this.supplierNo?'1':'0',
        sourceNo: this.supplierNo||dbBranchNo,
        branchNo: branchNo
      }
      const cartsObj = dispatch[types.CHANGE_CARTS]({ goods, type, config })
      if (cartsObj) {
        let obj = { cartsObj: setParentGoodsCartsObj(cartsObj) }
        const newGoods = MsAndDrCount(goods, cartsObj[no], type)
        if (newGoods) {
          allGoods[no] = newGoods
          obj.goodsObj = allGoods
        }
        this.setData(obj)
      }
    } else {
      goPage('goodsChildren', { itemNo: no })
    }
  },
  goGoodsDetails(e) {
    const itemNo = e.currentTarget.dataset.no
    const supcustNo = this.supplierNo || ''
    goPage('goodsDetails', { itemNo, supcustNo})
  },
  getAllPromotion(opt) {
    dispatch[types.GET_ALL_PROMOTION]({
      success: (res) => {
        this.promotionObj = res
        let { title, type, value,supplierNo } = opt
        if (type == '1' && value == '3') { // 首单特价
          const goods = res.FS
          let itemNos = []
          for (let i in goods) {
            itemNos.push(goods[i].itemNo)
          }
          this.getGoodsListTimeout(itemNos.join(','))
          title = '首单特价'
        } else if (type == '3') { // 活动页
          this.getGoodsListTimeout(value)
        } else if (type == '8') { // 组合促销
          let list = []
          const goods = res.BD.goods
          for (let i in goods) {
            value.indexOf(goods[i].promotionSheetNo) != -1 && list.push(goods[i])
          }
          this.setGoodsList(list, 'zGoods')
          hideLoading()
          title = '组合促销'
        } else if (type == '10'){ // 入驻商商品
          this.supplierNo = supplierNo
          this.getGoodsListTimeout(value)
        } else if (type == '100') { // 常购商品
          this.getGoodsListTimeout(value)
          title = '常购商品'
        } else if (type == '101') { // 收藏商品
          this.getGoodsListTimeout(value)
          title = '收藏商品'
          setTimeout(() => {
            this.setData({ isCollectGoods: true })
          }, 1000)
        }

        console.log('asadsdadada')
        wx.setNavigationBarTitle({ title: (title || '活动页') })
      }
    })
  },
  countPrice() {
    if (this.goodsListLoading && this.cartsLoading) {
      const { cartsObj, goodsObj } = this.data
      let isUpDate = false
      cartsObj.keyArr.forEach(item => {
        if (goodsObj[item]) {
          const newGoods = MsAndDrCount(goodsObj[item], cartsObj[item], '')
          if (newGoods) {
            goodsObj[item] = newGoods
            isUpDate = true
          }
        }
      })
      isUpDate && this.setData({ goodsObj })
    }
  },
  getCartsData() {
    dispatch[types.GET_CHANGE_CARTS]({
      format: true,
      nowUpdate: true,
      success: (res) => {
        const cartsObj = setParentGoodsCartsObj(res)
        this.setData({ cartsObj })
        this.cartsLoading = true
        this.countPrice()
      }
    })
  },
  getGoodsListTimeout (val) {
    this.getGoodsListTimer = setTimeout(() => {
      this.getGoodsList(val)
    }, 100)
  }, 
  getGoodsList(itemNos) {
    const { platform, username, branchNo, token} = this.userObj
    API.Goods[this.supplierNo?'supplierItemSearch':'itemSearch']({
      data: {
        branchNo,
        token,
        username,
        platform,
        condition: '',
        modifyDate: '',
        supcustNo: this.supplierNo||'',
        pageIndex: 1,
        pageSize: 1000,
        searchItemNos: itemNos||'',
        itemClsNo: ''
      },
      success: res => {
        console.log(res)
        if (res.code == 0 && res.data) {
          const list = res.data.itemData || []
          this.setGoodsListTimer = setTimeout(() => {
            this.setGoodsList(list, 'goods')
          }, 60)
        }
      },
      complete: () => {
        setTimeout(() => {
          // hideLoading()
          this.setData({ pageLoading: true })
        }, 1200)
        console.log(56456456456456)
      }
    })
  },
  setGoodsList (data,type) {
    let goodsList = []
    let fineGoodsList = []
    const promotionGoodsList = []
    const promotionFineGoodsList = []
    let goodsObj = {}
    const promotionObj = this.promotionObj
    data.forEach(goods => {
      const itemNo = goods.itemNo
      this.supplierNo && (goods.stockQty = 9999)
      goods.goodsImgUrl || (goods.goodsImgUrl = (this.supplierNo?this.zcGoodsUrl: this.goodsUrl) + goods.itemNo + '/' + getGoodsImgSize(goods.picUrl))
      const tag = getGoodsTag(goods, promotionObj)
      if (Object.keys(tag).length && type == 'goods') { // 促销商品
        goods.stockQty > 0 ? promotionGoodsList.push(itemNo) : promotionFineGoodsList.push(itemNo)
        if (tag.FS || tag.SD || tag.ZK || tag.MS) {
          goods.orgiPrice = goods.price
          goods.price
        }
        goods = Object.assign(goods, tag)
      } else {
        (goods.stockQty > 0 || goods.deliveryType == '3' || goods.specType == '2') ? goodsList.push(itemNo) : fineGoodsList.push(itemNo)
      }
      goods.isStock = (goods.stockQty > 0 || goods.deliveryType == '3' || goods.specType == '2') ? true : false
      if (this.productionDateFlag != '0' && goods.isStock) {
        let dateArr = []
        if ((this.productionDateFlag == '1' || this.productionDateFlag == '3') && goods.productionDate) dateArr.push(goods.productionDate.replace(new RegExp(/(-)/g), '.'))
        if ((this.productionDateFlag == '2' || this.productionDateFlag == '3') && goods.newProductionDate) dateArr.push(goods.newProductionDate.replace(new RegExp(/(-)/g), '.'))
        goods.productionTime = dateArr.join('-')
      }
      if (type == 'zGoods' && goods.bdPsPrice) {
        goods.discountMoney = Number((goods.bdPsPrice - goods.price).toFixed(2))
      }
      goodsObj[itemNo] = goods
    })
    let newArr = (promotionGoodsList.concat(goodsList)).concat(promotionFineGoodsList.concat(fineGoodsList))
    const totalLength = newArr.length
    this.setData({
      goodsObj: goodsObj
    })
    setTimeout(() => {
      this.setData({
        goodsList: newArr.splice(0, maxNum),
        totalLength: totalLength
      })
      baseGoodsList = newArr
    }, 30)
    
    this.goodsListLoading = true
    this.countPrice()
    setTimeout(() => {
      hideLoading()
    })
  },
  onLoad (opt) {
    setTimeout(() => {console.log(this.data), 500})
    showLoading('请稍后...')
    opt.title = decodeURIComponent(opt.title)
    opt.value = decodeURIComponent(opt.value)
    console.log(opt, JSON.stringify(opt))
    this.userObj = getApp().data['userObj'] || wx.getStorageSync('userObj')
    this.productionDateFlag = wx.getStorageSync('configObj').productionDateFlag
    const { goodsUrl, zhGoodsUrl, zcGoodsUrl} = getApp().data
    this.goodsUrl = goodsUrl
    this.zhGoodsUrl = zhGoodsUrl
    this.zcGoodsUrl = zcGoodsUrl
    this.getAllPromotionTimer = setTimeout(() => {
      this.getAllPromotion(opt)
    }, 100)
    console.log(32132132132132132)
  },
  onShow: function () {
    console.log('asdasdasdasdsdas')
    this.getCartsData()
    const { pageLoading, isCollectGoods, totalLength } = this.data
    console.log(isCollectGoods)
    if (pageLoading&& isCollectGoods && totalLength && this.isLoadingPage) {
      console.log('钱')
      const collectObj = wx.getStorageSync('collectObj')
      console.log('后')
      const arr = Object.keys(collectObj)
      arr.length ? this.getGoodsListTimeout(arr.join(',')) : this.setData({ goodsList:[]})
    } else {
      this.isLoadingPage = true
    }
  },
  onReady() {
  },
  onHide () {
    console.log('页面以隐藏')
    clearTimeout(this.setGoodsListTimer)
    clearTimeout(this.getAllPromotionTimer)
    clearTimeout(this.getGoodsListTimer)
    this.isLoadingPage = false
    this.pageLoading = false
    hideLoading()
  },
  onUnload() {
    console.log('页面已关闭') 
    clearTimeout(this.setGoodsListTimer)
    clearTimeout(this.getGoodsListTimer)
    clearTimeout(this.getAllPromotionTimer)
    this.isLoadingPage = false
    this.pageLoading = false
    hideLoading()
  },
  onShareAppMessage(res) {
    console.log(res)
  },
  onReachBottom: function () {
    if (!this.isLoading && baseGoodsList.length) {
      this.isLoading = true
      let newArr = this.data.goodsList
      baseGoodsList = baseGoodsList.filter((item, index) => {
        if (maxNum > index) {
          newArr.push(item)
          return false
        } else {
          return true
        }
      })
      this.setData({ goodsList: newArr })
      setTimeout(() => {
        this.isLoading = false
      }, 40)
    }
  }
})