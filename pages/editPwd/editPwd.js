import API from '../../api/index.js'
import { showLoading, hideLoading, alert,toast } from '../../tool/index.js'
Page({
  data: {
    pwd:'',
    pwd2:'',
    openType: '',
    nowPwd:''
  },
  getValue (e) {
    const k = e.currentTarget.dataset.type
    let obj = {}
    obj[k] = e.detail.value.trim()
    this.setData(obj)
  },
  submit () {
    //showLoading('请稍后...')
    const { pwd, pwd2, nowPwd } = this.data
    let { username, platform } = wx.getStorageSync('userObj')
   
    if (this.openType == 'login') { // 找回密码
      username = this.phone
    } else { // 修改密码
      if (!nowPwd.length) { toast('请输入当前密码!'); return }
      let nowUser
      this.userList.forEach(item => { if (item.user == username) nowUser = item})
      if (nowUser && (nowUser.pwd != nowPwd)) {
        toast('当前密码不正确!');
        return
      }
    }
    if (!pwd.length) { toast('密码不能为空!'); return }
    if (pwd != pwd2) { toast('两次输入密码不一致!'); return }
    API.Login.modifyPassword({
      data: { username, platform, password: pwd},
      success: res => {
        if (res.code == 0) {
          alert('修改成功，需重新登录.',{
            success: ()=> {
              if (this.openType == 'login') {
                wx.navigateBack({data: 1})
              } else {
                getApp().backLogin()
              }
            }
          })
        } else {
          alert(res.msg)
        }
      },
      error: () => {
        alert('修改密码失败，请检查网络是否正常')
      },
      complete: () => {
        hideLoading()
      }
    })
  },
  onLoad (opt) {
    this.openType = opt.openType
    this.phone = opt.phone
    this.setData({ openType: opt.openType || 'my' })
    this.userList = wx.getStorageSync('userList')
  }
})