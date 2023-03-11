import phizoneApi from "../../utils/js/phizoneApi.js";
import shared from "../../utils/js/shared.js";
const html = (e) => e[0];
export default {
  name: "login",
  data() {
    return {
      username: "",
      password: "",
    };
  },
  template: html`
    <div id="loginPage" class="routerRealPage">
      <h1 class="loginPageRow" style="font-size:2em;">使用 PhiZone 账号登录</h1>
      <img src="https://www.phi.zone/favicon.ico" id="PhiZoneLogo">
      <div class="loginPageRow">
        邮箱：<input
          class="input"
          style="width:calc(100%/2);"
          v-model="username"
        />
      </div>
      <div class="loginPageRow">
        密码：<input
          class="input"
          v-model="password"
          style="width:calc(100%/2);"
          type="password"
        />
      </div>
      <div class="loginPageRow">
        <input
          type="button"
          style="width:auto;font-size:1.5em;"
          value="登录"
          @click="doLogin()"
        />
        <input
          type="button"
          style="width:auto;font-size:1.5em;"
          value="注册"
          @click="jumpReg()"
        />
      </div>
    </div>
  `,
  methods: {
    jumpReg() {
      location.href =
        "https://www.phi.zone/session/register?redirect=" +
        encodeURIComponent(location.href);
    },
    async doLogin() {
      const msgHandler = shared.game.msgHandler;
      if (!this.username || !this.password) {
        msgHandler.sendMessage("用户名和密码不得为空！", "error");
        return;
      }
      shared.game.loadHandler.l("正在登录");
      phizoneApi
        .refreshLogin(this.username, this.password, "password")
        .then((e) => {
          msgHandler.sendMessage("登录成功！正在获取用户信息...");
          shared.game.ptmain.gameConfig.account.tokenInfo = e;
          shared.game.ptmain
            .loadUserRelatedInfo(e.access_token)
            .then(() => this.$router.back())
            .catch(() => {});

          //msgHandler.success("登录成功！");
        })
        .catch((e) => {
          shared.game.loadHandler.r();
          msgHandler.failure(e);
        });
    },
  },
};
