const MapGPS = { PI: 3.14159265358979324, x_pi: 3.14159265358979324 * 3000.0 / 180.0, delta: function (lat, lon) { var a = 6378245.0; var ee = 0.00669342162296594323; var dLat = this.transformLat(lon - 105.0, lat - 35.0); var dLon = this.transformLon(lon - 105.0, lat - 35.0); var radLat = lat / 180.0 * this.PI; var magic = Math.sin(radLat); magic = 1 - ee * magic * magic; var sqrtMagic = Math.sqrt(magic); dLat = (dLat * 180.0) / ((a * (1 - ee)) / (magic * sqrtMagic) * this.PI); dLon = (dLon * 180.0) / (a / sqrtMagic * Math.cos(radLat) * this.PI); return { 'lat': dLat, 'lon': dLon } }, gps84_To_Gcj02: function (wgsLat, wgsLon) { if (this.outOfChina(wgsLat, wgsLon)) return { 'lat': wgsLat, 'lon': wgsLon }; var d = this.delta(wgsLat, wgsLon); return { lat: wgsLat + d.lat, lon: wgsLon + d.lon } }, gcj02_To_Bd09: function (lat, lng) { let x_pi = 3.14159265358979324 * 3000.0 / 180.0; let x = lng; let y = lat; let z = Math.sqrt(x * x + y * y) + 0.00002 * Math.sin(y * x_pi); let theta = Math.atan2(y, x) + 0.000003 * Math.cos(x * x_pi); let lngs = z * Math.cos(theta) + 0.0065; let lats = z * Math.sin(theta) + 0.006; return { lat: lats, lon: lngs } }, bd09_To_Gcj02: function (lat, lng) { let x_pi = 3.14159265358979324 * 3000.0 / 180.0; let x = lng - 0.0065; let y = lat - 0.006; let z = Math.sqrt(x * x + y * y) - 0.00002 * Math.sin(y * x_pi); let theta = Math.atan2(y, x) - 0.000003 * Math.cos(x * x_pi); let lngs = z * Math.cos(theta); let lats = z * Math.sin(theta); return { lat: lats, lon: lngs } }, gcj02_to_gps84: function (lat, lng) { var lat = +lat; var lng = +lng; if (this.outOfChina(lat, lng)) { return [lng, lat] } else { var dlat = this.transformLat(lng - 105.0, lat - 35.0); var dlng = this.transformLon(lng - 105.0, lat - 35.0); var radlat = lat / 180.0 * PI; var magic = Math.sin(radlat); magic = 1 - ee * magic * magic; var sqrtmagic = Math.sqrt(magic); dlat = (dlat * 180.0) / ((a * (1 - ee)) / (magic * sqrtmagic) * PI); dlng = (dlng * 180.0) / (a / sqrtmagic * Math.cos(radlat) * PI); var mglat = lat + dlat; var mglng = lng + dlng; return [lng * 2 - mglng, lat * 2 - mglat] } }, gps84_To_Bd09: function (wgsLat, wgsLon) { let point = this.gps84_To_Gcj02(wgsLat, wgsLon); return this.gcj02_To_Bd09(point.lat, point.lon) }, bd09_To_Gps84: function (wgsLat, wgsLon) { let point = this.bd09_To_Gcj02(wgsLat, wgsLon); return this.gcj02_to_gps84(point.lat, point.lon) }, outOfChina: function (lat, lon) { if (lon < 72.004 || lon > 137.8347) return true; if (lat < 0.8293 || lat > 55.8271) return true; return false }, transformLat: function (x, y) { var ret = -100.0 + 2.0 * x + 3.0 * y + 0.2 * y * y + 0.1 * x * y + 0.2 * Math.sqrt(Math.abs(x)); ret += (20.0 * Math.sin(6.0 * x * this.PI) + 20.0 * Math.sin(2.0 * x * this.PI)) * 2.0 / 3.0; ret += (20.0 * Math.sin(y * this.PI) + 40.0 * Math.sin(y / 3.0 * this.PI)) * 2.0 / 3.0; ret += (160.0 * Math.sin(y / 12.0 * this.PI) + 320 * Math.sin(y * this.PI / 30.0)) * 2.0 / 3.0; return ret }, transformLon: function (x, y) { var ret = 300.0 + x + 2.0 * y + 0.1 * x * x + 0.1 * x * y + 0.1 * Math.sqrt(Math.abs(x)); ret += (20.0 * Math.sin(6.0 * x * this.PI) + 20.0 * Math.sin(2.0 * x * this.PI)) * 2.0 / 3.0; ret += (20.0 * Math.sin(x * this.PI) + 40.0 * Math.sin(x / 3.0 * this.PI)) * 2.0 / 3.0; ret += (150.0 * Math.sin(x / 12.0 * this.PI) + 300.0 * Math.sin(x / 30.0 * this.PI)) * 2.0 / 3.0; return ret } };

