import { Config } from "./config.js";
import { BOARD_CMDS } from "./board.js"
import { Bomb } from "./bomb.js";

const CONTAINER_CLASS = "container";
const COLUMN_CLASS = "column";
const TILE_CLASS = "tile"
const CAPTURED_CLASS = "captured";
const CAPTURED_OPPONENT_CLASS = "captured-opponent";
const KILL_CLASS = "kill";
const SELECTED_CLASS = "selected"

class DomHandler {
    constructor(){}
    static cleanBoard() {
        let container = document.getElementsByClassName(CONTAINER_CLASS)[0];
	    container.innerHTML = "";
    }

    static buildBoard (handleClick) {
        let state = window.STATE;
        let board = state.getBoard();
        let container = document.getElementsByClassName(CONTAINER_CLASS)[0];
	    container.innerHTML = "";
        board.runToEachTile((tile, params) => {
            let domTile = this.createTile(params.x, params.y, tile.value, handleClick);
            container.appendChild(domTile);
        });
        //DomHandler.createTimeBar();
    }

    static createTimeBar() {
        let timeWrapper = document.createElement("div");
        timeWrapper.classList.add("time-wrapper");
        let time = document.createElement("span");
        time.id = "time";
        time.classList.add("time");
        timeWrapper.append(time);
        let container = document.getElementsByClassName(CONTAINER_CLASS)[0];
        container.appendChild(timeWrapper);
    }

    static fillTimeBar() {
        let time = document.getElementById("time");
        time.innerHTML = "";
        time.style.width = "100%";
        time.classList.remove("count-down");
    }
    static cleanTimeBar() {
        let time = document.getElementById("time");
        time.innerHTML = "";
        time.style.width = "0%";
        time.classList.remove("count-down");
    }
    static countDownInterval = 0;
    static countDownTimeBar() {
        DomHandler.countDownInterval = setInterval(() => {
            let time = document.getElementById("time");
            if (time.innerHTML === "") {
                time.innerHTML = "20";
                time.style.width = "100%";
            } else {
                let currTime = parseInt(time.innerHTML);
                if (currTime > 0) {
                    currTime--;
                    time.innerHTML = currTime;
                    time.style.width = (100*currTime)/20 + "%";
                } else {
                    console.log("time's up");
                    clearInterval(DomHandler.countDownInterval);
                    return
                }
            }                
        }, 1000);        
    }

    static createTile (x, y, value, handleClick) {
        let tile = document.createElement("div");
            tile.id = this.columnId(x, y);
            tile.classList.add(COLUMN_CLASS);
            let childTile = document.createElement("div");
            childTile.classList.add(TILE_CLASS);
            childTile.classList.add(Config.avatars[value]);
            childTile.addEventListener('click', handleClick);
            childTile.id = this.tileId(x, y);
            childTile.setAttribute("x", x);
            childTile.setAttribute("y", y);
            childTile.setAttribute("value", value);
            tile.append(childTile);

            return tile;
    }
    static getTile(x, y) {
        return document.getElementById(this.tileId(x, y));
    }
    static tileId(x, y) {
        return `${x}_${y}`;
    }
    static getColumn(x, y) {
        return document.getElementById(this.columnId(x, y));
    }
    static columnId(x, y) {
        return `column_${x}_${y}`;
    }
    static cleanTileClassList(classList) {
        while (classList.length > 0) {
            classList.remove(classList.item(0));
        }
        classList.add(TILE_CLASS);
        return classList;
    }
    static replaceEligibleTileColor() {
        let state = window.STATE;
        let board = state.getBoard();
        board.runToEachTile((tile, params) => {
            if (!tile.isOutdated() && !(tile instanceof Bomb && tile.bombAge == 0)) {
                return BOARD_CMDS.continue;
            }

            let domTile = this.getColumn(params.x, params.y);
            let newClass = state.isMyTurn() ? CAPTURED_CLASS : CAPTURED_OPPONENT_CLASS;
            let classToRemove = undefined;
            for (let i=0; i < domTile.classList.length; i++) {
                if (domTile.classList[i].includes(CAPTURED_CLASS)) {
                    classToRemove = i;
                    break;
                }
            }
            if (typeof classToRemove !== 'undefined') {
                domTile.classList.remove(domTile.classList.item(classToRemove));
            }
            domTile.classList.add(newClass);
        });
    }
    static killEligibleTiles() {
        let state = window.STATE;
        let board = state.getBoard();
        board.runToEachTile((tile, params) => {
            if (tile.outdated) {
				let el = this.getTile(params.x, params.y);				
                this.cleanTileClassList(el.classList);				
				el.classList.add(KILL_CLASS);
				el.classList.add(`${Config.avatars[tile.value]}-${KILL_CLASS}`);
			}
        });			
    }
    static swapTiles(firstTile, secondTile) {        
        let tile = this.getTile(firstTile.x, firstTile.y);
        let value = parseInt(tile.getAttribute("value"));
        let avatar = Config.avatars[value];
        
        let otherTile = this.getTile(secondTile.x, secondTile.y);
        let otherValue = parseInt(otherTile.getAttribute("value"));
        let otherAvatar = Config.avatars[otherValue];
    
        tile.setAttribute("value", otherValue);
        otherTile.setAttribute("value", value);
    
        this.cleanTileClassList(tile.classList)
        tile.classList.add(otherAvatar);

        this.cleanTileClassList(otherTile.classList)
        otherTile.classList.add(avatar);            
    }
    static updateTile(x, y, value) {
        let tile = this.getTile(x, y);	    
	    if (value !== null) {
		    this.cleanTileClassList(tile.classList);
		    tile.classList.add(Config.avatars[value]);
		    tile.setAttribute("value", value);
	    } else {
		    tile.setAttribute("value", 'x');
	    }
    }
    
