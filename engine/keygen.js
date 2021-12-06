// key buffer embedding
const aes = require('./buffer.js')

var key = function (master, length=4096) {
    this.length = length;
    this.store(master)
}

key.prototype.gen = function () {
    let k = []
    for (let i = 0; i < this.length; i++) {
        k.push(i)
    }
    // shuffle key
    k.sort(() => (Math.random() > .5) ? 1 : -1)
    return k
}

key.prototype.store = function (master) {
    this.buffer = aes.encrypt('['+this.gen().toString()+']', master)
}

key.prototype.resolve = function (master) {
    return eval(aes.decrypt(this.buffer, master))
}

module.exports = key;