import { Config } from "./config.js";
import { Tile } from "./tile.js";
import { DomHandler } from "./domHandler.js";

const BOARD_CMDS = {
    break: "break",
    continue: "continue",
    return: "return"
}

class Board {
    constructor() {
        this._board = this.generateBoard();
    }

    generateBoard() {
        let board = new Array(Config.h);
        for (let i=0; i < Config.h; i++) {
            for (let j=0; j < Config.w; j++) {
                if (!board[i]) {
                    board[i] = new Array();
                }
                board[i].push(Tile.generateEmptyTile)
                //board[i].push(Tile.newRandomTile());
            }
        }
        return board;
    }

    runToEachTile(cb, params) {
        for (let i=0; i < Config.h; i++) {
            for (let j=0; j < Config.w; j++) {                
                if (typeof params === 'undefined') {
                    params = {};
                }
                params.x = i;
                params.y = j;

                let result = cb(this.getTile(i, j), params);
                if (result) {
                    if (result === BOARD_CMDS.break) {
                        break;
                    }
                    if (result === BOARD_CMDS.continue) {
                        continue;
                    }
                    if (result === BOARD_CMDS.return) {
                        return;
                    }
                }
            }
        }
    }

    runToEachTileBackwards(cb, params) {
        for (let i = (Config.h - 1); i >= 0; i--) {
            for (let j = (Config.w - 1); j >= 0; j--) {
                if (typeof params === 'undefined') {
                    params = {};
                }
                params.x = i;
                params.y = j;
                let result = cb(this.getTile(i, j), params);
                if (result) {
                    if (result === BOARD_CMDS.break) {
                        break;
                    }
                    if (result === BOARD_CMDS.continue) {
                        continue;
                    }
                    if (result === BOARD_CMDS.return) {
                        return;
                    }
                }
            }
        }
    }

    swapTileValues(oneCoord, anotherCoord) {
        let one = this.getTile(oneCoord.x, oneCoord.y);
        let another = this.getTile(anotherCoord.x, anotherCoord.y);
        let aux = one.getValue();
        one.setValue(another.getValue());
        another.setValue(aux);
        DomHandler.swapTiles(oneCoord, anotherCoord);
    }

    updateMetaBoard(metaBoard){
        let newBoard = new Array();
        for (let i=0; i < Config.h; i++) {
            for (let j=0; j < Config.w; j++) {
                if (!newBoard[i]) {
                    newBoard[i] = new Array();
                }
                let value = metaBoard[i][j];
                        
                newBoard[i].push(Tile.newTile(value, false));
            }
        }
        this._board = newBoard;
    }

    getMetaBoard() {
        return this._board;
    }

    getTile(x, y) {
        return this._board[x][y];
    }
    detonateTile(x, y) {
        this.getTile(x, y).markAsOutdated();    
    }
    killEligibleTiles() {
        DomHandler.killEligibleTiles();
        DomHandler.replaceEligibleTileColor();
    }
    updateTile(x, y, tile) {
        this._board[x][y] = tile;
        DomHandler.updateTile(x, y, tile.getValue());
    }
}

export { Board, BOARD_CMDS };