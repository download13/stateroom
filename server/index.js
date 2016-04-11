'use strict';

Object.defineProperty(exports, "__esModule", {
	value: true
});

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

exports.createRoom = createRoom;
exports.createRoomManager = createRoomManager;

var _constants = require('../common/constants');

var _common = require('../common');

var _redux = require('redux');

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

function createRoom() {
	var store = (0, _redux.createStore)(roomReducer);
	var clients = new Set();

	function broadcast(message) {
		//console.log('Room broadcast', message)
		clients.forEach(function (client) {
			client.send(message);
		});
	}

	return {
		addClient: function addClient(joiningClient) {
			clients.add(joiningClient);
			//console.log('server CMD_SET_ID', joiningClient.id)
			joiningClient.send([_constants.CMD_SET_ID, joiningClient.id]);

			var state = store.getState();
			Object.keys(state).forEach(function (clientId) {
				joiningClient.send([_constants.CMD_SET, [clientId, state[clientId]]]);
			});

			store.dispatch({ type: 'ADD_CLIENT', payload: joiningClient.id });

			joiningClient.onCmd = function (delta) {
				store.dispatch({ type: 'CLIENT_SET', payload: [joiningClient.id, delta] });
				broadcast([_constants.CMD_SET, [joiningClient.id, delta]]);
				//console.log('onCmd broadcast', [joiningClient.id, delta])
			};
		},
		removeClient: function removeClient(partingClient) {
			clients.delete(partingClient);
			partingClient.destroy();

			store.dispatch({ type: 'REMOVE_CLIENT', payload: partingClient.id });
			broadcast([_constants.CMD_REMOVE_CLIENT, partingClient.id]);

			if (clients.size === 0 && this.onEmpty) {
				this.onEmpty();
			}
		}
	};
}

function roomReducer() {
	var state = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];
	var _ref = arguments[1];
	var type = _ref.type;
	var payload = _ref.payload;

	if (type === 'ADD_CLIENT') {
		return _extends({}, state, _defineProperty({}, payload, {}));
	} else if (type === 'REMOVE_CLIENT') {
		return (0, _common.trim)(_extends({}, state, _defineProperty({}, payload, null)));
	} else if (type === 'CLIENT_SET') {
		var _payload = _slicedToArray(payload, 2);

		var fromId = _payload[0];
		var delta = _payload[1];

		return _extends({}, state, _defineProperty({}, fromId, _extends({}, state[fromId], delta)));
	} else {
		return state;
	}
}

function createRoomManager() {
	var rooms = new Map();

	return {
		get: function get(name) {
			if (!rooms.has(name)) {
				var room = createRoom();
				room.onEmpty = function () {
					return rooms.delete(name);
				};
				rooms.set(name, room);
			}

			return rooms.get(name);
		}
	};
}