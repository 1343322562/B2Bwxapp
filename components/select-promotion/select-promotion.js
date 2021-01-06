import { toast } from '../../tool/index.js'
Component({
  /**
   * 组件的属性列表
   */
  properties: {
  },

  /**
   * 组件的初始数据
   */
  data: {
    isShow: false,
    data: {},   // 选择框数据
    itemNo: '', // 商品编号
    selectPromotionGood: '', // 当前在切换促销的商品
    promotionNo: '' // 当前所选促销
  },

  /**
   * 组件的方法列表
   */
  attached(){
    console.log(this.data)
  },
  methods: {
    close() { this.setData({ isShow: false, selectPromotionGood: '' }) },    // 关闭促销选择框
    showClick() { this.setData({ isShow: true }); console.log(this.data) },  // 显示Dialog
    selectPromotionClick(e) {
      const promotionNo = e.currentTarget.dataset.promotion,
            itemNo = this.data.itemNo,
            pages = getCurrentPages(),
            currentPageObj = pages[pages.length-1],
            type = this.data.type


      console.log(currentPageObj, itemNo, promotionNo)
      console.log(this)
      currentPageObj.setData({ cartsObj })
            
    },
    onParentEvent(e){
      const currentPromotionNo = e.currentTarget.dataset.promotion // 当前所选促销号
      const { itemNo, promotionNo } = this.data
      if (currentPromotionNo == promotionNo) return toast('请勿选择相同促销')
            // type = this.data.type
      this.triggerEvent('switchPromotiom', { itemNo, currentPromotionNo })
      console.log(itemNo, promotionNo)
      console.log(this)
      this.close()
    }
  }
})
