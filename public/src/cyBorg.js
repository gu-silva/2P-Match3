import { Referee } from "./referee.js"
import { Config } from "./config.js";
import { Tile } from "./tile.js"
class CyBorg {
    static makeMove(consolidate) {
        // he pretends to think from 0 to 10 seconds before making his move.
        let wait = 3000;//Math.floor(Math.random() * 3) * 2000;
        setTimeout(() => {
            console.log('finished waiting gonna move')
            let move = CyBorg.pickMove();
            console.log('picked a move ');
            console.log(move);
            let parsedMove = {firstClicked : move.first, secondClicked: move.second };
            console.log("calling consolidate");
            consolidate(parsedMove);
        }, wait);
    }
    static pickMove() {
        // this cheating fuck gets the answers directly from the referee!
        let availableMoves = Referee.findAllMoves();

        // he doesn't know the best move though, so he uses a random one.
        let randomIndex = Math.floor(Math.random() * (availableMoves.length -1));
        let randomMove = availableMoves[randomIndex];
        return randomMove;
    }
    static getName() {
        return Config.robotName;
    }
    
    // Let's make this bastard work!
    static generatePlayableBoard() {
        let board = new Array(Config.w);
        for (let i=0; i < Config.w; i++) {
            for (let j=0; j < Config.h; j++) {
                if (!board[i]) {
                    board[i] = new Array();
                }
                let value;
                let valid = false;
                while (!valid) {
                    let horizontalValid = false;
                    let verticalValid = false;
                    value = Tile.generateTileValue();
                    if (j >= 2) {
                        horizontalValid = value !== board[i][j-1] || value !== board[i][j-2];
                        verticalValid = i >= 2 ? value !== board[i-1][j] || value !== board[i-2][j] : true;
                    } else if (i >=2) {
                        horizontalValid = true;
                        verticalValid = value !== board[i-1][j] || value !== board[i-2][j];
                    } else {
                        horizontalValid = true;
                        verticalValid = true;
                    }
                    valid = horizontalValid && verticalValid;
                }
                board[i].push(value);
            }
        }
        return board;
    }

    static generateTileBuffer(howMany) {
        let numbers = [];
        for (let i=0; i < howMany; i++) {
            numbers.push(Tile.generateTileValue());
        }
        return numbers;
    }
}

export { CyBorg }