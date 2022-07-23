import { Engine } from "./src/engine.js";
import { State } from "./src/state.js";
import { Message, Header, Body } from "./src/message.js";
import { DomHandler } from "./src/domHandler.js";
import { CyBorg } from "./src/cyBorg.js";

const ENGINE = new Engine();

let nickname = "";
var host = location.origin.replace(/^http/, 'ws');
//var host = "ws://127.0.0.1:3000"
let ws = new WebSocket(host);
let keepAliveInterval = -1;

ws.addEventListener('message', eventListener);
ws.addEventListener("open", () => {    
    console.log("We are connected, registering...");
    keepAliveInterval = setInterval(() => {
        let message = Message.newMessage(new Header(Message.TYPES.keepAlive), {});
        ws.send(message.encode());
    }, 5000);
});

document.getElementById("btn-play").addEventListener("click", () => {
    let txtNickname = document.getElementById("txt-nickname");
    if (typeof txtNickname.value === 'undefined' || txtNickname.value.length === 0) {
        txtNickname.classList.add("txt-error");
        return;
    }
    let header = new Header(Message.TYPES.register); 
    let body = new Body();
    nickname = txtNickname.value;
    body.name = nickname;
    let message = Message.newMessage(header, body);
    ws.send(message.encode());
    document.getElementById("nick-name").remove();
});

document.getElementById("btn-cyborg").addEventListener("click", () => { 
    leaveWaitingRoom();
    DomHandler.hideWaitingOpponentPanel();
    ws.removeEventListener("message", eventListener);
    var state = window.STATE;
    state.setPlayingAgainstRobot(true);
    state.updateOpponentName(CyBorg.getName());
    state.updateBoard(CyBorg.generatePlayableBoard());
    state.updateBuffer(CyBorg.generateTileBuffer(256));
    ENGINE.newGame();
});

function eventListener (event) {
    let state = window.STATE;

    let message = Message.decode(event.data);
    let header = message.header;
    let body = message.body;    
    switch(header.type) {
        case Message.TYPES.registerSuccess:
            console.log('Registered with success!');            
            window.STATE = new State(body.id, nickname, ws);
            joinMatch();
            break;
        case Message.TYPES.waitingInTheRoom:
            DomHandler.showWaitingOpponentPanel();
            console.log('You will wait for an opponent');
            break;
        case Message.TYPES.startMatch:
            DomHandler.hideWaitingOpponentPanel();
            state.updateBoard(body.board);
            state.updateBuffer(body.buffer);
            state.updateOpponentName(body.opponentName);
            ws.removeEventListener("message", eventListener);
            ENGINE.newGame();            
        default:
            console.log('Unknown message');
    }
}

function joinMatch() {
    let state = window.STATE;
    let message = Message.playerMessage(state.getPlayerId(), Message.TYPES.joinMatch);
    state.getWebSocket().send(message.encode());
}

function leaveWaitingRoom() {
    let state = window.STATE;
    let message = Message.playerMessage(state.getPlayerId(), Message.TYPES.leaveWaitingRoom);
    state.getWebSocket().send(message.encode());
}
