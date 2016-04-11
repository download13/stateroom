import {Server, WebSocket} from 'mock-socket';
import {createRoom} from '../server/index.es6.js';
import WebSocketClient from '../server/clients/websocket.es6.js';
import {createClient} from '../client/index.es6.js';


function testServer() {
	const room = createRoom({
		sizeLimit: 1024,
		countLimit: 10
	});

	const wss = new Server('ws://localhost/');
	wss.on('connection', ws => {
		const client = new WebSocketClient(ws);
		room.addClient(client);
	});
}

function testClient() {
	const ws = new WebSocket('ws://localhost/', null);
	return createClient(ws);
}

testServer();
const client1 = testClient();
const client2 = testClient();

client1.set('t', 1);

setTimeout(() => {
	console.log(client1.getState());
	console.log(client2.getState());
}, 100);
