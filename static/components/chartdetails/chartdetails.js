import shared from "../../utils/js/shared.js";
import { audio } from "../../utils/js/aup.js";
export default {
  name: "chartDetails",
  template: `
    <div style="margin-top:2em;" id="chartDetails" v-if="data">
        <div id="chartDetailsHeader">
            <div class="scoreSongCard" style="margin-left:5%;margin-right:5%;">
                <img :src="data.illustration">
                <div class="songCardCover" :style="{'--bg':'url('+data.illustration+')'}">
                    <div class="songCardName">
                        {{data.name}}
                    </div>
                </div>
            </div>
            <div id="chartSongDetails">
                <div id="songEdition">版本：{{data.edition}}</div>
                <div id="songComposer">曲师：{{data.composer}}</div>
                <div id="songIllustrator">曲绘：{{data.illustrator}}</div>
                <div id="songBPM">BPM：{{data.bpm}}</div>
                <div id="songDuration">时长：{{data.duration}}</div>
            </div>
        </div>

        <div v-if="toSyncOrPlay!==0" style="display:block;">
        <br>
        <div v-if="toSyncOrPlay!==0">谱面：{{ct.level}} {{ct.difficulty}} {{ct.ranked?'Ranked':''}}</div>
        <div v-if="toSyncOrPlay!==0">谱师：{{cleanStr(ct.charter)}}</div>
          <input type="button" v-if="toSyncOrPlay===1" @click="playChart()" value="播放">
          <input type="button" v-if="toSyncOrPlay===2" @click="multiSyncChart()" value="同步">
          <span id="multiLoadingMsg" v-if="toSyncOrPlay===3">正在等待所有人完成加载...</span>
          <br />
        </div>
        <br style="line-height:2em;">
        <div id="chartDetailsCharts" v-if="toSyncOrPlay===0" 
        style="
          background-color:rgb(212, 239, 255);
          border-radius:10px;
          margin-left:5%;
          margin-right:5%;
          box-shadow: 0px 0px 25px 10px #79b3ff4d;">
        <br>
            <h1>谱面列表</h1>
            <div v-if="data.charts.length">
                <div class="chartListChartItem">
                    <div class="level">等级</div>
                    <div class="charter">谱师</div>
                    <div class="notes">物量</div>
                    <div class="rating">评分/喜欢</div>
                    <div class="play">操作</div>
                </div>
                <div class="chartListChartItem" v-for="chart in data.charts">
                    <div class="level">{{chart.level}} {{chart.difficulty}} {{chart.ranked?'Ranked':''}}</div>
                    <div class="charter">{{cleanStr(chart.charter)}}</div>
                    <div class="notes">{{chart.notes}}</div>
                    <div class="rating" v-if="'rating' in chart">{{chart.rating.toFixed(1)}}/{{chart.like_count}}</div>
                    <div class="rating" v-else>不可用</div>
                    <div class="play"><input type="button" @click="loadChart(chart)" value="选择" ></div>
                </div>
            </div>
            <div v-else style="text-align:center;">该歌曲暂无可游玩谱面！</div>
            <br>
        </div>
    </div>
    `,
  data() {
    return {
      data: null,
      toSyncOrPlay: 0,
      ct: null,
      previewAbortController: null,
    };
  },
  activated() {
    audio.stop();
    const oriData = sessionStorage.getItem("chartDetailsData");
    if (!oriData) return;
    const params = JSON.parse(oriData);
    this.data = params;
    if (this.$route.query.toSyncOrPlay && this.$route.query.toSyncOrPlay == 3) {
      const ct = JSON.parse(sessionStorage.getItem("loadedChart"));
      this.ct = ct;
      this.toSyncOrPlay = 3;
      this.previewAbortController = null;
      return;
    }
    //if(this.toSyncOrPlay!==0) document.getElementById("gameAdjust").style.display="block";
    this.toSyncOrPlay = 0;
    this.ct = null;
    this.previewAbortController = new AbortController();
    const songLink =
      params.song +
      `?type=song&id=${encodeURIComponent(params.id)}&name=${encodeURIComponent(
        params.name
      )}&edition=${encodeURIComponent(
        params.edition
      )}&composer=${encodeURIComponent(
        params.composer
      )}&illustrator=${encodeURIComponent(
        params.illustrator
      )}&bpm=${encodeURIComponent(params.bpm)}&duration=${encodeURIComponent(
        params.duration
      )}&preview_start=${encodeURIComponent(params.preview_start)}`;
    shared.game.msgHandler.sendMessage("正在加载音频预览...", "info", false);
    fetch(songLink, { signal: this.previewAbortController.signal })
      .then(async (e) => {
        const buffer = await e.arrayBuffer();
        const bfs = await audio.decode(buffer);
        audio.play(bfs, {
          loop: true,
          offset: this.toSecond(params.preview_start),
        });
        shared.game.msgHandler.sendMessage("正在播放音频预览...");
        this.previewAbortController = null;
      })
      .catch((e) => {
        if (this.previewAbortController)
          shared.game.msgHandler.sendMessage("音频预览加载失败。", "error");
      });
  },
  deactivated() {
    if (this.previewAbortController) {
      const ctrl = this.previewAbortController;
      this.previewAbortController = null;
      ctrl.abort();
    }
    audio.stop();
  },
  methods: {
    toSecond(str) {
      try {
        const d = str.split(":");
        return d[0] * 3600 + d[1] * 60 + d[2] * 1;
      } catch (e) {
        return 0;
      }
    },
    cleanStr(i) {
      return i.replace(
        new RegExp(
          [
            ...i.matchAll(
              new RegExp(
                `\\[PZ([A-Za-z]+):([0-9]+):((?:(?!:PZRT\]).)*):PZRT\\]`,
                "g"
              )
            ),
          ].length === 0
            ? `\\[PZ([A-Za-z]+):([0-9]+):([^\\]]+)\\]` // legacy support
            : `\\[PZ([A-Za-z]+):([0-9]+):((?:(?!:PZRT\]).)*):PZRT\\]`,
          "gi"
        ),
        "$3"
      );
    },
    async multiSyncChart() {
      try {
        shared.game.loadHandler.l("正在同步谱面", "syncChart");
        await shared.game.multiInstance.syncChart(this.data, this.ct);
        this.toSyncOrPlay = 3;
      } catch (e) {
        shared.game.loadHandler.r("syncChart");
        shared.game.msgHandler.sendMessage("同步谱面失败", "error");
      }
    },
    async loadChart(ct) {
      if (!ct.chart) {
        shared.game.msgHandler.failure(
          "抱歉，由于版权原因，您无法选择本谱面，请更换其它谱面游玩！"
        );
        return;
      }
      if (
        !(await shared.game.msgHandler.confirm(
          `您确定要选定 ${this.data.name} ${ct.level} ${ct.difficulty} 吗？`
        ))
      )
        return;
      if (this.previewAbortController)
        this.previewAbortController.abort(),
          (this.previewAbortController = null);
      this.ct = ct;
      if (shared.game.ptmain.gameMode === "multi") {
        audio.stop();
        this.toSyncOrPlay = 2;
        document.getElementById("gameAdjust").style.display = "block";
        shared.game.msgHandler.sendMessage(
          "您可以在调节谱面变速等参数，调节完后请点击【同步】按钮来同步谱面！"
        );
        return;
      }
      shared.game.loadHandler.l("正在加载谱面", "loadChart");
      shared.game.ptmain.loadChart(this.data, ct, this.chartLoaded);
    },
    chartLoaded(songInfo, chartInfo) {
      this.toSyncOrPlay = 1;
      shared.game.loadHandler.r("loadChart");
      audio.stop();
      document.getElementById("gameAdjust").style.display = "block";
    },
    async playChart() {
      shared.game.ptmain.playChart();
    },
  },
};
