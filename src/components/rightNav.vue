<template>
  <div>
    <div class="burger-wrap">
      <div :class="['nav-burger', showMenu ? 'active' : '']">
        <button class="menu-toggle" @click.prevent="toggleMenu">Menu</button>
      </div>
    </div>
    <transition name="black">
      <div class="black-screen" v-show="showMenu" @click.prevent="closeMenu"></div>
    </transition>
    <transition name="side">
      <div class="side-nav" v-show="showMenu">
        <div class="side-header">
          <h2>捉妖雷达 - Web</h2>
          <p>Version: {{ version }}</p>
        </div>
        <div class="side-content">
          <div class="header">筛选</div>

          <div style="margin-left: 20px;margin-top: 5px;">
            <el-radio v-model="fit_all" label="custom">自定义</el-radio>
            <el-radio v-model="fit_all" label="all">全部</el-radio>
          </div>

          <el-collapse v-show="fit_all == 'custom'" accordion>
            <el-collapse-item v-for="item in fitList" :key="item.key">
              <span
                slot="title"
                style="margin-left: 20px;margin-top: 5px;"
              >{{ item.title }}， 已选择 {{ item.value.length }}</span>
              <el-checkbox
                style="margin-left: 20px;margin-top: 5px;"
                :indeterminate="item.isIndeterminate"
                :value="item.checkAll"
                @change="handleCheckAllChange($event, item)"
              >全选</el-checkbox>

              <el-checkbox-group style="margin-left: 30px;margin-top: 5px;" :value="item.value">
                <el-checkbox
                  v-for="sprite in item.data"
                  :label="sprite.Id"
                  :key="sprite.Id"
                  @change="handleCheckedItemChange($event, item, sprite)"
                >{{sprite.Name}}</el-checkbox>
              </el-checkbox-group>
            </el-collapse-item>
          </el-collapse>

          <div class="hr"></div>
          <div class="header">设置</div>
          <ul>
            <li>
              <span class="tag">点击自动搜索</span>
              <el-switch v-model="settings.auto_search"></el-switch>
            </li>
            <li>
              <span class="tag">自动搜索范围</span>
              <el-input-number
                size="mini"
                v-model="settings.auto_extend"
                @change="handleNumChange"
                :min="1"
                :max="20"
                label="自动搜索范围"
              ></el-input-number>
            </li>
          </ul>
        </div>
      </div>
    </transition>
  </div>
</template>
<script>
import Vuex from "vuex";

import util from "@/libs/util";
import * as types from "@/types";

export default {
  name: "radar-right-nav",
  props: {
    version: {
      type: String,
      default: ""
    },
    currVersion: {
      type: String,
      default: ""
    }
  },
  data() {
    return {
      showMenu: false
    };
  },
  computed: {
    ...Vuex.mapState(["hasSettings", "settings"]),
    fitList() {
      return types.FILTER_DATA.map(item => {
        var data = (item[2] || [])
          .map(id => {
            return types.SPRITE_MAP[id];
          })
          .filter(item => item);
        var value = this.settings[item[0]] || [];
        return {
          key: item[0],
          title: item[1],
          checkAll: value.length > 0 && value.length == data.length,
          isIndeterminate: value.length > 0 && value.length < data.length,
          value: value,
          data: data
        };
      }).filter(item => (item.data || []).length);
    },
    fit_all: {
      get() {
        return this.settings.fit_all ? "all" : "custom";
      },
      set(val) {
        this.settings.fit_all = val == "all";
      }
    }
  },
  mounted() {
    if (!this.hasSettings) {
      this.openMenu();
    }
  },
  methods: {
    handleCheckAllChange(val, item) {
      var key = item.key;
      if (val) {
        this.$store.commit(types.SETTINGS, {
          settings: {
            [item.key]: item.data.map(item => item.Id)
          }
        });
      } else {
        this.$store.commit(types.SETTINGS, {
          settings: {
            [item.key]: []
          }
        });
      }
    },
    handleCheckedItemChange(val, item, sprite) {
      console.log("handleCheckedItemChange", val, item);

      var id = sprite.Id;
      var list = [...(this.settings[item.key] || [])];
      var idx = list.findIndex(i => i == id);
      if (val) {
        idx < 0 && list.push(id);
        this.$store.commit(types.SETTINGS, {
          settings: {
            [item.key]: list
          }
        });
      } else {
        idx >= 0 && list.splice(idx, 1);
        this.$store.commit(types.SETTINGS, {
          settings: {
            [item.key]: list
          }
        });
      }
    },
    handleNumChange() {
      this.$store.commit(types.SETTINGS, { settings: this.settings });
    },
    toggleMenu() {
      this.showMenu ? this.closeMenu() : this.openMenu();
    },
    openMenu() {
      this.showMenu = true;
    },
    closeMenu() {
      this.showMenu = false;
      this.$store.commit(types.SETTINGS, { settings: this.settings });
    }
  }
};
</script>
<style lang="less">
.side-content {
  .header {
    font-size: 18px;
    padding-left: 10px;
    padding-top: 5px;
  }
}
</style>