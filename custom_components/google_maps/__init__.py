from homeassistant.config_entries import ConfigEntry
from homeassistant.core import HomeAssistant
import homeassistant.helpers.config_validation as cv

from .const import DOMAIN, VERSION

CONFIG_SCHEMA = cv.deprecated(DOMAIN)

async def async_setup_entry(hass: HomeAssistant, entry: ConfigEntry) -> bool:
    ak = entry.data.get('ak')
    hass.http.register_static_path("/baidu_maps_www", hass.config.path("custom_components/" + DOMAIN + "/www"), False)
    hass.components.frontend.async_register_built_in_panel(
                        "iframe",
                        "百度地图",
                        "mdi:google-maps",
                        DOMAIN,
                        { "url": f"/baidu_maps_www/index.html?ak={ak}&v={VERSION}" },
                        require_admin=False)

    hass.components.frontend.add_extra_js_url(hass, f'/baidu_maps_www/map.js?v={VERSION}')
    return True

async def async_unload_entry(hass: HomeAssistant, entry: ConfigEntry) -> bool:
    hass.components.frontend.async_remove_panel(DOMAIN)
    return True