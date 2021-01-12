import * as types from '../../store/types.js'
import API from '../../api/index.js'
import dispatch from '../../store/actions.js'
import { showLoading, hideLoading, alert, getGoodsImgSize, goPage, toast } from '../../tool/index.js'
const maxNum = 20
let baseGoodsList
Page({
  data: {
    config: null,
    pageLoading: false,
    clsList: [],
    goodsList: [], // 商品编号
    goodsObj: {},  // 商品信息。 渲染商品逻辑：根据 goodsList 来查找 goodsObj 中的数据，并渲染至页面
    rmj: false, // 直配是否满减
    rbf: false, // 直配是否开启满增
    totalLength: '',
    partnerCode: getApp().data.partnerCode,
    nowSelectCls: '',
    cartsObj: {},
    searchValue: '' // 搜索框 value
  },
  // 确认搜索
  searchConfirm() {
    const { searchValue } = this.data
    console.log(searchValue)
    this.getGoodsList(searchValue)
  },
  // 搜索框数据绑定
  bindSearchValue(e) {
    let { value } = e.detail
    this.setData({ searchValue: value })
  },
  changeCarts(e) {
    const { type, no } = e.currentTarget.dataset
    console.log(type, no)
    const sourceNo = this.supplierNo
    const goods = this.data.goodsObj[no]
    console.log(goods)
    if (goods.stockQty == 0) return toast('库存不足')
    const {  branchNo } = this.userObj
    const config = {
      sourceType: '1',
      branchNo,
      sourceNo
    }
    // if (this.maxLimitAdd(goods, type, this.data.cartsObj) == 1) return // 是否达到今日限购活动限购标准(直配)。 返回 1，则达到限购值  
    
    const cartsObj = dispatch[types.CHANGE_CARTS]({ goods, type, config }, this.data.cartsObj)
    if (!cartsObj) return 
    cartsObj && this.setData({ cartsObj: cartsObj })
  },
  getCartsData() {
    dispatch[types.GET_CHANGE_CARTS]({
      format: true,
      nowUpdate: true,
      success: (cartsObj) => {
        this.setData({ cartsObj })
      }
    })
  },
  getCls () {
    const supcustNo = this.supplierNo
    const { branchNo, token, platform, username } = this.userObj
    showLoading('请稍后...')
    API.Goods.searchItemCls({
      data: { branchNo, supcustNo, token, platform, username },
      success: res => {
        console.log(res)
        const data = res.data
        if (res.code == 0 && data) {
          const clsList = data.maintainCls || []
          // let nowSelectCls = ''
          if (clsList.length) {
            // nowSelectCls = clsList[0].itemClsno
          } else {
            hideLoading()
            this.setData({ pageLoading: true })
          }
          this.setData({ clsList })
          this.getGoodsList()
        } else {
          hideLoading()
          alert(res.msg)
        }
      },
      error: () => {
        hideLoading()
        alert('获取类别失败，请检查网络是否正常')
      }
    })
  },
  goCartsPage() {
    wx.switchTab({
      url: '/pages/carts/carts'
    })
  },
  goGoodsDetails(e) {
    const itemNo = e.currentTarget.dataset.no
    const supcustNo = this.supplierNo;
    goPage('goodsDetails', { itemNo, supcustNo })
  },
  changeTab (e) {
    const no = e.currentTarget.dataset.no
    if (no != this.data.nowSelectCls) {
      this.setData({ nowSelectCls:no, searchValue: '' })
      this.getGoodsList()
    }
  },
  // 获取 今日限购的促销信息(直配)
  getSupplierPromotionInfo(branchNo, token, platform, username, goodsObj, totalLength) {
    // 获取促销信息
    API.Public.getSupplierAllPromotion({
      data: { branchNo, token, platform, username, supplierNo: this.supplierNo },
      success: res => {
        console.log('促销信息' ,res)
        let data= res.data
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
  getGoodsList (condition = '') {
    showLoading('请稍候...')
    const { nowSelectCls: itemClsNo } = this.data
    const supcustNo = this.supplierNo
    console.log('supcustNo', supcustNo)
    const { branchNo, token, platform, username } = this.userObj
    API.Goods.supplierItemSearch({
      data: { condition, modifyDate:'', supcustNo, pageIndex: 1, pageSize: 1000, itemClsNo, token, platform, username},
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
          this.getSupplierPromotionInfo(branchNo, token, platform, username, goodsObj, totalLength) // 获取并处理今日限购的促销信息(直配)

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
  getSupplier () {
    const { branchNo, token, platform, username } = this.userObj
    const imgUrl = getApp().data.imgUrl
    API.Supplier.searchSupcust({
      data: { branchNo, token, platform, username, condition: '', supplierNo: this.supplierNo},
      success: res => {
        console.log('获取供应商', res)
        const list = res.data
        if (res.code == 0 && list && list.length) {
          list.forEach(item => {
            const cls = item.managementType
            const no = item.supplierNo
            item.goodsImgUrl = imgUrl + '/upload/images/supplier/' + item.picUrl
          })
          this.setData({ config: list[0]})
        } else {
          alert(res.msg)
        }
      },
      error: () => {
        alert('获取入驻商信息失败，请检查网络是否正常')
      }
    })
  },
  onLoad (opt) {
    this.userObj = wx.getStorageSync('userObj')
    this.zcGoodsUrl = getApp().data.zcGoodsUrl
    // 判断是否有传来的参数
    if (opt.config) {
      const config = JSON.parse(opt.config)
      this.supplierNo = config.supplierNo
      this.setData({ config })
    } else {
      this.supplierNo = opt.supplierNo
      this.getSupplier() // 无参数接收时，自动获取供应商
    }
    this.getCls()  // 获取类别数据
    const { branchNo, token, platform, username } = this.userObj
    
  },
  onReady () {
  },
  onShow () {
    this.getCartsData()
  },
  onShareAppMessage() { },
  onReachBottom: function () {
    console.log(this.data.goodsObj)
    if (!this.isLoading && baseGoodsList.length) {
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
      this.setData({ goodsList: newArr })
      setTimeout(() => {
        this.isLoading = false
      }, 200)
    }
  }
})