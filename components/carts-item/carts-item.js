import { HANDLE_SUP_PROMOTION, toast, alert, filterArr, deepCopy, promoArrSort ,setFilterDataSize, goPage, showLoading, hideLoading, getGoodsImgSize, MsAndDrCount, getGoodsTag } from '../../tool/index.js'
import dispatch from '../../store/actions.js'
import * as types from '../../store/types.js'
import API from '../../api/index.js'
import commit from '../../store/mutations.js'
import { tim } from '../../tool/date-format.js'
let app = getApp()
Component({
  properties: {
    type: String,
    goods: Object,
    isReplenish: String,
  },
  data: {
    leftAnimation: false,
    isSelectAll: false,
    cartsMoney: 0,
    selectNum: 0,
    selectTypeNum: 0,
    partnerCode: app.data.partnerCode,
    currentPromotion: ["NO"], // 当前所选择的促销(直配)
    allPromotion: {}, // 所有促销
    transDateObj: {
      isShow: false,
      date: '',
    }
  },
  methods: {
    // 时间处理处理
    timer(nowDate, orderStartDate, orderEndDate) {
      let nowH = nowDate.slice(0, nowDate.indexOf(':')),                        // 当前 时
      nowM = nowDate.slice(nowDate.indexOf(':')+1, nowDate.indexOf(':')+3),     // 当前 分
      startH = orderStartDate.slice(0, orderStartDate.indexOf(':')),                               // 开始 时
      startM = orderStartDate.slice(orderStartDate.indexOf(':')+1, orderStartDate.indexOf(':')+3), // 开始 秒
      endH = orderEndDate.slice(0, orderEndDate.indexOf(':')),                               // 结束 时
      endM = orderEndDate.slice(orderEndDate.indexOf(':')+1, orderStartDate.indexOf(':')+3)  // 结束 秒

      nowH = Number(nowH); nowM = Number(nowM); startH = Number(startH);
      startM = Number(startM); endH = Number(endH); endM = Number(endM);

      return { nowH, nowM, startH, startM, endH, endM }
    },
    // 换促销子组件绑定事件
    onParentEvent(e) {
      console.log(e)
      const { currentPromotionNo, itemNo } = e.detail,
            goods = this.data.goods,
            currentPromotion = this.data.currentPromotion,
            currentPromotionType = (goods.cartsType == 'cw' || goods.cartsType == 'dw') ? currentPromotionNo.slice(0, 2) : currentPromotionNo.slice(0, 3) // 切换的促销

      let allPromotion = this.data.allPromotion,
          nowGoods
      goods.data.forEach((item, index) => {
        // 当前商品
        if(item['currentPromotionNo'] && itemNo == item.itemNo) {
          nowGoods = item
          let currentPromotionObj = {}
          let currentPromotionIndex
          let isPromotion = true // 是否添加新促销类型
          currentPromotion.forEach((t, i) => {
            if (item['currentPromotionNo'] == t['currentPromotionNo']) {
              currentPromotionObj = t       // 切换前的促销对象
              currentPromotionIndex = i // 切换前的促销对象下标
            }
            if (currentPromotionNo == t['currentPromotionNo']) { // 添加
              isPromotion = false;
              t.typeNum += 1
            }
          })
          console.log(77, currentPromotionObj, deepCopy(nowGoods))
          console.log(78, currentPromotionType)
          if (
            // currentPromotionType != 'BG'
            currentPromotionType != 'MS'
            && currentPromotionType != 'SD'
            && currentPromotionType != 'ZK'
            && currentPromotionType != 'BD'
            && currentPromotionType != 'FS'
            && currentPromotionType != 'RSD'
          ) {
            nowGoods.price = nowGoods.orgiPrice // 切换为非价格促销,则返回原价 
            if (isPromotion) {
              currentPromotion.unshift({ type: currentPromotionType, currentPromotionNo, typeNum:1 });
              currentPromotionIndex++
            }
          } else {
            switch (currentPromotionType) {
              case 'MS':
                console.log(nowGoods.realQty <= nowGoods.msMaxQty)
                if (nowGoods.realQty <= nowGoods.msMaxQty) {
                  nowGoods.price = nowGoods.msPrice
                } else {
                  nowGoods.price = nowGoods.carstBasePrice
                }
                break;
              case 'FS':
                nowGoods.price = nowGoods.sdPrice
                break;
              case 'SD':
                if (nowGoods.realQty <= nowGoods.drMaxQty) {
                  nowGoods.price = nowGoods.drPrice
                } else {
                  nowGoods.price = nowGoods.carstBasePrice
                }
                break;
              case 'RSD':
                if (nowGoods.realQty <= nowGoods.drMaxQty) {
                  nowGoods.price = nowGoods.drPrice
                } else {
                  nowGoods.price = nowGoods.carstBasePrice
                }
                break;
              case 'ZK':
                nowGoods.price = nowGoods.zkPrice
                break;
              case 'BG':
                nowGoods.price = nowGoods.orgiPrice
                break;
            }
          }
          /* 
           * 切换前促销对象数量种类 == 1 ; 则删除此促销单据对象
           * 数量种类 > 1 ;则此单据促销对象数量 - 1
           */
          // console.log(94, currentPromotionObj)
          if (currentPromotionObj.typeNum == 1) {
            currentPromotion.splice(currentPromotionIndex, 1)
          } else if (currentPromotionObj.typeNum > 1){
            currentPromotion[currentPromotionIndex].typeNum -= 1
          }
          console.log(881,currentPromotionObj)
          // console.log(882,nowGoods.cancelSelected, isPromotion, nowGoods)
          if (!nowGoods.cancelSelected) {
            console.log(11111)
            if (currentPromotionType == 'MQ' || currentPromotionType == 'BG') {
              allPromotion[currentPromotionNo].qty += nowGoods.realQty
              allPromotion = this.isSatisfyPromotion(allPromotion) 
            } else if (currentPromotionObj.type == 'MQ' || currentPromotionObj.type == 'BG'){
              allPromotion[currentPromotionObj.currentPromotionNo].qty -= nowGoods.realQty
              allPromotion = this.isSatisfyPromotion(allPromotion) 
            }

            if (currentPromotionType == 'SZ' || currentPromotionType == 'MJ'  || currentPromotionType == 'BF'  || currentPromotionType == 'RMJ'  || currentPromotionType == 'RBF') {
              if (isPromotion) {
                allPromotion[currentPromotionNo].price = 0
              } 
              allPromotion[currentPromotionNo].price += nowGoods.price * nowGoods.realQty
              // console.log(allPromotion[currentPromotionNo])
              allPromotion = this.isSatisfyPromotion(allPromotion) 
            }
              
            if (currentPromotionObj.type == 'SZ' || currentPromotionObj.type == 'MJ' || currentPromotionObj.type == 'BF'|| currentPromotionObj.type == 'RMJ' || currentPromotionObj.type == 'RBF') {
              allPromotion[currentPromotionObj.currentPromotionNo].price -= nowGoods.price * nowGoods.realQty
              allPromotion = this.isSatisfyPromotion(allPromotion) 
            }
          } else {
            if (currentPromotionType == 'SZ' || currentPromotionType == 'MJ' || currentPromotionType == 'BF' || currentPromotionType == 'RMJ' || currentPromotionType == 'RBF') {
              if (isPromotion) {
                allPromotion[currentPromotionNo].price = 0
                allPromotion = this.isSatisfyPromotion(allPromotion) 
              }
            } 
          }
          
          goods.data[index].currentPromotionNo = currentPromotionNo
          goods.data[index].currentPromotionType = currentPromotionType
          // console.log(currentPromotionNo, currentPromotionType)
        }
      })
      dispatch[types.CHANGE_CPROMOTION_CARTS]({ goods: { itemNo, currentPromotionNo } })
      toast('已切换')
      wx.setStorageSync('updateCarts', true)
      console.log(goods)
      console.log(allPromotion)
      this.setData({ goods, currentPromotion, allPromotion })
      this.data.goods = goods
      this.data.currentPromotion = currentPromotion
      this.data.allPromotion = allPromotion
      this.countMoney()
    },
    // 显示促销 Dialog
    showSwitchPromotionDialog(e) {
      // 显示框
      console.log(e)
      const cpnObj = this.selectComponent('.spDialog') // 获取组件实例
      cpnObj.showClick()
      // 数据对象处理
      const promotionNoArr = e.currentTarget.dataset.promotionnoarr,
            promotionNo = e.currentTarget.dataset.cpnpromotionno,
            allPromotion = this.data.allPromotion,
            selectPromotionGood = e.currentTarget.dataset.good,
            p = deepCopy(allPromotion),
            itemNo = e.currentTarget.dataset.itemno
      let promotionNoObj = {},
          goods = this.data.goods
          // console.log(promotionNoArr)
      promotionNoArr.forEach((item, index) => {
        console.log(item, promotionNoObj)
        promotionNoObj[item] = p[item]
        console.log( p ,item)
        if (item.includes('SD') || item.includes('MS') || item.includes('FS') || item.includes('ZK')) {
          const msg = p[item].msg[itemNo]
          promotionNoObj[item].msg = [msg]
        }
      })
      console.log(promotionNoObj, allPromotion, this.data.allPromotion)
      cpnObj.setData({ data: promotionNoObj, itemNo, goods, promotionNo, selectPromotionGood })
    },
    // 去凑凑  中心仓跳转分类页  前置仓跳转对应前置仓页面
    goCD() {
      const { sourceType, sourceNo } = this.data.goods
      console.log(sourceType)
      switch (sourceType) {
        case '0':
          console.log(sourceType)
          wx.switchTab({ url: '/pages/t_goods/t_goods' })
          break;
        case '1':
          this.goAddGoodsClick(sourceNo)
          console.log(sourceNo)
          break;
      }

    },
    // 跳转凑单页 
    goAddGoodsClick(e) {
      console.log(e)
      let items
      let promotionNo
      let name = ''
      if (typeof e === 'object') {
        items = e.currentTarget.dataset.items
        promotionNo = e.currentTarget.dataset.items.promotionNo
        name = e.currentTarget.dataset.items.name
      }
      if (name.includes('全场') || typeof e === 'string') {
        const { goods: goodsData } = this.data 
        const config = {
          supplierName: goodsData.sourceName,
          supplierNo: goodsData.sourceNo,
          minDeliveryMomey: goodsData.startPrice,
          itemClsName: '',
          goodsImgUrl: '',
          promotionNo
        }
        const { platform, username, branchNo, token } = wx.getStorageSync('userObj')
        API.Supplier.searchSupcust({
          data: { branchNo, token, platform, username, condition: '' },
          success(res) {
            console.log(res)
            const list = res.data
            list.forEach(item => {
              if (item.supcustNo == goodsData.sourceNo) {
                console.log(item)
                const imgUrl = getApp().data.imgUrl
                console.log(getApp().data)
                item.goodsImgUrl = imgUrl + '/upload/images/supplier/' + item.picUrl
                console.log(imgUrl, item)
                'customDescription' in item && (config.customDescription = item.customDescription)
                config.itemClsName = item.itemClsName
                config.goodsImgUrl = item.goodsImgUrl
                console.log(config)
                goPage('supplierGoods', { config })
              }
            })
          }
        })
        return
      }
      console.log(e ,this.data)
      const { sourceNo } = this.data.goods
      goPage('p_goods', { promotionNo, sourceNo, items })
    },
    // 获取系统配置(送货开始和结束时间)
    getCommonSetting() {
      const _this = this
      const { platform, username, branchNo, token } = wx.getStorageSync('userObj')
      API.Public.getCommonSetting({
        data: { platform, username, branchNo, token },
        success(res) {
          // console.log(res)
          if (!('orderEndDate' in res.data && 'orderStartDate' in res.data)) return 
          let {orderEndDate, orderStartDate} = res.data, // 开始 / 结束时间
          nowDate = tim()      // 当前时间

          if ((orderEndDate == '0:00:00' || orderEndDate == '00:00:00') && (orderStartDate == '0:00:00' || orderStartDate == '00:00:00')) return 
          if (nowDate == '00:00:00') nowDate = '0:00:00' 

          const { nowH, nowM, startH, startM, endH, endM } = _this.timer(nowDate, orderStartDate, orderEndDate) // 处理时间格式

          // 在时间区间内
          if ((nowH > startH && nowH < endH) || ((nowH == startH && nowM > startM) || (nowH == endH && nowM < endM))) return 

          _this.setData({ 
            transDateObj: {isShow: true, date: `${orderStartDate} - ${orderEndDate}`}
          })
        },
        error(res) {
        }
      })
    },
    inputBlur (e) {
      let goods = this.data.goods 
      this.setData({ goods })
    },
    inputConfirm(e) {
      const currentPromotionNo = e.currentTarget.dataset.currentpromotionno
      const allPromotion = this.data.allPromotion
      const currentProObj = allPromotion[currentPromotionNo]
      const value = Number(e.detail.value.trim()) || 0
      const index = e.currentTarget.dataset.index
      let cartsObj = this.data.goods
      const goods = cartsObj.data[index]
      const config = {
        sourceType: cartsObj.sourceType,
        sourceNo: cartsObj.sourceNo,
        branchNo: cartsObj.branchNo
      }
      const type = value ? 'input' :'delete'
      // 超过限购数量
      if (
        type == 'input'
        && 'todayPromotion' in cartsObj.data[index]
        && value > cartsObj.data[index].todayPromotion.limitedQty
      ){
        cartsObj.data[index].realQty = cartsObj.data[index].todayPromotion.limitedQty
        this.setData({ goods: cartsObj })
        toast('已达限时促销最大限购数')
        return
      }
      // 删除商品
      if (type == 'delete') {
        cartsObj.data = cartsObj.data.filter((t, i) => i !== index)
        dispatch[types.CHANGE_CARTS]({ goods, type, config })
        if (cartsObj.data.length) {
          this.setData({ goods: cartsObj })
          this.countMoney(currentProObj)
        } else {
          this.triggerEvent('deleteCarts', cartsObj.type)
        }
      } else  {
        const newCarts = dispatch[types.CHANGE_CARTS]({ goods, type, config, value })
        if (newCarts) {
          cartsObj.data[index].realQty = newCarts[goods.itemNo].realQty
          MsAndDrCount(goods, newCarts[goods.itemNo], type)
          this.setData({ goods: cartsObj })
          this.countMoney(currentProObj)
        } else {
          this.inputBlur()
        }
      }
      
      
    },
    setSize(rex) {
      return (rex / 750) * this.ww
    },
    touchstart(e) {
      const clientX = e.changedTouches[0].clientX
      this.startPoint = clientX
      this.setData({ leftAnimation: false })
    },
    touchend(e) {
      const index = e.currentTarget.dataset.index
      const leftAnimation = true
      let goods = this.data.goods
      const left = (goods.data[index].goodsLeft >= this.setSize(180) / 2) ? this.setSize(180) : 0
      goods.data[index].baseGoodsLeft = left
      goods.data[index].goodsLeft = left
      this.setData({ goods, leftAnimation })
    },
    touchmove(e) {
      const clientX = e.changedTouches[0].clientX
      const index = e.currentTarget.dataset.index
      let goods = this.data.goods
      let move = this.startPoint - clientX
      if (move < goods.data[index].baseGoodsLeft && move >= 0) return
      if (move <= 0) move += goods.data[index].baseGoodsLeft
      if (move <= this.setSize(500)) {
        goods.data[index].goodsLeft = (move >= 0) ? move : 0
      }
      this.setData({ goods })
    },
    goLiquidation (e) {
      const { branchNo, token, username, platform, isLogin } = wx.getStorageSync('userObj')
      if (isLogin) {
        goPage('login',{
          isLogin: true
        })
        return
      }
      const { goods, selectTypeNum, cartsMoney } = this.data
      const replenish = e.currentTarget.dataset.replenish || ''
      if (!selectTypeNum || (!replenish && goods.startPrice > cartsMoney) ){
        toast(!selectTypeNum?'请选择商品':'未达到起送价格')
        return
      }
      showLoading('请稍后...')
      let itemNos =[]
      const updateCarts = wx.getStorageSync('updateCarts')
      const cartsObj = commit[types.GET_CARTS]()
      this.data.goods.data.forEach(goods => {
        if (!goods.cancelSelected) {
          itemNos.push(goods.itemNo)
        }
      })
      let items = []
      cartsObj.keyArr.forEach(itemNo => {
        if ('cancelSelected' in cartsObj[itemNo]) delete cartsObj[itemNo].cancelSelected
        items.push(cartsObj[itemNo])
      })
      console.log(items, cartsObj, updateCarts)
      items = JSON.stringify(updateCarts ? items : [])
      API.Carts.getSettlementPageInfo({
        data: { branchNo, token, username, platform, items, itemNos},
        success: res => {
          console.log(res)
          if (res.code == 0) {
            if(res.msg) {
              alert(res.msg,{
                title:'温馨提示',
                showCancel: true,
                confirmText: '继续下单',
                success: ret=> {
                  console.log(ret)
                  if (ret.confirm) {
                    this.saveLiquidationObj(res.data, replenish)
                  }
                }
              })
            } else {
              this.saveLiquidationObj(res.data,replenish)
            }
          } else {
            alert(res.msg)
          }
        },
        error: () => {
          alert('请求失败，请检查网络是否正常')
        },
        complete: ()=> hideLoading()
      })
    },
    deleteAll () {
      const _this = this
      const cartsObj = this.data.goods
      const selectTypeNum = this.data.selectTypeNum
      if (!selectTypeNum) {
        toast('请勾选删除的商品')
        return
      }
      const config = {
        sourceType: cartsObj.sourceType,
        sourceNo: cartsObj.sourceNo,
        branchNo: cartsObj.branchNo
      }
      alert('您确定要删除所选的商品吗？', {
        showCancel: true,
        confirmColor: '#e60012',
        success: (res) => {
          if (res.confirm) {
            let keyArr = []
            cartsObj.data.map(goods => {
              if (!goods.cancelSelected) {
                keyArr.push(goods.itemNo)
                dispatch[types.CHANGE_CARTS]({ goods, type: 'delete', config })
              }
            })
            cartsObj.data = cartsObj.data.filter((t, i) => keyArr.indexOf(t.itemNo) == -1)
            if (cartsObj.data.length) {
              switch(_this.sourceType){
                case '0':
                  _this.addCurrentSelectedPromotion(cartsObj)
                  break;
                case '1':
                  _this.setData({ goods: cartsObj })
                  break;
              }

              this.countMoney()
            } else {
              this.setData({ goods: [] })
            }
            
          }
        }
      })
      
    },
    // 对象化 data
    backGoodObj(data) {
      const obj = {}
      data.forEach(item => {
        obj[item.itemNo] = item
      })
      return obj
    },
    saveLiquidationObj(data, replenish) {
      console.log('保存购物车 data 数据' ,deepCopy(data))
      const { zhGoodsUrl, goodsUrl, zcGoodsUrl, partnerCode } = getApp().data
      const sourceType = data.items[0].sourceType
      const replenishNo = this.data.isReplenish
      const allPromotion = this.data.allPromotion
      const cartsObj = commit[types.GET_CARTS]()
      let sheetAmt = 0
      const { data: cData } = this.data.goods
      const cDataObj = this.backGoodObj(cData)
      console.log(deepCopy (cDataObj), deepCopy(data))
      data.items[0].datas.forEach(goods => {
        if (cDataObj[goods.itemNo]['currentPromotionNo']) {
          goods['promotionSheetNo'] = cDataObj[goods.itemNo]['currentPromotionNo']
          goods['promotionType'] = cDataObj[goods.itemNo]['currentPromotionType'] 
        }
        const imgUrl = (sourceType == '0' ? (goods.specType == '2' ? zhGoodsUrl : goodsUrl) : zcGoodsUrl)
        goods.goodsImgUrl = imgUrl + goods.itemNo + '/' + getGoodsImgSize(goods.picUrl)
        goods.subtotal = Number((goods.price * goods.realQty).toFixed(2))
        goods.itemType = goods.promotionType =='BD'?'0': '1'
        const promotionNo = cDataObj[goods.itemNo].currentPromotionNo || ''
        const ty = (sourceType == '1' && promotionNo) ? promotionNo.slice(0, 3) : promotionNo.slice(0, 2)
        goods.currentPromotionType = ty
        if (ty == 'BG' || ty == 'BF' || ty == 'MQ' || ty == 'MJ' || ty == 'SZ' || ty == 'RMJ' || ty == 'RBF') {
          goods.price = cDataObj[goods.itemNo].orgiPrice
        } else if (ty == 'MS' && cDataObj[goods.itemNo].realQty <= cDataObj[goods.itemNo].msMaxQty) {
          goods.price = cDataObj[goods.itemNo].msPrice
        } else if (ty == 'FS') {
          goods.price = cDataObj[goods.itemNo].sdPrice
        } else if (ty == 'ZK') {
          goods.price = cDataObj[goods.itemNo].zkPrice
        } else if ((ty == 'SD' || ty == 'RSD') && (cDataObj[goods.itemNo].drMaxQty > cDataObj[goods.itemNo].realQty || cDataObj[goods.itemNo].drMaxQty == 0)) {
          console.log(deepCopy(goods))
          goods.price = cDataObj[goods.itemNo].drPrice
          console.log(deepCopy(goods))
        }
        sheetAmt += goods.price * goods.realQty
      })
      data.sheetAmt = Number(sheetAmt.toFixed(2))
      console.log(data)
      wx.setStorageSync('liquidationObj', data)
      console.log(424,deepCopy(data))
      if (partnerCode == '1029' || partnerCode == '1000') {   // isNewCarts: 新版购物车
        goPage('liquidation', { supplierNo: data.items[0].sourceNo, isNewCarts: true, cartsType: this.data.goods.cartsType, replenish, replenishNo, allPromotion })
      } else {
        goPage('liquidation', { cartsType: this.data.goods.cartsType, replenish, replenishNo, allPromotion })  
      }
            
    },
    goGoodsDetails(e) {
      const index = e.currentTarget.dataset.index
      const cartsObj = this.data.goods
      const goods = cartsObj.data[index]
      goPage('goodsDetails', {
        itemNo: goods.itemNo,
        supcustNo: cartsObj.cartsType == 'sup' ? cartsObj.sourceNo : ''
      })
    },
    countMoney(currentProObj, is) {
      let cartsMoney = 0
      let selectNum = 0
      let selectTypeNum = 0
      let isSelectAll = this.data.isSelectAll
      const cartsObj = this.data.goods
      cartsObj.data.length && cartsObj.data.map(goods => {
        // console.log(513, goods)
        if (!goods.cancelSelected) {
          console.log(deepCopy(goods), cartsMoney, goods.price * goods.realQty)
          cartsMoney = Number((cartsMoney + (goods.price * goods.realQty)).toFixed(2))
          // console.log(cartsMoney)
          selectNum += goods.realQty
          if (String(selectNum).includes('.')) selectNum = Number(Number(selectNum).toFixed(1))
          selectTypeNum += 1
        } else {

        }
      })
      console.log(cartsMoney, deepCopy(currentProObj))

      // 若是有促销单据，计算商品是否满足促销条件， 并修改当前差异价格
      if (currentProObj) {
        const promoType = this.sourceType == 0 ? currentProObj.promotionNo.slice(0, 2) : currentProObj.promotionNo.slice(0, 3),
              promotionNo = currentProObj['promotionNo']
        let allPromotion = this.data.allPromotion

        if (promoType == 'MJ' || promoType == 'BF' || promoType == 'SZ' || promoType == 'RMJ' || promoType == 'RBF') {
          const differPrice = cartsMoney - this.data.cartsMoney
          // console.log(promoType,differPrice, cartsMoney , this.data.cartsMoney)
          currentProObj.price = currentProObj.price + differPrice
          currentProObj = this.isSatisfyPromotion({ [promotionNo]: currentProObj}) // 促销信息对象计算处理
          // if (currentProObj.price <= 0) return delete allPromotion[currentProObj.promotionNo]
          allPromotion = Object.assign(allPromotion, currentProObj)
          // console.log(currentProObj)
        } else if (promoType == 'MQ' || promoType == 'BG') {
          const differQty = selectNum - this.data.selectNum
          currentProObj.qty = currentProObj.qty + differQty
          currentProObj = this.isSatisfyPromotion({ [promotionNo]: currentProObj }) // 促销信息对象计算处理
          allPromotion = Object.assign(allPromotion, currentProObj)
        }
        console.log(4564654564, allPromotion)
        this.setData({ cartsMoney, selectNum, selectTypeNum, isSelectAll, allPromotion })
      } else {
        cartsObj.data.length === selectTypeNum && (isSelectAll = true)
        this.setData({ cartsMoney, selectNum, selectTypeNum, isSelectAll })
      }
      console.log(cartsMoney)
      // console.log(deepCopy(cartsObj.data))
    },
    selectAllGoods() {
      let goods = this.data.goods
      let selectObj = {}
      const isSelectAll = !this.data.isSelectAll
      console.log(goods)
      const goodsObj = this.backGoodObj(goods.data)
      goods.data.forEach(item => {
        item.cancelSelected = !isSelectAll
      })
      let cartsObj = wx.getStorageSync('cartsObj')
      for(const key in goodsObj) {
        key in cartsObj && (cartsObj[key].cancelSelected = !isSelectAll)
      }
      wx.setStorage({key: 'cartsObj', data: cartsObj })
      
      const allPromotion = this.data.allPromotion
      const isAllPromotion = Object.keys(allPromotion).length // 长度为 0 则无促销单据
      switch(isSelectAll) {
        case true: // 全选
          for(let key in allPromotion) {
            let selectPrice = 0 // 全选时,促销单据的商品价格
            let selectQty = 0
            goods.data.forEach(item => {
              if (key == item['currentPromotionNo']) {
                const type = item['currentPromotionType']

                if (item.cancelSelected != true && (type == 'MJ' || type == 'BF' || type == 'SZ' || type == 'RMJ' || type == 'RBF')) {
                  selectPrice += item.price * item.realQty
                } else if (type == 'MQ' || type == 'BG') {
                  selectQty += item.realQty
                }
              }
            })

            if (allPromotion[key].promotionNo.includes('MQ') || allPromotion[key].promotionNo.includes('BG')) {
              allPromotion[key].qty = selectQty
            } else {
              allPromotion[key].price = selectPrice
            }
          }
          break;
        case false: // 取消全选
          for(let key in allPromotion) {
            const t = allPromotion[key]
            if('price' in t) t.price = 0
            if('qty' in t) t.qty = 0
          }
          break;
      }
      this.isSatisfyPromotion(allPromotion)
      
      // console.log(allPromotion)
      this.setData({ isSelectAll, goods, allPromotion })
      this.countMoney()
    },
    selectGoods(e) {
      // console.log(e)
      const currentPromotionNo = e.currentTarget.dataset.currentpromotionno
      const allPromotion = this.data.allPromotion
      const currentProObj = allPromotion[currentPromotionNo]
      const cartsObj = wx.getStorageSync('cartsObj')


      const index = e.currentTarget.dataset.index
      let { goods } = this.data
      const is = !goods.data[index].cancelSelected
      cartsObj[goods.data[index].itemNo].cancelSelected = is
      wx.setStorage({key: 'cartsObj', data: cartsObj})
      goods.data[index].cancelSelected = is
      // 是否全选
      let allSelected = true
      goods.data.forEach(item => {
        if (item.cancelSelected == true) allSelected = false
      }) 
      this.data.isSelectAll = allSelected
      this.data.goods = goods
      this.setData({ goods, isSelectAll: allSelected })
      console.log(currentProObj, is)
      this.countMoney(currentProObj, is)
    },
    changeGoodsNum(e) {
      // console.log(e)
      const currentPromotionNo = e.currentTarget.dataset.currentpromotionno
      const allPromotion = this.data.allPromotion
      const currentProObj = allPromotion[currentPromotionNo]
      const currentPromotion = this.data.currentPromotion
      const index = e.currentTarget.dataset.index
      const type = e.currentTarget.dataset.type
      let cartsObj = this.data.goods
      let goods = cartsObj.data[index]
      // console.log(allPromotion[currentPromotionNo])
      const config = {
        sourceType: cartsObj.sourceType,
        sourceNo: cartsObj.sourceNo,
        branchNo: cartsObj.branchNo
      }
      // if ((type === 'minus' && (goods.realQty === 1 || goods.realQty === goods.minSupplyQty)) || type === 'delete'  ) {
      if ((type === 'minus' && (goods.realQty == goods.minSupplyQty)) || type === 'delete'  ) {
        alert('您确定要删除此商品吗？', {
          showCancel: true,
          confirmColor: '#e60012',
          success: (res) => {
            if (res.confirm) {
              cartsObj.data = cartsObj.data.filter((t, i) => i !== index)
              dispatch[types.CHANGE_CARTS]({ goods, type, config })
              if (cartsObj.data.length) {
                this.setData({ goods: cartsObj })
                switch(this.sourceType){
                  case '0':
                    this.addCurrentSelectedPromotion(cartsObj)
                    break;
                  case '1':
                    // console.log('这是直配',455)
                    this.setData({ goods: cartsObj })
                    break;
                }
                this.countMoney(currentProObj, type)
              } else {
                this.setData({ goods: [] })
                this.triggerEvent('deleteCarts', cartsObj.type)
              }
            }
          }
        })
      } else {
        const newCarts = dispatch[types.CHANGE_CARTS]({ goods, type, config })
        if (newCarts) {
          cartsObj.data[index].realQty = newCarts[goods.itemNo].realQty
          goods = MsAndDrCount(goods, newCarts[goods.itemNo], type)
          this.data.goods = goods
          this.setData({ goods: cartsObj })
          this.countMoney(currentProObj)
        } else {
          return
        }
      }
      // console.log('商品数量更改')
    },
    // 请求直配商品促销数据
    getSupplierAllPromotion(branchNo, token, platform, username, goodsData){
      API.Public.getSupplierAllPromotion({
        data: { branchNo, token, platform, username, supplierNo: goodsData.sourceNo },
        success: res => {
          console.log(610, res)
          if (res.code == 0 && res.data){
            let data = res.data
            let promKey // 获取 以 RSD 开头的下标 (促销信息)
            for (let key in data) {
              if (key.includes('RMJ') && data[key].length != 0) { this.setData({ rmj: true }) }
              if (key.includes('RBF') && data[key].length != 0) { this.setData({ rbf: true }) }
              if (key.includes('RSD')) { promKey = key }
            }
            wx.setStorageSync('supplierPromotion', data[promKey]) // 储存 限购信息
            let supplierPromotion = data[promKey]
            let allPromotion = []
            goodsData.data.forEach(item => {
              if ('promotionCollections' in item && item.promotionCollections.includes('RMJ')) item['RMJ'] = '满减商品'
              if ('promotionCollections' in item && item.promotionCollections.includes('RBF')) item['RBF'] = '满赠商品'
              if ('promotionCollections' in item && item.promotionCollections.includes('RSD')) item['RSD'] = '限时抢购'
              // 直配限时购买信息
              for (let key in supplierPromotion) {
                if (item['itemNo'] == key) {
                  const cartsObj = wx.getStorageSync('cartsObj')
                  supplierPromotion[key].startDate = supplierPromotion[key].startDate.slice(0, 10)
                  supplierPromotion[key].endDate = supplierPromotion[key].endDate.slice(0, 10)
                  supplierPromotion[key].limitedQty = supplierPromotion[key].limitedQty
                  item['todayPromotion'] = supplierPromotion[key]
                  item.drPrice = supplierPromotion[key].price
                  item.drMaxQty = supplierPromotion[key].limitedQty
                  if (!(key in cartsObj) || cartsObj[key].realQty <= item.drMaxQty) {
                    item.price = supplierPromotion[key].price
                  }
                }
              }
            })
          }
          this.data.goods = goodsData
          this.setData({ goods: goodsData })
        }
      })
    },
    // 商品中添加当前所选择的促销字段 currentPromotion
    addCurrentSelectedPromotion(goodsData = this.data.goods) {
      wx.setStorage({ key:"updateCarts", data: true })
      let currentPromotion = ['NO']  // 当前购物车商品的所选择促销数组
      let currentPromotionNo = ['']  // 当前购物车商品的所选择促销单据数组 
      console.log(deepCopy(goodsData))
      const sourceType = Number(goodsData.sourceType),  // 0: 统配, 1: 直配
            branchNo = goodsData.branchNo,
            sourceNo = goodsData.sourceNo

      goodsData.data.forEach((item, i) => {
        console.log('item', deepCopy(item))
        // 首次加载，默认选第一个促销
        if (item['promotionCollections']) {
          // 无 currentPromotionno
          if (!(item['currentPromotionNo'] && item['promotionCollectionsArr'].includes(item['currentPromotionNo']))) {
            if (item['promotionCollections'].includes(',')) {
              console.log(775,item)
              const promoArr = item['promotionCollections'].split(',')
              item['promotionCollectionsArr'] = promoArr
              // 商品促销数组的排序  'MS', 'FS', 'SD', 'ZK', 'BF', 'SZ' , 'BG', 'MJ', 'MQ'
              item['promotionCollectionsArr'] = promoArrSort(promoArr, sourceType)
            } else if (item['promotionCollections'] == '') {
              item['promotionCollectionsArr'] = [item['promotionCollections']]
            }
  
            if (item['promotionCollections']) {
              item['currentPromotionNo'] = item['promotionCollectionsArr'][0]
            }
  
            if (this.sourceType == 1 && item['currentPromotionNo'].length < 19) {
              console.log(deepCopy(item['promotionCollectionsArr']))
              item['currentPromotionNo'] = item['promotionCollectionsArr'][0]
            }
          }
          
          console.log(item['currentPromotionNo'], item)
          
          // if (item['promotionSheetNo'] && )
          // 不参与促销计算
          let backSign
          currentPromotion.length && currentPromotion.forEach((t, index) => {
            if (
              item.currentPromotionNo.includes('MS')
              || item.currentPromotionNo.includes('FS')
              || item.currentPromotionNo.includes('SD')
              || item.currentPromotionNo.includes('ZK')
              || item.currentPromotionNo.includes('MS')
              || item.currentPromotionNo.includes('RSD')
              || item.currentPromotionNo.includes('BD')
              || item.discountMoney
            ) backSign = 'return'   
          })
          let promoObj = {
            currentPromotionNo: '', // 编号
            type: '',               // 促销类型
            typeNum: 0              // 商品种类数量
          } 
          // console.log(promoObj)
          switch(Number(sourceType)) { // 0: 统配, 1: 直配
            case 0:
              item['currentPromotionType'] = item['currentPromotionNo'].slice(0, 2)
              this.promoPriceCheck(item, item['currentPromotionType']) // 促销价格核对
              if (backSign == 'return') return   // 不保留重复的单据,并过滤无需凑单的单据
              promoObj.type = item['currentPromotionNo'].slice(0, 2)
              promoObj.currentPromotionNo = item['currentPromotionNo']
              currentPromotion.unshift(promoObj)
              break;
            case 1:
              item['currentPromotionType'] = item['currentPromotionNo'].slice(0, 3)
              this.promoPriceCheck(item, item['currentPromotionType']) // 促销价格核对
              if (backSign == 'return') return   // 不保留重复的单据, 并过滤无需凑单的单据
              promoObj.type = item['currentPromotionNo'].slice(0, 3)
              promoObj.currentPromotionNo = item['currentPromotionNo']
              currentPromotion.unshift(promoObj)
              break;
          }
        } else if (item['currentPromotionNo'] || item['currentPromotionType']) {
          item['currentPromotionNo'] = '' 
          item['currentPromotionType'] = ''
        }
        
        dispatch[types.CHANGE_CPROMOTION_CARTS]({ goods: item })
      })
      
      // 计算每个单据的类别数量, 并去除了重复单据
      currentPromotion.forEach(item => {
        if (item == 'NO') return
        currentPromotion.forEach(t => {
          if (t == 'NO') return
          if (t.currentPromotionNo == item.currentPromotionNo) item.typeNum++
        })
      })
      currentPromotion = filterArr(currentPromotion)

      this.data.currentPromotion = currentPromotion
      this.data.currentPromotionNo = currentPromotionNo
      this.data.goods = goodsData
      console.log(deepCopy(goodsData))
      this.getAllPromotions(goodsData) // 处理所有促销
      this.setData({ currentPromotion, currentPromotionNo, goodsData })
      return goodsData
    },
    /* 返回对应促销的 促销编号
     *  nowGoods： 商品 Obj
     *  tag: 促销 type
     */ 
    addPromotionNo(nowGoods, tagType) {
      // if (this.sourceType == 1) tagType = nowGoods.currentPromotionType
      console.log(nowGoods['promotionCollections'], nowGoods['currentPromotionNo'], nowGoods['promotionCollectionsArr'].includes(nowGoods['currentPromotionNo']))
      if (nowGoods.currentPromotionType == tagType && nowGoods['promotionCollectionsArr'].includes(nowGoods['currentPromotionNo'])) return nowGoods.currentPromotionNo 
      const promotionCollectionsArr = nowGoods.promotionCollectionsArr
      
      let promoIndex
      promotionCollectionsArr.forEach((item, index) => {
        if (item.includes(tagType)) promoIndex = index
      })
      console.log(promotionCollectionsArr[promoIndex], promotionCollectionsArr)
      return promotionCollectionsArr[promoIndex]
    },

    // 对所有促销信息进行处理（直配）
    suplierPromotionHandle(res ,nowGoods) {
      
      let sPromotionList = [],
            _this = this
      if (res['RBF'][nowGoods.itemNo]) {
        const goodPromo = nowGoods['promotionCollections']
        console.log(goodPromo)
        console.log(res, nowGoods)
        if (goodPromo) {
          if (!nowGoods['promotionCollectionsArr'].includes(res['RBF'][nowGoods.itemNo].promotionNo)) {
            nowGoods['promotionCollections'] = goodPromo + ',' + res['RBF'][nowGoods.itemNo].promotionNo
            nowGoods['promotionCollectionsArr'].push(res['RBF'][nowGoods.itemNo].promotionNo)
          }
        } else {
          nowGoods['promotionCollections'] = res['RBF'][nowGoods.itemNo].promotionNo
          nowGoods['promotionCollectionsArr'] = [res['RBF'][nowGoods.itemNo].promotionNo]
        }
        sPromotionList.push({
          name: res['RBF'][nowGoods.itemNo].type == 1 ? '全场满赠' : '满赠',
          reachVal: res['RBF'][nowGoods.itemNo].reachVal,
          msg: [res['RBF'][nowGoods.itemNo].memo || `满￥${res['RBF'][nowGoods.itemNo].reachVal}送赠品`],
          promotionNo: res['RBF'][nowGoods.itemNo].promotionNo
        })
      }
      if (res['RMJ'][nowGoods.itemNo]) {
        const goodPromo = nowGoods['promotionCollections']
        console.log(goodPromo)
        console.log(res, nowGoods)
        if (goodPromo) {
          if (!nowGoods['promotionCollectionsArr'].includes(res['RMJ'][nowGoods.itemNo].promotionNo)) {
            nowGoods['promotionCollections'] = goodPromo + ',' + res['RMJ'][nowGoods.itemNo].promotionNo
            nowGoods['promotionCollectionsArr'].push(res['RMJ'][nowGoods.itemNo].promotionNo)
          }
        } else {
          nowGoods['promotionCollections'] = res['RMJ'][nowGoods.itemNo].promotionNo
          nowGoods['promotionCollectionsArr'] = [res['RMJ'][nowGoods.itemNo].promotionNo]
        }
        sPromotionList.push({
          name: res['RMJ'][nowGoods.itemNo].type == 1 ? '全场满减' : '满减',
          reachVal: res['RMJ'][nowGoods.itemNo].reachVal,
          subMoney: res['RMJ'][nowGoods.itemNo].subMoney,
          msg: [res['RMJ'][nowGoods.itemNo].memo || `满￥${res['RMJ'][nowGoods.itemNo].reachVal}减￥${res['RMJ'][nowGoods.itemNo].subMoney}`],
          promotionNo: res['RMJ'][nowGoods.itemNo].promotionNo
        })
      }
      if (nowGoods.promotionCollections.includes('RSD')) {
        console.log(res, nowGoods)
        sPromotionList.push({
          name: '限时促销',
          msg: { [nowGoods.itemNo]: `活动至${res['RSD'].endDate}结束`},
          promotionNo: _this.addPromotionNo(nowGoods, 'RSD')
        })

      }
      return sPromotionList
    },

    // 对统配促销信息进行处理
    allPromotionHandle(res, nowGoods, _this = this) {
      const tag = getGoodsTag(nowGoods, res, true)
      console.log(1201,deepCopy(nowGoods))
      console.log(tag)
      const { allPromotion } = this.data
      const itemNo = nowGoods.itemNo
      const brandNo = nowGoods.itemBrandno || nowGoods.itemBrandNo
      const itemClsno = nowGoods.itemClsno
      let promotionList = []
      let BFpromotionList = []
      if (
        (tag.FS && nowGoods['promotionCollections'].includes('FS')) 
        || (tag.SD && nowGoods['promotionCollections'].includes('SD')) 
        || (tag.ZK && nowGoods['promotionCollections'].includes('ZK'))
      ) {
        promotionList.push({
          name: tag.FS ? '首单特价' : (tag.SD ? '特价促销' : (tag.zkType + '折扣')),
          msg: {[itemNo]: (tag.FS ? ('活动期间,首次下单且购买数量不超过 '+ tag.sdMaxQty + nowGoods.unit +' 享受优惠价格￥'+tag.sdPrice) : (tag.SD ? ('购买数量不超过 ' + tag.drMaxQty + nowGoods.unit + ' 参与促销活动，特价￥' + tag.drPrice) : ('当前' + tag.zkType + '下单立即享受' + tag.discount + '优惠')))},
          promotionNo: _this.addPromotionNo(nowGoods, ((tag.FS && 'FS') || (tag.SD && 'SD') || (tag.ZK && 'ZK')))
        })
      }
      if ('SZInfo' in tag && tag.SZInfo.length) {
        if ('SZFilterArr' in tag && tag['SZFilterArr'].length > 0) {
          tag['SZFilterArr'].forEach(t => {
            if (t == nowGoods.itemNo || t == nowGoods.itemClsno) {
              
            }
          })
        }
        let realArr = tag.SZInfo.sort((a, b) => a - b)
        let msg
        if (tag['SZInfo'].length > 1) {
          msg = tag['SZInfo'].map((item, index) => {
            return `${index + 1}. 满￥${realArr[index]} 赠1样赠品：`,` ${tag['SZName'][index]}` 
          })
        } else {
          msg = [`满￥${realArr[0]}，赠1样赠品：`, `${tag['SZName'][0]}`] 
        }
        
        promotionList.push({
          name: '首单满赠',
          msg: msg,
          promotionNo: _this.addPromotionNo(nowGoods, 'SZ'),
          reachVal: tag.SZInfo[0]
        })
      }
      if (tag.MS && nowGoods['promotionCollections'].includes('MS')) {
        promotionList.push({
          name: '秒杀促销',
          msg: {[itemNo]: ('购买数量不超过 ' + tag.msMaxQty+ nowGoods.unit + ' 参与秒杀活动，特价￥' + tag.msPrice)},
          promotionNo: _this.addPromotionNo(nowGoods, 'MS')
        })
      }
      if(tag.BG && nowGoods['promotionCollections'].includes('BG')) {
        let msg = { name: ((tag.BG == 'cls' ? '类别' : (tag.BG == 'brand' ? '品牌' : '')) + '买赠'),msg:[] }
        const arr = res.BG[tag.BG][tag.BG == 'cls' ? itemClsno : (tag.BG == 'brand' ? brandNo : itemNo)]
        for (let i in arr) {
          const giftInfo = res.BG.giftGoods[arr[i]][i]
          console.log(giftInfo)
          msg.buyQty = giftInfo.buyQty
          msg.msg.push(giftInfo.explain ||  '满 ' + giftInfo.buyQty + nowGoods.unit + '送' + giftInfo.giftQty + nowGoods.unit + ' [' + giftInfo.giftName +']')
        }
        msg.qty = 0
        msg.promotionNo = _this.addPromotionNo(nowGoods, 'BG')
        promotionList.push(msg)
        console.log(msg, nowGoods, arr)
        console.log(res)
      }
      if('MQ' in tag && nowGoods['promotionCollections'].includes('MQ')) {
        const msg = `购买数量满${tag.MQ['buyQty'] + nowGoods.unit}减${tag.MQ['subMoney']}元`
        promotionList.push({
          name: '数量满减',
          msg: [msg],
          promotionNo: _this.addPromotionNo(nowGoods, 'MQ'),
          buyQty: tag['MQ'].buyQty,    // 满 buyQty 减 subMoney
          subMoney: tag['MQ'].subMoney,
          qty: 0  // 当前真实数量
        })
      }
      if (tag.MJ && nowGoods['promotionCollections'].includes('MJ')) {
        let msg = { name: (tag.MJ == 'fullReduction' ? '全场' : (tag.MJ == 'cls' ? '类别' : (tag.MJ == 'brand' ? '品牌' : '商品'))) + '满减',msg:[]}
        const arr = tag.MJ == 'fullReduction' ? res.MJ[tag.MJ] : res.MJ[tag.MJ][tag.MJ == 'cls' ? itemClsno : (tag.MJ == 'brand' ? brandNo : itemNo)]
        // console.log(arr)
        msg.promotionNo = _this.addPromotionNo(nowGoods, 'MJ')
        arr.forEach(info => {
          msg.msg.push(info.explain || '满'+info.reachVal +'减'+info.subMoney)
          if (info.sheetNo == nowGoods.currentPromotionNo) {
            msg.reachVal = info.reachVal
          }
          if (msg.promotionNo == info.sheetNo) {
            msg.reachVal = info.reachVal
          }
        })
        msg.msg = [msg.msg.join('，')]
        promotionList.push(msg)
      }
      if (tag.BF && nowGoods['promotionCollections'].includes('BF')) {
        const itemNo = nowGoods.itemNo
        const brandNo = nowGoods.itemBrandno
        const itemClsno = nowGoods.itemClsno
        const infoArr = [res.BF.all, res.BF.cls[itemClsno], res.BF.brand[brandNo], res.BF.goods[itemNo]]
        infoArr.forEach((item,i) => {
          if (item && item.length) {
            let name = (i==0?'全场':(i==1?'类别':(i==2?'品牌':'单品')))+'满赠'
            let msg = []
            let data
            let reachVal = []
            item.forEach(info => {
              msg.push(info.explain || ('满￥' + info.reachVal+',赠'+info.data.length+'样赠品'))
              data = info.data
              reachVal.push(info.reachVal)
            })
            reachVal.sort((a, b) => { a - b })
            promotionList.push({ name, msg, data, reachVal: reachVal[0], promotionNo: _this.addPromotionNo(nowGoods, 'BF')})
          }
        })
      }
      nowGoods = Object.assign(nowGoods, tag)
      this.promotionListLoaidng = true
      // console.log(deepCopy(nowGoods), tag)
      return promotionList
    },
    // 获取所有促销
    getAllPromotions(goodsData = this.data.goods) {
      const _this = this
      let allPromotion = {} // 所有促销挂载在此对象中，以促销单号作为键名
      let isSelectAll = true
      const cartsObj = wx.getStorageSync('cartsObj')
      // console.log(949,goodsData)
      if (this.sourceType == 0) { // 统配
        dispatch[types.GET_ALL_PROMOTION]({
          type: 'updata',
          success: (res) => {
            console.log('resaaa', deepCopy(res), deepCopy(goodsData.data))
            goodsData.data.forEach(nowGoods => {
              const cartsItem = cartsObj[nowGoods.itemNo]
              nowGoods.cancelSelected = cartsItem['cancelSelected'] 
              if (nowGoods.cancelSelected === true) {
                isSelectAll = false
              }
              // console.log(954,`${nowGoods.itemNo}`, nowGoods)
              const promotionList = _this.allPromotionHandle(res, nowGoods, _this) // 每个商品的 促销列表 
              console.log('promotionList', promotionList)
              promotionList.length && promotionList.forEach((item, index) => {
                console.log(9030,deepCopy(item), type)
                const type = item.promotionNo.slice(0, 2)
                if (allPromotion[item.promotionNo]) {
                  if (type == 'SD' || type == 'MS' || type == 'FS' || type == 'ZK') {
                    allPromotion[item.promotionNo].msg[nowGoods.itemNo] = item.msg[nowGoods.itemNo]
                  }
                  if (nowGoods['currentPromotionNo'] != item.promotionNo || nowGoods.cancelSelected) return 
                  if (type == 'MJ') {
                    allPromotion[item.promotionNo].price += nowGoods.realQty * nowGoods.price
                  } else if (type == 'BF') {
                    allPromotion[item.promotionNo].price += nowGoods.realQty * nowGoods.price
                  } else if (type == 'SZ') {
                    allPromotion[item.promotionNo].price += nowGoods.realQty * nowGoods.price
                  } else if (type == 'MQ' && nowGoods.currentPromotionType == 'MQ') {
                    allPromotion[item.promotionNo].qty += nowGoods.realQty
                  } else if (type == 'BG') {
                    allPromotion[item.promotionNo].qty += nowGoods.realQty
                  }
                } else {
                  allPromotion[item.promotionNo] = item
                  if (type == 'SD' || type == 'MS' || type == 'FS' || type == 'ZK') {
                    allPromotion[item.promotionNo].msg[nowGoods.itemNo] = item.msg[nowGoods.itemNo]
                  }
                  if (nowGoods['currentPromotionNo'] != item.promotionNo || nowGoods.cancelSelected) return allPromotion[item.promotionNo].price = 0
                  if (type == 'MJ') {
                    allPromotion[item.promotionNo].price = nowGoods.realQty * nowGoods.price
                  } else if (type == 'BF') {
                    allPromotion[item.promotionNo].price = nowGoods.realQty * nowGoods.price
                  } else if (type == 'SZ') {
                    allPromotion[item.promotionNo].price = nowGoods.realQty * nowGoods.price
                  } else if (type == 'MQ' && nowGoods.currentPromotionType == 'MQ') {
                    allPromotion[item.promotionNo].qty = nowGoods.realQty
                  } else if (type == 'BG') {
                    allPromotion[item.promotionNo].qty += nowGoods.realQty
                  }
                }
              })
            if (!nowGoods.cancelSelected) allPromotion = _this.isSatisfyPromotion(allPromotion) // 计算是否满足促销条件
            })
            console.log('resaaa', deepCopy(res), deepCopy(goodsData.data))
            console.log(111, deepCopy(allPromotion))
            this.data.allPromotion = allPromotion
            this.data.goods = goodsData
            _this.setData({ allPromotion, goods: goodsData, isSelectAll })
            hideLoading()
          },
          error:() => {
            hideLoading()
          }
        })
      } else { // 直配
        HANDLE_SUP_PROMOTION({
          data: goodsData,
          success(res) {
            console.log('resaaa2', deepCopy(res), deepCopy(goodsData.data))
            goodsData.data.forEach(nowGoods => {
              const cartsItem = cartsObj[nowGoods.itemNo]
              nowGoods.cancelSelected = cartsItem['cancelSelected'] 
              if (nowGoods.cancelSelected === true) {
                isSelectAll = false
              }
              const suplierPromotionList = _this.suplierPromotionHandle(res, nowGoods)
              suplierPromotionList.length && suplierPromotionList.forEach((item) => {
                console.log(item)
                const type = item.promotionNo.slice(0, 3)
                console.log(type)

                if (allPromotion[item.promotionNo]) {
                  if (type == 'RSD') {
                    allPromotion[item.promotionNo].msg[nowGoods.itemNo] = item.msg[nowGoods.itemNo]
                  }
                  if (nowGoods['currentPromotionNo'] != item.promotionNo || nowGoods.cancelSelected) return 
                  if (type == 'RMJ') {
                    // console.log(nowGoods.realQty * nowGoods.orgiPrice, allPromotion[item.promotionNo])
                    allPromotion[item.promotionNo].price += nowGoods.realQty * nowGoods.price
                  } else if (type == 'RBF') {
                    allPromotion[item.promotionNo].price += nowGoods.realQty * nowGoods.price
                  }
                } else {
                  allPromotion[item.promotionNo] = item
                  if (type == 'RSD') {
                    allPromotion[item.promotionNo].msg[nowGoods.itemNo] = item.msg[nowGoods.itemNo]
                  }
                  if (nowGoods['currentPromotionNo'] != item.promotionNo || nowGoods.cancelSelected) return allPromotion[item.promotionNo].price = 0
                  if (type == 'RMJ') {
                    allPromotion[item.promotionNo].price = nowGoods.realQty * nowGoods.price
                    
                  } else if (type == 'RBF') {
                    allPromotion[item.promotionNo].price = nowGoods.realQty * nowGoods.price
                  }
                }
              })
              console.log(deepCopy(allPromotion))
              if (!nowGoods.cancelSelected) allPromotion = _this.isSatisfyPromotion(allPromotion) // 计算是否满足促销条件
              console.log(allPromotion)
              _this.setData({ allPromotion, goods: goodsData, isSelectAll })
              _this.countMoney() // 计算购物车金额, 防止下拉刷新时获取不到最近的购物车金额
              hideLoading()
            })
          }
        })
      }
    },
    // 促销价格核对
    promoPriceCheck (item, ty) {
      if (ty=='BF'||ty=='BG'||ty=='MQ'||ty=='SZ'||ty=='MJ'||ty=='RMJ'||ty=='RBF'||ty=='BF') {
        item.price = item.orgiPrice
      } else if (ty=='MS') {
        if (item.msPrice && item.realQty <= item.msMaxQty ) {
          item.price = item.msPrice
        } else {
          item['price'] = item.orgiPrice
        }
      } else if (ty=='FS' && (item.sdMaxQty >= item.realQty)) {
        item.price = item.sdPrice
      } else if (ty=='SD' && (item.drMaxQty >= item.realQty)) {
        item.price = item.drPrice
      } else if (ty=='ZK' && (item.zkMaxQty >= item.realQty)) {
        item.price = item.zkPrice
      } else if (ty=='RSD' && (item.drMaxQty >= item.realQty)) {
        item.price = item.drPrice
      }
    },
    
    // 计算是否满足促销条件
    isSatisfyPromotion(allPromotion) {
      console.log(1, allPromotion)
      for(let key in allPromotion) {
        const t = allPromotion[key]
        if(key.includes('MJ') || key.includes('BF') || key.includes('SZ') || key.includes('RMJ') || key.includes('RBF')) {
          // if (key.includes('BF')) {console.log(key , deepCopy(t), t)}
          const realDifference = t.reachVal - t.price // 设置的满减(买满赠)值 - 当前单据价格（结果为负数则满足促销条件）
          switch(realDifference > 0) {
            case true:
              t.pInfo = `未满足，金额差￥${(realDifference).toFixed(2)}`
              break;
            case false:
              t.pInfo = '已满足'
              break;
          }
        } else if (key.includes('MQ') || key.includes('BG')) {
          const realDifference = t.buyQty - t.qty
          switch(realDifference > 0) {
            case true:
              t.pInfo = `未满足，差${parseInt(realDifference)}件商品`
              break;
            case false:
              t.pInfo = '已满足'
              break;
          }
        }
      }
      return allPromotion
    },
    
    // 下拉刷新
    pullUpdata() {
      showLoading()
      this.countMoney()
      this.getCommonSetting() // 获取送货开始和结束时间
      const { ww } = getApp().data
      this.ww = ww
      let goodsData = this.data.goods
      this.sourceType = goodsData.sourceType
      goodsData = this.addCurrentSelectedPromotion(goodsData) // 首次加载时，添加当前所选择的促销字段
      // console.log(goodsData)
      this.setData({ goods: goodsData })
      setTimeout(() => hideLoading(), 900)
    }
  },
  attached() {
    showLoading('请稍候...')
    this.countMoney()
    this.getCommonSetting() // 获取送货开始和结束时间
    const { ww } = getApp().data
    this.ww = ww
    let goodsData = this.data.goods
    console.log('goodsData', JSON.parse(JSON.stringify(goodsData)))
    this.sourceType = goodsData.sourceType
    goodsData = this.addCurrentSelectedPromotion(goodsData) // 首次加载时，添加当前所选择的促销字段
    console.log(deepCopy(goodsData.data))
    this.setData({ goods: goodsData })
    setTimeout(() => console.log(this.data.goods, this, getCurrentPages()), 1200)
  }
})
