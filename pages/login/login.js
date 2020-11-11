import * as types from '../../store/types.js'
import API from '../../api/index.js'
import dispatch from '../../store/actions.js'
import commit from '../../store/mutations.js'
import CryptoJS from '../../tool/aes.js'
import MD5 from '../../tool/md5.js'
import urlConfig from '../../api/type'
import { showLoading, hideLoading, goPage, toast, alert, setUrl } from '../../tool/index.js'
Page({
  data: {
    tabBarList:['账号登录','验证码登录'],
    tabBarIndex:0,
    count: 0,
    tel:'',
    name:'',
    code:'',
    pwd:'',
    pageLoading: false,
    loadingImg: "",
    animation: {},
    showLoadingImg: true,
    showUserList: false,
    userListAnimation:{},
    userList: [],
    baseUrl:'',
    showSetrequest: false,
    partnerCode: getApp().data.partnerCode,
    agreement: true,
    agreementObj: {}
  },
  getAgreement() {
    API.Login.getUserAgreementInfo({
      data: { platform: '3', agreementType: '0' },
      success: res => {
        console.log(res)
        if (res.code == 0 && res.data.agreementValue != '') {
          const agreementObj = res.data.agreementValue
          this.setData({ ['agreementObj.users']: agreementObj , agreement: agreementObj.users?true: false})
        }
      }
    })

    API.Login.getUserAgreementInfo({
      data: { platform: '3', agreementType: '1' },
      success: res => {
        if (res.code == 0 && res.data.agreementValue != '') {
          const agreementObj = res.data.agreementValue
          this.setData({ ['agreementObj.secret']: agreementObj, agreement: agreementObj.secret ? true : false })
        }
      }
    })
  },
  checkboxChange (e) {
    const agreement = !this.data.agreement
    this.setData({ agreement })
  },
  openUserAgreement (e) {
    let id = e.target.dataset.id
    if (id == '0') {
      alert(this.data.agreementObj['users'], {
        confirmText: '知道了',
        title: '用户协议'
      })
    } else if (id == '1') {
      alert(this.data.agreementObj['secret'], {
        confirmText: '知道了',
        title: '隐私协议'
      })
    }
    
  },
  quit () {
    wx.navigateBack()
  },
  setRequestUrl () {
    const baseUrl = wx.getStorageSync('requestBaseUrl') || urlConfig[this.data.partnerCode]
    this.setData({ baseUrl , showSetrequest:true})
  },
  confirmSetRequest (e) {
    const types = e.currentTarget.dataset.type
    if (types =='1') {
      const baseUrl = this.data.baseUrl
      if (urlConfig[this.data.partnerCode] == baseUrl || !baseUrl) {
        wx.removeStorageSync('requestBaseUrl')
      } else {
        wx.setStorageSync('requestBaseUrl', baseUrl)
      } 
      wx.removeStorageSync('openId')
      getApp().backLogin()
      
    } else {
      this.setData({ showSetrequest: false })
    }
  },
  onShareAppMessage() {
    return {
      path: '/pages/login/login'
    }
  },
  changeShowUserList (type) {
    let { userList, showUserList} = this.data
    if (typeof type == 'string' && type =='hide') {
      showUserList = true
    }
    console.log(this.userListAnimation)
    'userListAnimation' in this &&  this.userListAnimation.height(showUserList ? 0 : ((userList.length * 80)+'rpx')).step()
    'userListAnimation' in this && this.setData({ showUserList: !showUserList, userListAnimation: this.userListAnimation.export()})
  },
  imgError () {
    this.setData({ showLoadingImg: false})
    if (this.anewLoading) showLoading('登录中...')
    console.log('加载失败')
  },
  changeLoginType (e) {
    const tabBarIndex = e.currentTarget.dataset.type
    this.changeShowUserList('hide')
    this.setData({ tabBarIndex})
  },
  getCode () {
    let phone = this.data.tel
    const basePhone = phone
    if (!/^[0-9]{11}$/.test(phone)) {
      toast('请输入正确的手机号')
      return;
    }
    showLoading('发送中...')
    const key = "3FECD1C97D6249E2"
    phone = CryptoJS.toEncrypt(String(phone), key)
    const sign = MD5.hexMD5("code=" + key+"&phone=" + phone + "&version=1.0")
    console.log(phone, sign)
    API.Login.sendVerifyCode({
      data: { phone, type: '1', platform: '3', sign },
      success: res => {
        const code = res.data
        if (res.code == 0 && code) {
          toast('发送成功')
          this.code = code
          this.getCodePhone = basePhone
          let count = 120
          this.time = setInterval(() => {
            this.setData({ count })
            if (!count--) {
              clearInterval(this.time)
              this.code = null
              this.getCodePhone = null
            }
          }, 1000)
        } else {
          alert(res.msg||'发送失败')
        }
      },
      error: ()=> {
        alert('发送验证码失败，请检查网络是否正常')
      },
      complete: ()=> {
        hideLoading()
      }
    })

  },
  getInputDate (e) {
    const type = e.currentTarget.dataset.type
    let obj = {}
    obj[type] = e.detail.value.trim()
    this.setData(obj)
  },
  hideLoadingImg (type,fun) {
    setTimeout(()=>{
      if (fun) {
        fun()
      } else {
        console.log(this)
        'animation' in this &&  this.animation.opacity(0).scale(1.5).step()
        'animation' in this && this.setData({ animation: this.animation.export() })
        setTimeout(() => { this.setData({ showLoadingImg: false }) }, 1800)
      }      
    },type || 2000)
  },
  goIndex () {
    const { openType, page, data } = this.shareData|| {}
    if (openType) {
      wx.reLaunch({
        url: '/pages/' + page + '/' + page + (data ? ('?'+setUrl(JSON.parse(data))):'')
      })
    } else {
      wx.switchTab({ url: '/pages/index/index' })
    }
  },
  loadingError (text) {
    setTimeout(() => { hideLoading()},800)
    text && alert(text)
    this.hideLoadingImg(100)
  },
  // 获取并处理类别
  getItemCls({ branchNo, token, username, platform }) {
    console.log({ branchNo, token, username, platform })
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
          this.getAllPromotion()
        } else {
          this.loadingError(res.msg)
        }
      },
      error: (e) => {
        this.loadingError(e != 'login' ? '获取商品类别失败' : false)
      }
    })
  },
  getAllPromotion () {
    dispatch[types.GET_ALL_PROMOTION]({
      success: (res) => {
        this.hideLoadingImg(3000, () => {
          this.goIndex()
        })
      },
      error: (e) => {
        //this.loadingError(e != 'login' ?'获取促销信息失败':false)
        this.goIndex()
      }
    })
  },
  getCollectGoods({ branchNo, token, username, platform }) {
    API.Public.searchCollectByBranch({
      data: { branchNo, token, username, platform },
      success: (res) => {
        const data = res.data
        if (res.code == 0 && data) {
          let collectObj = {}
          data.forEach(item => {
            collectObj[item.itemNo]= true
          })
          wx.setStorage({key: 'collectObj',data: collectObj})
        }
      }
    })
  },
  getPageData (data,type) {
    this.getConfig(data)
    this.getCollectGoods(data)
    this.getItemCls(data)
  },
  getConfig({ branchNo, token, username, platform }) {
    API.Public.getCommonSetting({
      data: { branchNo, token, username, platform },
      success: (res) => {
        console.log(265,'获取并缓存系统配置', res)
        if (res.code == 0) {
          const data = res.data
          wx.setStorage({ key: 'configObj', data: data })
          commit[types.SET_ALL_GOODS_IMG_URL](data.picUrl)
        } else {
          this.hideLoadingImg(100)
          alert(res.msg||'获取系统配置失败!')
        }
      },
      error: () => {
        alert('获取系统配置失败')
      }
    })
  },
  selectedUser (e) {
    const index = e.currentTarget.dataset.index;
    const item = this.data.userList[index]
    this.setData({ name: item.user,pwd:item.pwd})
    this.changeShowUserList('hide')
  },
  deleteUser (e) {
    const index = e.currentTarget.dataset.index;
    let userList = this.data.userList
    let newList = userList.filter((item, i) => index != i)
    this.setData({ userList: newList })
    wx.setStorage({ key: 'userList', data: newList })
  },
  login () {
    
    let { tabBarIndex, tel, name, code, pwd, userList, agreement} = this.data
    console.log(agreement)
    if (!agreement) return
    const request = this.notNull()
    if (tabBarIndex && request) {
      if (code != this.code || this.getCodePhone != tel){
        toast(code != this.code?'验证码不正确':'当前手机号与验证码不匹配')
        return
      }
    } else if (request.username) {
      wx.setStorage({ key: 'userName', data: request.username })
    }
    if (request) {
      showLoading('登录中...')
      API.Login[tabBarIndex ? 'supplyLogin' :'supplyLoginPwd']({
        data: request,
        success: (res) => {
          if (res.code == 0) {
            console.log(res)
            let data = res.data
            let isRepetition = false
            let editIndex = 0
            data.platform = '3'
            wx.setStorageSync('userObj', data)
            getApp().data['userObj'] = data
            console.log('asdassssssssssssda')
            userList.forEach((item,index)=> {
              if (item.user == name) {
                isRepetition = true
                editIndex = index
              }
            })
            if (!isRepetition && request.password) {
              userList.unshift({ user: name, pwd, name: data.branchName})
              wx.setStorage({ key: 'userList', data: userList })
            } else if (isRepetition) {
              userList[editIndex].pwd = pwd
              wx.setStorage({ key: 'userList', data: userList })
            }
            this.getPageData(data)
          } else {
            hideLoading()
            alert(res.msg||'登录失败')
          }
        },
        error: () => {
          hideLoading()
          alert('登录失败')
        }
      })
    }
  },
  notNull() {
    const {tabBarIndex,tel, name, code, pwd } = this.data
    if (tabBarIndex ? (!code || !tel) : (!name || !pwd)) {
      toast((tabBarIndex ? (!tel ? '手机号' : '验证码') : (!name ? '用户名' : '密码'))+'不能为空')
      return false
    } else {
      return tabBarIndex ? { username: tel, platform: '3' } : { username: name, password: pwd, platform: '3' }
    }
  },
  goPage (e) {
    console.log('go')
    const openType = e.currentTarget.dataset.type
    this.changeShowUserList('hide')
    goPage('verificationPhone', { openType })
    console.log(e)
  },
  onLoad (opt) {
    console.log(364, opt)
    this.getAgreement()
    const nowDate = new Date()
    const dateStr = String(nowDate.getFullYear()) + (nowDate.getMonth() + 1) + nowDate.getDate()
    const user = wx.getStorageSync('userObj')
    if (dateStr == '20201111' && !opt.isLogin && !wx.getStorageSync('isWxLogin') && (!user || user.isLogin)) {
      console.log(1)
      showLoading()
      let request = {
        url: 'https://mmj.zksr.cn/zksrb2b-web/asdss.json',
        method: 'POST',
        header: {
          'content-type': 'application/json'
        },
        dataType: 'json',
        data: {},
        success: (ret) => {
          console.log(ret)
          if (ret.statusCode == 200 && ret.data) {
            if (ret.data.code == 0 || ret.data.code == 1) {
              let data = ret.data.data
              data.platform = '3'
              wx.setStorageSync('userObj', data)
              this.getPageData(data)
            } else {
              wx.hideLoading()
              wx.setStorageSync('isWxLogin', true)
              wx.removeStorageSync('userObj')
              // this.hideLoadingImg()
              this.setData({ pageLoading: true})
            }
          } 
        },
        error: () => {
          wx.hideLoading()
          this.setData({ pageLoading: true })
          // this.hideLoadingImg()
        }
      }
      console.log(2, wx.canIUse('request'))
      wx.request(request)
      console.log(3)
    } else if (opt.isLogin) {
      this.hideLoadingImg()
      this.setData({ pageLoading: true, isLogin: true })
    } else {
      if (wx.getStorageSync('USEROBJ')) {
        wx.clearStorageSync()
      }
      const userList = wx.getStorageSync('userList') || []
      const name = wx.getStorageSync('userName')
      if (userList.length && name) {
        userList.filter(item => {
          if (item.user == name) {
            this.setData({ name: item.user, pwd: item.pwd })
          }
        })
      }
      this.shareData = opt
      let animation = wx.createAnimation({ duration: 2500, timingFunction: 'ease' })
      let userListAnimation = wx.createAnimation({ duration: 300, timingFunction: 'ease' });
      this.userListAnimation = userListAnimation;
      this.animation = animation;
      this.setData({ animation: animation, userListAnimation: userListAnimation, userList })
      dispatch[types.GET_OPEN_ID]()
      name && this.setData({ name })
      const configObj = wx.getStorageSync('configObj')
      configObj && this.setData({ loadingImg: configObj.picUrl })
      console.log(4)
      wx.getStorage({
        key: 'userObj',
        success: (res) => {
          wx.removeStorage({ key: 'cartsObj' })
          wx.removeStorage({ key: 'updateCartsTime' })
          this.anewLoading = true
          this.setData({ pageLoading: true })
          this.getPageData(res.data, true)
        },
        fail: () => {
          this.setData({ pageLoading: true })
          this.hideLoadingImg()
        }
      })


    }
  },
  onReady () {
  },
  onShow() {
  }
})