import multiplayerframe from "./components/multiplayer/multiplayer.js";
import ChartSelectPageComponent from "./components/chartselect/chartselect.js";
import StartPageComponent from "./components/startpage/startpage.js";
import ChartDetailsPageComponent from "./components/chartdetails/chartdetails.js";
import PlayingPageComponent from "./components/playing/playing.js";
import LoginPageComponent from "./components/login/login.js";
import CalibratePageComponent from "./components/calibrate/calibrate.js";
import CacheManagePageComponent from "./components/cachemanage/cachemanage.js";
import AboutPageComponent from "./components/aboutpage/aboutpage.js";

import { uploader } from "./utils/js/reader.js?v=father";
import shared from "./utils/js/shared.js";
import phizoneApi from "./utils/js/phizoneApi.js";
import { full } from "./utils/js/common.js";

let drawRes = {};
self.drawRes = drawRes;

const EmptyPageComponent = { name: "Empty", template: "<span></span>" };

const msgHandler = {
  nodeText: document.getElementById("msg-out"),
  lastMessage: "",
  sendMessage(msg, type, system = true) {
    if (type === "error") {
      if (
        document.visibilityState === "hidden" &&
        system &&
        PT_SERVICE_WORKER
      ) {
        let notify = PT_SERVICE_WORKER.showNotification("PhiTogether 错误", {
          body: msg,
        });
      }
      Notiflix.Notify.failure(msg, {
        ID: "msgHandlerErr",
        zindex: 114515,
        cssAnimationStyle: "fade",
      });
    } else {
      if (
        document.visibilityState === "hidden" &&
        system &&
        PT_SERVICE_WORKER
      ) {
        let notify = PT_SERVICE_WORKER.showNotification("PhiTogether 消息", {
          body: msg,
        });
      }
      Notiflix.Notify.info(msg, {
        ID: "msgHandlerInfo",
        showOnlyTheLastOne: true,
        zindex: 114515,
        cssAnimationStyle: "fade",
        clickToClose: true,
      });
    }
  },
  confirm(msg, title = "提示", yes = "是", no = "否") {
    return new Promise((res) => {
      Notiflix.Confirm.show(
        title,
        msg,
        yes,
        no,
        () => {
          res(true);
        },
        () => {
          res(false);
        },
        {
          zindex: 114515,
          titleColor: "black",
          okButtonBackground: "#90caf9",
          messageMaxLength: 1000,
          plainText: false,
        }
      );
    });
  },
  info(msg, title = "提示", yes = "好", type = "info") {
    return new Promise((res) => {
      Notiflix.Report[type](
        title,
        msg,
        yes,
        () => {
          res(true);
        },
        {
          zindex: 114515,
          titleColor: "black",
          buttonBackground: "#90caf9",
          svgSize: "30px",
        }
      );
    });
  },
  success(msg, title = "提示", yes = "好") {
    return this.info(msg, title, yes, "success");
  },
  failure(msg, title = "提示", yes = "好") {
    return this.info(msg, title, yes, "failure");
  },
  warning(msg, title = "提示", yes = "好") {
    return this.info(msg, title, yes, "warning");
  },
  prompt(msg, title = "提示", yes = "确定", no = "取消", placeholder = "") {
    return new Promise(function (res) {
      Notiflix.Confirm.prompt(
        title,
        msg,
        placeholder,
        yes,
        no,
        (clientAnswer) => {
          res(clientAnswer);
        },
        (clientAnswer) => {
          res(null);
        },
        {
          zindex: 114515,
          titleColor: "black",
          okButtonBackground: "#90caf9",
        }
      );
    });
  },
};
const loadHandler = {
  currentId: null,
  lastOver: 0,
  delayed: null,
  l(msg, id = "###default###") {
    if (this.currentId) {
      Notiflix.Loading.change(msg);
      this.currentId = id;
    } else {
      let toDelay = false;
      const dow = () => {
        if (toDelay && id !== this.delayed) return;
        Notiflix.Loading.standard(msg);
        this.currentId = id;
      };
      const now = new Date().getTime();
      if (now - this.lastOver <= 500) {
        setTimeout(dow, 500);
        toDelay = true;
        this.delayed = id;
      } else {
        dow();
        this.delayed = null;
      }
    }
  },
  r(id = "###default###") {
    if (id === this.currentId) {
      Notiflix.Loading.remove();
      this.lastOver = new Date().getTime();
      this.currentId = null;
    }
    if (id === this.delayed) {
      this.delayed = null;
    }
  },
};

