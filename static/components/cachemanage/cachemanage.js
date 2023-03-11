import shared from "../../utils/js/shared.js";
import { renderPZApiFromCache } from "./cacheutils.js";
export default {
  name: "cacheManage",
  data() {
    return {
      cacheList: [],
    };
  },
  template: `
  <div id="cacheManage" class="routerRealPage">
    <div class="cacheUnit" style="padding: 10px;">
      <h3>全部缓存管理</h3>
      <input type="button" value="删除全部谱面" @click="clearAll('charts')">
      <input type="button" value="强制版本更新" @click="clearAll('self')"><br />
      <input type="button" value="清空 PhiTogether 数据" @click="clearAll('all')">
    </div>
    <div class="cacheUnit" v-for="cache in cacheList">
        <h3>{{cache.name?cache.name:"孤立"}}的缓存文件</h3>
        <input type="button" @click="deleteCacheAll(cache)" value="删除本组" >
        <div class="cacheTable">
            <div class="chartListChartItem">
                <div class="file">文件</div>
                <div class="type">类型</div>
                <div class="play">操作</div>
            </div>
            <div class="chartListChartItem" v-if="cache.song">
                <div class="file">{{getFileNameGeneral(cache.song)}}</div>
                <div class="type">音乐</div>
                <div class="play"><input type="button" @click="deleteCache(cache.song)" value="删除" ></div>
            </div>
            <div class="chartListChartItem" v-if="cache.illustration">
                <div class="file">{{getFileNameGeneral(cache.illustration)}}</div>
                <div class="type">曲绘</div>
                <div class="play"><input type="button" @click="deleteCache(cache.illustration)" value="删除" ></div>
            </div>
            <div class="chartListChartItem" v-for="chart in cache.charts">
                <div class="file">{{getFileNameGeneral(chart.chart)}}</div>
                <div class="type">谱面 {{chart.level}} {{chart.difficulty}}</div>
                <div class="play"><input type="button" @click="deleteCache(chart.chart)" value="删除" ></div>
            </div>
        </div>
    </div>
  </div>
  `,
  async activated() {
    this.cacheList = await renderPZApiFromCache();
  },
  computed: {},
  methods: {
    getFileNameGeneral(i) {
      const t = i.split("/");
      return decodeURIComponent(t[t.length - 1]);
    },
    async deleteCache(i) {
      await this._deleteCacheInArray([i]);
      shared.game.msgHandler.sendMessage("删除成功");
      this.cacheList = await renderPZApiFromCache();
    },
    async deleteCacheAll(i) {
      let lst = [];
      if (i.song) lst.push(i.song);
      if (i.illustration) lst.push(i.illustration);
      if (i.charts) {
        for (let j = 0; j < i.charts.length; j++) {
          if (i.charts[j].chart) lst.push(i.charts[j].chart);
        }
      }
      await this._deleteCacheInArray(lst);
      shared.game.msgHandler.sendMessage("删除成功");
      this.cacheList = await renderPZApiFromCache();
    },
    clearAll(t) {
      switch(t) {
        case "charts":
          caches.delete("PTv0-Charts")
            .then(()=>{
              location.reload()
            })
          break
        case "self":
          caches.delete("PTv0-Main")
            .then(()=>{
              location.reload()
            })
          break
        case "all":
          caches.delete("PTv0-Main")
            .then(()=>{
              caches.delete("PTv0-Charts")
                .then(()=>{
                  caches.delete("PTv0-User")
                    .then(()=>{
                      shared.game.msgHandler.success("PhiTogether 已完成移除在您设备上存储的所有数据，请直接关闭 PhiTogether，在您下次打开 PhiTogether 时仍会在您设备上缓存新的数据！")
                    })
                })
            })
          break
      }
    },
    _deleteCacheInArray(i) {
      return new Promise((res) => {
        caches
          .open(`PTv0-Charts`)
          .then(async (e) => {
            for (let j = 0; j < i.length; j++) {
              await e.delete(i[j], { ignoreSearch: true });
            }
            return;
          })
          .then(() => {
            res(true);
          });
      });
    },
  },
};
