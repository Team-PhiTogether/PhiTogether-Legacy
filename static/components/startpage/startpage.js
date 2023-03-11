import shared from "../../utils/js/shared.js";
import phizoneApi from "../../utils/js/phizoneApi.js";
export default {
  name: "startPage",
  data() {
    return {
      ver: thisVersion,
    };
  },
  template: `
  <div id="startPage" class="routerRealPage">
  <div id="flexCol1">
    <div class="startPageRow">
      <div id="playerCard">
        <div v-if="loginStatus&&loginInfo" style="margin-bottom:20px;margin-top:-60px;">
          <div id="playerCardActions">
            <span @click="logIn()">切换</span>&nbsp;&nbsp;
            <span @click="logOut()">登出</span>
          </div>
          <img :src="loginInfo.avatar" v-if="loginInfo&&loginInfo.avatar" id="playerCardUsrAvatar"><br />
          <div id="playerCardUsrName">
            {{loginInfo.username}}&nbsp;&nbsp;
          </div><br />
          <div id="playerCardUsrInfo">
            PhiZone
            <b style="color:green;">{{loginInfo.type.toUpperCase()}}</b><br /><br /><br />
            ID <b>{{loginInfo.id}}</b>&nbsp;
            EXP <b>{{loginInfo.exp.toFixed(0)}}</b><br />
            RKS <b>{{loginInfo.rks.toFixed(2)}}</b><br /><br />
            LAST LOGIN<br>
            <b>{{loginInfo.last_login.replace("T"," ").slice(0, 16)}}</b>
          </div>
          <br>
        </div>
        <div v-else id="playerCardUsrName" @click="logIn()">
          <br>未登录，点击登录<br><br>
        </div>
      </div>
    </div>
    </div>
    <br />
    <div id="flexCol2">
    <div class="startPageRow">
    <br>
      <input type="button" value="单人游戏" @click="singleGame()">
    </div>
    <div class="startPageRow">
      <input type="button" value="多人游戏" @click="multiGame()">
    </div>
    <div class="startPageRow">
      <input type="button" value="缓存管理" @click="to('/cacheManage')">
    </div>
    <div class="startPageRow">
      <input type="button" value="游戏设置" @click="to('/settings')">
    </div><br>
    </div>
    <div style="display:none;" class="startPageRow">
      <div id="uploader" class="disabled">
        <input type="button" id="uploader-upload" value="调试：加载本地文件">
        <div id="uploader-select">
          <label id="uploader-file">加载文件</label>
          <label id="uploader-dir">加载文件夹</label>
        </div>
      </div>
    </div>
    <footer style="z-index:1688;">
        <a @click="to('/aboutPage')"><b>关于</b></a>
          &nbsp;|&nbsp;
        <a href="https://status.phitogether.fun">
          <b>服务状态</b>
        </a><br>
        PhiTogether v{{ver}} - &copy; 2023 Team PhiTogether
    </footer>
  </div>
  `,
  computed: {
    loginInfo() {
      return shared.game.ptmain.gameConfig.account.userBasicInfo;
    },
    loginStatus() {
      return !shared.game.ptmain.noAccountMode;
    },
  },
  methods: {
    to(page) {
      this.$router.push(page);
    },
    logIn() {
      this.to("/login");
    },
    async logOut() {
      if (!(await shared.game.msgHandler.confirm("您确定要登出账号吗？")))
        return;
      shared.game.ptmain.gameConfig.account = {
        tokenInfo: null,
        userBasicInfo: null,
        defaultConfigID: null,
      };
      shared.game.ptmain.noAccountMode = true;
      shared.game.msgHandler.success("您已登出，现在您已进入离线模式。");
    },
    async singleGame() {
      shared.game.ptmain.gameMode = "single";
      if (!navigator.onLine) {
        await shared.game.msgHandler.warning(
          "您没有连接到互联网，将只能游玩本地缓存谱面。"
        );
        this.to({ path: "/chartSelect", query: { offline: 1 } });
        return;
      }
      if (shared.game.ptmain.noAccountMode) {
        if (
          await shared.game.msgHandler.confirm(
            "您当前处于离线模式，所有游玩数据将不会保存，要登录账号吗？"
          )
        ) {
          this.to({ path: "/login" });
          return;
        }
      }
      this.to({ path: "/chartSelect" });
    },
    async multiGame() {
      if (!navigator.onLine) {
        shared.game.msgHandler.failure(
          "您没有连接到互联网，无法进行多人游戏！"
        );
        return;
      }
      if (shared.game.ptmain.noAccountMode) {
        shared.game.msgHandler.failure(
          "您没有登录账号或账号状态异常，无法进行多人游戏，请重新登录后再试！"
        );
        this.to({ path: "/login" });
        return;
      }
      try {
        shared.game.loadHandler.l("正在加载用户设置", "multiGetJudg");
        const current = await phizoneApi.getSpecConfiguration(
          shared.game.ptmain.gameConfig.account.tokenInfo.access_token,
          shared.game.ptmain.gameConfig.account.defaultConfigID
        );
        shared.game.loadHandler.r("multiGetJudg");
        if (current.good_judgment != 160 || current.perfect_judgment != 80) {
          shared.game.msgHandler.failure(
            "若要进行多人游戏，请将您的判定范围设置为 Perfect±80ms Good±160ms"
          );
          return;
        }
      } catch {
        shared.game.loadHandler.r("multiGetJudg");
        shared.game.msgHandler.sendMessage("获取用户配置时出错", "error");
        return;
      }
      if (localStorage.lastMultiInfo) {
        const lastMultiInfo = JSON.parse(localStorage.lastMultiInfo);
        try {
          shared.game.loadHandler.l("正在恢复多人游戏", "recoverMulti");
          const resp = await fetch(
            `/api/multi/requestRoom/${lastMultiInfo.room.id}`
          );
          const result = await resp.json();
          if (result.code === -2) {
            shared.game.loadHandler.r("recoverMulti");
            await shared.game.msgHandler.warning(
              "尝试恢复未正常退出的多人游戏失败，如需开启新的多人游戏请重新点击多人游戏按钮。"
            );
            localStorage.removeItem("lastMultiInfo");
            return;
          } else {
            shared.game.multiInstance.recoverMulti(lastMultiInfo);
          }
        } catch {
          shared.game.loadHandler.r("recoverMulti");
          shared.game.msgHandler.sendMessage(
            "恢复未正常退出的多人游戏时遇到网络错误，请点击多人游戏按钮重试"
          );
        }
        return;
      }
      shared.game.multiInstance.startMultiUI();
    },
  },
};
