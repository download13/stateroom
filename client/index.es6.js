import {
	CMD_ADD_CLIENT,
	CMD_REMOVE_CLIENT,
	CMD_SET,
	CMD_DELETE,
	CMD_CLEAR
} from '../common/constants';


const WEBSOCKET_OPEN = 1;

export class RoomClient {
	constructor(ws) {
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

	set(key, value) {
		const valueType = typeof value;
		if(valueType !== 'string' && valueType !== 'number') {
			throw new Error('Value must be a string or number');
		}

		this._stateCache[key] = value;
		this._flushLocalState();
	}

	delete(key) {
		if(key in this._stateCache) {
			this._stateCache[key] = undefined;
			this._flushLocalState();
		}
	}

	clear() {
		this._stateCache = Object.create(null);
		this._sendCmd(CMD_CLEAR);
	}

	setOwnState(state) {
		this._stateCache = state;
		this._flushLocalState();
	}

	getState() {
		return this._states;
	}

	subscribe(fn) {
		this._subscribers.push(fn);
		fn();

		return () => {
			const pos = this._subscribers.indexOf(fn);
			if(pos !== -1) {
				this._subscribers.splice(pos, 1);
			}
		}
	}

	_emitChanged() {
		this._subscribers.forEach(fn => {
			try { fn() }
			catch(e) {
				console.log('Error while emitting subscriber event', e)
			}
		});
	}

	_flushLocalState() {
		if(this._ws.readyState !== WEBSOCKET_OPEN) return;

		const stateCache = this._stateCache;

		Object.keys(stateCache).forEach(key => {
			const value = stateCache[key];

			if(value === undefined) {
				this._sendCmd(CMD_DELETE, [key]);
			} else {
				this._sendCmd(CMD_SET, [key, value]);
			}

			delete stateCache[key];
		}, this);
	}

	_sendCmd(cmd, args) {
		this._ws.send(JSON.stringify([cmd, args]));
	}

	_handleMessage(e) {
		let data = null;
		try {
			data = JSON.parse(e.data);
		} catch(err) {
			console.error('Invalid JSON sent from StateRoom server: ' + e.data);
			return;
		}

		const [fromId, cmd, args] = data;
		const state = this._states[fromId];

		if(cmd === CMD_ADD_CLIENT) {
			const [id] = args;
			if(!this.id) { // This should be the first message it sees as a new member
				this.id = id;
			}
			this._states = {...this.states, [id]: Object.create(null)};
			this._emitChanged();
		} else if(cmd === CMD_REMOVE_CLIENT) {
			const [id] = args;
			this._states = {...this._states};
			delete this._states[id];
			this._emitChanged();
		} else if(cmd === CMD_SET) {
			const [key, value] = args;
			this._states = {
				...this._states,
				[fromId]: {
					...state,
					[key]: value
				}
			};
			this._emitChanged();
		} else if(cmd === CMD_DELETE) {
			const [id] = args;
			const newState = {...state};
			delete newState[id];
			this._states = {[fromId]: newState};
			this._emitChanged();
		} else if(cmd === CMD_CLEAR) {
			this._states = {...this._states, [fromId]: Object.create(null)};
			this._emitChanged();
		}
	}
}
