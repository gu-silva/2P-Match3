const ws = new WebSocket("ws://localhost:8080");
ws.addEventListener("open", () =>{
  console.log("We are connected");
  ws.send("How are you?");
});
 
ws.addEventListener('message', function (event) {
    console.log(event.data);
});

// Global:
var myBoard;
var clickedTile;
var secondClickedTile;

var processing = false;
var me = true;

var myPoints = 0;
var opponentPoints = 0;

// Const:
const h = 8;
const w = 8;
const t = 6;
const colors = ['Crimson', 'Khaki', 'Plum', 'PaleGreen', 'TlookForMatcheseal', 'Sienna']
const avatars = ['tile-0', 'tile-1', 'tile-2', 'tile-3', 'tile-4', 'tile-5', 'bomb']
const winRate = 0.45;

function didWin() {
	let numTilesToWin = Math.round((h * w) * winRate);
	let numCapturedTiles;
	if (me) {
		numCapturedTiles = document.querySelectorAll('.captured').length;
	} else {
		numCapturedTiles = document.querySelectorAll('.captured-opponent').length;
	}
	return numCapturedTiles >= numTilesToWin
}

function startNewGame() {
	console.log("### WELCOME ### \n\n -> Feel free to e-mail me for suggestions. \n\n");
	myBoard = generateBoard();
	while (lookForMatches(myBoard)) {lookForMatches
		myBoard = generateBoard();
	}

	let container = document.getElementsByClassName("container")[0];
	container.innerHTML = "";
	for (let i=0; i < h; i++) {
		for (let j=0; j < w; j++) {
			let tile = createTile(i, j, myBoard[i][j].value)
            container.appendChild(tile);
		}
	}
}

function sleep(time) {
	return new Promise((resolve) => setTimeout(resolve, time));
}

function cleanTileClassList(classList) {
	while (classList.length > 0) {
		classList.remove(classList.item(0));
	}
	classList.add("tile");
	return classList;
}

function replaceTileColor(tile, capturedBy) {
	let newClass = capturedBy ? "captured" : "captured-opponent";
	let classToRemove = undefined;
	for (let i=0; i < tile.classList.length; i++) {
		if (tile.classList[i].includes("captured")) {
			classToRemove = i;
			break;
		}
	}
	if (typeof classToRemove !== 'undefined') {
		tile.classList.remove(tile.classList.item(classToRemove));
	}
	tile.classList.add(newClass);
}

function generateTileValue() {
	return Math.floor(Math.random() * t);
}

function createTile(x, y, value) {
	let tile = document.createElement("div");
	tile.id = "column_" + x + "_" + y;
	tile.classList.add("column");
	//tile.style.backgroundColor = colors[value];
	//tile.addEventListener('click', handleClick);
	//tile.id = x + "_" + y;
	//tile.setAttribute("x", x);
	//tile.setAttribute("y", y);
	//tile.setAttribute("value", value);
	let childTile = document.createElement("div");
	childTile.classList.add("tile");
	childTile.classList.add(avatars[value]);
	childTile.addEventListener('click', handleClick);
	childTile.id = x + "_" + y;
	childTile.setAttribute("x", x);
	childTile.setAttribute("y", y);
	childTile.setAttribute("value", value);
	tile.append(childTile)
	return tile;
}

function slideTile(x, y, slideSize) {
	let tile = document.getElementById(x + "_" + y);
	let firstRow = x === 0;
	let from = firstRow ? {transform: "translate(0, -80px)"} : {};
	if (x !== (h-1)) {		
		tile.animate([from,
		{
			transform: "translate(0, " + slideSize + "px)"
		}
	], {
		duration: 100,
	});

		tile.addEventListener("animationend", function(e) {
			e.target.style.opacity = "1";	
		});
	}

}
function updateTile(x, y, tile, board) {
	let domTile = document.getElementById(x + "_" + y);
	let value = tile.value;
	if (value !== null) {
		domTile.classList = cleanTileClassList(domTile.classList);
		domTile.classList.add(avatars[value]);
		domTile.setAttribute("value", value);
	} else {
		domTile.setAttribute("value", 'x');
	}	
	board[x][y] = tile;
}

function generateBoard() {
	let board = new Array(h);
	for (let i=0; i < h; i++) {
	    for (let j=0; j < w; j++) {
            if (!board[i]) {
				board[i] = new Array();
			}
	    	board[i].push({'value': generateTileValue(), 'outdated': false});
	    }
	}
	return board;
}

