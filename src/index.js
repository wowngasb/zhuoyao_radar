import Vue from 'vue';
import Vuex from 'vuex';
import Element from 'element-ui';

import '@/index.less';
import App from '@/app';
import store from '@/store/index';

Vue.use(Vuex);
Vue.use(Element, { size: 'medium' });

window.app = new Vue({
  store: new Vuex.Store(store),
  el: '#root',
  render: h => h(App)
});