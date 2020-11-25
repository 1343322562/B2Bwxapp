import API from '../../api/index.js'
import { getGoodsImgSize, showLoading, hideLoading, toast } from '../../tool/index.js'
import api from '../../api/index.js'
Page({

  /**
   * 页面的初始数据
   */
  data: {
    sVal: '',
    goodsData: [],
    selectGood: '',
    goodBatch: [{  // 批次数据
      effcetDate: '', // 到期日期
      batchNo: '',    // 批次号
      inDate: '',     // 入库日期
      outDate: '',    // 出库日期
      productionDate: '', // 生产日期
      sheetNo: '',    // 要货单号
      outQty: 0       // 出库数量
    }], 
  },
  // 统配
  getGoodsList(condition) {
    const _this = this
    const { branchNo, token, username, platform } = wx.getStorageSync('userObj')
    return new Promise(function(resolve) {
      API.Goods.itemSearch({
        data: { condition, modifyDate:'', pageIndex: 1, pageSize: 1000, token, platform, username},
        success: res => {
          console.log(res)
          if(res.code == 0 && res.data && res.data.itemData.length) {
            const goodsData = res.data.itemData
            goodsData.forEach(goods => {
              if (goods.supcustNo) {
                goods.goodsImgUrl = _this.zcGoodsUrl + goods.itemNo + '/' + getGoodsImgSize(goods.picUrl)
              } else {
                goods.goodsImgUrl = _this.goodsUrl + goods.itemNo + '/' + getGoodsImgSize(goods.picUrl)
              }
            })
            resolve(goodsData)
          } else {
            resolve([])
          }
        }
      })
    })
  },
  // 直配商品搜索
  getSupplierGoodsList (condition) {
    const _this = this
    const { branchNo, token, platform, username } = wx.getStorageSync('userObj')
    return new Promise(function(resolve) {
      API.Goods.supplierItemSearch({
        data: { condition, modifyDate:'', pageIndex: 1, pageSize: 1000, token, platform, username},
        success: res => {
          console.log(res)
          if(res.code == 0 && res.data) {
            const goodsData = res.data.itemData
            goodsData.forEach(goods => {
              goods.goodsImgUrl = _this.zcGoodsUrl + goods.itemNo + '/' + getGoodsImgSize(goods.picUrl)
            })
            resolve(goodsData)
          } else {
            resolve([])
          }
        }
      })
    })
  },
  // 搜索商品
  async search() {
    showLoading('请稍后...')
    const { sVal: condition } = this.data
    let goodsData = [] // 总商品
    let goodsList = [] // 统配
    let supGoodsList = [] // 直配
    goodsList = await this.getGoodsList(condition).then((goodsData) => {
      return goodsData || []
    })
    supGoodsList = await this.getSupplierGoodsList(condition).then((goodsData) => {
      return goodsData || []
    })
    goodsData = [ ...goodsList, ...supGoodsList ]
    hideLoading()
    this.setData({ goodsData })
    if (!goodsData.length) toast('无商品数据')
    console.log(goodsData)
    
  },
  // 批次查询
  searchPC(e) {
    const _this = this
    const { i } = e.currentTarget.dataset
    const { goodsData } = this.data
    console.log(i, goodsData, e)
    const itemNo = goodsData[i].itemNo
    const { branchNo, token, platform, username } = wx.getStorageSync('userObj')
    API.Public.queryItemBatch({
      data: { itemNo, branchNo, token, platform, username },
      success(res) {
        console.log(res)
        if (res.data.length) {
          _this.setData({ goodsData: [], selectGood: goodsData[i], goodBatch: res.data })
        } else {
          toast('暂无批次数据')
          _this.setData({ goodsData: [], selectGood: goodsData[i] })
        }
      }
    })
  },
  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    this.zcGoodsUrl = getApp().data.zcGoodsUrl
    this.goodsUrl = getApp().data.goodsUrl
  }, 
  inputBind(e) {
    let { value }  = e.detail
    this.setData({ sVal: value })
  },
  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function () {

  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function () {

  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide: function () {

  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload: function () {

  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh: function () {

  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom: function () {

  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function () {

  }
})