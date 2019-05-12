<template>
  <div
    id="root"
    class="radar-app"
    :data-version="appVersion"
    :data-currVersion="currVersion"
    :data-longitude="location.longitude"
    :data-latitude="location.latitude"
    :data-longitude_u="userLocation.longitude"
    :data-latitude_u="userLocation.latitude"
  >
    <right-nav :version="appVersion" :currVersion="currVersion"></right-nav>
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
import { setTimeout, clearInterval, setInterval } from "timers";

let socket = null;
let map = null;
let tickTimer = null;

export default {
  name: "App",
  mixins: [mapMixins],
  components: {
    RightNav
  },
  clickMarker: null, // 点击位置标记
  userMarker: null, // 用户位置标记
  data() {
    return {
      appVersion: types.APP_VERSION,
      debugStatus: "", // debug 信息
      debug: false,
      sprite_map: {},  // 不追踪的数据
      firstTime: true, // 首次连接socket标记
      currVersion: types.CUR_YAOLING_VERSION, //190508版本的json 如果有变动手动更新
      messageMap: new Map() // 缓存请求类型和id
    };
  },
  created() {
    this.sprite_map = {}; // 不追踪的数据

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
      currVersion:${this.currVersion}
      版本:${this.appVersion} <br/>`);
  },
  methods: {
    /**
     * 缓存响应的类型和id
     */
    genRequestId(type) {
      let _time = new Date().getTime() % 1234567;
      this.messageMap.set(`msg_${_time}`, type);
      return _time;
    },
    /**
     * 根据id找到请求的类型
     */
    getRequestTypeFromId(id) {
      return this.messageMap.get(id);
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

      var _type = this.messageMap.get(`msg_${requestid}`);
      if (_type) {
        this.messageMap.delete(`msg_${requestid}`);
      }

      switch (_type) {
        case "10041":
          data.filename = data.filename || "";
          console.log("获取到版本数据", data.filename);
          this.getVersionFileName(data.filename);
          break;
        case "1001":
          data.sprite_list = data.sprite_list || [];
          console.log("获取到妖灵数量", data.sprite_list.length);
          this.buildMarkersByData(data.sprite_list);
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
      if (name != this.currVersion) {
        console.info(
          `有新版本的 name:${name} currVersion:${this.currVersion} !`
        );
        this.notify("有新版本的妖灵库，请通知作者更新！！");
      }
    },
    /**
     * 根据查询结果过滤数据，打标记
     */
    buildMarkersByData(t) {
      this.sprite_map = this.sprite_map || {};

      t.forEach(item => {
        item.lifetime = item.lifetime;

        var t = util.time() - item.gentime;
        if (t <= 0 || t >= item.lifetime) {
          console.log(
            `skip mark sprite_id:${item.sprite_id}, t:${t}, gentime:${
              item.gentime
            }, lifetime:${item.lifetime}`
          );
          return;
        }

        var _k = item.sprite_id + "_" + item.latitude + "," + item.longtitude;
        if(this.sprite_map[_k]){
          this.sprite_map[_k].item = item;
          this.sprite_map[_k].marker =  this.sprite_map[_k].marker || null;
          return ;
        }

        var marker =
          this.settings.fit_all || this.fit.indexOf(item.sprite_id) >= 0
            ? this.buildSpiteMarker(t, item)
            : null;
        this.sprite_map[_k] = {
          marker: marker,
          item: item
        };
      });
      this.notify("筛选成功!");
    },
    checkSpriteMap() {
      this.sprite_map = this.sprite_map || {};

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
            val.marker = this.buildSpiteMarker(t, item);
          }
          val.marker.setVisible(true);
          var content = this.buildSpiteDecoration(t, item);
          var decoration = new qq.maps.MarkerDecoration(
            content,
            new qq.maps.Point(0, 0)
          );
          val.marker.setDecoration(decoration);
        }
      });
    },
    buildSpiteDecoration(t, item) {
      var c = item.lifetime - t;
      var content = util.t2str(c);

      var color = "red";
      color = c > 5 * 60 ? "blue" : color;
      color = c > 10 * 60 ? "black" : color;

      return `<span style="font-size: 15px;font-weight: bolder;color:${color};" data-sprite_id="${
        item.sprite_id
      }">${content}</span>`;
    },
    buildSpiteMarker(t, item) {
      var iconPath = this.getHeadImagePath(item);
      var m = {
        latitude: item.latitude / 1e6,
        longitude: item.longtitude / 1e6,
        iconPath: iconPath,
        width: 40,
        height: 40
      };

      var icon = new qq.maps.MarkerImage(
        m.iconPath,
        new qq.maps.Size(40, 40),
        null,
        null,
        new qq.maps.Size(40, 40)
      );

      var content = this.buildSpiteDecoration(t, item);
      var decoration = new qq.maps.MarkerDecoration(
        content,
        new qq.maps.Point(0, 0)
      );
      var marker = new qq.maps.Marker({
        decoration: decoration,
        position: new qq.maps.LatLng(m.latitude, m.longitude),
        map: map
      });
      marker.setIcon(icon);
      return marker;
    },
    //根据妖灵信息获取其icon地址
    getHeadImagePath(e) {
      var a = types.getYaolingById(e.sprite_id);
      if (a) {
        return `./original/image/head/${a.ImgName}.png`;
      } else {
        return "./original/image/default-head.png";
      }
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
      var e = {
        request_type: "1001",
        longtitude: util.convertLocation(this.location.longitude),
        latitude: util.convertLocation(this.location.latitude),
        requestid: this.genRequestId("1001"),
        platform: 0
      };
      this.sendMessage(e, "1001");
    },
    getSettingFileName() {
      var e = {
        request_type: "1004",
        cfg_type: 1,
        requestid: this.genRequestId("10041"),
        platform: 0
      };
      this.sendMessage(e, "10041");
    }
  },
  computed: {
    ...Vuex.mapState(["settings", "location", "userLocation"]),
    fit() {
      let ans = [];
      types.FILTER_DATA.forEach(item => {
        var value = this.settings[item[0]] || [];
        ans = ans.concat(value);
      });
      return Array.from(new Set(ans));;
    }
  }
};
</script>
<style lang='less'>
</style>

