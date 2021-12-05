// vault for secure key storage
const key = require('./keygen.js')
const crypto = require('crypto');

var vault = function (keyLength=4096, tanSize=100) {
    // 
    this.keyLength = keyLength
    this.tanSize = tanSize
    this.list = {}
}

vault.prototype.addTan = function (user, tan) {
    // Will add a provided tan to specific user hash. If a tan already exists for this hash, it will be overridden.
    userhash = this.hash(user);
    this.list[userhash] = tan
} 

vault.prototype.burnKey = function (user, id) {
    let userhash = this.hash(user);
    this.list[userhash].tan[`${id}`] = null
}

vault.prototype.createTan = function (user) {
    let fingerprint = this.randomHash(),
        userhash = this.hash(user);
    this.list[userhash] = {
        "fingerprint": fingerprint,
        "tan": {}
    }
    for (let id = 0; id < this.tanSize; id++) {
        this.list[userhash].tan[`${id}`] = new key(this.keyLength)
    }
} 

vault.prototype.hash = function (name) {
    // mimick SHA-256 random hex-encoded hash
    return crypto.createHash('sha256').update(name).digest('hex')
}

vault.prototype.randomHash = function () {
    // mimick SHA-256 random hex-encoded hash
    return crypto.randomBytes(32).toString('hex')
}

v = new vault()
v.createTan('Angel')
console.log(v.list)
module.exports = vault;