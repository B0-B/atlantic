// --- load the engine ---
const buffer = require('./buffer.js');
const vault = require('./vault.js');
const atlantic = require('./atlantic.js');

// --- modules ---
var path = require('path');
const fs = require('fs');
const fetch = require('../node-fetch');

var client = function (user, master, vaultPath, host, port) {

    // --- general object information ---
    this.host = host;
    this.port = port;
    this.user = user;
    this.kill = false;
    this.clearTime = 300; // seconds
    this.keyLength = 1024;
    this.messages = {};
    this.padLength = 4096;
    this.requests = [];
    this.tanSize = 1000;
    this.vaultPath = vaultPath

    // --- load core engine ---
    console.log('load engine ...')
    this.atlantic = new atlantic(this.keyLength, this.padLength);

    // --- wire the vault ---
    this.vault = new vault(this.keyLength, this.tanSize);
    path.exists(this.vaultPath, function(exists) { 
        if (exists) { 
            console.log('Vault found.')
            this.vault.load(this.vaultPath)
            if (!this.vault.ident(this.user, master)) {throw 'Wrong credentials provided for this vault.'}
            console.log('and loaded.')
        } else {
            console.log('Create new vault ...')
            this.vault.addUser(this.user, master)
            this.vault.addMasterKey(master)
            this.vault.generateKeyPair(master) // for tan exchange
            this.vault.dump()
        } 
    });

    // -- start the listener -- 
    this.listener()
}

client.prototype.connect = async function (host, port) {
    //

}

client.prototype.listener = async function () {
    while (!this.kill) {
        let pkg = JSON.stringify({address: this.vault.keyPair.public});
        const response = await fetch(`https://${this.host}:${this.port}/listen`, {method: 'POST', body: pkg});
        const data = await response.json();
        if (data.errors.length != 0) {
            console.log('error', data.errors[0])
        }
        for (let i = 0; i < data.stack.length; i++) {
            const obj = data.stack[i];
            if ('tan' in obj) {
                console.log(`received chat request from ${obj.from}`)
                this.requests.push(obj);
                //this.vault.addNewTan(obj, master)
            } else {
                console.log(`received new message from ${obj.from}`)
                obj.timestamp = Date.now();
                // find the correct key
                const atlantic_key = nextKey()
                obj.payload = atlantic.decrypt(obj.payload, atlantic_key)
                this.messages[obj.fp] = obj;
            }
        }
        // save the updated vault state
        if (data.stack.length != 0) {
            this.vault.dump()
        }
        await this.sleep(.5);
    }
}

client.prototype.send = async function (name, message, master) {
    // get next key
    let obj = this.vault.list[this.vault.hash(name)];
    let key = this.vault.nextKey(name, master);
    let msg = {
        id: key.id,
        fp: obj.fingerprint,
        payload: this.atlantic.encrypt(message, key.key),
        to: buffer.decrypt(obj.address, master)
    }
    try {
        let response = await fetch(`https://${this.host}:${this.port}`, {method: "POST", body: JSON.stringify(msg)})
        console.log(response.json().body)
    } catch (error) {
        console.log('error while sending message:', error)
    }
    this.vault.dump()
}

client.prototype.sleep = function (seconds) {
    return new Promise(function(resolve) {
        setTimeout(function() {
            resolve(0);
        }, 1000*seconds);
    });
}

// run node instance
try {
    var Client = new client("Alice", "abc123", "./vault.json", "localhost", 3000)
} catch (error) {
    console.log('Error - terminate\n', error)
} finally {
    Client.vault.dump()
}