if(localStorage.PTVerified707 || document.referrer==="https://docs.qq.com/") {
  localStorage.PTVerified707=true;
} else {
  window.location.href="https://ks.wjx.top/vm/rXggzL9.aspx";
}
if(window.devicePixelRatio>=3)document.documentElement.style.fontSize="80%";
if (!location.hash || location.hash != "#/startPage")
  location.hash = "#/startPage";
const routes = [
  { path: "/startPage", component: StartPageComponent },
  { path: "/chartSelect", component: ChartSelectPageComponent },
  { path: "/chartDetails", component: ChartDetailsPageComponent },
  { path: "/playing", component: PlayingPageComponent },
  { path: "/login", component: LoginPageComponent },
  { path: "/calibrate", component: CalibratePageComponent },
  { path: "/cacheManage", component: CacheManagePageComponent },
  { path: "/aboutPage", component: AboutPageComponent },
  // 虚拟页面
  { path: "/multipanel", component: EmptyPageComponent },
  { path: "/settings", component: EmptyPageComponent },
];

const router = VueRouter.createRouter({
  history: VueRouter.createWebHashHistory(),
  routes,
});

router.beforeEach((to, from) => {
  $("btn-play").value === "停止" && $("btn-play").click();
  switch (to.path) {
    case "/settings":
      document.getElementById("settings").style.display = "block";
      break;
    case "/multipanel":
      shared.game.multiInstance.forceOpen = true;
      shared.game.multiInstance.panelOpen = true;
      break;
  }
  switch (from.path) {
    case "/settings":
      document.getElementById("settings").style.display = "none";
      break;
    case "/multipanel":
      shared.game.multiInstance.forceOpen = false;
      shared.game.multiInstance.panelOpen = false;
      break;
  }
  if (to.path != "/playing") {
    stage.style.display = "none";
  } else {
    stage.style.display = "block";
    shared.game.app.resizeCanvas();
    if (to.query.auto) {
      btnPlay.click();
    }
  }
  const gameAdjustPage = ["/playing", "/chartDetails"];
  if (gameAdjustPage.includes(from.path) && !gameAdjustPage.includes(to.path)) {
    $("gameAdjust").style.display = "none";
  }
});

