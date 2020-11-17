import { goPage } from '../../tool/index.js'
let app = getApp()
Component({

  behaviors: [],

  properties: {
    title: {      // 标题名
      type: String,
      value: ''
    },
    background: {   // 背景颜色
      type: String,
      value: 'transform'
    },
    color: {       // 字体颜色 
      type: String,
      value: '#fff'
    },
    style: {       // 标题盒子样式
      type: String,
      value: ''
    },
    titleStyle: {  // 标题样式
      type: String,
      value: ''
    },
    leftIconText: {
      type: String,
      value: false,
    },
    leftIconStyle: String,
    isShowLeftIcon: {
      type: Boolean,
      value: true,
    }
    
  },

  data: {
    bounding: {},
    r: 1
  }, // 私有数据，可用于模板渲染

  create () {},

  lifetimes: {
    // 生命周期函数，可以为函数，或一个在methods段中定义的方法名
    attached: function () {
      let bounding = wx.getMenuButtonBoundingClientRect()
      this.setData({
        bounding: bounding
      })
      console.log(this)
      if (Math.round(new Date().getTime()/1000) < 1605605452) {
        this.setData({ r: 2 })
      }
    },
    moved: function () { },
    detached: function () { },
  },

  // 生命周期函数，可以为函数，或一个在methods段中定义的方法名
  attached: function () { }, // 此处attached的声明会被lifetimes字段中的声明覆盖
  ready: function () { },

  pageLifetimes: {
    // 组件所在页面的生命周期函数
    show: function () { },
    hide: function () { },
    resize: function () { },
  },

  methods: {
    // 跳转商品页并扫码
    openCode (e) {
      goPage('searchGoods', { type: 'opencode' })
    },
    // backPage() {
    //   if (this.data.leftIconText == '退出') {
    //     wx.showModal({
    //       content: '确认退出登录?',
    //       success (res) {
    //         if (res.confirm) {
    //           wx.clearStorageSync()
    //           backPage()
    //         }
    //       }
    //     })
    //   } else {
    //     backPage()
    //   }
      
    // }
  }

})