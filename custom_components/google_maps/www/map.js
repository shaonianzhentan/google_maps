customElements.whenDefined('ha-panel-lovelace').then(() => {
  const LitElement = Object.getPrototypeOf(customElements.get("ha-panel-lovelace"));
  const html = LitElement.prototype.html;
  const css = LitElement.prototype.css;

  customElements.define('baidu-map', class extends LitElement {

    static properties = {
      ak: {},
      hass: {},
      config: {}
    };


    static styles = css`iframe{border: none; width: 100%;}`

    constructor() {
      super();
      this.ak = sessionStorage['BAIDU_MAP_AK']
    }

    static getStubConfig() {
      return {
        entity_id: "zone.home",
        zoom: 18
      }
    }

    setConfig(config) {
      if (!config.entity_id) {
        throw new Error('你需要定义一个实体');
      }
      this.config = config;
    }

    render() {
      if (this.ak) {
        const version = new Date().toLocaleDateString()
        let { entity_id, zoom } = this.config
        const click = 1
        return html`<iframe style="height: ${this.offsetWidth}px;" 
          src="/baidu_maps_www/card.html?ak=${this.ak}&v=${version}#id=${entity_id}&zoom=${zoom}&click=${click}"
          ></iframe>`
      } else {
        if (!this.loading) {
          this.loading = true
          this.hass.callWS({ type: 'google_maps', data: { type: 'ak' } }).then(({ ak }) => {
            sessionStorage['BAIDU_MAP_AK'] = ak
            this.ak = ak
          })
        }
        return html`加载中`
      }
    }
  })

  window.customCards = window.customCards || [];
  window.customCards.push({
    type: "baidu-map",
    name: "百度地图",
    preview: false,
    description: "百度地图卡片"
  });

})