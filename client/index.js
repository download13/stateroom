'use strict';

Object.defineProperty(exports, "__esModule", {
	value: true
});

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol ? "symbol" : typeof obj; };

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

exports.createClient = createClient;

var _constants = require('../common/constants');

var _common = require('../common');

var _redux = require('redux');

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

var WEBSOCKET_OPEN = 1;

function createClient(ws) {
	var store = (0, _redux.createStore)(serverUpdateReducer);

	ws.onmessage = function (e) {
		var data = null;
		try {
			data = JSON.parse(e.data);
		} catch (err) {
			console.error('Invalid JSON sent from server: ' + e.data);
			return;
		}

		var _data = data;

		var _data2 = _slicedToArray(_data, 2);

		var cmd = _data2[0];
		var args = _data2[1];

		store.dispatch({ type: cmd, payload: args });
	};
	ws.onopen = flushSetCache;

	function flushSetCache() {
		var _store$getState = store.getState();

		var cache = _store$getState.cache;

		if (ws.readyState === WEBSOCKET_OPEN && Object.keys(cache).length > 0) {
			ws.send(JSON.stringify(cache));
			store.dispatch({ type: 'FLUSH_CACHE_TO_PENDING' });
		}
	}

	return {
		set: function set(key, value) {
			var state = store.getState();
			var pendingState = state.pending;
			var ourState = state.users[state.id] || {};
			var delta = typeof key === 'string' ? _defineProperty({}, key, value) : key;

			Object.keys(delta).forEach(function (key) {
				var value = delta[key];
				if (value === pendingState[key] || // Already sent to server
				value === ourState[key] && !pendingState.hasOwnProperty(key) // Already on server and we're not trying to delete it
				) {
						delete delta[key];
					}
			});

			store.dispatch({ type: 'ADD_TO_CACHE', payload: delta });
			flushSetCache();
		},
		getState: function getState() {
			var state = store.getState();
			return {
				id: state.id,
				users: state.users
			};
		},
		subscribe: function subscribe(fn) {
			store.subscribe(fn);
		}
	};
}

var initialState = {
	id: null,
	users: {},
	pending: {},
	cache: {}
};

function serverUpdateReducer() {
	var state = arguments.length <= 0 || arguments[0] === undefined ? initialState : arguments[0];
	var _ref2 = arguments[1];
	var type = _ref2.type;
	var payload = _ref2.payload;

	if (type === _constants.CMD_SET_ID) {
		console.log('CMD_SET_ID', payload);
		return _extends({}, state, {
			id: payload,
			users: _extends({}, state.users, _defineProperty({}, payload, {}))
		});
	} else if (type === _constants.CMD_REMOVE_CLIENT) {
		return _extends({}, state, {
			users: (0, _common.trim)(_extends({}, state.users, _defineProperty({}, payload, null)))
		});
	} else if (type === _constants.CMD_SET) {
		var _ret = function () {
			var _payload = _slicedToArray(payload, 2);

			var userId = _payload[0];
			var delta = _payload[1];

			var newPending = _extends({}, state.pending);
			Object.keys(delta).forEach(function (key) {
				if (delta[key] === newPending[key]) {
					delete newPending[key];
				}
			});
			return {
				v: _extends({}, state, {
					users: _extends({}, state.users, _defineProperty({}, userId, (0, _common.trim)(_extends({}, state.users[userId], delta)))),
					pending: newPending
				})
			};
		}();

		if ((typeof _ret === 'undefined' ? 'undefined' : _typeof(_ret)) === "object") return _ret.v;
	} else if (type === 'ADD_TO_CACHE') {
		return _extends({}, state, {
			cache: _extends({}, state.cache, payload)
		});
	} else if (type === 'FLUSH_CACHE_TO_PENDING') {
		return _extends({}, state, {
			pending: state.cache,
			cache: {}
		});
	} else {
		return state;
	}
}