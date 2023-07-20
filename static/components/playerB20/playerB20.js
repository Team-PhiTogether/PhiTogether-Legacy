import shared from '../../utils/js/shared.js?ver=1.3.2h8';
import phizoneApi from '../../utils/js/phizoneApi.js?ver=1.3.2h8';

const $ = (query) => document.getElementById(query);
const $$ = (query) => document.body.querySelector(query);
const $$$ = (query) => document.body.querySelectorAll(query);


export default {
  name: 'playerB20',
  template: `
	<div>
      <div>
	  <div :class="{scoreMainContainer:true, playerB20Container:true}" v-if="loaded">
      <div id="scoreContent">
          <div>
            <div class="scoreRanking scoreRankingPerson">
              <div>
                <div class="scoreRankingTitle">
					<div class="playerB20Card">
          				<div id="playerCardUsrAvatarParent">
            					<div id="playerCardUsrAvatar">
									<img :src="data.user.avatar.replace('res.phi.zone',pzResUrlGlobal)">
								</div>
						</div>
						<div class="playerB20Info">
							<p class="name">{{data.user.username}}</p> 
							<p class="id">ID: {{data.user.id}}</p> 
							<p class="rks">RKS: {{data.user.rks.toFixed(3)}}</p> 
							<p class="exp">EXP: {{data.user.exp.toFixed(0)}}</p> 
						</div>
					</div>
                </div>
                <div class="scoreRankingBody">
                  <div class="scoreRankingBodyColum">
                    <div class="scoreRankingCardEle" v-if="data.phi1 && data.phi1.chart">
                      <div class="scoreSongCard">
                        <img :src="data.phi1.chart.song.illustration">
                        <div class="songCardCoverAll">
                          <div class="songCardID Phi">Phi</div>
                          <div class="songCardName">
                            {{data.phi1.chart.song.name}}
                          </div>
                          <div class="songCardLevel">
							  {{data.phi1.rks.toFixed(2)}}<br />{{data.phi1.chart.level}} {{data.phi1.chart.difficulty}}
                          </div>
                          <div class="songCardScore">{{scoreStr(data.phi1.score)}}</div>
                          <div class="songCardAcc">{{(data.phi1.acc*100).toFixed(2)}}%</div>
                        </div>
                      </div>
                    </div>
                    <div class="scoreRankingCardEle" v-for="item,i in data.b19">
                      <div class="scoreSongCard">
                        <img :src="item.chart.song.illustration">
                        <div class="songCardCoverAll">
                          <div class="songCardID">#{{i+1}}</div>
                          <div class="songCardName">
                            {{item.chart.song.name}}
                          </div>
                          <div class="songCardLevel">
							{{item.rks.toFixed(2)}}<br />{{item.chart.level}} {{item.chart.difficulty}}
                          </div>
                          <div class="songCardScore">{{scoreStr(item.score)}}</div>
                          <div class="songCardAcc">{{(item.acc*100).toFixed(2)}}%</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
      </div>
</div>

	`,
  data() {
    return {
      loaded: false,
      data: null,
    };
  },
  computed: {
    pzResUrlGlobal() {
      return window.spec.PZ_RES_URL_GLOBAL;
    },
  },
  async mounted() {
    try {
      shared.game.loadHandler.l('正在加载数据...', 'loadb20');
      const id = this.$route.query.id;
      this.data = await phizoneApi.getPlayerB20(shared.game.ptmain.gameConfig.account.tokenInfo.access_token, id);
      this.loaded = true;
    } catch (e) {
      shared.game.msgHandler.sendMessage('加载数据时遇到错误', 'error');
    } finally {
      shared.game.loadHandler.r('loadb20');
    }
  },
  deactivated() {
    shared.game.loadHandler.r('loadb20');
  },
  methods: {
    scoreStr(t) {
      const a = t.toFixed(0);
      return '0'.repeat(a.length < 7 ? 7 - a.length : 0) + a;
    },
  },
  watch: {

  }
};
