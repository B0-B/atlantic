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

vault.prototype.addNewTan = function (pkg, master) {
    const priv = buffer.decrypt(this.keyPair.private, master);
    const user = crypto.publicDecrypt(priv, pkg.name);
    const address = crypto.publicDecrypt(priv, pkg.from);
    const fp = crypto.publicDecrypt(priv, pkg.fp);
    let tan = pkg.tan;
    // decrypt keys in tan list
    let tan_keys = Object.keys(tan);
    for (let i = 0; i < tan_keys.length; i++) {
        let buf = tan[tan_keys[i]].buffer;
        tan[tan_keys[i]].buffer = buffer.encrypt(crypto.publicDecrypt(priv,buf), master);
    }
    // finalize package for list
    this.list[this.hash(user)] = {
        address: buffer.encrypt(address, master),
        fingerprint: fp,
        tan: tan
    }
}

vault.prototype.addUser = function (user, master) {
    // add personal user name of this client
    this.userhash = buffer.encrypt(user, master);
    //let prv = buffer.decrypt(entry.addresshash,master);
}

vault.prototype.burnKey = function (user, id) {
    let userhash = this.hash(user);
    delete this.list[userhash].tan[`${id}`]
}

vault.prototype.checkMaster = function (master) {
    try {
        if (buffer.decrypt(this.testPhraseEncrypted, master) == this.testPhrase) {
            return true
        } else {
            return false
        }
    } catch (error) {
        return false
    }
}

vault.prototype.createTan = function (name, address, master) {
    let fingerprint = this.randomHash(),
        userhash = this.hash(name),
        addresshash = buffer.encrypt(address, master)
    this.list[userhash] = {
        "address": addresshash,
        "fingerprint": fingerprint,
        "tan": {}
    }
    for (let id = 0; id < this.tanSize; id++) {
        this.list[userhash].tan[`${id}`] = new key(master, this.keyLength)
    }
} 

vault.prototype.dump = function (savePath=null) {
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
            private: buffer.encrypt(privateKey, master)
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

vault.prototype.handshakePackage = function (name, master) {
    /* Decrypt the list entry and encrypt again with the address.
    The address is the receivers public key.
    */
    let  entry = this.list[this.hash(name)],
        pkg = {};
    pub = buffer.decrypt(entry.addresshash,master);
    pkg.fingerprint = entry.fingerprint;
    pkg.name = crypto.publicEncrypt(pub,buffer.decrypt(this.userhash,master))
    pkg.to = pub// public key stays plain
    pkg.from = crypto.publicEncrypt(pub,buffer.decrypt(this.keyPair.public,master));
    pkg.tan = entry.tan;
    tan_keys = Object.keys(pkg.tan);
    // transcript all keys
    for (let i = 0; i < tan_keys.length; i++) {
        let buf = pkg.tan[tan_keys[i]].buffer;
        pkg.tan[tan_keys[i]].buffer = crypto.publicEncrypt(pub,buffer.decrypt(buf,master));
    }
    return pkg
}

vault.prototype.hash = function (name) {
    // mimick SHA-256 random hex-encoded hash
    return crypto.createHash('sha256').update(name).digest('hex')
}

vault.prototype.ident = function (user, master) {
    try {
        return buffer.decrypt(this.testPhraseEncrypted, master) == this.testPhrase && buffer.decrypt(this.userhash, master) == user
    } catch (error) {
        console.log(error)
        return false
    }
}

vault.prototype.load = function (savePath) {
    let rawdata = fs.readFileSync(savePath, 'utf-8');
    let json = JSON.parse(rawdata);
    this.keyLength = json.keyLength;
    this.keyPair = json.keyPair;
    this.list = json.list;
    this.savePath = savePath;
    this.tanSize = json.tanSize;
    this.testPhraseEncrypted = json.testPhraseEncrypted;
    this.userhash = json.userhash;
}

vault.prototype.nameFromFingerprint = function (name) {
    let namehash = this.hash(name);
    for (let i = 0; i < array.length; i++) {
        const element = array[i];
        
    }
}

vault.prototype.nextKey = function (master, name=null, fp=null) {
    let tan; 
    if (name != null) {
        tan = this.getTanByName(name);
    } else if (fp != null) {
        tan = this.getTanByFingerprint(fp);
    }
    let nextID = Object.keys(tan)[0];
    const key_encrypted = this.restoreKey(name, nextID);
    this.burnKey(name, nextID);
    return {id: nextID, key: key_encrypted.resolve(master)}
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