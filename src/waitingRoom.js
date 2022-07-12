class WaitingRoom {
    constructor() {
        this.queue = [];
    }
    pickFirst() {
        return this.queue.shift();
    }
    enqueue(element) {
        this.queue.push(element);
    }
    isAnybodyWaiting() {
        return this.queue.length > 0;
    }
    clearQueue() {
        this.queue = [];
    }
    remove(playerId) {
        this.queue = this.queue.filter(p => {
            return p.id !== playerId;
        });
    }
}
export { WaitingRoom };