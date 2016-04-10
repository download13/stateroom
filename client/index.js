'use strict';

Object.defineProperty(exports, "__esModule", {
	value: true
});
exports.RoomClient = undefined;

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol ? "symbol" : typeof obj; };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _constants = require('../common/constants');

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var WEBSOCKET_OPEN = 1;

var RoomClient = exports.RoomClient = function () {
	function RoomClient(ws) {
		_classCallCheck(this, RoomClient);

		this.id = null;

		this._ws = ws;
		this._stateCache = Object.create(null);
		this._states = Object.create(null);
		this._subscribers = [];

		// A message comes from the server as JSON
		// [fromId, cmdCode, arguments]
		// [null, 0, ['bestIdInTheWorld']] adds a member with the id bestIdInTheWorld
		ws.onmessage = this._handleMessage.bind(this);
		ws.onopen = this._flushLocalState.bind(this);
	}

	_createClass(RoomClient, [{
		key: 'set',
		value: function set(key, value) {
			var valueType = typeof value === 'undefined' ? 'undefined' : _typeof(value);
			if (valueType !== 'string' && valueType !== 'number') {
				throw new Error('Value must be a string or number');
			}

			this._stateCache[key] = value;
			this._flushLocalState();
		}
	}, {
		key: 'delete',
		value: function _delete(key) {
			if (key in this._stateCache) {
				this._stateCache[key] = undefined;
				this._flushLocalState();
			}
		}
	}, {
		key: 'clear',
		value: function clear() {
			this._stateCache = Object.create(null);
			this._sendCmd(_constants.CMD_CLEAR);
		}
	}, {
		key: 'setOwnState',
		value: function setOwnState(state) {
			this._stateCache = state;
			this._flushLocalState();
		}
	}, {
		key: 'getState',
		value: function getState() {
			return this._states;
		}
	}, {
		key: 'subscribe',
		value: function subscribe(fn) {
			var _this = this;

			this._subscribers.push(fn);
			fn();

			return function () {
				var pos = _this._subscribers.indexOf(fn);
				if (pos !== -1) {
					_this._subscribers.splice(pos, 1);
				}
			};
		}
	}, {
		key: '_emitChanged',
		value: function _emitChanged() {
			this._subscribers.forEach(function (fn) {
				try {
					fn();
				} catch (e) {
					console.log('Error while emitting subscriber event', e);
				}
			});
		}
	}, {
		key: '_flushLocalState',
		value: function _flushLocalState() {
			var _this2 = this;

			if (this._ws.readyState !== WEBSOCKET_OPEN) return;

			var stateCache = this._stateCache;

			Object.keys(stateCache).forEach(function (key) {
				var value = stateCache[key];

				if (value === undefined) {
					_this2._sendCmd(_constants.CMD_DELETE, [key]);
				} else {
					_this2._sendCmd(_constants.CMD_SET, [key, value]);
				}

				delete stateCache[key];
			}, this);
		}
	}, {
		key: '_sendCmd',
		value: function _sendCmd(cmd, args) {
			this._ws.send(JSON.stringify([cmd, args]));
		}
	}, {
		key: '_handleMessage',
		value: function _handleMessage(e) {
			var data = null;
			try {
				data = JSON.parse(e.data);
			} catch (err) {
				console.error('Invalid JSON sent from StateRoom server: ' + e.data);
				return;
			}

			var _data = data;

			var _data2 = _slicedToArray(_data, 3);

			var fromId = _data2[0];
			var cmd = _data2[1];
			var args = _data2[2];

			var state = this._states[fromId];

			if (cmd === _constants.CMD_ADD_CLIENT) {
				var _args = _slicedToArray(args, 1);

				var id = _args[0];

				if (!this.id) {
					// This should be the first message it sees as a new member
					this.id = id;
				}
				this._states = _extends({}, this.states, _defineProperty({}, id, Object.create(null)));
				this._emitChanged();
			} else if (cmd === _constants.CMD_REMOVE_CLIENT) {
				var _args2 = _slicedToArray(args, 1);

				var _id = _args2[0];

				this._states = _extends({}, this._states);
				delete this._states[_id];
				this._emitChanged();
			} else if (cmd === _constants.CMD_SET) {
				var _args3 = _slicedToArray(args, 2);

				var key = _args3[0];
				var value = _args3[1];

				this._states = _extends({}, this._states, _defineProperty({}, fromId, _extends({}, state, _defineProperty({}, key, value))));
				this._emitChanged();
			} else if (cmd === _constants.CMD_DELETE) {
				var _args4 = _slicedToArray(args, 1);

				var _id2 = _args4[0];

				var newState = _extends({}, state);
				delete newState[_id2];
				this._states = _defineProperty({}, fromId, newState);
				this._emitChanged();
			} else if (cmd === _constants.CMD_CLEAR) {
				this._states = _extends({}, this._states, _defineProperty({}, fromId, Object.create(null)));
				this._emitChanged();
			}
		}
	}]);

	return RoomClient;
}();