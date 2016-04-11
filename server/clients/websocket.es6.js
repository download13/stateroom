import {createId} from '../../common';


export default class WebsocketClient {
	constructor(ws) {
		this.id = createId();

		this._ws = ws;

		ws.on('message', this._handleMessage.bind(this));
		// TODO: On close and error
	}

	_handleMessage(message) {
		let data;
		try {
			data = JSON.parse(message);
		} catch(e) {
			console.log('Invalid JSON sent to server:', message);
			return;
		}

		if(this.onCmd) {
			this.onCmd(data);
		}
	}

	send(message) {
		//console.log('WebsocketClient send', message)
		this._ws.send(JSON.stringify(message));
	}

	destroy() {
		this._ws.removeAllListeners('message');
		this._ws.close();
	}
}
