function removeSearch(i) {
    return i.substr(0, i.indexOf("?"));
}
export async function renderPZApiFromCache() {
    const cache=await caches.open("PTv0-Charts");
    const kys=await cache.keys();
    let tmp={};
    for(const request of kys) {
        const url=request.url;
        const parsed=parseURL(url);
        if(parsed.queryParam) {
            const query=getQueryObject(parsed.queryParam);
            if(query.type) {
                switch(query.type) {
                    case "illustration":
                        if(!(query.for in tmp)) tmp[query.for]={};
                        tmp[query.for]["illustration"]=removeSearch(url);
                        break;
                    case "song":
                        query.song=removeSearch(url);
                        if(!(query.id in tmp)) tmp[query.id]=query;
                        else tmp[query.id]=Object.assign(tmp[query.id], query);
                        break;
                    case "chart":
                        query.chart=removeSearch(url);
                        if(!(query.for in tmp)) tmp[query.for]={};
                        if(tmp[query.for].charts) tmp[query.for].charts.push(query)
                        else tmp[query.for].charts=[query];
                        break;
                }
            }
        }
    }
    return Object.values(tmp);
}