import Vue from "vue";
import Vuex from "vuex";
import util from "@/libs/util";
import * as types from "@/types";

import mutations from "@/store/mutations";
import actions from "@/store/actions";
import getters from "@/store/getters";
import state from "@/store/state";

export default {
    state,
    mutations,
    actions,
    getters
}