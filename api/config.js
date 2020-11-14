import urlConfig from './type'

export default {
  baseURL: urlConfig[getApp().data.partnerCode],
  post (url, param) {
    this.ajax('post', url, param)
  },
  get (url, param) {
    this.ajax('get', url, param)
  },
  ajax(type, url, param) {
    let requestObj = param.data || {}
    const userObj = wx.getStorageSync('userObj')
    if (userObj && !requestObj.branchNo) { requestObj.branchNo = userObj.branchNo }
    requestObj.mobilePlatform = getApp().data.phoneType
    const requestUrl = wx.getStorageSync('requestBaseUrl')||this.baseURL
    
    let request = {
      url: requestUrl+ url,
      method: type,
      header: {
        'content-type': url.indexOf('application') === -1 ? 'application/x-www-form-urlencoded' : 'application/json'
      },
      dataType: 'json',
      data: requestObj ,
      success:  (response) => {
        const data = (typeof response === 'object' ? response.data : response)
        if (!data || data.code == 2) {
          wx.setStorageSync('isWxLogin', true)
          setTimeout(() => { wx.hideLoading()},800)
          const page = getCurrentPages()[0].route.indexOf('login') // 获取当前页面栈。数组中第一个为首页，最后一个为当前页面。
          wx.showModal({
            title: '温馨提示',
            content: data.msg,
            success: () => {
              getApp().backLogin()
              // wx.removeStorageSync('userObj')
              // wx.removeStorageSync('allPromotion')
              // wx.removeStorageSync('configObj')
              // if (page != -1) {
              //   wx.reLaunch({ url: '/pages/login/login' })
              //   //param.error && param.error('login')
              // } else {
              //   wx.reLaunch({ url: '/pages/login/login' })
              // }
            },
            showCancel: false
          })
        } else {
          param.success(data)
        }
      },
      fail: param.error,
      complete: param.complete
    }
    wx.request(request)
  },
  upload({url,filePath,formData,success,fail,complete}){
    const requestUrl = wx.getStorageSync('requestBaseUrl')||this.baseURL;
    const mobilePlatform = getApp().data.phoneType;
    const platform	= '1';
    formData = {...formData,mobilePlatform,platform};

    wx.uploadFile({
      url: requestUrl + url,
      filePath: filePath,
      name: 'picFile',
      formData:formData,
      success:(res)=>{
        let data = (typeof res === 'object' ? res.data : res);
        data = JSON.parse(data);
        success(data);
      },
      fail:fail,
      complete:complete
    })
  }
}
