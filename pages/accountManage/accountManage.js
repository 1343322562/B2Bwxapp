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
    const _this = this
    const item = userList[index]
    if (nowUser == item.user) {
      wx.navigateBack()
    } else {
      const userList = wx.getStorageSync('userList')
      wx.clearStorageSync()
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
            _this.getItemCls(data)
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
  getItemCls(data) {
    const { branchNo, token, username, platform } = data
    API.Goods.searchItemCls({
      data: { branchNo, token, username, platform },
      success: (res) => {
        console.log(JSON.parse(JSON.stringify(res)))
        if (res.code == 0 && res.data) {
          const { firstCls, secondCls, modularCls, firstSupplierCls, secondSupplierCls } = res.data
          let classifyList = []
          let classifyObj = {}
          firstCls.forEach(item => {
            classifyObj[item.clsNo] = { title: item.clsName }
            classifyList.push(item.clsNo)
          })
          secondCls.forEach(item => {
            const two = item.clsNo.substr(0, 2)
            let one = classifyObj[two]
            if (one) {
              one.children || (classifyObj[two].children = [])
              classifyObj[two].children.push(item)
            }
          })
          firstSupplierCls && firstSupplierCls.forEach(item => {
            classifyObj['s' + item.clsNo] = { title: item.clsName, minDeliveryMomey: item.minDeliveryMomey, supplierName: item.supplierName }
            classifyList.unshift('s' + item.clsNo)
          })
          secondSupplierCls && secondSupplierCls.forEach(item => {
            const two = 's' + item.clsNo.substr(0, 2)
            console.log(two)
            let one = classifyObj[two]
            if (one) {
              one.children || (classifyObj[two].children = [])
              classifyObj[two].children.push(item)
            }
          })

          wx.setStorage({key: 'supcustAllCls',data: modularCls})
          wx.setStorage({ key: 'AllCls', data: { classifyList, classifyObj }})
        } else {
          this.loadingError(res.msg)
        }
      },
      error: (e) => {
        this.loadingError(e != 'login' ? '获取商品类别失败' : false)
      }
    })
  },
  loadingError (text) {
    setTimeout(() => { hideLoading()},800)
    text && alert(text)
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