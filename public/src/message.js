class Message {
    constructor() {
        this.body = {}
        this.header = {}
    }
    encode() {
        return JSON.stringify(this);
    }
    static newMessage(header, body) {
        let message = new Message();
        message.header = header;
        message.body = body;
        return message;
    }
    static playerMessage(playerId, type) {
        let header = new Header(type);
        let body = new Body(playerId);
        return Message.newMessage(header, body);
    }
    static decode(content) {
        let anonObj = JSON.parse(content);
        if (typeof anonObj.body === 'undefined' || typeof anonObj.header === 'undefined') {
            console.log(`Unable to decode message: ${content}`);
            return;
        }
        let message = new Message();
        message.body = anonObj.body;
        message.header = anonObj.header;
        
        return message;
    }
}

class Header {
    constructor(type) {
        this.type = type
    }
}

class Body {
    constructor(id) {
        this.id = id;
    }
}

Message.TYPES = {
    register : 'register',
    joinMatch : 'join_match',
    move: 'move',
    leaveWaitingRoom: 'leave_waiting_room',
    registerSuccess : 'register_success',
    waitingInTheRoom : 'waiting_in_the_room',
    startMatch: 'start_match',
    startTurn: 'start_turn',
    opponentMove: 'opponent_move',
    updateTileBuffer: 'update_buffer',
    waitOpponentMove: 'wait_opponent_move',
    keepAlive: 'keep_alive'
}

export { Message, Header, Body }