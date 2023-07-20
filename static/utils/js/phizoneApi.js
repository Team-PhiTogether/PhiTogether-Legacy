import shared from './shared.js?ver=1.3.2h8';

const API_PATH = {
    auth: '/auth/token/',
    userDetail: '/user_detail/',
    playChart: '/player/play/',
    record: '/records/',
    best: '/best_records/',
    configurations: '/player/configurations/',
};

const getApi = (e) => "https://api.phi.zone" + API_PATH[e];

export default {
    refreshLogin(user, credential, type) {
        return new Promise(async (res, rej) => {
            try {
                var myHeaders = new Headers();

                var formdata = new FormData();
                formdata.append(
                    'client_id',
                    'zOQaWAHlX0E0Wh8m7gZP6hmmX8Zkfyh4rGmok1Xf'
                );
                formdata.append(
                    'client_secret',
                    'zHJ6L9HbfUEdFxxlRuO3I1EBQNLtnInLqk9e3pKPqcO4y39L3Rf9S0wLdn355WOx9Qlqtj3JrNYsiCiDRPmwh8hUOW6kpgRlS6tza3XzhNN8w51fgEXZrCrRsqgpcElA'
                );
                formdata.append('grant_type', type);
                formdata.append('username', user);
                formdata.append(type, credential);

                var requestOptions = {
                    method: 'POST',
                    body: formdata,
                    headers: myHeaders,
                };

                const response = await fetch(getApi('auth'), requestOptions);
                const result = await response.json();

                if (result.access_token) {
                    res(result);
                } else {
                    if (result.error_description) rej(result.error_description);
                    else rej('未知错误');
                }
            } catch (error) {
                rej('网络连接不畅，请稍后重试');
            }
        });
    },
    getUserBasicInfo(access_token) {
        return new Promise(async (res, rej) => {
            try {
                var myHeaders = new Headers();

                myHeaders.append('Authorization', `Bearer ${access_token}`);

                var requestOptions = {
                    method: 'GET',
                    headers: myHeaders,
                };

                const response = await fetch(getApi('userDetail'), requestOptions);
                let result = await response.json();
                result.isPTDeveloper = ["400c3241004b5db7ca7f5abfef2794f2", "19f3cd308f1455b3fa09a282e0d496f4", "46771d1f432b42343f56f791422a4991", "21e4ef94f2a6b23597efabaec584b504", "ca460332316d6da84b08b9bcf39b687b", "aa97d584861474f4097cf13ccb5325da"].includes(md5(`${result.id}`));

                if (result.username) {
                    res(result);
                } else {
                    if (result.detail) rej(result.detail);
                    else rej('未知错误');
                }
            } catch (error) {
                rej('网络连接不畅，请稍后重试');
            }
        });
    },
    getUserConfigurations(access_token) {
        return new Promise(async (res, rej) => {
            try {
                var myHeaders = new Headers();

                myHeaders.append('Authorization', `Bearer ${access_token}`);

                var requestOptions = {
                    method: 'GET',
                    headers: myHeaders,
                };

                const response = await fetch(getApi('configurations'), requestOptions);
                const result = await response.json();

                if (result.results) {
                    res(result.results);
                } else {
                    rej('未知错误');
                }
            } catch (error) {
                rej('网络连接不畅，请稍后重试');
            }
        });
    },
    getSpecConfiguration(access_token, id) {
        return new Promise(async (res, rej) => {
            try {
                var myHeaders = new Headers();

                myHeaders.append('Authorization', `Bearer ${access_token}`);

                var requestOptions = {
                    method: 'GET',
                    headers: myHeaders,
                };

                const response = await fetch(getApi('configurations') + `${id}/`, requestOptions);
                const result = await response.json();

                if (result) {
                    res(result);
                } else {
                    rej('未知错误');
                }
            } catch (error) {
                rej('网络连接不畅，请稍后重试');
            }
        });
    },
    patchSpecConfiguration(access_token, id, data) {
        return new Promise(async (res, rej) => {
            try {
                var myHeaders = new Headers();

                myHeaders.append('Authorization', `Bearer ${access_token}`);

                var form = new FormData();

                for (const t in data) {
                    form.append(t, data[t]);
                }

                var requestOptions = {
                    method: 'PATCH',
                    body: form,
                    headers: myHeaders,
                };

                await fetch(getApi('configurations') + `${id}/`, requestOptions);


                const result = await this.getUserConfigurations(access_token);
                shared.game.ptmain.gameConfig.account.defaultConfigID = result[result.length - 1].id;
                shared.game.ptmain.gameConfig.account.defaultConfig = result[result.length - 1];

                requestOptions.method = 'DELETE';

                fetch(getApi('configurations') + `${id}/`, requestOptions);
                if (result) {
                    res(result);
                } else {
                    rej('未知错误');
                }
            } catch (error) {
                rej('网络连接不畅，请稍后重试');
            }
        });
    },
    playChartEncrypted(access_token, chart, config) {
        return new Promise(async (res, rej) => {
            try {
                const result = await GoPZPlayChart(chart.toString(), config.toString(), access_token);

                if (result) {
                    res(result);
                } else {
                    rej('未知错误');
                }
            } catch (error) {
                rej('网络连接不畅，请稍后重试');
            }
        });
    },
    recordEncrypted(access_token, data) {
        return new Promise((res, rej) => {
            GoPZRecord(data, access_token)
                .then(e => e.json())
                .then((e) => {
                    res(e);
                })
                .catch(e => {
                    rej(e);
                });
        });
    },
    getRecords(access_token, chart = null, page = null, link = null) {
        return new Promise(async (res, rej) => {
            try {
                var myHeaders = new Headers();

                myHeaders.append('Authorization', `Bearer ${access_token}`);

                var requestOptions = {
                    method: 'GET',
                    headers: myHeaders,
                };

                if (!link) link = getApi('record') + `?chart=${chart}&order=-score&query_player=1&page=1`;
                else link = link.replace(/https?:\/\/api.phi.zone/, "https://api.phi.zone");

                const response = await fetch(link, requestOptions);
                const result = await response.json();

                if (result) {
                    res(result);
                } else {
                    rej('未知错误');
                }
            } catch (error) {
                rej('网络连接不畅，请稍后重试');
            }
        });

    },
    getPlayerB20(access_token, user) {
        return new Promise(async (res, rej) => {
            try {
                var myHeaders = new Headers();

                myHeaders.append('Authorization', `Bearer ${access_token}`);

                var requestOptions = {
                    method: 'GET',
                    headers: myHeaders,
                };

                const response = await fetch(getApi('best') + `?user=${user}&query_song=1`, requestOptions);
                const result = await response.json();

                if (result) {
                    res(result);
                } else {
                    rej('未知错误');
                }
            } catch (error) {
                rej('网络连接不畅，请稍后重试');
            }
        });
    },
};
