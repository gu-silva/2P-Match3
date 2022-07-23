import { Config } from "./config.js";
import { Bomb } from "./bomb.js";
import { BOARD_CMDS } from "./board.js";
import { PossibleMove } from "./possibleMove.js";

class Referee {
    static didWin() {
		let state = window.STATE;
        let numTilesToWin = Math.round((Config.h * Config.w) * Config.winRate);
	    let numCapturedTiles;
	    if (state.isMyTurn()) {
	    	numCapturedTiles = document.querySelectorAll('.' + Config.capturedCssClass).length;
    	} else {
    		numCapturedTiles = document.querySelectorAll('.' + Config.capturedOpponentCssClass).length;
	    }
	    return numCapturedTiles >= numTilesToWin
    }

	static isMovementValid(movement) {
		let state = window.STATE;
		let validMovements = [
			{
				"x": state.clickedTile.x, 
				"y": (parseInt(state.clickedTile.y) + 1).toString()
			},
			{
				"x": state.clickedTile.x,
				"y": (parseInt(state.clickedTile.y) - 1).toString()
			},
			{
				"x": (parseInt(state.clickedTile.x) + 1).toString(), 
				"y": state.clickedTile.y 
			},
			{
				"x": (parseInt(state.clickedTile.x) - 1).toString(),
				"y": state.clickedTile.y
			},
		];
	
		let valid = false;
		for (let i=0; i < validMovements.length; i++) {
			let validMovement = validMovements[i];
			if (this.compareCoordenates(movement, validMovement)) {
				valid = true;
				break;
			}
		}
		return valid;
	}
	static compareCoordenates(one, another) {
		return one.x === another.x && one.y === another.y;
	}

	static lookForMatches(originalMovement, state) {
		let matched = false;
		let totalPoints = 0;
		function verifyMatch(horizontal) {	
			let points = 1;
			let prevTileValue;
			let board = state.getBoard();
			board.runToEachTile((tile, params) => {
				let currTileValue = horizontal ? tile.getValue() : board.getTile(params.y, params.x).getValue();
				if (typeof prevTileValue == "undefined") {
					prevTileValue = currTileValue;
					return BOARD_CMDS.continue;
				}
				if (currTileValue == prevTileValue) {
					points++;
					if (points === 3) {
						matched = true;
						for (let m = 0; m < 3; m++) {
							let x = horizontal ? params.x : params.y - m;
							let y = horizontal ? params.y - m : params.x;
							board.detonateTile(x, y);
						}						
                        if (params.y === (Config.w - 1)) {
                            totalPoints += points;
                        }
					} else if (points > 3) {
						let x = horizontal ? params.x : params.y;
						let y = horizontal ? params.y : params.x;
						board.detonateTile(x, y);
						if (params.y === (Config.w - 1)) {
							totalPoints += points;
						}
					}
				} else {
					if (points > 2) {
						totalPoints += points;
					}
					points = 1;
				}
				prevTileValue = currTileValue;
				if (params.y === (Config.w - 1)) {
					prevTileValue = undefined;
					points = 1;
				}
			});	
			return matched
		}

		let horizontalMatch = verifyMatch(true, state);
		let verticalMatch = verifyMatch(false, state);
		if (originalMovement && totalPoints > 3) {
			let board = state.getBoard();
			let x = parseInt(state.currentTile.x);
			let y = parseInt(state.currentTile.y);
			
			let tile = board.getTile(x, y);
			if (!tile.isOutdated()) {
				x = parseInt(state.clickedTile.x);
				y = parseInt(state.clickedTile.y);
			}
			
			let bomb = new Bomb(0, state.isMyTurn());
			state.getBoard().updateTile(x, y, bomb);						
		}
		return horizontalMatch || verticalMatch;
	}

	 // Bomb management area
	static increaseBombsAge() {
		let board = window.STATE.getBoard();
		board.runToEachTile((tile) => {
            if (tile instanceof Bomb) {
                tile.increaseBombAge();
            }
        });
    }

    static detonateEligibleBomb() {
		let state = window.STATE;
		let board = state.getBoard();
        let detonated = false;
        board.runToEachTile((tile, params) => {
            if (tile instanceof Bomb) {
                let mine = state.isMyTurn() ? tile.isMine() : !tile.isMine();
                if (!mine) {
                    return BOARD_CMDS.continue;
                }

                if (tile.isEligibleToExplode()) {
                    detonated = true;
                    this.detonateAround(params.x, params.y, state);
                    return BOARD_CMDS.return;
                }
            }
        });
        return detonated;
    }

