class HomeAssistant {

  get hass() {
    return parent.document.querySelector('home-assistant')?.hass
  }

  constructor() {
    const query = new URLSearchParams(location.search)
    this.ak = query.get('ak')
    this.lng = query.get('lng')
    this.lat = query.get('lat')
    // if (!this.hass) parent.alert("请在HomeAssistant中使用");
    // if (!this.ak) parent.alert("请配置百度地图浏览器AK密钥");

    const div = document.createElement('div')
    div.id = 'container'
    document.body.appendChild(div)
  }

  async loadMap() {
    window.BMapGL_loadScriptTime = (new Date).getTime();
    await this.loadScript("https://api.map.baidu.com/getscript?type=webgl&v=1.0&services=&t=20211018154739&ak=" + this.ak)
    await this.loadScript("https://mapopen.bj.bcebos.com/github/BMapGLLib/RichMarker/src/RichMarker.min.js")
    const map = new BMapGL.Map('container');
    map.enableScrollWheelZoom(true);     //开启鼠标滚轮缩放
    const scaleCtrl = new BMapGL.ScaleControl();  // 添加比例尺控件
    map.addControl(scaleCtrl);
    const zoomCtrl = new BMapGL.ZoomControl();  // 添加比例尺控件
    map.addControl(zoomCtrl);
    this.map = map

    // 根据主题更换颜色
    if (this.hass?.selectedTheme?.dark) {
      map.setMapStyleV2({ styleJson });
    }

    return this
  }

  centerAndZoom(lng, lat, zoom = 17) {
    this.map.centerAndZoom(new BMapGL.Point(lng, lat), zoom);
  }

  location(url) {
    parent.history.replaceState(null, null, url)
    this.fireEvent('location-changed', { replace: false })
  }

  fireEvent(type, data = {}) {
    const event = new Event(type, {
      bubbles: true,
      cancelable: false,
      composed: true
    });
    event.detail = data;
    parent.document.querySelector('home-assistant').dispatchEvent(event);
  }

  loadScript(src) {
    return new Promise((resolve) => {
      let script = document.createElement('script')
      script.src = src
      script.onload = () => {
        resolve()
      }
      document.body.append(script)
    })
  }

  addContextMenu(txtMenuItem) {
    const { map } = this

    var menu = new BMapGL.ContextMenu();
    for (var i = 0; i < txtMenuItem.length; i++) {
      menu.addItem(new BMapGL.MenuItem(txtMenuItem[i].text, txtMenuItem[i].callback, 100));
    }
    map.addContextMenu(menu);

    // 移动端长按事件
    if ("ontouchstart" in window) {
      let isLongPress = false
      map.addEventListener('click', function (e) {
        if (isLongPress) {
          menu.curPixel = e.pixel
          menu.curPoint = e.point
          menu.show();
          isLongPress = false
        }
      });
      longPress((e) => {
        isLongPress = true
      })
    }
  }

  /**
   * 渲染标记
   * @param {Function} callback 
   */
  readerMarker(callback) {
    const { map } = this
    // 删除所有设备
    let allOverlay = map.getOverlays();
    for (let i = 0, j = allOverlay.length; i < j; i++) {
      map.removeOverlay(allOverlay[i]);
    }
    callback(this)
  }

  addIconMarker(lng, lat, { entityId, icon, radius, entity_picture, friendly_name }, isClick = true) {
    const point = new BMapGL.Point(lng, lat)
    const { map } = this
    let html = ''
    // 地点
    if (radius) {
      // 绘制圆
      let circle = new BMapGL.Circle(point, radius, {
        fillColor: "#FF9800", strokeColor: 'orange', strokeWeight: 1, fillOpacity: 0.3, strokeOpacity: 0.5
      });
      map.addOverlay(circle);
      html = `<i class="zone-marker mdi ${icon.replace('mdi:', 'mdi-')}"></i>`
    } else {
      if (entity_picture) {
        html = `<div class="picture-marker" style="background-image:url(${entity_picture});"></div>`
      } else {
        html = `<div class="name-marker">${friendly_name[0]}</div>`
      }
    }
    // 绘制图标
    let myRichMarker1 = new BMapGLLib.RichMarker(html, point);
    map.addOverlay(myRichMarker1);

    if (isClick) {
      myRichMarker1.addEventListener('click', (e) => {
        this.fireEvent('hass-more-info', { entityId })
      })
      myRichMarker1.addEventListener('mouseup', function (e) {
        if (event.button == 2) {
          let pos = e.currentTarget._position
          map.centerAndZoom(new BMapGL.Point(pos.lng, pos.lat), 15);
        }
      })
    }
  }

  startTrack(arr) {
    console.log(arr)
    const { map } = this
    this.trackAni?.cancel()
    const points = arr.map(([lng, lat]) => new BMapGL.Point(lng, lat))
    map.centerAndZoom(points[0], 17);

    this.trackAni = new BMapGLLib.TrackAnimation(map, new BMapGL.Polyline(points), {
      overallView: true,
      tilt: 30,
      duration: 15000,
      delay: 300
    });
    this.trackAni.start()
  }

  /**
   * 坐标转换
   * @param {Array<Number> | Array<Array>} input 经纬度数组
   * @param {CRS} from 当前坐标系
   * @param {CRS} to 目标坐标系
   * @returns 
   */
  transform(input, from, to) {
    if (Array.isArray(input[0])) {
      return input.map(point => gcoord.transform(point, from, to))
    } else {
      return gcoord.transform(input, from, to);
    }
  }
}

window.ha = new HomeAssistant()