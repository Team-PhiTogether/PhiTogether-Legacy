import shared from "../../utils/js/shared.js";
import phizoneApi from "../../utils/js/phizoneApi.js";

function jitsRenderer(ctx, ctxos, lineScale) {
  if (!shared.game.multiInstance.JITSOpen) return;
  const scoreStr = function (t) {
    const a = t.toFixed(0);
    return "0".repeat(a.length < 7 ? 7 - a.length : 0) + a;
  };
  let maxl = [-Infinity, -Infinity, -Infinity];
  ctxos.font = `${lineScale * 0.5}px Custom,Noto Sans SC`;
  for (let i = 0; i < JITSData.tidp.length; i++) {
    const o = JITSData.tidp[i];
    const r = o.r,
      name = o.name.length > 8 ? o.name.substr(0, 8) + ".." : o.name,
      disp =
        shared.game.multiInstance.rankMethod === "score"
          ? scoreStr(o.score)
          : (o.acc * 100).toFixed(2) + "%";
    o.name = name;
    o.disp = disp;
    const rt = ctxos.measureText(r).width,
      namet = ctxos.measureText(name).width,
      dispt = ctxos.measureText(disp).width;

    if (rt > maxl[0]) maxl[0] = rt;
    if (namet > maxl[1]) maxl[1] = namet;
    if (dispt > maxl[2]) maxl[2] = dispt;
  }
  ctxos.fillStyle = "#000";
  ctxos.globalAlpha = 0.2;
  if (shared.game.ptmain.gameConfig.enhanceRankVis) {
    ctxos.fillRect(
      0,
      0,
      lineScale * 3.9 + maxl[0] + maxl[1] + maxl[2],
      lineScale * 3.6
    );
  }
  ctxos.globalAlpha = 1;
  if (JITSData.currRank) {
    ctxos.fillStyle = "#fff";
    ctxos.textBaseline = "alphabetic";
    ctxos.textAlign = "center";
    ctxos.font = `${lineScale}px Custom,Noto Sans SC`;
    ctxos.fillText(JITSData.currRank, lineScale * 0.85, lineScale * 2.6);
    ctxos.font = `${lineScale * 0.37}px Custom,Noto Sans SC`;
    ctxos.fillText("实时排名", lineScale * 0.9, lineScale * 3.2);
  }
  ctxos.textAlign = "left";
  ctxos.font = `${lineScale * 0.56}px Custom,Noto Sans SC`;
  for (let i = 0; i < JITSData.tidp.length; i++) {
    ctxos.fillStyle = JITSData.tidp[i].me ? "#7AD7FF" : "#fff";
    ctxos.fillText(
      JITSData.tidp[i].r,
      lineScale * 2.1,
      lineScale * (i + 1 + 0.03)
    );
    ctxos.fillText(
      JITSData.tidp[i].name,
      lineScale * 2.4 + maxl[0],
      lineScale * (i + 1 + 0.03)
    );
    ctxos.fillText(
      JITSData.tidp[i].disp,
      lineScale * 3.5 + maxl[1],
      lineScale * (i + 1 + 0.03)
    );
  }
  ctxos.fillStyle = "#fff";
}

const wsHandler = {
  url: null,
  ws: null,
  watchId: null,
  onMsgOut: null,
  wsTimeout: 0,
  wsConnected: false,
  callbackListeners: {},
  onMsgInternal(e) {
    if (e.data.byteLength) {
    } else {
      const dataParsed = JSON.parse(e.data);
      if (dataParsed.type == "success") {
        if (wsHandler.callbackListeners[dataParsed.data]) {
          wsHandler.callbackListeners[dataParsed.data].resolve();
          wsHandler.callbackListeners[dataParsed.data] = null;
        }
      } else if (dataParsed.type == "roomInfo") {
        if (wsHandler.callbackListeners["getRoomInfo"])
          wsHandler.callbackListeners["getRoomInfo"].resolve(dataParsed.data);
      } else if (dataParsed.type == "alive") {
        wsHandler.wsTimeout = 0;
        wsHandler.wsConnected = true;
        if (wsHandler.callbackListeners["wsConnect"]) {
          wsHandler.callbackListeners["wsConnect"].res();
          wsHandler.callbackListeners["wsConnect"] = null;
        }
      } else {
        wsHandler.onMsgOut && wsHandler.onMsgOut(dataParsed);
      }
    }
  },
  connect(url, onMessage = null) {
    if (this.wsConnected && onMessage) {
      this.onMsgOut = onMessage;
      return new Promise((res) => res());
    }
    return new Promise((res, rej) => {
      if (!url && !this.url) return;
      if (url) {
        this.url = location.protocol.replace("http", "ws") + "//" + url;
      }
      if (!this.watchId) this.watchId = setInterval(this.watch, 3000);

      this.callbackListeners["wsConnect"] = { res, rej };

      this.ws = new WebSocket(this.url);
      this.ws.binaryType = "arraybuffer";
      this.ws.onmessage = this.onMsgInternal;
      if (onMessage) this.onMsgOut = onMessage;
    });
  },
  close() {
    this.watchId && clearInterval(this.watchId);
    this.watchId = null;
    this.ws.close();
  },
  send(action, data = null) {
    return new Promise((resolve, reject) => {
      if (!wsHandler.wsConnected) {
        reject();
        return;
      }
      const ts = { action };
      if (data) ts.data = data;
      this.callbackListeners[action] = { resolve, reject };
      this.ws.send(JSON.stringify(ts));
    });
  },
  watch() {
    if (wsHandler.wsTimeout++ > 2) {
      if (shared.game.ptmain.$route !== "/playing")
        shared.game.loadHandler.l("联机服务器连接断开，重连中...", "wsRec");
      if (wsHandler.callbackListeners["wsConnect"]) {
        wsHandler.callbackListeners["wsConnect"].rej();
        wsHandler.callbackListeners["wsConnect"] = null;
      }

      wsHandler.ws.close();
      wsHandler.wsTimeout = 0;
      wsHandler.wsConnected = false;
      wsHandler
        .connect()
        .then(async () => {
          await shared.game.multiInstance.recoverRoomStage()
          shared.game.loadHandler.r("wsRec");
        })
        .catch(() => { });
      return;
    }
    if (wsHandler.wsConnected) {
      wsHandler.ws.send('{"action":"alive"}');
    }
  },
};

