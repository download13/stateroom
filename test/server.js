import {Server, WebSocket} from 'mock-socket';
import {Room} from '../server/index.es6.js';
import WebSocketClient from '../server/clients/websocket.es6.js';
import {RoomClient} from '../client/index.es6.js';


function server() {
	const room = new Room({
		sizeLimit: 1024,
		countLimit: 10
	});

	const wss = new Server('ws://localhost/');
	wss.on('connection', ws => {
		const client = new WebSocketClient(ws);
		room.addClient(client);
	});
}

function client() {
	const ws = new WebSocket('ws://localhost/', null);
	const client = new RoomClient(ws);

	client.set('test', 6);

	client.subscribe(() => {
		console.log('client:', client.getState());
	});
}

server();
client();
