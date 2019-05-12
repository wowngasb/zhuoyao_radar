let util = {};

util.j = o => JSON.parse(JSON.stringify(o));

util.getDefaultLocation = () => {
  return {
    longitude: 116.3579177856,
    latitude: 39.9610780334
  };
}

util.getStorage = key => {
  let _key = 'radar_ex_' + key;
  if (localStorage && localStorage[_key]) {
    return JSON.parse(localStorage[_key]);
  } else {
    return null;
  }
};

util.setStorage = (key, val) => {
  if (localStorage) {
    localStorage['radar_ex_' + key] = JSON.stringify(val);
  }
};

util.getDefaultSetting = () => {
  return {
    auto_extend: 1,
    fit_t1: [],  // 1觉
    fit_t2: [],  // 2觉
    fit_nest: [],  // 巢穴
    fit_rare: [2000106, 2000313, 2000327, 2000238, 2000265],  // 稀有
    fit_fish: [],  // 鲲鲲
    fit_feature: [],  // 地域
    fit_element: [],  // 元素
    fit_all: false,  // 所有
    auto_search: true
  };
}

util.utf8ByteToUnicodeStr = n => {
  for (var g = '', p = 0; p < n.length;) {
    var e = n[p],
      a = 0;
    e >>> 7 == 0
      ? ((g += String.fromCharCode(n[p])), (p += 1))
      : 252 == (252 & e)
        ? ((a = (3 & n[p]) << 30),
          (a |= (63 & n[p + 1]) << 24),
          (a |= (63 & n[p + 2]) << 18),
          (a |= (63 & n[p + 3]) << 12),
          (a |= (63 & n[p + 4]) << 6),
          (a |= 63 & n[p + 5]),
          (g += String.fromCharCode(a)),
          (p += 6))
        : 248 == (248 & e)
          ? ((a = (7 & n[p]) << 24),
            (a |= (63 & n[p + 1]) << 18),
            (a |= (63 & n[p + 2]) << 12),
            (a |= (63 & n[p + 3]) << 6),
            (a |= 63 & n[p + 4]),
            (g += String.fromCharCode(a)),
            (p += 5))
          : 240 == (240 & e)
            ? ((a = (15 & n[p]) << 18),
              (a |= (63 & n[p + 1]) << 12),
              (a |= (63 & n[p + 2]) << 6),
              (a |= 63 & n[p + 3]),
              (g += String.fromCharCode(a)),
              (p += 4))
            : 224 == (224 & e)
              ? ((a = (31 & n[p]) << 12),
                (a |= (63 & n[p + 1]) << 6),
                (a |= 63 & n[p + 2]),
                (g += String.fromCharCode(a)),
                (p += 3))
              : 192 == (192 & e)
                ? ((a = (63 & n[p]) << 6),
                  (a |= 63 & n[p + 1]),
                  (g += String.fromCharCode(a)),
                  (p += 2))
                : ((g += String.fromCharCode(n[p])), (p += 1));
  }
  return g;
};

util.convertLocation = n => parseInt(1e6 * n.toFixed(6));

util.json2buffer = n => {
  var r = util.str2buffer(JSON.stringify(n)),
    t = r.length,
    o = new ArrayBuffer(4);
  new DataView(o).setUint32(0, t);
  var s = new Uint8Array(4 + t);
  return s.set(new Uint8Array(o), 0), s.set(r, 4), s.buffer;
};

util.str2buffer = e => {
  var n = new ArrayBuffer(2 * e.length);
  var r = new Uint16Array(n);
  var o = e.length;
  for (var t = 0; t < o; t++) {
    r[t] = e.charCodeAt(t);
  }
  return r;
};

util.empty = obj => {
  if (obj && typeof obj == 'object') {
    var j_str = JSON.stringify(obj);
    return j_str == '{}' || j_str == '[]';
  }

  return !obj;
}

util.time = () => parseInt((new Date()).getTime() / 1000);

util.t2str = c => {
  c = Math.abs(parseInt(c));
  if (c <= 0) {
    return "00:00";
  }
  let s = c % 60;
  c = (c - s) / 60;
  let m = c % 60;
  let h = (c - m) / 60;
  let rst = h > 0 ? (h + ":") : "";
  rst += m >= 10 ? (m + ":") : ("0" + m + ":");
  rst += s >= 10 ? ("" + s) : ("0" + s);
  return rst;
};

export default util;
