import { toast, alert, setFilterDataSize, goPage, showLoading, hideLoading, getGoodsImgSize, MsAndDrCount, getGoodsTag } from '../../tool/index.js'
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
    isSelectAll: true,
    cartsMoney: 0,
    selectNum: 0,
    selectTypeNum: 0,
    partnerCode: app.data.partnerCode,
    currentPromotion: ["NO"], // 当前所选择的促销 
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

    // 获取系统配置(送货开始和结束时间)
    getCommonSetting() {
      const _this = this
      const { platform, username, branchNo, token } = wx.getStorageSync('userObj')
      API.Public.getCommonSetting({
        data: { platform, username, branchNo, token },
        success(res) {
          console.log(res)
          let {orderEndDate, orderStartDate} = res.data, // 开始 / 结束时间
          nowDate = tim()      // 当前时间
          if (!(orderEndDate && orderStartDate)) return
          if ((orderEndDate == '0:00:00' || orderEndDate == '00:00:00') && (orderStartDate == '00:00:00' || orderStartDate == '0:00:00')) return 
          if (nowDate == '00:00:00') nowDate = '0:00:00' 

          const { nowH, nowM, startH, startM, endH, endM } = _this.timer(nowDate, orderStartDate, orderEndDate) // 处理时间

          console.log(orderEndDate, orderStartDate, nowDate)
          console.log(nowH > startH , nowH < endH, nowH == startH)
          console.log(nowH , endH, Number(nowH) < Number(endH))
          // 在时间区间内
          if ((nowH > startH && nowH < endH) || ((nowH == startH && nowM > startM) || (nowH == endH && nowM < endM))) return 

          _this.setData({ 
            transDateObj: {isShow: true, date: `${orderStartDate} - ${orderEndDate}`}
          })
          console.log('进入')
        },
        error(res) {
          console.log(res)
        }
      })
    },
    inputBlur (e) {
      let goods = this.data.goods 
      this.setData({ goods })
    },
    inputConfirm(e) {
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
          this.countMoney()
        } else {
          this.triggerEvent('deleteCarts', cartsObj.type)
        }
      } else  {
        const newCarts = dispatch[types.CHANGE_CARTS]({ goods, type, config, value })
        if (newCarts) {
          cartsObj.data[index].realQty = newCarts[goods.itemNo].realQty
          MsAndDrCount(goods, newCarts[goods.itemNo], type)
          this.setData({ goods: cartsObj })
          this.countMoney()
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
      cartsObj.keyArr.forEach(itemNo => items.push(cartsObj[itemNo]))
      items = JSON.stringify(updateCarts ? items : [])
      console.log(items, itemNos)
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
              this.setData({ goods: cartsObj })
              this.countMoney()
            } else {
              this.triggerEvent('refreshCarts')
              this.triggerEvent('deleteCarts', cartsObj.type)
            }
            
          }
        }
      })
      
    },
    saveLiquidationObj(data, replenish) {
      console.log('保存购物车 data 数据' ,data)
      const { zhGoodsUrl, goodsUrl, zcGoodsUrl } = getApp().data
      const sourceType = data.items[0].sourceType
      const replenishNo = this.data.isReplenish
      data.items[0].datas.forEach(goods => {
        const imgUrl = (sourceType == '0' ? (goods.specType == '2' ? zhGoodsUrl : goodsUrl) : zcGoodsUrl)
        goods.goodsImgUrl = imgUrl + goods.itemNo + '/' + getGoodsImgSize(goods.picUrl)
        goods.subtotal = Number((goods.price * goods.realQty).toFixed(2))
        goods.itemType = goods.promotionType =='BD'?'0': '1'
      })
      wx.setStorageSync('liquidationObj', data)
      console.log('保存购物车 data 数据之后的' ,data)
      console.log('this.data.goods.cartsType' ,this.data.goods.cartsType)
      console.log(replenish,replenishNo)
      console.log()
      goPage('liquidation', { cartsType: this.data.goods.cartsType, replenish, replenishNo })
    },
    goGoodsDetails(e) {
      const index = e.currentTarget.dataset.index
      const cartsObj = this.data.goods
      const goods = cartsObj.data[index]
      goPage('goodsDetails', {
        itemNo: goods.itemNo,
        supcustNo: cartsObj.cartsType == 'sup' ? cartsObj.sourceNo:''
      })
    },
    countMoney() {
      let cartsMoney = 0
      let selectNum = 0
      let selectTypeNum = 0
      let isSelectAll = this.data.isSelectAll
      const cartsObj = this.data.goods
      cartsObj.data.map(goods => {
        if (!goods.cancelSelected) {
          cartsMoney = Number((cartsMoney + (goods.price * goods.realQty)).toFixed(2))
          selectNum += goods.realQty
          if (String(selectNum).includes('.')) selectNum = Number(Number(selectNum).toFixed(1))
          selectTypeNum += 1
        }
      })
      cartsObj.data.length === selectTypeNum && (isSelectAll = true)
      this.setData({ cartsMoney, selectNum, selectTypeNum, isSelectAll })
    },
    selectAllGoods() {
      let goods = this.data.goods
      let selectObj = {}
      const isSelectAll = !this.data.isSelectAll
      goods.data.forEach(item => {
        item.cancelSelected = !isSelectAll
      })
      this.setData({ isSelectAll, goods })
      this.countMoney()
    },
    selectGoods(e) {
      const index = e.currentTarget.dataset.index
      let { goods, isSelectAll } = this.data
      const is = !goods.data[index].cancelSelected
      goods.data[index].cancelSelected = is
      if (is) isSelectAll = false
      this.setData({ goods, isSelectAll })
      this.countMoney()
    },
    changeGoodsNum(e) {
      const index = e.currentTarget.dataset.index
      const type = e.currentTarget.dataset.type
      let cartsObj = this.data.goods
      const goods = cartsObj.data[index]
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
                this.countMoney()
              } else {
                this.triggerEvent('deleteCarts', cartsObj.type)
              }
            }
          }
        })
      } else {
        const newCarts = dispatch[types.CHANGE_CARTS]({ goods, type, config })
        if (newCarts) {
          cartsObj.data[index].realQty = newCarts[goods.itemNo].realQty
          MsAndDrCount(goods, newCarts[goods.itemNo], type)
          this.setData({ goods: cartsObj })
          this.countMoney()
        } else {
          return
        }
      }
      console.log('商品数量更改')
    },
    // 请求直配商品促销数据
    getSupplierAllPromotion(branchNo, token, platform, username, goodsData){
      API.Public.getSupplierAllPromotion({
        data: { branchNo, token, platform, username, supplierNo: goodsData.sourceNo },
        success: res => {
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
            goodsData.data.forEach(item => {
              console.log(item)
              if ('promotionCollections' in goods && item.promotionCollections.includes('RMJ')) item['RMJ'] = '满减商品'
              if ('promotionCollections' in goods && item.promotionCollections.includes('RBF')) item['RBF'] = '满赠商品'
              if ('promotionCollections' in goods && item.promotionCollections.includes('RSD')) item['RSD'] = '限时抢购'
              // 直配限时购买信息
              for (let key in supplierPromotion) {
                if (item['itemNo'] == key) {
                  supplierPromotion[key].startDate = supplierPromotion[key].startDate.slice(0, 10)
                  supplierPromotion[key].endDate = supplierPromotion[key].endDate.slice(0, 10)
                  supplierPromotion[key].limitedQty = supplierPromotion[key].limitedQty
                  item['todayPromotion'] = supplierPromotion[key]
                }
              }
            })
          }
          this.setData({ goods: goodsData })
        }
      })
    },
    
    // 商品中添加当前所选择的促销字段 currentPromotion
    addCurrentSelectedPromotion(goodsData = this.data.goods) {
      let currentPromotion = this.data.currentPromotion  // 当前购物车商品的所选择促销数组
      let currentPromotionNo = ['']  // 当前购物车商品的所选择促销单据数组 
      const sourceType = Number(goodsData.sourceType)  // 0: 统配, 1: 直配

      goodsData.data.forEach((item, i) => {
        // 首次加载，默认选第一个促销
        if (item['promotionCollections']) {
          if (item['promotionCollections'].indexOf(',')) {
            item['promotionCollectionsArr'] = item['promotionCollections'].split(',')
          } else if (item['promotionCollections'] == '') {
            item['promotionCollectionsArr'] = [item['promotionCollections']]
          }
          
          item['currentPromotionNo'] = item['promotionCollectionsArr'][0]
          
          
          let backSign
          currentPromotion.length && currentPromotion.forEach((t, index) => {
            if (t.currentPromotionNo == item.currentPromotionNo) backSign = 'return'
          })
          console.log(item, 'backSign')
          let promoObj = {} 
          switch(sourceType) { // 0: 统配, 1: 直配
            case 0:
              item['currentPromotionType'] = item['currentPromotionNo'].slice(0, 2)
              if (backSign == 'return') return   // 不保留重复的单据
              promoObj.type = item['currentPromotionNo'].slice(0, 2)
              promoObj.currentPromotionNo = item['currentPromotionNo']
              currentPromotion.unshift(promoObj)
              break;
            case 1:
              item['currentPromotionType'] = item['currentPromotionNo'].slice(0, 3)
              if (backSign == 'return') return   // 不保留重复的单据
              promoObj.type = item['currentPromotionNo'].slice(0, 3)
              promoObj.currentPromotionNo = item['currentPromotionNo']
              currentPromotion.unshift(promoObj)
              break;
          }
        }
      })
      // console.log('currentPromotion', currentPromotion)
      // console.log('addCurrentSelectedPromotion', goodsData)

      this.data.currentPromotion = currentPromotion
      this.data.currentPromotionNo = currentPromotionNo
      this.setData({ currentPromotion, currentPromotionNo })
      return goodsData
    },
    // 获取所有促销信息
    getAllPromotion(goodsData) {
      dispatch[types.GET_ALL_PROMOTION]({
        success(res) {
          goodsData.promotionType = []
          goodsData.data.forEach((goodObj, index) => {
            console.log('促销信息', res)
            const tag = getGoodsTag(goodObj, res)
            console.log(tag)
            goodsData.data[index] = Object.assign(goodObj, tag)
            goodsData.promotionType.push(tag)
          })
        }
      })
    },
    /* 返回对应促销的 促销编号
     *  nowGoods： 商品 Obj
     *  tag: 促销 type
     */ 
    addPromotionNo(nowGoods, tagType) {
      const promotionCollectionsArr = nowGoods.promotionCollectionsArr
      console.log(nowGoods,promotionCollectionsArr)
      let promoIndex
      promotionCollectionsArr.forEach((item, index) => {
        if (item.includes(tagType)) promoIndex = index
      })
      return promotionCollectionsArr[promoIndex]
    },
    // 对所有促销信息进行处理
    allPromotionHandle(res, nowGoods, _this) {
      // console.log(nowGoods)
      const tag = getGoodsTag(nowGoods, res)
      const itemNo = nowGoods.itemNo
      const brandNo = nowGoods.itemBrandno || nowGoods.itemBrandNo
      const itemClsno = nowGoods.itemClsno
      let promotionList = []
      let BFpromotionList = []
      console.log('这是tag SZZZZZZZZZZZZZZZZZZZZZZZZZZZ', tag)
      if (tag.FS || tag.SD || tag.ZK) {
        nowGoods.orgiPrice = nowGoods.price
        nowGoods.price = tag.price
        promotionList.push({
          name: tag.FS ? '首单特价' : (tag.SD ? '单日限购' : (tag.zkType + '折扣')),
          msg: [(tag.FS ? ('活动期间,首次下单且购买数量不超过 '+ tag.sdMaxQty + nowGoods.unit +' 享受优惠价格￥'+tag.sdPrice) : (tag.SD ? ('购买数量不超过 ' + tag.drMaxQty + nowGoods.unit + ' 参与促销活动，特价￥' + tag.drPrice) : ('当前' + tag.zkType + '下单立即享受' + tag.discount + '优惠')))],
          promotionNo: _this.addPromotionNo(nowGoods, ((tag.FS && 'FS') || (tag.SD && 'SD') || (tag.ZK && 'ZK')))
        })
      }
      if ('SZInfo' in tag && tag.SZInfo.length) {
        console.log(tag)
        console.log(tag.SZInfo)
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
          promotionNo: _this.addPromotionNo(nowGoods, 'SZ')
        })
      }
      if (tag.MS) {
        promotionList.push({
          name: '秒杀促销',
          msg: [('购买数量不超过 ' + tag.msMaxQty+ nowGoods.unit + ' 参与秒杀活动，特价￥' + tag.msPrice)],
          promotionNo: _this.addPromotionNo(nowGoods, 'MS')
        })
      }
      if(tag.BG) {
        console.log(tag, nowGoods, res)
        let msg = { name: ((tag.BG == 'cls' ? '类别' : (tag.BG == 'brand' ? '品牌' : '')) + '买赠'),msg:[] }
        const arr = res.BG[tag.BG][tag.BG == 'cls' ? itemClsno : (tag.BG == 'brand' ? brandNo : itemNo)]
        for (let i in arr) {
          const giftInfo = res.BG.giftGoods[arr[i]][i]
          msg.msg.push(giftInfo.explain ||  '满 ' + giftInfo.buyQty + nowGoods.unit + '送' + giftInfo.giftQty + nowGoods.unit + ' [' + giftInfo.giftName +']')
        }
        msg.promotionNo = _this.addPromotionNo(nowGoods, 'BG')
        promotionList.push(msg)
      }
      if('MQ' in tag) {
        const msg = `购买数量满${tag.MQ['buyQty'] + nowGoods.unit}减${tag.MQ['subMoney']}元`
        promotionList.push({
          name: '数量满减',
          msg: [msg],
          promotionNo: _this.addPromotionNo(nowGoods, 'MQ')
        })
      }
      if (tag.MJ) {
        console.log(tag, 'sadasdass')
        let msg = { name: (tag.MJ == 'fullReduction' ? '全场' : (tag.MJ == 'cls' ? '类别' : (tag.MJ == 'brand' ? '品牌' : '商品'))) + '满减',msg:[] }
        const arr = tag.MJ == 'fullReduction' ? res.MJ[tag.MJ] : res.MJ[tag.MJ][tag.MJ == 'cls' ? itemClsno : (tag.MJ == 'brand' ? brandNo : itemNo)]
        arr.forEach(info => {
          msg.msg.push(info.explain || '满'+info.reachVal +'减'+info.subMoney)
        })
        msg.msg = [msg.msg.join('，')]
        console.log(tag, 'sadasdass')
        msg.promotionNo = _this.addPromotionNo(nowGoods, 'MJ')
        promotionList.push(msg)
        console.log(msg, 'sadasdass')
      }
      if (tag.BF) {
        const itemNo = nowGoods.itemNo
        const brandNo = nowGoods.itemBrandno
        const itemClsno = nowGoods.itemClsno
        const infoArr = [res.BF.all, res.BF.cls[itemClsno], res.BF.brand[brandNo], res.BF.goods[itemNo]]
        infoArr.forEach((item,i) => {
          if (item && item.length) {
            let name = (i==0?'全场':(i==1?'类别':(i==2?'品牌':'单品')))+'满赠'
            item.forEach(info => {
              BFpromotionList.push({
                name,
                msg: [info.explain || ('满￥' + info.reachVal+',赠'+info.data.length+'样赠品')],
                data: info.data,
                promotionNo: _this.addPromotionNo(nowGoods, 'BF')
              })
            })
            item.forEach(info => {
              promotionList.push({
                name,
                msg: [info.explain || ('满￥' + info.reachVal+',赠'+info.data.length+'样赠品')],
                data: info.data,
                promotionNo: _this.addPromotionNo(nowGoods, 'BF')
              })
            })
          }
        })
      }
      nowGoods = Object.assign(nowGoods, tag)
      // this.setData({ promotionList, goods: nowGoods, BFpromotionList})
      this.promotionListLoaidng = true
      // this.countPrice()
      if (nowGoods.rewardPoint > 0) {
        promotionList.push({
          name: '积分',
          msg: ['每买' + nowGoods.buyQty + nowGoods.unit + '获得' + nowGoods.rewardPoint + '积分']
        })
        // this.setData({ promotionList })
      }
      console.log('promotionList', promotionList)
      console.log(nowGoods)
      console.log('nowGoodstag', tag)

      return promotionList
    },
    // 获取所有促销
    getAllPromotions(goodsData = this.data.goods) {
      const _this = this
      dispatch[types.GET_ALL_PROMOTION]({
        success: (res) => {
          console.log('res', res)
          let allPromotion = _this.data.allPromotion // 所有促销挂载在此对象中，以促销单号作为键名
          goodsData.data.forEach(nowGoods => {
            const promotionList = _this.allPromotionHandle(res, nowGoods, _this)
            promotionList.length && promotionList.forEach((item, index) => {
              allPromotion[item.promotionNo] = item
            })
          })
          _this.setData({ allPromotion })
        }
      })
    },
  },
  
  attached() {
    console.log(this)
    this.countMoney()
    this.getCommonSetting() // 获取送货开始和结束时间
    const { ww } = getApp().data
    this.ww = ww
    let goodsData = this.data.goods
    console.log('jsongoodsData', JSON.parse(JSON.stringify(goodsData)))
    this.getAllPromotion(goodsData) // 获取所有促销信息
    goodsData = this.addCurrentSelectedPromotion(goodsData) // 首次加载时，添加当前所选择的促销字段
    console.log(this)
    this.getAllPromotions(goodsData) // 处理所有促销(直配)
    console.log('这是 goods(cars-item):', goodsData)
    if (goodsData.sourceType == 1) {
      let supplierPromotion = wx.getStorageSync('supplierPromotion')
      // 缓存中无直配促销信息，请求促销接口。有促销信息则直接使用
      if (!supplierPromotion) {
        const { branchNo, token, platform, username } = wx.getStorageSync('userObj')
        this.getSupplierAllPromotion(branchNo, token, platform, username, goodsData)
      } else {
        goodsData.data.forEach(item => { // 商品对象中 添加促销信息
          if ('promotionCollections' in item && item.promotionCollections.includes('RMJ')) item['RMJ'] = '满减商品'
          if ('promotionCollections' in item && item.promotionCollections.includes('RBF')) item['RBF'] = '满赠商品'
          if ('promotionCollections' in item && item.promotionCollections.includes('RSD')) item['RSD'] = '限时抢购'
          // 直配限时购买信息
          for (let key in supplierPromotion) {
            if (item['itemNo'] == key) {
              supplierPromotion[key].startDate = supplierPromotion[key].startDate.slice(0, 10)
              supplierPromotion[key].endDate = supplierPromotion[key].endDate.slice(0, 10)
              supplierPromotion[key].limitedQty = supplierPromotion[key].limitedQty
              item['todayPromotion'] = supplierPromotion[key]
            }
          }
        })
      }
    }
    this.setData({ goods: goodsData })
    setTimeout(() => console.log(this.data.goods, this), 1200)
  }
})
