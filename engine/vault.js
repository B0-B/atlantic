// vault for secure key storage
const key = require('./keygen.js');
const crypto = require('crypto');
const fs = require('fs');
const buffer = require('./buffer.js');

var vault = function (keyLength=4096, savePath='./vault.json', tanSize=100) {
    // 
    this.keyLength = keyLength;
    this.list = {};
    this.savePath = savePath;
    this.tanSize = tanSize;
    
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

vault.prototype.createTan = function (user, master) {
    let fingerprint = this.randomHash(),
        userhash = this.hash(user);
    this.list[userhash] = {
        "fingerprint": fingerprint,
        "tan": {}
    }
    for (let id = 0; id < this.tanSize; id++) {
        this.list[userhash].tan[`${id}`] = new key(master, this.keyLength)
    }
} 

vault.prototype.dump = function (masterKey="*", savePath=null) {
    if (savePath != null) {
        this.savePath = savePath
    }
    fs.writeFileSync(this.savePath, JSON.stringify(this) , 'utf-8');
}

vault.prototype.hash = function (name) {
    // mimick SHA-256 random hex-encoded hash
    return crypto.createHash('sha256').update(name).digest('hex')
}

vault.prototype.load = function (savePath) {
    let rawdata = fs.readFileSync(savePath, 'utf-8');
    let json = JSON.parse(rawdata);
    this.keyLength = json.keyLength;
    this.list = json.list;
    this.savePath = savePath;
    this.tanSize = json.tanSize;
}

vault.prototype.restoreKey = function (name, id) {
    let k = new key(this.keyLength)
    k.buffer = this.list[v.hash(name)]['tan'][`${id}`]['buffer']
    return k
}

vault.prototype.randomHash = function () {
    // mimick SHA-256 random hex-encoded hash
    return crypto.randomBytes(32).toString('hex')
}


masterKey ='1Ab123123c23'
v = new vault(10)
//v.createTan('Angel', masterKey)
//v.burnKey('Angel', 1)
//v.dump()
v.load('./vault.json')
console.log(v)
//console.log(v.list['0160733d2828347f1bad79c3b29e34894f331ee512a606ac5dbe67fd8399978d'].tan)
restoredKey = v.restoreKey("Angel", 80)
console.log('buffer', restoredKey.buffer)
console.log(buffer.decrypt(restoredKey.buffer, masterKey))
//console.log(restoredKey)
//console.log(restoredKey.resolve(masterKey))
//console.log(restoredKey.resolve(masterKey))
module.exports = vault;