// pages/citySelect/citySelect.js

// 引入SDK核心类
var QQMapWX = require('../../libs/qqmap-wx-jssdk.js');
// 实例化API核心类
var qqmapsdk = new QQMapWX({
  key: 'QHIBZ-5RHLJ-ZH6FN-KOZJL-QT3JK-XYBBN' // 必填
});


Page({

  /**
   * 页面的初始数据
   */
  data: {
    mapKey: 'QHIBZ-5RHLJ-ZH6FN-KOZJL-QT3JK-XYBBN', //腾讯地图mapKey
    cityArry: [[], [], []],  //存储城市集
    cityIndex: [18, 5, 1],    //储存城市集索引值
    cityKeyName: [[], [], []],  //存当前选中的城市名[省市区]

    myLatLongitude: '', // 我的区域坐标
    searchTipsList: [],   //检索出来的关键字地址列表
    nowCurrentCity: "广州", //当前城市 ，点确认后
    nowLatLongitude: '', //现在区域坐标， 点击确认后
    huaCurrentCity: '', //滑动时监听的城市
    keyword: '',   //关键字 用于搜索
    isShowSearchTipsList: false, //是否显示关键字地址列表


    myLocalAddress:'', //我的具体位置
  },

  //我的位置
  getMyMapLocation(e) {
    let that = this;
    var mapKey = that.data.mapKey;
    wx.getLocation({
      type: 'gcj02',  //wgs84 返回 gps 坐标，gcj02 返回可用于 wx.openLocation 的坐标
      success(res) {
        var myLatlng = res.latitude + ',' + res.longitude;
        that.setData({
          myLatLongitude: myLatlng
        })
        var _url = '';
        _url = 'https://apis.map.qq.com/ws/geocoder/v1/?location=' + myLatlng + '&key=' + mapKey + '';
        var opt = {
          url: _url,
          method: 'GET',
          dataType: 'json',
          success(res) {
            console.log(res)
            that.setData({
              myLocalAddress: res.data.result.address
            })
          }
        }
        wx.request(opt);
      }
    })
  },

  //获取腾讯地图-省市区
  getTencentCity() {
    var that = this;
    //调用获取城市列表接口
    qqmapsdk.getCityList({
      success(res) {
        //console.log(res);
        var cityArry = [[], [], []], arr = [], brr = [], crr = [],
          mySheng = new Array, myShi = new Array, myQu = new Array,
          cityIndex = that.data.cityIndex,
          cityKeyName = that.data.cityKeyName,
          huaCurrentCity = that.data.huaCurrentCity;

        arr = res.result[0]; //所有省的result
        brr = res.result[1]; //所有市的result
        crr = res.result[2]; //所有区的result

        // console.log(arr,brr,crr)

        arr.forEach(function (a) {
          mySheng.push(a.fullname);
        })

        //省市区的索引值
        var aIndex = that.data.cityIndex[0],
          bIndex = that.data.cityIndex[1],
          cIndex = that.data.cityIndex[2];
        //console.log(aIndex,bIndex,cIndex)

        //当前省的id，通过指定前2位字符相同刷选对应的市
        var curShengId = arr[aIndex].id.slice(0, 2);
        //console.log(curShengId)

        var myShiIdBrr = [];
        brr.forEach(function (b) {
          var shiId = b.id.slice(0, 2);
          if (curShengId == shiId) {
            myShiIdBrr.push(b.id);
            myShi.push(b.fullname);
          }
        })
        //console.log(myShi);

        //当前市的id，通过指定前4位字符相同刷选对应的区
        var curShiId = myShiIdBrr[bIndex].slice(0, 4);
        crr.forEach(function (c) {
          var quId = c.id.slice(0, 4);
          if (curShiId == quId) {
            myQu.push(c.fullname)
          }
        })
        //console.log(myQu);
        cityArry[2] = myQu;

        //赋值到城市集，当前城市名
        cityArry[0] = mySheng;
        cityArry[1] = myShi;
        cityArry[2] = myQu;
        cityKeyName[0] = cityArry[0][aIndex];
        cityKeyName[1] = cityArry[1][bIndex];
        cityKeyName[2] = cityArry[2][cIndex];
        //当前城市判断： '有区'显示'区'，'无区'显示'市'，'无市'显示'省'
        if (cityKeyName[2] == null || cityKeyName[2] == "" || cityKeyName[2] == undefined) {
          huaCurrentCity = cityKeyName[1]
        } else if (cityKeyName[1] == null || cityKeyName[1] == "" || cityKeyName[1] == undefined) {
          huaCurrentCity = cityKeyName[0]
        } else {
          huaCurrentCity = cityKeyName[2]
        }

        that.setData({
          cityArry: cityArry,
          cityKeyName: cityKeyName,
          huaCurrentCity: huaCurrentCity
        })
      },
    });
  },

  //地址解析(地址转坐标)
  transformCoordinate() {
    var that = this,
      mapKey = that.data.mapKey,
      keyword = that.data.keyword,
      huaCurrentCity = that.data.huaCurrentCity;
    var _url = "";
    _url = "https://apis.map.qq.com/ws/geocoder/v1/?address=" + huaCurrentCity + "&key=" + mapKey + "";
    // console.log(_url)
    var opt = {
      url: _url,
      method: 'GET',
      dataType: 'json',
      success(res) {
        //console.log( res.data.result)
        if (res.data.status != 0) {
          return
        }
        var lat = res.data.result.location.lat,
          lng = res.data.result.location.lng,
          nowLatLongitude = lat + ',' + lng;
          console.log('ssasas');
        that.setData({
          nowLatLongitude: nowLatLongitude
        })

        that.getSerachList(keyword);
      }
    }
    wx.request(opt);

  },

  // 关键字的补完与提示接口
  getSerachList(keyword) {
    var that = this,
      mapKey = that.data.mapKey,
      huaCurrentCity = that.data.huaCurrentCity,
      nowLatLongitude = that.data.nowLatLongitude;
    var _url = "";
    _url = "https://apis.map.qq.com/ws/place/v1/suggestion/?region=" + huaCurrentCity + "&keyword=" + keyword + "&location=" + nowLatLongitude + "&key=" + mapKey + "";
    // console.log(_url)
    var opt = {
      url: _url,
      method: 'GET',
      dataType: 'json',
      success(res) {
        // console.log(res)
        if (res.data.status != 0) {
          return
        }
        that.setData({
          searchTipsList: res.data.data,
          isShowSearchTipsList: true
        })
      }
    }
    wx.request(opt);
  },

  //第一次进来，未更改选择地址
  getFirstSerList() {
    var that = this;
    that.transformCoordinate();
  },

  //监听输入框
  bindSearchInput(e) {
    var that = this,
      keyword = e.detail.value;
    that.setData({
      keyword: keyword
    })

    that.getSerachList(keyword);
    that.getFirstSerList();
  },

  //监听获取焦点
  bindSearchfocus(e) {
    var that = this,
      keyword = e.detail.value;
    if (keyword == "" || keyword == undefined || keyword == null) {
      that.setData({
        searchTipsList: [],
        isShowSearchTipsList: false
      })
      return
    } else {
      that.setData({
        isShowSearchTipsList: true
      })
    }
  },

  //监听失去焦点
  bindSearchblur(e) {
    var that = this,
      keyword = e.detail.value;
    if (keyword == "" || keyword == undefined || keyword == null) {
      that.setData({
        searchTipsList: []
      })
      return
    } else {
      that.setData({
        // isShowSearchTipsList: false
      })
    }
  },

  //滑动地址：每次列变动时
  bindCitysColumnChange(e) {
    //console.log('修改的列为', e.detail.column, '，值为', e.detail.value);
    var that = this,
      cityIndex = that.data.cityIndex,
      column = e.detail.column,
      value = e.detail.value;
    if (column == 0) {
      cityIndex[0] = value;
      cityIndex[1] = 0;
      cityIndex[2] = 0;
    } else if (column == 1) {
      cityIndex[1] = value;
      cityIndex[2] = 0;
    } else if (column == 2) {
      cityIndex[2] = value;
    }

    that.setData({
      cityIndex: cityIndex,
    })

    that.getTencentCity();
  },

  //选择完地址：点击确定
  bindCitysChange(e) {
    var that = this,
      keyword = that.data.keyword,
      huaCurrentCity = that.data.huaCurrentCity;
    that.transformCoordinate();
    that.getSerachList(keyword);
    that.setData({
      nowCurrentCity: that.data.huaCurrentCity
    })
  },

  //选择列表筛选出的子项
  chooseSerListItem(e) {
    var that = this,
      title = e.currentTarget.dataset.title;
    that.setData({
      keyword: title,
      isShowSearchTipsList: false
    })
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    var that = this;
    that.getTencentCity();
    that.getFirstSerList();
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function () {

  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function () {

  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide: function () {

  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload: function () {

  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh: function () {

  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom: function () {

  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function () {

  }
})