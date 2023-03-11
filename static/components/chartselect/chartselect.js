import shared from "../../utils/js/shared.js";
import { renderPZApiFromCache } from "../cachemanage/cacheutils.js";
export default {
  name: "chartSelect",
  template: `
    <div>
      <div style="display:flex;justify-content: center;flex-direction:column;align-items:center;">
        <div class="songSearch" v-if="!offline">
          <div style="right:10px">
          <div>
            <input class="input" v-model="search.name" id="searchInput" placeholder="曲名" />
          </div>
          <div>
            <input class="input" v-model="search.composer" id="searchInput" placeholder="曲师" />
          </div>
          <div>
            <input class="input" v-model="search.illustrator" id="searchInput" placeholder="画师" />
          </div><br>
          </div>
          <!--
          <div>
            最短时长：<input
              class="input"
              v-model="search.lowest_duration"
              placeholder="单位：秒"
              id="searchInput"
            />
          </div>
          <div>
            最长时长：<input
              class="input"
              v-model="search.highest_duration"
              placeholder="单位：秒"
              id="searchInput"
            />
          </div>
          -->
          <div style="flex:1;"><input id="searchBtn" type="button" value="搜索" @click="doSearch()" /></div>
        </div><br>
        <div v-if="!chartList.results || chartList.results.length==0">谱面列表为空</div>
        <div id="chartListAll">
          <div
            class="scoreSongCard"
            v-for="chart in chartList.results"
            @click="goDetails(chart)"
          >
            <img :src="imgCompLink(chart.illustration)" />
            <div class="songCardCover" :style="{lineHeight: '1.2em', '--bg':'url('+imgCompLink(chart.illustration)+')'}">
              <div class="songCardName">{{chart.name}}</div>
              <br />
              <div class="songCardComposer">{{chart.composer}}</div>
            </div>
          </div>
        </div>
      </div>
      <div style="text-align:center;font-size:1.25em;color:midnightblue;line-height:1.2em;top:8px;" v-if="!offline">
        <a v-if="chartList.previous" @click="loadPage(chartList.previous)" style="color:black;"
        >◀</a
        >
        &nbsp;&nbsp;&nbsp;&nbsp;
        <a v-if="chartList.next" @click="loadPage(chartList.next)" style="color:black;"
          >▶</a
        ><br>
        第{{page}}页  共{{pageAll}}页
      </div>
    </div>
  `,
  data() {
    return {
      search: {
        name: "",
        composer: "",
        illustrator: "",
        lowest_duration: "",
        highest_duration: "",
      },
      chartList: {},
      page: 1,
      offline: false,
    };
  },
  computed: {
    pageAll() {
      const count = this.chartList.count;
      const l = this.chartList.results && this.chartList.results.length;
      if (count && l) {
        return Math.ceil(count / 30);
      } else return 1;
    },
  },
  async mounted() {
    if (this.$route.query.offline == 1) {
	    this.loadOffline();
            return;
    }
    this.loadPage(
      "https://api.phi.zone/songs/?query_charts=1&query_levels=1",
      true
    );
  },
	activated() {
	if(!navigator.onLine)this.loadOffline();
	},
  deactivated() {
    shared.game.loadHandler.r();
  },
  methods: {
    async loadOffline() {
this.offline = true;
      let results = await renderPZApiFromCache();
      let newlist = [];
      for (const t of results) {
        if (t.song && t.illustration && t.charts) newlist.push(t);
      }
      this.chartList = {
        results: newlist,
      };

    },
    goDetails(para) {
      sessionStorage.setItem("chartDetailsData", JSON.stringify(para));
      this.$router.push({ path: "/chartDetails" });
    },
    doSearch() {
      this.loadPage(
        `https://api.phi.zone/songs/?query_charts=1&query_levels=1${
          this.search.name ? "&name=" + this.search.name : ""
        }${this.search.composer ? "&composer=" + this.search.composer : ""}${
          this.search.illustrtor ? "&illustrtor=" + this.search.illustrtor : ""
        }${
          this.search.lowest_duration
            ? "&lowest_duration=" + this.search.lowest_duration
            : ""
        }${
          this.search.highest_duration
            ? "&highest_duration=" + this.search.highest_duration
            : ""
        }`,
        true
      );
    },
    async loadPage(url, renew = false) {
      shared.game.loadHandler.l("正在加载谱面列表");
      if (renew) this.page = 1;
      try {
        var myHeaders = new Headers();
        myHeaders.append("User-Agent", "PhiZoneRegularAccess");
        const chartList = await (
          await fetch(url, { headers: myHeaders })
        ).json();
        if (this.chartList.previous && url == this.chartList.previous)
          this.page--;
        if (this.chartList.next && url == this.chartList.next) this.page++;
        this.chartList = chartList;
        document.querySelector("#app").scrollTop=0;
        shared.game.loadHandler.r();
      } catch {
        shared.game.msgHandler.sendMessage("加载失败", "error"),
          shared.game.loadHandler.r();
        return;
      }
    },
    imgCompLink(a) {
      if (this.offline) return a;
      return a.replace(/(\.png|\.jpe?g|\.webp)$/i, "") + ".comp.webp";
    },
  },
};
