import API from '../../api/index.js'
import { goPage, toast, alert,showLoading,hideLoading } from '../../tool/index.js'
Page({
  data: {
    nowUser:'',
    userList:[]
  },
  changeUserLogin (e) {
    const index = e.currentTarget.dataset.index
    const { nowUser, userList} = this.data
    const item = userList[index]
    if (nowUser == item.user) {
      wx.navigateBack()
    } else {
      const userList = wx.getStorageSync('userList')
      wx.clearStorageSync()
      wx.setStorage('userList', userList)
      wx.setStorage({key: 'userList', data: userList})
      showLoading('切换账号...')
      API.Login.supplyLoginPwd({
        data: { username: item.user, password: item.pwd, platform: '3', mobilePlatform: 'Android' },
        success: (res) => {
          if (res.code == 0) {
            console.log(50)
            let data = res.data
            data.platform = '3'
            wx.setStorageSync('userObj', data)
            wx.setStorage({key: 'userName',data: item.user})
            wx.removeStorageSync('cartsObj')
            wx.removeStorageSync('configObj')
            wx.reLaunch({
              url: '/pages/index/index'
            })
          } else {
            hideLoading()
            alert(res.msg)
          }
        },
        error: () => {
          hideLoading()
          toast('切换失败')
        }
      })
    }
  },
  quit () {
    alert('确定是否退出?', {
      showCancel: true,
      title: '温馨提示',
      success: ret => {
        if (ret.confirm) {
          getApp().backLogin()
        }
      }
    })
  },
  onLoad (opt) {
    const userObj = wx.getStorageSync('userObj')
    const nowUser = userObj.username
    const userList = wx.getStorageSync('userList')
    this.setData({ nowUser, userList})
  },
  onReady () {
  },
  onShow () {
  }
})