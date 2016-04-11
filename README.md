# stateroom

Keeps a collection of stateful clients synchronized so that each is always updated with the current state of every client in the room.

Each client has it's own state to which it has read/write access. It also has read access to every other client's state.

## Install
    npm i stateroom

## Server Example
```javascript
import WebsocketClient from 'stateroom/server/clients/websocket';
import {createRoom, createRoomManager} from 'stateroom';
import {Server} from 'ws';


const room = createRoom();
const wss = new Server();

wss.on('connection', ws => {
    const client = new WebsocketClient(ws); // Adapter for websocket connections

    ws.on('close', () => room.removeClient(client));
    room.addClient(client);
});

// If you want to have multiple rooms, RoomManager is a convenience class
const rooms = createRoomManager();

wss.on('connection', ws => {
    const roomname = 'room' + Math.random(); // Pretend the user picked this
    const room = rooms.get(roomname);
    const client = new WebsocketClient(ws); // Adapter for websocket connections

    ws.on('close', () => room.removeClient(client));
    room.addClient(client);

    // The room will be culled automatically when the last user leaves
});
```

## Client Example
```javascript
// At the moment, only WebSocket is supported by the client library
import {createClient} from 'stateroom/client';


const ws = new WebSocket(serverUrl);
const client = createClient(ws);

client.id; // Contains your id
client.set('prop1', 5);
client.setOwnState({prop: 4}); // Replaces entire state
client.delete('prop');
client.clear(); // Clears all properties
client.getState(); // {yourid: {}, otheruserid: {someprop: 'test'}}

client.subscribe(() => { // On any change
    client.getState(); // Do something with the new state
});
```


## License: MIT
