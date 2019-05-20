import util from "@/libs/util";
import * as types from "@/types";

export default {
    location: {
        ...types.getDefaultLocation(),
        ...util.getStorage('userLocation')
    },
    userLocation: {
        ...types.getDefaultLocation(),
        ...util.getStorage('userLocation')
    },
    hasSettings: !util.empty(util.getStorage('settings')),
    settings: {
        ...types.getDefaultSetting(),
        ...(util.getStorage('settings') || {})
    }
}