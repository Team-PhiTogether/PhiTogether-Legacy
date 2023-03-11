import shared from "../../utils/js/shared.js";
export default {
  name: "aboutpage",
  data() {
    return {
      ver: thisVersion,
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
    <img id="aboutLogo" src="/static/src/core/lg512y512.png" style="margin-top:-15px"><br>
    <div style="line-height:1.2em;">
        <div style="font-size:1.5em;">PhiTogether v{{ver}}</div><br><br>
        <div style="font-size:1.25em;">Made by <b>Team PhiTogether</b> with ❤️</div><br>
        <div style="font-size:1.08em;">Based on 
            <a target="_blank" href="https://github.com/lchzh3473/sim-phi" style="font-weight:bold; color:midnightblue;">
                sim-phi
            </a>
            ; Special thanks to
            <a target="_blank" href="https://space.bilibili.com/274753872" style="font-weight:bold; color:midnightblue;">
                @lchzh3473
            </a>&nbsp;
            <a target="_blank" href="https://space.bilibili.com/295247346" style="font-weight:bold; color:midnightblue;">
                @HERO-科艺-P
            </a>
        </div><br /><br />
        <div>@ Team PhiTogether</div><br>
        <div style="line-height:1.5em;">
            <a target="_blank" href="https://afdian.net/a/PhiTogether" style="font-weight:bold; color:midnightblue;">
                在爱发电支持我们！
            </a><br /><br />
            策划：<a target="_blank" href="https://space.bilibili.com/343672879" style="font-weight:bold; color:midnightblue;">
                花降らし
            </a><br />
            开发：<a target="_blank" href="https://space.bilibili.com/343672879" style="font-weight:bold; color:midnightblue;">
                hxWulgc
            </a> | <a target="_blank" href="https://space.bilibili.com/544365132" style="font-weight:bold; color:midnightblue;">
                小翁同学
            </a><br />
            美术：<a target="_blank" href="https://space.bilibili.com/483612966" style="font-weight:bold; color:midnightblue;">
                卡西_Quasimodo
            </a> | <a target="_blank" href="https://space.bilibili.com/544365132" style="font-weight:bold; color:midnightblue;">
                kev1nweng
            </a><br />
            音效：<a target="_blank" href="https://space.bilibili.com/544365132" style="font-weight:bold; color:midnightblue;">
                Weng.
            </a><br />
            特效：<a target="_blank" href="https://space.bilibili.com/343672879" style="font-weight:bold; color:midnightblue;">
                cgluWxh
            </a><br /><br />
            并在此感谢所有为此项目提出宝贵建议的玩家和共建者们！<br />
            <b>此项目与&nbsp;
                <a href="https://www.pigeongames.cn/">
                厦门鸽游网络有限公司
                </a>
                &nbsp;没有任何关系
            </b>
        </div>
    </div>
</div>
  `,
  methods: {},
};
