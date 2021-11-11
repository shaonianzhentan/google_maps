import uuid
from homeassistant.config_entries import ConfigEntry
from homeassistant.core import HomeAssistant
import homeassistant.helpers.config_validation as cv

from .const import DOMAIN

CONFIG_SCHEMA = cv.deprecated(DOMAIN)

async def async_setup_entry(hass: HomeAssistant, entry: ConfigEntry) -> bool:
    hass.http.register_static_path("/baidu_maps_www", hass.config.path("custom_components/" + DOMAIN + "/www"), False)
    hass.components.frontend.async_register_built_in_panel(
                        "iframe",
                        "百度地图",
                        "mdi:google-maps",
                        DOMAIN,
                        { "url": "/baidu_maps_www/index.html?ak=7Cc5Kmn672miPzG4qQhvlOrERcXMMinq&v=" + uuid.uuid1().hex },
                        require_admin=False)
    return True

async def async_unload_entry(hass: HomeAssistant, entry: ConfigEntry) -> bool:
    hass.components.frontend.async_remove_panel(DOMAIN)
    return True