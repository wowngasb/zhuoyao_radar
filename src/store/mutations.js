import util from "@/libs/util";
import * as types from "@/types";

export default {
    [types.SETTINGS](state, { settings }) {
        state.settings = {
          ...state.settings,
          ...settings
        };
        state.hasSettings = true;
        util.setStorage('settings', state.settings);
      },
      [types.LOCATION](state, { location }) {
        state.location = {
          ...state.location,
          ...location
        };
      },
      [types.USER_LOCATION](state, { userLocation }) {
        state.userLocation = {
          ...state.userLocation,
          ...userLocation
        };
        util.setStorage('userLocation', state.userLocation);
      },
}