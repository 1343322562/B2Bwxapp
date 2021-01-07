import * as types from '../../store/types.js'
import API from '../../api/index.js'
import dispatch from '../../store/actions.js'
import { addedPromotionHandle,showLoading, hideLoading, goPage, toast, alert, getGoodsImgSize, getGoodsDataSize, getGoodsTag, deepCopy, setParentGoodsCartsObj, MsAndDrCount} from '../../tool/index.js'
const maxNum = 15
let baseGoodsList
Page({
  data: {
    isSup: false,
    items: {},
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
    rmj: false, // 直配是否满减
    rbf: false, // 直配是否开启满增
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
    let { items } = this.data
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
        if (!res.data){
          hideLoading()
          toast('暂无数据')
          return 
        }
        this.loadingIndex = loadingIndex
        let goodsList = []
        let fineGoodsList = []
        const promotionGoodsList =[]
        const promotionFineGoodsList = []
        let goodsObj = {}
        let cartsObj = wx.getStorageSync('cartsObj')
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

          console.log(promotionObj, this.data)
          list.forEach(goods => {
            const itemNo = goods.itemNo
            if (cartsObj[itemNo] && cartsObj[itemNo].currentPromotionNo === promotionNo) {
              items.qty = items.qty ? items.qty + cartsObj[itemNo].realQty : cartsObj[itemNo].realQty
              items.price = this.countPromotionPrice(items, cartsObj[itemNo])
            }
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
            if (cartsObj[itemNo] && cartsObj[itemNo].currentPromotionNo && cartsObj[itemNo].currentPromotionNo !== this.data.promotionNo) {
              const cPromotionNo = cartsObj[itemNo].currentPromotionNo // 当前购物车商品所选促销
              goodsObj[itemNo].addedText = addedPromotionHandle(cPromotionNo)
            }
          })
        }
        let newArr = (promotionGoodsList.concat(goodsList)).concat(promotionFineGoodsList.concat(fineGoodsList))
        if (screenSelect!='0') {
          newArr.sort((a, b) => (screenSelect == '1' ? (goodsObj[a].price - goodsObj[b].price) : (goodsObj[b].price - goodsObj[a].price)))
        }
        const totalLength = newArr.length
        
        
        this.setData({
          items,
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
          console.log('type', type)
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
    let { items, promotionNo } = this.data
    let allGoods = this.data.goodsObj
    const goods = allGoods[no]
    const { dbBranchNo, branchNo } = this.userObj
    // switch(type) {
    //   case 'add':
    //     if ()
    //     break;
    //   case 'minus':
    //     break;
    // }
    if (goods.specType !='2') {
      const config = {
        sourceType: '0',
        sourceNo: dbBranchNo,
        branchNo: branchNo
      }
      !goods.currentPromotionNo && (goods.currentPromotionNo = promotionNo)
      let cartsObj = wx.getStorageSync('cartsObj')
      const oldGoodQty = cartsObj[no] ? cartsObj[no].realQty : 0
      cartsObj = dispatch[types.CHANGE_CARTS]({ goods, type, config })
      if (cartsObj[no].currentPromotionNo === promotionNo) {
        const newGood = cartsObj[no]
        const qty = Number(newGood.realQty) - Number(oldGoodQty)
        console.log(deepCopy(items), qty) 
        items.qty = items.qty + qty
        const pNo = items['promotionNo']
        if (pNo.includes('MJ') || pNo.includes('BF') || pNo.includes('BG') || pNo.includes('MQ')) {
          items.price = items.price + qty * newGood.origPrice        
        } else {
          items.price = items.price + qty * newGood.validPrice
        }
        console.log('oldGood', oldGoodQty)
        console.log('newGood', newGood)
      }
      if (cartsObj) {
        let obj = { cartsObj: setParentGoodsCartsObj(cartsObj), items }
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
            let newGoods = MsAndDrCount(goodsObj[item], cartsObj[item], '')
            // 已选促销商品判断
            console.log(314, newGoods)
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
  getSupPromotionGoods(supcustNo) {
    const { branchNo, token, platform, username } = this.userObj
    const { zcGoodsUrl, baseImgUrl } = getApp().data
    let { items } = this.data
    API.Goods.supplierItemSearch({
      data: { condition: '', modifyDate:'', supcustNo, pageIndex: 1, pageSize: 1000, itemClsNo: '', token, platform, username},
      success: res => {
        if(res.code == 0 && res.data) {
          console.log(res)
          const list = res.data.itemData || []
          let goodsList = []
          let fineGoodsList = []
          let goodsObj = {}
          list.forEach(goods => {
            goods.orgiPrice = goods.price 
            goods.stockQty = 9999
            const itemNo = goods.itemNo
            goods.goodsImgUrl = zcGoodsUrl || baseImgUrl + '/upload/images/bdSupplierItem/  '  + goods.itemNo + '/' + getGoodsImgSize(goods.picUrl)
            goods.stockQty > 0 ? goodsList.push(itemNo) : fineGoodsList.push(itemNo)
            goods.isStock = goods.stockQty > 0 ? true : false
            goodsObj[itemNo] = goods
            
          })
          let newArr = goodsList.concat(fineGoodsList)
          const totalLength = newArr.length
          console.log(newArr, goodsList)
          this.getSupplierPromotionInfo(branchNo, token, platform, username, goodsObj, totalLength, goodsList, supcustNo) // 获取并处理今日限购的促销信息(直配)

          // setTimeout(()=>{
          //   this.setData({
          //     goodsList: newArr.splice(0, maxNum),
          //   })
          //   baseGoodsList = newArr
          // },150)
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
        // hideLoading()
        this.setData({ pageLoading: true })
      }
    })
  },
  // 获取 今日限购的促销信息(直配)
  getSupplierPromotionInfo(branchNo, token, platform, username, goodsObj, totalLength, goodsList, supcustNo) {
    console.log((this.data))
    const _this = this
    const { promotionNo } = this.data
    const cartsObj = wx.getStorageSync('cartsObj')
    // 获取促销信息
    API.Public.getSupplierAllPromotion({
      data: { branchNo, token, platform, username, supplierNo: supcustNo },
      success: res => {
        console.log('促销信息' ,res)
        let data= res.data
        if (res.code == 0 && res.data) {
          let promKey // 获取 以 RSD 开头的下标 (促销信息)
          for (let key in data) {
            if (key.includes('RMJ') && data[key].length != 0) {
              console.log(data[key][0])
              let filterArr
              if (data[key][0].filterType == '0') {
                filterArr = goodsList
              } else {
                filterArr = data[key][0].filterValue.split(',')
              }
              const rmjObj  = {}
              filterArr.forEach((itemNo) => {
                const goodPromotions = goodsObj[itemNo]['promotionNos'] 
                rmjObj[itemNo] = 1
                if (!(goodPromotions && goodPromotions.includes(promotionNo))) {
                  console.log(8888, goodsObj[itemNo],  data[key][0].sheetNo)
                  goodsObj[itemNo]['promotionNos']  = goodPromotions && goodPromotions.includes(',') ? goodPromotions + ',' + data[key][0].sheetNo : data[key][0].sheetNo
                } 
              })
              console.log(rmjObj, filterArr)
              this.setData({ rmj: rmjObj })
            } 
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
                  console.log(cartsObj, key)
                  todayPromotion[key].endDate = todayPromotion[key].endDate.slice(0, 10)      // 截取年月日
                  todayPromotion[key].startDate = todayPromotion[key].startDate.slice(0, 10)  // 截取年月日
                  goodsObj[key].todayPromotion = todayPromotion[key]
                  goodsObj[key].drPrice = todayPromotion[key].price
                  goodsObj[key].drMaxQty = todayPromotion[key].limitedQty
                  if (!(key in cartsObj) || cartsObj[key].realQty < goodsObj[key].drMaxQty) {
                    goodsObj[key].price = todayPromotion[key].price
                  }
                }
              }
            })
            
            console.log(404, goodsObj)
            for (const key in goodsObj) {
              console.log(goodsObj[key].promotionNos, promotionNo)
              if (!goodsObj[key].promotionNos.includes(promotionNo)) {
                delete goodsObj[key];
                continue
              }
              if (key in cartsObj) {
                console.log(8889,cartsObj[key].realQty, goodsObj[key])
                goodsObj[key].realQty = cartsObj[key].realQty
              }
            }
            goodsList = Object.keys(goodsObj)
            this.data.goodsObj = goodsObj
            console.log(_this.data)
            this.setData({
              cartsObj: cartsObj,
              goodsList: goodsList,
              goodsObj: goodsObj,
              totalLength: goodsList.length
            })
          })
        }
      }
    })
  },
  countPromotionPrice(items, good) {
    const pNo = items['promotionNo']
    if (pNo.includes('MJ') || pNo.includes('BF') || pNo.includes('BG') || pNo.includes('MQ')) {
      items.price = items.price + good.realQty * good.origPrice        
    } else {
      items.price = items.price + good.realQty * good.validPrice
    }
    return items.price
  },
  onLoad (opt) {
    console.log(opt)
    const { promotionNo, sourceNo } = opt
    let items = JSON.parse(opt.items)
    const isSup = promotionNo.includes('RMJ') || promotionNo.includes('RBF')
    if (isSup) this.data.isSup = true
    items['qty'] = 0
    items['price'] = 0
    this.setData({ promotionNo, items })
    this.data.promotionNo = promotionNo
    console.log(getApp().data.partnerCode)
    this.createAnimation()
    this.userObj = wx.getStorageSync('userObj')
    this.productionDateFlag = wx.getStorageSync('configObj').productionDateFlag
    this.goodsUrl = getApp().data.goodsUrl
    if (isSup) {
      this.getSupPromotionGoods(sourceNo)
    } else {
      this.getAllPromotion()
    }
    // this.getAllPromotion()
    
  },
  onReady () {
  },
  onShow () {
    // const userObj = wx.getStorageSync('userObj')
    // if (userObj) this.userObj = userObj
    // const pageLoadingTime = this.pageLoadingTime
    // if (pageLoadingTime) {
    //   const now = +new Date()
    //   const time = now - pageLoadingTime
    //   if (time > (1000*60*2)) {
    //     this.pageLoadingTime = now
    //     this.getAllPromotion(true)
    //   } else {
    //     this.getCartsData()
    //   }
    // } else {
    //   this.pageLoadingTime = +new Date()
    // }
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