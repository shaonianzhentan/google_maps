customElements.whenDefined("hui-view").then(() => {

    customElements.define('baidu-staticimage', class extends HTMLElement {

        config = {}

        setConfig(config) {
            if (!config.entity_id) {
                throw new Error('你需要定义一个实体');
            }
            this.config = config;
            // 更新
            this.updated()
        }

        set hass(hass) {
            this._hass = hass
            if (this.isCreated) {
                this.updated()
            } else {
                this.created(hass)
            }
        }

        updated() {
            const { hass, config } = this
            let { entity_id, zoom, ak } = config
            if (entity_id && zoom && ak) {

                if (zoom < 4 || zoom > 19) zoom = 15

                entity = hass.states[entity_id]
                let attributes = entity['attributes']
                if (Reflect.has(attributes, 'latitude') && Reflect.has(attributes, 'longitude')) {
                    const points = `${attributes["latitude"]},${attributes["latitude"]}`
                    this.img.src = `http://api.map.baidu.com/staticimage/v2?ak=${ak}&zoom=${zoom}&center=${points}&markers=${points}`
                }
            }
        }

        created(hass) {
            const shadow = this.attachShadow({ mode: 'open' });
            const img = document.createElement('img');
            img.width = '100%'
            this.img = img
            shadow.appendChild(img)
            // 创建样式
            const style = document.createElement('style')
            style.textContent = ``
            shadow.appendChild(style);
            // 保存核心DOM对象
            this.shadow = shadow
            this.$ = this.shadow.querySelector.bind(this.shadow)
            // 创建成功
            this.isCreated = true
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