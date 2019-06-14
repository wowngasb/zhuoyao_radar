import util from "@/libs/util";

import tempdata from '@/libs/tempdata';

export const SETTINGS = 'settings';
export const LOCATION = 'location';
export const USER_LOCATION = 'userLocation'

let sprite_map = {};
(tempdata.Data || []).forEach(item => {
    if (item.Id) {
        sprite_map[item.Id] = item;
    }
});

export const getYaolingById = id => {
    return sprite_map[id] || {};
};

export const getHeadImagePath = id => {
    var data = getYaolingById(id);
    if (data) {
      return `./original/image/head/${data.ImgName}.png`;
    } else {
      return "./original/image/default-head.png";
    }
  }

export const SPRITE_MAP = sprite_map;

export const CUR_YAOLING_VERSION = 'sprite_18b3306a1d7dda37b41d2d458e00a0a8.json'; // 妖灵数据库版本，如果与官方版本不一致，需要手动更新
export const APP_VERSION = 'v0.9.0614'; // 版本
export const API_KEY = '2LWBZ-FEQK6-KKYS2-M6WR4-PFGS5-RZBP3'; // 地图 api key

export const FILTER = {
    FILTER_RARE: [
        2000106, // 风雪虎
        2000313, // 银角小妖
        2000327, // 小蝙蝠
        2000265, // 香玉
        2000238, // 颜如玉
        2000109, // 螺莉莉
        2000078, // 布鲁
        2000191, // 麻将仔
        2000242, // 夜行枭
        2000028, //小蝌蚪
        2000419 //花火羊
    ],
    FILTER_NEST: [
        2000321, // 木偶娃娃
        2000324, // 瓷偶娃娃
        2000112, // 雷童子
        2000413, //兜兜犴
        2000416, //淘奇蛇
    ],
    FILTER_FEATURE: [
        2004013, // 暴走小龙虾
        2004016, // 素包
        2004010, // 舞狮
        2004007, // 貂宝
        2004004, // 小白蛇
        2000206 // 麻辣小火锅
    ],
    FILTER_FISH: [
        2000501, // 咸鱼
        2000502, // 多鱼
        2000504, // 摸鱼
        2000519 // 大若智鱼
    ],
    FILTER_ELEMENT: [
        2000511, // 金元宝宝
        2000512, // 木元宝宝
        2000513, // 水元宝宝
        2000514, // 火元宝宝
        2000515 // 土元宝宝
    ],
    FILTER_T1: tempdata.Data.filter(item => {
        return item.Level === 2;
    }).map(item => {
        return item.Id;
    }),
    FILTER_T2: tempdata.Data.filter(item => {
        return item.Level === 3;
    }).map(item => {
        return item.Id;
    })
};

export const FILTER_DATA = [
    ["fit_rare", "稀有", FILTER.FILTER_RARE],
    ["fit_nest", "巢穴", FILTER.FILTER_NEST],
    ["fit_feature", "地域", FILTER.FILTER_FEATURE],
    ["fit_element", "元素", FILTER.FILTER_ELEMENT],
    ["fit_fish", "鲲鲲", FILTER.FILTER_FISH],
    ["fit_t1", "1觉", FILTER.FILTER_T1],
    ["fit_t2", "2觉", FILTER.FILTER_T2]
  ];

export const SOCKET = {
    RECONNECT_TIME: 1000, // 断线重连时间
    URL: 'wss://publicld.gwgo.qq.com?account_value=0&account_type=0&appid=0&token=0' // 官方妖灵查询接口
};