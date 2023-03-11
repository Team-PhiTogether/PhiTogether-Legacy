let total = 0;
importScripts(...location.hash.substring(1).split(','));
/** @param {{name:string,path:string,buffer:ArrayBuffer}} data */
function readZip(data) { //JSZip
	JSZip.loadAsync(data.buffer, { checkCRC32: true, decodeFileName: string }).then(zip => {
		console.log(zip);
		const arr = Object.values(zip.files).filter(i => !i.dir);
		total += arr.length - 1;
		arr.forEach(async i => {
			const buffer = await i.async('arraybuffer');
			return readZip({ name: i.name, path: `${data.path}/${i.name}`, buffer });
		});
	}, () => self.postMessage({ data, total }, [data.buffer]));
}
/** @param {BufferSource} bfs */
function string(bfs) {
	const labels = ['gbk', 'big5', 'shift_jis'];
	for (const label of labels) {
		const decoder = new TextDecoder(label, { fatal: true });
		try {
			return decoder.decode(bfs);
		} catch (e) {
			if (label === labels[labels.length - 1]) throw e;
		}
	}
}
self.addEventListener('message', msg => readZip((total++, msg.data)));