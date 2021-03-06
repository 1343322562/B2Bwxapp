import * as types from '../../store/types.js'
import API from '../../api/index.js'
import dispatch from '../../store/actions.js'
import { toast, alert, getGoodsImgSize, getGoodsTag, deepCopy, setParentGoodsCartsObj, goPage, MsAndDrCount} from '../../tool/index.js'
Page({
  data: {
    imgList: [],
    imgDetailsList: "",
    goodsType:'', // 0 统配  1 直配
    goods: {},
    promotionList:[],
    BFpromotionList: [],
    sellNum: 0,
    cartsObj: {},
    referencePriceFlag: '', // 1 显示  0 不显示
    collectObj: {}, // 收藏商品列表
    branchSaleFlag:'', // 是否显示总销量
    giftInfoBottom: '-700rpx',
    showGiftInfo: false,
    giftInfoIndex: 0,
    partnerCode: getApp().data.partnerCode
  },
  hideGiftInfo () {
    this.setData({ giftInfoBottom: '-700rpx'})
    setTimeout(() => {
      this.setData({ showGiftInfo: false})
    }, 220)
  },
  showGiftInfo (e) {
    this.setData({showGiftInfo: true, giftInfoIndex: Number(e.currentTarget.dataset.index) })
    setTimeout(() => {
      this.setData({ giftInfoBottom: '99rpx'})
    }, 80)
  },
  inputConfirm (e) {
    const value = Number(e.detail.value.trim()) || 0
    const { goods, goodsType} = this.data
    const type = 'input'
    const config = {
      sourceType: String(goodsType), 
      sourceNo: this.supcustNo || this.dbBranchNo,
      branchNo: this.requestObj.branchNo
    }
    const cartsObj = dispatch[types.CHANGE_CARTS]({ goods, type, config, value})
    if (cartsObj) {
      let obj = { cartsObj }
      const newGoods = MsAndDrCount(goods, cartsObj[goods.itemNo], type)
      if (newGoods) obj.goods = newGoods
      this.setData(obj) 
    } else {
      this.inputBlur()
    }
  },
  inputBlur () {
    const cartsObj = this.data.cartsObj
    this.setData({ cartsObj})
  },
  getCartsData() {
    dispatch[types.GET_CHANGE_CARTS]({
      format: true,
      nowUpdate: true,
      success: (res) => {
        const cartsObj = setParentGoodsCartsObj(res)
        this.setData({ cartsObj })
        this.cartsGoodsLoading = true
        this.countPrice()
      }
    })
  },
  getGoodsData (goodsType) {
    const itemNo = this.requestObj.itemNo
    if (itemNo.indexOf('Z')==-1) {
      let request = {
        branchNo: this.requestObj.branchNo,
        token: this.requestObj.token,
        username: this.requestObj.username,
        platform: this.requestObj.platform,
        condition: '',
        modifyDate: '',
        pageIndex: 1,
        pageSize: 20,
        itemClsNo: '',
        searchItemNos: itemNo
      }
      goodsType && (request.supcustNo = this.supcustNo )
      API.Goods[goodsType ? 'supplierItemSearch' :'itemSearch']({
        data: request,
        success: res => {
          console.log(res)
          if (res.code == 0 && res.data) {
            let goods = res.data.itemData[0]
            let imgList = []
            goodsType && (goods.stockQty = 9999)
            if (goods.picUrl) {
              const arr = goods.picUrl.split(',')
              arr.forEach(url => {
                imgList.push((goodsType ? this.zcGoodsUrl : this.goodsUrl) + goods.itemNo + '/' + getGoodsImgSize(url, 2))
              })
            }
            goods.isStock = (goods.stockQty > 0 || goods.deliveryType == '3' || goods.specType == '2') ? true : false
            if (this.productionDateFlag == '1' && (goods.productionDate || goods.newProductionDate)) {
              let dateArr = []
              goods.productionDate && dateArr.push(goods.productionDate.replace(new RegExp(/(-)/g), '.'))
              goods.newProductionDate && dateArr.push(goods.newProductionDate.replace(new RegExp(/(-)/g), '.'))
              goods.productionTime = dateArr.join('-')
            }
            wx.setNavigationBarTitle({title: goods.itemName})
            goods.minSellAmt = Number(((goods.orgiPrice || goods.price) * (goods.minSupplyQty || 1)).toFixed(2))
            // 处理直配 限时销售的数据
            if ('promotionNos' in goods && goods['promotionNos'].includes('RSD')){
              this.getSupplierRSD(goods, this.data.cartsObj)
            }
            if ('promotionNos' in goods 
            && (goods['promotionNos'].includes('RSD') || goods['promotionNos'].includes('RMJ') || goods['promotionNos'].includes('RBF'))) {
              this.getSupplierPromotion(goods)
            }
            this.setData({ goods, imgList })
            goodsType || this.getAllPromotion()
          } else {
            alert(res.msg,{
              success: () => {
                this.goPage('index')
              }
            })
          }
        },
        error: ()=>{
          alert('获取商品详情失败，请确认网络是否正常', {
            success: () => {
              this.goPage('index')
            }
          })
        }
      })

    } else { // 捆绑商品
      this.getAllPromotion(itemNo)
    }
  },
  // 获取直配 限时促销信息 ,处理限购数量
  getSupplierRSD(goods, cartsObj, type){
    if (goods['itemNo'] in cartsObj && type == 'add') {   // 添加真实数量
      goods['realQty'] = cartsObj[goods['itemNo']].realQty
      return
    } 
    let supplierPromotionInfo = wx.getStorageSync('supplierPromotion')
    supplierPromotionInfo[goods['itemNo']].startDate = supplierPromotionInfo[goods['itemNo']].startDate.slice(0, 10)
    supplierPromotionInfo[goods['itemNo']].endDate = supplierPromotionInfo[goods['itemNo']].endDate.slice(0, 10)
    goods['todayPromotion'] = supplierPromotionInfo[goods['itemNo']]
  },
  // 处理 直配促销页面渲染信息
  getSupplierPromotion(goods){
    console.log(goods)
    let { branchNo, token, platform, username } = wx.getStorageSync('userObj')
    API.Public.getSupplierAllPromotion({
      data: { branchNo, token, platform, username, supplierNo: this.supcustNo },
      success: res => {
        console.log(res)
        let data = res.data
        if (res.code == 0 && res.data) {
          let promoList = this.data.promotionList
          for (let key in data){
            // 满减
            if (key.includes('RMJ') && goods['promotionNos'].includes('RMJ')) {
              let dataRMJ = data[key]
              dataRMJ.map(item => {
                let startIndex = goods['promotionNos'].indexOf('RMJ')
                let numRMJ = goods['promotionNos'].slice(startIndex, startIndex + 19)
                if (numRMJ == item.sheetNo) {
                  if (promoList.length == 0){
                    promoList.push({ name: '类别满减', msg: [item.memo] })
                  } else {
                    promoList[promoList.length - 1].msg.push(item.memo)
                  }
                }
              })
            }
            // 满赠
            if (key.includes('RBF') && goods['promotionNos'].includes('RBF')) {
              let dataRBF = data[key]
              dataRBF.map((item, index) => {
                let startIndex = goods['promotionNos'].indexOf('RBF')
                let numRBF = goods['promotionNos'].slice(startIndex, startIndex + 19)
                if (numRBF == item.sheetNo) {
                  if (promoList.length == 0) {
                    promoList.push({ name: '类别满赠', msg: [item.memo] })
                  } else if (promoList.length == 1 && promoList[promoList.length - 1].name != '类别满赠'){ 
                    promoList.push({ name: '类别满赠', msg: [item.memo] })
                  }else{
                    promoList[promoList.length - 1].msg.push(item.memo)
                  }
                }
              })
            }
          }
          if ('todayPromotion' in goods) {
            let startDate = goods.todayPromotion.startDate.slice(0, 10) 
            let endDate = goods.todayPromotion.endDate.slice(0, 10)
            promoList.push({ name: '限时促销', msg: ['活动时间: ' + startDate + ' 至 ' + endDate] })
          }
          console.log(promoList)
          this.setData({
            promotionList: promoList
          })
        }
      }
    })
    
  },

  changeCarts(e) {
    const type = e.currentTarget.dataset.type
    const { goodsType,goods} = this.data
    if ('todayPromotion' in goods) this.getSupplierRSD(goods, this.data.cartsObj, type) // 若存在直配限时促销,则更新真实商品数量
    
    if (goods.specType != '2') {
      const config = {
        sourceType: String(goodsType),
        sourceNo: this.supcustNo || this.dbBranchNo,
        branchNo: this.requestObj.branchNo
      }
      const cartsObj = dispatch[types.CHANGE_CARTS]({ goods, type, config })
      if (cartsObj) {
        let obj = { cartsObj }
        const newGoods = MsAndDrCount(goods, cartsObj[goods.itemNo], type)
        if (newGoods) obj.goods = newGoods
        this.setData(obj)
      }
    } else {
      goPage('goodsChildren', { itemNo: goods.itemNo })
    }
  },
  goPage (e) {
    const page = (typeof e === 'object' ? e.currentTarget.dataset.page : e)
    wx.switchTab({
      url: '/pages/' + page+'/' + page
    })
  },
  getGoodsSellNum () {
    let request = deepCopy(this.requestObj)
    request.branchNo = this.dbBranchNo
    API.Goods.getBranchSlae({
      data: request,
      success: res=> {
        if (res.code ==0) {
          this.setData({ sellNum: parseInt(res.data||0)})
        }
      }
    })
  },
  // 获取图文详情
  getGoodsImgDetail () {
    const imgUrl = getApp().data.imgUrl
    let request = deepCopy(this.requestObj)
    this.supcustNo && (request.supplierNo = this.supcustNo)
    API.Goods.searchItemDetail({
      data: request,
      success: res => {
        const data = res.data
        let baseImgUrl = getApp().data.imgUrl
        console.log(baseImgUrl, typeof baseImgUrl, getApp())
        // 富文本数据处理
        if (res.code == 0 && data) {
          let imgDetailsList = data.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/src='/g, `src='${baseImgUrl}`).replace(/\<img/gi, '<img style="width:100%;height:auto" ')
          this.setData({ imgDetailsList })
        }
      }
    })
  },
  getAllPromotion(zhItemNo) {
    console.log('zhItemNo', zhItemNo)
    let nowGoods = this.data.goods
    let promotionList = []
    dispatch[types.GET_ALL_PROMOTION]({
      success: (res) => {
        console.log('res', res)
        console.log('zhItemNo', zhItemNo)
        console.log(nowGoods)
        const tag = zhItemNo?{}:getGoodsTag(nowGoods, res)
        if (zhItemNo) {
          let goods = res.BD.goods[zhItemNo]
          const path = goods.goodsImgUrl.substring(0, goods.goodsImgUrl.lastIndexOf('/') + 1)
          let imgList = [(path + getGoodsImgSize(goods.goodsImgUrl.substring(goods.goodsImgUrl.lastIndexOf('/') + 1), 2))]
          goods.itemDetails.forEach(item => {
            item.goodsImgUrl = this.goodsUrl + item.itemNo + '/' + getGoodsImgSize(item.picUrl)
          })
          wx.setNavigationBarTitle({ title: goods.itemName })
          goods.isStock = (goods.stockQty > 0 || goods.deliveryType == '3') ? true : false
          if (goods.bdPsPrice) goods.discountMoney = Number((goods.bdPsPrice - goods.price).toFixed(2))
          this.setData({ goods, imgList })
        } else if (Object.keys(tag).length) {
          const itemNo = nowGoods.itemNo
          const brandNo = nowGoods.itemBrandno || nowGoods.itemBrandNo
          const itemClsno = nowGoods.itemClsno
          let promotionList = []
          let BFpromotionList = []
          if (tag.FS || tag.SD || tag.ZK) {
            nowGoods.orgiPrice = nowGoods.price
            nowGoods.price = tag.price
            promotionList.push({
              name: tag.FS ? '首单特价' : (tag.SD ? '单日限购' : (tag.zkType + '折扣')),
              msg: [(tag.FS ? ('活动期间,首次下单且购买数量不超过 '+ tag.sdMaxQty + nowGoods.unit +' 享受优惠价格￥'+tag.sdPrice) : (tag.SD ? ('购买数量不超过 ' + tag.drMaxQty + nowGoods.unit + ' 参与促销活动，特价￥' + tag.drPrice) : ('当前' + tag.zkType + '下单立即享受' + tag.discount + '优惠')))]
            })
          }
          if ('SZInfo' in tag && tag.SZInfo.length) {
            console.log(tag)
            console.log(tag.SZInfo)
            if ('SZFilterArr' in tag && tag['SZFilterArr'].length > 0) {
              tag['SZFilterArr'].forEach(t => {
                if (t == nowGoods.itemNo || t == nowGoods.itemClsno) {
                  
                }
              })
            }
             
             
            
            let realArr = tag.SZInfo.sort((a, b) => a - b)
            let msg
            if (tag['SZInfo'].length > 1) {
              msg = tag['SZInfo'].map((item, index) => {
                return `${index + 1}. 满￥${realArr[index]} 赠1样赠品：`,` ${tag['SZName'][index]}` 
              })
            } else {
              msg = [`满￥${realArr[0]}，赠1样赠品：`, `${tag['SZName'][0]}`] 
            }
            
            promotionList.push({
              name: '首单满赠',
              msg: msg
            })
          }
          if (tag.MS) {
            promotionList.push({
              name: '秒杀促销',
              msg: [('购买数量不超过 ' + tag.msMaxQty+ nowGoods.unit + ' 参与秒杀活动，特价￥' + tag.msPrice)]
            })
          }
          if(tag.BG) {
            console.log(tag, nowGoods, res)
            let msg = { name: ((tag.BG == 'cls' ? '类别' : (tag.BG == 'brand' ? '品牌' : '')) + '买赠'),msg:[] }
            const arr = res.BG[tag.BG][tag.BG == 'cls' ? itemClsno : (tag.BG == 'brand' ? brandNo : itemNo)]
            for (let i in arr) {
              const giftInfo = res.BG.giftGoods[arr[i]][i]
              msg.msg.push(giftInfo.explain ||  '满 ' + giftInfo.buyQty + nowGoods.unit + '送' + giftInfo.giftQty + nowGoods.unit + ' [' + giftInfo.giftName +']')
            }
            promotionList.push(msg)
          }
          if('MQ' in tag) {
            
            const msg = `购买数量满${tag.MQ['buyQty'] + nowGoods.unit}减${tag.MQ['subMoney']}元`
            promotionList.push({
              name: '数量满减',
              msg: [msg]
            })
          }
          if (tag.MJ) {
            console.log(tag)
            let msg = { name: (tag.MJ == 'fullReduction' ? '全场' : (tag.MJ == 'cls' ? '类别' : (tag.MJ == 'brand' ? '品牌' : '商品'))) + '满减',msg:[] }
            const arr = tag.MJ == 'fullReduction' ? res.MJ[tag.MJ] : res.MJ[tag.MJ][tag.MJ == 'cls' ? itemClsno : (tag.MJ == 'brand' ? brandNo : itemNo)]
            arr.forEach(info => {
              msg.msg.push(info.explain || '满'+info.reachVal +'减'+info.subMoney)
            })
            msg.msg = [msg.msg.join('，')]
            promotionList.push(msg)
          }
          if (tag.BF) {
            
            const itemNo = nowGoods.itemNo
            const brandNo = nowGoods.itemBrandno
            const itemClsno = nowGoods.itemClsno
            const infoArr = [res.BF.all, res.BF.cls[itemClsno], res.BF.brand[brandNo], res.BF.goods[itemNo]]
            infoArr.forEach((item,i) => {
              if (item && item.length) {
                let name = (i==0?'全场':(i==1?'类别':(i==2?'品牌':'单品')))+'满赠'
                item.forEach(info => {
                  BFpromotionList.push({
                    name,
                    msg: [info.explain || ('满￥' + info.reachVal+',赠'+info.data.length+'样赠品')],
                    data: info.data
                  })
                })
              }
            })
          }
          nowGoods = Object.assign(nowGoods, tag)
          this.setData({ promotionList, goods: nowGoods, BFpromotionList})
          this.promotionListLoaidng = true
          this.countPrice()
        }
        if (nowGoods.rewardPoint > 0) {
          promotionList.push({
            name: '积分',
            msg: ['每买' + nowGoods.buyQty + nowGoods.unit + '获得' + nowGoods.rewardPoint + '积分']
          })
          this.setData({ promotionList })
        }
      }
    })
  },
  countPrice () {
    if (this.promotionListLoaidng && this.cartsGoodsLoading) {
      const { goods, cartsObj } = this.data
      const newGoods = MsAndDrCount(goods, cartsObj[goods.itemNo], '')
      newGoods&&this.setData({ goods: newGoods})
    }
  },
  changeCollectGoods () {
    const { goods, collectObj} = this.data
    let request = deepCopy(this.requestObj)
    const status = collectObj[goods.itemNo]?'0':'1'
    request.status = status
    API.Public.supplyCollect({
      data: request,
      success: res => {
        if (res.code == 0) {
          if (status == '0') {
            delete collectObj[goods.itemNo]
          } else {
            collectObj[goods.itemNo] = true
          }
          this.setData({ collectObj })
          wx.setStorage({key: 'collectObj',data: collectObj})
          wx.showToast({
            title: status == '1' ? '收藏成功' : '取消收藏',
            image: '../../images/collect_icon_' + (status == '1' ? 'true' : 'false') +'.png'
          })
        } else {
          alert(res.msg)
        }
      }
    })
  },
  onLoad (opt) {
    const goodsType = opt.supcustNo ? 1 : 0
    const itemNo = opt.itemNo
    const userObj = wx.getStorageSync('userObj')
    const collectObj = wx.getStorageSync('collectObj') || {}
    this.supcustNo = opt.supcustNo
    this.shareData = opt
    this.requestObj = {
      branchNo: userObj.branchNo,
      token: userObj.token,
      username: userObj.username,
      itemNo: itemNo,
      platform: userObj.platform
    }
    const { goodsUrl,zcGoodsUrl} = getApp().data
    const { referencePriceFlag, productionDateFlag, branchSaleFlag } = wx.getStorageSync('configObj')
    this.goodsUrl = goodsUrl
    this.zcGoodsUrl = zcGoodsUrl
    this.dbBranchNo = userObj.dbBranchNo
    this.productionDateFlag = productionDateFlag
    this.setData({ goodsType, referencePriceFlag, collectObj, branchSaleFlag})
    this.getGoodsImgDetail()
    this.getGoodsSellNum()
    this.getGoodsData(goodsType)
  },
  onReady () {
  },
  onShow (opt) {
    this.getCartsData()
  },
  onShareAppMessage() { },
  onHide () {
  },
  onReachBottom () {
    console.log(this.data)
  },
  // onShareAppMessage() {
  //   const { goods, imgList} = this.data
  //   return {
  //     title: goods.itemName,
  //     path: '/pages/login/login?openType=share&page=goodsDetails&data=' + JSON.stringify(this.shareData),
  //     imageUrl: imgList[0] || ''
  //   }
  // }
})