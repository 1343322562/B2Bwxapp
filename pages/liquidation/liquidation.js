import { toFixed, showLoading, hideLoading, getGoodsImgSize, deepCopy, getGoodsTag, arrRemoveRepeat, toast, alert, getTime,goPage } from '../../tool/index.js'
import API from '../../api/index.js'
import { tim, timCurrentDay } from '../../tool/date-format.js'
const app = getApp()
Page({
  data: {
    replenish: '', // 补货: true
    partnerCode: app.data.partnerCode,
    goodsList: [], // 商品列表
    storedValue: 0, // 余额储值
    totalMoney: 0, // 商品总金额
    totalNum: 0, // 普通商品总数量
    discountsMoney: 0,// 优惠总金额
    sourceType: '',        // 配送方式  0 统配 1 直配
    couponsList: [],       // 优惠券列表
    dhCouponsList: [],     // 兑换券列表
    selectedCoupons: null, // 所选优惠券
    ticketType: 0,         // 发票类型 0 不开发票  1 个人 2增值税普通发票
    selectedDhCoupons: { keyArr: [], num: 0 }, // 所选兑换券
    BGnum:  0, // 买赠数量
    isInvoice:'',// 是否开启发票
    realPayAmt: 0, // 实付金额
    mjObj: [], // 满减数据
    giftList: [], // 选择赠品列表
    selectedGift: {}, // 所选的赠品
    selectedGiftNum: 0, // 所选的赠品组数
    showSelectCoupons: false, // 显示优惠券
    showSelectMzgoods: false, // 显示选择满赠
    showSelectDhCoupons: false, // 显示兑换券
    wxPayRate:'', // 微信手续费率
    wxPayRateOpen:'0',  // 微信手续费开关
    memo: '', // 备注
    payWayList: [
      { name: '储值支付', type:'2',icon:'yue',show:false},
      { name: '微信支付', type: '1', icon: 'wx',show:false },
      { name: '货到付款', type: '0', icon: 'hdfk',show:false }
    ],
    transportFeeChoiceWay: '',  // 配送方式配送费选择 0:配送  3:物流  4：配送和物流
    transportFeeType: '', // 配送费计算方式 0：没有配送费 1：按照固定金额 2：按照订单比例 
    transportFeeAmt: 0, // 配送费
    transportFee: '',
    isUseBlendWay: false, // 是否使用混合支付
    payWay: '', // 支付方式 0货到付款 1在线支付 2储值支付 4混合支付
    isPickDate: 0, // 自提点时间选择 0: 关闭 ，开启时默认当前时间
    selectedStoreTime: false, // 是否显示 自提时间 picker
    storeTime: 'yyyy-mm-dd hh', // 自提时间
    deliveryType: 0 // 配送方式   0 配送  1 自提  2 补货 3 第三方物流
  },
  // 选择配送方式 0 配送  1 自提 3 第三方物流
  selectTransWayClick(e) {
    console.log(e)
    const deliveryType = Number(e.currentTarget.dataset.type)
    this.data.deliveryType = deliveryType
    console.log(deliveryType)
    const { transportFeeType }= wx.getStorageSync('configObj')
    const tWay = Number(this.data.transportFeeChoiceWay)
    let transportFeeAmt = 0 
    if (deliveryType != 1 && transportFeeType != 0 && (tWay === deliveryType || tWay === 4))  transportFeeAmt = this.transportFeeHandle('',deliveryType)
    if (deliveryType == 1) return this.setData({ transportFeeAmt ,deliveryType, selectedStoreTime: true, storeTime: this.getStoreDefaultTime() })
    this.setData({ deliveryType, transportFeeAmt })
  },
  showStoreTime() {
    this.setData({ selectedStoreTime: true })
  },

  // 设置备注
  getMemo (e) {
    this.setData({ memo: e.detail.value.trim().replace(/\t|\n|\v|\r|\s*|\f/g,'')})
  },
  checkboxChange (e) {
    console.log(e)
    let isUseBlendWay = e.detail.value[0] ? true : false
    const payWayList = this.data.payWayList
    const newPayWay = payWayList[1].show ? '1' : (payWayList[2].show ? '0' : '')
    if (isUseBlendWay && newPayWay) {
      this.changePayWay(newPayWay)
    } else if (isUseBlendWay&&!newPayWay) {
      toast('没有其他的支付方式了')
      isUseBlendWay= false
    } else {
      this.changePayWay('2','auto')
    }
    console.log('isUseBlendWay', isUseBlendWay)
    this.setData({ isUseBlendWay })
  },
  showCoupons () {
    const { couponsList,payWay } = this.data
    if (payWay == '0' && this.autoCoupons =='0') {
      toast('货到付款不支持使用优惠券')
    } else if (!couponsList.length) {
      toast('暂无可用优惠券')
    }else{
      this.setData({ showSelectCoupons: true })
    }
  },
  showDhCoupons () {
    let dhCouponsList = this.data.dhCouponsList
    dhCouponsList = Array.from(dhCouponsList)
    console.log(dhCouponsList)
    if (!dhCouponsList.length) {
      toast('暂无可用兑换券')
    } else {
      dhCouponsList.forEach(item => {
        item.num = item.num || 0
      })
      this.setData({ showSelectDhCoupons: true, dhCouponsList })
    }
  },
  // 点击满赠 ,支付方式为 货到付款时，不支持满赠，并提示用户
  showGiftList () {
    const { payWay } = this.data
    if (payWay == '0' && this.codPayMzFlag == '0') {
      toast('货到付款不支持买满赠')
    } else {
      this.setData({ showSelectMzgoods: true })
    }
  },
  selectCoupons (e) {
    const selectedCoupons = e.detail
    const showSelectCoupons = false
    this.setData({ showSelectCoupons, selectedCoupons })
    this.setOrderAction()
  },
  selectDhCoupons (e) {
    console.log(e)
    let list = e.detail.keyArr.length == 0 ? [] : e.detail.list  // 兑换卷数组
    console.log(list)
    const dhList = e.detail
      
    console.log(list)
    const obj = deepCopy(this.liquidationObj)
    console.log('购物车', obj)
    let requestItemList = []
    let totalMoney = 0
    let totalNum = 0
    let types

    console.log(dhList, obj)
    if (JSON.stringify(dhList) == JSON.stringify(this.data.selectedDhCoupons)) {
      this.setData({ showSelectDhCoupons: false})
    } else {
      let goodsList = obj.items[0].datas.filter(goods => {
        const itemNo = goods.itemNo
        const dhIndex = dhList.keyArr.indexOf(itemNo)
        let data = { itemNo: itemNo, qty: String(goods.realQty), price: String(goods.price) }
        if (goods.itemType=='0') {
          data.clsNo = goods.itemClsno
          data.brandNo = goods.itemBrandno || ''
        }
        if (dhIndex != -1) {
          const nowQty = goods.realQty - dhList[itemNo].num
          if (nowQty <= 0) {
            types = false
          } else {
            data.qty = String(nowQty)
            goods.realQty = nowQty
            requestItemList.push(data)
            types = true
          }
        } else {
          requestItemList.push(data)
          types = true
        }
        if (types) {
          totalMoney += Number((goods.realQty * goods.price).toFixed(2))
          totalNum += goods.realQty
        }
        return types
      })
      this.clearAllPromotion()
      requestItemList = JSON.stringify(requestItemList)
      showLoading('刷新促销...')
      this.getMjMz(requestItemList)
      this.getCoupons(requestItemList)
      this.setData({
        showSelectDhCoupons: false,
        selectedDhCoupons: dhList,
        goodsList,
        totalVariety: goodsList.length,
        totalMoney: Number(totalMoney.toFixed(2)),
        totalNum
      })
      if (!list.length) {
        list = this.data.dhCouponsList
        list.forEach(item => {
          item.num = 0
        })
      }
      this.data.dhCouponsList = list
    }
  },
  changePayWay (e,auto) {
    
    console.log(e,auto)
    let payWay = typeof e =='object'? e.currentTarget.dataset.type:e
    let { selectedCoupons, mjObj, selectedGiftNum, selectedGift, payWay: nowPayWay, storedValue, realPayAmt, isUseBlendWay } = this.data
    // console.log(186,this.data, this.data.nowPayWay, this.data.payWay)
    console.log(payWay, nowPayWay)
    console.log(storedValue)
    if (isUseBlendWay && payWay == '2' && auto!='auto')return
    if (payWay=='0') {
      let msg = []
      if (this.autoCoupons == '0' && selectedCoupons && selectedCoupons!='no') {
        msg.push(msg.length+1+': '+'优惠券')
        selectedCoupons = null
      }
      if (this.codPayMjFlag == '0' && mjObj.length) {
        msg.push(msg.length + 1 + ': ' + '买满减')
        mjObj = []
      }
      if (this.codPayMzFlag == '0' && selectedGiftNum) {
        msg.push(msg.length + 1 + ': ' + '买满赠')
        selectedGiftNum = 0
        selectedGift = {}
      }
      if (msg.length) {
        alert('货到付款不享受以下优惠\r\n'+msg.join('\r\n'), {
          title: '温馨提示',
          showCancel: true,
          confirmText: '确定',
          success: ret => {
            if (ret.confirm) {
              this.setData({ selectedCoupons, mjObj, selectedGiftNum, selectedGift })
              this.switchPayWay(payWay)
            }
          }
        })
        return
      }
    } else if (nowPayWay =='0') {
      const selectedGift = this.baseSelectedGift || {}
      const selectedGiftNum = Object.keys(selectedGift).length
      this.setData({ selectedGift, selectedGiftNum})
    }
    this.switchPayWay(payWay)
    console.log(225, payWay)
  },
  switchPayWay(payWay) {
    console.log(payWay)
    this.setData({ payWay })
    this.setOrderAction()
  },
  // 确认 赠品
  selectGift (e) {
    const selectedGift = e.detail
    const showSelectMzgoods = false
    const selectedGiftNum = Object.keys(selectedGift).length
    selectedGiftNum || (this.selectedGiftType = 'no')
    this.baseSelectedGift = selectedGift
    console.log({ selectedGift, showSelectMzgoods, selectedGiftNum })
    this.setData({ selectedGift, showSelectMzgoods, selectedGiftNum })
  },
  getUserInfo () {
    const { branchNo, token, platform, username} = this.userObj
    API.Public.getAccBranchInfoAmt({ // 获取余额信息
      data: { branchNo, token, platform, username},
      success: res => {
        if (res.code == 0 && res.data){
          const money = res.data.czAmt
          this.setData({ storedValue: money < 0 ? 0 : money })
        }
      }
    })
  },
  // 直配 满减满赠 数据获取(itemList: 支付商品信息,supplier：入驻商编号)
  getSupplierMjMz(itemList, supplierNo) {
    console.log("mjList:", itemList)
    const { branchNo, token, username, platform, dbBranchNo: dbranchNo } = this.userObj
    API.Liquidation.getSupplierSettlementPromotion({
      data:{ branchNo, token, username, platform, supplierNo, dbranchNo, data: itemList },
      success: res => {
        if (res.code == 0 && res.data) {
          let obj = {}
          let giftList = []
          let mjList = []
          res.data.forEach(item => {
            const type = item.promotionType
            // 满赠 || 满减 数据对象赋值
            if (type == 'RMJ') {
              mjList.push(item)
            } else if ( type == 'RBF') {
              giftList.push(item)
            }
          })
          this.baseMj = mjList // 挂载满减信息对象
          obj.giftList = giftList
          this.setData(obj)
        }
      },
      complete: () => {
        this.mjmzLoading = true
        this.setOrderAction()
      }
    })
  },
  // 统配 满减满赠 数据获取( itemList: 支付商品信息)
  getMjMz(itemList) {
    console.log(itemList, 'itemlist..')
    
    console.log(this.data.goodsList)
    const { branchNo, token, username, platform, dbBranchNo: dbranchNo } = this.userObj
    API.Liquidation.getSettlementPromotion({
      data: { branchNo, token, platform, username, dbranchNo, data: itemList },
      success: res => {
        console.log(res, 253253253253)
        if (res.code == 0 && res.data) {
          let obj = {}
          let giftList = []
          let mjList = []
          res.data.forEach(item => {
            const type = item.promotionType
            if (type == 'MJ') {
              mjList.push(item)
            } else if (type == 'SZ') {
              let goodsList = this.data.goodsList
              console.log(goodsList, item)
              let data = res.data
              let isSZ = false
              goodsList.forEach(t => {
                isSZ = t.stockType == '0' ? true : false 
              })
              data[0].items[0].items.forEach(t => {
                if ((t.giftType == item.stockType) || isSZ) {
                  giftList.push(item)
                }
              })
            } else if (type == 'MQ') {
              mjList.push(item)
              // goodsList.push({ promotionType: type })
            } else if (type == 'BG') {
              const BG = this.promotionObj.BG.giftGoods
              let goodsList = this.data.goodsList
              let BGnum = 0
              item.items.forEach((item2, index) => {
                item2.items.forEach((no, i) => {
                  let goods = BG[no.itemNo][no.id]
                  BGnum += no.qty
                  goodsList.push({
                    itemNo:no.itemNo,
                    itemName: no.itemName,
                    promotionSheetNo: goods.sheetNo,
                    promotionType: type,
                    realQty: no.qty,
                    price: 0,
                    itemSize: goods.itemSize,
                    isGift: true,
                    preNo: no.parentItemNoSet.join(','),
                    itemType: '2',
                    parentItemQty: (goods.buyQty + ':' + goods.giftQty),
                    id: no.id,
                    subtotal: 0,
                    goodsImgUrl: this.goodsUrl + no.itemNo + '/' + getGoodsImgSize(goods.giftImgName)
                  })
                })
              })
              obj.BGnum = BGnum
              obj.goodsList = goodsList
            } else if (type == 'BF') {
              giftList.push(item)
            }
            
          })
          this.baseMj = mjList // 挂载满减信息对象
          obj.giftList = giftList
          console.log(mjList,obj)
          this.setData(obj)
        }
      },
      complete: () => {
        this.exchangeLoading = true
        this.couponsLoading = true
        this.mjmzLoading = true
        this.setOrderAction()
      }
    })
  },
  getCoupons (itemList) {
    const { branchNo, token, username, platform, dbBranchNo: dbranchNo } = this.userObj
    API.Public.searchSupplyCoupons({
      data: { branchNo, token, platform, username, dbranchNo, data: itemList},
      success: res => {
        if (res.code == 0 && res.data) {
          let couponsList = []
          res.data.forEach(item => {
            if (item.status == '2') {
              couponsList.push({ limitAmt: item.limitAmt, subAmt: item.subAmt, couponsNo: item.couponsNo, startDate: item.startDate.split('.')[0], endDate: item.endDate.split('.')[0]})
            }
          })
          this.setData({ couponsList })
        }
      },
      complete: () => {
        this.couponsLoading = true
        this.setOrderAction()
      }
    })
  },
  getExchangeCoupons () {
    const { branchNo, token, username, platform } = this.userObj
    API.Public.getOrderMeetingCoupons({
      data: { branchNo, token, platform, username },
      success: res => {
        if (res.code == 0) {
          const list = res.data.coupons || []
          const nowTime = +new Date()
          let dhCouponsList = []
          list.forEach(item => {
            item.validStartDate = item.validStartDate.split('.')[0]
            item.validEndDate = item.validEndDate.split('.')[0]
            if (item.couponsQnty > 0 && nowTime < getTime(item.validEndDate) && nowTime > getTime(item.validStartDate)) {
              dhCouponsList.push(item)
            }
          })
          this.setData({ dhCouponsList})
        }
      },
      complete: () => {
        this.exchangeLoading = true
        this.setOrderAction()
      }
    })
  },
  clearAllPromotion () {
    const selectedCoupons = null
    const mjObj = []
    const giftList = []
    const selectedGiftNum = 0
    this.selectedGiftType = null
    const selectedGift = {}
    this.baseMj = null
    this.couponsLoading = false
    this.mjmzLoading = false
    this.setData({ selectedCoupons, mjObj, giftList, selectedGiftNum, selectedGift })
  },
  // 优惠计算
  setOrderAction () {
    if (this.mjmzLoading) {
      hideLoading()
      let { totalMoney, couponsList, payWay, selectedCoupons, selectedGiftNum, giftList} = this.data
      const { transportFeeType }  = wx.getStorageSync('configObj') 
      let realPayAmt = totalMoney
      let discountsMoney = 0

      let mjObj = []
      // 计算优惠券
      if ((payWay != '0' || this.autoCoupons == '1') && selectedCoupons != 'no') {
         selectedCoupons || couponsList.forEach(item => {
          if (totalMoney >= item.limitAmt) {
            selectedCoupons || (selectedCoupons = item)
            selectedCoupons.subAmt < item.subAmt && (selectedCoupons = item);
          }
        })
        if (selectedCoupons) discountsMoney += selectedCoupons.subAmt
      }
      console.log("满减数据： ",this.baseMj)
      // 计算满减
      if ((payWay != '0' || this.codPayMjFlag == '1') && this.baseMj) {
        if (payWay != '1' && this.baseMj.onlinePayFlag == '1') {
          // toast('满减只支持微信支付')
        } else {
          mjObj = this.baseMj
          mjObj.forEach(a => {
            discountsMoney += a.bonousAmt
          })
        }
      }
      realPayAmt = Number((realPayAmt - discountsMoney).toFixed(2))
      // 满足赠品条件时，显示赠品 Dialog
      const showSelectMzgoods = (this.selectedGiftType != 'no' && giftList.length && !selectedGiftNum && (payWay != '0' ||this.codPayMzFlag == '1')) ? true : false
      
      if (giftList.length != 0) {
        let bestGift = this.chooseBestGift(giftList)  // 返回最优惠的赠品
        this.setData({ selectedGift: bestGift }) 
      } 
      discountsMoney = discountsMoney.toFixed(2)
      this.data.realPayAmt
      let transportFeeAmt = transportFeeType != 0 ? this.transportFeeHandle(realPayAmt) : 0
      
      this.setData({ transportFeeAmt, realPayAmt, discountsMoney, selectedCoupons, mjObj, showSelectMzgoods })
    }
  },
  // 计算配送费
  transportFeeHandle(realPayAmt = this.data.realPayAmt, deliveryType = this.data.deliveryType) {
    if (!realPayAmt) realPayAmt = this.data.realPayAmt
    const tWay = Number(this.data.transportFeeChoiceWay)
    const { transportFeeType, transportFee } = this.data
    let transportFeeAmt = 0 
    console.log(transportFeeType, tWay, deliveryType, realPayAmt)
    if (transportFeeType != 0 && (tWay === deliveryType || tWay === 4) && deliveryType != 1) {
      console.log(true, transportFee, realPayAmt)
      transportFeeAmt = Number(transportFeeType == 1 ? transportFee : toFixed(transportFee * realPayAmt))
    }
    console.log(transportFeeAmt, this)
    return (transportFeeAmt || 0)
  },
  // 选择最优惠的赠品(只计算第一组赠品)
  chooseBestGift(giftList) {
    let bestGift = {}     // 最优对象
    giftList.forEach((item, _i) => {
      let bestGiftValue = 0 // 比较值

      for (let index in giftList[_i].items) {
        console.log(giftList[_i].items[index], bestGiftValue )
        if (giftList[_i].items[index].items.length > bestGiftValue) {
          bestGiftValue = giftList[_i].items[index].items.length
          bestGift[giftList[_i].promotionSheetNo] = Number(index)
        }
      }
    })
    
    return bestGift
  },
  goInvoicePage () {
    const ticketType = this.data.ticketType
    goPage('invoice', { openType: 'liquidation', ticketType})
  },
  submit(ignore) {
    const { branchNo, token, username, platform, dbBranchNo: dbranchNo } = this.userObj
    const { transportFeeAmt: transportFee, payWay, memo, selectedCoupons, totalMoney, selectedDhCoupons, dhCouponsList, realPayAmt, mjObj, giftList, selectedGift, selectedGiftNum, goodsList, storedValue, ticketType, isUseBlendWay } = this.data
    if (this.wxPayRateOpen == '1' && payWay == '1' && ignore !='ignore') { 
      alert('使用微信支付将收取您' + this.wxPayRate + '%的手续费-(手续费:' + Number((((realPayAmt + (transportFee || 0) - (isUseBlendWay ? Number(storedValue):0)) * this.wxPayRate) / 100).toFixed(2))+')',{
        showCancel: true,
        success: ret => {
          if (ret.confirm) {
            this.submit('ignore')
          }
        }
      })
      return
    }
    if (this.notAllowLoading) return
    if (!payWay) {toast('请选择支付方式'); return}
    if (payWay == '2' && storedValue < realPayAmt && !isUseBlendWay) {toast('余额不足'); return}
    if(this.isClickLoading) return
    this.isClickLoading = true
    showLoading('提交订单...')
    let itemNos = []
    let goodsData = []
    let request = {
      transportFee,
      username,
      branchNo,
      token,
      platform,
      dbranchNo,
      payWay: isUseBlendWay?'4':payWay,
      memo,
      itemNos: '', // 所有商品itemNo  普通商品， 赠品，捆绑商品子商品
      shouldPayAmt: String(totalMoney), // 应付金额
      stockType: this.orderStockType, /* 0常温1低温 */
      ticketType: String(ticketType), // 发票类型 
      onlinePayway: payWay == '1'?'WX':'',/* 在线支付方式  WX微信支付ZFB支付宝YEE易宝支付TL通联支付UN银联支付 */
      onlinePayAmtString: String(payWay == '1' ? realPayAmt:0),/*线上支付金额*/
      czPayAmtString: String(payWay == '2' ? realPayAmt : 0), // 储值支付金额
      codPayAmtString: String(payWay == '0' ? realPayAmt : 0), // 货到付款
      supcustNo: this.supcustNo, // 供应商编号
      transNo: this.transNo, //  YH  统配  ZC 直采
      version: '9.0.191216',
      realPayAmt: String(realPayAmt)
    }
    if (isUseBlendWay) {
      request.czPayAmtString = String(storedValue)
      request[payWay == '0' ? 'codPayAmtString' : 'onlinePayAmtString'] = Number(realPayAmt - storedValue).toFixed(2)
      
      console.log("request['onlinePayAmtString']", request['onlinePayAmtString'])
      console.log("request['czPayAmtString']", request['czPayAmtString'])
    }
    if (this.isReplenish) {
      request.isReplenishment = '1'// 是否是补货
      if (this.replenishSheet=='1') request.replenishSheet = this.replenishNo
    }

    goodsList.forEach(goods => {
      itemNos.push(goods.itemNo)
      let data = { itemNo: goods.itemNo, isGift: goods.isGift ? '1' : '0', qty: String(goods.realQty), price: String(goods.isGift ? 0 : goods.price), itemType: goods.itemType}
      if (this.transNo == 'YH') {
        if (goods.itemType == '0') { // 捆绑商品
          data.promotionSheetNo = goods.promotionSheetNo
          this.promotionObj.BD.goods[goods.itemNo].itemDetails.forEach(zGoods => {
            itemNos.push(zGoods.itemNo)
          })
        } else if (goods.itemType == '2') { // 赠品
          data.preNo = goods.preNo
          data.promotionSheetNo = goods.promotionSheetNo
          data.parentItemQty = goods.parentItemQty
          data.id = goods.id
        } else {
          const orgiPrice = String(goods.orgiPrice)
          const tag = getGoodsTag(goods, this.promotionObj)
          if (goods.promotionType == 'MS') {
            data.oldPrice = orgiPrice
            data.limitedQty = String(goods.maxSupplyQty)
            data.promotionSheetNo = goods.promotionSheetNo
          } else if (tag.SD && goods.realQty<=tag.drMaxQty) { // 单日限购
            data.promotionSheetNo = goods.promotionSheetNo
            data.oldPrice = orgiPrice
            data.limitedQty = String(tag.limitedQty)
          } else if (tag.FS && goods.realQty <= tag.sdMaxQty){
            data.fsPromotionSheetNo = goods.promotionSheetNo
            data.oldPrice = orgiPrice
          } else if (tag.ZK) {
            data.promotionSheetNo = goods.promotionSheetNo
            data.discount = String(tag.discountNum)
          }
        }
      }
      goodsData.push(data)
    })
    if (selectedCoupons && selectedCoupons!='no') { // 使用优惠券
      request.couponsAmt = String(selectedCoupons.subAmt)
      request.couponsNo = selectedCoupons.couponsNo
    }
    if (selectedDhCoupons.keyArr.length) { // 使用了兑换券  itemNo qty price
      console.log(selectedDhCoupons)
      let list = []
      let dhList = selectedDhCoupons.list
      // selectedDhCoupons.keyArr.forEach(itemNo => {
      //   list.push({
      //     itemNo: itemNo,
      //     qty: String(selectedDhCoupons[itemNo].num),
      //     price: String(dhCouponsList[selectedDhCoupons[itemNo].index].price)
      //   })
      //   itemNos.indexOf(itemNo) == -1 && itemNos.push(itemNo)
      // })
      dhList.forEach((item, index) => {
        if(item.num == 0) return
        list.push({
          itemNo: item.itemNo,
          qty: item.num,
          price: item.price,
          batchNo: item.batchNo,
          memo: '',
          flowNo: item.flowNo
        })
        itemNos.push(item.itemNo)
      })
      console.log(list)
      request.orderMeetingData = JSON.stringify(list)
    }
    if (mjObj.length) { // 使用了满减(数量或金额)
      let mjData = []
      let mqData = []
      mjObj.forEach(item => {
        if (item.promotionType == 'MQ') {
          mqData.push({
            sheetNo: item.promotionSheetNo,
            promotionId: item.promotionId,
            mjAmt: String(item.bonousAmt),
            mjReachVal: String(item.bonousAmt) ,
            orderQty: String(item.orderQty),
            promotionItemNo: item.promotionItemNo || ''
          })
          request.mqData = JSON.stringify(mqData)
        } else if (item.promotionType == 'MJ') {
          mjData.push({
            sheetNo: item.promotionSheetNo,
            promotionId: item.promotionId,
            mjAmt: String(item.bonousAmt),
            mjReachVal: String(item.bonousAmt) ,
            orderAmt: String(item.orderAmt),
            promotionItemNo: item.promotionItemNo || ''
          })
          request.mjData = JSON.stringify(mjData)
        }

      })
    }
    if (selectedGiftNum) { // 选择了满赠或首赠
      giftList.forEach(item => {
        const no = item.promotionSheetNo
        const index = selectedGift[no]
        if (index || index ===0) {
          const group = item.items[index]
          group.items.forEach(zItem => {
            itemNos.push(zItem.itemNo)
            let data = { isGift: '1', itemNo: zItem.itemNo, itemType: '2', qty: String(zItem.qty), groupNo: group.groupNo, reachVal: String(group.reachVal), price: '0', id: zItem.id, giftType: zItem.giftType||''}
            data[item.promotionType == 'BF' ? 'promotionSheetNo' : 'szPromotionSheetNo'] = no
            goodsData.push(data)
          })
        }
      })
    }
    itemNos = arrRemoveRepeat(itemNos) // 数组去重，捆绑和兑换可能重复添加
    request.itemNos = itemNos.join(',')
    request.data = JSON.stringify(goodsData)
    console.log(this.isReplenish)
    if (!this.isReplenish) {
      request.deliveryType = this.data.deliveryType
      if (this.data.deliveryType == 1) request.pickDate = this.data.storeTime + ':00:00'
    } else {
      request.deliveryType = 2 // 补货
    }
    console.log(request.deliveryType)
    console.log('支付参数:', request)
    console.log(this.data)
    // return hideLoading()
    console.log(wx.getStorageSync('configObj'))
    const { codPay, czPay, wxPay } = wx.getStorageSync('configObj')
    // if (payWay == 0) {
    //   if (codPay != 1) return toast('货到付款暂未开启，请重新选择')
    // } else if (payWay == 1) {
    //   if (wxPay != 1) return toast('微信支付暂未开启，请重新选择')
    // } else if (payWay == 2) {
    //   if (czPay != 1) return toast('储值支付暂未开启，请重新选择')
    // }
    if (this.data.partnerCode == 1059 && payWay == 0) return toast('货到付款暂未开启，请重新选择')
    console.log(dhCouponsList)
    
    API.Liquidation.saveOrder({
      data: request,
      success: res => {
        console.log(res, payWay)
        if (res.code == 0 && res.data) {
          this.orderNo = res.data
          if (payWay=='1') { // 微信支付
            this.wxPay()
          } else {
            this.goSuccessPage(true)
          }
        } else {
          this.isClickLoading = false
          hideLoading()
          alert(res.msg || '下单请求失败,请与管理员联系。')
        }
      },
      error: ()=>{
        this.isClickLoading = false
        hideLoading()
        alert('提交订单失败，请检查网络是否正常。')
      }
    })
  },
  goSuccessPage(type) {
    this.notAllowLoading = true
    wx.removeStorage({key: 'cartsObj'})
    wx.removeStorage({ key: 'updateCarts' })
    wx.removeStorage({ key: 'liquidationObj' })
    wx.removeStorage({ key: 'promotionTime' })
    setTimeout(()=> {
      wx.redirectTo({
        url: '/pages/paySuccess/paySuccess?payType=' + (type ? 'ok' : 'fail') + '&orderNo=' + this.orderNo,
      })
    },200)
  },
  wxPay () {
    const openId = wx.getStorageSync('openId')
    const { token, username, platform } = this.userObj
    wx.login({
      success:  (codeData) => {
        console.log('code', codeData, 'openid', openId)
        API.Liquidation.getMiniPayParameters({
          data: { 
            code: codeData.code, 
            out_trade_no: this.orderNo, 
            body: '具体信息请查看小程序订单中心', 
            openId: openId, 
            platform, 
            username,
            userIp: app.data.userIp
          },
          success: res => {
            // let data = JSON.parse(res.data) // 银盛支付数据处理
            console.log(res)
            if (res.code == 0 && res.data) {
              wx.requestPayment({
                'timeStamp': res.data.timeStamp || JSON.parse(res.data).timeStamp,
                'nonceStr': res.data.nonceStr || JSON.parse(res.data).nonceStr,
                'package': res.data.package || JSON.parse(res.data).package,
                'signType': res.data.signType || JSON.parse(res.data).signType,
                'paySign': res.data.sign || JSON.parse(res.data).paySign,
                success: ret => {
                  this.goSuccessPage(true)
                },
                fail: (ret) => {
                  // console.log(res.data.timeStamp || JSON.parse(res.data.timeStamp))
                  console.log(ret, { code: codeData.code, out_trade_no: this.orderNo, body: '具体信息请查看小程序订单中心', openId: openId, platform, username})
                  this.errorMsg('支付已取消')
                }
              })
            } else {
              this.errorMsg(res.msg)
            }
          },
          error: () => {
            this.errorMsg('获取支付配置失败,请检查网络是否正常。')
          }
        })
      },
      fail: () => {
        this.errorMsg('获取code失败')
      }
    })
  },
  errorMsg (msg) {
    hideLoading()
    alert(msg || '系统异常，请稍后再试',{
      success: () => {
        this.goSuccessPage(false)
      }
    })
  },
  // 获取默认的当前时间（自提模式）
  getStoreDefaultTime() {
    const ymd = timCurrentDay(0) // 年 月 日
    const hours = tim().slice(0, 2)
    return `${ymd} ${hours}`
  },
  onLoad (opt) {
    console.log(opt)
    const partnerCode = getApp().data.partnerCode
    if (partnerCode == 1052) wx.setNavigationBarColor({ backgroundColor: '#e6c210', frontColor: '#ffffff' })

    const { replenish, cartsType } = opt
    // 补货
    if(replenish) {
      this.setData({ replenish: true })  // 补货则不显示自提选择
    }
    const obj = wx.getStorageSync('liquidationObj')
    this.promotionObj = wx.getStorageSync('allPromotion')
    this.userObj = wx.getStorageSync('userObj')
    this.liquidationObj = deepCopy(obj)
    wx.removeStorageSync('invoiceSelectedIndex')
    const { transportFee } = this.userObj
    const {
      defaultPayWay, // 默认为空   0货到付款   1储值支付    2微信支付  3支付宝支付  4易宝支付   --- 0货到付款 1在线支付 2储值支付 4混合支付
      codPay, // 货到付款
      czPay, // 储值支付
      wxPay, // 微信支付
      codPayMjFlag, // 货到付款是否支持满减 1:支持
      autoCoupons, // 货到付款是否支持优惠券 1:支持
      codPayMzFlag, // 货到付款是否支持满赠 1:支持
      isInvoice, // 不开启发票  1：开启发票
      wxPayRate, //微信手续费率
      wxPayRateOpen,  //微信手续费开关
      transportFeeChoice, //配送方式配送费选择 1:配送  2:物流  1,2：配送和物流
      transportFeeType,  //配送费计算方式 0：没有配送费 1：按照固定金额 2：按照订单比例 
      replenishSheet //  补单是否使用订单号 0 不使用 1 使用
    } = wx.getStorageSync('configObj')
    let transportFeeChoiceWay
    if (transportFeeChoice) {
      // 配送方式配送费选择 0:配送  3:物流  4：配送和物流
      transportFeeChoiceWay = transportFeeChoice == 1 ? 0 : (transportFeeChoice == 2 ? 3 : 4)
    }
    console.log({ codPay, czPay, wxPay })
    this.codPayMjFlag = codPayMjFlag
    this.autoCoupons = autoCoupons
    this.replenishSheet = replenishSheet
    this.codPayMzFlag = codPayMzFlag
    const { goodsUrl } = getApp().data
    this.goodsUrl = goodsUrl
    let payWayList = this.data.payWayList
    console.log(deepCopy(payWayList))
    console.log(811, partnerCode)
    payWayList[0].show = czPay == '1' //&& obj.items[0].sourceType == '0'
    payWayList[1].show = wxPay == '1' //&& obj.items[0].sourceType == '0'
    payWayList[2].show = codPay == '1'
    if (partnerCode == '1029' && cartsType == 'sup') {
      payWayList[1].show = false // 怡星 ZC 单不开微信支付 以及 储值支付、
      payWayList[0].show = false
    }
    let goodsList = obj.items[0].datas
    const sourceType = obj.items[0].sourceType
    console.log(sourceType)
    console.log('obj', obj)
    this.supcustNo = obj.items[0].sourceNo
    let requestItemList = []
    let itemNos = []
    goodsList.forEach(goods => { /* itemType 0组合商品 1 普通商品 2 赠品  */
      if ('promotionCollections' in goods && goods.promotionCollections.includes('RMJ')) goods['RMJ'] = '满减商品'
      if ('promotionCollections' in goods && goods.promotionCollections.includes('RBF')) goods['RBF'] = '满赠商品'
      if ('promotionCollections' in goods && goods.promotionCollections.includes('RSD')) goods['RSD'] = '限时抢购'
      if ('promotionCollections' in goods && goods.promotionCollections.includes('MJ')) goods['MJ'] = '满减'
      if ('promotionCollections' in goods && goods.promotionCollections.includes('MQ')) goods['MQ'] = '数量满减'
      if ('promotionCollections' in goods && goods.promotionCollections.includes('MS')) goods['MS'] = '秒杀'
      if ('promotionCollections' in goods && goods.promotionCollections.includes('SZ')) goods['SZ'] = '首单赠送'
      if ('promotionCollections' in goods && goods.promotionCollections.includes('BG')) goods['BG'] = '买赠'
      if ('promotionCollections' in goods && goods.promotionCollections.includes('FS')) goods['FS'] = '首单特价'
      if ('promotionCollections' in goods && goods.promotionCollections.includes('SD')) goods['SD'] = '单日限购'
      if ('promotionCollections' in goods && goods.promotionCollections.includes('BF')) goods['BF'] = '买满赠'
      
      const itemNo = goods.itemNo
      itemNos.push(itemNo)
      let data = { itemNo: itemNo, qty: String(goods.realQty), price: String(goods.price) }
      if (goods.itemType=='0') {
        data.clsNo = goods.itemClsno
        data.brandNo = goods.itemBrandno || ''
      }
      requestItemList.push(data)
    })
    this.itemNos = itemNos
    this.data.transportFeeType = transportFeeType
    this.data.transportFee = transportFee
    this.setData({
      transportFee,
      transportFeeChoiceWay,
      transportFeeType,
      wxPayRate,
      wxPayRateOpen,
      goodsList,
      totalMoney: obj.sheetAmt,
      realPayAmt: obj.sheetAmt,
      totalNum: obj.sheetQty,
      totalVariety: goodsList.length,
      isInvoice,
      payWayList: payWayList,
      payWay: (defaultPayWay?(
        (defaultPayWay == '1' && payWayList[0].show) ? '2':
        ((defaultPayWay == '2' && payWayList[1].show) ? '1' :
        ((defaultPayWay == '0' && payWayList[2].show) ? defaultPayWay:''))):''
      ),
      sourceType: sourceType
    })
    this.getUserInfo()
    this.orderStockType = opt.cartsType == 'cw' ? '0' : (opt.cartsType == 'dw' ? '1' : '2')
    this.isReplenish = opt.replenish
    this.replenishNo = opt.replenishNo
    this.transNo = sourceType == '0' ? 'YH' : 'ZC'
    this.wxPayRate =Number(wxPayRate) || 0
    this.wxPayRateOpen =  wxPayRateOpen || '0'
    
    console.log(sourceType, cartsType, partnerCode)
    if (sourceType == '1' && cartsType == 'sup' && partnerCode != 1050) { // 直配 满赠满减 (重庆会出现有时没有请求 促销接口的情况，无法复现先停掉直配促销接口)
      requestItemList = JSON.stringify(requestItemList)
      showLoading('加载促销...')
      const supplierNo = obj.items[0].sourceNo
      this.getSupplierMjMz(requestItemList, supplierNo)
      return
    }
    // 统配 满赠满减
    requestItemList = JSON.stringify(requestItemList)
    showLoading('加载促销...')
    this.getMjMz(requestItemList)
    this.getCoupons(requestItemList)
    this.getExchangeCoupons()
  },
  onReady () {
  },
  onShow () {
    const ticketType = wx.getStorageSync('invoiceSelectedIndex') || 0
    this.setData({ ticketType})
  },
  onHide () {
  },
  onUnload () {
  },
  onReachBottom () {
    console.log(this.data.mjObj)
    console.log(this.data.goodsList)
  }
})