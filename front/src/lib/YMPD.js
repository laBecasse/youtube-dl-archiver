export default class YMPD {
  constructor(ympdUrl) {
    this.wsUrl = YMPD.get_appropriate_ws_url(ympdUrl)
    this.socket = undefined
  }

  connect() {
    return new Promise((resolve, reject) => {
      if (typeof MozWebSocket != "undefined") {
        this.socket = new MozWebSocket(this.wsUrl);
      } else {
        this.socket = new WebSocket(this.wsUrl);
      }

      this.socket.onerror = reject

      this.socket.onclose = reject

      // this.socket.addEventListener('message', console.log)
      
      this.socket.onopen = function() {
        // console.log('connected')
        resolve()
      }
    })
  }

  add(streamUrl) {
    return new Promise((resolve, reject) => {
      const t = this
      this.socket.addEventListener('message', () => {
        t.socket.removeEventListener('message', this)
        resolve()
      })

      this.socket.send('MPD_API_ADD_TRACK,'+ streamUrl);
    })
  }
  
  static get_appropriate_ws_url(u) {
    var pcol;
    /*
      /* We open the websocket encrypted if this page came on an
      /* https:// url itself, otherwise unencrypted
      /*/

    if (u.substring(0, 5) == "https") {
      pcol = "wss://";
      u = u.substr(8);
    } else {
      pcol = "ws://";
      if (u.substring(0, 4) == "http")
        u = u.substr(7);
    }

    u = u.split('#');

    return pcol + u[0] + "/ws";
  }
}

