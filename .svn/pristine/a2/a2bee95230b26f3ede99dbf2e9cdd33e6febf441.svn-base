import * as types from '../../store/types.js'
import API from '../../api/index.js'
import dispatch from '../../store/actions.js'
import commit from '../../store/mutations.js'
import { showLoading, hideLoading, goPage, toast, alert, getGoodsImgSize } from '../../tool/index.js'
let app = getApp()
Page({
  data: {
    pageLoading: false,
    pageObj: [],
    pageObjKey: [],
    indexImgUrl: '',
    goodsUrl: '',
    promotionObj: {},
    categoryList: [],
    nowSelectedCls:'',
    partnerCode: getApp().data.partnerCode,
    // 首页弹窗信息
    getPopupObj: {
      popupType: 2, 	// 0：优惠卷， 1：通知  2: 无弹窗
      coupons: [] 		// 优惠卷或通知
    },
    // 常购商品位置
    position: {
      startX: 0,
      startY: 0,
      X: '20px' ,
      Y: '85vh'
    }
  },
  // 常购商品触摸开始
  touchstartFrequentPurchase(e){
    console.log(0,e)
    const { offsetLeft: clientX, offsetTop: clientY } = e.currentTarget
    this.data.position.startX = parseInt(clientX)
    this.data.position.startY = parseInt(clientY)
  },
  // 常购商品触摸结束
  touchendFrequentPurchase(e){
    console.log(0,e)
    const { offsetLeft: clientX, offsetTop: clientY } = e.currentTarget
    const { startX, startY } = this.data.position
    console.log(startX, startY)
    console.log(clientX, clientY)
    if (startX == parseInt(clientX) && startY == parseInt(clientY)) console.log('点击')
  },
  // 常购商品触摸
  touchmoveFrequentPurchase(e){
    console.log(1, e)
    const { clientX, clientY } = e.touches[0]
    const _this = this
    if (_this.moveTimer) clearTimeout(_this.moveTimer)
    _this.moveTimer = setTimeout(() => {
      console.log(100)
      _this.setData({ ['position.X']: parseInt(clientX)-20 + 'px', ['position.Y']: parseInt(clientY)-20 + 'px' })
    }, 20)
  },

  toTopClick(e) {
    console.log(e)
    wx.pageScrollTo({
      scrollTop: 1,
      success(res) {
        console.log(res)
      }
    })
  },
  toSearchPageClick() { goPage('searchGoods') }, // 跳转搜索页
  // 关闭弹窗
	closePopup () {
		const _this = this
		let getPopupObj = _this.data.getPopupObj
		getPopupObj.popupType = 2
		_this.setData({ getPopupObj })
	},
  // 获取首页弹窗配置
	getPopup () {
		const _this = this
    const { branchNo, token, platform, username } = _this.userObj
    API.Public.getPopup({
      data: { branchNo, token, platform, username },
      success(obj) {
				 console.log(obj)
				 let getPopupObj = _this.data.getPopupObj
         getPopupObj.popupType = obj.data.popupType
				 if (getPopupObj.popupType != 0 && getPopupObj.popupType != 1) return 
				
			   switch (getPopupObj.popupType) {
           case 0: // 优惠卷
            _this.getCoupons(getPopupObj, obj.data.popupData)
            break;
           case 1: // 通知
            _this.notify(obj.data)
           break;
          }	
      }
    })
  },
  // 通知数据处理
  notify (data) {
    data.popupData[0].picUrl = this.goodsUrl + '/upload/images/homePopup/' + picUrl
    this.setData({ getPopupObj: {popupType: 1, coupons: data.popupData} })
  },
  // 获取优惠卷请求
	getCoupons (getPopupObj, popupData) {
		const _this = this
    const { branchNo, token, platform, username } = _this.userObj
    API.Public.getCouponsBatchNo({
      data: { branchNo, token, platform, username },
      success (obj) {
        console.log(obj, '获取优惠卷getCouponsBatchNo.do')
				let couponsArr = []
				let allCouponsArr = obj.data
				// 处理优惠券数组
				popupData.forEach(item => {
					allCouponsArr.forEach(t => {
						if (item.batchNo == t.giveOutBatch) couponsArr.push(t) // 推入对应优惠券
					})
				})

				getPopupObj.coupons = couponsArr

				_this.setData({ getPopupObj })
				setTimeout(() => {
					console.log(_this)
				}, 500);
      }
    })
  },
  // 领取优惠卷
	byCoupons(e) {
    let i = e.currentTarget.dataset.index
		console.log('index', i)
    const { branchNo, token, platform, username } = this.userObj
		const _this = this,
    coupon = _this.data.getPopupObj.coupons[i]

    API.Public.getCouponsByBatchNo({
      data: { branchNo, token, platform, username, giveOutBatch: coupon.giveOutBatch, giveOutNo: branchNo, },
      success (obj) {
        toast('领取成功')
      },
      error(res){
        toast('领取失败')
      }
    })

		Fun.ajax(
			baseUrl+'getCouponsByBatchNo.do',
			"POST",
			{
				giveOutBatch:	coupon.giveOutBatch,
				giveOutNo:	branchNo,
				branchNo:	branchNo,
				token:	token,
				username:	userName,
				platform:	platform
			},
			function(obj){
				console.log(obj)
				_this.successToast('领取成功')	
			},
			function(obj){
				console.log(obj)
				_this.failToast('领取失败')
			}
		)
	},
  changeCls (e) {
    const no = e.currentTarget.dataset.no
    this.setData({ nowSelectedCls: no})
    // const query = wx.createSelectorQuery().select('#' + no).boundingClientRect(ret => {
    //   console.log(ret)
    //   wx.pageScrollTo({ scrollTop: ret.top, duration: 100 })
    // }).exec()
    // wx.createSelectorQuery().selectViewport('#' + no).scrollOffset(ret => {
    //   console.log(ret)
    // }).exec()

  },
  getPageData () {
    showLoading('请稍后...')
    const { branchNo, dbBranchNo: dbranchNo, token, platform, username } = this.userObj
    API.Index.getIndexSetting({
      data: { branchNo, token, username, platform, dbranchNo },
      success: (res) => {
        if (res.code == 0) {
          let list = res.data,
          keyList = new Array(),
            nowDate = new Date().getDate(),
            categoryList = [];
          for (let i = 0; i < list.length; i++) {
            let type = list[i].templetType;
            let moduleName = list[i].anchorText;
            if (moduleName) {
              const no = 'moduleId' + categoryList.length
              categoryList.push({ name: moduleName, no: no })
              list[i].moduleId = no
            }
            if (type == '5') {
              let num = list[i].templetStyle == '1' ? 2 : 3,
                nowArr = list[i].details,
                newArr = new Array();
              nowArr.map((a, b) => {
                a.picUrl = this.goodsUrl + a.connectionNo + '/' + getGoodsImgSize(a.picUrl,1) + '?num=' + nowDate
              })
              while (nowArr.length > num) {
                newArr.push(nowArr.splice(0, num));
              }
              nowArr.length && newArr.push(nowArr);
              list[i].details = newArr;
              keyList.push({ current: 0, num: list[i].details.length });
            } else {
              if (type == '6') {
                list[i].details.forEach(a => {
                  a.picUrl = getGoodsImgSize(a.picUrl, 1)
                  a.productionTime = 'productionTime' in a && a.productionTime.slice(0, 10)
                })
              }
              keyList.push(false);
            }
          }
          console.log({ pageObjKey: keyList, pageObj: list, random: +new Date(), categoryList: categoryList})
          this.setData({ pageObjKey: keyList, pageObj: list, random: +new Date(), categoryList});
        } else {
          alert(res.msg)
        }
      },
      complete: () => {
        hideLoading()
        this.setData({ pageLoading: true})
        wx.stopPullDownRefresh()
      }
    })
  },
  imgLoad (e) {
    let i = e.target.dataset.i, pageObjKey = this.data.pageObjKey;
    if (pageObjKey[i]) return;
    let imgwidth = e.detail.width,
      imgheight = e.detail.height,
      ratio = imgwidth / imgheight,
      viewHeight = 750 / ratio;
    pageObjKey[i] = (viewHeight + 'rpx');
    this.setData({ pageObjKey: pageObjKey })
  },
  goodsSwiperFun (e) {
    let t = this, i = e.detail.current, obj = t.data.pageObjKey;
    obj[e.target.dataset.index].current = i;
    t.setData({ pageObjKey: obj })
  },
  signIn () {
    const { branchNo, dbBranchNo: dbranchNo, token, platform, username } = this.userObj
    API.Index.signIn({
      data: { branchNo, token, username, platform, dbranchNo },
      success: (res) => {
        if (res.code == 0) {
          alert(res.msg)
        }
      }
    })
  },
  changeSeiper (e) {
    let t = e.currentTarget.dataset.type, i = e.currentTarget.dataset.index, obj = this.data.pageObjKey;
    if ((t == '0' && obj[i].current == 0) || (t == '1' && obj[i].current == (obj[i].num - 1))) return;
    if (t == '0') {
      obj[i].current--;
    } else {
      obj[i].current++;
    }
    this.setData({ pageObjKey: obj });
  },
  goPage (e) {
    console.log(e.currentTarget)
    let { type, val, title,supplier} = e.currentTarget.dataset
    console.log(type, val, title)
    val = val?val.replace(/\s+/g, ""):''
    if (type == '1' && val == '1') { // 优惠券领取
      goPage('getCoupons')
    } else if (type == '1' && val == '2') { // 积分兑换
      goPage('integralExchange')
    } else if (type == '1' && val == '3') { // 首单特价
      goPage('activity', { title, type, value: val })
    } else if (type == '1' && val == '4') { // 积分详情
      goPage('integral')
    } else if (type == '1' && val == '4') { // 海报
      // goPage('H5')
    } else if (type == '2') { // 商品详情
      val && goPage('goodsDetails', { itemNo: val })
    } else if (type == '3') { // 活动页
      goPage('activity', { title, type, value: val})
    } else if (type == '8') { // 组合促销
      goPage('activity', { title, type, value: val })
    } else if (type == '9') { // 秒杀
      goPage('seckill')
    } else if (type == '10') { // 入驻商商品列表
      goPage('activity', { title, type, value: val, supplierNo:supplier||'' })
    } else if (type == '11') { // 跳转到入驻商
      goPage('supplierGoods', { supplierNo: val })
    } else if (type == '12' ) { // 海报
      goPage('H5', { connectionNo: val})
    } else if (type == '13' ) { // 入驻商类别
      wx.switchTab({ url: '/pages/t_goods/t_goods' })
      app.data.supplierNo = 's' + val
    }
    
  },
  getCartsData () {
    dispatch[types.GET_CHANGE_CARTS]({
      format: true,
      success: () => {}
    })
  },
  getAllPromotion () {
    dispatch[types.GET_ALL_PROMOTION]({
      success: (res) => {
        this.setData({ promotionObj: res })
      }
    })
  },
  onShow() {
    // if (!this.userObj) { this.userObj = wx.getStorageSync('userObj'); console.log(1000) }
    const userObj =  wx.getStorageSync('userObj')
    if (userObj) this.userObj = userObj

    this.getCartsDataTimer = setTimeout(() => {
      this.getCartsData()
    }, 500)
    this.getAllPromotionTimer = setTimeout(() => {
      this.getAllPromotion()
    }, 900)
  },
  onShareAppMessage() {
    console.log('share')
    const { branchName, dbBranchName } = wx.getStorageSync('userObj')
    return {
      title: dbBranchName || branchName,
      path: '/pages/login/login'
    }
  },
  onLoad (opt) {
    let partnerCode = this.data.partnerCode
    console.log(1)
    if(partnerCode == 1052) {
      wx.setTabBarStyle({ color: '#707070', selectedColor: '#fdd100' })
      wx.setTabBarItem({ index: 0, text: '首页', iconPath: 'images/yz_index.png', selectedIconPath: 'images/yz_index_act.png' })
      wx.setTabBarItem({ index: 1, text: '分类', iconPath: 'images/yz_good.png', selectedIconPath: 'images/yz_good_act.png' })
      wx.setTabBarItem({ index: 2, text: '购物车', iconPath: 'images/yz_car.png', selectedIconPath: 'images/yz_car_act.png' })
      wx.setTabBarItem({ index: 3, text: '我的', iconPath: 'images/yz_my.png', selectedIconPath: 'images/yz_my_act.png' })
    }
    this.systemInfo = wx.getSystemInfoSync()
    this.userObj = getApp().data['userObj'] || wx.getStorageSync('userObj')
    this.getPopup()
    getApp().data.goodsUrl || (commit[types.SET_ALL_GOODS_IMG_URL]())
    const { goodsUrl, indexImgUrl } = getApp().data
    this.goodsUrl = goodsUrl
    this.setData({ indexImgUrl, goodsUrl })
    this.getPageData()
    this.signIn()
  },
  onPullDownRefresh () {
    this.getPageData()
  },
  onHide(){
    this.pageLoading = false
      clearTimeout(this.getAllPromotionTimer, this.getCartsDataTimer)
  }
})