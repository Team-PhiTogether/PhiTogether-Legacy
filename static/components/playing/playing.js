import { recordMgr } from "../recordMgr/recordMgr.js?ver=1.3.2h8";
import shared from '../../utils/js/shared.js?ver=1.3.2h8';

export default {
    name: 'playing',
    template: `
    <div id="cacheManage" class="routerRealPage">
    <div class="cacheUnit" style="padding: 10px;" v-if="playFinished">
      <h3>导出游玩回放</h3>
      <div v-if="!downloadUrl">
        <p>游玩回放已生成，点击下方按钮导出游玩回放</p>
        <input type="button" value="导出" @click="exportRecord()"><br />
      </div>
      <div style="display: flex; width: 100%;" v-else>
        <img :src="qrcodesrc"></img>
        <div style="display: block; overflow-wrap: anywhere; text-align: left; margin-left: 1%;">
            <h3>链接已复制</h3>
            请在浏览器中粘贴打开 若未复制成功请手动输入: <br />
            {{ downloadUrl }}<br />
            <h4>也可扫描左侧二维码</h4>
        </div>
    </div>
    </div><br />
  </div>
    `,
    data() {
        return {
            playFinished: false,
            downloadUrl: false,
        }
    },
    computed: {
        qrcodesrc() {
            return this.downloadUrl ? "https://qrcode.realtvop.eu.org/?text=" + this.downloadUrl : null;
        }
    },
    mounted() {
        this.playFinished = false;
        recordMgr.reset();
        shared.game.finishToRecord = () => { this.playFinished = true };
        shared.game.restartClearRecord = () => { this.playFinished = this.downloadUrl = false; }
    },
    methods: {
        exportRecord() {
            // if (window.spec.isPhiTogetherApp && window.spec.isiOSDevice) return shared.game.msgHandler.sendMessage("iOS版PhiTogether App暂不支持导出游玩回放", 'error');
            const [data, original] = recordMgr.export();
            const q = new Blob([data], { type: "application/json" });
            if (window.spec.isPhiTogetherApp) {
                shared.game.msgHandler.sendMessage("正在生成下载链接(实验性功能)");
                const formData = new FormData();
                formData.append('text', data);
                formData.append('filename', encodeURI(`${original.chartInfo.songData.name}${original.chartInfo.chartData.level}${original.chartInfo.chartData.difficulty}-${original.playerInfo.username}-${new Date().format("YmdHis")}.ptr`));
                fetch("https://ud.realtvop.eu.org", {
                    method: 'POST',
                    body: formData
                }).then(response => response.text())
                    .then(downloadurl => {
                        this.downloadUrl = downloadurl;
                        // shared.game.msgHandler.info(`请在浏览器中粘贴打开 若未复制成功请手动输入: ${this.downloadUrl}`, "链接已复制");
                        if (navigator.clipboard) navigator.clipboard.writeText(this.downloadUrl);
                    })
                    .catch(function (err) {
                        shared.game.msgHandler.sendMessage(err, "error");
                        shared.game.msgHandler.sendMessage("生成下载链接失败,请重试", "error");
                        console.log(err);
                    })
            } else saveAs(q, `${original.chartInfo.songData.name}${original.chartInfo.chartData.level}${original.chartInfo.chartData.difficulty}-${original.playerInfo.username}-${new Date().format("YmdHis")}.ptr`);
        }
    },
};
