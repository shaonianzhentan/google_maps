customElements.whenDefined("hui-view").then(() => {

    customElements.define('baidu-staticimage', class extends HTMLElement {

        config = {}
        zoom = 15
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
                if (isNaN(config.zoom) || config.zoom < 3 || config.zoom > 18) {
                    throw new Error('缩放值必须在3到18之间');
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
                if (!entity) {
                    throw new Error('你需要定义一个实体');
                }
                let attributes = entity['attributes']
                if (Reflect.has(attributes, 'latitude') && Reflect.has(attributes, 'longitude')) {
                    let longitude = attributes["longitude"]
                    let latitude = attributes["latitude"]

                    let coordtype = 'wgs84ll'
                    if (attributes.map == 'gaode') {
                        coordtype = 'gcj02ll'
                    }
                    const address = `${longitude},${latitude}`

                    this.$('#name').textContent = attributes.friendly_name
                    const card = this.$('ha-card')
                    card.style.height = card.offsetWidth + 'px'

                    const src = `https://api.map.baidu.com/staticimage/v2?ak=${ak}&zoom=${this.zoom}&coordtype=${coordtype}&copyright=1&dpiType=ph&width=800&height=800&center=${address}&markers=${address}`
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
                if (zoom > 18) zoom = 18
                this.zoom = zoom
                this.updated()
            }
            this.$('#subtract').onclick = () => {
                let { zoom } = this
                zoom -= 1
                if (zoom < 3) zoom = 3
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