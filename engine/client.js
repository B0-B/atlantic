// --- load the engine ---
const buffer = require('./buffer.js');
const vault = require('./vault.js');
const atlantic = require('./atlantic.js');

// --- modules ---
var path = require('path');
const fs = require('fs');

var client = function (user, master, vaultPath) {

    // --- general object information ---
    this.user = user;
    this.keyLength = 1024;
    this.padLength = 4096
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
        } 
    });
}

client.prototype.connect = async function (host, port) {
    //

}

client.prototype.send = async function (name, message) {
    // get next key
    let key = this.vault.nextKey(name, master)
    let msg = {
        id: key.id,
        payload: this.atlantic.encrypt(message, key.key),
        to: this.vault.list[this.vault.hash(name)].add
    }
    

}