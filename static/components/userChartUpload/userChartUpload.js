// 保存自行上传的谱面

import shared from "../../utils/js/shared.js?ver=1.3.2h8";
import { renderPZApiFromCache } from "../cachemanage/cacheutils.js?ver=1.3.2h8";
export default {
  name: "chartupload",
  template: `
  <div id="cacheManage" class="routerRealPage">
    <div class="cacheUnit" style="padding: 10px;">
      <h3>上传本地谱面</h3>
      <p>请点击【加载本地文件】按钮选择本地谱面添加到 PhiTogether（一个 zip 内只能含有一个谱面文件，若有额外资源，请先选择额外资源再上传谱面本体包）。<br>在一般情况下，PhiTogether 会自动完成谱面的添加。<br>如果无法自动填充信息，您可能需要手动填写信息后点击下方【添加入库】按钮添加。<br>如果您选择了错误的文件，请点击【重置填写】按钮。</p><br />
      <p style="color:red;" v-if="this.target">您需要上传的谱面为 {{targetInfo.name}} {{targetInfo.level}} {{targetInfo.difficulty}} by {{targetInfo.charter}}（谱面md5：{{target}}）请确保上传正确谱面。</p>
      额外资源：<input name="extraResource" type="file" id="extraResource"><br /><br />
      <input type="button" id="add_library" class="disabled" value="添加入库" @click="userChartUploaded()">
      <input type="button" value="重置填写" @click="clearStatAll()">
    </div>  
  </div>
    `,
  data() {
    return {
      target: null,
      targetInfo: {
        name: '',
        level: '',
        difficulty: 0,
        charter: '',
      },
      extraResource: null,
    };
  },
  computed: {},
  async mounted() {
    if (this.$route.query.target) {
      const songInfo = JSON.parse(sessionStorage.getItem('chartDetailsData'));
      const chartInfo = JSON.parse(sessionStorage.getItem('loadedChart'));
      this.targetInfo.name = songInfo.name;
      this.targetInfo.level = chartInfo.level;
      this.targetInfo.difficulty = chartInfo.difficulty;
      this.targetInfo.charter = chartInfo.charter;
      this.target = this.$route.query.target;
    }
    shared.game.userChartUploaded = this.userChartUploaded;
    this.clearStatAll();
    const _this = this;
    const extra = $id('extraResource');
    extra.onchange = () => {
      const i = extra.files[0];
      const reader = new FileReader();
      reader.readAsArrayBuffer(i);
      reader.onload = (evt) => {
        _this.extraResource = evt.target.result;
      }
    }
  },
  // deactivated() {
  //     shared.game.loadHandler.r();
  // },
  methods: {
    clearStatAll() {
      const selectbg = $id("select-bg");
      const selectbgm = $id("select-bgm");
      const selectchart = $id("select-chart");
      const inputName = $id("input-name");
      const inputArtist = $id("input-artist");
      const inputCharter = $id("input-charter");
      const inputIllustrator = $id("input-illustrator");
      const selectDifficulty = $id("select-difficulty");
      const selectLevel = $id("select-level");
      selectbg.value = selectbgm.value = selectchart.value = inputName.value = inputArtist.value = inputCharter.value = inputIllustrator.value = selectDifficulty.value = selectLevel.value = '';
      shared.game.clearStat();
      hook.uploader.reset();
      $id('extraResource').value = ""
      this.extraResource = null;
    },
    async userChartUploaded() {
      $id('add_library').classList.remove('disabled');
      const selectbg = $id("select-bg");
      const selectbgm = $id("select-bgm");
      const selectchart = $id("select-chart");
      const inputName = $id("input-name");
      const inputArtist = $id("input-artist");
      const inputCharter = $id("input-charter");
      const inputIllustrator = $id("input-illustrator");
      const selectDifficulty = $id("select-difficulty");
      const selectLevel = $id("select-level");
      if (hook.chartsMD5.size > 1) { this.clearStatAll(); return shared.game.msgHandler.sendMessage("错误：不支持含有多张谱面的zip", 'error'); }
      if (!selectchart.value)
        return shared.game.msgHandler.sendMessage("错误：未选择任何谱面", 'error');
      if (!selectbgm.value) return shared.game.msgHandler.sendMessage("错误：未选择任何音乐", 'error');
      if (!selectbg.value) return shared.game.msgHandler.sendMessage("错误：未选择任何图片", 'error');

      if (
        !inputName.value ||
        !inputArtist.value ||
        !inputIllustrator.value ||
        !inputCharter.value ||
        !selectDifficulty.value ||
        !selectLevel.value
      ) if (await shared.game.msgHandler.confirm("您未填写完所有信息，要将未填写信息全部使用“unknown”代替吗？")) {
        inputName.value = inputName.value || "unknown";
        inputArtist.value = inputArtist.value || "unknown";
        inputIllustrator.value = inputIllustrator.value || "unknown";
        inputCharter.value = inputCharter.value || "unknown";
        selectDifficulty.value = selectDifficulty.value || "SP";
        selectLevel.value = selectLevel.value || "?";
      } else return;

      // 拼接url
      const md5 = hook.chartsMD5.get(hook.selectchart.value);

      // 校验
      if (this.target && md5 !== this.target) {
        shared.game.msgHandler.failure(`您上传的文件 ${md5} 与要求上传的谱面 ${this.target} 不符，请更换文件后重试。`)
        this.clearStatAll();
        return;
      }


      const chartURL = `/PTVirtual/charts/${md5}/chart.json?type=chart&id=${md5}&for=${md5}&level=${encodeURIComponent(
        selectDifficulty.value
      )}&difficulty=${encodeURIComponent(
        selectLevel.value
      )}&charter=${encodeURIComponent(
        inputCharter.value
      )}&notes=${encodeURIComponent('不可用')}`
      const songURL = `/PTVirtual/charts/${md5}/audio.mp3?type=song&id=${md5}&name=${encodeURIComponent(
        inputName.value
      )}&edition=${encodeURIComponent(
        '用户上传'
      )}&composer=${encodeURIComponent(
        inputArtist.value
      )}&illustrator=${encodeURIComponent(
        inputIllustrator.value
      )}&bpm=${encodeURIComponent(
        '不可用'
      )}&duration=${encodeURIComponent(
        '不可用'
      )}&preview_start=${encodeURIComponent('00:00:00')}`;
      const illustrationURL = `/PTVirtual/charts/${md5}/illustration.png?type=illustration&for=${md5}`

      const cache = await caches.open('PTv0-Charts');

      const selectedChart = hook.oriBuffers.get(selectchart.value);
      const selectedBg = hook.oriBuffers.get(selectbg.value);
      const selectedBgm = hook.oriBuffers.get(selectbgm.value);

      const tryMatch = await cache.match(chartURL, { ignoreSearch: true, ignoreVary: true });
      if (tryMatch) {
        shared.game.msgHandler.sendMessage("此谱面已添加", 'error');
        return;
      }

      const mimeTable = {
        mp3: 'audio/mpeg',
        mp4: 'video/mp4',
        zip: 'application/zip',
        ogg: 'audio/ogg',
        m4a: 'audio/mp4',
        png: 'image/png',
        jpg: 'image/jpeg',
        jpeg: 'image/jpeg',
        tiff: 'image/tiff',
        tif: 'image/tiff',
      }

      let mimeSong = 'audio/mpeg', mimeIll = 'image/png';
      let extSong = selectbgm.value.split('.'), extIll = selectbg.value.split('.');
      extSong = extSong[extSong.length - 1], extIll = extIll[extIll.length - 1];
      if (extSong in mimeTable) mimeSong = mimeTable[extSong];
      if (extIll in mimeTable) mimeIll = mimeTable[extIll];

      await cache.put(chartURL, new Response(new Blob([selectedChart], { type: 'application/json' })))
      await cache.put(songURL, new Response(new Blob([selectedBgm], { type: mimeSong })))
      await cache.put(illustrationURL, new Response(new Blob([selectedBg], { type: mimeIll })))

      if (this.extraResource) {
        const resURL = `/PTVirtual/charts/${md5}/assets.zip?type=assets&for=${md5}&id=${md5}`
        await cache.put(resURL, new Response(new Blob([this.extraResource], { type: 'application/zip' })))
      }

      shared.game.msgHandler.sendMessage('添加成功！')

      if (!this.target) {
        this.$router.back();
      } else {
        function goNext() {
          const chartData = JSON.parse(sessionStorage.getItem('loadedChart'))
          const songData = JSON.parse(sessionStorage.getItem('chartDetailsData'))
          shared.game.multiInstance.loadChartSecond(songData, chartData)
          shared.game.ptmain.$router.replace({
            path: '/chartDetails',
            query: { toSyncOrPlay: 3 },
          });
        }
        if (this.extraResource) {
          shared.game.userChartUploaded = goNext;
          hook.uploader.fireLoad(
            { name: "assets.zip" },
            this.extraResource,
          );
        } else goNext();
      }

    },
  },
};

const $id = (e) => document.getElementById(e);
