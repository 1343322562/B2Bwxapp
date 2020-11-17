import API from '../../api/index.js'
import {DateFormat,FetchDateLastDay,FetchDateLastMonth} from '../../tool/date-format'
import { showLoading, hideLoading, alert, getTime } from '../../tool/index.js'
Page({
  data: {
    list: [[],[],[]],
    pageLoading: false,
    showList: [],
    tabTitle: ['未使用','已使用','已过期'],
    tabIndex: 0   // 0:未使用， 1:已使用， 2:已过期
  },
  changeTab: function (e) {
    const tabIndex = e.currentTarget.dataset.index;
    if (tabIndex != this.data.tabIndex) {
      this.setData({ tabIndex });
      this.getPageData(tabIndex);
    }
  },
  showCupInfo: function (e) {
    let i = e.currentTarget.dataset.index,
      showList = this.data.showList;
    showList[i] = !showList[i];
    this.setData({ showList: showList })
  },

  /**将index 转换成后台需要的status类型*/
  exchangeStatusWithTabIndex: function(tabIndex){
    if(tabIndex == 0)return 2;  // 未使用
    if(tabIndex == 1)return 3;  // 已使用
    if(tabIndex == 2)return 1;  // 已过期
  },
  getPageData (tabIndex) {
    showLoading()
    const date = new Date();
    const ableStartDateStr = DateFormat(FetchDateLastMonth(date,-12),'yyyy-MM-dd');
    const ohterStartDateStr = DateFormat(FetchDateLastDay(date,-10),'yyyy-MM-dd'); 
    // 可用的查最近一年，其他的只查最近10天的 (唐山一合：都查一年)
    const partnerCode = getApp().data.partnerCode
    const startDate = (tabIndex == 0 || partnerCode == 1036 || partnerCode == 1013) ? ableStartDateStr:ohterStartDateStr;
    const endDate = DateFormat(date,'yyyy-MM-dd');
    const status = this.exchangeStatusWithTabIndex(tabIndex);

    const { branchNo, token, platform, username, dbBranchNo: dbranchNo} = wx.getStorageSync('userObj')
    API.Public.searchSupplyCoupons2({
      data: { data: '', branchNo, token, platform, username, dbranchNo, startDate,endDate,status},
      success: res => {
        console.log(res)
        console.log('startDate', startDate)
        console.log('endDate', endDate)
        console.log('status', status)
        if (res.code == 0) {
          let list = [[],[],[]]
          const data = res.data || []
          data.forEach(item => {
            item.startDateStr = item.startDate.split(' ')[0].replace(new RegExp(/(-)/g), '.');
            item.endDateStr = item.endDate.split(' ')[0].replace(new RegExp(/(-)/g), '.');
            list[tabIndex].push(item)
          })
          this.setData({ list })
        } else  {
          alert(res.msg)
        }
      },
      complete: ()=> {
        hideLoading()
        this.setData({ pageLoading: true })
      }
    })
  },
  onLoad (opt) {
    this.getPageData(this.data.tabIndex)
  }
})