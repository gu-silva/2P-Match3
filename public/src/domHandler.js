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
    static bgSong = new Audio("./res/themes/matchwood/sound/song.mp3");
    static cleanBoard() {
        let container = document.getElementsByClassName(CONTAINER_CLASS)[0];
	    container.innerHTML = "";
    }
    static playSong() {
        DomHandler.bgSong.pause();
        DomHandler.bgSong.currentTime = 0;
        DomHandler.bgSong.loop = true;
        DomHandler.bgSong.volume = 0.15;
        DomHandler.bgSong.play();
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
        DomHandler.createTimeBar();
    }

    static createTimeBar() {
        let timeWrapper = document.createElement("div");
        timeWrapper.classList.add("time-wrapper");
        let time = document.createElement("span");
        time.id = "time";
        time.classList.add("time");
        time.classList.add("no-transition");
        timeWrapper.append(time);
        let container = document.getElementsByClassName(CONTAINER_CLASS)[0];
        container.appendChild(timeWrapper);
    }

    static fillTimeBar() {
        let time = document.getElementById("time");
        time.classList.add("no-transition");
        time.innerHTML = "20";
        time.style.width = "100%";    
    }
    static cleanTimeBar() {
        let time = document.getElementById("time");
        //time.classList.add("no-transition");
        time.innerHTML = "";
        time.style.width = "0%";
    }
    static tickTimeBar() {
        let time = document.getElementById("time");
        if (time.innerHTML !== "") {
            time.classList.remove("no-transition")
            let currTime = parseInt(time.innerHTML);
            if (currTime > 0) {
                currTime--;
                time.innerHTML = currTime;
                time.style.width = (100*currTime)/20 + "%";
                if (currTime <= 10) {
                    for (let i=0; i < 5; i++) {
                        let randomX = Math.floor(Math.random() * (Config.w - 1));
                        let randomY = Math.floor(Math.random() * (Config.h - 1));
                        document.getElementById(`${randomX}_${randomY}`).classList.add("shake");
                    }
                }
            }
        }
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
        let popSoundFx = new Audio("./res/themes/matchwood/sound/pop.wav");
        popSoundFx.play();
        board.runToEachTile((tile, params) => {
            if (tile.outdated) {
				let el = this.getTile(params.x, params.y);				
                this.cleanTileClassList(el.classList);				
				el.classList.add(KILL_CLASS);
				el.classList.add(`${Config.avatars[tile.value]}-${KILL_CLASS}`);
                DomHandler.generateParticles(el);
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
        DomHandler.fillTimeBar();
        document.getElementById("opponent-picture").style.marginBottom = "-1.8em";
        document.getElementById("my-picture").style.marginBottom = "0em";    
    }
    static endTurn() {
        DomHandler.addOpponentsTurnHeaderText();
        DomHandler.cleanTimeBar();
        let selectedTiles = document.getElementsByClassName("selected");
        for (let i = 0; i < selectedTiles.length; i++) {
            selectedTiles[i].classList.remove("selected");
        }
        let shakingTiles = document.getElementsByClassName("shake");
        for (let i = 0; i < shakingTiles.length; i++) {
            shakingTiles[i].classList.remove("shake");
        }
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
    static generateParticles(element) {        
        //let y = window.scrollY + element.getBoundingClientRect().top + 20;
        //let x = window.scrollX + element.getBoundingClientRect().left + 20;
        let y = ((element.getBoundingClientRect().top + element.getBoundingClientRect().bottom) / 2);
        let x = ((element.getBoundingClientRect().left + element.getBoundingClientRect().right) / 2);
        setTimeout(() => {
            pop(x, y);
        }, 500);

        function pop (x, y) {
            for (let i = 0; i < 20; i++) {
            // We call the function createParticle 15 times
            // As we need the coordinates of the mouse, we pass them as arguments
                createParticle(x, y);
            }
        }
          
        function createParticle (x, y) {
            const particle = document.createElement('particle');
            document.body.appendChild(particle);
            
            // Calculate a random size from 5px to 35px
            const size = Math.floor(Math.random() * 30 + 5);
            particle.style.width = `${size}px`;
            particle.style.height = `${size}px`;
            // Generate a random color in a blue/purple palette
            particle.style.background = `hsl(${Math.random() * 0 + 130}, 40%, 100%)`;
            
            // Generate a random x & y destination within a distance of 75px from the mouse
            const destinationX = x + (Math.random() - 0.5) * 2 * 75;
            const destinationY = y + (Math.random() - 0.5) * 2 * 75;
          
            // Store the animation in a variable as we will need it later
            const animation = particle.animate([
              {
                // Set the origin position of the particle
                // We offset the particle with half its size to center it around the mouse
                transform: `translate(-50%, -50%) translate(${x}px, ${y}px)`,
                opacity: 1
              },
              {
                // We define the final coordinates as the second keyframe
                transform: `translate(${destinationX}px, ${destinationY}px)`,
                opacity: 0
              }
            ], {
              // Set a random duration from 500 to 1000ms
              duration: Math.random() * 500 + 1500,
              easing: 'cubic-bezier(0, .9, .57, 1)',
              // Delay every particle with a random value of 200ms
              delay: Math.random() * 200
            });
            
            // When the animation is complete, remove the element from the DOM
            animation.onfinish = () => {
              particle.remove();
            };
          }
    }
    static playBombSoundFx() {
        let popSoundFx = new Audio("./res/themes/matchwood/sound/double_pop.wav");
        popSoundFx.play();
    }
}
export { DomHandler };