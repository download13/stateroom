'use strict';

Object.defineProperty(exports, "__esModule", {
	value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _common = require('../../common');

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var WebsocketClient = function () {
	function WebsocketClient(ws) {
		_classCallCheck(this, WebsocketClient);

		this.id = (0, _common.createId)();

		this._ws = ws;

		ws.on('message', this._handleMessage.bind(this));
		// TODO: On close and error
	}

	_createClass(WebsocketClient, [{
		key: '_handleMessage',
		value: function _handleMessage(message) {
			var data = void 0;
			try {
				data = JSON.parse(message);
			} catch (e) {
				console.log('Invalid JSON sent to server:', message);
				return;
			}

			if (this.onCmd) {
				this.onCmd(data);
			}
		}
	}, {
		key: 'send',
		value: function send(message) {
			//console.log('WebsocketClient send', message)
			this._ws.send(JSON.stringify(message));
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