// components/select-storeTime/select-storeTime.js
import { tim, timCurrentDay } from '../../tool/date-format.js'
import { toast } from '../../tool/index.js'

const date = new Date()
const years = []
const months = []
const days = []
const hours = []

// 从 2020 年开始
for (let i = 2019; i <= date.getFullYear(); i++) {
  years.push(i)
}

for (let i = 1; i <= 12; i++) {
  if (i < 10) {
    i = '0' + i
  } 
  months.push(i)
}

for (let i = 1; i <= 31; i++) {
  if (i < 10) {
    i = '0' + i
  } 
  days.push(i)
}

for (let i = 1; i <= 24; i++) {
  if (i < 10) {
    i = '0' + i
  } 
  hours.push(i)
}
Component({
  /**
   * 组件的属性列表
   */
  properties: {
    type: String,
    show: Boolean,
    time: String
  },

  /**
   * 组件的初始数据
   */
  data: {
    years,
    months,
    days,
    hours,
    value: [0, 0, 0, 0, 0, 0]
  },


  /**
   * 组件的方法列表
   */
  lifetimes: {
    attached: function() {
      const ymd = timCurrentDay(0), // 年 月 日
            M = Number(ymd.slice(5, 7)),
            D = Number(ymd.slice(8, 10)),
            H = Number(tim().slice(0, 2))
      console.log(H, ymd)
      if (this.data.type == 'order') {
        return this.setData({
          value: [
            years.length - 1,
            M-1, 
            0, 
            years.length - 1, 
            M-1, 
            D-1
          ]
        })
      } 
      this.setData({value: [years.length - 1, M-1, D-1, H-1]})
    },
    detached: function() {
      // 在组件实例被从页面节点树移除时执行
    }
  },

  methods: {
    confirm() {
      const { years, months, days, value } = this.data // 选择的时间
      console.log(value)
      const startDate = `${years[value[0]]}-${months[value[1]]}-${days[value[2]]}`
      const endDate = `${years[value[3]]}-${months[value[4]]}-${days[value[5]]}`
      let start = startDate.replace(/-/g, ''); start = Number(start)
      let end = endDate.replace(/-/g, ''); end = Number(end)
      console.log(start, end)
      if (start > end) return toast ('请选择正确的时间') 
      console.log(startDate, endDate)
      this.triggerEvent('myEvent', { startDate, endDate })
    },
    // 绑定级联框
    bindChange(e) {
      let value = e.detail.value
      this.setData({ value })
    },
    // 关闭时间选择框
    close () {
      console.log(this, this.data.show)
      this.setData({
        show: !this.data.show
      })
    },
    come() {
      let currentDate = timCurrentDay(0)
      
      const { years, months, days, hours, value } = this.data, // 选择的时间
            year = years[value[0]],
            month = Number(months[value[1]]),
            day = Number(days[value[2]]),
            hour = Number(hours[value[3]])
console.log(years, value[0], years)
      const storeTime = `${year}-${months[value[1]]}-${days[value[2]]} ${hours[value[3]]}`, // 当前时间
            currentYear = currentDate.slice(0, 4),
            currentMouth = Number(currentDate.slice(5, 7)),
            currentDay = Number(currentDate.slice(8, 10)),
            currentHour = Number(tim().slice(0, 2))
            console.log(month , currentMouth)
      // this.timeHandle(year, month, day, hour, currentYear, currentMouth, currentDay, currentHour)
      let isReturn
      if (currentYear == year) {
        if (month > currentMouth) {

        } else if (month == currentMouth) {
          if (day > currentDay) {

          } else if (day == currentDay) {
            if (hour >= currentHour) {

            } else {
              isReturn = true
            }
          } else {
            isReturn = true
          }
        } else {
          isReturn = true
        }
      }
      console.log(storeTime)
      if(isReturn) return toast('请选择有效日期')
      console.log(currentYear, currentMouth, currentDay, currentHour)
      let page = getCurrentPages().reverse()[0]
      page.setData({ storeTime })
      this.setData({
        show: !this.data.show
      })
    }
  }
})