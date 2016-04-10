'use strict';

Object.defineProperty(exports, "__esModule", {
	value: true
});
exports.RoomManager = exports.Room = undefined;

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol ? "symbol" : typeof obj; };

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _constants = require('../common/constants');

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Room = exports.Room = function () {
	function Room() {
		var options = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];

		_classCallCheck(this, Room);

		this._countLimit = options.countLimit || Infinity;
		this._sizeLimit = options.sizeLimit || Infinity;
		this._states = new Map(); // Maps clients to states
	}

	_createClass(Room, [{
		key: 'addClient',
		value: function addClient(joiningClient) {
			// New member joins, initial state is blank
			this._states.set(joiningClient, new Map());

			// Tell current members about the new one
			// The newbie also learns it's own name the first time it hears it
			this._broadcast(null, _constants.CMD_ADD_CLIENT, [joiningClient.id]);

			// Send commands to bring it up to the current state
			this._states.forEach(function (state, client) {
				// Tell it about the existing members
				if (client !== joiningClient) {
					// The joining client already knows about itself
					joiningClient.sendCmd(null, _constants.CMD_ADD_CLIENT, [client.id]);
				}

				// And about the state of the existing members
				state.forEach(function (value, key) {
					joiningClient.sendCmd(client.id, _constants.CMD_SET, [k, v]);
				});
			});

			// Start handling commands from new member
			joiningClient.onCmd = this._handleClientCmd.bind(this, joiningClient);
		}
	}, {
		key: 'removeClient',
		value: function removeClient(partingClient) {
			partingClient.destroy();
			this._states.delete(partingClient);
			this._broadcast(null, _constants.CMD_REMOVE_CLIENT, [partingClient.id]);

			if (this._states.size === 0 && this.onEmpty) {
				this.onEmpty();
			}
		}
	}, {
		key: '_handleClientCmd',
		value: function _handleClientCmd(fromClient, cmd, args) {
			var state = this._states.get(fromClient);
			var applied = false;

			try {
				if (cmd === _constants.CMD_SET) {
					var _args = _slicedToArray(args, 2);

					var key = _args[0];
					var value = _args[1];

					var valueType = typeof value === 'undefined' ? 'undefined' : _typeof(value);
					if (state.size < this._countLimit && typeof key === 'string' && key.length < this._sizeLimit && (valueType === 'string' && value.length < this._sizeLimit || valueType === 'number')) {
						state.set(key, value);
						applied = true;
					}
				} else if (cmd === _constants.CMD_DELETE) {
					var _args2 = _slicedToArray(args, 1);

					var _key = _args2[0];

					if (typeof _key === 'string') {
						state.delete(_key);
						applied = true;
					}
				} else if (cmd === _constants.CMD_CLEAR) {
					state.clear();
					applied = true;
				}
			} catch (e) {}

			// Once applied, tell every client to execute this command on their state machines as well
			if (applied) {
				this._broadcast(fromClient.id, cmd, args);
			}
		}
	}, {
		key: '_broadcast',
		value: function _broadcast(fromId, cmd, args) {
			this._states.forEach(function (state, client) {
				client.sendCmd(fromId, cmd, args);
			});
		}
	}]);

	return Room;
}();

var RoomManager = exports.RoomManager = function () {
	function RoomManager(options) {
		_classCallCheck(this, RoomManager);

		this._options = options;
		this._rooms = new Map();
	}

	_createClass(RoomManager, [{
		key: 'get',
		value: function get(name) {
			var rooms = this._rooms;

			if (!rooms.has(name)) {
				var room = new Room(this._options);
				room.onEmpty = function () {
					return rooms.delete(name);
				};
				rooms.set(name, room);
			}

			return rooms.get(name);
		}
	}]);

	return RoomManager;
}();