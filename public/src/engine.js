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
        DomHandler.createPlayerPanels();
        DomHandler.buildBoard(Engine.handleClick);    
        DomHandler.cleanProgress();
        DomHandler.updatePlayersInfo();
        document.getElementById("btn-play-again").addEventListener("click", Engine.playAgain);
        let state = window.STATE;
        state.clearState();
        state.getWebSocket().addEventListener('message', this.eventListener);
        if (state.isAgainstRobot()) {
            DomHandler.endTurn();
            CyBorg.makeMove((move) => {
                Engine.consolidateMove(move);
                DomHandler.startTurn();
            });
        }
    }
    eventListener(event) {
        let state = window.STATE;
        let message = Message.decode(event.data);
        let header = message.header;
        let body = message.body;    
        switch(header.type) {
            case Message.TYPES.startTurn:
                DomHandler.startTurn();
                state.startTurn();
                break;
            case Message.TYPES.waitOpponentMove:
                DomHandler.endTurn();
                break;
            case Message.TYPES.opponentMove:
                Engine.consolidateMove(body.move)
                DomHandler.startTurn();
                console.log(Referee.findAllMoves());
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
                console.log(Referee.findAllMoves());
                break;
            default:
                console.log('Unknown message');
        }

    }
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
        let valid = Referee.isMovementValid({x, y});
	    if (!valid) {
            state.cleanClicks();
		    state.stopProcessing();
		    return;
	    }
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
        board.swapTileValues(firstClicked, secondClicked);

        let match = Referee.lookForMatches(true, state);
        if (!match) {
            console.log('didnt match')
            setTimeout(() => {                
                board.swapTileValues(firstClicked, secondClicked);
                state.cleanClicks();
                state.stopProcessing();
            }, 500);            
        } else {
            if (state.isMyTurn()) {
                if (!state.isAgainstRobot()) {
                    Engine.sendMove(move);    
                }
            }            
            Referee.detonateEligibleBomb();
            board.killEligibleTiles();
            Engine.reorderTiles(() => {
                if (Referee.didWin()) {
                    let state = window.STATE;
                    DomHandler.showPostGameMessage(state.isMyTurn());
                    return;
                }
                Referee.increaseBombsAge();

                if (state.isMyTurn()) {
                    state.finishTurn();
                    if(state.isAgainstRobot()) {
                        DomHandler.endTurn();
                        CyBorg.makeMove((move) => {
                            Engine.consolidateMove(move);
                            DomHandler.startTurn();
                        });
                    }
                } else {
                    state.startTurn();
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
        state.setPlayingAgainstRobot(false);
        let message = Message.playerMessage(state.getPlayerId(), Message.TYPES.joinMatch);
        message.body.board = state.getBoard().getMetaBoard();
        state.getWebSocket().send(message.encode());
        DomHandler.cleanBoard();
        DomHandler.cleanProgress();
        DomHandler.hidePlayerPanels();
    }
}

export { Engine }