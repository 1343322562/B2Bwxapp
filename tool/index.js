export const showLoading = (text = '') => {
  wx.showLoading({
    title: String(text),
    mask: true
  })
}
export const hideLoading = () => {
  wx.hideLoading()
}
export const toast = (text = '') => {
  wx.showToast({
    title: String(text),
    icon: 'none'
  })
}
export const alert = (c, o) => {
  let obj = {
    content: String(c),
    showCancel: false
  }
  if (o) for (let i in o) obj[i] = o[i]
  wx.showModal(obj)
}
export const deepCopy = (p, c) => { // 对象拷贝
  c = (c || {})
  for (var i in p) {
    if (p[i] && typeof p[i] === 'object') {
      c[i] = (p[i].constructor === Array) ? [] : {}
      deepCopy(p[i], c[i])
    } else {
      c[i] = p[i]
    }
  }
  return c
}
export const getTime = (str) => { // 获取时间戳
  if (!str) return 0
  let t1 = str.split(' ')
  let t2 = t1[0].split('-')
  let t3 = t1[1].split(':')
  return new Date(t2[0], t2[1] - 1, t2[2], t3[0], t3[1], t3[2]).getTime()
}
export const goPage = (l, o, s, f, c) => { // 跳转页面
  let obj = {},
    isArr = (typeof l == 'object' && l.length > 1),
    str = isArr ? l[1] : l,
    url = ('/pages/' + (isArr ? (l[0] + '/') : '') + str + '/' + str);
  if (o) {
    let i, key = new Array();
    for (i in o) {
      let item = o[i];
      key.push(i + '=' + (typeof item == 'object' ? JSON.stringify(item) : item));
    }
    url += ('?' + key.join("&"));
  }
  obj.url = url;
  s && (obj.success = s);
  f && (obj.fail = f);
  c && (obj.complete = c);
  wx.navigateTo(obj)
}
export const emojiReg = (str) => { // 格式化字符
  const emojiReg = new RegExp(/[\uD83C|\uD83D|\uD83E][\uDC00-\uDFFF][\u200D|\uFE0F]|[\uD83C|\uD83D|\uD83E][\uDC00-\uDFFF]|[0-9|*|#]\uFE0F\u20E3|[0-9|#]\u20E3|[\u203C-\u3299]\uFE0F\u200D|[\u203C-\u3299]\uFE0F|[\u2122-\u2B55]|\u303D|\u3030|\uA9|\uAE|\u3030/gi)
  return (str.replace(emojiReg, '').replace(/(\s*$)/g, '').replace(/[&nbsp;]+/g, '').trim())
}
export const setFilterDataSize = (obj) => { // 格式替换
  return (JSON.stringify(obj)).replace(new RegExp(/(&)/g), 'mark-1').replace(new RegExp(/(\?)/g), 'mark-2').replace(new RegExp(/(%)/g), 'mark-3').replace(new RegExp(/(=)/g), 'mark-4')
}
export const getFilterDataSize = (obj) => { // 替换格式
  return obj.replace(new RegExp(/(mark-1)/g), '&').replace(new RegExp(/(mark-2)/g), '?').replace(new RegExp(/(mark-3)/g), '%').replace(new RegExp(/(mark-4)/g), '=')
}
export const bd09togcj02 = (bdLon, bdLat) => { // 百度坐标系 (BD-09) 与 火星坐标系 (GCJ-02)的转换
  const xPI = 3.14159265358979324 * 3000.0 / 180.0
  var bdLon2 = +bdLon
  var bdLat2 = +bdLat
  var x = bdLon2 - 0.0065
  var y = bdLat2 - 0.006
  var z = Math.sqrt(x * x + y * y) - 0.00002 * Math.sin(y * xPI)
  var theta = Math.atan2(y, x) - 0.000003 * Math.cos(x * xPI)
  var ggLng = z * Math.cos(theta)
  var ggLat = z * Math.sin(theta)
  return [ggLng, ggLat]
}
export const gcj02tobd09 = (lng, lat) => { // 火星坐标系 (GCJ-02) 与百度坐标系 (BD-09) 的转换
  const xPI = 3.14159265358979324 * 3000.0 / 180.0
  var lat2 = +lat
  var lng2 = +lng
  var z = Math.sqrt(lng2 * lng2 + lat2 * lat2) + 0.00002 * Math.sin(lat2 * xPI)
  var theta = Math.atan2(lat2, lng2) + 0.000003 * Math.cos(lng2 * xPI)
  var bdLon = z * Math.cos(theta) + 0.0065
  var bdLat = z * Math.sin(theta) + 0.006
  return [bdLon, bdLat]
}
export const setDistanceSize = (num) => { // 米转千米
  const distance = Number(num)
  const p = distance >= 1000
  const str = (p ? Number((distance / 1000).toFixed(2)) : distance) + (p ? 'km' : 'm')
  return str
}
export const setUrlObj = (str) => { // url body 转obj
  const arr = str.split('&')
  let obj = {}
  arr.map(item => {
    let data = item.split('=')
    obj[data[0]] = data[1]
  })
  return obj
}
export const getRemainTime = (endTime, deviceTime, serverTime) => { // 获取倒计时
  let t = endTime - Date.parse(new Date()) - serverTime + deviceTime
  let seconds = Math.floor((t / 1000) % 60)
  let minutes = Math.floor((t / 1000 / 60) % 60)
  let hours = Math.floor((t / (1000 * 60 * 60)) % 24)
  let days = Math.floor(t / (1000 * 60 * 60 * 24))
  if ((hours + minutes + seconds) <= 0) {
    return false
  }
  hours += (days * 24)
  return [(hours < 10 ? '0' : '') + hours, (minutes < 10 ? '0' : '') + minutes, (seconds < 10 ? '0' : '') + seconds]
}
export const setUrl = (obj) => { // obj转url body
  let str = []
  for (let i in obj) {
    str.push(i + '=' + obj[i])
  }
  return str.join('&')
}
export const getGoodsImgSize = (url,type = 0) => { // 获取多规格的图片名称
  if (!url)  return ''
  const name = url.indexOf(',') != -1 ? url.split(',')[0] : url
  return name.substring(0,name.indexOf('-')+1) + type + name.substr(name.indexOf('.'))
}
export const setTabBarNum = (num) => { // 设置底部购物车数量
  const cartsIndex = 3
  if (num) {
    wx.setTabBarBadge({
      index: cartsIndex,
      text: String(num)
    })
  }else {
    wx.removeTabBarBadge({ index: cartsIndex})
  }
}
export const getGoodsDataSize = (goods) => { // 获取商品必要字段
  return {
    goodsImgUrl: goods.goodsImgUrl,
    isBind: goods.isBind,
    itemClsno: goods.itemClsno,
    itemName: goods.itemName,
    itemNo: goods.itemNo,
    promotionSheetNo: goods.promotionSheetNo,
    itemSize: goods.itemSize,
    itemSubno: goods.itemSubno,
    maxSupplyQty: goods.maxSupplyQty,
    minSupplyQty: goods.minSupplyQty,
    specType: goods.specType,
    orgiPrice: goods.salePrice,
    itemBrandno: goods.itemBrandno,
    price: goods.price,
    stockQty: goods.stockQty,
    supplySpec: goods.supplySpec,
    stockType: goods.stockType,
    deliveryType: goods.deliveryType,
    isBind: goods.isBind
  }
}
export const getGoodsTag = (goods, promotionObj,type) => { // 获取促销标签
  let obj = {}
  const itemNo = goods.itemNo
  const brandNo = goods.itemBrandno
  const itemClsno = goods.itemClsno
  const BG = promotionObj.BG.cls[itemClsno] ? 'cls' : (promotionObj.BG.brand[brandNo] ? 'brand' : (promotionObj.BG.goods[itemNo] ? 'goods' : false))
  const MJ = promotionObj.MJ.fullReduction ? 'fullReduction' : (promotionObj.MJ.cls[itemClsno] ? 'cls' : (promotionObj.MJ.brand[brandNo] ? 'brand' : (promotionObj.MJ.goods[itemNo] ? 'goods' : false)))
  const ZK = promotionObj.ZK.allDiscount || (promotionObj.ZK.cls[itemClsno] || (promotionObj.ZK.brand[brandNo] || promotionObj.ZK.goods[itemNo] || false))
  const BF = promotionObj.BF.all.length || (promotionObj.BF.cls[itemClsno] || (promotionObj.BF.brand[brandNo] || promotionObj.BF.goods[itemNo] || false))
  if (MJ) obj.MJ = MJ
  if (BG) obj.BG = BG
  if (BF) obj.BF = true
  promotionObj.SZ['stockType'].map((item, index) => {
    if (  // 判断库存类型
      item == 0
      || (item == 2 && goods['stockType'] != 0 )
      || (item == '1' && goods['stockType'] == '0')
    ) {
      const SZInfo = 'giftInfo' in promotionObj['SZ'] ? promotionObj['SZ'].giftInfo : false
      const SZStockType = 'stockType' in promotionObj['SZ'] ? promotionObj['SZ'].stockType : false
      const SZFilterArr = 'filterArr' in promotionObj['SZ'] ? promotionObj['SZ'].filterArr : false
      const SZName= 'giftName' in promotionObj['SZ'] ? promotionObj['SZ'].giftName : false
      SZFilterArr.forEach((t, ind) => {
        if (goods.itemNo == t || goods.itemClsno == t) {
          if (SZInfo) {obj.SZInfo=[]; obj.SZInfo.push(SZInfo[ind])}                  // SZ配送信息
          if (SZName) { obj.SZName=[];  obj.SZName.push(SZName[ind])}                // SZ赠品名称
          if (SZStockType) { obj.SZStockType=[]; obj.SZStockType.push(SZStockType[ind])}   // SZ配送种类
          if (SZFilterArr) { obj.SZFilterArr=[]; obj.SZFilterArr.push(SZFilterArr[ind])}   // SZ过滤条件
        }
      })
      
    }
  })
  if (promotionObj.FS[itemNo]) {
    obj.FS = true
    obj.promotionSheetNo = promotionObj.FS[itemNo].sheetNo
    obj.sdMaxQty = promotionObj.FS[itemNo].limitedQty
    const price = promotionObj.FS[itemNo].price
    obj.sdPrice = price
    type || (obj.price = price)
  } else if (promotionObj.MQ[itemNo]) {
    console.log(promotionObj.MQ)
    obj['MQ'] = {}
    obj['MQ'].buyQty = promotionObj.MQ[itemNo].buyQty
    obj['MQ'].subMoney = promotionObj.MQ[itemNo].subMoney
    obj['MQ'].explain = promotionObj.MQ[itemNo].explain
  } else if (promotionObj.SD[itemNo]) {
    obj.SD = true
    obj.promotionSheetNo = promotionObj.SD[itemNo].sheetNo
    const limitedQty = promotionObj.SD[itemNo].limitedQty
    const orderedQty = promotionObj.SD[itemNo].orderedQty
    const price = promotionObj.SD[itemNo].price
    obj.drPrice = price
    obj.limitedQty = limitedQty
    obj.drMaxQty = (limitedQty - orderedQty)
    type || (obj.price = price)
  } else if (ZK) {
    obj.ZK = true
    const price = Number((ZK.discount * (goods.carstBasePrice || goods.price)).toFixed(2))
    type || (obj.price = price)
    obj.zkPrice = price
    obj.zkMaxQty = 99999
    obj.discount = Number((ZK.discount * 10).toFixed(2)) + '折'
    obj.discountNum = ZK.discount
    obj.zkType = ZK.zkType == 'allDiscount' ? '全场' : (ZK.zkType == 'cls' ? '类别' : (ZK.zkType == 'brand'?'品牌':'商品'))
    obj.promotionSheetNo = ZK.sheetNo
  }
  if (promotionObj.MS[itemNo]) {
    obj.MS = true
    const price = promotionObj.MS[itemNo].price
    obj.msPrice = price
    obj.promotionSheetNo = promotionObj.MS[itemNo].sheetNo
    const buyQty = promotionObj.MS[itemNo].buyQty
    const limitedQty = promotionObj.MS[itemNo].limitedQty
    obj.msMaxQty = limitedQty > buyQty ? buyQty : limitedQty
    type || (obj.price = price)
  }
  return obj
}
export const setParentGoodsCartsObj = (cartsObj) => { // 计算多规格主商品数量
  cartsObj.keyArr.forEach(itemNo => {
    const goods = cartsObj[itemNo]
    const parentNo = goods.parentItemNo
    if (parentNo) {
      cartsObj[parentNo] || (cartsObj[parentNo] = { realQty:0})
      cartsObj[parentNo].realQty += goods.realQty
    }
  })
  return cartsObj
}
export const MsAndDrCount = (goods, cartsGoods,openType,auto) => { // 秒杀 单日限购 判断计算
  const warn = (openType == 'add' || openType == 'input')
  if (goods.MS || goods.SD|| goods.ZK || goods.FS) {
    goods.msMaxQty || (goods.msMaxQty=0)
    goods.drMaxQty || (goods.drMaxQty=0)
    goods.sdMaxQty || (goods.sdMaxQty = 0)
    const cartsGoodsNum = cartsGoods ? cartsGoods.realQty : 0
    const stop = (goods[cartsGoodsNum ? 'supplySpec' : 'minSupplyQty'] || 1)
    const isMs = (cartsGoodsNum > goods.msMaxQty) && (cartsGoodsNum <= goods.msMaxQty + stop )
    const isDr = goods.drMaxQty > goods.msMaxQty
    const isSd = goods.sdMaxQty > goods.msMaxQty
    if (goods.MS && cartsGoodsNum <= goods.msMaxQty) {
      goods.price = goods.msPrice
    } else if (goods.SD && cartsGoodsNum <= goods.drMaxQty) {
      goods.price = goods.drPrice
      if (warn && goods.MS && isDr && isMs ) {
        alert('商品购买数量已超秒杀上限[' + goods.msMaxQty + '],商品将恢复促销价')
      }
    } else if (goods.ZK && cartsGoodsNum <= goods.zkMaxQty) {
      goods.price = goods.zkPrice
      if (warn && goods.MS  && isMs) {
        alert('商品购买数量已超秒杀上限[' + goods.msMaxQty + '],商品将恢复促销价')
      }
    } else if (goods.FS && cartsGoodsNum <= goods.sdMaxQty) {
      goods.price = goods.sdPrice
      if (warn && goods.MS && isSd && isMs) {
        alert('商品购买数量已超秒杀上限[' + goods.msMaxQty + '],商品将恢复促销价')
      }
    } else {
      goods.price = goods.orgiPrice
      if (warn&&(
        (goods.MS && isMs)
        || (goods.SD && (cartsGoodsNum > goods.drMaxQty) && (cartsGoodsNum <= goods.drMaxQty + stop))
        || (goods.FS && (cartsGoodsNum > goods.sdMaxQty) && (cartsGoodsNum <= goods.sdMaxQty + stop))
        )) {
        alert('商品购买数量已超' + ((isDr || isSd) ? '促销' : '秒杀') + '上限[' + goods[isDr ? 'drMaxQty' : (isSd ? 'sdMaxQty' :'msMaxQty')] + '],商品将恢复原价')
      }
    }
    return goods
  }
  return false
}
export const rpxToPx = (rex) => {
  const { ww } = getApp().data
  return (rex / 750) * ww
}
export const pxToRpx = (rex) => {
  const { ww } = getApp().data
  return rex * 750 / ww
}