'use strict';

Object.defineProperty(exports, "__esModule", {
	value: true
});

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _uuidv = require('uuidv4');

var _uuidv2 = _interopRequireDefault(_uuidv);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var WebsocketClient = function () {
	function WebsocketClient(ws) {
		_classCallCheck(this, WebsocketClient);

		this.id = (0, _uuidv2.default)();

		this._ws = ws;

		ws.on('message', this._handleMessage.bind(this));
		// TODO: On close and error
	}

	_createClass(WebsocketClient, [{
		key: '_handleMessage',
		value: function _handleMessage(msg) {
			try {
				var _JSON$parse = JSON.parse(msg);

				var _JSON$parse2 = _slicedToArray(_JSON$parse, 2);

				var cmd = _JSON$parse2[0];
				var args = _JSON$parse2[1];

				if (this.onCmd) {
					this.onCmd(cmd, args);
				}
			} catch (e) {}
		}
	}, {
		key: 'sendCmd',
		value: function sendCmd(fromId, cmd, args) {
			this._ws.send(JSON.stringify([fromId, cmd, args]));
		}
	}, {
		key: 'destroy',
		value: function destroy() {
			this._ws.removeAllListeners('message');
			this._ws.close();
		}
	}]);

	return WebsocketClient;
}();

exports.default = WebsocketClient;