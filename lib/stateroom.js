var Member = require('./member');


var CMD_ADD_CLIENT = 0;
var CMD_REMOVE_CLIENT = 1;
var CMD_SET = 2;
var CMD_DELETE = 3;
var CMD_CLEAR = 4;
// TODO: Implement
var CMD_PUSH = 5;
var CMD_POP = 6;
var CMD_UNSHIFT = 7;
var CMD_SHIFT = 8;
var CMD_SPLICE = 9;


function StateRoom(options) {
	// TODO
	// Allow restricting the number of properties a user can set
	// And the length of property names/values

	this._members = new Map();
}

StateRoom.prototype.addClient = function(client) {
	var clientMember = new Member(client);

	// New member joins
	this._members.set(client, clientMember);

	// Tell current members about theis new one
	// The newbie also learns it's own name the first time it hears it
	this._broadcast(null, CMD_ADD_CLIENT, [clientMember.id]);

	// Newbie's initial state is blank
	// Send commands to bring it up to the current state
	this._members.forEach(member => {
		// Tell it about the existing members
		clientMember.sendCmd(null, CMD_ADD_CLIENT, [member.id]);

		// And about the state of the existing members
		member.state.forEach((v, k) => {
			clientMember.sendCmd(member.id, CMD_SET, [k, v]);
		});
	});

	// Start handling commands from new member
	var self = this;
	clientMember.on('cmd', (cmd, args) => {
		self._handleMemberCmd(clientMember, cmd, args);
	});
};

StateRoom.prototype.removeClient = function(client) {
	var partedMember = this._members.get(client);

	partedMember.destroy();

	this._members.delete(client);

	this._broadcast(null, CMD_REMOVE_CLIENT, [partedMember.id]);
};

StateRoom.prototype.isEmpty = function() {
	return this._members.size === 0;
};

StateRoom.prototype._handleMemberCmd = function(memberFrom, cmd, args) {
	var applied = false;

	switch(cmd) {
	case CMD_SET:
		applied = this._setProperty(memberFrom, args);
		break;

	case CMD_DELETE:
		applied = this._deleteProperty(memberFrom, args);
		break;

	case CMD_CLEAR:
		memberFrom.clear();

		applied = true;
	}

	// Once applied, tell every client to execute this command on their state machines as well
	if(applied) {
		this._broadcast(memberFrom.id, cmd, args);
	}
};

StateRoom.prototype._setProperty = function(member, args) {
	if(args.length !== 2) return false;

	var key = args[0];
	var value = args[1];

	var valueType = typeof value;

	if(typeof key !== 'string' ||
		(valueType !== 'string' && valueType !== 'number')) return false;

	member.set(key, value);

	return true;
};

StateRoom.prototype._deleteProperty = function(member, args) {
	if(args.length !== 1) return false;

	var key = args[0];

	if(typeof key !== 'string') return false;

	member.delete(key, value);

	return true;
};

StateRoom.prototype._broadcast = function(fromId, cmd, args) {
	this._members.forEach(member => {
		member.sendCmd(fromId, cmd, args);
	});
};


module.exports = StateRoom;
