import * as types from './types'
import { setTabBarNum } from '../tool/index.js'
const mutations = {
  [types.SAVE_OPEN_ID](data) {
    getApp().data.openId = data
    console.log('openid' ,data)
    wx.setStorage({key: 'openId',data: data})
  },
  [types.GET_CARTS](data) {
    const obj = wx.getStorageSync('cartsObj') || { num: 0, keyArr: []}
    setTabBarNum(obj.num)
    return obj
  },
  [types.SAVE_CARTS](data) {
    console.log(data)
    setTabBarNum(data.num)
    wx.setStorageSync('cartsObj', data)
    // wx.setStorage({ key: 'cartsObj', data: data })
  },
  [types.SET_ALL_GOODS_IMG_URL](data) {
    const { imgUrl, baseImgUrl} = getApp().data
    if (imgUrl) return
    const url = data || baseImgUrl
    getApp().data.imgUrl = url
    getApp().data.goodsUrl = url + '/upload/images/bdItemInfo/'
    getApp().data.tgGoodsUrl = url + '/upload/images/supplyTeam/'
    getApp().data.zcGoodsUrl = url + '/upload/images/bdSupplierItem/'
    getApp().data.zhGoodsUrl = url + '/upload/images/spBindItemMaster/'
    getApp().data.indexImgUrl = url + '/upload/images/SupplyTemplet/'
  }
}

export default mutations
