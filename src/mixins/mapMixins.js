import util from "@/libs/util";
import * as types from "@/types";

export default {
  methods: {
    /**
     * toast消息窗口
     */
    notify(message) {
      this.$notify({
        message: message,
        showClose: false,
        duration: 2000
      });
    },
    buildCacheKey(now, args, tSeq, gSeq){
      tSeq = tSeq || 30;
      gSeq = gSeq || 10000;
      var _t = parseInt(now / tSeq) * tSeq;
      var _longtitude = parseInt(args.longtitude / gSeq) * gSeq;
      var _latitude = parseInt(args.latitude / gSeq) * gSeq;
      var _key = _t + "_" + _longtitude + "," + _latitude;
      return _key;
    },
    cacheSpriteList(cache, data, args){
      if(util.empty(data) || util.empty(data.sprite_list)){
        return ;
      }
      var key = this.buildCacheKey(util.time(), args);
      cache.put(key, data);
      // console.log('set cahce', key);
    },
    tryUseCache(cache, args, doFunc, sendFunc){
      var key = this.buildCacheKey(util.time(), args);
      var data = cache.get(key);
      if(util.empty(data) || util.empty(data.sprite_list)){
        // console.log('no cahce', key);
        sendFunc && sendFunc();
      } else {
        // console.log('use cahce', key);
        doFunc && doFunc(data);
      }      
    },
    /**
     * 初始化地图
     */
    initMap(callback) {
      var firstLoad = false;
      var map = new qq.maps.Map(document.getElementById('qmap'), {
        center: new qq.maps.LatLng(
          this.userLocation.latitude,
          this.userLocation.longitude
        ),
        zoom: 16 // 地图的中心地理坐标。
      });

      qq.maps.event.addListener(map, 'click', e => this.clickMap(e, map));
      qq.maps.event.addListener(map, 'rightclick', e => this.rightClickMap(e, map));
      
      qq.maps.event.addListener(map, 'tilesloaded', () => {
        if(!firstLoad){
          firstLoad = true;
          callback && callback(map);
        }
      });
      
      return map;
    },
    rightClickMap(e, map) {
      this.initUserMarker(map, e.latLng.lng, e.latLng.lat);
    },
    initUserMarker(map, longitude, latitude) {
      this.$store.commit(types.USER_LOCATION, {
        userLocation: {
          longitude,
          latitude
        }
      });
      this.notify(`初始化位置 lng:${this.userLocation.longitude.toFixed(3)}, lat:${this.userLocation.latitude.toFixed(3)}`);
      var pos = new qq.maps.LatLng(latitude, longitude);

      map.panTo(pos);
      if(this.userMarker){
        this.userMarker.setPosition(pos);
      } else {
        this.userMarker = new qq.maps.Marker({
          position: pos,
          map: map
        });
      }
    },
    initClickMarker(map, longitude, latitude){

      this.$store.commit(types.LOCATION, {
        location: {
          longitude,
          latitude
        }
      });

      var icon = new qq.maps.MarkerImage(
        'original/image/icon/notify-arrow.png',
        null,
        null,
        null,
        new qq.maps.Size(40, 40)
      );
      var pos = new qq.maps.LatLng(latitude, longitude);
      
      if (this.clickMarker) {
        this.clickMarker.setPosition(
          pos
        );
      } else {
        this.clickMarker = new qq.maps.Marker({
          position: pos,
          map: map
        });
        this.clickMarker.setIcon(icon);
      }

      if (this.settings.auto_search) {
        this.getYaolingInfo();
      }
    },
    clickMap(e, map) {
      this.notify(`位置变更 lng:${e.latLng.lng.toFixed(3)}, lat:${e.latLng.lat.toFixed(3)}`);

      this.initClickMarker(map, e.latLng.lng, e.latLng.lat)
    },
    
    buildSpiteDecoration(t, item) {
      var c = item.lifetime - t;
      var content = util.t2str(c);

      var color = "red";
      color = c > 5 * 60 ? "blue" : color;
      color = c > 10 * 60 ? "black" : color;

      return `<span style="font-size: 15px;font-weight: bolder;color:${color};" data-sprite_id="${
        item.sprite_id
      }" data-lifetime="${item.lifetime}" data-gentime="${item.gentime}">${content}</span>`;
    },
    buildSpiteMarker(map, t, item) {
      var iconPath = types.getHeadImagePath(item.sprite_id);
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
    buildSpiteDecoration(t, item) {
      var c = item.lifetime - t;
      var content = util.t2str(c);

      var color = "red";
      color = c > 5 * 60 ? "blue" : color;
      color = c > 10 * 60 ? "black" : color;

      return `<span style="font-size: 15px;font-weight: bolder;color:${color};" data-sprite_id="${
        item.sprite_id
      }" data-lifetime="${item.lifetime}" data-gentime="${item.gentime}">${content}</span>`;
    },
    /**
     * 获取用户位置信息
     */
    getLocation() {
      return new Promise((resolve, reject) => {
        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(
            position => {
              resolve({
                longitude: position.coords.longitude,
                latitude: position.coords.latitude
              });
            },
            error => {
              reject(error);
            },
            {
              enableHighAccuracy: true, //是否要求高精度的地理位置信息
              timeout: 10 * 1000, //对地理位置信息的获取操作做超时限制，如果再该事件内未获取到地理位置信息，将返回错误
              maximumAge: 60 * 1000 //设置缓存有效时间，在该时间段内，获取的地理位置信息还是设置此时间段之前的那次获得的信息，超过这段时间缓存的位置信息会被废弃
            }
          );
        } else {
          reject(null);
        }
      });
    }
  }
};