function lookForMatches(board, countPoints, originalMovement) {
	let matched = false;
	let totalPoints = 0;
	function verifyMatch(horizontal) {
		let points = 1;
		let prevTile;
		for (let i=0; i < h; i++) {
		    for (let j=0; j < w; j++) {
				let currTile = horizontal ? board[i][j].value : board[j][i].value;
				if (typeof prevTile == "undefined") {
					prevTile = currTile;
					continue;
				}
				if (currTile == prevTile) {
					points++;
					if (points === 3) {
						matched = true;
						for (let m = 0; m < 3; m++) {
							let x = horizontal ? i : j - m;
							let y = horizontal ? j - m : i;
							board[x][y].outdated = true;
							if (countPoints) {
								let domEl = document.getElementById("column_"+ x + "_" + y);
								replaceTileColor(domEl, me);
							}		
						}
					} else if (points > 3) {
						let x = horizontal ? i : j;
						let y = horizontal ? j : i;
						board[x][y].outdated = true;
						if (countPoints) {
							let domEl = document.getElementById("column_"+ x + "_" + y);
							replaceTileColor(domEl, me);
						}
						if (j === (w-1)) {
							totalPoints += points;
						}
					}
				} else {
					if (points > 2) {
						totalPoints += points;
					}
					points = 1;
				}
				prevTile = currTile
			}
			prevTile = undefined;
			points = 1;
		}
	 return matched;
	}

	let horizontalMatch = verifyMatch(true);
	let verticalMatch = verifyMatch(false);
	if (originalMovement && totalPoints > 3) {
		let x = parseInt(secondClickedTile.x);
		y = parseInt(secondClickedTile.y);
		board[x][y] = { 'value': t, "outdated" : false, "bombAge": 0, "mine": me };
		let bombTile = document.getElementById(x + "_" + y);
		bombTile.setAttribute("value", t);
		bombTile.classList = cleanTileClassList(bombTile.classList)
		bombTile.classList.add("bomb");
	}

	return horizontalMatch || verticalMatch;
}

function increaseBombsAge(board) {
	for (let i=0; i < h; i++) {
		for (let j=0; j < w; j++) {
			// It's a bomb
			if (board[i][j].value === t) {
				board[i][j].bombAge += 1;
			}
		}
	}
}

function explodeBombIfExists(board) {
	for (let i=0; i < h; i++) {
		for (let j=0; j < w; j++) {
			// It's a bomb
			let tile = board[i][j];
			if (tile.value === t) {
				let mine = me ? tile.mine : !tile.mine;
				if (!mine) {
					continue;
				}

				if (tile.bombAge > 1) {
					detonateAround(i, j, board);
				}
			}
		}
	}
}

function detonateAround(x, y, board) {
	let tilesToDetonate = []
	if (x > 0) {
		tilesToDetonate.push({'x': x-1, 'y': y});
		if (y > 0) {
			tilesToDetonate.push({'x': x-1, 'y': y-1});
		}
		if (y < (h-1)) {
			tilesToDetonate.push({'x': x-1, 'y': y+1});
		}
	}

	if (x < (w-1)) {
		tilesToDetonate.push({'x': x+1, 'y': y});
		if (y > 0) {
			tilesToDetonate.push({'x': x+1, 'y': y-1});
		}
		if (y < (h-1)) {
			tilesToDetonate.push({'x': x+1, 'y': y+1});
		}
	}

	if (y > 0) {
		tilesToDetonate.push({'x': x, 'y': y-1});
	}

	if (y < (h-1)) {
		tilesToDetonate.push({'x': x, 'y': y+1});
	}
	tilesToDetonate.push({'x': x, 'y': y});
	for (let i=0; i < tilesToDetonate.length; i++) {
		let tile = tilesToDetonate[i];
		detonateTile(tile.x, tile.y, board);
	}
}

function detonateTile(x, y, board) {
	board[x][y].outdated = true;
	let domEl = document.getElementById("column_"+ x + "_" + y);	
	replaceTileColor(domEl, me);
}

function compareTiles(tile, other) {
	return tile.x === other.x && tile.y === other.y;
}

function paintTilesWhite(board) {
	for (let i=0; i < h; i++) {
		for (let j=0; j < w; j++) {
			let tile = board[i][j];
			if (tile.outdated) {
				let el = document.getElementById(i + "_" + j);
				el.classList = cleanTileClassList(el.classList);				
				el.classList.add("kill");
				el.classList.add(avatars[tile.value] + "-kill");
			}
		}
	}
}

