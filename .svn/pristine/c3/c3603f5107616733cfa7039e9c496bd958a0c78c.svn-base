import ajax from './config'
export default {
  Public: {
    getOpenId: (param) => ajax.post(`minipay/getOpenId.do`, param), // 获取openId
    getCommonSetting: (param) => ajax.post(`supplymini/getCommonSetting.do`, param), // 获取系统配置
    getAllPromotion: (param) => ajax.post(`supplymini/getAllPromotion.do`, param), // 获取所有促销信息
    getSupplierAllPromotion: (param) => ajax.post(`supplymini/getSupplierAllPromotion.do`, param), // 获取直配当日的限购促销信息
    getAccBranchInfoAmt: (param) => ajax.post(`supplymini/getAccBranchInfoAmt.do`, param), // 获取余额信息
    searchSupplyCoupons: (param) => ajax.post(`supplymini/searchSupplyCoupons.do`, param), // 获取优惠券
    searchSupplyCoupons2: (param) => ajax.post(`supplymini/searchCouponList.do`, param),   // 获取优惠券（新版本）
    getOrderMeetingCoupons: (param) => ajax.post(`supplymini/getOrderMeetingCoupons.do`, param), // 获取兑换券
    getSystemTime: (param) => ajax.post(`supplymini/getSystemTime.do`, param), // 获取系统时间
    searchCollectByBranch: (param) => ajax.post(`supplymini/searchCollectByBranch.do`, param), // 获取收藏商品列表
    supplyCollect: (param) => ajax.post(`supplymini/supplyCollect.do`, param), // 改变商品收藏状态
    addInvoiceHead: (param) => ajax.post(`supplymini/addInvoiceHead.do`, param), // 新增发票信息
    updateInvoiceHead: (param) => ajax.post(`supplymini/updateInvoiceHead.do`, param), // 更新发票信息
    deleteInvoiceHead: (param) => ajax.post(`supplymini/deleteInvoiceHead.do`, param), // 删除发票信息
    selectInvoiceHead: (param) => ajax.post(`supplymini/selectInvoiceHead.do`, param), // 查询发票信息
    getCartRecommend: (param) => ajax.post(`supplymini/getCartRecommend.do`, param), // 获取购物车推荐商品
    getCouponsByBatchNo: (param) => ajax.post(`supplymini/getCouponsByBatchNo.do`, param),  // 领取优惠券
    getCouponsBatchNo: (param) => ajax.post(`supplymini/getCouponsBatchNo.do`, param),      // 获取优惠券
    getPopup: (param) => ajax.post(`supplymini/getPopup.do`, param),                         // 首页弹窗配置信息
    getHotItem: (param) => ajax.post(`supplymini/getHotItem.do`, param)                         // 常购商品
    
  },
  Login: {
    supplyLoginPwd: (param) => ajax.post(`supplymini/supplyLoginPwd.do`, param), // 账号密码登录
    supplyLogin: (param) => ajax.post(`supplymini/supplyLogin.do`, param), // 手机号登录
    sendVerifyCode: (param) => ajax.post(`supplymini/sendVerifyCode.do`, param), // 获取验证码
    modifyPassword: (param) => ajax.post(`supplymini/modifyPassword.do`, param), // 修改密码
    searchBranchArea: (param) => ajax.post(`supplymini/searchBranchArea.do`, param), // 获取注册的区域
    getUserAgreementInfo: (param) => ajax.post(`supplymini/getUserAgreementInfo.do`, param), // 获取用户注册协议
    supplyRegister: (param) => ajax.post(`supplymini/supplyRegister.do`, param), // 提交注册信息
    /** 
     * 获取是否开启长传门头照开关 
     * @param {*} param 传固定对象{"settingKey":"supplySetting.isRegisterPhone"}
     */
    getSetting: (param) => ajax.post('supplymini/getSetting.do', param)
  },
  Goods: {
    searchItemCls: (param) => ajax.post(`supplymini/searchItemCls.do`, param), // 获取类别
    itemSearch: (param) => ajax.post(`supplymini/itemSearch.do`, param), // 获取商品
    searchItemDetail: (param) => ajax.post(`supplymini/searchItemDetail.do`, param), // 获取商品图文详情
    supplierItemSearch: (param) => ajax.post(`supplymini/supplierItemSearch.do`, param), // 获取直配商品
    getBranchSlae: (param) => ajax.post(`supplymini/getBranchSlae.do`, param), // 获取商品月销量
  },
  Index: {
    getIndexSetting: (param) => ajax.post(`supplymini/getIndexSetting.do`, param), // 获取首页自定义模块
    signIn: (param) => ajax.post(`supplymini/signIn.do`, param), // 每日签到
    searchSupplyPoster: (param) => ajax.post(`supplyandroid/searchSupplyPoster.do`, param), // h5海报
  },
  Carts: {
    getShoppingCartInfo: (param) => ajax.post(`supplymini/getShoppingCartInfo.do`, param), // 获取网络购物车
    getSettlementPageInfo: (param) => ajax.post(`supplymini/getSettlementPageInfo.do`, param), // 购物车跳转结算页，获取所选商品
    addItemToCar: (param) => ajax.post(`supplymini/addItemToCar.do`, param), // 加入购物车
    couldReplenishment: (param) => ajax.post(`supplymini/couldReplenishment.do`, param), // 判断是否可以补货
  },
  My: {
    findSalesManInfo: (param) => ajax.post(`supplymini/findSalesManInfo.do`, param), // 获取业务员信息
    searchOrderCount: (param) => ajax.post(`supplymini/searchOrderCount.do`, param), // 获取待收货订单数量
    getUnusedCouponsSum: (param) => ajax.post(`supplymini/getUnusedCouponsSum.do`, param), // 获取最新优惠券数量
    getBranchExhibit: (param) => ajax.post(`supplymini/getBranchExhibit.do`, param), // 获取门店陈列列表
    submitExhibitFlow: (param) => ajax.post(`salesmanandroid/submitExhibitFlow.do`, param), // 门店信息提交
  },
  Liquidation: {
    saveOrder: (param) => ajax.post(`supplymini/saveOrder.do`, param), // 保存订单
    getSettlementPromotion: (param) => ajax.post(`supplymini/getSettlementPromotion.do`, param), // 获取 统配 满减满赠促销
    getSupplierSettlementPromotion: (param) => ajax.post(`supplymini/getSupplierSettlementPromotion.do`, param), // 获取入驻商(直配)结算页满减满赠促销信息
    getMiniPayParameters: (param) => ajax.post(`minipay/getMiniPayParameters.do`, param), // 微信支付
  },
  Orders: {
    getOrderList: (param) => ajax.post(`supplymini/getOrderList.do`, param), // 获取订单列表
    getOrderFlow: (param) => ajax.post(`supplymini/getOrderFlow.do`, param), // 获取订单状态列表
    getOrderDetail: (param) => ajax.post(`supplymini/getOrderDetail.do`, param), // 获取订单详情
    submitReceiveOrder: (param) => ajax.post(`supplymini/submitReceiveOrder.do`, param), // 确定收货
    cancelOrder: (param) => ajax.post(`supplymini/cancelOrder.do`, param), // 取消订单
    orderpay: (param) => ajax.post(`supplymini/orderpay.do`, param), // 再支付
    againOrder: (param) => ajax.post(`supplymini/againOrder.do`, param), // 获取加入购物车的商品，重下此单
    getToEvaluateInformation: (param) => ajax.post(`supplymini/getToEvaluateInformation.do`, param), // 获取评价标签，司机信息
    saveEvaluation: (param) => ajax.post(`supplymini/saveEvaluation.do`, param), // 提交评价
    getOrderDetailNoToken: (param) => ajax.post(`supplymini/getOrderDetailNoToken.do`, param), // 获取分享的订单详情
    searchReturnOrder: (param) => ajax.post(`supplymini/searchReturnOrder.do`, param), // 获取退货订单列表
    sheetSearch: (param) => ajax.post(`supplymini/sheetSearch.do`, param), // 当月订单查询
    sheetAmtSearch: (param) => ajax.post(`supplymini/sheetAmtSearch.do`, param),   // 当月订单金额查询
  },
  BankBalance: {
    getAccountFlow: (param) => ajax.post(`supplymini/getAccountFlow.do`, param), // 获取账户流水列表
    getAccountFrozenFlow: (param) => ajax.post(`supplymini/getAccountFrozenFlow.do`, param), // 获取授信明细
    getStoresReconciliation: (param) => ajax.post(`supplymini/getStoresReconciliation.do`, param), // 获取对账信息
  },
  Integral: {
    findSupplyAcclist: (param) => ajax.post(`supplymini/findSupplyAcclist.do`, param), // 获取积分记录
    getBranchPoint: (param) => ajax.post(`supplymini/getBranchPoint.do`, param), // 获取积分余额
    searchIntegralStoreGoods: (param) => ajax.post(`supplymini/searchIntegralStoreGoods.do`, param), // 获取积分商品列表
    submitIntegralStoreGoods: (param) => ajax.post(`supplymini/submitIntegralStoreGoods.do`, param), // 积分兑换商品
  },
  GetCoupons: {
    getCouponsExplain: (param) => ajax.post(`supplymini/getCouponsExplain.do`, param), // 获取优惠券规则
    getCouponsByBatchNo: (param) => ajax.post(`supplymini/getCouponsByBatchNo.do`, param), // 领取优惠券
    getCouponsBatchNo: (param) => ajax.post(`supplymini/getCouponsBatchNo.do`, param), // 获取可领取的优惠券
  },
  Seckill: {
    getMsData: (param) => ajax.post(`supplymini/getMsData.do`, param), // 获取秒杀
  },
  Group: {
    searchSupplyTeam: (param) => ajax.post(`supplymini/searchSupplyTeam.do`, param), // 获取团购商品列表
    searchSupplyTeamDetail: (param) => ajax.post(`supplymini/searchSupplyTeamDetail.do`, param), // 获取团购商品详情
    saveTeamOrder: (param) => ajax.post(`supplymini/saveTeamOrder.do`, param), // 团购商品下单
    getMiniTeamPayParameters: (param) => ajax.post(`minipay/getMiniTeamPayParameters.do`, param), // 获取团购下单微信支付配置
    searchTeamOrderList: (param) => ajax.post(`supplymini/searchTeamOrderList.do`, param), //  获取团购订单
    cancelTeamOrder: (param) => ajax.post(`supplymini/cancelTeamOrder.do`, param), //  取消团购订单
  },
  Supplier: {
    searchSupcust: (param) => ajax.post(`supplymini/searchSupcust.do`, param), // 获取供应商
  },
  upload:{
    /**
     * 上传照片
     *  @param {*} filePath  本地图片地址
     *  @param {*}  type  8:营业执照，9:门头照
     */
    uploadImage:({filePath,type,success,fail,complete})=>{
      const formData = {type};
      return ajax.upload({url:'supplymini/uploadPic.do',filePath,formData,success,fail,complete});
    }
  }

}
