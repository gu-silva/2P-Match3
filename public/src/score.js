class Score {
    constructor(me=0, other=0) {
        this.me = me;
        this.other = other;
    }
    addPoints(toMe, num) {
        if (toMe) {
            this.me += num; 
        } else {
            this.other += num;
        }    
    }
    transferPoints(toMe, num) {
        if (toMe) {
            this.me += num;
            this.other -= num;
        } else {
            this.other += num;
            this.me -= num;
        }
    }
    addPoint(toMe) {
        this.addPoints(toMe, 1);
    }
    transferPoint(toMe) {
        this.transferPoints(toMe, 1);
    }    
}

export { Score }