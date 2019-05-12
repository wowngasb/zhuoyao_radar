import util from "@/libs/util";
import * as types from "@/types";

class RadarWebSocket {
  constructor(
    opts = {
      onopen: () => {},
      onmessage: () => {}
    }
  ) {
    this.opts = opts;
    this.initSocket();
    return this;
  }
  // 初始化
  initSocket() {
    this.socket = new WebSocket(types.SOCKET.URL);

    // 断线重连
    this.socket.onerror = this.socket.onclose = () => {
      setTimeout(() => {
        console.log('websocket reconnect...');
        this.initSocket();
      }, types.SOCKET.RECONNECT_TIME);
    };

    this.socket.onopen = this.opts.onopen;
    this.socket.onmessage = this.opts.onmessage;
  }
  send(msg) {
    this.socket && this.socket.send(msg);
  }
}

export default RadarWebSocket;