const ptAppInstance = Vue.createApp({
  data() {
    return {
      gameConfig: {
        account: {
          tokenInfo: null,
          userBasicInfo: null,
          defaultConfigID: null,
        },
        showPoint: false,
        showTimer: false,
        JITSOpen: true,
        defaultRankMethod: "score",
        denyChartSettings: false,
        showTransition: true,
        closeAnim: false,
        feedback: false,
        imageBlur: true,
        highLight: true,
        showCE2: false,
        lineColor: true,
        showAcc: true,
        showStat: false,
        lowRes: false,
        enhanceRankVis: false,
        lockOri: true,
        aspectRatio: "1.428571",
        noteScale: "1.15",
        backgroundDim: "0.6",
        volume: "0.75",
        inputOffset: "0",
        notifyFinished: false,
      },
      multiInstance: null,
      noAccountMode: true,
      gameMode: "single",
      externalHooks: {
        chartLoaded: null,
        playerFinished: null,
      },
      chartOffsetSurface: 0,
    };
  },
  computed: {
    chartOffsetActual() {
      return this.chartOffsetSurface * 1 + this.gameConfig.inputOffset * 1;
    },
    canBack() {
      if (this.gameMode === "single") {
        return this.$route.path !== "/startPage";
      } else {
        return this.$route.path === "/chartDetails" && shared.game.multiInstance.room.stage === 1;
      }
    },
    canSet() {
      if (this.gameMode === "single") {
        return ![
          "/startPage",
          "/settings",
          "/playing",
          "/calibrate",
          "/aboutPage",
        ].includes(this.$route.path);
      } else {
        return false;
      }
    },
  },
  watch: {
    gameConfig: {
      handler(newVal, oldVal) {
        localStorage.setItem("PhiTogetherSettings", JSON.stringify(newVal));
      },
      deep: true,
    },
    chartOffsetSurface: {
      handler(newVal, oldVal) {
        const lc = sessionStorage.getItem("loadedChart");
        if (!lc) return;
        let saved;
        saved = localStorage.getItem("PTSavedOffsets");
        if (!saved) saved = {};
        else saved = JSON.parse(saved);
        const ct = JSON.parse(lc);
        saved[ct.id] = newVal;
        localStorage.PTSavedOffsets = JSON.stringify(saved);
      },
    },
  },
  methods: {
    openMultiPanel() {
      shared.game.multiInstance.panelOpen = true;
      shared.game.multiInstance.panelChoice = "messages";
    },
    doCalibrate() {
      this.$router.push("/calibrate");
    },
    spClickLB() {
      if (this.gameMode === "single") return;
      shared.game.multiInstance.JITSOpen = !shared.game.multiInstance.JITSOpen;
    },
    spClickLT() {
      btnPause.click();
    },
    async modJudgment() {
      try {
        if (this.noAccountMode) {
          msgHandler.failure("您无法在离线模式下修改判定范围");
          return;
        }
        loadHandler.l("读取当前配置中...", "modJudgment");
        const current = await phizoneApi.getSpecConfiguration(
          this.gameConfig.account.tokenInfo.access_token,
          this.gameConfig.account.defaultConfigID
        );
        loadHandler.r("modJudgment");
        if (
          await msgHandler.confirm(
            `您当前的设置为：Perfect±${current.perfect_judgment} Good±${current.good_judgment}，您要修改吗？`,
            "提示",
            "修改",
            "取消"
          )
        ) {
          setTimeout(async () => {
            const res1 = parseInt(
              await msgHandler.prompt(
                "请输入新的Perfect判定范围（±25~±100 整数 单位: ms）"
              )
            );
            if (isNaN(res1) || !(res1 >= 25 && res1 <= 100)) {
              msgHandler.sendMessage("输入不符合要求", "error");
              return;
            }
            setTimeout(async () => {
              const res2 = parseInt(
                await msgHandler.prompt(
                  "请输入新的Good判定范围（±60~±180 整数 单位: ms）"
                )
              );
              if (isNaN(res2) || !(res2 > res1 && res2 >= 60 && res2 <= 180)) {
                msgHandler.sendMessage("输入不符合要求", "error");
                return;
              }
              try {
                loadHandler.l("修改配置文件中...", "modJudgment");
                await phizoneApi.patchSpecConfiguration(
                  this.gameConfig.account.tokenInfo.access_token,
                  this.gameConfig.account.defaultConfigID,
                  {
                    perfect_judgment: res1,
                    good_judgment: res2,
                    music_speed: 1,
                  }
                );
                msgHandler.sendMessage("判定范围修改成功");
              } catch {
                msgHandler.sendMessage("操作配置文件出错", "error");
              } finally {
                loadHandler.r("modJudgment");
              }
            }, 500);
          }, 500);
        }
      } catch {
        msgHandler.sendMessage("操作配置文件出错", "error");
        loadHandler.r("modJudgment");
      }
    },
    async spClickRT() {
      if (this.gameMode === "multi") return;
      btnPause.value === "暂停" && btnPause.click();
      if (shared.game.app.pauseNextTick)
        clearInterval(shared.game.app.pauseNextTick),
          (shared.game.app.pauseTime = 0),
          (shared.game.app.pauseNextTick = null);
      if (!this.noAccountMode) {
        try {
          loadHandler.l("正在上报 PhiZone 游玩配置", "playChart");
          const chartData = JSON.parse(sessionStorage.getItem("loadedChart"));
          shared.game.judgeManager.setJudgeTime();
          const resp = await phizoneApi.playChartEncrypted(
            this.gameConfig.account.tokenInfo.access_token,
            chartData.id,
            this.gameConfig.account.defaultConfigID
          );
          const res = await resp.json();
          shared.game.judgeManager.setJudgeTime(
            res.configuration.perfect_judgment / 1000,
            res.configuration.good_judgment / 1000,
            res.configuration.perfect_judgment / 2000
          );
          loadHandler.r("playChart");
        } catch (e) {
          loadHandler.r("playChart");
          shared.game.msgHandler.failure("错误：无法与服务器通讯");
          return;
        }
      }
      btnPlay.click();
      btnPlay.click();
    },
    async playChart() {
      if (this.gameMode !== "multi" && !this.noAccountMode) {
        try {
          loadHandler.l("正在上报 PhiZone 游玩配置", "playChart");
          await phizoneApi.patchSpecConfiguration(
            shared.game.ptmain.gameConfig.account.tokenInfo.access_token,
            shared.game.ptmain.gameConfig.account.defaultConfigID,
            {
              music_speed: shared.game.app.speed,
            }
          );
          const chartData = JSON.parse(sessionStorage.getItem("loadedChart"));
          shared.game.judgeManager.setJudgeTime();
          const resp = await phizoneApi.playChartEncrypted(
            this.gameConfig.account.tokenInfo.access_token,
            chartData.id,
            this.gameConfig.account.defaultConfigID
          );
          const res = await resp.json();
          shared.game.judgeManager.setJudgeTime(
            res.configuration.perfect_judgment / 1000,
            res.configuration.good_judgment / 1000,
            res.configuration.perfect_judgment / 2000
          );
          loadHandler.r("playChart");
        } catch (e) {
          loadHandler.r("playChart");
          shared.game.msgHandler.failure("错误：无法与服务器通讯");
          return;
        }
      }

      this.$router.replace({ path: "/playing", query: { auto: 1 } });
    },
    async playFinished() {
      const shouldNotUploadPhiZone = this.noAccountMode;
      const isMulti = shared.game.ptmain.gameMode === "multi";
      if (!shouldNotUploadPhiZone) {
        scoreLoadingAndResultData.display = true;
        scoreLoadingAndResultData.text = "正在上传成绩";
        scoreLoadingAndResultData.startTime = null;
        scoreLoadingAndResultData.loaded = 0;
      } else {
        scoreLoadingAndResultData.display = false;
      }
      const uploadPhizone = () => {
        return new Promise(async (res) => {
          if (shouldNotUploadPhiZone) {
            res(true);
            return;
          }

          const stat = shared.game.stat;
          const chartData = JSON.parse(sessionStorage.getItem("loadedChart"));
          const pzStat = {
            chart: chartData.id,
            max_combo: stat.maxcombo,
            perfect: stat.noteRank[4] + stat.noteRank[5] + stat.noteRank[1],
            good_early: stat.noteRank[7],
            good_late: stat.noteRank[3],
            bad: stat.noteRank[6],
            miss: stat.noteRank[2],
          };
          phizoneApi
            .recordEncrypted(
              this.gameConfig.account.tokenInfo.access_token,
              pzStat
            )
            .then((e) => {
              this.gameConfig.account.userBasicInfo = e.player;
              scoreLoadingAndResultData.text = `EXP+${e.exp_delta} RKS+${(
                e.player.rks - e.former_rks
              ).toFixed(3)}`;
              scoreLoadingAndResultData.data = {
                name: this.gameConfig.account.userBasicInfo.username,
                rks: e.player.rks.toFixed(3),
                exp: e.player.exp,
              };
              scoreLoadingAndResultData.loaded = 1;
              res(true);
            })
            .catch(async (e) => {
              loadHandler.r("uploadScore");
              if (
                !(await msgHandler.confirm("成绩上传失败，是否重试？", "错误"))
              ) {
                res(true);
                scoreLoadingAndResultData.display = false;
                return;
              }
              await uploadPhizone();
              res(true);
            });
        });
      };
      await uploadPhizone();
      if (isMulti) {
        shared.game.multiInstance.uploadScore();
      }
    },
    async playerLoaded() {
      // 恢复保存的设置并使其生效
      const userSettings = localStorage["PhiTogetherSettings"];
      let upgrade = false;
      if (userSettings) {
        const parsed = JSON.parse(userSettings);
        for (const item of Object.keys(ptmain.gameConfig)) {
          if (item in parsed) ptmain.gameConfig[item] = parsed[item];
          else upgrade = true;
        }
        if (upgrade)
          localStorage["PhiTogetherSettings"] = JSON.stringify(
            ptmain.gameConfig
          );
      } else {
        localStorage["PhiTogetherSettings"] = JSON.stringify(ptmain.gameConfig);
      }
      for (const item of Object.keys(ptmain.gameConfig)) {
        const val = ptmain.gameConfig[item];
        if (item == "volume") {
          shared.game.app.musicVolume = Math.min(1, 1 / val);
          shared.game.app.soundVolume = Math.min(1, val);
        } else if (item == "aspectRatio") {
          shared.game.stage.resize(Number(val));
        } else if (item == "noteScale") {
          shared.game.app.setNoteScale(Number(val));
        } else if (item == "backgroundDim") {
          shared.game.app.brightness = Number(val);
        } else if (item == "highLight") {
          shared.game.app.multiHint = val;
        } else if (item == "lowRes") {
          shared.game.app.setLowResFactor(val ? 0.5 : 1);
        }
      }

      // 请求通知权限以便发送通知
      if (!this.gameConfig.notifyFinished) {
        let onerr = (e) => {
          msgHandler.sendMessage(
            "您拒绝了通知请求或您的设备不支持后台通知，PhiTogether 将无法在后台通知您多人游戏的最新信息。",
            "error",
            false
          );
          this.gameConfig.notifyFinished = true;
        };
        if ("Notification" in self) {
          if (
            await msgHandler.confirm(
              "您是否同意 PhiTogether 在后台给您推送通知？（我们只使用此权限推送多人游戏最新动态）"
            )
          ) {
            Notification.requestPermission()
              .then(() => {
                this.gameConfig.notifyFinished = true;
              })
              .catch(onerr);
          } else onerr();
        } else onerr();
      }

      // 版本更新
      try {
        const resp = await fetch(`/api/multi/getLatestVersion`);
        const result = await resp.json();
        if (window.thisVersion != result.ver) {
          const spl1 = window.thisVersion.split("."),
            spl2 = result.ver.split(".");
          if (
            await msgHandler.confirm(
              `将从本地版本 v${window.thisVersion} 更新到最新版本 v${result.ver}，用时最长可能达一分钟，现在更新吗？`
            )
          ) {
            caches.delete(`PTv0-Main`).then(() => location.reload(true));
            return;
          } // else initOnline();
        }
      } catch (e) {
        msgHandler.sendMessage("自动更新检查失败", "error");
      }

      const mainCtn = document.querySelector("div.main");

      const requestFullscreen = async () => {
        if (!full.enabled || isAppleDevice) {
          msgHandler.sendMessage(
            "您的设备或浏览器不支持 PhiTogether 进入全屏模式，您的游戏体验可能受到影响",
            "error"
          );
          return;
        }
        if (isAppleDevice) {
          msgHandler.sendMessage(
            "检测到您使用的是苹果设备，为防止吃音等问题，iPhone 推荐使用QQ浏览器，iPad 推荐使用夸克HD浏览器。",
            "info"
          );
        }
        if (!full.check(mainCtn)) {
          await msgHandler.info(
            "PhiTogether 需要在全屏状态下运行，请点击下方按钮使 PhiTogether 全屏",
            "提示",
            "点击全屏"
          );
          full.toggle(mainCtn);
        }
      };

      document.addEventListener("fullscreenchange", () => {
        if (full.check(mainCtn)) {
          if (this.$route.path === "/playing") {
            if (!shared.game.app.isFull) shared.game.doFullScreen();
          }
        } else requestFullscreen();
      });

      document.addEventListener("visibilitychange", () => {
        if (document.visibilityState === "visible") {
          requestFullscreen();
        }
      });

      setTimeout(requestFullscreen, 500);

      const account = this.gameConfig.account;
      if (account.tokenInfo && account.userBasicInfo) {
        loadHandler.l("正在自动登录到PhiZone", "login");
        phizoneApi
          .refreshLogin(
            account.userBasicInfo.username,
            account.tokenInfo.refresh_token,
            "refresh_token"
          )
          .then(async (e) => {
            account.tokenInfo = e;
            await this.loadUserRelatedInfo(e.access_token);
          })
          .catch((e) => {
            loadHandler.r("login");
            msgHandler.sendMessage(
              "自动登录失败，您已进入离线模式。您可以正常离线游玩，但所有记录将不会被保存。若要重新上线，请尝试刷新页面或重新登录。",
              "error"
            );
          });
      } else loadHandler.r("loadRes");

      stage.style.display = "none";
    },
    loadUserRelatedInfo(access_token) {
      loadHandler.l("正在更新用户信息", "login");
      return new Promise((res, rej) => {
        const account = this.gameConfig.account;
        phizoneApi
          .getUserBasicInfo(access_token)
          .then(async (e) => {
            account.userBasicInfo = e;
            phizoneApi.getUserConfigurations(access_token).then(async (e) => {
              try {
                const avt = await fetch(account.userBasicInfo.avatar);
                const buf = await avt.arrayBuffer();
                drawRes["avatar"] = await createImageBitmap(new Blob([buf]));

                this.noAccountMode = false;
                if (!account.defaultConfigID) account.defaultConfigID = e[0].id;
                else {
                  const idx = e.findIndex(
                    (f) => f.id == account.defaultConfigID
                  );
                  if (idx == -1) account.defaultConfigID = e[0].id;
                }
                msgHandler.sendMessage(
                  `${account.userBasicInfo.username}，欢迎登入 PhiTogether！`,
                  "info",
                  true
                );
                res(true);
              } catch {
                rej(false);
              } finally {
                loadHandler.r("login");
              }
            });
          })
          .catch((e) => {
            loadHandler.r("login");
            rej(false);
          });
      });
    },
    chartLoadedCB() {
      const cleanStr = (i) => {
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
      };
      const chartInfo = JSON.parse(sessionStorage.getItem("loadedChart"));
      const songInfo = JSON.parse(sessionStorage.getItem("chartDetailsData"));
      const inputName = $("input-name");
      const inputArtist = $("input-artist");
      const inputCharter = $("input-charter");
      const inputIllustrator = $("input-illustrator");
      const selectDifficulty = $("select-difficulty");
      const selectLevel = $("select-level");
      inputName.value = songInfo.name;
      inputIllustrator.value = songInfo.illustrator;
      inputArtist.value = songInfo.composer;
      inputCharter.value = cleanStr(chartInfo.charter);
      selectLevel.value =
        chartInfo.difficulty === 0
          ? "?"
          : Math.floor(chartInfo.difficulty).toString();
      selectDifficulty.value = chartInfo.level;
      shared.game.updateLevelText(0);
      shared.game.updateLevelText(1);
      let saved;
      saved = localStorage.getItem("PTSavedOffsets");
      if (saved) {
        saved = JSON.parse(saved);
        if (saved[chartInfo.id]) this.chartOffsetSurface = saved[chartInfo.id];
        else this.chartOffsetSurface = 0;
      }
      this.externalHooks.chartLoaded &&
        this.externalHooks.chartLoaded(songInfo, chartInfo);
    },
    loadChart(songInfo, chartInfo, callback) {
      let resources = [
        songInfo.illustration +
          `?type=illustration&for=${encodeURIComponent(songInfo.id)}`,
        songInfo.song +
          `?type=song&id=${encodeURIComponent(
            songInfo.id
          )}&name=${encodeURIComponent(
            songInfo.name
          )}&edition=${encodeURIComponent(
            songInfo.edition
          )}&composer=${encodeURIComponent(
            songInfo.composer
          )}&illustrator=${encodeURIComponent(
            songInfo.illustrator
          )}&bpm=${encodeURIComponent(
            songInfo.bpm
          )}&duration=${encodeURIComponent(
            songInfo.duration
          )}&preview_start=${encodeURIComponent(songInfo.preview_start)}`,
        chartInfo.chart +
          `?type=chart&id=${encodeURIComponent(
            chartInfo.id
          )}&for=${encodeURIComponent(songInfo.id)}&level=${encodeURIComponent(
            chartInfo.level
          )}&difficulty=${encodeURIComponent(
            chartInfo.difficulty
          )}&charter=${encodeURIComponent(
            chartInfo.charter
          )}&notes=${encodeURIComponent(chartInfo.notes)}`,
      ];
      sessionStorage.setItem("loadedChart", JSON.stringify(chartInfo));
      sessionStorage.setItem("chartDetailsData", JSON.stringify(songInfo));
      this.externalHooks.chartLoaded = callback;
      // 清 加载完的东西
      const selectbg = $("select-bg");
      const selectbgm = $("select-bgm");
      const selectchart = $("select-chart");
      while (selectbg.options.length) selectbg.options.remove(0);
      while (selectchart.options.length) selectchart.options.remove(0);
      while (selectbgm.options.length) selectbgm.options.remove(0);

      //if (this.isMulti) this.chartLoaded = false; // 多人模式：标记谱面未加载
      const resNum = resources.length;
      let loaded = 0;
      uploader.reset(resNum);
      Promise.all(
        resources.map((e) => {
          const url = e;
          return fetch(url).then(async (e) => {
            loaded++;
            loadHandler.l(`获取文件：${loaded}/${resNum}`, "loadChart");
            return e;
          });
        })
      )
        .then(async (responses) => {
          for (const response of responses) {
            uploader.onload(
              { target: { result: await response.arrayBuffer() } },
              { name: response.url }
            );
          }
        })
        .catch((e) => {
          msgHandler.sendMessage("加载失败", "error"),
            loadHandler.r("loadChart");
        });
    },
  },
});