    static addOpponentsTurnHeaderText() {
        DomHandler.setHeaderText(Config.textOpponentsTurn)
    }

    static addYourTurnHeaderText() {
        DomHandler.setHeaderText(Config.textYourTurn)
    }

    static setHeaderText(text) {
        document.getElementById("header-text").innerHTML = text;
    }

    static markSelection(x, y) {
        this.getTile(x, y).classList.add(SELECTED_CLASS);
    }
    static removeSelection(x, y) {
        this.getTile(x, y).classList.remove(SELECTED_CLASS);    
    }
    static cleanProgress() {
        document.getElementById("my-progress").style.width = "0%";
        document.getElementById("opponent-progress").style.width = "0%";
    }
    static updateProgress() {
        let numTilesToWin = Math.round((Config.h * Config.w) * Config.winRate);
        
        let myTiles = document.querySelectorAll('.' + Config.capturedCssClass).length;
        let hisTiles = document.querySelectorAll('.' + Config.capturedOpponentCssClass).length;
        
        let myPercent = (myTiles * 100)/numTilesToWin;
        let hisPercent = (hisTiles * 100)/numTilesToWin;
        myPercent = myPercent > 100 ? 100 : myPercent;
        hisPercent = hisPercent > 100 ? 100 : hisPercent;

        document.getElementById("my-progress").style.width = (myPercent) + "%";
        document.getElementById("opponent-progress").style.width = (hisPercent) + "%";        
    }
    static updatePlayersInfo() {
        let state = window.STATE;
        document.getElementById("my-name").innerHTML = state.getPlayerName();
        document.getElementById("opponent-name").innerHTML = state.getOpponentName();
        document.getElementById("my-picture").src = `https://avatars.dicebear.com/api/pixel-art/${state.getPlayerName()}.svg`;
        document.getElementById("opponent-picture").src = `https://avatars.dicebear.com/api/pixel-art/${state.getOpponentName()}.svg`;
    }
    static startTurn() {
        DomHandler.addYourTurnHeaderText();
        //DomHandler.fillTimeBar();
        //DomHandler.countDownTimeBar();
        document.getElementById("opponent-picture").style.marginBottom = "-1.8em";
        document.getElementById("my-picture").style.marginBottom = "0em";    
    }
    static endTurn() {
        DomHandler.addOpponentsTurnHeaderText();
        //DomHandler.cleanTimeBar();
        //clearInterval(DomHandler.countDownInterval);
        document.getElementById("opponent-picture").style.marginBottom = "0em";
        document.getElementById("my-picture").style.marginBottom = "-1.8em";
    }
    static createPlayerPanel(my) {
        let prefix = my ? "my" : "opponent";

        let panel = document.createElement("div");
        panel.classList.add("player-container");
        
        let picture = document.createElement("img");
        picture.id = `${prefix}-picture`;
        picture.classList.add("profile-picture");        
        panel.append(picture);
        
        let playerCard = document.createElement("div");
        playerCard.classList.add("player-card");
        
        let name = document.createElement("p");
        name.id = `${prefix}-name`;
        playerCard.append(name);

        let progressWrapper = document.createElement("div");
        progressWrapper.classList.add("progress-wrapper");
        
        let progress = document.createElement("span");
        progress.classList.add("progress");
        progress.id = `${prefix}-progress`;
        progressWrapper.append(progress);

        let catchPhrase = document.createElement("p");
        catchPhrase.id = `${prefix}-catch-phrase`;

        playerCard.append(name);
        playerCard.append(progressWrapper);
        playerCard.append(catchPhrase);
        panel.append(playerCard);
        
        let side = my ? "left" : "right";
        document.getElementsByClassName(`${side}-panel`)[0].append(panel);
    }
    static createPlayerPanels() {
        if (document.getElementsByClassName("player-card").length === 0) {
            DomHandler.createPlayerPanel(true);
            DomHandler.createPlayerPanel(false);
            return
        }
        // It's already there, so let's show it!
        DomHandler.showPlayerPanels();
    }
    static hidePlayerPanels() {
        let playerPanels = document.getElementsByClassName("player-container");
        for (let i=0; i< playerPanels.length; i++){
            let panel = playerPanels[i];
            panel.setAttribute("hidden", true);
        }    
    }
    static showPlayerPanels() {
        let playerPanels = document.getElementsByClassName("player-container");
        for (let i=0; i< playerPanels.length; i++){
            let panel = playerPanels[i];
            panel.setAttribute("hidden", true);
            panel.removeAttribute("hidden");
        }    
    }
    static showWaitingOpponentPanel() {
        DomHandler.hidePostGameMessage();
        document.getElementById("modal").removeAttribute("hidden");
        document.getElementById("waiting-opponent").removeAttribute("hidden");
    }
    static hideWaitingOpponentPanel() {
        document.getElementById("modal").setAttribute("hidden", true);
        document.getElementById("waiting-opponent").setAttribute("hidden", true);
    }
    static showPostGameMessage(won) {
        DomHandler.setHeaderText("");
        let postGameMsg = won ? "Parabéns, você venceu!" : "Que pena, o oponente venceu!";
        document.getElementById("txt-post-game").innerHTML = postGameMsg;
        document.getElementById("post-game").removeAttribute("hidden");
        document.getElementById("modal").removeAttribute("hidden");
    }
    static hidePostGameMessage() {
        document.getElementById("post-game").setAttribute("hidden", true);
    }

    
}
export { DomHandler };