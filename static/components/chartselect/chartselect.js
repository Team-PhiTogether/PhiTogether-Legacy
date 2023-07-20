import shared from '../../utils/js/shared.js?ver=1.3.2h8';
import { renderPZApiFromCache } from '../cachemanage/cacheutils.js?ver=1.3.2h8';
export default {
  name: 'chartSelect',
  template: `
    <div>
      <div style="display:flex;justify-content: center;flex-direction:column;align-items:center;">
        <div class="songSearch" v-if="selectChoice !== 'custom'">
          <div style="right:10px">
          <div style="display: inline-block;">
            <a @click="toggleInput" style="display: inline-block; float: left;">
              <div v-if="!showMoreSearchQueryInput">▶</div>
              <div v-else>▼</div>
            </a>
            <input class="input" v-model="search.name" id="searchInput" placeholder="曲名" />
          </div>
          <div v-if="showMoreSearchQueryInput">
            <input class="input" v-model="search.composer" id="searchInput" placeholder="曲师" />
          </div>
          <div v-if="showMoreSearchQueryInput">
            <input class="input" v-model="search.illustrator" id="searchInput" placeholder="画师" />
          </div><br>
          </div>
          <div style="flex:1;"><input id="searchBtn" type="button" value="搜索" @click="doSearch()" /></div>
        </div><br>
        <div class="panelSwitcher">
            <div>
              <input type="radio" id="sc1" name="selectChoice" v-model="selectChoice" value="local">
              <label for="sc1">本地谱面</label>
            </div>
          
          <div v-if="!this.forceOffline">
            |&nbsp;&nbsp; 
            <input type="radio" id="sc0" name="selectChoice" v-model="selectChoice" value="pz">
            <label for="sc0">社区谱面</label>
          </div>
          <div v-if="!this.forceOffline">
            |&nbsp;&nbsp; 
            <input type="radio" id="sc2" name="selectChoice" v-model="selectChoice" value="favorite">
            <label for="sc2">社区收藏</label>
          </div>
          <div v-if="!this.forceOffline">
            |&nbsp;&nbsp; 
            <input type="radio" id="sc3" name="selectChoice" v-model="selectChoice" value="custom">
            <label for="sc3">PT社区谱面</label>
          </div>
        </div>
          <br />

        <input type="button" value="从本地文件添加" @click="$router.push('/chartUpload')" v-if="selectChoice==='local'" /><br />

        <div v-if="!chartList.results || chartList.results.length==0">谱面列表为空</div>
        <div id="chartListAll">
          <div
            class="scoreSongCard"
            v-for="chart in chartList.results"
            @click="goDetails(chart)"
          >
            <img :src="imgCompLink(chart.illustration.replace('res.phi.zone',selectChoice==='custom'?customChartServer:pzResUrlGlobal))" />
            <div class="songCardCover" :style="{lineHeight: '1.2em', '--bg':'url('+imgCompLink(chart.illustration.replace('res.phi.zone',selectChoice==='custom'?customChartServer:pzResUrlGlobal))+')'}">
              <div class="songCardName">{{chart.name}}</div>
              <br />
              <div class="songCardComposer">{{chart.composer}}</div>
            </div>
          </div>
        </div>
      </div>
      <div style="text-align:center;font-size:1.25em;color:midnightblue;line-height:1.2em;top:8px;">
        <a v-if="canPrev" @click="loadPrevPage()" style="color:black;"
        >◀</a
        >
        &nbsp;&nbsp;&nbsp;&nbsp;
        <a v-if="canNext" @click="loadNextPage()" style="color:black;"
          >▶</a
        ><br>
        <span @click="goJustPageAsk()">第{{page}}页  共{{pageAll}}页</span>
      </div>
    </div>
  `,
  data() {
    return {
      search: {
        name: '',
        composer: '',
        illustrator: '',
      },
      chartList: {},
      beforeSearch: [],
      beforePagination: [],
      page: 1,
      toPage: null,
      showMoreSearchQueryInput: false,
      selectChoice: 'local',
      forceOffline: false,
    };
  },
  computed: {
    canPrev() {
      if (['pz', 'favorite', 'costom'].includes(this.selectChoice)) return this.chartList.previous ? true : false;
      else if (this.selectChoice === 'local') return (this.page - 1 > 0);
    },
    canNext() {
      if (['pz', 'favorite', 'costom'].includes(this.selectChoice)) return this.chartList.next ? true : false;
      else if (this.selectChoice === 'local') return (this.page + 1 <= this.pageAll);
    },
    pzResUrlGlobal() {
      return window.spec.PZ_RES_URL_GLOBAL;
    },
    customChartServer() {
      return shared.game.ptmain.gameConfig.customChartServer;
    },
    pageAll() {
      try {
        if (['pz', 'favorite', 'costom', 'custom'].includes(this.selectChoice)) {
          const count = this.chartList.count;
          if (count) {
            return Math.ceil(count / 30);
          } else return 1;
        } else if (this.selectChoice === 'local') {
          const count = this.beforePagination.length;
          if (count) {
            return Math.ceil(count / 30);
          } else return 1;
        }
      } catch (e) {
        return 1;
      }
    },
  },
  async mounted() {
    if (this.$route.query.offline == 1) {
      this.forceOffline = true;
    }
    this.loadOffline();
  },
  activated() {
    if (!navigator.onLine) (this.forceOffline = true), this.loadOffline();
    if (this.selectChoice === 'local') this.loadOffline();
  },
  deactivated() {
    shared.game.loadHandler.r();
  },
  methods: {
    async goJustPageAsk() {
      const res = await shared.game.msgHandler.prompt(`请输入您要跳转的页码 (1 - ${this.pageAll})`);
      if (res) this.goJustPage(res);
    },
    goJustPage(i) {
      if (!(i >= 1 && i <= this.pageAll)) {
        shared.game.msgHandler.sendMessage('您的输入不合法', 'error');
        return;
      }
      if (['pz', 'favorite', 'costom'].includes(this.selectChoice)) {
        let link = this.chartList.previous || this.chartList.next || null;
        if (!link) return;
        link = link.replace(/page=\d+&?/, '') + `&page=${i}`;
        this.toPage = i;
        this.loadPage(link);
      } else if (this.selectChoice === 'local') {
        this.page = i;
        this.updatePagination();
      }
    },
    loadPrevPage() {
      if (['pz', 'favorite', 'costom'].includes(this.selectChoice)) this.loadPage(this.chartList.previous);
      else if (this.selectChoice === 'local') {
        this.page = this.page - 1;
        this.updatePagination();
      }
    },
    loadNextPage() {
      if (['pz', 'favorite', 'costom'].includes(this.selectChoice)) this.loadPage(this.chartList.next);
      else if (this.selectChoice === 'local') {
        this.page = this.page + 1;
        this.updatePagination();
      }
    },
    updatePagination() {
      if (this.page < 1) this.page = 1;
      if (this.page > this.pageAll) this.page = this.pageAll;
      this.chartList = {
        results: this.beforePagination ? this.beforePagination.slice(30 * this.page - 30, 30 * this.page) : [],
      };
    },
    async loadOffline(additionKey = '') {
      if (this.forceOffline && this.selectChoice !== "custom") this.selectChoice = 'local';
      let results = await renderPZApiFromCache(additionKey);
      let newlist = [];
      for (const t of results) {
        if (t.song && t.illustration && t.charts) newlist.push(t);
      }
      this.beforeSearch = newlist;
      this.beforePagination = this.beforeSearch;
      this.updatePagination();
    },
    goDetails(para) {
      sessionStorage.setItem('chartDetailsData', JSON.stringify(para));
      this.$router.push({ path: '/chartDetails' });
    },
    doSearch() {
      if (this.selectChoice === 'pz') {
        this.loadPage(
          "https://api.phi.zone" + `/songs/?query_charts=1&query_levels=1${this.search.name ? '&name=' + this.search.name : ''
          }${this.search.composer ? '&composer=' + this.search.composer : ''}${this.search.illustrtor ? '&illustrtor=' + this.search.illustrtor : ''
          }`,
          true
        );
      } else if (this.selectChoice === 'local') {
        this.beforePagination = this.beforeSearch.filter((x) => {
          return x.name.includes(this.search.name) && x.composer.includes(this.search.composer) && x.illustrator.includes(this.search.illustrator);
        });
        this.page = 1;
        this.updatePagination();
      } else if (this.selectChoice === 'favorite') {
        this.loadPage(
          "https://api.phi.zone" + `/songs/?query_charts=1&query_levels=1&id=${this.generateFavoriteList()}${this.search.name ? '&name=' + this.search.name : ''
          }${this.search.composer ? '&composer=' + this.search.composer : ''}${this.search.illustrtor ? '&illustrtor=' + this.search.illustrtor : ''
          }`,
          true
        );
      } else if (this.selectChoice === 'custom') {
        this.loadPage(
          "https://" + this.customChartServer + `/songs.json?query_charts=1&query_levels=1${this.search.name ? '&name=' + this.search.name : ''
          }${this.search.composer ? '&composer=' + this.search.composer : ''}${this.search.illustrtor ? '&illustrtor=' + this.search.illustrtor : ''
          }`,
          true
        );
      }
    },
    async loadPage(url, renew = false) {
      shared.game.loadHandler.l('正在加载谱面列表');
      if (renew) this.page = 1;
      try {
        let myHeaders = new Headers();
        myHeaders.append('User-Agent', 'PhiZoneRegularAccess');
        const chartList = await (
          await fetch(url.replace(/https?:\/\/api.phi.zone/, "https://api.phi.zone"), { headers: myHeaders })
        ).json();
        if (this.selectChoice === 'custom') chartList.results.forEach(item => item.id = `${this.customChartServer}|$|${item.id}`);
        if (this.chartList.previous && url == this.chartList.previous)
          this.page--;
        if (this.chartList.next && url == this.chartList.next) this.page++;
        if (this.toPage) (this.page = this.toPage), (this.toPage = null);
        this.chartList = chartList;
        document.querySelector('#app').scrollTop = 0;
        shared.game.loadHandler.r();
      } catch {
        shared.game.msgHandler.sendMessage('加载失败', 'error'),
          shared.game.loadHandler.r();
        return;
      }
    },
    imgCompLink(a) {
      if (this.selectChoice !== 'pz' || a.includes('PTVirtual') || this.selectChoice === "custom") return a;
      return a.replace(/(\.png|\.jpe?g|\.webp)$/i, '') + '.comp.webp';
    },
    toggleInput() {
      this.showMoreSearchQueryInput = !this.showMoreSearchQueryInput;
    },
    generateFavoriteList() {

      let favourites = localStorage.getItem("favourites");
      if (!favourites) return "0"
      else {
        let output = "";
        favourites = JSON.parse(favourites);
        for (let i of favourites) {
          output = `${output}${favourites.indexOf(i) === 0 ? "" : ","}${i}`;
        }
        return output
      }

    }
  },
  watch: {
    selectChoice: {
      handler(newVal, oldVal) {
        if (newVal === 'pz') {
          this.loadPage(
            "https://api.phi.zone" + '/songs/?query_charts=1&query_levels=1',
            true
          );
        } else if (newVal === 'local') {
          this.loadOffline();
        } else if (newVal === 'favorite') {
          this.loadPage(
            "https://api.phi.zone" + `/songs/?query_charts=1&query_levels=1&id=${this.generateFavoriteList()}`,
            true
          );
        } else if (newVal === 'custom') {
          this.loadPage(
            "https://" + (this.customChartServer.includes("yri") ? this.customChartServer : "chart.phitogether.fun") + `/songs.json`,
            true);
        }
      }
    }
  }
};