const graphicHandler = {
  wpHookList: [],
  resultHookList: [],
  whilePlayingHook: function (ctx, ctxos, lineScale) {
    for (let i = 0; i < this.wpHookList.length; i++) {
      this.wpHookList[i](ctx, ctxos, lineScale);
    }
  },
  resultHook: function (ctx, ctxos) {
    for (let i = 0; i < this.resultHookList.length; i++) {
      this.resultHookList[i](ctx, ctxos);
    }
  },
  register: function (hookType, hookContent) {
    if (hookType == "whilePlayingHook") {
      this.wpHookList.push(hookContent);
    } else if (hookType == "resultHook") {
      this.resultHookList.push(hookContent);
    }
  },
};

let scoreLoadingAndResultData = {
  text: "正在上传成绩",
  loaded: 0,
  startTime: null,
  display: false,
  data: null,
};

function drawRoundRect(ctx, x, y, w, h, r) {
  if (w < 2 * r) {
    r = w / 2;
  }
  if (h < 2 * r) {
    r = h / 2;
  }
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
  return ctx;
}

graphicHandler.register("resultHook", function (ctx, ctxos) {
  if (!scoreLoadingAndResultData.display) return;

  if (!scoreLoadingAndResultData.startTime) {
    scoreLoadingAndResultData.startTime = performance.now();
  }
  (ctxos.shadowBlur = 20), (ctxos.shadowColor = "#000000");

  const now = performance.now();

  let text = scoreLoadingAndResultData.text;
  let tmp = (now - scoreLoadingAndResultData.startTime) % 2000;
  const cond1 = now < scoreLoadingAndResultData.loaded;
  if (scoreLoadingAndResultData.loaded === 1) {
    scoreLoadingAndResultData.loaded = now + 2000 - tmp;
    if (tmp > 1000) tmp = 2000 - tmp;
    text = "正在上传成绩";
  } else if (scoreLoadingAndResultData.loaded === 0 || cond1) {
    if (tmp > 1000) tmp = 2000 - tmp;
    if (cond1) text = "正在上传成绩";
  } else {
    tmp = now - scoreLoadingAndResultData.loaded;
    if (tmp > 1000) tmp = 1000;
  }

  const mt = ctxos.measureText(text);

  var spec = {
    length: mt.width + 350,
    baseY: 975,
  };

  drawRoundRect(
    ctxos,
    960 - spec.length / 2,
    spec.baseY - 40,
    spec.length,
    80,
    30
  );
  ctxos.fillStyle = "#000000";
  ctxos.globalAlpha = (tmp / 1000) * 0.5;
  ctxos.fill();

  ctxos.fillStyle = "#fff";
  ctxos.textBaseline = "middle";
  ctxos.textAlign = "center";
  ctxos.font = "35px Custom,Noto Sans SC";
  ctxos.globalAlpha = tmp / 1000;
  ctxos.fillText(text, 960, spec.baseY + 5);
});

