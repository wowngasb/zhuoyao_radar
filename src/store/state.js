import util from "@/libs/util";
import * as types from "@/types";

export default {
    location: {
        ...util.getDefaultLocation(),
        ...util.getStorage('userLocation')
    },
    userLocation: {
        ...util.getDefaultLocation(),
        ...util.getStorage('userLocation')
    },
    hasSettings: !util.empty(util.getStorage('settings')),
    settings: {
        ...util.getDefaultSetting(),
        ...(util.getStorage('settings') || {})
    }
}