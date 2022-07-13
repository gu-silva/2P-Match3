class PossibleMove {
    constructor(first, second, name) {
        this.first = first;
        this.second = second;
        this.coords = [];
        this.name = name;
    }
    addRelatedCoord(x, y) {
        this.coords.push({x, y})
    }
}
export { PossibleMove };