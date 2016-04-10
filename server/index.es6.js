import {
	CMD_ADD_CLIENT,
	CMD_REMOVE_CLIENT,
	CMD_SET,
	CMD_DELETE,
	CMD_CLEAR
} from '../common/constants';


export class Room {
	constructor(options = {}) {
		this._countLimit = options.countLimit || Infinity;
		this._sizeLimit = options.sizeLimit || Infinity;
		this._states = new Map(); // Maps clients to states
	}

	addClient(joiningClient) {
		// New member joins, initial state is blank
		this._states.set(joiningClient, new Map());

		// Tell current members about the new one
		// The newbie also learns it's own name the first time it hears it
		this._broadcast(null, CMD_ADD_CLIENT, [joiningClient.id]);

		// Send commands to bring it up to the current state
		this._states.forEach((state, client) => {
			// Tell it about the existing members
			if(client !== joiningClient) {
				// The joining client already knows about itself
				joiningClient.sendCmd(null, CMD_ADD_CLIENT, [client.id]);
			}

			// And about the state of the existing members
			state.forEach((value, key) => {
				joiningClient.sendCmd(client.id, CMD_SET, [k, v]);
			});
		});

		// Start handling commands from new member
		joiningClient.onCmd = this._handleClientCmd.bind(this, joiningClient);
	}

	removeClient(partingClient) {
		partingClient.destroy();
		this._states.delete(partingClient);
		this._broadcast(null, CMD_REMOVE_CLIENT, [partingClient.id]);

		if(this._states.size === 0 && this.onEmpty) {
			this.onEmpty();
		}
	}

	_handleClientCmd(fromClient, cmd, args) {
		const state = this._states.get(fromClient);
		let applied = false;

		try {
			if(cmd === CMD_SET) {
				const [key, value] = args;
				const valueType = typeof value;
				if(
					state.size < this._countLimit &&
					typeof key === 'string' &&
					key.length < this._sizeLimit &&
					(
						(valueType === 'string' && value.length < this._sizeLimit) ||
						valueType === 'number'
					)
				) {
					state.set(key, value);
					applied = true;
				}
			} else if(cmd === CMD_DELETE) {
				const [key] = args;
				if(typeof key === 'string') {
					state.delete(key);
					applied = true;
				}
			} else if(cmd === CMD_CLEAR) {
				state.clear();
				applied = true;
			}
		} catch(e) {}

		// Once applied, tell every client to execute this command on their state machines as well
		if(applied) {
			this._broadcast(fromClient.id, cmd, args);
		}
	}

	_broadcast(fromId, cmd, args) {
		this._states.forEach((state, client) => {
			client.sendCmd(fromId, cmd, args);
		});
	}
}


export class RoomManager {
	constructor(options) {
		this._options = options;
		this._rooms = new Map();
	}

	get(name) {
		const rooms = this._rooms;

		if(!rooms.has(name)) {
			const room = new Room(this._options);
			room.onEmpty = () => rooms.delete(name);
			rooms.set(name, room);
		}

		return rooms.get(name);
	}
}
