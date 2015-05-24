- [stateroom](#stateroom)
  - [Install:](#install)
  - [Server Example:](#server-example)
  - [Client Example:](#client-example)
  - [Server API:](#server-api)
    - [clientObject](#clientobject)
  - [Client API:](#client-api)
  - [License: MIT](#license-mit)


# stateroom

Keeps a collection of stateful clients synchronized so that each is always updated with the current state of every client in the room. When a new client joins a room, it will be updated with the current state of every other client in the room.


    Client -->[join]>-- Room
    Room.createStateFor(Client)

A client (we'll call it the setting client) wants to change it's own state.
It sends a `set` command to the room to a set property of it's own state.
    Client -->[set 'name' 'Todd']>-- Room

The room executes the command and alters it's copy of the client's state appropriately.
    Room.setProperty(Client, 'name', 'Todd')

The room sends a notification to all members that Client's state has changed.
    foreach Clients: Client.sendCommand(set, setting_client_id, 'name', 'Todd')
    Room -->[set setting_client_id 'name' 'Todd']>-- Client

Each client receives the update notification and updates it's own copy of the setting
client's state. This includes the setting client, which did not alter it's own copy when
making the request, but waited for the command from the server to do so.


## Install:
	npm i stateroom

## Server Example:
```javascript
var StateRoom = require('stateroom');


var room = new StateRoom();

websocketServer.on('connection', function(client) {
	client.on('close', function() {
		room.removeClient(client);
	});

	client.on('error', function() {
		room.removeClient(client);
	});

	room.addClient(client);
});
```

## Client Example:
```javascript
// TODO: Add this once the client library is here
var ws = new WebSocket(serverUrl);

var stateroom = new StateRoom(ws);

stateroom.on('ready', function() {
  // stateroom now has its id and is a member of the room
});

stateroom.on('join', function(clientId) {
  // A client has joined the room
});

stateroom.on('part', function(clientId) {
  // A client has left the room
});

stateroom.on('set', function(fromId, key, value) {
  // called when a property is set on any client's state

  if(fromId === stateroom.id) {
    // This is an update to OUR state
  }

  if(key === 'observed-property') {
    view.render({client: fromId, property: value});
  }
});
```


## Server API:
* new StateRoom() - Creates a new stateroom
  * .addClient(clientObject) - Adds a client to the stateroom
  * .removeClient(clientObject) - Removes a client from the stateroom
  * .isEmpty() - Returns whether the room contains no members

### clientObject
Must fulfil this interface:
* .send(message) - Sends a string message to the client
* .on('message', function(message) {}) - Emits 'message' event with string message from the client


##Client API:
* new StateRoom(ws) - Creates a new StateRoom which will use the WebSocket instance (ws) to maintain state.
  * .set(key, value)
  * .delete(key)
  * .clear()

### Events - .on(name, cb)
* set `clientId` `key` `value`
* delete `clientId` `key`
* clear `clientId`


## License: MIT