customElements.whenDefined("hui-view").then(() => {

    customElements.define('baidu-staticimage', class extends HTMLElement {

        config = {}
        zoom = 16
        loading = false

        static getStubConfig() {
            return { 
                entity_id: "带经纬度属性的实体",
                ak: '百度地图AK密钥'
            }
        }

        setConfig(config) {
            if (!config.entity_id) {
                throw new Error('你需要定义一个实体');
            }

            if (config.zoom) {
                if (isNaN(config.zoom) || config.zoom < 5 || config.zoom > 19) {
                    throw new Error('缩放值必须在5到19之间');
                }
                this.zoom = config.zoom
            }

            this.config = config;
            // 更新
            this.updated()
        }

        get hass() {
            return this._hass
        }

        set hass(hass) {
            this._hass = hass
            if (this.isCreated) {
                this.updated()
            } else {
                this.created(hass)
            }
        }

        fire(type, data) {
            const event = new Event(type, {
                bubbles: true,
                cancelable: false,
                composed: true
            });
            event.detail = data;
            this.dispatchEvent(event);
        }

        showMoreInfo(entityId) {
            this.fire('hass-more-info', { entityId })
        }

        updated() {
            const { hass, config } = this
            let { entity_id, ak } = config
            if (hass && entity_id && ak) {
                const entity = hass.states[entity_id]
                if(!entity){                    
                    throw new Error('你需要定义一个实体');
                }
                let attributes = entity['attributes']
                if (Reflect.has(attributes, 'latitude') && Reflect.has(attributes, 'longitude')) {
                    let longitude = attributes["longitude"]
                    let latitude = attributes["latitude"]

                    let point = null
                    if (attributes.map == 'gaode') {
                        point = MapGPS.gcj02_To_Bd09(latitude, longitude)
                    } else {
                        point = MapGPS.gps84_To_Bd09(latitude, longitude)
                    }
                    longitude = point.lon
                    latitude = point.lat
                    const address = `${longitude},${latitude}`

                    this.$('#name').textContent = attributes.friendly_name
                    const card = this.$('ha-card')
                    card.style.height = card.offsetWidth + 'px'

                    const src = `https://api.map.baidu.com/staticimage/v2?ak=${ak}&zoom=${this.zoom}&width=800&height=800&center=${address}&markers=${address}`
                    const link = `url("${src}")`
                    if (link != card.style.backgroundImage) {
                        card.style.backgroundImage = link
                    }
                }
            }
        }

        created(hass) {
            const shadow = this.attachShadow({ mode: 'open' });
            const map = document.createElement('ha-card');
            map.innerHTML = `
            <div id="group">
                <button id="plus">+</button>
                <button id="subtract">-</button>
            </div>
            <div id="footer">
                <button id="location">•</button>
                <div id="name">实体名称</div>
            </div>
            `
            shadow.appendChild(map)
            // 创建样式
            const style = document.createElement('style')
            style.textContent = `
            ha-card{
                background-repeat: no-repeat;
            }
            #group{
                position: absolute;
                top: 10px;
                left: 10px;
            }
            #group button, #location{
                display: block;
                width: 30px;
                height: 30px;
                font: bold 20px 'Lucida Console', Monaco, monospace;
                text-indent: 1px;
                background-color: #fff;
                border: 1px solid #ccc;
                color: black;
            }
            #group #plus{
                border-bottom: none;
            }
            #footer{                
                position: absolute;
                bottom: 10px;
                left: 10px;
            }
            #location{                
                border-radius: 50%;
            }
            #name{
                color: white;
                background: rgba(0,0,0,.4);
                padding: 5px 10px;
                border-radius: 10px;
                margin-top: 10px;              
            }
            `
            shadow.appendChild(style);
            // 保存核心DOM对象
            this.shadow = shadow
            this.$ = this.shadow.querySelector.bind(this.shadow)
            // 创建成功
            this.isCreated = true

            this.$('#plus').onclick = () => {
                let { zoom } = this
                zoom += 1
                if (zoom > 19) zoom = 19
                this.zoom = zoom
                this.updated()
            }
            this.$('#subtract').onclick = () => {
                let { zoom } = this
                zoom -= 1
                if (zoom < 5) zoom = 5
                this.zoom = zoom
                this.updated()
            }

            this.$('#name').onclick = () => {
                this.showMoreInfo(this.config.entity_id)
            }

            this.$('#location').onclick = () => {
                center()
            }

            // 移动画布
            let mouse = null

            let backgroundPositionX = undefined
            let backgroundPositionY = undefined

            map.ontouchstart = function () {
                const event = arguments[arguments.length - 1]
                const { pageX, pageY } = event.changedTouches[0]

                mouse = { x: pageX, y: pageY }
            }
            map.ontouchend = function () {
                const event = arguments[arguments.length - 1]
                const { pageX, pageY } = event.changedTouches[0]
                up(pageX, pageY)
            }

            map.onmousedown = function () {
                const event = arguments[arguments.length - 1]
                mouse = { x: event.offsetX, y: event.offsetY }
            }
            map.onmouseup = function () {
                const event = arguments[arguments.length - 1]
                const { offsetX, offsetY } = event
                up(offsetX, offsetY)
            }

            function up(offsetX, offsetY) {
                if (mouse != null) {
                    const { x, y } = mouse
                    const pos = {
                        x: parseInt(offsetX - x),
                        y: parseInt(offsetY - y)
                    }
                    backgroundPositionX += pos.x
                    backgroundPositionY += pos.y
                    map.style.backgroundPositionX = backgroundPositionX + 'px'
                    map.style.backgroundPositionY = backgroundPositionY + 'px'

                    mouse = null
                }
            }

            function center() {
                let mapWidth = map.offsetWidth
                backgroundPositionX = (mapWidth - 800) / 2
                backgroundPositionY = (mapWidth - 800) / 2
                map.style.height = mapWidth + 'px'
                map.style.backgroundPositionX = backgroundPositionX + 'px'
                map.style.backgroundPositionY = backgroundPositionY + 'px'
            }

            setTimeout(center, 0)
        }

    })

    window.customCards = window.customCards || [];
    window.customCards.push({
        type: "baidu-staticimage",
        name: "百度地图",
        preview: false,
        description: "百度地图静态图片预览"
    });

})