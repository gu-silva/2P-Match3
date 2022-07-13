import { Config } from "./config.js";

class Tile {
    constructor() {    
    }

    static generateTileValue() {
        return Math.floor(Math.random() * Config.t);
    }
    static parse(anonObj) {
        let tile = new Tile();
        tile.value = anonObj.value;
        tile.outdated = anonObj.outdated;
        return tile;
    }
    static newTile(value, outdated) {
        let tile = new Tile();
        tile.value = value;
        tile.outdated = outdated;
        return tile;
    }
    static newRandomTile() {
        let tile = new Tile();
        tile.value = Tile.generateTileValue();
        tile.outdated = false;
        return tile;
    }    
    setValue(value) {
        this.value = value;
    }
    markAsOutdated() {
        this.outdated = true;
    }
    getValue() {
        return this.value;
    }
    isOutdated() {
        return this.outdated;
    }
    static generateEmptyTile() {
        let empty = new Tile();
        empty.setValue(null);
        empty.markAsOutdated();
        return empty;
    }
}

export { Tile };