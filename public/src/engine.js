import { DomHandler } from "./domHandler.js";
import { Referee } from "./referee.js";
import { Message, Header, Body } from "./message.js";
import { Tile } from "./tile.js";
import { CyBorg } from "./cyBorg.js";

class Engine {
    constructor() {
        window.DEBUG = {boardHist:[], buffer: {}, moveHist: []};
    }

    newGame() {
        this.requestFullScreen();
        DomHandler.createPlayerPanels();
        DomHandler.buildBoard(Engine.handleClick);    
        DomHandler.cleanProgress();
        DomHandler.updatePlayersInfo();
        DomHandler.playSong();
        document.getElementById("btn-play-again").addEventListener("click", Engine.playAgain);
        let state = window.STATE;
        clearInterval(state.turnInterval);
        state.clearState();
        if (state.isAgainstRobot()) {
            DomHandler.endTurn();
            CyBorg.makeMove((move) => {
                Engine.consolidateMove(move);
            });
        } else {
            state.getWebSocket().addEventListener('message', Engine.eventListener);
        }
    }
    requestFullScreen() {
        var isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
        if (!isMobile) {
            return;
        }
        let el = document.body;  
        // Supports most browsers and their versions.
        let requestMethod = el.requestFullScreen || el.webkitRequestFullScreen 
        || el.mozRequestFullScreen || el.msRequestFullScreen;
        if (requestMethod) {
            // Native full screen.
            requestMethod.call(el);  
        } else if (typeof window.ActiveXObject !== "undefined") {  
            // Older IE.
            let wscript = new ActiveXObject("WScript.Shell");
            if (wscript !== null) {
                wscript.SendKeys("{F11}");
            }
        }
    }
    static eventListener(event) {
        let state = window.STATE;
        let message = Message.decode(event.data);
        let header = message.header;
        let body = message.body;    
        switch(header.type) {
            case Message.TYPES.startTurn:
                Engine.startTurn();
                break;
            case Message.TYPES.waitOpponentMove:
                DomHandler.endTurn();
                break;
            case Message.TYPES.opponentMove:
                // In case opponent didn't pass the move.
                if (!body.move.pass) {
                    Engine.consolidateMove(body.move)
                } else {
                    Engine.startTurn();
                }
                break;
            case Message.TYPES.waitingInTheRoom:
                DomHandler.showWaitingOpponentPanel();
                break;
            case Message.TYPES.startMatch:
                DomHandler.hideWaitingOpponentPanel();
                window.DEBUG.buffer = JSON.parse(JSON.stringify(body.buffer));                
                state.clearState();
                state.updateBoard(body.board);
                state.updateBuffer(body.buffer);            
                state.updateOpponentName(body.opponentName);
                DomHandler.updatePlayersInfo();
                DomHandler.showPlayerPanels();
                DomHandler.buildBoard(Engine.handleClick);
                break;
            default:
                console.log('Unknown message');
        }

    }
    
    static countDownTimer = -1;

    static handleClick(e) {
        let state = window.STATE;
        if (state.isProcessing() || !state.isMyTurn()) {            
            return;
        }
        state.startProcessing();
        let x = e.target.getAttribute("x");
        let y = e.target.getAttribute("y");
        if (state.handleClickedTile({x, y})) {
            state.stopProcessing();  
            return;
        }
        console.log('1');
        let valid = Referee.isMovementValid({x, y});
	    if (!valid) {
            console.log(x + " - " + y);

            state.cleanClicks();
		    state.stopProcessing();
		    return;
	    }
        console.log('is valid');
        let move = {firstClicked: state.clickedTile, secondClicked: state.currentTile};
        Engine.consolidateMove(move);
    }

