"use strict";

Object.defineProperty(exports, "__esModule", {
	value: true
});
exports.trim = trim;
exports.createId = createId;
function trim(obj) {
	Object.keys(obj).forEach(function (key) {
		if (obj[key] == null) {
			delete obj[key];
		}
	});
	return obj;
}

function createId() {
	return Math.random().toString(36).substring(2, 16);
}