graphicHandler.register("resultHook", function (ctx, ctxos) {
  if (!scoreLoadingAndResultData.display) return;
  const now = performance.now();
  const cond1 = now < scoreLoadingAndResultData.loaded;
  if (
    scoreLoadingAndResultData.loaded === 1 ||
    scoreLoadingAndResultData.loaded === 0 ||
    cond1
  ) {
    return;
  } else {
    ctxos.globalAlpha = ctxos.globalAlpha * 0.5;
  }

  const data = scoreLoadingAndResultData.data;
  const bit = drawRes.avatar;

  const spec = { baseY: 40 };
  ctxos.font = "60px Custom,Noto Sans SC";
  const nameMeasured = ctxos.measureText(data.name).width;
  ctxos.font = "30px Custom,Noto Sans SC";
  const rksMesaured = ctxos.measureText(data.rks).width;
  const expMeasured = ctxos.measureText(data.exp).width;
  spec.length = 205 + nameMeasured + Math.max(expMeasured, rksMesaured);
  spec.baseX = 960 - spec.length / 2;

  drawRoundRect(ctxos, spec.baseX, spec.baseY, spec.length, 100, 30);
  ctxos.fillStyle = "#000000";
  ctxos.fill();

  ctxos.globalAlpha = ctxos.globalAlpha * 2;

  let imgWidthAct, imgHeightAct;
  if (bit.width > bit.height) {
    (imgWidthAct = (80 / bit.height) * bit.width), (imgHeightAct = 80);
  } else {
    (imgHeightAct = (80 / bit.width) * bit.height), (imgWidthAct = 80);
  }
  ctxos.beginPath();
  ctxos.arc(spec.baseX + 20 + 40, spec.baseY + 10 + 40, 40, 0, Math.PI * 2);
  ctxos.closePath();
  ctxos.save();
  ctxos.clip();
  ctxos.drawImage(
    bit,
    spec.baseX + 20 - (imgWidthAct - 80) / 2,
    spec.baseY + 10 - (imgHeightAct - 80) / 2,
    imgWidthAct,
    imgHeightAct
  );
  ctxos.restore();
  ctxos.font = "50px Custom,Noto Sans SC";
  ctxos.fillStyle = "#fff";
  ctxos.textAlign = "left";
  ctxos.fillText(data.name, spec.baseX + 155, spec.baseY + 58);
  ctxos.font = "30px Custom,Noto Sans SC";
  ctxos.fillText(data.rks, spec.baseX + 175 + nameMeasured, spec.baseY + 75);
  ctxos.fillText(data.exp, spec.baseX + 175 + nameMeasured, spec.baseY + 35);
});

