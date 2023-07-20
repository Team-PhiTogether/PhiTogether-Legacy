import shared from '../../utils/js/shared.js?ver=1.3.2h8';
import phizoneApi from '../../utils/js/phizoneApi.js?ver=1.3.2h8';

const $ = (query) => document.getElementById(query);
const $$ = (query) => document.body.querySelector(query);
const $$$ = (query) => document.body.querySelectorAll(query);


export default {
  name: 'pzRankSingle',
  template: `
	<div v-if="loaded">
	<div id="chartDetailsHeader">
            <div class="scoreSongCard" style="margin-left:5%;margin-right:5%;">
                <img :src="songdata.illustration.replace('res.phi.zone',pzResUrlGlobal)">
                <div class="songCardCover" :style="{'--bg':'url('+songdata.illustration.replace('res.phi.zone',pzResUrlGlobal)+')'}">
                    <div class="songCardName">
                        {{songdata.name}}
                    </div>
                </div>
            </div>
            <div id="chartSongDetails">
                <div id="songBPM">BPM：{{songdata.bpm}}</div>
                <div id="songDuration">时长：{{songdata.duration}}</div>
				<div>谱面：{{ct.level}} {{getDifficultyActual(ct)}} {{ct.ranked?'Ranked':''}}</div>
        		<div>谱师：{{cleanStr(ct.charter)}}</div>

            </div>
        </div>


	<div id="scoreContent">
        <div class="scoreRanking scoreRankingNoPic">
          <div class="scoreRankingTitle color-primary">
            游玩记录
          </div>
          <div class="scoreRankingBody">
            <div class="scoreRankingBodyColum">
              <div class="scoreRankingEle" v-for="item,i in data.results">
                <div class="scoreRankingNum">{{page*30+i-29}}</div>
                <div class="scoreRankingUserName color-primary" :style="{color: item.player.id===userInfo.id?'red':'var(--color-text-primary)'}">{{item.player.username}}</div>
                <div class="scoreRankingExtra">{{(item.acc*100).toFixed(2)}}% {{scoreStr(item.score)}}</div>
              </div>
            </div>
          </div>
        </div>
	</div>

		<div style="text-align:center;font-size:1.25em;color:midnightblue;line-height:1.2em;top:8px;">
			<a v-if="canPrev" @click="loadPrevPage()" style="color:black;">◀</a>
		&nbsp;&nbsp;&nbsp;&nbsp;
		<a v-if="canNext" @click="loadNextPage()" style="color:black;">▶</a><br>
		<span @click="goJustPageAsk()">第{{page}}页  共{{pageAll}}页</span>
      </div>

	</div>
	`,
  data() {
    return {
      loaded: false,
      data: null,
      page: 1,
      display: [],
      songdata: null,
      ct: null,
    };
  },
  computed: {
    token() {
      return shared.game.ptmain.gameConfig.account.tokenInfo.access_token;
    },
    pageAll() {
      if (!this.data) return 1;

      const count = this.data.count;

      if (count) return Math.ceil(count / 30);
      else return 1;
    },
    canNext() {
      return this.data.next ? true : false;
    },
    canPrev() {
      return this.data.previous ? true : false;
    },
    pzResUrlGlobal() {
      return window.spec.PZ_RES_URL_GLOBAL;
    },
    userInfo() {
      return shared.game.ptmain.gameConfig.account.userBasicInfo;
    }
  },
  async mounted() {
    this.songdata = JSON.parse(sessionStorage.getItem('chartDetailsData'));
    this.ct = JSON.parse(sessionStorage.getItem('loadedChart'));




    try {
      shared.game.loadHandler.l('正在加载数据...', 'loadrecord');
      const id = this.$route.query.id;
      this.data = await phizoneApi.getRecords(this.token, id, 1);
      //const me = this.userInfo.id;
      //const idx = this.data.findIndex(x=>x.player.id===me);
      //this.page = idx===-1?1:Math.ceil(idx/30);
      //this.updatePagination();
      this.loaded = true;
    } catch (e) {
      shared.game.msgHandler.sendMessage('加载数据时遇到错误', 'error');
    } finally {
      shared.game.loadHandler.r('loadrecord');
    }
  },
  deactivated() {
    shared.game.loadHandler.r('loadrecord');
  },
  methods: {
    async goJustPageAsk() {
      const res = await shared.game.msgHandler.prompt(`请输入您要跳转的页码 (1 - ${this.pageAll})`);
      if (res) this.goJustPage(res);
    },
    async goJustPage(i) {
      if (!(i >= 1 && i <= this.pageAll)) {
        shared.game.msgHandler.sendMessage('您的输入不合法', 'error');
        return;
      }
      let link = this.data.previous || this.data.next || null;
      if (!link) return;
      link = link.replace(/page=\d+&?/, '') + `&page=${i}`;
      try {
        shared.game.loadHandler.l('正在加载数据...', 'loadrecord');
        this.data = await phizoneApi.getRecords(this.token, null, null, link);
        this.page = i;
      } catch { } finally {
        shared.game.loadHandler.r('loadrecord');
      }
    },

    getDifficultyActual(chartInfo) {
      if (typeof chartInfo.difficulty === 'string') return chartInfo.difficulty;
      else return chartInfo.difficulty === 0
        ? '?'
        : chartInfo.difficulty.toFixed(1);
    },
    cleanStr(i) {
      return i.replace(
        new RegExp(
          [
            ...i.matchAll(
              new RegExp(
                '\\[PZ([A-Za-z]+):([0-9]+):((?:(?!:PZRT\]).)*):PZRT\\]',
                'g'
              )
            ),
          ].length === 0
            ? '\\[PZ([A-Za-z]+):([0-9]+):([^\\]]+)\\]' // legacy support
            : '\\[PZ([A-Za-z]+):([0-9]+):((?:(?!:PZRT\]).)*):PZRT\\]',
          'gi'
        ),
        '$3'
      );
    },
    scoreStr(t) {
      const a = t.toFixed(0);
      return '0'.repeat(a.length < 7 ? 7 - a.length : 0) + a;
    },
    async loadNextPage() {
      try {
        shared.game.loadHandler.l('正在加载数据...', 'loadrecord');
        this.data = await phizoneApi.getRecords(this.token, null, null, this.data.next);
        this.page++;
      } catch { } finally {
        shared.game.loadHandler.r('loadrecord');
      }
    },
    async loadPrevPage() {
      try {
        shared.game.loadHandler.l('正在加载数据...', 'loadrecord');
        this.data = await phizoneApi.getRecords(this.token, null, null, this.data.previous);
        this.page--;
      } catch { } finally {
        shared.game.loadHandler.r('loadrecord');
      }
    }
  },
  watch: {

  }
};
