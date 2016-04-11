export function trim(obj) {
	Object.keys(obj).forEach(key => {
		if(obj[key] == null) {
			delete obj[key];
		}
	});
	return obj;
}

export function createId() {
	return Math.random().toString(36).substring(2, 16);
}
