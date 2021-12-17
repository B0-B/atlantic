// --- load the engine ---
const buffer = require('./buffer.js');
const vault = require('./vault.js');
const atlantic = require('./atlantic.js');

// --- modules ---
const fs = require('fs');
const fetch = require('node-fetch');
var https = require('https');
const { runInThisContext } = require('vm');


var client = function (user, master, vaultPath) {

    // --- general object information ---
    
    this.user = user;
    this.connected = false;
    this.clearTime = 300; // seconds
    this.keyLength = 1024;
    this.messages = {};
    this.padLength = 4096;
    this.requests = [];
    this.tanSize = 1000;
    this.vaultPath = vaultPath

    // --- https support ---
    this.headers = {
        'Content-Type': 'application/json',  
    };
    this.httpsAgent = new https.Agent({
        rejectUnauthorized: false,
    });
  
    // --- load core engine ---
    console.log('load engine ...');
    this.atlantic = new atlantic(this.keyLength, this.padLength);

}

client.prototype.close = function () {
    this.connected = false
}

client.prototype.connect = async function (host, port) {
    this.host = host;
    this.port = port;
    this.connected = true;
    while (this.connected) {
        let pkg = JSON.stringify({address: this.vault.keyPair.public});
        const response = await fetch(`https://${this.host}:${this.port}/listen`, {
            method: 'POST',
            headers: this.headers,
            body: pkg,
            agent: this.httpsAgent,
        });
        const data = await response.json();
        console.log(data)
        if (data.errors.length != 0) {
            console.log('error', data.errors)
        } else {
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
                    const atlantic_key = this.vault.nextKey(master, fp=obj.fp)
                    obj.payload = atlantic.decrypt(obj.payload, atlantic_key.key)
                    this.messages[obj.fp] = obj;
                }
            }
            // save the updated vault state
            if (data.stack.length != 0) {
                this.vault.dump()
            }
        }
        await this.sleep(.5);
    }
}

client.prototype.loadVault = async function (master) {
    this.vault = new vault(this.keyLength, this.tanSize);
    if (fs.existsSync(this.vaultPath)) { 
        console.log('Vault found ...')
        this.vault.load(this.vaultPath)
        if (!this.vault.ident(this.user, master)) {throw 'Wrong credentials provided for this vault.'}
        console.log('and loaded.')
    } else {
        console.log('Create new vault ...')
        this.vault.addUser(this.user, master)
        this.vault.addMasterKey(master)
        this.vault.generateKeyPair(master) // for tan exchange
        console.log('dump created vault ...')
        this.vault.dump()
        console.log('done.')
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
        to: buffer.decrypt(obj.address, master),
        name: this.atlantic.encrypt(name, key.key)
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
async function createInstance () {
    let User = "dummy",
        master = "123456",
        vaultPath = "./vault.json";
    var Client = new client(User, master, vaultPath);

    // wire the vault
    await Client.loadVault(master);

    // start the server test wise
    Client.connect("localhost", 3000)
    await Client.sleep(3)
    Client.close()

    return Client
}


async function run () {
    try {
        var Client = await createInstance();
        // await Client.sleep(3)
        // Client.vault.createTan("Angel", "Address-pseudo", "1234")
        // Client.vault.dump()
    } catch (error) {
        console.log('Error - terminate\n', error)
    } finally {
        Client.vault.dump()
    }
}

run()