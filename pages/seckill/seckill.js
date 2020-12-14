import API from '../../api/index.js'
import { showLoading, hideLoading, alert, getTime, getGoodsImgSize, deepCopy} from '../../tool/index.js'
Page({
  data: {
    partnerCode: getApp().data.partnerCode,
    list: [],
    pageLoading: false,
    nowSelectDate: 0,
    nowChangeTime: []
  },
  getPageData () {
    showLoading('请稍后...')
    API.Seckill.getMsData({
      data: this.requestData,
      success: res => {
        console.log(res)
        if (res.code == 0 && res.data) {
          this.setListData(res.data)
        } else {
          alert(res.msg)
        }
      },
      complete: () => {
        
        setTimeout(() => {
          hideLoading()
          this.setData({ pageLoading: true })
        }, 250)
      }
    })
  },
  addCarts (e) {
    const index = e.currentTarget.dataset.index
    const list = this.data.list[this.data.nowSelectDate]
    const item = list.item[index]
    if (list.type != '1' || (item.stockQty <= 0)) return
    let requestData = deepCopy(this.requestData)
    requestData.items = JSON.stringify([{
      itemNo: item.itemNo,
      realQty: item.minSupplyQty,
      origPrice: item.price,
      validPrice: item.promotionPrice,
      sourceNo: this.dbBranchNo,
      sourceType: '0',
      branchNo: requestData.branchNo,
      parentItemNo: '',
      specType: '0'
    }])
    showLoading('请稍后...')
    API.Carts.addItemToCar({
      data: requestData,
      success: res => {
        if (res.code == 0) {
          alert('抢购成功，商品已加入购物车',{
            confirmText: '确定',
            showCancel: false
          })
        } else {
          alert(res.msg)
        }
      },
      error: ()=>{
        alert('秒杀失败，请检查网络是否正常')
      },
      complete: ()=> {
        hideLoading()
      }
    })
  },
  changeTime (i) {
    const item = this.data.list[i]
    const dateTime = (item.type == '1' ? item.endTime : item.startTime)
    if (item.type == '0') return;
    this.Time && clearInterval(this.Time);
    this.Time = setInterval(() => {
      let nowTime = (+new Date()),
        tim = dateTime - nowTime,
        sTime = 1000 * 60 * 60,
        fTime = 1000 * 60,
        mTime = 1000,
        s = parseInt(tim / sTime),
        f = parseInt((tim % sTime) / fTime),
        m = parseInt((tim % fTime) / mTime);
      if ((s + f + m) <= 0) {
        clearInterval(this.Time);
        showLoading()
        setTimeout(() => {
          this.setListData(this.data.list)
        }, 300)
      }
      this.setData({ nowChangeTime: [(s < 10 ? '0' : '') + s, (f < 10 ? '0' : '') + f, (m < 10 ? '0' : '') + m] })
    }, 100)
  },
  getTimeType (start, end) {
    let nowTime = +new Date()
    return (nowTime > end ? '0' : (nowTime > start && nowTime < end ? '1' : '2'))
  },
  selectDate: function (i) {
    let index = i.currentTarget.dataset.index
    this.setData({ nowSelectDate: index });
    this.changeTime(index)
  },
  setListData (list) {
    const nowTime = +new Date()
    let nowSelectDate
    this.setListDataTimer = setTimeout(() => {
      list.forEach((info, index) => {/* tyle 0 已結束   1 開始 2 未開始  */
        let startTime = info.startDate.split(' ')
        info.time = [startTime[0].split('-'), startTime[1].split(':')]
        info.startTime = getTime(info.startDate)
        info.endTime = getTime(info.endDate)
        info.type = this.getTimeType(info.startTime, info.endTime)
        if (nowTime < info.endTime && (!nowSelectDate && nowSelectDate != 0)) nowSelectDate = index;
        info.item.forEach(item => {
          item.itemImgUrls = this.goodsUrl + item.itemNo + '/' + getGoodsImgSize(item.picUrl)
          item.productionTime = 'productionTime' in item && item.productionTime.slice(0, 10)
        })
        info.item = info.item.sort((a, b) => Number(a.serialNo) - Number(b.serialNo))
      })
      
      nowSelectDate || (nowSelectDate = 0)
      this.setData({ list, nowSelectDate })
      hideLoading()
      list.length && this.changeTime(nowSelectDate);
    }, 200)
    
  },
  onLoad (opt) {
    const { branchNo, token, platform, username, dbBranchNo } = wx.getStorageSync('userObj')
    this.goodsUrl = getApp().data.goodsUrl
    this.dbBranchNo = dbBranchNo
    this.requestData = { branchNo, token, platform, username}
    this.getPageData()
  },
  onReady () {
  },
  onShow () {
    if (this.isLoading) {
      this.getPageData()
    } else {
      this.isLoading = true
    }

  },
  onShareAppMessage() { },
  onHide () {
    clearTimeout(this.setListDataTimer)
    this.Time && clearInterval(this.Time);
  },
  onUnload() {
    clearTimeout(this.setListDataTimer)
  },
})