ptAppInstance.use(router);

const multiPlayerInstance = Vue.createApp(multiplayerframe);
multiPlayerInstance.mount("#multiplayer");

const ptmain = ptAppInstance.mount("#app");

//全局暴露
shared.game.ptmain = ptmain;
shared.game.msgHandler = msgHandler;
shared.game.loadHandler = loadHandler;
shared.game.graphicHandler = graphicHandler;
shared.game.init = true;
self.shared = shared;

const $ = (q) => document.getElementById(q);
const stage = $("stage");
const btnPlay = $("btn-play");
const btnPause = $("btn-pause");
// if (!navigator.onLine) {
//   updateChartSelectorFromCache().then(() => {
//     multi.offlineMode = true;
//     multi.myAlert(
//       ["已自动进入离线模式，您将只能游玩已经缓存到本地的谱面！"],
//       null,
//       null,
//       false
//     );
//   });
// } else {
//   async function initOnline() {
//   fetch(`/api/multi/getLatestVersion`)
//     .then((response) => response.json())
//     .then(async (result) => {
//       if (window.thisVersion != result.ver) {
//         const spl1 = window.thisVersion.split("."),
//           spl2 = result.ver.split(".");
//         if (spl1[0] === spl2[0] && spl1[1] === spl2[1]) {
//           if (
//             await multi.confirmAs([
//               `将从本地版本 v${window.thisVersion}i 更新到最新版本 v${result.ver}i，本次更新仅更新谱面内容，将执行快速更新，现在更新吗？`,
//             ])
//           ) {
//             caches
//               .open(`${window.cacheStorageKey}Main`)
//               .then((e) => e.delete("/"))
//               .then(async () => {
//                 location.reload(true);
//               });
//           } else initOnline();
//         } else {
//           if (
//             await multi.confirmAs([
//               `将从本地版本 v${window.thisVersion}i 更新到最新版本 v${result.ver}i，本次更新将更新游戏本体程序，用时最长可能达一分钟，现在更新吗？`,
//             ])
//           ) {
//             caches
//               .delete(`${window.cacheStorageKey}Main`)
//               .then(() => location.reload(true));
//           } else initOnline();
//         }
//       } else initOnline();
//     });
// }
