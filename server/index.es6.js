import {
	CMD_SET_ID,
	CMD_REMOVE_CLIENT,
	CMD_SET
} from '../common/constants';
import {trim} from '../common';
import {createStore} from 'redux';


export function createRoom() {
	const store = createStore(roomReducer);
	const clients = new Set();

	function broadcast(message) {
		//console.log('Room broadcast', message)
		clients.forEach(client => {
			client.send(message);
		});
	}

	return {
		addClient(joiningClient) {
			clients.add(joiningClient);
			//console.log('server CMD_SET_ID', joiningClient.id)
			joiningClient.send([CMD_SET_ID, joiningClient.id]);

			const state = store.getState();
			Object.keys(state).forEach(clientId => {
				joiningClient.send([CMD_SET, [clientId, state[clientId]]]);
			});

			store.dispatch({type: 'ADD_CLIENT', payload: joiningClient.id});

			joiningClient.onCmd = delta => {
				store.dispatch({type: 'CLIENT_SET', payload: [joiningClient.id, delta]});
				broadcast([CMD_SET, [joiningClient.id, delta]]);
				//console.log('onCmd broadcast', [joiningClient.id, delta])
			};
		},
		removeClient(partingClient) {
			clients.delete(partingClient);
			partingClient.destroy();

			store.dispatch({type: 'REMOVE_CLIENT', payload: partingClient.id});
			broadcast([CMD_REMOVE_CLIENT, partingClient.id]);

			if(clients.size === 0 && this.onEmpty) {
				this.onEmpty();
			}
		}
	};
}

function roomReducer(state = {}, {type, payload}) {
	if(type === 'ADD_CLIENT') {
		return {
			...state,
			[payload]: {}
		};
	} else if(type === 'REMOVE_CLIENT') {
		return trim({
			...state,
			[payload]: null
		});
	} else if(type === 'CLIENT_SET') {
		const [fromId, delta] = payload;
		return {
			...state,
			[fromId]: {
				...state[fromId],
				...delta
			}
		};
	} else {
		return state;
	}
}


export function createRoomManager() {
	const rooms = new Map();

	return {
		get(name) {
			if(!rooms.has(name)) {
				const room = createRoom();
				room.onEmpty = () => rooms.delete(name);
				rooms.set(name, room);
			}

			return rooms.get(name);
		}
	};
}
