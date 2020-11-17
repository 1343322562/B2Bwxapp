import * as types from '../../store/types.js'
import API from '../../api/index.js'
import dispatch from '../../store/actions.js'
import { showLoading, hideLoading, goPage, toast, alert, getGoodsImgSize, getGoodsDataSize, getGoodsTag, deepCopy, setParentGoodsCartsObj, MsAndDrCount} from '../../tool/index.js'
const maxNum = 15
let baseGoodsList
const app = getApp()
Page({
  data: {
    pageLoading: false,
    nowSelectOneCls: '', // 选中一级分类
    nowSelectTwoCls: '', // 选中二级分类
    currentClsType: 1, // 当前分类供应商类别  1: 入驻商 2: 总仓
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
    bounding: app.data.bounding,
    rmj: false,
    rbf: false
  },
  
  toTopClick(e) {
    console.log(e)
    wx.pageScrollTo({
      scrollTop: 0
    })
  },
  onPullDownRefresh () {
    const { nowSelectOneCls, nowSelectTwoCls, classifyObj: clsObj, classifyList: clsList } = this.data
    console.log(nowSelectOneCls, nowSelectTwoCls, clsObj, clsList)
    if (nowSelectOneCls.includes('s') || (!nowSelectOneCls && clsList[0].includes('s'))) { // 直配
      let { supplierNo } = (nowSelectOneCls in clsObj && clsObj[nowSelectOneCls].children[0]) || clsObj[clsList[0]].children[0]
      this.getSupGoodList(supplierNo, nowSelectTwoCls)
      return
    }
    this.getGoodsList()
    console.log(nowSelectOneCls, nowSelectTwoCls)
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
    const { screenSelect, nowSelectOneCls, nowSelectTwoCls } = this.data
    this.setData({ screenSelect: types == '1' ? (screenSelect=='1'?'2':'1'): types })

    if (nowSelectOneCls.includes('s')) {
      const { classifyObj } = this.data
      let { supplierNo } = classifyObj[nowSelectOneCls].children[0]
      this.getSupGoodList(supplierNo, nowSelectTwoCls)
    } else {
      this.getGoodsList()
    }
  },
  getAllPromotion(type) {
    console.log(deepCopy(this), deepCopy(this.data))
    dispatch[types.GET_ALL_PROMOTION]({
      success: (res) => {
        console.log(res, 'getAllPromotion\'')
        this.promotionObj = res
        type ? this.getGoodsList(type) : this.getItemCls()
      }
    })
  },
  getItemCls () {
    const { classifyList, classifyObj} = wx.getStorageSync('AllCls')
    this.setData({ classifyList, classifyObj, pageLoading: true})
    console.log(classifyList[0], classifyList)
    console.log(88,classifyObj)
    if (app.data.supplierNo) {       // 首页跳转至入驻商类别
      return this.tapOneCls(app.data.supplierNo ,'no')
      app.data.supplierNo = ''
    } else if (classifyList[0].includes('s')) {   // 供应商类别展开
      return this.tapOneCls(classifyList[0],'no')
    } 
    this.tapOneCls(classifyList[0],'one')
  },
  goSearchPage () {
    goPage('searchGoods',{openType: 'tongpei'})
  },
  tapOneCls (e,type) {
    console.log(86,e,type, this.data)
    if (e) {
      let no = typeof e == 'object' ? e.currentTarget.dataset.no : e
      console.log('这是 no', no)
      const currentClsType = no.includes('s') ? 1 : 2
      const beforeNo = this.data.nowSelectOneCls
      const twoCls = (no in this.data.classifyObj && this.data.classifyObj[no].children) || []
      no == beforeNo && (no = null)
      if (beforeNo != null) this.setData({ beforeOneCls: beforeNo })
      setTimeout(()=>{
        if (type != 'one') {
          const h = ((twoCls.length + 1) * 100) + 'rpx'
          this.nowAnmiation.height(h).step()
          this.beforeAnmiation.height('100rpx').step()
          this.setData({
            animtionObjShow: this.nowAnmiation.export(),
            animtionObjHide: this.beforeAnmiation.export(),
            currentClsType,
            nowSelectOneCls: no
          })
        }
        if (no == null || (this.data.beforeOneCls == no && typeof e == 'object')) return
        twoCls.length && this.tapTwoCls(twoCls[0].clsNo)
      },20)
    }
  },
  tapTwoCls (e) {
    const no = typeof e == 'object' ? e.currentTarget.dataset.no : e
    console.log(110, no, this.data.nowSelectTwoCls, this.data.nowSelectOneCls, typeof e)
    if (this.data.nowSelectTwoCls == no && typeof e == 'object') return
    this.setData({ nowSelectTwoCls: no, itemBrandnos:{}})
    const nowSelectOneCls = this.data.nowSelectOneCls || this.data.classifyList[0]
    // 直配
    if (nowSelectOneCls.includes('s')) {
      const { classifyObj } = this.data
      console.log(classifyObj[nowSelectOneCls], no)
      let { supplierNo } = classifyObj[nowSelectOneCls].children[0]
      this.getSupGoodList(supplierNo, no)
      return
    }
    this.getGoodsList()
  },
  goGoodsDetails (e) {
    console.log(e , this.data.goodsObj)
    const itemNo = e.currentTarget.dataset.no
    const supcustNo = e.currentTarget.dataset.supno
    if (supcustNo) {
      goPage('goodsDetails', { itemNo, supcustNo })   // 直配
    } else {
      goPage('goodsDetails', { itemNo })    // 统配
    }
    
  },
  // 获取 今日限购的促销信息(直配)
  getSupplierPromotionInfo(branchNo, token, platform, username, goodsObj, totalLength, supcustNo) {
    // 获取促销信息
    API.Public.getSupplierAllPromotion({
      data: { branchNo, token, platform, username, supplierNo: supcustNo },
      success: res => {
        console.log('促销信息' ,res)
        let data = res.data
        if (res.code == 0 && res.data) {
          let promKey // 获取 以 RSD 开头的下标 (促销信息)
          for (let key in data) {
            if (key.includes('RMJ') && data[key].length != 0) { this.setData({ rmj: true }) }  
            if (key.includes('RBF') && data[key].length != 0) { this.setData({ rbf: true }) }    
            if (key.includes('RSD')) { promKey = key }
          }
          wx.setStorageSync('supplierPromotion', data[promKey]) // 储存 限购信息，在购物车中拿到
          // 将促销字段，推入对应的商品对象，页面通过 促销子段 (存在与否) 来渲染促销信息
          new Promise((resolve, reject) => {
            let todayPromotion = data[promKey]
            resolve(todayPromotion)
          }).then(todayPromotion => {        // 将当日促销信息推入 goodsObj
            let todayPromotionKeyArr = Object.keys(todayPromotion)
            todayPromotionKeyArr.map(item => {
              for (let key in goodsObj) {
                if (goodsObj[key].itemNo == item) {
                  todayPromotion[key].endDate = todayPromotion[key].endDate.slice(0, 10)      // 截取年月日
                  todayPromotion[key].startDate = todayPromotion[key].startDate.slice(0, 10)  // 截取年月日
                  goodsObj[key].todayPromotion = todayPromotion[key]
                }
              }
            })
            // goodsObj 中有促销字段 todayPromotion
            this.setData({
              goodsObj: goodsObj,
              totalLength: totalLength
            })
          })
        } else {
          // goodsObj 中没有促销字段 todayPromotion
          this.setData({
            goodsObj: goodsObj,
            totalLength: totalLength
          })
        }
      }
    })
  },
  // 获取直配商品
  getSupGoodList(supcustNo, itemClsNo) {
    showLoading('加载中...')
    const { branchNo, token, platform, username } = wx.getStorageSync('userObj')
    const screenSelect = this.data.screenSelect
    API.Goods.supplierItemSearch({
      data: { condition: '', modifyDate:'', supcustNo, pageIndex: 1, pageSize: 1000, itemClsNo, token, platform, username},
      success: res => {
        if(res.code == 0 && res.data) {
          console.log(res)
          const list = res.data.itemData || []
          let goodsList = []
          let fineGoodsList = []
          let goodsObj = {}
          const promotionObj = this.promotionObj
          list.forEach(goods => {
            goods.stockQty = 9999
            const itemNo = goods.itemNo
            goods.goodsImgUrl = this.zcGoodsUrl + goods.itemNo + '/' + getGoodsImgSize(goods.picUrl)
            goods.stockQty > 0 ? goodsList.push(itemNo) : fineGoodsList.push(itemNo)
            goods.isStock = goods.stockQty > 0 ? true : false
            goodsObj[itemNo] = goods
            
          })
          let newArr = goodsList.concat(fineGoodsList)
          const totalLength = newArr.length
          console.log(newArr)
          this.getSupplierPromotionInfo(branchNo, token, platform, username, goodsObj, totalLength, supcustNo) // 获取并处理今日限购的促销信息(直配)
          if (screenSelect!='0') {
            newArr.sort((a, b) => (screenSelect == '1' ? (goodsObj[a].price - goodsObj[b].price) : (goodsObj[b].price - goodsObj[a].price)))
          }
          setTimeout(()=>{
            this.setData({
              goodsList: newArr.splice(0, maxNum),
            })
            baseGoodsList = newArr
          },150)
          wx.pageScrollTo({ scrollTop: 0, duration: 0 })
        } else {
          this.setData({
            goodsList: [],
            goodsObj: {},
            totalLength: ''
          })
        }
      },
      error: () => {
        alert('获取商品失败，请检查网络是否正常')
      },
      complete: ()=> {
        hideLoading()
        this.setData({ pageLoading: true })
      }
    })
  },
  getGoodsList (type) {
    const { branchNo, token, username, platform} = this.userObj
    const clsNo = this.data.nowSelectTwoCls
    const screenSelect = this.data.screenSelect
    const loadingIndex = type ? this.loadingIndex : 1
    showLoading('请稍后...')
    const itemBrandnos = Object.keys(this.data.itemBrandnos).join(',')
    API.Goods.itemSearch({
      data: {
        branchNo: branchNo,
        token: token,
        username: username,
        platform:platform,
        condition: '',
        modifyDate: '',
        supcustNo: '',
        pageIndex: 1,
        pageSize: 1000,
        itemClsNo: clsNo,
        itemBrandnos
      },
      success: (res) => {
        console.log(res)
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
            goods.isStock = ((goods.stockQty > 0 || goods.deliveryType == '3') && goods.fillState != 1) ? true : false
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
            goods.isStock = (goods.stockQty > 0 || goods.deliveryType == '3' || goods.specType == '2' && goods.fillState != 1) ? true : false
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
    const config = { duration: 500, timingFunction: 'ease' }
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
      let config = {
        sourceType: '0',
        sourceNo: dbBranchNo,
        branchNo: branchNo
      }
      if (goods.supcustNo) {
        // 入驻商商品
        config = {
          sourceType: '1',
          branchNo,
          sourceNo: goods.supcustNo
        }
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
  getNavHeight () {
   console.log(this.data.bounding)
    setTimeout(() => console.log(this.data.bounding), 10000)
  },
  onLoad (opt) {
    this.zcGoodsUrl = getApp().data.zcGoodsUrl
    this.getNavHeight() // 获取导航栏高度并设置 top 距离
    console.log(getApp().data.partnerCode)
    this.createAnimation()
    this.userObj = wx.getStorageSync('userObj')
    this.productionDateFlag = wx.getStorageSync('configObj').productionDateFlag
    this.goodsUrl = getApp().data.goodsUrl
    this.getAllPromotion()
    console.log(this)
    let cartsObj = this.getCartsObj()
    this.setData({ cartsObj })
  },
  // 获取 cartsObj 会有获取不到的情况,如果没有值就递归获取
  getCartsObj() {
    console.log(1)
    let cartsObj = wx.getStorageSync('cartsObj')
    if (!cartsObj) setTimeout(() => { this.getCartsObj() },200) 
    return cartsObj
  },
  onReady () {
  },
  onShow () {
    const userObj = wx.getStorageSync('userObj')
    if (userObj) this.userObj = userObj
    const pageLoadingTime = this.pageLoadingTime
    console.log(deepCopy(this))
    console.log(deepCopy(this.data.nowSelectOneCls))
    if (this.data.nowSelectOneCls && app.data.supplierNo) {
      this.tapOneCls(app.data.supplierNo ,'no')
      app.data.supplierNo = ''
    } 
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