import shared from "../../utils/js/shared.js?ver=1.3.2h8";
import { checkLocalChart } from '../cachemanage/cacheutils.js?ver=1.3.2h8';
export const replayMgr = {
    replaying: false,
    playerInfo: {
        avatar: "https://res.phi.zone/user/default.webp",
        username: "PTPlayer",
        id: -1,
    },
    data: {},
    speedInfo: null,
    async loadChartFirst(info) {
        this.speedInfo = info.speedInfo;

        if (info.songData.song.startsWith('/PTVirtual/charts')) {
            // 本地谱面
            const check = await checkLocalChart(info.songData.id);
            if (!check) {
                shared.game.msgHandler.failure(`未在您的本地谱面库中找到 ${info.songData.name} 的谱面 ${info.chartData.id}，无法播放该游玩记录`);
                return;
            }
        }

        shared.game.loadHandler.l('正在加载谱面', 'loadChart');
        shared.game.ptmain.loadChart(
            info.songData,
            info.chartData,
            this.loadChartSecond
        );
    },
    loadChartSecond(songInfo, chartInfo) {
        document.getElementById('select-speed').selectedIndex = replayMgr.speedInfo.val;
        const dict = {
            Slowest: -9,
            Slower: -4,
            '': 0,
            Faster: 3,
            Fastest: 5,
        };
        shared.game.app.speed = 2 ** (dict[replayMgr.speedInfo.disp] / 12);
        replayMgr.replaying = true;
        shared.game.loadHandler.r("loadChart");
        shared.game.ptmain.$router.push({ path: '/playing', query: { auto: 1 } });
    },
    read(data) {
        try {
            let d = data.slice(0, -32);
            let dmd5 = data.slice(-32);
            d = atob(d);
            if (md5(d) !== dmd5) {
                shared.game.msgHandler.failure("无法播放：无效的游玩记录文件");
            }
            d = JSON.parse(d);
            this.playerInfo = JSON.parse(decodeURIComponent(d.playerInfo));
            this.data = d.data;
            this.loadChartFirst(JSON.parse(decodeURIComponent(d.chartInfo)));
        } catch (e) {
            shared.game.msgHandler.failure("无法播放：无效的游玩记录文件");
        }
    },
}