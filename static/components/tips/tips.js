// Tips 数组
const tipsArray = [
    '玩家把官方未来要开发的东西都开发完了.jpg',
    '别人是 PhiTogether，我是 FalseAlone',
    'PhiTogether 的持续运行需要你的支持！快来关于页面的爱发电支持我们吧',
    '打完歌右下角点两下退出全屏，别问了别问了（悲',
    '你可以在 status.phitogether.fun 查看服务器状态',
    '我知道加载很慢，但是你先别急',
    '歪哎而抗姆 突 发哎突荄泽儿',
    '数学作业 AT Lv.17',
    '你说得对，但是 PhiTogether 是一款后面忘了',
    '如果你的设备锁在 30 帧可能是开省电模式了',
    '你说有没有一种可能，多人模式可以单人玩',
    '听说你的 PhiZone API 密钥是 2FcA9R67jZZpXZcPG',
    '欢迎来 PT 的 Github 账号看我们堆出来的答辩',
    '热知识：房间 ID 可以是任意字符，但是不能包含 $',
    '救命写不出 Tips 了',
    '正在重新连接到地球OL',
    'Tip: Tip: Tip: Tip: Tip:',
    '与 Phigrim 合作多人游戏可能性微存',
    'const HairCount = 114514 - elapsedDayCount;',
    '我保留了 PT 中的网页元素，这样你才知道你玩的其实是 Phigros 模拟器',
    '苹果设备没声音？控制中心里小铃铛点一下!',
    '玩久了记得让眼睛和手腕放松一下',
    '我超，劲爆',
    'www.皮在一起.fun',
    '标准大气压下，直角90度，开水100度，那么开水是钝角',
    '标准大气压下，开水100度，直角90度，那么直角没烧开',
    '三倍!☆ ice cream!!★~',
    'Are you ready! Yooooooooo—',
    '冷知识:本模拟器退出方式和lchzh3473的一样哦',
    '这是什么？更新？阿巴阿巴……',
    '当你在打PT的时候，一定在打PT吧！',
    '大家好啊，今天给大家来点想看的东西',
    'PhiTogether 服务器的运行成本在每个月 200r 左右',
    '设置里可以选择另一个风格的结算背景音乐',
    '设置里勾选 使用思源黑体 能使你找回熟悉的感觉(?',
    '求求你们更新版浏览器',
    '苹果设备老是弹出撤销怎么办，去辅助功能=>触控里关掉摇动以撤销就好啦！',
    '使用PT在线资源包甚至可以自定义打击音效！',
    'PhiTogether iOS App的游玩记录下载链接每天只能生成1000次，先到先得，珍惜使用',
    'PhiTogether 是可以开启谱面镜像的！只需在点击播放前在谱面镜像处选择开启即可',
    '单人游戏时双击左下角可以转板',
    function () {
        if (spec.isPhiTogetherApp) {
            return '诶？！你竟然在用 PhiTogether App！';
        } else if (spec.isAppleDevice) {
            return '让我猜猜，你用的一定是苹果设备!';
        } else {
            return '让我猜猜，你用的一定是安卓或PC!';
        }
    },
    function () {
        function getLifeSpan() {
            let launchDate = new Date('March 11, 2023 20:20:00');
            let timeNow = new Date();
            let elapsedTime = (timeNow - launchDate) / 1000;
            let elapsedDays = Math.ceil(elapsedTime) / 86400;
            // console.log(elapsedTime);
            return Math.round(elapsedDays);
        }
        return `当你看到这条 Tip 的时候，PT 已经苟活了 ${getLifeSpan()} 天`;
    },
    function (info) {
        return `让我猜猜，现在上面的字是 ${info} !`;
    }
];

export const tipsHandler = {
    getTip: function (info) {
        // 从 tipsArray 中随机抽取元素作为返回的 Tip
        let chosenArray = tipsArray.concat(partyMgr.filter.activateTips());
        let randTipRaw = chosenArray[Math.floor(Math.random() * chosenArray.length)];
        let randTipGot;
        if (typeof randTipRaw == 'function') {
            try {
                randTipGot = randTipRaw(info);
            } catch (e) {
                randTipGot = '这里本来应该显示一条动态生成的 Tip，但是出了一些小问题，所以你看到了我（';
            }
        } else {
            randTipGot = randTipRaw;
        }
        console.log('Got tip: ' + randTipGot);
        return ('Tip: ' + randTipGot);
    },
    addTip: function (tip) {
        tipsArray.push(tip);
        return;
    }
};
