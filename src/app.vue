<template>
  <div
    id="root"
    class="radar-app"
    :data-version="appVersion"
    :data-curVersion="curVersion"
    :data-longitude="location.longitude"
    :data-latitude="location.latitude"
    :data-longitude_u="userLocation.longitude"
    :data-latitude_u="userLocation.latitude"
  >
    <right-nav :version="appVersion" :curVersion="curVersion"></right-nav>
    <div class="radar-status" v-show="debug">
      <div class="radar-info">
        <br>
        <span v-html="debugStatus"></span>
      </div>
    </div>
    <div class="radar-buttons">
      <el-button size="mini" @click.prevent="getYaolingInfo">妖灵</el-button>
      <el-button size="mini" type="warning" @click.prevent="debug = !debug">Debug</el-button>
    </div>
    <div id="qmap" class="radar-qmap"></div>
  </div>
</template>
<script>
import Vuex from "vuex";

import mapMixins from "@/mixins/mapMixins";

import tempdata from "@/libs/tempdata";
import RadarWebSocket from "@/libs/socket";
import RightNav from "@/components/rightNav";

import util from "@/libs/util";
import * as types from "@/types";
import { setTimeout, clearInterval, setInterval, clearTimeout } from "timers";

let socket = null;
let map = null;
let tickTimer = null;
let cache = util.CacheFactory("get_1001_data", {
  capacity: 1024 * 8
});

