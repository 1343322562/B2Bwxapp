import * as types from '../../store/types.js'
import API from '../../api/index.js'
import dispatch from '../../store/actions.js'
import { showLoading, hideLoading, goPage, toast, alert, getGoodsImgSize, getGoodsTag, setParentGoodsCartsObj, MsAndDrCount} from '../../tool/index.js'
const maxNum = 15
let baseGoodsList
Page({
  data: {
    historyList:[],
    hotrList:[],
    searchText: '',
    showGoodsList: false,
    goodsList: [],
    goodsObj: {},
    cartsObj: {},
    partnerCode: getApp().data.partnerCode,
    isGoodsLoading: false,
    totalLength: '',
    openType: '',
    supplierData: []
  },
  clearkey () {
    this.setData({ historyList: [] })
  },
  backPage () {
    this.data.showGoodsList ? this.hideGoodsList() : wx.navigateBack()
  },
  hideGoodsList () {
    this.setData({ showGoodsList: false, goodsList: [], goodsObj: {}, totalLength: '', searchText: '', isGoodsLoading:false })
    this.goodsListLoading = false
    baseGoodsList = []
  },
  openCode (e) {
    wx.scanCode({
      success: res =>{
        const searchText = res.result
        this.setData({ searchText })
        this.searchText = searchText
        this.searchResult()
      }
    })
  },
  confirmSearch(e) {
    const value = e.detail.value.trim()
    this.searchText = value
    this.searchResult()
  },
  searchInputBlur(e) {
    const value = e.detail.value.trim()
    if (value == this.searchText) return
    this.searchText = value
    this.searchResult()
  },
  searchResult() {
    this.getGoodsList()
  },
  // 直配商品搜索
  getSupplierGoodsList () {
    const condition = this.searchText
    const _this = this
    if (!condition) return 
    showLoading('请稍候...')
    const supcustNo = this.supplierNo
    const { branchNo, token, platform, username } = this.userObj
    API.Goods.supplierItemSearch({
      data: { condition, modifyDate:'', pageIndex: 1, pageSize: 1000, token, platform, username},
      success: res => {
        console.log(res)
        if(res.code == 0 && res.data) {
          _this.data.supplierData = res.data.itemData
        }
      }
    })
  },
  getGoodsList() {
    const _this = this
    _this.getSupplierGoodsList()
    const searchText = this.searchText
    let historyList = this.data.historyList
    if (searchText) {
      this.setData({ searchText: this.searchText, showGoodsList: true })
      const { branchNo, token, username, platform } = this.userObj
      showLoading('请稍后...')
      if (historyList.indexOf(searchText)==-1) {
        historyList.push(searchText)
        this.setData({ historyList})
        wx.setStorage({key: 'historyList',data: historyList})
      }
      API.Goods.itemSearch({
        data: {
          branchNo: branchNo,
          token: token,
          username: username,
          platform: platform,
          condition: searchText,
          modifyDate: '',
          supcustNo: '',
          pageIndex: 1,
          pageSize: 1000,
          itemClsNo: ''
        },
        success: (res) => {
          console.log(res)
          let goodsList = []
          let fineGoodsList = []
          const promotionGoodsList = []
          const promotionFineGoodsList = []
          let goodsObj = {}
          const promotionObj = this.promotionObj
          const zhGoodsObj = promotionObj.BD.goods
          if (Object.keys(zhGoodsObj).length) { // 类别下组合商品 
            for (let i in zhGoodsObj) {
              let goods = zhGoodsObj[i]
              if (goods.itemNo.indexOf(searchText) != -1 || goods.itemName.indexOf(searchText)!=-1) {
                console.log(115, goods.stockQty > 0 , goods.deliveryType == '3', goods.fillState != 1)
                goods.isStock = ((goods.stockQty > 0 || goods.deliveryType == '3') && goods.fillState != 1) ? true : false
                // fillState: 是否补货状态 0： 有货   1：  补货 
                goodsObj[i] = goods
                goods.stockQty > 0 ? promotionGoodsList.push(i) : promotionFineGoodsList.push(i)
              }
            }
          }
          if (res.code == 0 && (res.data || _this.data.supplierData.length)) {
            if (!res.data) res.data = {} // 当统配无商品，直配有商品时
            const list = (res.data.itemData || []).concat(_this.data.supplierData)
            console.log(list, _this.data.supplierData)
            list.forEach(goods => {
              const itemNo = goods.itemNo
              if (goods.supcustNo) {
                goods.goodsImgUrl = this.zcGoodsUrl + goods.itemNo + '/' + getGoodsImgSize(goods.picUrl)
              } else {
                goods.goodsImgUrl = this.goodsUrl + goods.itemNo + '/' + getGoodsImgSize(goods.picUrl)
              }
              const tag = getGoodsTag(goods, promotionObj)
              if (Object.keys(tag).length) { // 促销商品
                goods.stockQty > 0 ? promotionGoodsList.push(itemNo) : promotionFineGoodsList.push(itemNo)
                if (tag.FS || tag.SD || tag.ZK|| tag.MS) {
                  goods.orgiPrice = goods.price
                  goods.price
                }
                goods = Object.assign(goods, tag)
              } else {
                (goods.stockQty > 0 || goods.deliveryType == '3' || goods.specType == '2') ? goodsList.push(itemNo) : fineGoodsList.push(itemNo)
              }
              goods.isStock = ((goods.stockQty > 0 || goods.deliveryType == '3' || goods.specType == '2') && goods.fillState != 1) ? true : false
              if (this.productionDateFlag != '0' && goods.isStock) {
                let dateArr = []
                if ((this.productionDateFlag == '1' || this.productionDateFlag == '3') && goods.productionDate) dateArr.push(goods.productionDate.replace(new RegExp(/(-)/g), '.'))
                if ((this.productionDateFlag == '2' || this.productionDateFlag == '3') && goods.newProductionDate) dateArr.push(goods.newProductionDate.replace(new RegExp(/(-)/g), '.'))
                goods.productionTime = dateArr.join('-')
              }
              
              goodsObj[itemNo] = goods
            })

          }
          console.log(promotionGoodsList)
          console.log(goodsList)
          console.log(promotionFineGoodsList)
          console.log(fineGoodsList)
          let newArr = (promotionGoodsList.concat(goodsList)).concat(promotionFineGoodsList.concat(fineGoodsList))
          const totalLength = newArr.length
          this.setData({
            goodsObj: goodsObj,
            totalLength: totalLength
          })
          wx.pageScrollTo({ scrollTop: 0, duration: 0 })
          setTimeout(() => {
            this.setData({
              goodsList: newArr.splice(0, maxNum)
            })
            baseGoodsList = newArr
            console.log(newArr)
          }, 100)
          this.goodsListLoading = true
          this.countPrice()
        },
        complete: () => {
          hideLoading()
          this.setData({ isGoodsLoading: true })
        }
      })
    } else {
      this.hideGoodsList()
    }
  },
  goCartsPage() {
    wx.switchTab({
      url: '/pages/carts/carts'
    })
  },
  countPrice () {
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
      isUpDate && this.setData({ goodsObj})
    }
  },
  selected (e) {
    this.searchText =  e.currentTarget.dataset.key
    this.getGoodsList()
  },
  changeCarts(e) {
    const { type, no } = e.currentTarget.dataset
    let allGoods = this.data.goodsObj
    const goods = allGoods[no]
    const { dbBranchNo, branchNo } = this.userObj
    if (goods.specType != '2') {
      const config = {
        sourceType:  goods.supcustNo ? '1' : '0',
        sourceNo: goods.supcustNo ? goods.supcustNo : dbBranchNo,
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
  onReachBottom() {
    console.log(baseGoodsList)
    if (!this.isLoading && baseGoodsList.length) {
      this.isLoading = true
      let newArr = this.data.goodsList
      console.log('newArr', newArr)
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
      }, 400)
    }
  },
  getAllPromotion() {
    dispatch[types.GET_ALL_PROMOTION]({
      success: (res) => {
        this.promotionObj = res
      }
    })
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
  goGoodsDetails(e) {
    console.log(e)
    const itemNo = e.currentTarget.dataset.no
    const supcustNo = e.currentTarget.dataset.supno
    if (supcustNo) {
      goPage('goodsDetails', { itemNo, supcustNo })
    } else {
      goPage('goodsDetails', { itemNo })
    }
  },
  onLoad (opt) {
    console.log(opt)
    if (opt.type == 'opencode') this.openCode()
    const openType = opt.openType // 统配: tongpei  直配: zhipei
    const config = wx.getStorageSync('configObj')
    const historyList = wx.getStorageSync('historyList') || []
    this.userObj = wx.getStorageSync('userObj')
    this.goodsUrl = getApp().data.goodsUrl
    this.zcGoodsUrl = getApp().data.zcGoodsUrl
    this.productionDateFlag = config.productionDateFlag
    let hotrList = []
    for (let i = 1 ;i<7;i++) {
      const key = config['searchHotWord' + i]
      key && hotrList.push(key)
    }
    this.setData({ hotrList, historyList, openType})
  },
  onShow () {
    this.getAllPromotion()
    this.getCartsData()
    setTimeout(() => console.log(this.data), 10000)
  }
})