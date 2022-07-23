class Match {
    constructor(playerOne, playerTwo) {
        this.playerOne = playerOne;
        this.playerTwo = playerTwo;
        this.tileBuffer = this.generateTileBuffer(256);
        this.board = this.generateBoard();
        this.started = false;
    }    
    generateTileBuffer(howMany) {
        let numbers = [];
        for (let i=0; i < howMany; i++) {
            numbers.push(this.generateRandomNumber());
        }
        return numbers;
    }
    generateRandomNumber() {
        return Math.floor(Math.random() * 6);
    }
    generateBoard() {
        let board = new Array(8);
        for (let i=0; i < 8; i++) {
            for (let j=0; j < 8; j++) {
                if (!board[i]) {
                    board[i] = new Array();
                }
                let value;
                let valid = false;
                while (!valid) {
                    let horizontalValid = false;
                    let verticalValid = false;
                    value = this.generateRandomNumber();
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
    startMatch() {
        this.playerOne.startMatch(this.board, this.tileBuffer, this.playerTwo.getName());
        this.playerTwo.startMatch(this.board, this.tileBuffer, this.playerOne.getName());

        let coin = Math.round(Math.random() * 1) === 0;
        let whoStart = coin ? this.playerOne : this.playerTwo;
        let whoWaits = coin ? this.playerTwo : this.playerOne;
        whoStart.startTurn();
        whoWaits.waitOpponentMove();
        this.started = true;
    }
    relayMove(playerId, move) {
        let whoPlaysNext = this.playerOne.id === playerId ? this.playerTwo : this.playerOne;
        let whoWaits = this.playerOne.id === playerId ? this.playerOne : this.playerTwo;
        whoPlaysNext.opponentMove(move);
        whoWaits.waitOpponentMove();
    }
    passTheTurn(playerId) {
        this.relayMove(playerId, { "pass": true });
    }
}

export { Match };