    static detonateAround(x, y, state) {
        let tilesToDetonate = []
	    if (x > 0) {
		    tilesToDetonate.push({'x': x-1, 'y': y});
		    if (y > 0) {
    			tilesToDetonate.push({'x': x-1, 'y': y-1});
	    	}
		    if (y < (Config.h-1)) {
			    tilesToDetonate.push({'x': x-1, 'y': y+1});
		    }
    	}

	    if (x < (Config.w-1)) {
		    tilesToDetonate.push({'x': x+1, 'y': y});
		    if (y > 0) {
			    tilesToDetonate.push({'x': x+1, 'y': y-1});
		    }
		    if (y < (Config.h-1)) {
    			tilesToDetonate.push({'x': x+1, 'y': y+1});
	    	}
	    }

	    if (y > 0) {
		    tilesToDetonate.push({'x': x, 'y': y-1});
	    } 

	    if (y < (Config.h-1)) {
		    tilesToDetonate.push({'x': x, 'y': y+1});
	    }
	    tilesToDetonate.push({'x': x, 'y': y});
	    for (let i=0; i < tilesToDetonate.length; i++) {
		    let tile = tilesToDetonate[i];
			state.getBoard().detonateTile(tile.x, tile.y);
	    }
    }

	static findVerticalMoves(board, i, j) {
        let movements = [];
        let possibleMove;

        let tileValue = board.getTile(i, j).getValue();

        let firstRow = i === 0;
        let firstColumn = j === 0;
        let lastRow = Config.h === i+1;
        let lastColumn = Config.w === (j + 1);
        let canGoDown2Times = Config.h > i+2;
        let canGoDown3Times = Config.h > i + 3;        
        if (lastRow) {
            return movements;
        }

        let bottomValue = board.getTile(i+1, j).getValue();
        if (tileValue !== bottomValue) {
            if (canGoDown2Times) {
                let fartherBottomValue = board.getTile(i+2, j).getValue();
                if (tileValue === fartherBottomValue) {
                    if (!firstColumn) {
                        let bottomLeftValue = board.getTile(i+1, j-1).getValue();
                        if (bottomLeftValue === tileValue) {
                            possibleMove = new PossibleMove({x: i+1, y: j}, {x: i+1, y: j-1}, "vertical_bottom_left");
                            possibleMove.addRelatedCoord(i, j);
                            possibleMove.addRelatedCoord(i+1, j-1);
                            possibleMove.addRelatedCoord(i+2, j);
                            movements.push(possibleMove)
                        }                                
                    }
                    if (!lastColumn) {
                        let bottomRightValue = board.getTile(i+1, j+1).getValue();
                        if (bottomRightValue === tileValue) {
                            possibleMove = new PossibleMove({x: i+1, y: j}, {x: i+1, y: j+1}, "vertical_bottom_right");
                            possibleMove.addRelatedCoord(i, j);
                            possibleMove.addRelatedCoord(i+1, j+1);
                            possibleMove.addRelatedCoord(i+2, j);                            
                            movements.push(possibleMove);
                        }
                    }
                    if (!canGoDown3Times) {
                        return movements;
                    }
                    let doubleFartherBottomValue = board.getTile(i+3, j).getValue();
                    if (doubleFartherBottomValue === tileValue) {
                        possibleMove = new PossibleMove({x: i, y: j}, {x: i+1, y: j}, "vertical_double_farther_bottom");
                        possibleMove.addRelatedCoord(i, j);
                        possibleMove.addRelatedCoord(i+2, j);
                        possibleMove.addRelatedCoord(i+3, j);                           
                        movements.push(possibleMove);
                    }
                }
            }
        } else {
            if (!firstRow) {
                if (!firstColumn) {
                    let upperLeftValue = board.getTile(i-1, j-1).getValue();
                    if (upperLeftValue === tileValue) {
                        possibleMove = new PossibleMove({x: i-1, y: j}, {x: i-1, y: j-1}, "vertical_upper_left");
                        possibleMove.addRelatedCoord(i, j);
                        possibleMove.addRelatedCoord(i+1, j);
                        possibleMove.addRelatedCoord(i-1, j-1);     
                        movements.push(possibleMove);
                    }
                }
                if (!lastColumn) {
                    let upperRightValue = board.getTile(i-1, j+1).getValue();
                    if (upperRightValue === tileValue) {
                        possibleMove = new PossibleMove({x: i-1, y: j}, {x: i-1, y: j+1}, "vertical_upper_left");
                        possibleMove.addRelatedCoord(i, j);
                        possibleMove.addRelatedCoord(i+1, j);
                        possibleMove.addRelatedCoord(i-1, j+1);
                        movements.push(possibleMove);
                    }
                }
            }

            if (!canGoDown2Times) {
                return movements;
            }
            if (!firstColumn) {
                let fartherBottomLeftValue = board.getTile(i+2, j-1).getValue();
                if (fartherBottomLeftValue === tileValue) {
                    possibleMove = new PossibleMove({x: i+2, y: j}, {x: i+2, y: j-1}, "vertical_farther_bottom_left");
                    possibleMove.addRelatedCoord(i, j);
                    possibleMove.addRelatedCoord(i+1, j);
                    possibleMove.addRelatedCoord(i+2, j-1);
                    movements.push(possibleMove);
                }
            }
            if (!lastColumn) {
                let fartherBottomRightValue = board.getTile(i+2, j+1).getValue();
                if (fartherBottomRightValue === tileValue) {
                    possibleMove = new PossibleMove({x: i+2, y: j}, {x: i+2, y: j+1}, "vertical_farther_bottom_right");
                    possibleMove.addRelatedCoord(i, j);
                    possibleMove.addRelatedCoord(i+1, j);
                    possibleMove.addRelatedCoord(i+2, j+1);
                    movements.push(possibleMove);                    
                }
            }

            if (!canGoDown3Times) {
                return movements;
            }
            let doubleFartherBottomValue = board.getTile(i+3, j).getValue();
            if (doubleFartherBottomValue === tileValue) {
                possibleMove = new PossibleMove({x: i+2, y: j}, {x: i+3, y: j}, "vertical_double_farther_bottom");
                possibleMove.addRelatedCoord(i, j);
                possibleMove.addRelatedCoord(i+1, j);
                possibleMove.addRelatedCoord(i+3, j);
                movements.push(possibleMove);
            }            
        }
        return movements;
    }
    static findHorizontalMoves(board, i, j) {           
        let movements = [];
        let tile = board.getTile(i, j);     
        let currValue = tile.getValue();
        
        let firstColumn = j === 0;
        let lastColumn = j === 7;            
        let firstRow = i === 0;
        let lastRow = (i + 1) == Config.h;
        let canGoRight2Times = Config.w > j+2;
        let canGoRight3Times = Config.w > j+3;
        let canGoLeft2Times = j-2 > -1;

        if (lastColumn) {
            return movements;
        }
        
        let possibleMove;
        
        let rightValue = board.getTile(i, j+1).getValue();
        if (currValue !== rightValue) {
            if (!canGoRight2Times) {
                return movements;
            }
            let fartherRightValue = board.getTile(i, j+2).getValue();
            if (currValue === fartherRightValue) {
                if (!firstRow) {
                    let upperRightValue = board.getTile(i-1, j+1).getValue();
                    if (currValue === upperRightValue) {
                        possibleMove = new PossibleMove({x: i, y: j+1}, {x: i-1, y: j+1}, "horizontal_upper_right");
                        possibleMove.addRelatedCoord(i, j);
                        possibleMove.addRelatedCoord(i, j+2);
                        possibleMove.addRelatedCoord(i-1, j+1);                            
                        movements.push(possibleMove);
                    }
                }
                if (!lastRow) {
                    let bottomRightValue = board.getTile(i+1, j+1).getValue();
                    if (currValue === bottomRightValue) {
                        possibleMove = new PossibleMove({x: i, y: j+1}, {x: i+1, y: j+1}, "horizontal_bottom_right");
                        possibleMove.addRelatedCoord(i, j);
                        possibleMove.addRelatedCoord(i, j+2);
                        possibleMove.addRelatedCoord(i+1, j+1);                            
                        movements.push(possibleMove);
                    }
                }
                if (canGoRight3Times) {
                    let doubleFartherRightValue = board.getTile(i, j+3).getValue();
                    if (currValue === doubleFartherRightValue) {
                        possibleMove = new PossibleMove({x: i, y: j}, {x: i, y: j+1}, "horizontal_double_farther_right");
                        possibleMove.addRelatedCoord(i, j);
                        possibleMove.addRelatedCoord(i, j+2);
                        possibleMove.addRelatedCoord(i, j+3);                            
                        movements.push(possibleMove);
                    }
                }
            } else if (rightValue === fartherRightValue) {
                if (!firstRow) {
                    let upperValue = board.getTile(i-1, j).getValue();
                    if (rightValue === upperValue) {
                        possibleMove = new PossibleMove({x: i, y: j}, {x: i-1, y: j}, "horizontal_upper");
                        possibleMove.addRelatedCoord(i, j+1);
                        possibleMove.addRelatedCoord(i, j+2);
                        possibleMove.addRelatedCoord(i-1, j);                            
                        movements.push(possibleMove);
                    }
                }
                if (!lastRow) {
                    let bottomValue = board.getTile(i+1, j).getValue();
                    if (rightValue === bottomValue) {
                        possibleMove = new PossibleMove({x: i, y: j}, {x: i+1, y: j}, "horizontal_bottom");
                        possibleMove.addRelatedCoord(i, j+1);
                        possibleMove.addRelatedCoord(i, j+2);
                        possibleMove.addRelatedCoord(i+1, j);
                        movements.push(possibleMove);
                    }
                }
                if (!firstColumn) {
                    let leftValue = board.getTile(i, j-1).getValue();
                    if (rightValue === leftValue) {
                        possibleMove = new PossibleMove({x: i, y: j}, {x: i, y: j-1}, "horizontal_left");
                        possibleMove.addRelatedCoord(i, j+1);
                        possibleMove.addRelatedCoord(i, j+2);
                        possibleMove.addRelatedCoord(i, j-1);
                        movements.push(possibleMove);
                    }
                }
            }
            return movements;
        }
        if (canGoRight2Times) {
            if (!firstRow) {         
                let fartherUpperRightValue = board.getTile(i-1, j+2).getValue();
                if (currValue === fartherUpperRightValue) {
                    possibleMove = new PossibleMove({x: i, y: j+2}, {x: i-1, y: j+2}, "horizontal_farther_upper_right");
                    possibleMove.addRelatedCoord(i, j);
                    possibleMove.addRelatedCoord(i, j+1);
                    possibleMove.addRelatedCoord(i-1, j+2);
                    movements.push(possibleMove);
                }                
            }
            if (!lastRow) {
                let fartherBottomRightValue = board.getTile(i+1, j+2).getValue();
                if (currValue === fartherBottomRightValue) {
                    possibleMove = new PossibleMove({x: i, y: j+2}, {x: i+1, y: j+2}, "horizontal_farther_bottom_right");
                    possibleMove.addRelatedCoord(i, j);
                    possibleMove.addRelatedCoord(i, j+1);
                    possibleMove.addRelatedCoord(i+1, j+2);
                    movements.push(possibleMove);
                }
            }
            if (canGoRight3Times) {
                let doubleFartherRightValue = board.getTile(i, j+3).getValue();
                if (doubleFartherRightValue === currValue) {
                    possibleMove = new PossibleMove({x: i, y: j+2}, {x: i, y: j+3}, "horizontal_double_farther_right");
                    possibleMove.addRelatedCoord(i, j);
                    possibleMove.addRelatedCoord(i, j+1);
                    possibleMove.addRelatedCoord(i, j+3);
                    movements.push(possibleMove);
                }
            }
        }
        if (firstColumn) {
            return movements;
        }
        
        if (!firstRow) {
            let upperLeftValue = board.getTile(i-1, j-1).getValue();
            if (currValue === upperLeftValue) {
                possibleMove = new PossibleMove({x: i, y: j-1}, {x: i-1, y: j-1}, "horizontal_upper_left");
                possibleMove.addRelatedCoord(i, j);
                possibleMove.addRelatedCoord(i, j+1);
                possibleMove.addRelatedCoord(i-1, j-1);
                movements.push(possibleMove);
            }
        }
        if (!lastRow) {
            let bottomLeftValue = board.getTile(i+1, j-1).getValue();
            if (currValue === bottomLeftValue) {
                possibleMove = new PossibleMove({x: i, y: j-1}, {x: i+1, y: j-1}, "horizontal_bottom_left");
                possibleMove.addRelatedCoord(i, j);
                possibleMove.addRelatedCoord(i, j+1);
                possibleMove.addRelatedCoord(i+1, j-1);
                movements.push(possibleMove);
            }
        }
        if (!canGoLeft2Times) {
            return movements;
        }
        let fartherLeftValue = board.getTile(i, j-2).getValue();
        if (fartherLeftValue === currValue) {
            possibleMove = new PossibleMove({x: i, y: j-1}, {x: i, y: j-2}, "horizontal_farther_left");
            possibleMove.addRelatedCoord(i, j);
            possibleMove.addRelatedCoord(i, j+1);
            possibleMove.addRelatedCoord(i, j-2);
            movements.push(possibleMove);
        }
		return movements;
    }
	static findAllMoves() {
        let state = window.STATE;
        let board = state.getBoard();
        let movements = [];

        board.runToEachTile((_, params) => {
            let verticalMoves = Referee.findVerticalMoves(board, params.x, params.y);
            let horizontalMoves = Referee.findHorizontalMoves(board, params.x, params.y);
            movements = movements.concat(verticalMoves.concat(horizontalMoves));
        });
		return movements;
    }
}

export { Referee }