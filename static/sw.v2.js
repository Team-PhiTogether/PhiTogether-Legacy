'use strict';
var cacheStorageKey = 'PTv0-';

const CORE = ['/'];

self.db = {
    read: (key, config) => {
        if (!config) {
            config = { type: 'text' };
        }
        return new Promise((resolve, reject) => {
            caches
                .match(new Request(`https://LOCALCACHE/${encodeURIComponent(key)}`))
                .then(function (res) {
                    res.text().then((text) => resolve(text));
                })
                .catch(() => {
                    resolve(null);
                });
        });
    },
    write: (key, value) => {
        return new Promise((resolve, reject) => {
            caches
                .open(`${cacheStorageKey}SwDB`)
                .then(function (cache) {
                    cache.put(
                        new Request(`https://LOCALCACHE/${encodeURIComponent(key)}`),
                        new Response(value)
                    );
                    resolve();
                })
                .catch(() => {
                    reject();
                });
        });
    },
};

function parseURL(url) {
    let tmp = url.substr(url.indexOf('//') + 2);
    let host = tmp.substr(0, tmp.indexOf('/'));
    let tmp2 = tmp.substr(tmp.indexOf('/'));
    let qm = tmp2.indexOf('?');
    let path, queryParam;
    if (qm < 0) {
        path = tmp2;
        queryParam = undefined;
    } else {
        path = tmp2.substr(0, qm);
        queryParam = tmp2.substr(qm);
    }

    return {
        path,
        host,
        queryParam,
    };
}

function cacheFirst(request, key) {
    return caches.open(key).then((cache) => {
        return cache.match(request, { ignoreSearch: true, ignoreVary: true }).then((response) => {
            return (
                response ||
                fetch(request).then((response) => {
                    if (response.ok) cache.put(request, response.clone());
                    return response;
                })
            );
        });
    });
}

function onlineFirst(request, key) {
    return caches.open(key).then((cache) => {
        const offlineFetch = () => {
            return cache.match(request).then((response) => {
                return response;
            });
        };
        if (!navigator.onLine) return offlineFetch;
        return fetch(request)
            .then((response) => {
                if (response.ok) cache.put(request, response.clone());
                return response;
            })
            .catch(offlineFetch);
    });
}

self.addEventListener('install', (e) => {
    e.waitUntil(
        caches.open(cacheStorageKey + 'Main').then(function (cache) {
            return cache.addAll(CORE);
        })
    );
    self.skipWaiting();
});

self.addEventListener('fetch', async function (e) {
    const urlParsed = parseURL(e.request.url);
    const urlOri = e.request.url;
    if (urlOri.startsWith('http')) {
        if (urlParsed.host === 'res.phi.zone' || urlParsed.host === 'pzres.uotan.cn' || (urlParsed.path.startsWith('/PTVirtual/')) || (urlParsed.path.startsWith('/static/src/core/charts/'))) {
            if (urlParsed.path.startsWith('/user/') || (urlParsed.path.startsWith('/PTVirtual/user/'))) {
                e.respondWith(cacheFirst(e.request, cacheStorageKey + 'User'));
                return;
            }
            e.respondWith(cacheFirst(e.request, cacheStorageKey + 'Charts'));
            return;
        } else if (urlParsed.host === "ptc.realtvop.eu.org" || urlParsed.host === "chart.phitogether.fun") {
            if (!urlParsed.path.includes("songs.json")) e.respondWith(cacheFirst(e.request, cacheStorageKey + 'Charts'));
            return;
        } else if (['api.phi.zone', "ud.realtvop.eu.org", 'qrcode.realtvop.eu.org'].includes(urlParsed.host)) {
            return;
        } else if (urlParsed.host.endsWith("realtvop.eu.org") && !urlParsed.host.includes("tin")) {
            e.respondWith(cacheFirst(e.request, cacheStorageKey + 'Res-' + urlParsed.host));
            return;
        } else if (!urlParsed.path.startsWith('/api/')) {
            if (urlParsed.path.startsWith('/#/')) {
                e.respondWith(cacheFirst('/', cacheStorageKey + 'Main'));
                return;
            }
            e.respondWith(cacheFirst(e.request, cacheStorageKey + 'Main'));
            return;
        }
    }
    return;
});
self.addEventListener('activate', function (e) {
    e.waitUntil(
        caches
            .keys()
            .then((cacheNames) => {
                return Promise.all(
                    cacheNames
                        .filter((cacheNames) => {
                            return !cacheNames.startsWith(cacheStorageKey);
                        })
                        .map((cacheNames) => {
                            return caches.delete(cacheNames);
                        })
                );
            })
            .then(() => {
                return self.clients.claim();
            })
    );
});