    static consolidateMove(move) { 
        window.DEBUG.moveHist.push(JSON.parse(JSON.stringify(move)));
        window.DEBUG.boardHist.push(JSON.parse(JSON.stringify(window.STATE.getBoard())));
               
        let firstClicked = move.firstClicked;
        let secondClicked = move.secondClicked;
        
        let state = window.STATE;
        state.clickedTile = firstClicked
        state.currentTile = secondClicked
    
        let board = state.getBoard();  
        board.swapTiles(firstClicked, secondClicked);

        let match = Referee.lookForMatches(true, state);
        if (!match) {
            console.log('didnt match')
            setTimeout(() => {                
                board.swapTiles(firstClicked, secondClicked);
                state.cleanClicks();
                state.stopProcessing();
            }, 500);            
        } else {
            if (state.isMyTurn()) {
                clearInterval(state.turnInterval);
                if (!state.isAgainstRobot()) {
                    Engine.sendMove(move);    
                }
            }            
            if (Referee.detonateEligibleBomb()) {
                DomHandler.playBombSoundFx();
            }
            board.killEligibleTiles();
            Engine.reorderTiles(() => {
                if (Referee.didWin()) {
                    let state = window.STATE;
                    DomHandler.showPostGameMessage(state.isMyTurn());
                    return;
                }
                if (state.isMyTurn()) {
                    Engine.finishTurn();
                } else {
                    Engine.startTurn();
                }

                state.stopProcessing();
                state.cleanClicks();
            });
        }
    }

    static sendMove(move) {
        let state = window.STATE;
        let message = Message.playerMessage(state.playerId, Message.TYPES.move);        
        message.body.move = move;
        state.getWebSocket().send(message.encode());
    }

    static reorderTiles (cb) {
        let state = window.STATE;
        let board = state.getBoard();
        setTimeout(() => {
            board.runToEachTileBackwards((tile, params) => {
                if (tile.isOutdated()) {
                    if (params.x === 0) {
                        let bufferedValue = state.getBufferedTile();
                        board.updateTile(params.x, params.y, Tile.newTile(bufferedValue, false));
                    }
                    for (let i = (params.x - 1); i >= 0; i--) {
                        let tileAbove = board.getTile(i, params.y);
                        if (tileAbove.isOutdated()) {
                            if (i == 0) {
                                let bufferedValue = state.getBufferedTile();
                                board.updateTile(params.x, params.y, Tile.newTile(bufferedValue, false));
                                break;
                            }
                            continue;
                        } else {
                            board.updateTile(params.x, params.y, tileAbove);
                            board.updateTile(i, params.y, Tile.generateEmptyTile());
                            break;
                        }
                    }
                }
            });
            DomHandler.updateProgress();
            let match = Referee.lookForMatches(false, state);
 	        if (!match) {
		        setTimeout(cb, 100);
		        return;
	        } else {
                board.killEligibleTiles();
		        Engine.reorderTiles(cb);
	        }
        }, 500);
    }
    static playAgain() {
        let state = window.STATE;
        if (state.isAgainstRobot()) {
            state.setPlayingAgainstRobot(false);
            state.getWebSocket().addEventListener("message", Engine.eventListener);
        }
        
        let message = Message.playerMessage(state.getPlayerId(), Message.TYPES.joinMatch);
        message.body.board = state.getBoard().getMetaBoard();
        state.getWebSocket().send(message.encode());
        DomHandler.cleanBoard();
        DomHandler.cleanProgress();
        DomHandler.hidePlayerPanels();
    }
    static timeout() {
        let state = window.STATE;
        state.turnInterval = setInterval(() => {
            DomHandler.tickTimeBar();
            if (state.timeLeft < 1) {
                clearInterval(state.turnInterval);
                Engine.finishTurn();
                let message = Message.playerMessage(state.playerId, Message.TYPES.passTheTurn);        
                state.getWebSocket().send(message.encode());
                return;
            }
            state.timeLeft--;
        }, 1000);
    }
    static startTurn() {
        let state = window.STATE;
        state.startTurn();
        Referee.increaseBombsAge();
        DomHandler.startTurn();
        Engine.timeout();
    }
    static finishTurn() {
        let state = window.STATE;
        state.finishTurn();
        Referee.increaseBombsAge();
        if(state.isAgainstRobot()) {
            DomHandler.endTurn();
            CyBorg.makeMove((move) => {
                Engine.consolidateMove(move);
            });
        } else {

        }
    }
}

export { Engine }