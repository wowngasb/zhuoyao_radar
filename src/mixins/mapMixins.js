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
