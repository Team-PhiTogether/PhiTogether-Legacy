function removeSearch(i) {
    i = i.substr(0, i.indexOf('?'));
    const k = i.indexOf('/PTVirtual/charts');
    if (k > 0) i = i.slice(k);
    return i;
}

export async function checkLocalChart(md5) {
    const chartURL = `/PTVirtual/charts/${md5}/chart.json`

    const cache = await caches.open('PTv0-Charts');
    let tryMatch = await cache.match(chartURL, { ignoreSearch: true, ignoreVary: true })
    if (!tryMatch) return false;
    return true;
}

export async function renderPZApiFromCache(additionKey) {
    const cache = await caches.open('PTv0-Charts' + additionKey);
    const keys = await cache.keys();
    let tmp = {};
    let assetUrl;
    let qidx;
    let numfor;
    for (const request of keys) {
        const url = request.url;
        const parsed = parseURL(url);
        if (parsed.queryParam) {
            const query = getQueryObject(parsed.queryParam);
            if (query.type) {
                switch (query.type) {
                    case 'illustration':
                        if (!url.includes("PTVirtual")) {
                            numfor = parseInt(query.for)
                            if (!isNaN(numfor)) query.for = numfor;
                        }
                        if (!(query.for in tmp))
                            tmp[query.for] = {};
                        tmp[query.for]['illustration'] = removeSearch(url);
                        break;
                    case 'song':
                        query.song = removeSearch(url);
                        if (!url.includes("PTVirtual")) {
                            numfor = parseInt(query.id)
                            if (!isNaN(numfor)) query.id = numfor;
                        }
                        if (!(query.id in tmp))
                            tmp[query.id] = query;
                        else
                            tmp[query.id] = Object.assign(tmp[query.id], query);
                        break;
                    case 'chart':
                        query.chart = removeSearch(url);
                        numfor = parseFloat(query.difficulty)
                        if (!isNaN(numfor)) query.difficulty = numfor;
                        if (!url.includes("PTVirtual")) {
                            numfor = parseInt(query.for)
                            if (!isNaN(numfor)) query.for = numfor;
                            numfor = parseInt(query.id)
                            if (!isNaN(numfor)) query.id = numfor;
                        }
                        if (!(query.for in tmp)) tmp[query.for] = {};
                        if (tmp[query.for].charts) {
                            qidx = tmp[query.for].charts.findIndex(x => x.id === query.id);
                            if (qidx != -1) {
                                tmp[query.for].charts[qidx] = Object.assign(tmp[query.for].charts[qidx], query);
                            } else {
                                tmp[query.for].charts.push(query);
                            }
                        } else tmp[query.for].charts = [query];
                        break;
                    case 'assets':
                        assetUrl = removeSearch(url);
                        if (!url.includes("PTVirtual")) {
                            numfor = parseInt(query.id)
                            if (!isNaN(numfor)) query.id = numfor;
                            numfor = parseInt(query.for)
                            if (!isNaN(numfor)) query.for = numfor;
                        }
                        if (!(query.for in tmp)) tmp[query.for] = {};
                        if (tmp[query.for].charts) {
                            qidx = tmp[query.for].charts.findIndex(x => x.id === query.id);
                            if (qidx != -1) {
                                tmp[query.for].charts[qidx].assets = assetUrl;
                            } else {
                                tmp[query.for].charts.push({
                                    id: query.id,
                                    assets: assetUrl
                                });
                            }
                        } else tmp[query.for].charts = [{
                            id: query.id,
                            assets: assetUrl
                        }];
                }
            }
        }
    }
    return Object.values(tmp);
}

export function changeUserChartURL(oldName, newName) {
    return new Promise(async function (reslove, reject) {
        try {
            const cache = await caches.open('PTv0-Charts');
            const response = await cache.match(oldName, { ignoreSearch: true, ignoreVary: true });
            const cachedFile = response.clone();

            await cache.put(newName, cachedFile);
            await cache.delete(oldName);
            reslove();
        } catch (e) {
            reject();
        }
    });
}


export function deleteCacheInArray(i) {
    return new Promise((res) => {
        caches
            .open('PTv0-Charts')
            .then(async (e) => {
                for (let j = 0; j < i.length; j++) {
                    await e.delete(i[j], { ignoreSearch: true, ignoreVary: true });
                }
                return;
            })
            .then(() => {
                res(true);
            });
    });
}