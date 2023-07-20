import shared from '../../utils/js/shared.js?ver=1.3.2h8';
import releaseNotes from './releaseNotes.js?ver=1.3.2h8';
export default {
    name: 'changelogs',
    data() {
        return {
            ver: spec.thisVersion,
            vt: 0,
        };
    },
    template: `
    <div id="changelogs">
        <h1>更新日志</h1>
        <div v-for="update in releaseNotes">
        <h2>{{update.ver}} - {{update.time}}</h2>
        <ul>
            <li v-for="note in update.notes">{{note}}</li>
        </ul>
        </div>
    </div>  
  
  `,
    computed: {
        releaseNotes() { return releaseNotes.releaseNotes }
    },
    methods: {

    },
};
