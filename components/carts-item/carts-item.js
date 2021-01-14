import { toast, alert, setFilterDataSize, goPage, showLoading, hideLoading, getGoodsImgSize, MsAndDrCount } from '../../tool/index.js'
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
    inputBlurActive: false, // 当 inputBlur 在激活中(true)时，不能直接结算
    leftAnimation: false,
    isSelectAll: true,
    cartsMoney: 0,
    selectNum: 0,
    selectTypeNum: 0,
    partnerCode: app.data.partnerCode,
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
          if (!('orderEndDate' in res.data && 'orderStartDate' in res.data)) return 
          let {orderEndDate, orderStartDate} = res.data, // 开始 / 结束时间
          nowDate = tim()      // 当前时间

          if ((orderEndDate == '0:00:00' || orderEndDate == '00:00:00') && (orderStartDate == '0:00:00' || orderStartDate == '00:00:00')) return 
          if (nowDate == '00:00:00') nowDate = '0:00:00' 

          const { nowH, nowM, startH, startM, endH, endM } = _this.timer(nowDate, orderStartDate, orderEndDate) // 处理时间格式

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
      this.data.inputBlurActive = false
    },
    inputNum() {
      this.data.inputBlurActive = true
      console.log(this.data.inputBlurActive)
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
      
      this.data.inputBlurActive = false
      console.log(this.data.inputBlurActive)
    },
    setSize(rex) {
      return (rex / 750) * this.ww
    },
    touchstart(e) {
      console.log(1)
      const clientX = e.changedTouches[0].clientX
      this.startPoint = clientX
      this.setData({ leftAnimation: false })
    },
    touchend(e) {
      console.log(2)
      const index = e.currentTarget.dataset.index
      const leftAnimation = true
      let goods = this.data.goods
      const left = (goods.data[index].goodsLeft >= this.setSize(180) / 2) ? this.setSize(180) : 0
      goods.data[index].baseGoodsLeft = left
      goods.data[index].goodsLeft = left
      this.setData({ goods, leftAnimation })
    },
    touchmove(e) {
      console.log(this.touchmoveTimer)
      if (this.touchmoveTimer) return
      this.touchmoveTimer = setTimeout(() => { this.touchmoveTimer = false }, 120)
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
      console.log(this.data.inputBlurActive)
      if (this.data.inputBlurActive) {
        return this.data.inputBlurActive = false
      }
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
      console.log(this)
      const { zhGoodsUrl, goodsUrl, zcGoodsUrl } = getApp().data
      const sourceType = data.items[0].sourceType
      const replenishNo = this.data.isReplenish
      // 按加购时间排序
      const partnerCode = getApp().data.partnerCode
      if (partnerCode == 1027 || partnerCode == 1057) {
        data.items[0].datas.sort((a, b) => {
          let aDate = Number(a.createDate)
          let bDate = Number(b.createDate)
          return aDate - bDate
        })
      }
      data.items[0].datas.forEach(goods => {
        const imgUrl = (sourceType == '0' ? (goods.specType == '2' ? zhGoodsUrl : goodsUrl) : zcGoodsUrl)
        goods.goodsImgUrl = imgUrl + goods.itemNo + '/' + getGoodsImgSize(goods.picUrl)
        goods.subtotal = Number((goods.price * goods.realQty).toFixed(2))
        goods.itemType = goods.promotionType =='BD'?'0': '1'
      })
      wx.setStorageSync('liquidationObj', data)
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
      showLoading()
      const index = e.currentTarget.dataset.index
      let { goods, isSelectAll } = this.data
      const is = !goods.data[index].cancelSelected
      goods.data[index].cancelSelected = is
      if (is) isSelectAll = false
      this.setData({ [`goods.data[${index}].cancelSelected`]: is, isSelectAll }, () => { hideLoading() })
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
          this.setData({ goods: goodsData })
        }
      })
    }
  },
  
  attached() {
    this.countMoney()
    this.getCommonSetting() // 获取送货开始和结束时间
    const { ww } = getApp().data
    this.ww = ww
    const _this = this
    let goodsData = this.data.goods
    // if ('viewData' in goodsData) {
    //   goodsData = _this.data.goods
    //   _this.loadingMore = setInterval(() => {
    //     const newGoodsData = goodsData['data'].slice(0, goodsData['viewData'].length + 30)
    //     _this.data.goods['viewData'] = newGoodsData
    //     _this.setData({ [`goods.viewData`]: newGoodsData })
    //     console.log(goodsData)
    //     if (goodsData['data'].length === goodsData['viewData'].length) clearInterval(_this.loadingMore)
    //   }, 6000)
    // }
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
        this.setData({ goods: goodsData })
      }
    }
  }
})
