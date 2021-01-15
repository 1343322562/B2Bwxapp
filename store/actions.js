import API from '../api/index.js'
import * as types from './types.js'
import commit from './mutations.js'
import { deepCopy, getGoodsImgSize, toast, alert } from '../tool/index.js'
import { timCurrentDay, tim } from '../tool/date-format.js'

const app = getApp()
const actions = {
  [types.GET_OPEN_ID](param) {
    const openId = wx.getStorageSync('openId')
    if (openId) {
      commit[types.SAVE_OPEN_ID](openId)
      param && param(openId)
    } else {
      wx.login({
        success: function (res) {
          API.Public.getOpenId({
            data: {
              code: res.code,
              platform: '3'
            },
            success: (res) => {
              console.log('openid',res)
              let id = ''
              if (res.code == 0) {
                id = res.data
                commit[types.SAVE_OPEN_ID](id)
              }
              param && param(id)
            },
            error: (err)=>{
              console.log('err', err)
              param && param()
            }
          })
        },
        fail: () => {
          wx.showToast({title: '获取openId失败'})
          param && param()
        }
      })
    }
  },
  [types.GET_ALL_PROMOTION](param) {
    const { branchNo, token, username, platform, dbBranchNo: dbranchNo } = getApp().data['userObj'] || wx.getStorageSync('userObj')
    let obj = {
      // 买赠
      BG: { goods: {}, cls: {}, brand: {}, giftGoods: {} },
      // 捆绑商品
      BD: { goods: {}, cls: {} },
      // 首单特价
      FS: {},
      // 满减
      MJ: { goods: {}, cls: {}, brand: {} },
      // 单日限购
      SD: {},
      // 折扣
      ZK: { goods: {}, cls: {}, brand: {} },
      // 秒杀
      MS: {},
      // 买满赠
      BF: { all: [], goods: {}, cls: {}, brand: {} },
      // 首赠
      SZ: { giftName: [] ,giftInfo:[], stockType: [], filterArr: [] },
      // 数量满减
      MQ: {}
    }
    const beforeTime = wx.getStorageSync('promotionTime')
    const beforeObj = wx.getStorageSync('allPromotion')
    if (!beforeObj) wx.setStorageSync('allPromotion', obj)
    const newTime = +new Date()
    if (!beforeObj || !beforeTime || (newTime - beforeTime) >= (1000 * 60 * 1) || param.type == 'updata') { // (1000 * 60 * 5)
      API.Public.getAllPromotion({
        data: { branchNo, token, username, platform, dbranchNo },
        success: (res) => {
          if (res.code == 0) {
            console.log(res)
            const list = res.data
            // SZ 单据多于2时，做个按时间排序
            if ('SZ' in list && list.SZ.length > 1) {
              list.SZ.forEach(i => {
                let item = i
                let dateStr = item.createDate.slice(0 ,19)
                let newDate = Date.parse(new Date(dateStr))
                i.newDate = newDate
              })
              list.SZ.sort(function(a, b) {return a.newDate - b.newDate})
            }
           
            for (let i in list) {
              const item = list[i]
              if (i == 'BG') {
                for (let z in item) {
                  let t = z.split('|')
                  const k = t[0]
                  const l = t[1].split(',')
                  const type = (k == '1' ? 'cls' : (k == '2' ? 'brand' : (k == '3' ? 'goods' : '')))
                  l.forEach(no => {
                    item[z].forEach(goods => {
                      const id = goods.id
                      const goodsNo = goods.giftNo
                      obj.BG[type][no] || (obj.BG[type][no] = {})
                      obj.BG[type][no][id] = goodsNo
                      obj.BG.giftGoods[goodsNo] || (obj.BG.giftGoods[goodsNo] = {})
                      obj.BG.giftGoods[goodsNo][goods.id] = goods
                    })
                  })
                }
              } else if (i == 'SZ') {
                item.map((i, index)  => {
                  if('reachVal' in i) obj.SZ['giftInfo'].push(i.reachVal)  // SZ 信息
                  let giftQty = i.giftListQty.slice(0 ,i.giftListQty.indexOf('.'))
                  if('giftName' in i) obj.SZ['giftName'].push(i.giftName + '*' + giftQty + i.giftUnitNo)  // SZ 信息
                  obj.SZ['stockType'].push(item[index].stockType)          // SZ 配送信息（全部: 0 常温: 1 低温:2）
                  if (item.length) {          // SZ 过滤信息
                    if (item[index].filterValue) {
                      let tempArr = item[index].filterValue.split(',')
                      if (obj.SZ['filterArr'].length) {
                        obj.SZ['filterArr'].push(tempArr)
                        return
                      }
                      obj.SZ['filterArr'].push(tempArr)
                    } else {
                      obj.SZ['filterArr'].push('')
                    }
                    
                  }
                })
              } else if (i == 'MQ' && Object.keys(item).length) {
                for (let index in item ) {
                  let MQKeys = item[index][0].itemNo.split(',')
                  MQKeys.forEach((t, ind) => {
                    obj.MQ[t] = {}
                    obj.MQ[t].buyQty = item[index][0].buyQty
                    obj.MQ[t].subMoney = item[index][0].subMoney
                    obj.MQ[t].explain = item[index][0].explain
                  })
                  
                }
                let itemNo = obj[i][item[0]]
              } else if (i == 'SD' || i == 'FS'|| i == 'MS') {
                for (let z in item) {
                  const goods = item[z]
                  obj[i][goods.itemNo] = goods
                }
              } else if (i == 'BD') {
                const { baseImgUrl, zhGoodsUrl} = getApp().data
                const imgUrl = zhGoodsUrl || (baseImgUrl + '/upload/images/spBindItemMaster/')
                item.forEach(goods => {
                  obj.BD.cls[goods.itemClsno] || (obj.BD.cls[goods.itemClsno] = [])
                  obj.BD.cls[goods.itemClsno].push(goods.itemNo)
                  goods.goodsImgUrl = imgUrl + goods.itemNo + '/' + getGoodsImgSize(goods.picUrl)
                  goods.unit || (goods.unit = '')
                  obj.BD.goods[goods.itemNo] = goods
                })
              } else if (i == 'ZK') {
                item.forEach(goods => {
                  const t = goods.filterType
                  const type = t == '0' ? 'allDiscount' : (t == '1' ? 'cls' : (t == '2' ? 'brand' : (t == '3' ? 'goods' : 'data')))
                  const data = { sheetNo: goods.sheetNo, discount: goods.discount, zkType: type }
                  if (t == '0') {
                    obj.ZK[type] = data
                  } else {
                    const value = goods.filterValue.split(',')
                    value.forEach(zk => {
                      obj.ZK[type][zk] = data
                    })
                  }
                })
              } else if (i == 'MJ') {
                item.forEach(info => {
                  const t = info.filterType
                  const type = t == 0 ? 'fullReduction' : (t == '1' ? 'cls' : (t == '2' ? 'brand' : (t == '3' ? 'goods' : 'data')))
                  const data = { reachVal: info.reachVal, subMoney: info.subMoney, sheetNo: info.sheetNo, explain: info.explain}
                  if ( type =='fullReduction' ) {
                    obj.MJ[type] || (obj.MJ[type] = [])
                    obj.MJ[type].push(data)
                  } else {
                    const value = info.filterValue.split(',')
                    value.forEach(v2 => {
                      obj.MJ[type][v2] || (obj.MJ[type][v2] = [])
                      obj.MJ[type][v2].push(data)
                    })
                  }
                })
              } else if (i == 'BF') {
                item.forEach(goods => {
                  const t = goods.filterType
                  const type = t == '0' ? 'all' : (t == '1' ? 'cls' : (t == '2' ? 'brand' : (t == '3' ? 'goods' : 'data')))
                  const itemNos = goods.giftListNo.split('/')
                  const num = goods.giftListQty.split('/')
                  const name = (goods.giftName || goods.explain).split('/')
                  const unit = (goods.giftUnitNo||'个').split('/')
                  const itemType = goods.giftType.split('/')
                  let data = { sheetNo: goods.sheetNo, explain: goods.explain, data: [], reachVal: goods.reachVal}
                  itemNos.forEach((itemNo,i) => {
                    data.data.push({ itemNo, num: num[i], itemName: name[i], unit: unit[i], itemType: itemType[i]})
                  })
                  if (t == '0') {
                    obj.BF[type].push(data)
                  } else {
                    goods.filterValue.split(',').forEach(info => {
                      obj.BF[type][info] || (obj.BF[type][info] = [])
                      obj.BF[type][info].push(data)
                    })
                  }
                })
                // console.log(obj, 'BF')
              }
            }
            wx.setStorage({ key: 'promotionTime', data: +new Date() })
            wx.setStorage({ key: 'allPromotion', data: obj })
            param.success && param.success(obj)
          } else if(res.code == 2) {
            param.error && param.error(true)
          }else{
            param.error && param.error()
          }
        },
        error: param.error
      })
    } else {
      param.success && param.success(beforeObj)
    }
  },
  // （直配）今日促销商品，达到最大值停止添加商品
  maxLimitAdd(goods, type, cartsObjs) {  // goods：当前 ADD 的商品对象; type：当前增添的 type; 若有 cartsObj ，则是在采页面增加\
    console.log(goods, type, cartsObjs)
    if (cartsObjs == 0) { // 0: 在结算页添加商品 ； 1：在商品采购页添加商品
      let currentRealQty = goods.realQty || wx.getStorageSync('cartsObj')[goods.itemNo].realQty  // 当前商品真实数量
      let currentLimitedQty = goods.todayPromotion.limitedQty  // 当前商品今日促销的限购数量
      if (currentRealQty >= currentLimitedQty) {
        toast('已达限时促销最大限购数')
        return 1 // 达到限购值
      }
      return 0 // 没达到限购值
    } else {
      let currentRealQty = !!cartsObjs[goods.itemNo] && cartsObjs[goods.itemNo].realQty
      let currentLimitedQty = goods.todayPromotion.limitedQty
      if (!!cartsObjs[goods.itemNo] && currentRealQty >= currentLimitedQty) {
        toast('已达限时促销最大限购数')
        return 1 // 达到限购值
      }
      return 0 // 没达到限购值
    }
  },
  // 增加(改变)当前促销至购物车中
  [types.CHANGE_CPROMOTION_CARTS](param) { // goods
    let { itemNo, currentPromotionNo, promotionCollections } = param.goods
    let cartsObj = commit[types.GET_CARTS]()
    if (currentPromotionNo === cartsObj[itemNo].currentPromotionNo) return
    'currentPromotionNo' in cartsObj[itemNo] && (cartsObj[itemNo].currentPromotionNo = currentPromotionNo)
    wx.setStorage({ key: 'cartsObj', data: data }) // 缓存 cartsObj
  },

  [types.CHANGE_CARTS](param, cartsObjs = 0) { // add delete minus； cartsObj 为促销信息，主要用来实现直配的限时促销，达到限购值，停止加购
    console.log(deepCopy(param), cartsObjs)
    console.log(param)
  // 直配中商品数量若满足限时促销中的 限购值，则停止加购
    // if (
    //   param.config.sourceType == "1"     // 直配
    //   && ('RSD' in param.goods || 'todayPromotion' in param.goods)  // todayPromotion：限时促销(采购页);  'RSD'：采购页面
    //   && param.type == "add"             // 增加商品
    //   && this.maxLimitAdd(param.goods, param.type, cartsObjs) == 1 // 1：达到最大限购值,停止执行
    // ){
    //   return 
    // }
    if (param.goods.fillState == 1) return toast('商品补货中')
    if(app.data.partnerCode == 1050 && 'msMaxQty' in param.goods && param.type != 'minus' && param.goods.realQty >= param.goods.msMaxQty) {
      return toast('此商品已达秒杀最大限购数量!')
    }
    let cartsObj = commit[types.GET_CARTS]()
    // console.log(cartsObj.keyArr.length , param.type , !(param.goods['itemNo'] in cartsObj))
    if (cartsObj.keyArr.length>=300 && param.type != 'delete' && !(param.goods['itemNo'] in cartsObj)){
      toast('购物车已达到最大商品数量!')
      console.log(9987, param.type, param.goods, deepCopy(cartsObj))
      return
    }
    const { sourceType, branchNo, sourceNo } = param.config
    let {
      itemNo,
      deliveryType,
      minSupplyQty = 1,
      stockQty,
      supplySpec = 1,
      maxSupplyQty = 9999,
      price,
      orgiPrice = 0,
      specType = '0',
      isBind = '0',
      parentItemNo,
      currentPromotionNo,
      promotionCollections
    } = param.goods
    parentItemNo || (parentItemNo = '')
    // currentPromotionNo || (currentPromotionNo = promotionCollections && promotionCollections.length > 0 && promotionCollections.slice(0, 18))
    stockQty || (stockQty=0)
    maxSupplyQty || (maxSupplyQty = 9999)
    minSupplyQty || (minSupplyQty = 1)
    supplySpec || (supplySpec = 1)
    orgiPrice || (orgiPrice = 0)
    specType || (specType = '0')
    isBind || (isBind = '0')
    // console.log(deepCopy(param))
    const nowNum = (cartsObj[itemNo] ? cartsObj[itemNo].realQty : 0)
    if ((param.type !== 'add' && nowNum <= 1 && param.type != 'input') || param.type === 'delete' || (param.type == 'input' && !param.value)) {
      // if (!cartsObj[itemNo]) return
      
      // cartsObj[itemNo].realQty = 0
      // cartsObj.num -= nowNum
      if (!cartsObj[itemNo] || !nowNum) return

      if (param.type == 'delete') {
        cartsObj[itemNo].realQty = 0
        cartsObj.num -= nowNum
      } else {
        cartsObj[itemNo].realQty = cartsObj[itemNo].realQty - (minSupplyQty || 1)
        String(cartsObj[itemNo].realQty).includes('.') && (cartsObj[itemNo].realQty = cartsObj[itemNo].realQty.toFixed(1))
        cartsObj.num -= (minSupplyQty || 1)
        String(cartsObj.num).includes('.') && (cartsObj.num = cartsObj.num.toFixed(1))
      }
    } else {
      let item = {
        itemNo: itemNo,
        realQty: nowNum,
        origPrice: orgiPrice,
        validPrice: price,
        specType: isBind=='1'?'2':specType,
        branchNo: branchNo,
        sourceType: sourceType,
        sourceNo: sourceNo,
        parentItemNo: parentItemNo,
        currentPromotionNo: (`${itemNo}` in cartsObj && cartsObj[itemNo].currentPromotionNo) || currentPromotionNo || ''
      }
      const partnerCode = getApp().data.partnerCode
      if (partnerCode == 1027 || partnerCode == 1057 ) {
        item.createDate = Number(new Date().getTime())
      }
      if (param.type == 'input') {
        let num2 = param.value - minSupplyQty;
        item.realQty = num2 <= 0 ? minSupplyQty : (minSupplyQty + (num2 <= supplySpec ? supplySpec : supplySpec * parseInt(num2 / supplySpec)))
        cartsObj.num = cartsObj.num - nowNum + item.realQty
      } else {
        const count = (param.type == 'add' ? (nowNum ? supplySpec : minSupplyQty) : -(nowNum - supplySpec >= minSupplyQty ? supplySpec : minSupplyQty))
        item.realQty = Number(item.realQty) + count; if(String(item.realQty).includes('.')) item.realQty = Number(Number(item.realQty).toFixed(1))
        cartsObj.num += Number(count); if(String(cartsObj.num).includes('.')) cartsObj.num = Number(Number(cartsObj.num).toFixed(1))
       
      }
      if (param.type != 'minus' && (item.realQty > maxSupplyQty || (item.realQty > (deliveryType == '3' ? 9999 : stockQty)))) {
        toast(item.realQty > maxSupplyQty ? '已达到最大购买数量' :'库存不足')
        return cartsObj
      }
      cartsObj[itemNo] || cartsObj.keyArr.push(itemNo)
      cartsObj[itemNo] = item
    }
    console.log(cartsObj)
    // if (param.type != 'delete' && cartsObj[itemNo].realQty === 0) {
    //   delete cartsObj[itemNo]
    //   cartsObj.keyArr.forEach((itemKey, i) => {
    //     if (itemKey === itemNo) cartsObj.keyArr.splice(i, 1)
    //   })
    // }
    commit[types.SAVE_CARTS](cartsObj) // 缓存 cartsObj
    wx.setStorageSync('updateCarts', true)
    return cartsObj
  },
  [types.GET_CHANGE_CARTS](param) {
    const updateCarts = wx.getStorageSync('updateCarts')
    const { branchNo, token, username, platform } = getApp().data['userObj'] || wx.getStorageSync('userObj')
    const cartsObj = commit[types.GET_CARTS]()
    if (param.nowUpdate && updateCarts && cartsObj.num) return param.success(cartsObj)
    const oldCartsObj = deepCopy(cartsObj)
    let items = []
    cartsObj.keyArr.forEach(itemNo => {
      delete cartsObj[itemNo].cancelSelected
      items.push(cartsObj[itemNo])
    })
    const beforeTime = wx.getStorageSync('updateCartsTime')
    const newTime = +new Date()
    items = JSON.stringify(updateCarts?items:[])
    if (!param.format||updateCarts || !beforeTime || (newTime - beforeTime) >= (1000 * 60 * 5)) {
      API.Carts.getShoppingCartInfo({
        data: { items, platform, token, username, branchNo },
        success: (res) => {
          console.log('购物车信息:', res)
          console.log(getCurrentPages())
          if (!('data' in res)) res['data'] = [] 
          console.log('购物车信息:', JSON.parse(JSON.stringify(res)))
          let newCartsObj = { num: 0, keyArr:[]}
          if (res.code == 0 && res.data) {
            const pages = getCurrentPages()
            let currentPage = pages[pages.length - 1]; //获取当前页面的对象
            const { route } = currentPage // 当前页面对路由
            if (res.msg && route === "pages/carts/carts") {
              alert(res.msg, { title: '提示' })
            }
            res.data.forEach(config => {
              // 按加购时间排序
              const partnerCode = getApp().data.partnerCode
              if (partnerCode == 1027 || partnerCode == 1057) {
                config.datas.sort((a, b) => {
                  let aDate = Number(a.createDate)
                  let bDate = Number(b.createDate)
                  console.log(aDate - bDate, aDate , bDate)
                  return aDate - bDate
                })
              }
              config.datas.forEach(goods => {
                const itemNo = goods.itemNo,
                      currentPromotionNo = (`${itemNo}` in cartsObj && cartsObj[itemNo].currentPromotionNo) 
                                          || goods.currentPromotionNo 
                                          || ('promotionCollections' in goods && !goods['promotionCollections'].includes(',') && goods.promotionCollections.slice(0, 18))
                                          || ''
                newCartsObj.keyArr.push(itemNo)
                newCartsObj[itemNo] = {
                  itemNo: itemNo,
                  realQty: goods.realQty,
                  origPrice: goods.orgiPrice,
                  validPrice: goods.price,
                  specType: goods.specType,
                  branchNo: config.branchNo,
                  sourceType: config.sourceType,
                  sourceNo: config.sourceNo,
                  parentItemNo: goods.parentItemNo,
                  currentPromotionNo,
                  cancelSelected: (itemNo in oldCartsObj && oldCartsObj[itemNo].cancelSelected) ?  true : false
                }
                newCartsObj.num += goods.realQty
              })
            })
            console.log(oldCartsObj)
            console.log(newCartsObj)
            commit[types.SAVE_CARTS](newCartsObj)
            wx.setStorage({ key: 'updateCarts', data: false })
            wx.setStorage({ key: 'updateCartsTime', data: +new Date() })
          } else {
            // 秒杀商品,会出现问题.原因是第二次添加商品时,没有缓存添加商品的购物车信息,在下面添加了.
            commit[types.SAVE_CARTS](newCartsObj)
            newCartsObj = cartsObj
            if (res.code == 0) wx.setStorage({ key: 'updateCarts', data: true })
          }
          param.success(param.format ? newCartsObj : res )
        },
        error: () => {
          param.success(param.format ? cartsObj : { msg: '获取购物车失败!请检查网络是否正常' })
        }
      })
    } else {
      param.success(cartsObj)
    }
  },
}
export default actions
