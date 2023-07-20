export const recordMgr = {
    data: {},
    playerInfo: {
        avatar:"https://res.phi.zone/user/default.webp",
        username:"PTPlayer",
        id: -1,
    },
    chartInfo: {},
    reset(playerInfo) {
        this.data={};
        if(playerInfo) {
            const {avatar, username, id} = playerInfo;
            this.playerInfo = {
                avatar,
                username,
                id,
            };
        }
        return this;
    },
    export() {
        const d={
            data: this.data,
            chartInfo: this.chartInfo,
            playerInfo: this.playerInfo,
        }
        const d2={
            data: this.data,
            chartInfo: encodeURIComponent(JSON.stringify(this.chartInfo)),
            playerInfo: encodeURIComponent(JSON.stringify(this.playerInfo)),
        }
        const o=JSON.stringify(d2);
        const m=md5(o);
        return [btoa(o)+m, d];
    },
    add(note) {
        if(note.statOffset || note.holdStart) {
            if([2,4].includes(note.type)) {this.data[note.name]=true;return;}
            this.data[note.name] = {
                s: note[note.type===3?"holdStart":"statOffset"]-note.realTime,//deltatime
                //realTime: note.realTime,
                //t: note.type,
                a: note[note.type===3?"holdStatus":"status"],
            }
            if(note.type === 3) this.data[note.name].q=note.status;
            if(note.type===3 && note.brokenTime) // hold
                this.data[note.name].e=note.brokenTime-note.realTime;
        }
    },
};