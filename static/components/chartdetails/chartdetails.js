import shared from '../../utils/js/shared.js?ver=1.3.2h8';
import { audio } from '../../utils/js/aup.js?ver=1.3.2h8';
import { deleteCacheInArray } from "../cachemanage/cacheutils.js?ver=1.3.2h8";
export default {
    name: 'chartDetails',
    template: `
    <div style="margin-top:2em;" id="chartDetails" v-if="data">
        <div id="chartDetailsHeader">
            <div class="scoreSongCard" style="margin-left:5%;margin-right:5%;">
                <img :src="data.illustration.replace('res.phi.zone',pzResUrlGlobal)">
                <div class="songCardCover" :style="{'--bg':'url('+data.illustration.replace('res.phi.zone',pzResUrlGlobal)+')'}">
                    <div class="songCardName">
                        {{data.name}}
                    </div>
                </div>
            </div>
            <div id="chartSongDetails">
                <div id="songEdition">版本：{{data.edition}}</div>
                <div id="songComposer">曲师：{{data.composer}}</div>
                <div id="songIllustrator">画师：{{data.illustrator}}</div>
                <div id="songBPM">BPM：{{data.bpm}}</div>
                <div id="songDuration">时长：{{data.duration}}</div>
                <a @click="favourite" v-if="canFav">{{favouriteStatus}}</a>
                <div style="display: flex;justify-content: space-evenly;flex-wrap: wrap;" v-if="!canFav && isSingle && !isFromCustomServer">
                    <a @click="edit">编辑</a>
                    <a @click="deleteChart">删除</a>
                </div>
            </div>
        </div>

        <div v-if="toSyncOrPlay!==0" style="display:block;">
        <br>
        <div v-if="toSyncOrPlay!==0">谱面：{{ct.level}} {{getDifficultyActual(ct)}} {{ct.ranked?'Ranked':''}}</div>
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
                    <div class="level">{{chart.level}} {{getDifficultyActual(chart)}} {{chart.ranked?'Ranked':''}}</div>
                    <div class="charter">{{cleanStr(chart.charter)}}</div>
                    <div class="notes">{{chart.notes}}</div>
                    <div class="rating" v-if="'rating' in chart">{{chart.rating.toFixed(1)}}/{{chart.like_count}}</div>
                    <div class="rating" v-else>不可用</div>
                    <div class="play"><input type="button" @click="loadChart(chart)" value="选择" ><input type="button" v-if="isSingle && hasAccount && canFav" @click="toRank(chart)" value="排行" ></div>
                </div>
            </div>
            <div v-else style="text-align:center;">该歌曲暂无可游玩谱面！</div>
            <br>
        </div>
    </div>
    `,
    computed: {
        pzResUrlGlobal() {
            return window.spec.PZ_RES_URL_GLOBAL;
        },
        canFav() {
            return this.data && this.data.id && (typeof this.data.id === 'number');
        },
        isFromCustomServer() {
            return !this.canFav && this.data.id.includes("|$|");
        },
        isSingle() {
            return shared.game.ptmain.gameMode === 'single';
        },
        hasAccount() {
            return shared.game.ptmain.gameConfig.account.userBasicInfo;
        }
    },
    data() {
        return {
            data: null,
            toSyncOrPlay: 0,
            ct: null,
            previewAbortController: null,
            favouriteStatus: "收藏",
        };
    },
    activated() {
        audio.stop();
        const oriData = sessionStorage.getItem('chartDetailsData');
        if (!oriData) return;
        const params = JSON.parse(oriData);
        this.data = params;
        if (this.$route.query.toSyncOrPlay && this.$route.query.toSyncOrPlay == 3) {
            const ct = JSON.parse(sessionStorage.getItem('loadedChart'));
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
        shared.game.msgHandler.sendMessage('正在加载音频预览...', 'info', false);
        fetch(songLink.replace('res.phi.zone', spec.PZ_RES_URL_GLOBAL), { signal: this.previewAbortController.signal })
            .then(async (e) => {
                const buffer = await e.arrayBuffer();
                const bfs = await audio.decode(buffer);
                audio.play(bfs, {
                    loop: true,
                    offset: this.toSecond(params.preview_start),
                });
                shared.game.msgHandler.sendMessage('正在播放音频预览...');
                this.previewAbortController = null;
            })
            .catch((e) => {
                if (this.previewAbortController)
                    shared.game.msgHandler.sendMessage('音频预览加载失败。', 'error');
            });
        if (JSON.parse(localStorage.getItem("favourites")) && JSON.parse(localStorage.getItem("favourites")).indexOf(JSON.parse(sessionStorage.getItem('chartDetailsData')).id) !== -1) this.favouriteStatus = "取消收藏";
        else this.favouriteStatus = "收藏";
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
        toRank(chart) {
            if (this.previewAbortController)
                this.previewAbortController.abort(),
                    (this.previewAbortController = null);
            audio.stop();
            sessionStorage.setItem('loadedChart', JSON.stringify(chart));
            this.$router.push({ path: '/pzRankSingle', query: { id: chart.id } });
        },
        getDifficultyActual(chartInfo) {
            if (typeof chartInfo.difficulty === 'string') return chartInfo.difficulty;
            else return chartInfo.difficulty === 0
                ? '?'
                : chartInfo.difficulty.toFixed(1);
        },
        toSecond(str) {
            try {
                const d = str.split(':');
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
        async multiSyncChart() {
            try {
                shared.game.loadHandler.l('正在同步谱面', 'syncChart');
                await shared.game.multiInstance.syncChart(this.data, this.ct);
                this.toSyncOrPlay = 3;
            } catch (e) {
                shared.game.loadHandler.r('syncChart');
                shared.game.msgHandler.sendMessage('同步谱面失败', 'error');
            }
        },
        async loadChart(ct) {
            const localCharts = {
                22: {
                    type: 'pgm',
                    link: '/static/src/core/charts/pgm/c22in.json',
                }
            };
            if (ct.id && ct.id in localCharts) {
                const ctpr = localCharts[ct.id];
                ct.chart = ctpr.link;
                switch (ctpr.type) {
                    case 'pgm':
                        await shared.game.msgHandler.info('该谱面为 Phigrim 官方谱面！关注 Phigrim 喵，关注 Phigrim 谢谢喵！');
                        break;
                    default:
                        break;
                }
            }
            if (!ct.chart) {
                shared.game.msgHandler.failure(
                    '抱歉，由于版权原因，您无法选择本谱面，请更换其它谱面游玩！'
                );
                return;
            }
            // if (
            //     !(await shared.game.msgHandler.confirm(
            //         `您确定要选定 ${this.data.name} ${ct.level} ${this.getDifficultyActual(ct)} 吗？`
            //     ))
            // )
            //     return;
            if (this.previewAbortController)
                this.previewAbortController.abort(),
                    (this.previewAbortController = null);
            this.ct = ct;
            if (shared.game.ptmain.gameMode === 'multi') {
                audio.stop();
                this.toSyncOrPlay = 2;
                document.getElementById('gameAdjust').style.display = 'block';
                shared.game.msgHandler.sendMessage(
                    '您可以在调节谱面变速等参数，调节完后请点击【同步】按钮来同步谱面！'
                );
                return;
            }
            shared.game.loadHandler.l('正在加载谱面', 'loadChart');
            shared.game.ptmain.loadChart(this.data, ct, this.chartLoaded);
        },
        chartLoaded(songInfo, chartInfo) {
            this.toSyncOrPlay = 1;
            shared.game.loadHandler.r('loadChart');
            audio.stop();
            document.getElementById('gameAdjust').style.display = 'block';
        },
        async playChart() {
            shared.game.ptmain.playChart();
        },
        async favourite() {
            const oriData = JSON.parse(sessionStorage.getItem('chartDetailsData'));
            let favourites = JSON.parse(localStorage.getItem("favourites"));
            if (favourites && favourites.indexOf(oriData.id) !== -1) {
                const oriData = JSON.parse(sessionStorage.getItem('chartDetailsData'));
                let favourites = JSON.parse(localStorage.getItem("favourites"));
                if (favourites.indexOf(oriData.id) === -1) return;
                favourites = favourites.filter(item => item !== oriData.id);
                localStorage.setItem("favourites", JSON.stringify(favourites));
                shared.game.msgHandler.sendMessage(oriData.name + " 取消收藏成功");
                this.favouriteStatus = "收藏";
                // document.getElementById("deleteFavourite").style = "display: none;";
            } else {
                if (favourites) {
                    favourites[favourites.length] = oriData.id;
                    localStorage.setItem("favourites", JSON.stringify(favourites));
                } else {
                    localStorage.setItem("favourites", JSON.stringify([oriData.id]));
                }
                shared.game.msgHandler.sendMessage(oriData.name + " 收藏成功");
                this.favouriteStatus = "取消收藏";
                // document.getElementById("deleteFavourite").style = "";
            }
        },
        edit() {
            this.$router.push({
                path: "/chartEdit",
                // query: { songData: JSON.stringify(this.data), chartData: JSON.stringify(this.data.charts[0]) }
            });
        },
        async deleteCacheAll(i) {
            let lst = []
            if (i.song) lst.push(i.song);
            if (i.illustration) lst.push(i.illustration);
            if (i.charts) {
                for (let j = 0; j < i.charts.length; j++) {
                    if (i.charts[j].chart) lst.push(i.charts[j].chart);
                    if (i.charts[j].assets) lst.push(i.charts[j].assets);
                }
            }
            await deleteCacheInArray(lst);
            shared.game.msgHandler.sendMessage('删除成功');
            this.$router.back();
        },
        async deleteChart() {
            if (!await shared.game.msgHandler.confirm("您确定要删除吗？")) return;
            this.deleteCacheAll(this.data);
        },
    },
};
