// key buffer embedding

var key = function (length=4096) {
    this.length = length;
    this.aes = require('./buffer.js')
    this.store()
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

key.prototype.store = function () {
    this.buffer = this.aes.encrypt('['+this.gen().toString()+']')
}

key.prototype.resolve = function () {
    return eval(this.aes.decrypt(this.buffer))
}

module.exports = key;