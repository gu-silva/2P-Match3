import crypto from 'crypto'
import { Message, Header, Body } from "./../public/src/message.js";

class Player {
    constructor(name, socket) {
        this.id = crypto.randomUUID();
        this.name = name;
        this.socket = socket;
    }
    startMatch(board, buffer, opponentName) {
        let message = Message.playerMessage(this.id, Message.TYPES.startMatch);        
        message.body.board = board;
        message.body.buffer = buffer;
        message.body.opponentName = opponentName;
        this.socket.send(message.encode());
    }
    updateTileBuffer(buffer) {
        let message = Message.playerMessage(this.id, Message.TYPES.updateTileBuffer);
        message.body.buffer = buffer;
        this.socket.send(message.encode());
    }
    notifyWaiting() {
        let message = Message.playerMessage(this.id, Message.TYPES.waitingInTheRoom);
        this.socket.send(message.encode());
    }
    startTurn() {
        let message = Message.playerMessage(this.id, Message.TYPES.startTurn);
        this.socket.send(message.encode());
    }
    waitOpponentMove() {
        let message = Message.playerMessage(this.id, Message.TYPES.waitOpponentMove);
        this.socket.send(message.encode());
    }
    opponentMove(move) {
        let message = Message.playerMessage(this.id, Message.TYPES.opponentMove);
        message.body.move = move;
        this.socket.send(message.encode());
    }
    getName() {
        return this.name;
    }
}

export { Player };