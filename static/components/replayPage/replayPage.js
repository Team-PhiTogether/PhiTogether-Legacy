import shared from "../../utils/js/shared.js?ver=1.3.2h8";
export default {
  name: "replayPage",
  template: `
  <div id="cacheManage" class="routerRealPage">
    <div class="cacheUnit" style="padding: 10px;">
      <h3>播放游玩回放</h3>
      <p>请在下方选择您要播放的游玩回放文件。请注意，若该谱面为本地谱面，则该回放对应的本地谱面必须在您的谱面库中。</p><br />
      回放文件：<input name="recordFile" type="file" id="recordFile"><br /><br />
      <input type="button" id="add_library" :class="{disabled: !recordFile}" value="播放" @click="playRecord()">
    </div>  
  </div>
    `,
  data() {
    return {
      recordFile: null,
    };
  },
  async mounted() {
    const extra = $id('recordFile');
    const _this = this;
    extra.onchange = () => {
      const i = extra.files[0];
      const reader = new FileReader();
      reader.readAsText(i);
      reader.onload = (evt) => {
        _this.recordFile = evt.target.result;
      }
    }
  },
  methods: {
    playRecord() {
      shared.game.replayMgr.read(this.recordFile);
    }
  },
};

const $id = (e) => document.getElementById(e);
