import { Score } from "./score.js";
import { Board } from "./board.js";
import { Referee } from "./referee.js";
import { DomHandler } from "./domHandler.js";
class State {
    constructor(playerId, playerName, ws) {
        this.clearState();
        this.board = new Board();
        //this.generateValidBoard();
        this.playerId = playerId;
        this.playerName = playerName;    
        this.ws = ws;
        this.playingAgainstRobot = false;
    }

    clearState() {
        this.processing = false;
        this.myTurn = false;
        this.score = new Score();
        this.currentTile = undefined;
        this.clickedTile = undefined;
        this.opponentName = undefined;
    }

    generateValidBoard() {
        this.board = new Board();
        let match = Referee.lookForMatches(false, this);
        while (match) {
            this.board = new Board();
            match = Referee.lookForMatches(false, this);
        }
    }

    startProcessing() {
        this.processing = true;
    }

    stopProcessing() {
        this.processing = false;    
    }

    isProcessing() {
        return this.processing;
    }

    getScore() {
        return this.score;
    }

    isMyTurn() {
        return this.myTurn;
    }
    startTurn() {
        this.myTurn = true;
    }
    finishTurn() {
        this.myTurn = false;
        this.currentTile = undefined;
        this.clickedTile = undefined;
    }
    handleClickedTile(clicked) {
        let stopProcessing = false;
        this.currentTile = clicked;
        if (typeof this.clickedTile == "undefined") {
            this.clickedTile = clicked;
            this.currentTile = undefined;
            DomHandler.markSelection(clicked.x, clicked.y);
            stopProcessing = true;
        } else if (this.currentTile.x === this.clickedTile.x && this.currentTile.y === this.clickedTile.y) {
            this.currentTile = undefined;
            stopProcessing = true;
        } else {
            DomHandler.removeSelection(this.clickedTile.x, this.clickedTile.y);
        }
        return stopProcessing;
    }
    cleanClicks() {
        this.currentTile = undefined;
        this.clickedTile = undefined;
    }
    getBoard() {
        return this.board;
    }    
    updateBoard(newBoard) {
        this.board.updateMetaBoard(newBoard);
    }
    updateBuffer(tilesBuffer) {
        this.tilesBuffer = tilesBuffer;
    }
    getBufferedTile() {
        return this.tilesBuffer.pop();
    }
    getWebSocket() {
        return this.ws;
    }
    getPlayerId() {
        return this.playerId;
    }
    getPlayerName() {
        return this.playerName;
    }
    updateOpponentName(name) {
        this.opponentName = name;
    }
    getOpponentName() {
        return this.opponentName;
    }
    isAgainstRobot() {
        return this.playingAgainstRobot;
    }
    setPlayingAgainstRobot(value) {
        this.playingAgainstRobot = value;
    }
}

export { State };