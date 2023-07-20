import shared from '../../utils/js/shared.js?ver=1.3.2h8';
import { changeUserChartURL } from "../cachemanage/cacheutils.js?ver=1.3.2h8";
const html = (e) => e[0];
export default {
  name: 'userChartEdit',
  data() {
    return {
      songData: {
        composer: "",
        name: "",
        illustrator: "",
      },
      chartData: {
        charter: "",
        level: "",
        difficulty: "",
      }
    };
  },
  template: html`
    <div id="userChartEdit" class="routerRealPage">
      <h1 class="userChartEditRow" style="font-size:2em;">修改谱面信息</h1>
      <div class="userChartEditRow">
        曲名：<input
          class="input"
          style="width:calc(100%/2);"
          v-model="songData.name"
        />
      </div>
      <div class="userChartEditRow">
        曲师：<input
          class="input"
          style="width:calc(100%/2);"
          v-model="songData.composer"
        />
      </div>
      <div class="userChartEditRow">
      画师：<input
          class="input"
          style="width:calc(100%/2);"
          v-model="songData.illustrator"
        />
      </div>
      <div class="userChartEditRow">
        谱师：<input
          class="input"
          style="width:calc(100%/2);"
          v-model="chartData.charter"
        />
      </div>
      <div class="userChartEditRow">
        等级：<input
          class="input"
          style="width:calc(100%/6);"
          v-model="chartData.level"
        />
        定数：<input
          class="input"
          style="width:calc(100%/6);"
          v-model="chartData.difficulty"
        />
      </div>
      <div class="userChartEditRow">
        <input
          type="button"
          style="width:auto;font-size:1.5em;"
          value="保存"
          @click="save()"
        />
      </div>
    </div>
  `,
  mounted() {
    this.songData = JSON.parse(sessionStorage.getItem("chartDetailsData"));
    this.chartData = this.songData.charts[0];
  },
  methods: {
    async save() {
      if (
        !this.songData.composer ||
        !this.songData.name ||
        !this.songData.illustrator ||
        !this.chartData.charter ||
        !this.chartData.level ||
        !this.chartData.difficulty
      ) if (await shared.game.msgHandler.confirm("您未填写完所有信息，要将未填写信息全部使用“unknown”代替吗？")) {
        this.songData.composer = this.songData.composer || "unknown";
        this.songData.name = this.songData.name || "unknown";
        this.songData.illustrator = this.songData.illustrator || "unknown";
        this.chartData.charter = this.chartData.charter || "unknown";
        this.chartData.level = this.chartData.level || "SP";
        this.chartData.difficulty = this.chartData.difficulty || "?";
      } else return;
      const md5 = this.songData.id;
      const chartURL = `/PTVirtual/charts/${md5}/chart.json?type=chart&id=${md5}&for=${md5}&level=${encodeURIComponent(
        this.chartData.level
      )}&difficulty=${encodeURIComponent(
        this.chartData.difficulty
      )}&charter=${encodeURIComponent(
        this.chartData.charter
      )}&notes=${encodeURIComponent('不可用')}`

      const songURL = `/PTVirtual/charts/${md5}/audio.mp3?type=song&id=${md5}&name=${encodeURIComponent(
        this.songData.name
      )}&edition=${encodeURIComponent(
        '用户上传'
      )}&composer=${encodeURIComponent(
        this.songData.composer
      )}&illustrator=${encodeURIComponent(
        this.songData.illustrator
      )}&bpm=${encodeURIComponent(
        '不可用'
      )}&duration=${encodeURIComponent(
        '不可用'
      )}&preview_start=${encodeURIComponent('00:00:00')}`;

      try {
        await changeUserChartURL(this.chartData.chart, chartURL);
        await changeUserChartURL(this.songData.song, songURL);
        shared.game.msgHandler.sendMessage("修改成功");
        this.songData.charts[0] = this.chartData;
        sessionStorage.setItem("chartDetailsData", JSON.stringify(this.songData));
        this.$router.back();
      } catch (e) {
        shared.game.msgHandler.sendMessage("修改出错", "error");
      }
    },
  },
};