function isMovementValid(tile) {
	let validMovements = [
		{
			"x": clickedTile.x, 
			"y": (parseInt(clickedTile.y) + 1).toString()
		},
		{
			"x": clickedTile.x,
			"y": (parseInt(clickedTile.y) - 1).toString()
		},
		{
			"x": (parseInt(clickedTile.x) + 1).toString(), 
			"y": clickedTile.y 
		},
		{
			"x": (parseInt(clickedTile.x) - 1).toString(),
			"y": clickedTile.y
		},
	];

	let valid = false;
	for (let i=0; i < validMovements.length; i++) {
		let movement = validMovements[i];
		if (compareTiles(movement, tile)) {
			valid = true;
			break;
		}
	}
	return valid;
}

function swapTiles(firstTile, secondTile) {
	let tile = document.getElementById(firstTile.x + "_" + firstTile.y);
	let value = parseInt(tile.getAttribute("value"));
	let avatar = avatars[value];
	//let backgroundColor = tile.style.backgroundColor;
	
	let otherTile = document.getElementById(secondTile.x + "_" + secondTile.y);
	let otherValue = parseInt(otherTile.getAttribute("value"));
	let otherAvatar = avatars[otherValue];
	//let otherBackgroundColor = otherTile.style.backgroundColor;

	tile.setAttribute("value", otherValue);
	//tile.style.backgroundColor = otherBackgroundColor;
	//otherTile.style.backgroundColor = backgroundColor;
	otherTile.setAttribute("value", value);

	tile.classList = cleanTileClassList(tile.classList)
	tile.classList.add(otherAvatar);

	otherTile.classList = cleanTileClassList(otherTile.classList)
	otherTile.classList.add(avatar);	

	let valueAux = myBoard[firstTile.x][firstTile.y];
	myBoard[firstTile.x][firstTile.y] = myBoard[secondTile.x][secondTile.y];
	myBoard[secondTile.x][secondTile.y] = valueAux;
}

function handleClick(e) {
	if (processing) {
		return;
	}
	processing = true;
	
	let x = e.target.getAttribute("x");
	let y = e.target.getAttribute("y");
	let currTile = {x, y};

	if (typeof clickedTile == "undefined") {
		clickedTile = currTile;
		e.target.classList.add("selected");
		processing = false;
		return;
    }
	if (compareTiles(currTile, clickedTile)) {
		console.log('same tile');
		processing = false;
		return;
	}
	secondClickedTile = currTile;

	let selected = document.getElementsByClassName("selected");
	for (let i = 0; i < selected.length; i++) {
		selected[i].classList.remove("selected");
	}

	let valid = isMovementValid(currTile);
	if (!valid) {
		clickedTile = undefined;
		processing = false;
		return;
	}

	swapTiles(currTile, clickedTile);
	let match = lookForMatches(myBoard, true, true);
 	if (!match) {
		setTimeout(() => {
			swapTiles(clickedTile, currTile);
			clickedTile = undefined;
			secondClickedTile = undefined;
			processing = false;
		}, 500);
		return;
	} else {
		explodeBombIfExists(myBoard);
		reorderTiles(myBoard, () => {
			increaseBombsAge(myBoard);
			clickedTile = undefined;
			secondClickedTile = undefined;
			processing = false;
			if (didWin()) {
				alert(me ? "YOU" : "OPPONNENT");
				startNewGame();
				return;
			}
			me = !me;			
		});
	}
}

function reorderTiles(board, cb) {
	paintTilesWhite(board);
	setTimeout(() => {
	for (let x = (w - 1); x >= 0; x--) {
		for (let y = (h - 1); y >= 0; y--) {
			if (board[x][y].outdated) {
				if (x === 0) {
					let newValue = generateTileValue();
					updateTile(x, y, { 'value': newValue, 'outdated': false }, myBoard);
				} 
				for (let i = (x - 1); i >= 0; i--) {
					if (board[i][y].outdated) {
						if (i == 0) {
							let newValue = generateTileValue();
							//let slideSize = ((x-1) * 80);
							//slideTile(i, y, slideSize);
							//setTimeout(() => {
							updateTile(x, y, { 'value': newValue, 'outdated': false }, myBoard);
							//}, 50);
							break;
						}
						continue;
					} else {
						//let slideSize = ((x - i) * 80);
						//slideTile(i, y, slideSize);
						//setTimeout(() => {
						updateTile(x, y, board[i][y], myBoard);				
						updateTile(i, y, { 'value': null, 'outdated': true }, myBoard);
						//}, 50);
						break;
					}
				}
			}
		}
	}

	let match = lookForMatches(myBoard, true, false);
 	if (!match) {
		setTimeout(cb, 100);
		return;
	} else {
		reorderTiles(myBoard, cb);
	}

	}, 500);
}

startNewGame();
