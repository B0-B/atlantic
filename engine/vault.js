// vault for secure key storage
const key = require('./keygen.js');
const crypto = require('crypto');
const fs = require('fs');
const buffer = require('./buffer.js');

var vault = function (keyLength=4096, tanSize=100) {
    this.algorithm = 'aes-256-cbc'
    this.keyLength = keyLength;
    this.keyPair = {};
    this.list = {};
    this.savePath = './vault.json';
    this.tanSize = tanSize;
    this.testPhrase = 'atlantic'
    this.testPhraseEncrypted = null
    this.userhash = ''
}

vault.prototype.addMasterKey = function (master, masterOld=null) {
    if (! this.testPhraseEncrypted) {
        this.testPhraseEncrypted = buffer.encrypt(this.testPhrase, master)
    } else {
        if (masterOld != null && this.ident(masterOld)) {
            this.testPhraseEncrypted = buffer.encrypt(this.testPhrase, master)
        } else {
            console.log('wrong credentials.')
        }
    }
}

vault.prototype.addReceivedTan = function (user, tan) {
    // Will add a provided tan to specific user hash. If a tan already exists for this hash, it will be overridden.
    userhash = this.hash(user);
    this.list[userhash] = tan
} 

vault.prototype.addUser = function (user, master) {
    this.userhash = this.encrypt(user, master)
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

vault.prototype.generateKeyPair = function (master) {
    // generate rsa key pair in pem format
    const keyPair = crypto.generateKeyPair('rsa', {
        modulusLength: 4096,
        publicKeyEncoding: {
          type: 'spki',
          format: 'pem'
        },
        privateKeyEncoding: {
          type: 'pkcs8',
          format: 'pem',
          cipher: this.algorithm,
          passphrase: master
        }
    }, (err, publicKey, privateKey) => {
        if (err != null) {throw err}
        this.keyPair = {
            public: publicKey,
            private: privateKey
        }
    });
}

vault.prototype.getTanByFingerprint = function (fingerprint) {
    userhashes = Object.keys(this.list)
    for (let i = 0; i < userhashes.length; i++) {
        const userhash = userhashes[i];
        const fp = this.list[userhash].fingerprint;
        if (fp == fingerprint) {
            return {userhash: userhash, tan: this.list[userhash].tan}
        }
    }
    return null
}

vault.prototype.getTanByName = function (name) {
    try {
        return this.list[this.hash(name)].tan
    } catch (error) {
        console.log(error)
        return null
    }
}

vault.prototype.hash = function (name) {
    // mimick SHA-256 random hex-encoded hash
    return crypto.createHash('sha256').update(name).digest('hex')
}

vault.prototype.ident = function (user, master) {
    try {
        return buffer.decrypt(this.testPhraseEncrypted, master) == this.testPhrase &&
            buffer.decrypt(this.userhash, master) == user
    } catch (error) {
        //console.log(error)
        return false
    }
}

vault.prototype.load = function (savePath) {
    let rawdata = fs.readFileSync(savePath, 'utf-8');
    let json = JSON.parse(rawdata);
    this.keyLength = json.keyLength;
    this.list = json.list;
    this.savePath = savePath;
    this.tanSize = json.tanSize;
}

vault.prototype.randomHash = function () {
    // mimick SHA-256 random hex-encoded hash
    return crypto.randomBytes(32).toString('hex')
}

vault.prototype.restoreKey = function (name, id) {
    let k = new key(this.keyLength)
    k.buffer = this.list[v.hash(name)]['tan'][`${id}`]['buffer']
    return k
}

module.exports = vault;