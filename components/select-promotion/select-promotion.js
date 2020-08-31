// components/select-promotiom/select-promotion.js
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
    good: ''   
  },

  /**
   * 组件的方法列表
   */
  attached(){
    console.log(this.data.data)
  },
  methods: {
    close() { this.setData({ isShow: false }) },    // 关闭促销选择框
    showClick() { this.setData({ isShow: true }) },  // 显示Dialog
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
      const promotionNo = e.currentTarget.dataset.promotion,
            itemNo = this.data.itemNo,
            pages = getCurrentPages(),
            currentPageObj = pages[pages.length-1],
            type = this.data.type
      this.triggerEvent('switchPromotiom', {itemNo, currentPromotionNo: promotionNo})
      console.log(currentPageObj, itemNo, promotionNo)
      console.log(this)
    }
  }
})