let JITSData = {
  currRank: null,
  tidp: [],
  all: {},
};

const $ = (query) => document.getElementById(query);
const $$ = (query) => document.body.querySelector(query);
const $$$ = (query) => document.body.querySelectorAll(query);
export default {
  template: `
  <div>
    <div class="cover-mask" v-if="panelOpen"></div>
    <div :class="{cover:true, coverFull:rankFull}" v-if="panelOpen">
      <div v-if="!forceOpen" style="display: block;float: right;position: absolute;right: .6em;top: 0.3em;"><input
          type="button" id="close" v-on:click="panelOpen=false" style="background:unset;" value="❌"></div>
      <div class="panelSwitcher"
        v-if="room.stage>0&&(['messages','playerRank','roundRank','players'].includes(panelChoice))">
        <div>
          <input type="radio" id="pnc4" name="panelChoice" v-model="panelChoice" value="messages">
          <label for="pnc4">信息列表</label>
        </div>
        <div>
          <input type="radio" id="pnc0" name="panelChoice" v-model="panelChoice" value="players">
          <label for="pnc0">玩家列表</label>
        </div>
        <div>
          <input type="radio" id="pnc2" name="panelChoice" v-model="panelChoice" value="roundRank">
          <label for="pnc2">成绩（按歌曲）</label>
        </div>
        <div>
          <input type="radio" id="pnc3" name="panelChoice" v-model="panelChoice" value="playerRank">
          <label for="pnc3">成绩（按玩家）</label>
        </div>
      </div>
      <div class="divider">——— 操作 ———</div>
      <div id="multiActions">
        <input type="button" id="switchRankMethod2" v-on:click="switchRankMethod()"
          v-bind:value='rankMethod==="score"?"切换到使用Acc排名":"切换到使用分数排名"'
          v-if="(['playerRank','roundRank'].includes(panelChoice))">
        <input type="button" v-on:click="nextTrack()" value="下一首歌"
          v-if="(['messages','playerRank','roundRank','players'].includes(panelChoice))&&owner&&room.stage===4&&!exited">
        <input type="button" id="lockRoom" v-on:click="lockRoom()" value="锁定房间并开始"
          v-if="(['messages','playerRank','roundRank','players'].includes(panelChoice))&&owner&&room.stage===0">
        <input type="button" id="exitRoom" v-on:click="exitRoom()" v-bind:value='owner?"关闭房间":"退出房间"'
          v-if="(['messages','playerRank','roundRank','players'].includes(panelChoice))&&!exited">
        <input type="button" v-on:click="rankFull=true"
          value='全屏展示成绩统计' v-if="(['playerRank','roundRank'].includes(panelChoice))&&exited">
        <input type="button" v-if="(['messages','playerRank','roundRank','players'].includes(panelChoice))&&exited"
          value="回到单人游戏" onclick="location.reload(true)">
      </div><br>
      <div class="divider">——— 信息 ———</div>
      <div v-if="panelChoice=='messages'||room.stage===0">
        <h1 v-if="room.stage!==0">信息列表</h1>
        <div class="boxbox">
          <div class="evtbox">
            <p v-for="item,i in evtsShow">{{item.msg}}</p>
          </div>
        </div>
      </div>
      <div v-if="panelChoice=='players'||room.stage===0">
        <h1>玩家列表</h1>
        <div class="boxbox" v-if="room&&room.players">
          <div class="scorebox multi-player-list">
            <p v-for="item,i in room.players"
              v-bind:style="{color: ((!item.online)?'grey':(item.id===room.owner?'red':'unset')), display: item.exited===0?'flex':'none'}"
              v-on:click="kickPlayer(item.id, item.name, item.exited)">
              <div
                :style="{backgroundImage: 'url('+item.avatar+')', filter: (!item.online)?'grayscale(1)':'unset', border: '3px solid '+(item.id===room.owner?'red':'var(--color-box-border)')}"
                class="multi-user-avatar" />
              {{item.name}}
            </p>
          </div>
        </div>
      </div>
      <div :class="{coverFull:rankFull, coverFullScore:true}" v-if="['playerRank','roundRank'].includes(panelChoice)">
      <div :class="{scoreMainContainer:true, noHeaderExtraPadding: !exited}" >
      <div id="scoreHeader" class="color-primary" v-if="exited">
        <div id="scoreLogo" v-on:click="rankFull=false"></div>
        <div id="scoreTitle" v-on:click="rankFull=false"><b>Phi</b>Together</div>
        <div id="scoreExtraInfo">
          <div id="scoreVersion">v{{verStr}} 生成于</div>
          <div id="scoreTime">
            <b>{{timeStr}}</b>
          </div>
          <div>{{rankMethod==="score"?"根据分数排名":"根据Acc排名"}}</div>
        </div>
      </div>
      <div id="scoreContent">
        <div class="scoreRanking scoreRankingNoPic">
          <div class="scoreRankingTitle color-primary">
            综合排名
          </div>
          <div class="scoreRankingBody">
            <div class="scoreRankingBodyColum">
              <div class="scoreRankingEle" v-for="item,i in rankedUser">
                <div class="scoreRankingNum">{{i+1}}</div>
                <div class="scoreRankingUserName color-primary" :style="{color: item.id===user.id?'red':((item.playRecord.length-1)==room.playRound?'var(--color-text-primary)':'grey')}">{{item.name}}</div>
                <div class="scoreRankingExtra">{{(item.accAvg*100).toFixed(2)}}% {{scoreStr(item.scoreAvg)}}</div>
              </div>
            </div>
          </div>
        </div>
        <div v-if="panelChoice=='roundRank'">
          <div class="scoreRanking scoreRankingPic" v-for="round,it in roundRanked">
            <div class="scoreRankingBody">
              <div class="scoreRankingBodyColum">
                <div class="scoreSongCard">
                  <img :src="round.chartInfo.songData.illustration">
                  <div class="songCardCover" :style="{'--bg':'url('+round.chartInfo.songData.illustration+')'}">
                    <div class="songCardName">
                      {{round.chartInfo.songData.name}}
                    </div>
                    <div v-if="round.chartInfo.speedInfo.disp" class="songCardSpeed">({{round.chartInfo.speedInfo.disp}})</div>
                    <div class="songCardLevel">
                      {{round.chartInfo.chartData.level}} {{round.chartInfo.chartData.difficulty}}
                    </div>
                  </div>
                </div>
                <div class="scoreRankingEle" v-for="item,i in round.scores">
                  <div class="scoreRankingNum">{{i+1}}</div>
                  <div class="scoreRankingUserName color-primary" :style="{color: item.id===user.id?'red':'var(--color-text-primary)'}">
                    {{item.name}}</div>
                  <div class="scoreRankingExtra">{{item.accStr}} {{item.scoreStr}}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div v-if="panelChoice==='playerRank'">
          <div class="scoreRanking scoreRankingPerson">
            <div class="scoreRankingTitle color-primary">
              我 ({{user.name}}) 的游戏记录
            </div>
            <div class="scoreRankingBody">
              <div class="scoreRankingBodyColum">
                <div class="scoreRankingCardEle" v-for="item,i in room.players[user.id].playRecord">
                  <div class="scoreSongCard">
                    <img :src="roundRanked[i].chartInfo.songData.illustration">
                    <div class="songCardCoverAll">
                      <div class="songCardID">#{{i+1}}</div>  
                      <div class="songCardName">
                        {{roundRanked[i].chartInfo.songData.name}}
                      </div>
                      <div v-if="roundRanked[i].chartInfo.speedInfo.disp" class="songCardSpeed">({{roundRanked[i].chartInfo.speedInfo.disp}})</div>
                      <div class="songCardLevel">
                        {{roundRanked[i].chartInfo.chartData.level}} {{roundRanked[i].chartInfo.chartData.difficulty}}
                      </div>
                      <div class="songCardScore">{{item.scoreStr}}</div>
                      <div class="songCardAcc">{{item.accStr}}</div>
                      <!--<div class="songCardExtra">{{item.extra}}</div>-->
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div v-for="it1,t1 in room.players">
            <div class="scoreRanking scoreRankingPerson" v-if="t1!=user.id&&it1.playRecord.length>0">
              <div>
                <div class="scoreRankingTitle color-primary">
                  {{it1.name}} 的游戏记录
                </div>
                <div class="scoreRankingBody">
                  <div class="scoreRankingBodyColum">
                    <div class="scoreRankingCardEle" v-for="item,i in it1.playRecord">
                      <div class="scoreSongCard">
                        <img :src="roundRanked[i].chartInfo.songData.illustration">
                        <div class="songCardCoverAll">
                          <div class="songCardID">#{{i+1}}</div>
                          <div class="songCardName">
                            {{roundRanked[i].chartInfo.songData.name}}
                          </div>
                          <div v-if="roundRanked[i].chartInfo.speedInfo.disp" class="songCardSpeed">({{roundRanked[i].chartInfo.speedInfo.disp}})</div>
                          <div class="songCardLevel">
                            {{roundRanked[i].chartInfo.chartData.level}} {{roundRanked[i].chartInfo.chartData.difficulty}}
                          </div>
                          <div class="songCardScore">{{item.scoreStr}}</div>
                          <div class="songCardAcc">{{item.accStr}}</div>
                          <!--<div class="songCardExtra">{{item.extra}}</div>-->
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
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
  mounted() {
    self.addEventListener("load", () => {
      shared.game.multiInstance = this;
      shared.game.wsHandler = wsHandler;
    });
  },
  data: () => {
    return {
      evts: [],
      forceOpen: false,
      owner: false,
      user: null,
      room: { stage: 0 },
      panelOpen: false,
      panelChoice: "messages",
      gaming: false,
      exited: false,
      roundRanked: [],
      chartLoaded: false,
      speedInfo: null,
      timeStr: "",
      rankFull: false,
      rankMethod: "score",
      JITSOpen: true,
      wsConn: null,
      SERVERADDR: "",
    };
  },
  methods: {
    switchRankMethod() {
      if (this.rankMethod === "score") {
        this.rankMethod = "acc";
      } else {
        this.rankMethod = "score";
      }
      this.updateRankList(true);
    },
    async recoverRoomStage() {
      return new Promise((res,rej)=>{
        try {
          wsHandler.send("getRoomInfo").then(async (room) => {
            this.room = room;
            for (let i = 0; i < this.room.evt.length; i++) {
              const thisevt = this.room.evt[i];
              this.evts.unshift(thisevt);
            }
            switch (this.room.stage) {
              case 0:
                // 房间未锁定，忽略
                if (this.owner) {
                  shared.game.ptmain.$router.replace("/multipanel");
                  shared.game.msgHandler.sendMessage(
                    "您可以在多人面板中查看玩家信息，确认后可以锁定该房间并开始游戏。"
                  );
                } else {
                  shared.game.ptmain.$router.replace("/multipanel");
                  shared.game.msgHandler.sendMessage(
                    `等待房主${this.room.players[this.room.owner]["name"]
                    }开始游戏...（您可以在联机面板中查看玩家信息）`
                  );
                }
                for (const i of $$$(".disabled-when-selected"))
                  i.classList.remove("disabled");
                break;
              case 1:
                // 房主选谱，忽略
                for (const i of $$$(".disabled-when-selected"))
                  i.classList.remove("disabled");
                if (this.owner) {
                  shared.game.msgHandler.sendMessage(
                    "请选择谱面并同步给房间成员。"
                  );
                  shared.game.ptmain.$router.replace("/chartSelect");
                } else {
                  shared.game.msgHandler.sendMessage(
                    "房主正在选择谱面中，请耐心等待。"
                  );
                  shared.game.ptmain.$router.replace("/multipanel");
                }
                break;
              case 2:
                // 所有人载完谱，房主可能开始，现在立刻载谱
                if(!this.chartLoaded) {
                  shared.game.msgHandler.sendMessage("正在加载谱面，游戏即将开始！");
                  this.loadLastChart();
                }
                break;
              case 3:
                // 游戏开始 自己可能打了可能没打，检测一下
                if (
                  this.room.playRounds[this.room.playRound].scores &&
                  this.room.playRounds[this.room.playRound].scores[this.user.id]
                ) {
                  shared.game.msgHandler.sendMessage(
                    "等待其他玩家完成游戏并上传成绩..."
                  );
                  shared.game.ptmain.$router.replace("/multipanel");
                  break;
                } else {
                  if(shared.game.ptmain.$route.path!="/playing" && !this.chartLoaded) {
                    shared.game.msgHandler.sendMessage(
                      "正在加载谱面，游戏即将开始！"
                    );
                    this.loadLastChart();
                  }
                }
                break;
              case 4:
                //所有人打完（包括退出者），显示成绩即可
                shared.game.msgHandler.sendMessage(
                  "本轮游戏结束，您可以查看成绩统计。"
                );
                this.showStat();
                break;
              case 5:
                //有人完成加载但不是所有人，游戏未开始，载谱
                if(!this.chartLoaded) {
                  shared.game.msgHandler.sendMessage("正在加载谱面，游戏即将开始！");
                  this.loadLastChart();
                }
                break;
            }
            res();
          });
        } catch {
          rej();
        }
      })
    },
    async recoverMulti(lastMultiInfo) {
      this.wsConn = lastMultiInfo.wsConn;
      try {
        await wsHandler.connect(this.wsConn, null);
      } catch {
        wsHandler.close();
        shared.game.msgHandler.warning(
          "尝试恢复未正常退出的多人游戏失败，如需开启新的多人游戏请重新点击多人游戏按钮。"
        );
        localStorage.removeItem("lastMultiInfo");
        shared.game.loadHandler.r("recoverMulti");
      }
      shared.game.ptmain.gameMode = "multi";
      this.room = lastMultiInfo.room;
      this.user = lastMultiInfo.user;
      this.owner = this.room.owner === this.user.id;
      if (this.owner) {
        for (const i of $$$(".hideForMultiRoomOwner"))
          i.style.display = "none";
        for (const i of $$$(".disabled-when-selected"))
          i.classList.add("disabled");
      } else {
        for (const i of $$$(".hideForMultiRoomOwner"))
          i.style.display = "none";
        for (const i of $$$(".hideForMultiRegularPlayer"))
          i.style.display = "none";
      }

      await this.recoverRoomStage();

      shared.game.loadHandler.r("recoverMulti");
      this.renewEvents();
      shared.game.graphicHandler.register("whilePlayingHook", jitsRenderer);
      shared.game.ptmain.gameConfig.defaultRankMethod &&
        (this.rankMethod = shared.game.ptmain.gameConfig.defaultRankMethod);
      this.JITSOpen = shared.game.ptmain.gameConfig.JITSOpen;

      
    },
    loadLastChart() {
      for (let i = 0; i < this.evts.length; i++) {
        const thisevt = this.evts[i];
        if (thisevt.type == "loadChart") {
          this.loadChartFirst(thisevt.extraInfo);
          break;
        }
      }
    },
    async startMultiUI() {
      shared.game.msgHandler
        .prompt(
          "请在下方输入框中粘贴房间分享信息，或输入您想创建或加入的房间ID"
        )
        .then((roomid) => {
          if (!roomid) return;
          roomid = roomid.trim();
          if (roomid.startsWith("【PhiTogether")) {
            roomid = roomid.match(/\$\$\$([^\$]+)\$\$\$/)[1];
          } else if (roomid.indexOf("$") > -1) {
            shared.game.msgHandler.failure("房间ID中不得含有 $");
            return;
          }
          this.startMultiApi(roomid);
        })
        .catch(() => { });
    },
    startMultiApi(roomid) {
      shared.game.ptmain.gameConfig.defaultRankMethod &&
        (this.rankMethod = shared.game.ptmain.gameConfig.defaultRankMethod);
      this.JITSOpen = shared.game.ptmain.gameConfig.JITSOpen;
      fetch(`/api/multi/requestRoom/${roomid}`)
        .then((response) => response.json())
        .then((result) => {
          if (result.code === -1) shared.game.msgHandler.failure(result.msg);
          else if (result.code === -2) {
            // 创建房间
            this.SERVERADDR = result.server_addr;
            setTimeout(() => {
              shared.game.msgHandler
                .confirm("该房间不存在，您想要创建房间吗？")
                .then((e) => {
                  if (e) {
                    shared.game.loadHandler.l(
                      "正在验证身份信息并创建房间",
                      "createRoom"
                    );
                    let myHeaders = new Headers();
                    myHeaders.append("Content-Type", "application/json");
                    let request = new Request(
                      `${location.protocol}//${this.SERVERADDR}/api/multi/createRoom/${roomid}`,
                      {
                        method: "POST",
                        body: JSON.stringify({
                          access_token:
                            shared.game.ptmain.gameConfig.account.tokenInfo
                              .access_token,
                        }),
                        headers: myHeaders,
                      }
                    );
                    fetch(request)
                      .then((response) => response.json())
                      .then((result) => {
                        shared.game.loadHandler.r("createRoom");
                        if (result.code != 0) {
                          shared.game.msgHandler.failure(result.msg);
                          return;
                        }
                        showTransition.checked = true;
                        shared.game.ptmain.gameMode = "multi";
                        this.owner = true;
                        this.room = result.selfRoom;
                        this.user = result.selfUser;
                        this.evts = this.room.evt.reverse();
                        this.wsConn = result.wsConn;
                        localStorage.lastMultiInfo = JSON.stringify({
                          room: this.room,
                          user: this.user,
                          wsConn: result.wsConn,
                        });
                        for (const i of $$$(".hideForMultiRoomOwner"))
                          i.style.display = "none";
                        shared.game.ptmain.$router.replace("/multipanel");
                        shared.game.msgHandler.sendMessage(
                          "您可以在多人玩家面板中查看玩家信息，确认后可以锁定该房间并开始游戏。"
                        );
                        this.renewEvents();
                        const shareInfo = `【PhiTogether】我创建了一个联机房间，复制本条消息并打开 ${location.protocol}//${window.location.host} ，点击多人游戏按钮并粘贴本条消息来和我一起联机！$$$${this.room.id}$$$`;
                        shared.game.msgHandler
                          .confirm(
                            `分享信息如下，点击确定来复制到剪贴板。<br>${shareInfo}`,
                            "复制分享信息",
                            "确定",
                            "取消"
                          )
                          .then(async (e) => {
                            if (e) {
                              try {
                                await navigator.clipboard.writeText(shareInfo);
                              } catch (e) {
                                document.oncontextmenu = (e) => {
                                  return;
                                };
                                await shared.game.msgHandler.failure(
                                  `自动复制失败，请长按下方文字手动复制！<br>${shareInfo}`
                                );
                                document.oncontextmenu = (e) =>
                                  e.preventDefault();
                              }
                            }
                          });
                      })
                      .catch((e) => {
                        shared.game.msgHandler.sendMessage(
                          "创建房间失败，请重试",
                          "error"
                        );
                        shared.game.loadHandler.r("createRoom");
                      });
                  }
                });
            }, 500);
          } else {
            // 加入房间
            this.SERVERADDR = result.server_addr;
            setTimeout(() => {
              let myHeaders = new Headers();
              myHeaders.append("Content-Type", "application/json");
              let request = new Request(
                `${location.protocol}//${this.SERVERADDR}/api/multi/joinRoom/${roomid}`,
                {
                  method: "POST",
                  body: JSON.stringify({
                    access_token:
                      shared.game.ptmain.gameConfig.account.tokenInfo
                        .access_token,
                  }),
                  headers: myHeaders,
                }
              );
              shared.game.loadHandler.l(
                "正在验证身份信息并加入房间",
                "joinRoom"
              );
              fetch(request)
                .then((response) => response.json())
                .then((result) => {
                  shared.game.loadHandler.r("joinRoom");
                  if (result.code != 0) {
                    shared.game.msgHandler.failure(result.msg);
                    return;
                  }
                  showTransition.checked = true;
                  shared.game.ptmain.gameMode = "multi";
                  this.room = result.selfRoom;
                  this.user = result.selfUser;
                  this.wsConn = result.wsConn;
                  this.evts = this.room.evt.reverse();
                  localStorage.lastMultiInfo = JSON.stringify({
                    room: this.room,
                    user: this.user,
                    wsConn: result.wsConn,
                  });
                  for (const i of $$$(".hideForMultiRoomOwner"))
                    i.style.display = "none";
                  for (const i of $$$(".hideForMultiRegularPlayer"))
                    i.style.display = "none";
                  shared.game.msgHandler.sendMessage(
                    `等待房主${this.room.players[this.room.owner]["name"]
                    }开始游戏...（您可以在联机面板中查看玩家信息）`
                  );
                  shared.game.ptmain.$router.replace("/multipanel");
                  this.renewEvents();
                })
                .catch((e) => {
                  shared.game.msgHandler.sendMessage(
                    "加入房间失败，请重试",
                    "error"
                  );
                  shared.game.loadHandler.r("joinRoom");
                });
            }, 500);
          }
        });
    },
    async kickPlayer(id, name, exited) {
      if (this.owner && id != this.user.id && !exited) {
        if (
          !(await shared.game.msgHandler.confirm(`您确定要踢出 ${name} 吗？`))
        )
          return;
        wsHandler.send("kickPlayer", id);
      }
    },
    exitRoom() {
      if (this.gaming) {
        btnPlay.value == "停止" && btnPlay.click();
        this.gaming = false;
      }
      this.selfExit = true;
      wsHandler.send("kickPlayer", this.user.id);
    },
    lockRoom() {
      shared.game.loadHandler.l("锁定房间中", "lockRoom");
      wsHandler
        .send("lockRoom")
        .then(async () => {
          shared.game.loadHandler.r("lockRoom");
          await shared.game.msgHandler.success(
            "房间已经锁定，请选择谱面并点击同步！"
          );
          shared.game.ptmain.$router.replace("/chartSelect");
        })
        .catch(() => {
          shared.game.loadHandler.r("lockRoom");
          shared.game.msgHandler.sendMessage("错误，请重试", "error");
        });
    },
    chartInfoToDispName(chartInfo) {
      return `${chartInfo.songData.name} ${chartInfo.chartData.level} Lv.${chartInfo.chartData.difficulty}`;
    },
    updateRankList(force = false) {
      this.timeStr = `${new Date().format("Y-m-d H:i:s")}`;
      // 对每轮成绩排名
      let l = this.room["playRounds"];
      if (force) {
        this.roundRanked = [];
      }
      const rankedRoundNum = this.roundRanked.length;
      for (let i = rankedRoundNum; i < l.length; i++) {
        let qt = l[i];
        let tmp = [];
        if (!qt.finished) break;
        for (const t in qt.scores) {
          qt.scores[t]["id"] = t;
          tmp.push(qt.scores[t]);
        }
        tmp = this.sortByKey(
          tmp,
          this.rankMethod === "score" ? "scoreNum" : "accNum",
          false
        );
        if (this.exited) {
          this.roundRanked.push({ scores: tmp, chartInfo: qt.chartInfo });
        } else {
          this.roundRanked.unshift({ scores: tmp, chartInfo: qt.chartInfo });
        }
      }

      //用户排
      this.rankedUser = [];
      for (const i in this.room.players) {
        this.rankedUser.push(this.room.players[i]);
      }
      this.rankedUser = this.sortByKey(
        this.rankedUser,
        this.rankMethod === "score" ? "scoreAvg" : "accAvg",
        false
      );
    },
    renewRoomInfoAll() {
      return new Promise((res, rej) => {
        wsHandler.send("getRoomInfo").then((result) => {
          this.room = result;
          this.user = result["players"][this.user.id];
          this.updateRankList();
          res(true);
        });
      });
    },
    updateJITS() {
      let rk = [];
      for (const i in JITSData.all) {
        rk.push(JITSData.all[i]);
      }
      rk = this.sortByKey(
        rk,
        this.rankMethod === "score" ? "score" : "acc",
        false
      );
      const len = rk.length;
      const me = rk.findIndex((x) => x["id"] == this.user.id);
      if (me < 0) {
        JITSData.all = {};
        JITSData.currRank = null;
        return;
      }
      rk[me].me = true;
      JITSData.currRank = me + 1;
      if (len <= 3) {
        const g = [];
        for (let i = 0; i < len; i++) {
          g.push({ ...rk[i], r: i + 1 });
        }
        JITSData.tidp = g;
      } else {
        if (me === 0) {
          JITSData.tidp = [
            { ...rk[0], r: 1 },
            { ...rk[1], r: 2 },
            { ...rk[2], r: 3 },
          ];
        } else if (me === len - 1) {
          JITSData.tidp = [
            { ...rk[me - 2], r: me - 1 },
            { ...rk[me - 1], r: me },
            { ...rk[me], r: me + 1 },
          ];
        } else {
          JITSData.tidp = [
            { ...rk[me - 1], r: me },
            { ...rk[me], r: me + 1 },
            { ...rk[me + 1], r: me + 2 },
          ];
        }
      }
      //console.log(JITSData.tidp)
    },
    JITSStart() {
      this.JITSStop();
      this.JITSTimer = setInterval(() => {
        this.updateJITS();
        const stat = shared.game.stat;
        let jd = {
          acc: stat.accNum,
          score: stat.scoreNum,
          first: false,
        };
        JITSData.all[this.user.id].acc = jd.acc;
        JITSData.all[this.user.id].score = jd.score;

        wsHandler.send("JITS", jd);
      }, 1000);
    },
    JITSStop() {
      if (this.JITSTimer) clearInterval(this.JITSTimer);
    },
    renewEvents() {
      const that = this;
      let t;
      function processEvt(thisevt) {
        switch (thisevt.type) {
          case "JITS":
            if (thisevt.extraInfo.id === that.user.id) return;
            JITSData.all[thisevt.extraInfo.id] = thisevt.extraInfo;
            return;
          case "allJITS":
            JITSData.all = thisevt.extraInfo;
            that.updateJITS();
            return;
          case "reOnline":
            that.room.players[thisevt.extraInfo] &&
              (that.room.players[thisevt.extraInfo].online = true);
            break;
          case "offline":
            that.room.players[thisevt.extraInfo] &&
              (that.room.players[thisevt.extraInfo].online = false);
            break;
          case "join":
            let thisplayer = thisevt.extraInfo;
            that.room.playerNumber++;
            that.room.players[thisplayer["id"]] = thisplayer;
            break;
          case "close":
            shared.game.msgHandler.info("房间已关闭");
            localStorage.removeItem("lastMultiInfo");
            if (that.room.stage == 0) {
              location.reload();
            } else
              (that.exited = true),
                (that.room.closed = true),
                btnPlay.value == "停止" && btnPlay.click(),
                that.showStat("playerRank");
            break;
          case "exit":
            if (thisevt.extraInfo.id === that.user.id) {
              if (thisevt.extraInfo.type === 1 && !that.selfExit) break;
              localStorage.removeItem("lastMultiInfo");
              shared.game.msgHandler.info("您退出游戏！").then(async () => {
                localStorage.removeItem("lastMultiInfo");
                if (that.room.stage == 0) {
                  location.reload();
                } else
                  (that.exited = true),
                    btnPlay.value == "停止" && btnPlay.click(),
                    that.showStat("playerRank");
              });
            } else {
              if (that.room.stage == 0)
                delete that.room.players[thisevt.extraInfo.id];
              else that.room.players[thisevt.extraInfo.id].exited = true;
            }
            break;
          case "lock":
            that.room.stage = 1;
            shared.game.graphicHandler.register(
              "whilePlayingHook",
              jitsRenderer
            );
            shared.game.msgHandler.sendMessage("房间玩家锁定，游戏即将开始。在多人游戏中，您可以点击标题中绿色的 Together 字样打开联机面板。");

            break;
          case "loadChart":
            that.room.stage = 5;
            that.loadChartFirst(thisevt.extraInfo);
            break;
          case "gameStart":
            that.room.stage = 3;
            if (that.chartLoaded) that.launchGame(true);
            break;
          case "allLoadFinish":
            that.room.stage = 2;
            t = $("multiLoadingMsg");
            t && (t.innerText = "等待游戏开始...");
            if (that.owner && that.chartLoaded) {
              that.gameStartUI();
            }
            break;
          case "sbScoreUploaded":
            that.room.players[thisevt.extraInfo.id] = thisevt.extraInfo;
            break;
          case "allScoreUploaded":
            shared.game.msgHandler.sendMessage(
              "所有玩家已完成分数上传，您可以查看成绩统计。10秒后自动退出全屏。"
            );
            that.room.stage = 4;
            if (that.room.playRounds.length - 1 < thisevt.extraInfo.n)
              that.room.playRounds.push(thisevt.extraInfo);
            else that.room.playRounds[thisevt.extraInfo.n] = thisevt.extraInfo;
            setTimeout(() => {
              shared.game.app.isFull && shared.game.doFullScreen();
              shared.game.ptmain.$route.path !== "/multipanel" &&
                that.showStat();
            }, 10000);
            break;
          case "nextTrack":
            shared.game.app.isFull && shared.game.doFullScreen();
            btnPlay.value == "停止" && btnPlay.click();
            that.room.stage = 1;
            that.chartLoaded = false;
            that.room.playRound++;
            for (const i of $$$(".disabled-when-selected"))
              i.classList.remove("disabled");
            if (that.owner) {
              shared.game.ptmain.$router.replace("/chartSelect");
              shared.game.msgHandler.sendMessage(
                "下一轮游戏已开始，请选择谱面载入后点击同步。"
              );
            } else {
              shared.game.ptmain.$router.replace("/multipanel");
              shared.game.msgHandler.sendMessage(
                "下一轮游戏已开始，房主正在选择谱面中，请耐心等待。"
              );
            }
            t = $("multiLoadingMsg");
            t && (t.innerText = "正在等待所有人完成加载...");
            break;
          default:
            break;
        }
        that.evts.unshift(thisevt);
      }
      wsHandler.connect(this.wsConn, processEvt);
    },
    sortByKey(array, key, order) {
      return array.sort(function (a, b) {
        var x = a[key];
        var y = b[key];
        if (order) {
          return x < y ? -1 : x > y ? 1 : 0;
        } else {
          return x < y ? (x > y ? 1 : 0) : -1;
        }
      });
    },
    showStat(s = "roundRank") {
      this.panelChoice = s;
      this.updateRankList();
      shared.game.ptmain.$router.replace("/multipanel");
    },
    loadChartFirst(info) {
      this.chartLoaded = false;
      this.speedInfo = info.speedInfo;
      shared.game.loadHandler.l("正在加载谱面", "loadChart");
      shared.game.ptmain.loadChart(
        info.songData,
        info.chartData,
        this.loadChartSecond
      );
      shared.game.ptmain.$router.replace({
        path: "/chartDetails",
        query: { toSyncOrPlay: 3 },
      });
    },
    loadChartSecond(songInfo, chartInfo) {
      $("select-speed").selectedIndex = this.speedInfo.val;
      const dict = {
        Slowest: -9,
        Slower: -4,
        "": 0,
        Faster: 3,
        Fastest: 5,
      };
      shared.game.app.speed = 2 ** (dict[this.speedInfo.disp] / 12);
      this.chartLoaded = true;
      if (this.owner && this.room.stage === 2) {
        this.gameStartUI();
        shared.game.loadHandler.r("loadChart");
        return;
      }
      if (this.room.stage === 3) {
        this.launchGame();
        shared.game.loadHandler.r("loadChart");
        return;
      }
      const updateLoadFinish = async () => {
        try {
          const chartData = JSON.parse(sessionStorage.getItem("loadedChart"));
          const shouldNotUploadPhiZone = this.noAccountMode;
          if (!shouldNotUploadPhiZone) {
            shared.game.loadHandler.l("正在上报 PhiZone 游玩配置", "playChart");
            await phizoneApi.patchSpecConfiguration(
              shared.game.ptmain.gameConfig.account.tokenInfo.access_token,
              shared.game.ptmain.gameConfig.account.defaultConfigID,
              {
                music_speed: shared.game.app.speed,
              }
            );
            await phizoneApi.playChartEncrypted(
              shared.game.ptmain.gameConfig.account.tokenInfo.access_token,
              chartData.id,
              shared.game.ptmain.gameConfig.account.defaultConfigID
            );
          }
          await wsHandler.send("loadChartFinish");
          shared.game.loadHandler.r("playChart");
          shared.game.loadHandler.r("loadChart");
        } catch (e) {
          shared.game.loadHandler.r("playChart");
          shared.game.loadHandler.r("loadChart");
          shared.game.msgHandler.sendMessage("失败，3秒后重试", "error");
          setTimeout(updateLoadFinish, 3000);
          return;
        }
      };
      updateLoadFinish();
    },
    launchGame(direct = false) {
      const startDirect = () => {
        this.panelOpen = false;
        this.gaming = true;
        document.getElementById("gameAdjust").style.display = "block";
        shared.game.ptmain.playChart();
      };
      wsHandler.send("JITS", {
        first: true,
        score: 0,
        acc: 0,
      });
      this.JITSStart();
      if (direct) {
        startDirect();
        return;
      }
      shared.game.msgHandler
        .warning("游戏已经开始，请准备好点击确定立即开始！", "游戏开始", "确定")
        .then(() => {
          if (this.chartLoaded === false) {
            shared.game.msgHandler.sendMessage(
              "抱歉，谱面仍在加载中，请稍后重试。"
            );
            return;
          }
          startDirect();
        });
    },
    syncChart(songData, chartData) {
      return new Promise((res, rej) => {
        const speedInfo = {
          val: $("select-speed").selectedIndex,
          disp: $("select-speed").selectedOptions[0].value,
        };
        for (const i of $$$(".disabled-when-selected"))
          i.classList.add("disabled");
        wsHandler
          .send("syncChartInfo", {
            songData,
            chartData,
            speedInfo,
          })
          .then(() => {
            shared.game.msgHandler.sendMessage(
              "谱面已同步，请耐心等待其他玩家完成加载。"
            );
            this.room.stage = 5;
            res(true);
          })
          .catch(() => rej(false));
      });
    },
    gameStartUI() {
      shared.game.msgHandler
        .success(
          "所有玩家已经完成谱面加载，在您点击下方按钮后将为所有玩家启动游戏。",
          "游戏可以开始！",
          "开始"
        )
        .then((e) => {
          this.gameStart().catch(() => {
            shared.game.msgHandler.sendMessage("失败！3秒后重试", "error");
            setTimeout(this.gameStart, 3000);
          });
        });
    },
    gameStart() {
      return wsHandler.send("startGamePlay");
    },
    uploadScore() {
      this.JITSStop();
      const stat = shared.game.stat;
      let scoreData = {
        accNum: stat.accNum,
        accStr: stat.accStr,
        all: stat.all,
        bad: stat.bad,
        good: stat.good,
        great: stat.great,
        perfect: stat.perfect,
        scoreNum: stat.scoreNum,
        scoreStr: stat.scoreStr,
        maxcombo: stat.maxcombo,
        extra: "",
      };
      if (stat.lineStatus == 1 || stat.lineStatus == 2)
        scoreData.extra = "ALL PERFECT";
      else if (stat.lineStatus == 3) scoreData.extra = "FULL COMBO";
      wsHandler
        .send("uploadScoreInfo", scoreData)
        .then(async (res) => {
          this.gaming = false;
        })
        .catch(() => {
          shared.game.msgHandler.sendMessage("上传失败，3秒后重试");
          setTimeout(this.uploadScore, 3000);
        });
    },
    nextTrack() {
      wsHandler.send("nextTrack");
    },

    scoreStr(t) {
      const a = t.toFixed(0);
      return "0".repeat(a.length < 7 ? 7 - a.length : 0) + a;
    },

    // captureImage(area) {
    //   const element = document.querySelector(`#${area}`);
    //   if (
    //     getComputedStyle(document.body)["color"].toString() ==
    //     "rgb(255, 255, 255)"
    //   ) {
    //     //via夜间模式
    //     element.style.background = "black";
    //   }
    //   html2canvas(element, {
    //     useCORS: true, // 【重要】开启跨域配置
    //     scale: window.devicePixelRatio < 3 ? window.devicePixelRatio : 2,
    //     allowTaint: true, // 允许跨域图片
    //   }).then((canvas) => {
    //     const imgData = canvas.toDataURL("image/jpeg", 1.0);
    //     this.imgData = imgData;
    //     this.imgTitle == `result${new Date().getTime()}.jpg`;
    //     this.panelChoice = 9998;
    //   });
    // },
    // downloadFile() {
    //   let content = this.imgData;
    //   let fileName = this.imgTitle;
    //   let aLink = document.createElement("a");
    //   aLink.download = fileName;
    //   aLink.href = content;
    //   aLink.click();
    // },
  },
  watch: {
	  rankFull: {
		handler(newVal, oldVal) {
			if(newVal)shared.game.msgHandler.sendMessage("您可以通过点击 PhiTogether 标题或logo退出全屏统计展示。");
		},
	  },
    panelOpen: {
      handler(newVal, oldVal) {
        if (newVal) {
          document.body.style.overflow = "hidden";
          window.scrollTo(0, 0);
        } else {
          document.body.style.overflow = "scroll";
        }
      },
    },
    panelChoice: {
      handler(newVal, oldVal) {
        if (["playerRank", "roundRank"].includes(newVal)) {
          this.updateRankList();
        }
        // if (newVal === 9998) {
        //   document.oncontextmenu = (e) => {
        //     return;
        //   };
        // } else {
        //   document.oncontextmenu = (e) => e.preventDefault();
        // }
      },
      rankMethod: {
        handler(newVal, oldVal) {
          shared.game.ptmain.gameConfig.defaultRankMethod = newVal;
        },
      },
    },
    exited: {
      handler(newVal, oldVal) {
        if (newVal) {
          this.roundRanked = this.roundRanked.reverse();
          wsHandler.close();
        }
      },
    },
  },
  computed: {
    evtsShow() {
      return this.evts.slice(0, 30);
    },
    verStr() {
      return thisVersion;
    },
  },
};

const selectbg = $("select-bg");
const selectbgm = $("select-bgm");
const selectchart = $("select-chart");
const btnPlay = $("btn-play");
const showTransition = $("showTransition");
