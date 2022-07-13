import { Config } from "./config.js";
import { Tile } from "./tile.js";

class Bomb extends Tile {
    constructor(bombAge, mine) {
        super();
        this.value = Config.t;
        this.outdated = false;
        this.bombAge = bombAge;
        this.mine = mine;
    }
    isMine() {
        return this.mine;
    }
    increaseBombAge() {
        this.bombAge++;
    }
    isEligibleToExplode() {
        return this.bombAge > 1;
    }
}

export { Bomb };