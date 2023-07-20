import shared from '../../utils/js/shared.js?ver=1.3.2h8';
export default {
    name: 'aboutpage',
    data() {
        return {
            ver: spec.thisVersion,
            vt: 0,
        };
    },
    template: `
  <div id="about">
    <br>
    <div style="
        margin:auto; 
        font-size:2em; 
        font-weight:bold; 
        color:darkslategray; ">
        关于
    </div><br>
    <img id="aboutLogo" src="/static/src/core/lg512y512.png" style="margin-top:-40px"><br>
    <div style="line-height:1.2em;">
        <div style="font-size:1.5em;">PhiTogether v{{ver}}</div>
        <div style="color:grey;font-size:.85em;margin-top:10px;">{{ getLifeSpan }}</div><br><br>
        <div style="font-size:1.25em;">Made by <b>Team PhiTogether</b> with ❤️</div><br>
        <div style="font-size:1.08em;">Based on 
            <a target="_blank" href="https://github.com/lchzh3473/sim-phi" style="font-weight:bold; color:midnightblue;">
                sim-phi
            </a><br />
            Special thanks to
            <a target="_blank" href="https://space.bilibili.com/274753872" style="font-weight:bold; color:midnightblue;">
                @lchzh3473
            </a>&nbsp;
            <a target="_blank" href="https://space.bilibili.com/295247346" style="font-weight:bold; color:midnightblue;">
                @HERO-科艺-P
            </a>
        </div><br /><br />
        <div>@ Team PhiTogether</div>
        <div style="line-height:1.5em;">
            <a target="_blank" href="https://afdian.net/a/PhiTogether" style="font-weight:bold; color:orangered;">
                在爱发电支持我们
            </a>&nbsp;|&nbsp;
            <a target="_blank" href="https://github.com/Team-PhiTogether/PhiTogether-public" style="font-weight:bold; color:midnightblue;">
                Github 仓库
            </a><br /><br />
            策划：<a target="_blank" href="https://space.bilibili.com/343672879" style="font-weight:bold; color:midnightblue;">
                花降らし
            </a><br />
            开发：<a target="_blank" href="https://space.bilibili.com/343672879" style="font-weight:bold; color:midnightblue;">
                hxWulgc
            </a> | <a target="_blank" href="https://space.bilibili.com/544365132" style="font-weight:bold; color:midnightblue;">
                小翁同学
            </a> | <a target="_blank" href="https://space.bilibili.com/484759721" style="font-weight:bold; color:midnightblue;">
                飞机上的长电视
            </a><br />
            美术：<a target="_blank" href="https://space.bilibili.com/483612966" style="font-weight:bold; color:midnightblue;">
                卡西_Quasimodo
            </a> | <a target="_blank" href="https://space.bilibili.com/544365132" style="font-weight:bold; color:midnightblue;">
                kev1nweng
            </a> | <a target="_blank" href="https://space.bilibili.com/484759721" style="font-weight:bold; color:midnightblue;">
            realtvop
        </a><br />
            音效：<a target="_blank" href="https://space.bilibili.com/544365132" style="font-weight:bold; color:midnightblue;">
                Weng.
            </a><br />
            特效：<a target="_blank" href="https://space.bilibili.com/343672879" style="font-weight:bold; color:midnightblue;">
                cgluWxh
            </a><br /><br />
            并在此感谢所有为此项目提出宝贵建议的玩家和共建者们！<br />
            <b>此项目与&nbsp;
                厦门鸽游网络有限公司
                &nbsp;没有任何关系
            </b><br /><br />
            <b style="font-size:1.25em;">
                友情链接
            </b><br>
            <a target="_blank" href="https://www.pigeongames.cn/" style="font-weight:bold; color:midnightblue;">
                Pigeon Games 鸽游
            </a>&nbsp;|&nbsp;
            <a target="_blank" href="https://phi.zone/" style="font-weight:bold; color:midnightblue;">
                PhiZone
            </a>
            &nbsp;|&nbsp;
            <a target="_blank" href="https://www.phigrim.cn/" style="font-weight:bold; color:midnightblue;">
                Phigrim
            </a><br />
            <a target="_blank" href="https://starsriver.uotan.cn/" style="font-weight:bold; color:midnightblue;">
                星河的博客
            </a>
            &nbsp;|&nbsp;
            <a target="_blank" href="https://www.jizhiku.net/" style="font-weight:bold; color:midnightblue;">
                机智库
            </a><br />
        </div>
    </div>
</div>
  `,
    computed: {
        getLifeSpan() {
            let launchDate = new Date('March 11, 2023 20:20:00');
            let timeNow = new Date();
            let elapsedTime = (timeNow - launchDate) / 1000;
            let elapsedDays = Math.ceil(elapsedTime) / 86400;
            // console.log(elapsedTime);
            return `自上线起已运行 ${Math.round(elapsedDays)} 天`;
        },
    },
    methods: {

    },
};
