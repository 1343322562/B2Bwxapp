import API from '../../../api/index.js'
import { showLoading, hideLoading, goPage, getTime, getRemainTime } from '../../../tool/index.js'
Page({
  data: {
    pageLoading: false,
    pageObj:{},
    tgGoodsUrl: '',
    timeList: []
  },
  getPageData () {
    showLoading('请稍后...')
    API.Group.searchSupplyTeam({
      data: this.requestData,
      success: res => {
        let data = res.data
        if (res.code == 0 && data) {
          data.teamRule = data.teamRule.split('\r\n')
          let timeList = []
          data.detailOutVos.forEach(goods => {
            timeList.push({ end: getTime(goods.endDate), start: getTime(goods.startDate)})
          })
          this.timeList = timeList
          this.getServerTime()
          
          this.setData({ pageObj: data})
        }
      },
      complete: ()=> {
        hideLoading()
        this.setData({ pageLoading:true})
      }
    })
  },
  onShareAppMessage() {
    console.log('share')
    const { branchName, dbBranchName } = wx.getStorageSync('userObj')
    return {
      title: branchName || dbBranchName,
      path: '/pages/groupBuying/GB_index/GB_index'
    }
  },
  getServerTime() {
    API.Public.getSystemTime({
      data: this.requestData,
      success: res => {
        if (res.code == 0 && res.data) {
          this.startcountDown(res.data)
        } else {
          this.startcountDown(+new Date())
        }
      },
      error: () => {
        this.startcountDown(+new Date())
      }
    })
  },
  startcountDown(serverTime) {
    const nowTime = (+new Date())
    this.setCount(serverTime, nowTime)
    this.time = setInterval(() => {
      this.setCount(serverTime, nowTime)
    }, 1000)
  },
  setCount(serverTime,nowTime) {
    let timeList = []
    const t = 86400000
    this.timeList.forEach((time,index) => {
      const type = nowTime < time.start ? '0' : (nowTime < time.end) ? '1' : '2'
      const countDown = getRemainTime(type == '0' ? time.start : time.end, nowTime, serverTime)
      if (countDown) {
        const t2 = Number(countDown[0])
        const r = parseInt(t2 / 24)
        const s = t2 % 24
        timeList[index] = { type: type, r: (r < 10 ? '0' + r : r), s: (s < 10 ? '0' + s : s), f: countDown[1], m: countDown[2]}
      } else if (type!='2') {
        this.clearTime()
        this.getPageData()
        return
      }
      this.setData({ timeList})
    })
  },
  clearTime () {
    this.time && clearInterval(this.time)
  },
  goDetails (e) {
    const {index, id} = e.currentTarget.dataset
    if (this.data.timeList[index].type !='1') return
    goPage(['groupBuying','GB_details'],{id})
  },
  onLoad (opt) {
    const tgGoodsUrl = getApp().data.tgGoodsUrl
    const { branchNo, token, platform, username } = wx.getStorageSync('userObj')
    this.requestData = { branchNo, token, platform, username }
    this.setData({ tgGoodsUrl})
    
  },
  goOrderList () {
    goPage(['groupBuying','GB_ordersList'])
  },
  onShow () {
    this.getPageData()
  },
  onHide () {
    this.clearTime()
  }
})