import uuid from 'uuidv4';


export default class WebsocketClient {
	constructor(ws) {
		this.id = uuid();

		this._ws = ws;

		ws.on('message', this._handleMessage.bind(this));
		// TODO: On close and error
	}

	_handleMessage(msg) {
		try {
			const [cmd, args] = JSON.parse(msg);
			if(this.onCmd) {
				this.onCmd(cmd, args);
			}
		} catch(e) {}
	}

	sendCmd(fromId, cmd, args) {
		this._ws.send(JSON.stringify([fromId, cmd, args]));
	}

	destroy() {
		this._ws.removeAllListeners('message');
		this._ws.close();
	}
}