export default {
  name: "App",
  mixins: [mapMixins],
  components: {
    RightNav
  },
  clickMarker: null, // 点击位置标记
  userMarker: null, // 用户位置标记
  circleMarker: null,
  data() {
    return {
      appVersion: types.APP_VERSION,
      debugStatus: "", // debug 信息
      debug: false,
      sprite_map: {}, // 不追踪的数据
      sprite_ret: [],
      firstTime: true, // 首次连接socket标记
      curVersion: types.CUR_YAOLING_VERSION, //190508版本的json 如果有变动手动更新
      messageMap: new Map() // 缓存请求类型和id
    };
  },
  created() {
    this.sprite_map = {}; // 不追踪的数据
    this.debugCache = cache;

    tickTimer && clearInterval(tickTimer);
    tickTimer = setInterval(() => {
      this.checkSpriteMap();
    }, 1000);
  },
  mounted() {
    // 初始化地图组件
    map = this.initMap(map => {
      // 初始化websocket
      socket = new RadarWebSocket({
        onopen: () => {
          this.$nextTick(() => {
            this.addStatus("WSS连接开启");
            console.log("WSS连接开启");
            // 首次连接
            if (this.firstTime) {
              this.firstTime = false;
              setTimeout(() => {
                this.getSettingFileName();
              }, 4000);
            }

            if (this.settings.auto_search) {
              this.$store.commit(types.LOCATION, {
                location: this.userLocation
              });
              setTimeout(() => {
                this.getYaolingInfo();
              }, 2000);
            }
          });
        },
        onmessage: this.onSocketMessage
      });

      this.$nextTick(() => {
        // 获取用户位置
        console.log("initUserMarker", util.j(this.userLocation));
        this.initUserMarker(
          map,
          this.userLocation.latitude,
          this.userLocation.longitude
        );

        if (this.settings.auto_location) {
          console.log("try getLocation");
          this.getLocation()
            .then(position => {
              console.log("getLocation", position);
              position &&
                this.initUserMarker(map, position.latitude, position.longitude);
            })
            .catch(b => {});
        }
      });
    });

    this.addStatus(`捉妖雷达Web版 <br/>
      curVersion:${this.curVersion}
      版本:${this.appVersion} <br/>`);
  },
  methods: {
    /**
     * 缓存响应的类型和id
     */
    genRequestId(type, args) {
      args = args || {};
      let _id = new Date().getTime() % 1234567;
      this.messageMap.set(`msg_${_id}`, type);
      this.messageMap.set(`args_${_id}`, args);
      return _id;
    },
    /**
     * 消息响应
     */
    onSocketMessage(event) {
      var blob = event.data;

      if (typeof blob !== "string") {
        var fileReader = new FileReader();
        fileReader.onload = e => {
          var arrayBuffer = e.target.result;
          var n = util.utf8ByteToUnicodeStr(
            new Uint8Array(arrayBuffer).slice(4)
          );

          var data = JSON.parse(n);
          this.handleMessage(data);
        };
        fileReader.readAsArrayBuffer(blob);
      } else {
        var data = JSON.parse(blob);
        this.handleMessage(data);
      }
    },
    /**
     * 处理消息
     */
    handleMessage(data) {
      var requestid = data.requestid || "";

      var _type = this.messageMap.get(`msg_${requestid}`) || "_unknown_";
      var _args = this.messageMap.get(`args_${requestid}`) || {};

      this.messageMap.delete(`msg_${requestid}`);
      this.messageMap.delete(`args_${requestid}`);

      switch (_type) {
        case "10041":
          data.filename = data.filename || "";
          console.log("获取到版本数据", data.filename);
          this.getVersionFileName(data.filename);
          break;
        case "1001":
          data.sprite_list = data.sprite_list || [];
          var center = new qq.maps.LatLng(
            _args.latitude / 1e6,
            _args.longtitude / 1e6
          );
          var maxDis = util.geoMaxDistance(
            data.sprite_list,
            (latitude, longtitude) => {
              return qq.maps.geometry.spherical.computeDistanceBetween(
                center,
                new qq.maps.LatLng(latitude / 1e6, longtitude / 1e6)
              );
            }
          );
          console.log("获取到妖灵", data.sprite_list.length, _args, {
            dis: maxDis.toFixed(3)
          });

          this.circleMarker && this.circleMarker.setMap(null);
          this.circleMarker = new qq.maps.Circle({
            map: map,
            center: center,
            radius: maxDis,
            strokeWeight: 2
          });

          this.notify(
            `获取到妖灵 ${
              data.sprite_list.length
            }, lng:${this.location.longitude.toFixed(
              3
            )}, lat:${this.location.latitude.toFixed(3)}`
          );
          this.cacheSpriteList(cache, data, _args);
          this.buildMarkersByData(data.sprite_list, _args);
          break;
        case "1002":
          console.log("获取到擂台数据", data);
          break;
        default:
          console.log("handleMessage", requestid, data);
          break;
      }
    },
    getVersionFileName(name) {
      if (name != this.curVersion) {
        console.info(`有新版本的 name:${name} curVersion:${this.curVersion} !`);
        console.log('https://hy.gwgo.qq.com/sync/pet/config/' + name);
        this.notify("有新版本的妖灵库，请通知作者更新！！");
      }
    },
    /**
     * 根据查询结果过滤数据，打标记
     */
    buildMarkersByData(sprite_list, args) {
      this.sprite_map = this.sprite_map || {};

      sprite_list.forEach(item => {
        item.lifetime = item.lifetime;

        var t = util.time() - item.gentime;
        if (t <= 0 || t >= item.lifetime) {
          /* console.log(
            `skip mark sprite_id:${item.sprite_id}, t:${t}, gentime:${
              item.gentime
            }, lifetime:${item.lifetime}`
          ); */
          return;
        }

        var _k = item.sprite_id + "_" + item.latitude + "," + item.longtitude;
        if (this.sprite_map[_k]) {
          this.sprite_map[_k].item = item;
          this.sprite_map[_k].marker = this.sprite_map[_k].marker || null;
          return;
        }

        var marker =
          this.settings.fit_all || this.fit.indexOf(item.sprite_id) >= 0
            ? this.buildSpiteMarker(map, t, item)
            : null;
        this.sprite_map[_k] = {
          marker: marker,
          item: item
        };
      });
    },
    checkSpriteMap() {
      this.sprite_map = this.sprite_map || {};
      var sprite_ret = [];

      Object.keys(this.sprite_map).forEach(k => {
        var val = this.sprite_map[k] || {};
        var item = val.item || {};
        var id = item.sprite_id || 0;
        var gentime = item.gentime || 0;
        var lifetime = item.lifetime || 0;

        var t = util.time() - gentime;
        if (t <= 0 || t >= lifetime) {
          val.marker && val.marker.setVisible(false);
          val.marker && val.marker.setMap(null);
          delete this.sprite_map[k];
          return;
        }

        if (!this.settings.fit_all && this.fit.indexOf(item.sprite_id) < 0) {
          val.marker && val.marker.setVisible(false);
          return;
        } else {
          if (!val.marker) {
            val.marker = this.buildSpiteMarker(map, t, item);
          }
          val.marker.setVisible(true);
          var content = this.buildSpiteDecoration(t, item);
          var decoration = new qq.maps.MarkerDecoration(
            content,
            new qq.maps.Point(0, 0)
          );
          val.marker.setDecoration(decoration);
          sprite_ret.push({
            i: id,
            g: gentime,
            l: lifetime,
            j: item.latitude,
            w: item.longtitude
          });
        }
      });
      this.sprite_ret = sprite_ret;
    },
    dumpSpriteRet(tag) {
      return util.dumpPageJson(
        this.appVersion,
        this.curVersion,
        this.sprite_ret,
        this.location,
        this.settings,
        tag
      );
    },
    addStatus(str) {
      this.debugStatus += str + "<br>";
    },
    sendMessage(message, requestIndex) {
      if (message.request_type != "1004") {
        this.addStatus("WSS发送消息：" + JSON.stringify(message));
      }
      console.log("sendMessage", message);

      socket.send(util.json2buffer(message));
    },
    /**
     * 获取妖灵数据
     */
    getYaolingInfo() {
      this._getYaolingInfo(
        util.convertLocation(this.location.longitude),
        util.convertLocation(this.location.latitude)
      );
    },
    _getYaolingInfo(longtitude, latitude) {
      var e = {
        request_type: "1001",
        longtitude: longtitude,
        latitude: latitude,
        platform: 0
      };

      e.requestid = this.genRequestId("1001", e);
      this.tryUseCache(
        cache,
        e,
        data => {
          this.handleMessage(data);
        },
        () => {
          this.sendMessage(e, "1001");
        }
      );
    },
    getSettingFileName() {
      var e = {
        request_type: "1004",
        cfg_type: 1,
        platform: 0
      };

      e.requestid = this.genRequestId("10041", e);
      this.sendMessage(e, "10041");
    }
  },
  computed: {
    ...Vuex.mapState(["settings", "location", "userLocation"]),
    extendList() {
      var auto_extend = parseInt(this.settings.auto_extend);
      if (auto_extend <= 0) {
        return [];
      }
      var tSep = 5000;
      var gSeq = 20000;

      var _ret = [];
      for (let yIdx = -auto_extend; yIdx <= auto_extend; yIdx++) {
        for (let xIdx = -auto_extend; xIdx <= auto_extend; xIdx++) {
          if (yIdx == 0 && xIdx == 0) {
            continue;
          }
          _ret.push({
            yIdx,
            xIdx,
            longtitude:
              util.convertLocation(this.location.longitude) + xIdx * gSeq,
            latitude: util.convertLocation(this.location.latitude) + yIdx * gSeq
          });
        }
      }

      var dIdx = 0;
      var ret = [];
      for (let idx = 1; idx <= auto_extend; idx++) {
        var fList = [
          [(x, y) => Math.abs(x) <= idx && y == -idx, l => l],
          [(x, y) => Math.abs(y) <= idx && x == idx, l => l],
          [(x, y) => Math.abs(x) <= idx && y == idx, l => l.reverse()],
          [(x, y) => Math.abs(y) <= idx && x == -idx, l => l.reverse()]
        ];
        fList.forEach(fItem => {
          var tmp = _ret.filter(
            item => !item.delay && fItem[0](item.xIdx, item.yIdx)
          );
          tmp = fItem[1](tmp);
          tmp.forEach(item => {
            dIdx += 1;
            var delay = dIdx * tSep;
            item.delay = delay;

            if (ret.length == _ret.length - 1) {
              item.timer = setTimeout(() => {
                console.log("auto_extend", delay, item);
                this._getYaolingInfo(item.longtitude, item.latitude);
              }, tSep + delay);
              item.timer = setTimeout(() => {
                console.log("auto_extend", delay, item);
                this._getYaolingInfo(item.longtitude, item.latitude);

                console.warn("auto_extend reload");
                this.$store.commit(types.SETTINGS, { settings: this.settings });
                this.getYaolingInfo();
              }, tSep + delay);
            } else {
              item.timer = setTimeout(() => {
                console.log("auto_extend", delay, item);
                this._getYaolingInfo(item.longtitude, item.latitude);
              }, tSep + delay);
            }
            ret.push(item);
          });
        });
        for (let _idx = -idx; _idx <= idx; _idx++) {}
      }
      return ret;
    },
    fit() {
      let ans = [];
      types.FILTER_DATA.forEach(item => {
        var value = this.settings[item[0]] || [];
        ans = ans.concat(value);
      });
      return Array.from(new Set(ans));
    }
  },
  watch: {
    extendList(newVal, oldVal) {
      oldVal.forEach(item => clearTimeout(item.timer));
    }
  }
};
</script>
<style lang='less'>
</style>

