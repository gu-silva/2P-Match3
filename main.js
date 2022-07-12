// Importing the required modules
import { WebSocketServer } from "ws"
import { Match } from "./src/match.js";
import { Message, Header, Body } from "./src/message.js";
import { Player } from'./src/player.js';
import { WaitingRoom } from './src/waitingRoom.js';
 
// Creating a new websocket server
const wss = new WebSocketServer({ port: 8080 })
 
// Creating connection using websocket
wss.on("connection", ws => {
    console.log("new client connected");
    // sending message
    ws.on("message", data => {
        handleClientMessage(data, ws);
    });
    // handling what to do when clients disconnects from server
    ws.on("close", () => {
        console.log("the client has connected");
    });
    // handling client connection error
    ws.onerror = function () {
        console.log("Some Error occurred")
    }
});

const waitingRoom = new WaitingRoom();
var matches = [];
const players = [];

function handleClientMessage(data, socket) {
    let message = Message.decode(data);
    if (typeof message === 'undefined') {
        return;
    }
    let header = message.header;
    let body = message.body;

    switch (header.type) {
        case Message.TYPES.register:
            register(body.name, socket, (player) => {
                let respHeader = new Header(Message.TYPES.registerSuccess)
                let respBody = new Body(player.id);
                let response = Message.newMessage(respHeader, respBody);
                player.socket.send(response.encode());
            });
            break;
        case Message.TYPES.joinMatch:
            joinMatch(body.id);
            break;
        case Message.TYPES.move:
            handleMove(body.id, body.move);
            break;
        case Message.TYPES.leaveWaitingRoom:
            waitingRoom.remove(body.id);
            break;
        default:
            console.log("Unknown message type, dropping.")
    } 

}
function register(name, socket, cb) {
    let player = new Player(name, socket);
    players.push(player);
    cb(player);
}

function joinMatch(playerId) {
    let player = players.find((p) => {
        return p.id === playerId;
    });
    
    if (typeof player === 'undefined') {
        console.log('player not registered.')
        return;
    }
    // Destroy previous match player may be in.
    matches = matches.filter((m) => {
        return m.playerOne.id !== playerId && m.playerTwo.id !== playerId;
    });

    if (waitingRoom.isAnybodyWaiting()) {
        console.log('getting opponent');
        let secondPlayer = waitingRoom.pickFirst();
        let match = new Match(player, secondPlayer);
        matches.push(match);
        match.startMatch();        
    } else {
        console.log('adding player to queue');
        waitingRoom.enqueue(player);        
        player.notifyWaiting();
    }
}

function handleMove(playerId, move) {
    let match = matches.find((m) => {
        return m.playerOne.id === playerId || m.playerTwo.id === playerId;
    });
    match.relayMove(playerId, move);
}

console.log("The WebSocket server is running on port 8080");