
import API from '../../api/index.js'
import { showLoading, hideLoading, getGoodsImgSize, alert, getTime,toast,goPage, deepCopy} from '../../tool/index.js'
import * as types from '../../store/types.js'
import commit from '../../store/mutations.js'
Page({
  data: {
    tabIndex: 0,
    tabTitle: ['订单详情', '订单状态'],
    order: null,
    orderFlowObj: [],
    showPay: false,
    storedValue: 0,
    starList:[0,0,0,0,0],
    partnerCode:'',
    wlStatus:'',
    openType:'',
    zcOrderCancelFlag: '',//  直采是否有取消订单按钮  0：不展示 1：展示
    yhOrderCancelFlag: '',//  统配是否有取消订单按钮  0：不展示 1：展示
    branchApproveSwitch: '1' // 0=不允许再支付 1=允许 (新增字段,钟伟迪:2020-04-23 14:51:00)
  },
  // 是否选择商品
  selectGoods(e) {
    const { index } = e.currentTarget.dataset
    const { orderDetails } = this.data.order
    orderDetails[index].cancelSelected = !orderDetails[index].cancelSelected
    this.setData({ [`order.orderDetails`]: orderDetails })
  },
  goGrade () {
    const { branchRule, shopRule, routeSendMan, sheetNo} = this.data.order
    if (!branchRule || !shopRule) {
      toast(!branchRule ? '该配送员没有设置积分规则' :'该门店没有设置积分规则')
      return
    }
    goPage('grade', { routeSendMan, sheetNo})
  },
  changeTab(e) {
    const index = e.currentTarget.dataset.index
    if (index !== this.data.tabIndex) {
      this.setData({ tabIndex: index})
      wx.pageScrollTo({scrollTop: 0})
    }
  },
  getOrderStatusStr(item) {
    const status = item.supplyFlag
    return (status == '1' ?
      (item.approveFlag == '0' ? '未提交' : '已提交') :
      (status == '2' ? '已拣货' :
      (status == '3' ? '配货完成' :
      (status == '4' ? '已取消' :
      (status == '5' ? '已完成' :
      (status == '6' ? '拣货中' :
      (status == '7' ? '退货中' :
      (status == '8' ? '退货完成' :
      (status == '9' ? '驳回' :
      (status == '31' ? '已装车' :
      (status == '32' ? '配送中' :
      (status == '51' ? '已完成' : '状态错误'))))))))))))
  },
  requestOrderFlow () {
    const { token, platform, username,branchNo } = this.userObj
    const sheetNo = this.ordersNo
    API.Orders.getOrderFlow({
      data: { token, platform, username, sheetNo, branchNo },
      success: res => {
        if (res.code == 0) {
          const orderFlowObj = res.data || []
          orderFlowObj.forEach(item => {
            item.createDate = item.createDate.split('.')[0].split(' ')
            item.createDateTime = getTime(item.createDate.join(' '))
          })
          orderFlowObj.sort((a, b) => a.createDateTime > b.createDateTime)
          this.setData({ orderFlowObj })
        }
      }
    })
  },
  getOrdersDetail () {
    showLoading('请稍后...')
    const { token, platform, username, branchNo } = this.userObj
    const { zhGoodsUrl, goodsUrl, zcGoodsUrl } = getApp().data
    const sheetNo = this.ordersNo
    API.Orders[this.openType == 'share' ? 'getOrderDetailNoToken' :'getOrderDetail']({
      data: { token, platform, username, sheetNo, branchNo },
      success: res => {
        console.log(deepCopy(res))
        if (res.code == 0) {
          const { transportFeeType } = wx.getStorageSync('configObj') // 配送费计算方式 0：没有配送费 1：按照固定金额 2：按照订单比例  
          const { transportFee } = wx.getStorageSync('userObj')
          const order = res.data
          let itemNos =[]
          order.orderDetails.forEach(goods => {
            goods.goodsImgUrl = (order.transNo == 'YH' ? (goods.itemType == '0' ? zhGoodsUrl : goodsUrl): zcGoodsUrl) + goods.itemNo + '/' + getGoodsImgSize(goods.imgName)
            goods.differAmt = 'shippedQty' in goods ? (goods.subAmt-goods.shippedSpecAmt).toFixed(2) : false
            goods.differAmt = goods.differAmt == 'NaN' ? false : goods.differAmt
            console.log(91, goods.differAmt, isNaN(goods.differAmt))
            console.log(87, order)
            console.log(92, order.supplyFlag, order.sheetSourceStr, order.memo)  
            if (order.supplyFlag == 5 || order.supplyFlag == 51) {
              goods.cancelSelected = true
            } else {
              goods.cancelSelected = 'hide'
            }
            console.log(564564564)
            itemNos.push(goods.itemNo)
          })
          order.statusStr = this.getOrderStatusStr(order)
          order.sheetSourceStr = order.sheetSource == "yewuyuan" ? '(平台业务员)' : (order.sheetSource == 'huozhu' ? '(货主业务员)' : '')
          order.payWayStr = (order.payWay == '0' ? '货到付款' : (order.payWay == '1' ? '在线支付' : (order.payWay == '2' ? '储值支付' : (order.payWay == '3' ? '积分支付' : (order.payWay == '4' ? '混合支付' : (order.payWay == '5' ? '兑换券' : '支付方式错误'))))))
          order.createDate = order.createDate.split('.')[0]
          order.sheetAmt = Number(order.sheetAmt)
          order.couponsAmt = Number(order.couponsAmt)
          order.codPayAmt = Number(order.codPayAmt)
          // order.realPayAmt = Number(order.realPayAmt || 0)
          order.realPayAmt = order.onlinePayway == 'WX' ? Number(Number(order.onlinePayAmt).toFixed(2)) : Number(order.realPayAmt || 0)
          order.orgiSheetAmt = Number(order.orgiSheetAmt || order.realPayAmt)
          order.itemNos = itemNos.join(',')
          order.czPayAmt = Number(Number(order.czPayAmt).toFixed(2))
          order.discountAmt = Number(order.discountAmt)
          
          
          order.transportFeeAmt = 0
          if (transportFee != 0) {
            console.log('transportFeeType', transportFeeType)
            const { realPayAmt } = order
            // order.transportFeeAmt = transportFeeType == 1 ? transportFee : Number((realPayAmt * transportFee).toFixed(2)) 
            order.transportFeeAmt = transportFee
          }
          console.log(126, order.transportFeeAmt)
          order.discountsTotalAmt = Number((order.orgiSheetAmt - order.realPayAmt - (order.vouchersAmt || 0)).toFixed(2))
          // if (order.statusStr == '已完成') {
          // order.discountsTotalAmt = (order.orgiSheetAmt - order.realPayAmt - (order.vouchersAmt || 0)).toFixed(2)
          // } else {
          //   order.discountsTotalAmt = (order.orgiSheetAmt - order.realPayAmt - (order.vouchersAmt || 0) - (order.czPayAmt || 0)).toFixed(2)
          // }
          console.log(order.realSheetAmt)
          // 缺货金额 = 支付金额 + 优惠卷金额 - 出库金额 
          order.stockoutAmt = (Number(order.realPayAmt) + Number(order.vouchersAmt) - Number(order.doAmt)).toFixed(2)
          console.log('缺货金额：', order.stockoutAmt, order.realPayAmt, order.vouchersAmt, order.doAmt)
          order.vouchersAmt = Number(Number(order.vouchersAmt).toFixed(2))
          console.log(order)
          /*
            1、如果payWay 字段 是  0，并且sheetSource 字段为： "yewuyuan"（平台业务员）或者是   "huozhu" （货主业务员）,就是“未付款"
            2、如果payWay 字段 是  1或者4 ，支付状态取acctFlag 付款状态 字段的值
            3、如果payWay 字段是 2或3或5，为 “已付款”状态
            4、其他 情况都为 “未付款”
          */
          //  acctFlag 付款标志：0未付款、1无需付款、2已付款  3付款中
          let acctFlagStr
          if (order.payWay == '0' && (order.sheetSource == 'yewuyuan' || order.sheetSource == 'huozhu')) {
            acctFlagStr = '0'
          } else if (order.payWay == '1' || order.payWay == '4') {
            acctFlagStr = order.acctFlag
          } else if (order.payWay == '2' || order.payWay == '3' || order.payWay == '5') {
            acctFlagStr = '2'
          } else {
            acctFlagStr = '0'
          }
          /*
            已付金额：
            1、如果支付状态为 “已付款” ，值为 realPayAmt - codPayAmt；
            2、如果支付状态为 “未付款” 并且payWay = 4 混合支付 ，值为 czPayAmt;
            3、如果supplyFlag 字段为 5 ，值为 realPayAmt
            4、其他情况为0
          */
         console.log(acctFlagStr , order.payWay, order.czPayAmt, order.supplyFlag)
          let paymentAmtStr
          if (acctFlagStr == '2') {
            paymentAmtStr = (order.realPayAmt - order.codPayAmt).toFixed(2)
          } else if ((acctFlagStr == '0' || acctFlagStr == 3) && order.payWay == '4') {
            paymentAmtStr = order.czPayAmt
          } else if (order.supplyFlag == '5' && this.data.partnerCode != 1027) {
            paymentAmtStr = order.realPayAmt
          } else {
            paymentAmtStr = 0
          }
          order.paymentAmtStr = parseFloat(paymentAmtStr).toFixed(2)
          if (order.supplyFlag == '1' && order.payWay == '1' && order.sheetSource != 'yewuyuan' && order.acctFlag != '1' && order.acctFlag != '2' && this.openType!='share') {
            this.getUserInfo()
          }
          console.log(paymentAmtStr, order.czPayAmt)
          this.setData({ order })
        }
      },
      complete: ()=> {
        hideLoading()
      }
    })
  },
  getUserInfo() {
    const { branchNo, token, platform, username } = this.userObj
    API.Public.getAccBranchInfoAmt({
      data: { branchNo, token, platform, username },
      success: res => {
        if (res.code == 0 && res.data) {
          const money = res.data.czAmt
          this.setData({ storedValue: money < 0 ? 0 : money })
        }
      }
    })
  },
  changeOrder (e) {
    const type = e.currentTarget.dataset.type
    const { token, platform, username, branchNo } = this.userObj
    const sheetNo = this.ordersNo
    alert(type == '0' ? '确认是否收货?' :'确认是否取消此订单?',{
      title:'温馨提示',
      showCancel: true,
      success: ret => {
        if (ret.confirm) {
          showLoading('请稍后...')
          API.Orders[type == '0' ? 'submitReceiveOrder' :'cancelOrder']({
            data: { token, platform, username, sheetNo, branchNo},
            success: res => {
              if (res.code == 0) {
                alert(type == '0'?'收货成功':'取消订单成功',{
                  success: ()=> {
                    this.refreshPage()
                    wx.removeStorage({ key: 'promotionTime' })
                  }
                })
              } else {
                alert(res.msg)
              }
            },
            error: ()=> {
              alert('操作失败，请检查网络是否正常')
            },
            complete: ()=> {
              hideLoading()
            }
          })
        }
      }
    })
  },
  refreshPage () {
    this.openType == 'list' && wx.setStorage({ key: 'updateOrderList', data: true })
    this.getPageData()
  },
  // 处理被选中的商品， 转为以 itemNo 为键值的对象
  selectedItemHandle(orderDetails) {
    let obj = {  }
    orderDetails.forEach(item => {
      if (item.cancelSelected == true || item.cancelSelected == 'hide') {
        obj[item.itemNo] = item 
      }
    })
    return obj
  },
  afreshOrder () {
    const { token, platform, username, branchNo, dbBranchNo } = this.userObj
    const { orderDetails } = this.data.order
    const selectedItemObj = this.selectedItemHandle(orderDetails)
    if (!Object.keys(selectedItemObj).length) return toast('请选择需要加入购物车的商品')
    console.log(selectedItemObj)
    const _this = this
    const yhSheetNo = this.ordersNo
    alert('是否把商品加入购物车',{
      showCancel: true,
      success: ret => {
        if (ret.confirm) {
          let cartsObj = commit[types.GET_CARTS]()
          console.log(yhSheetNo)
          showLoading('请稍后...')
          API.Orders.againOrder({
            data: { token, platform, username, branchNo, yhSheetNo},
            success: res => {
              if (res.code == 0) {
                const list = res.data || []
                console.log(list, cartsObj, _this.data)
                list.forEach(goods => {
                  const itemNo = goods.itemNo
                  console.log(selectedItemObj[itemNo], Boolean(selectedItemObj[itemNo]))
                  if (cartsObj[itemNo]) {
                    if (!selectedItemObj[itemNo]) return  // 没有选中商品则不加入购物车
                    if (cartsObj[itemNo].realQty < goods.itemQty) {
                      cartsObj.num = (cartsObj.num - cartsObj[itemNo].realQty) + goods.itemQty
                      cartsObj[itemNo].realQty = goods.itemQty
                    }
                  } else {
                    if (!selectedItemObj[itemNo]) return // 没有选中商品则不加入购物车
                    cartsObj.keyArr.push(itemNo)
                    cartsObj[itemNo] = {
                      itemNo: itemNo,
                      realQty: goods.itemQty,
                      origPrice: goods.oldPrice || '0',
                      validPrice: goods.price,
                      specType: (goods.isBind == '1' || goods.specType == '2') ? '2' : '0',
                      branchNo: branchNo,
                      sourceType: '0',
                      sourceNo: dbBranchNo,
                      parentItemNo: goods.parentItemNo ||''
                    }
                    cartsObj.num += goods.itemQty
                  }
                })
                commit[types.SAVE_CARTS](cartsObj)
                wx.setStorageSync('updateCarts', true)
                wx.setStorageSync('updateCartsTime', +new Date())
                wx.switchTab({url: '/pages/carts/carts'})
              } else {
                alert(res.msg)
              }
            },
            error: () => {
              alert('加入购物车失败,请检查网络是否正常')
            },
            complete: () => {
              hideLoading()
            }
          })
        }
      }
    })
    
  },
  hidePay () {
    this.setData({ showPay: false})
  },
  goPay () {
    this.setData({ showPay: true})
  },
  getPageData () {
    this.openType != 'share' && this.requestOrderFlow()
    this.getOrdersDetail()
  },
  onLoad (opt) {
    this.openType = opt.openType
    this.ordersNo = opt.sheetNo
    this.userObj = wx.getStorageSync('userObj')
    this.configObj = wx.getStorageSync('configObj')
    wx.removeStorageSync('updateOrderDetails')
    commit[types.SET_ALL_GOODS_IMG_URL]()
    const { partnerCode} = getApp().data
    this.setData({ 
      partnerCode, 
      wlStatus: this.configObj.wlStatus, 
      openType: opt.openType,
      zcOrderCancelFlag: this.configObj.zcOrderCancelFlag || '1',
      yhOrderCancelFlag: this.configObj.yhOrderCancelFlag || '1',
      branchApproveSwitch: this.configObj.branchApproveSwitch || '1'
      })
    this.getPageData()
  },
  goIndex () {
    wx.reLaunch({
      url: '/pages/login/login'
    })
  },
  onReady () {
  },
  onShow () {
    if (wx.getStorageSync('updateOrderDetails')) {
      this.getOrdersDetail()
      wx.removeStorageSync('updateOrderDetails')
    } 
  },
  onHide () {
  
  },
  onReachBottom() {
    console.log(this.data.order)
  }
  // onShareAppMessage() {
  //   return {
  //     title: '快来看看我买了什么好东西！',
  //     path: '/pages/ordersDetails/ordersDetails?openType=share&sheetNo=' + this.ordersNo
  //   }
  // }
})