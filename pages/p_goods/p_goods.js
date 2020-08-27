import * as types from '../../store/types.js'
import API from '../../api/index.js'
import dispatch from '../../store/actions.js'
import { showLoading, hideLoading, goPage, toast, alert, getGoodsImgSize, getGoodsDataSize, getGoodsTag, deepCopy, setParentGoodsCartsObj, MsAndDrCount} from '../../tool/index.js'
const maxNum = 15
let baseGoodsList
Page({
  data: {
    pageLoading: false,
    nowSelectOneCls: '', // 选中一级分类
    nowSelectTwoCls: '', // 选中二级分类
    classifyObj: {}, // 商品分类
    classifyList: [], // 商品分类KEY
    animtionObjShow: {},
    animtionObjHide: {},
    beforeOneCls: '', // 之前选中一级的分类
    goodsList: [],
    goodsObj:{},
    cartsObj: {},
    isloadingGoods: false,
    partnerCode: getApp().data.partnerCode,
    totalLength: '',
    screenSelect:'0',
    screenShow: false,
    brandList:[],
    brandObj: {},
    itemBrandnos:{},
    promotionNo: '' // 促销单号
  },
  showScreen (e) {
    this.setData({ screenShow:e?true:false})
  },
  selectedScreen (e) {
    const no = e.currentTarget.dataset.no
    const itemBrandnos = this.data.itemBrandnos
    if (itemBrandnos[no]) {
      delete itemBrandnos[no]
    } else {
      itemBrandnos[no] = true
    }
    this.setData({ itemBrandnos})
  },
  confirm (e) {
    const types = e.currentTarget.dataset.type
    types == '0' && this.setData({ itemBrandnos: {} })
    this.getGoodsList()
    this.showScreen(false)
  },
  selectScreen (e) {
    const types = e.currentTarget.dataset.type
    const screenSelect = this.data.screenSelect
    this.setData({ screenSelect: types == '1' ? (screenSelect=='1'?'2':'1'): types })
    this.getGoodsList()
  },
  getAllPromotion(type) {
    dispatch[types.GET_ALL_PROMOTION]({
      success: (res) => {
        this.promotionObj = res
        type ? this.getGoodsList(type) : this.getItemCls()
      }
    })
  },
  getItemCls () {
    const { classifyList, classifyObj} = wx.getStorageSync('AllCls')
    this.setData({ classifyList, classifyObj, pageLoading: true})
    this.tapOneCls(classifyList[0],'one')
  },
  tapOneCls (e,type) {
    if (e) {
      let no = typeof e == 'object' ? e.currentTarget.dataset.no : e
      const beforeNo = this.data.nowSelectOneCls
      const twoCls = this.data.classifyObj[no].children || []
      no == beforeNo && (no = null)
      this.setData({ beforeOneCls: beforeNo})
      setTimeout(()=>{
        if (type != 'one') {
          const h = ((twoCls.length + 1) * 100) + 'rpx'
          this.nowAnmiation.height(h).step()
          this.beforeAnmiation.height('100rpx').step()
          this.setData({
            animtionObjShow: this.nowAnmiation.export(),
            animtionObjHide: this.beforeAnmiation.export(),
            nowSelectOneCls: no
          })
        }
        twoCls.length && this.tapTwoCls(twoCls[0].clsNo)
      },20)
    }
  },
  tapTwoCls (e) {
    const no = typeof e == 'object' ? e.currentTarget.dataset.no : e
    if (this.data.nowSelectTwoCls == no) return
    this.setData({ nowSelectTwoCls: no, itemBrandnos:{}})
    this.getGoodsList()
  },
  goGoodsDetails (e) {
    const itemNo = e.currentTarget.dataset.no
    goPage('goodsDetails', { itemNo })
  },
  getGoodsList (type) {
    const { branchNo, token, username, platform} = this.userObj
    const clsNo = this.data.nowSelectTwoCls
    const screenSelect = this.data.screenSelect
    const loadingIndex = type ? this.loadingIndex : 1
    showLoading('请稍后...')
    const itemBrandnos = Object.keys(this.data.itemBrandnos).join(',')
    const promotionNo = this.data.promotionNo
    API.Public.searchItemByPromotionNo({
      data: {
        branchNo: branchNo,
        token: token,
        username: username,
        platform:platform,
        pageIndex: 1,
        pageSize: 1000,
        promotionNo
      },
      success: (res) => {
        console.log(res)
        if (!res.data) return
        this.loadingIndex = loadingIndex
        let goodsList = []
        let fineGoodsList = []
        const promotionGoodsList =[]
        const promotionFineGoodsList = []
        let goodsObj = {}
        const promotionObj = this.promotionObj
        const zhGoodsList = promotionObj.BD.cls[clsNo]
        const zhGoodsObj = promotionObj.BD.goods
        let brandList = itemBrandnos ? this.data.brandList:[]
        let brandObj = itemBrandnos ? this.data.brandObj : {}
        if (zhGoodsList) { // 类别下组合商品 
          zhGoodsList.forEach(no => {
            const goods = getGoodsDataSize(zhGoodsObj[no])
            goods.isStock = (goods.stockQty > 0 || goods.deliveryType == '3') ? true : false
            if (zhGoodsObj[no].bdPsPrice) goods.discountMoney = Number((zhGoodsObj[no].bdPsPrice - goods.price).toFixed(2))
            goodsObj[no] = goods
            goods.stockQty > 0 ? promotionGoodsList.push(no) : promotionFineGoodsList.push(no)
          })
        }
        if (res.code == 0 && res.data) {
          const list = res.data.itemData || []

          console.log(promotionObj, this)
          list.forEach(goods => {
            const itemNo = goods.itemNo
            if (goods.itemBrandname && !brandObj[goods.itemBrandno] && !itemBrandnos) {
              brandObj[goods.itemBrandno] = goods.itemBrandname
              brandList.push(goods.itemBrandno)
            } 
            goods.goodsImgUrl = this.goodsUrl + goods.itemNo + '/' + getGoodsImgSize(goods.picUrl)
            const tag = getGoodsTag(goods, promotionObj)
            if (Object.keys(tag).length) { // 促销商品
              goods.stockQty > 0 ? promotionGoodsList.push(itemNo) : promotionFineGoodsList.push(itemNo)
              if (tag.FS || tag.SD || tag.ZK|| tag.MS) {
                goods.orgiPrice = goods.price
                goods.price
              }
              // console.log(tag.SZFilterArr, tag.SZStockType, tag['SZInfo'])
              'SZInfo' in tag && tag['SZInfo'].map((SZItem, index) => {
                if ('SZInfo' in tag && 'SZStockType' in tag) {
                  if ('SZFilterArr' in tag && tag['SZFilterArr'].length) {
                    // 按类促销  按品牌促销（SZ）
                    if (tag['SZFilterArr'][index] == undefined || tag['SZFilterArr'][index] == '') { // 无过滤信息时，根据 stockType 来选择所有商品
                      if (tag['SZStockType'][index] == 0) { goods['SZInfo'] = tag['SZInfo'][index];  goods['SZStockType'] = tag['SZStockType'][index]; } 
                        // 温度type 配送筛选
                      if ((tag['SZStockType'][index] == 2 && goods['stockType'] != 0) || (tag['SZStockType'][index] == '1' && goods['stockType'] == '0' )) { goods['SZInfo'] = tag['SZInfo'][index];  goods['SZStockType'] = tag['SZStockType'][index]}
                    } else {
                      tag['SZFilterArr'][index].map(filterVal => {
                        if (filterVal == goods['itemClsno'] || filterVal == goods['itemNo'] || ('itemBrandno' in goods && goods['itemBrandno'] == filterVal)) {
                          // if (
                          //   tag['SZStockType'][index] == 0 
                          //   // || tag['SZStockType'][index] == goods['stockType'] 
                          //   || (tag['SZStockType'][index] == 2 && goods['stockType'] != '0')     // 低温
                          //   || (tag['SZStockType'][index] == '1' && goods['stockType'] == '0' )  // 常温
                          // ){
                          //   goods['SZInfo'] = tag['SZInfo'][index]
                          //   goods['SZStockType'] = tag['SZStockType'][index];
                          // }
                          // 全部
                          if (tag['SZStockType'][index] == 0) { goods['SZInfo'] = tag['SZInfo'][index];  goods['SZStockType'] = tag['SZStockType'][index]; } 
                          // 温度type 配送筛选
                          if ((tag['SZStockType'][index] == 2 && goods['stockType'] != 0) || (tag['SZStockType'][index] == '1' && goods['stockType'] == '0' )) { goods['SZInfo'] = tag['SZInfo'][index];  goods['SZStockType'] = tag['SZStockType'][index]}
                        }
                      })   
                    }
                    
                  } else {
                  // 全部促销 
                    if (tag['SZStockType'][index] == 0) { goods['SZInfo'] = tag['SZInfo'][index];  goods['SZStockType'] = tag['SZStockType'][index]}
                    if ((tag['SZStockType'][index] == 2 && goods['stockType'] != 0) || (tag['SZStockType'][index] == '1' && goods['stockType'] == '0' )) { goods['SZInfo'] = tag['SZInfo'][index];  goods['SZStockType'] = tag['SZStockType'][index]}
                    delete tag['SZInfo']; delete tag['SZStockType']
                  }
                }
              })
              delete tag['SZInfo']; delete tag['SZStockType']; delete tag['SZFilterArr']; // 删除多余 tag 属性
              goods = Object.assign(goods, tag)
            } else {
              (goods.stockQty > 0 || goods.deliveryType == '3' || goods.specType =='2') ? goodsList.push(itemNo) : fineGoodsList.push(itemNo)
            }
            goods.isStock = (goods.stockQty > 0 || goods.deliveryType == '3' || goods.specType == '2' ) ? true : false
            if (this.productionDateFlag != '0' && goods.isStock) {
              let dateArr = []
              if ((this.productionDateFlag == '1' || this.productionDateFlag == '3') && goods.productionDate) dateArr.push(goods.productionDate.replace(new RegExp(/(-)/g), '.'))
              if ((this.productionDateFlag == '2' || this.productionDateFlag == '3') && goods.newProductionDate) dateArr.push(goods.newProductionDate.replace(new RegExp(/(-)/g), '.'))
              goods.productionTime = dateArr.join('-')
            }
            goodsObj[itemNo] = goods
          })
        }
        let newArr = (promotionGoodsList.concat(goodsList)).concat(promotionFineGoodsList.concat(fineGoodsList))
        if (screenSelect!='0') {
          newArr.sort((a, b) => (screenSelect == '1' ? (goodsObj[a].price - goodsObj[b].price) : (goodsObj[b].price - goodsObj[a].price)))
        }
        const totalLength = newArr.length
        this.setData({
          goodsObj: goodsObj,
          totalLength: totalLength,
          brandList,
          brandObj
        })
        type || wx.pageScrollTo({ scrollTop: 0, duration: 0 })
        setTimeout(() => {
          this.setData({
            goodsList: newArr.splice(0, maxNum * loadingIndex)
          })
          baseGoodsList = newArr
          hideLoading()
          type||this.getCartsData()
        }, 100)
      },
      error: () => {
        hideLoading()
      }
    })
  },
  createAnimation() {
    const config = { duration: 400, timingFunction: 'ease' }
    const nowAnmiation = wx.createAnimation(config)
    const beforeAnmiation = wx.createAnimation(config)
    this.nowAnmiation = nowAnmiation
    this.beforeAnmiation = beforeAnmiation
    this.setData({ animtionObjShow: nowAnmiation, animtionObjHide: beforeAnmiation })
  },
  changeCarts (e) {
    const {type,no} = e.currentTarget.dataset
    let allGoods = this.data.goodsObj
    const goods = allGoods[no]
    const { dbBranchNo, branchNo } = this.userObj
    if (goods.specType !='2') {
      const config = {
        sourceType: '0',
        sourceNo: dbBranchNo,
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
      goPage('goodsChildren', { itemNo: no})
    }
  },
  getCartsData() {
    dispatch[types.GET_CHANGE_CARTS]({
      format: true,
      nowUpdate: true,
      success: (res) => {
        const goodsObj = this.data.goodsObj
        const cartsObj = setParentGoodsCartsObj(res)
        let obj = { cartsObj }
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
        isUpDate && (obj.goodsObj = goodsObj)
        this.setData(obj)
      }
    })
  },
  onLoad (opt) {
    console.log(opt)
    this.setData({ promotionNo: opt.promotionNo })
    console.log(getApp().data.partnerCode)
    this.createAnimation()
    this.userObj = wx.getStorageSync('userObj')
    this.productionDateFlag = wx.getStorageSync('configObj').productionDateFlag
    this.goodsUrl = getApp().data.goodsUrl
    this.getAllPromotion()
  },
  onReady () {
  },
  onShow () {
    const userObj = wx.getStorageSync('userObj')
    if (userObj) this.userObj = userObj
    const pageLoadingTime = this.pageLoadingTime
    if (pageLoadingTime) {
      const now = +new Date()
      const time = now - pageLoadingTime
      if (time > (1000*60*2)) {
        this.pageLoadingTime = now
        this.getAllPromotion(true)
      } else {
        this.getCartsData()
      }
    } else {
      this.pageLoadingTime = +new Date()
    }
  },
  onShareAppMessage: function () { },
  onReachBottom () {
    if (!this.isLoading && baseGoodsList.length) {
      this.setData({ isloadingGoods: true})
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
      this.loadingIndex++
      this.setData({ goodsList: newArr, isloadingGoods: false })
      setTimeout(() => {
        this.isLoading = false
      }, 400)
    }
  }
})