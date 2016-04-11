import {
	CMD_SET_ID,
	CMD_REMOVE_CLIENT,
	CMD_SET
} from '../common/constants';
import {trim} from '../common';
import {createStore} from 'redux';


const WEBSOCKET_OPEN = 1;


export function createClient(ws) {
	let store = createStore(serverUpdateReducer);

	ws.onmessage = e => {
		let data = null;
		try {
			data = JSON.parse(e.data);
		} catch(err) {
			console.error('Invalid JSON sent from server: ' + e.data);
			return;
		}

		const [cmd, args] = data;
		store.dispatch({type: cmd, payload: args});
	};
	ws.onopen = flushSetCache;

	function flushSetCache() {
		const {cache} = store.getState();
		if(ws.readyState === WEBSOCKET_OPEN && Object.keys(cache).length > 0) {
			ws.send(JSON.stringify(cache));
			store.dispatch({type: 'FLUSH_CACHE_TO_PENDING'});
		}
	}

	return {
		set(key, value) {
			const state = store.getState();
			const pendingState = state.pending;
			const ourState = state.users[state.id] || {};
			const delta = typeof key === 'string' ? {[key]: value} : key;

			Object.keys(delta).forEach(key => {
				const value = delta[key];
				if(
					value === pendingState[key] || // Already sent to server
					(value === ourState[key] && !pendingState.hasOwnProperty(key)) // Already on server and we're not trying to delete it
				) {
					delete delta[key];
				}
			});

			store.dispatch({type: 'ADD_TO_CACHE', payload: delta});
			flushSetCache();
		},
		getState() {
			const state = store.getState();
			return {
				id: state.id,
				users: state.users
			};
		},
		subscribe(fn) {
			store.subscribe(fn);
		}
	};
}


const initialState = {
	id: null,
	users: {},
	pending: {},
	cache: {}
};

function serverUpdateReducer(state = initialState, {type, payload}) {
	if(type === CMD_SET_ID) {
		console.log('CMD_SET_ID', payload)
		return {
			...state,
			id: payload,
			users: {
				...state.users,
				[payload]: {}
			}
		};
	} else if(type === CMD_REMOVE_CLIENT) {
		return {
			...state,
			users: trim({
				...state.users,
				[payload]: null
			})
		};
	} else if(type === CMD_SET) {
		const [userId, delta] = payload;
		const newPending = {...state.pending};
		Object.keys(delta).forEach(key => {
			if(delta[key] === newPending[key]) {
				delete newPending[key];
			}
		});
		return {
			...state,
			users: {
				...state.users,
				[userId]: trim({
					...state.users[userId],
					...delta
				})
			},
			pending: newPending
		};
	} else if(type === 'ADD_TO_CACHE') {
		return {
			...state,
			cache: {
				...state.cache,
				...payload
			}
		};
	} else if(type === 'FLUSH_CACHE_TO_PENDING') {
		return {
			...state,
			pending: state.cache,
			cache: {}
		};
	} else {
		return state;
	}
}
