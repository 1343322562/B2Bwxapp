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
    isShow: true
  },

  /**
   * 组件的方法列表
   */
  methods: {
    close() { this.setData({ isShow: false }) },    // 关闭促销选择框
    showClick() { this.setData({ isShow: true }) }  // 显示Dialog
  }
})
