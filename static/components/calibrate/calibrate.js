import shared from "../../utils/js/shared.js";
export default {
  name: "calibrate",
  template: `
  <div id="caliContainer">
    <div id="calibrate">
        <div class="calititle">偏移率设置</div>
        <div class="content">
            <div class="description">
                在每个第三拍(重拍)点击按钮<br>
                本结果仅供参考，不同输入方式(键盘/鼠标/触摸)的延迟可能会有所不同
            </div>
            <button id="clickBtn" @click="caliOnce()" :class="{disabled: actxStartTime===null}">点击</button>
            <div class="results">
                <div id="result1">-</div>
                <div id="result2">-</div>
                <div id="result3">-</div>
                <div id="result4">-</div>
            </div>
        </div>
        <div class="footer">
            <button id="startBtn" @click="caliStart()" :class="{disabled: (!audiobuffer)||(actxStartTime!==null)}">开始</button>
        </div>
    </div>
  </div>
  `,
  data() {
    return {
      audiobuffer: null,
      bfs: null,
      actxStartTime: null,
      calibrateActx: null,
      forceExit: null,
    };
  },
  mounted() {
    shared.game.msgHandler.sendMessage("正在加载校准音频...", "info", false);
    fetch("/static/src/core/calibrate.mp3")
      .then((t) => t.arrayBuffer())
      .then((t) => {
        shared.game.msgHandler.sendMessage("校准音频加载成功。");
        this.audiobuffer = t;
      })
      .catch(() => {
        shared.game.msgHandler.sendMessage("校准音频加载失败。", "error");
      });
  },
  beforeUnmount() {
    this.forceExit = true;
    if (this.bfs) this.bfs.stop();
    document.body.onkeydown = null;
  },
  methods: {
    caliOnce() {
      const e = this.calibrateActx.currentTime - this.actxStartTime;
      var r = 1;
      e > 0 && e <= 2 && (r = 1),
        e > 2 && e <= 4 && (r = 2),
        e > 4 && e <= 6 && (r = 3),
        e > 6 && e <= 8 && (r = 4);
      const cur = document.querySelector("#result" + r);
      cur && (cur.innerText = Math.round(1e3 * (e - (2 * r - 1))));
    },
    caliStart() {
      (this.calibrateActx = null),
        (window.oggCompatible = !!new Audio().canPlayType("audio/ogg")),
        (this.calibrateActx = new (
          window.oggCompatible
            ? window.AudioContext ||
              window.webkitAudioContext ||
              window.mozAudioContext ||
              window.msAudioContext
            : oggmented.OggmentedAudioContext
        )()),
        this.calibrateActx.decodeAudioData(
          this.audiobuffer,
          (t) => {
            (this.bfs = this.calibrateActx.createBufferSource()),
              (this.bfs.buffer = t),
              this.bfs.connect(this.calibrateActx.destination),
              (this.actxStartTime = this.calibrateActx.currentTime),
              this.bfs.start(0),
              (document.body.onkeydown = this.caliOnce),
              this.bfs.addEventListener("ended", async () => {
                if (this.forceExit) return;
                null == this.calibrateActx || this.calibrateActx.close(),
                  (this.calibrateActx = void 0),
                  (this.calibrateActx = null);
                const t = parseFloat(
                    document
                      .querySelector("#result1")
                      .innerText.replace("-", "-0")
                  ),
                  r = parseFloat(
                    document
                      .querySelector("#result2")
                      .innerText.replace("-", "-0")
                  ),
                  o = parseFloat(
                    document
                      .querySelector("#result3")
                      .innerText.replace("-", "-0")
                  ),
                  n = parseFloat(
                    document
                      .querySelector("#result4")
                      .innerText.replace("-", "-0")
                  ),
                  c = Math.round((t + r + o + n) / 4);
                if (
                  await shared.game.msgHandler.confirm(
                    `您要把延迟值设置为 ${c} 吗？`
                  )
                )
                  shared.game.ptmain.gameConfig.inputOffset = c.toString();
                shared.game.ptmain.$router.back();
              });
          },
          () => {
            shared.game.msgHandler.sendMessage(
              "错误：校准音频解码失败。",
              "error"
            );
          }
        );
    },
  },
};
