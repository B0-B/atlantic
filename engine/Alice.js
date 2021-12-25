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

client.prototype.loadVault = async function (master, dump=true) {
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
        await this.vault.generateKeyPair(master) // for tan exchange
        if (dump) {
            console.log('dump created vault ...')
            this.vault.dump(this.vaultPath)
        }
        console.log('done.')
    }
}

client.prototype.newContact = async function (name, address, master) {
    await this.vault.createTan(name, address, master);
    let pkg = await this.vault.handshakePackage(name, master);
    try {
        let response = await fetch(`https://${this.host}:${this.port}`, {method: "POST", body: JSON.stringify(pkg)})
        console.log(response.json().body)
    } catch (error) {
        console.log('error while sending message:', error)
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
    let User = "Alice",
        master = "12345",
        vaultPath = "./vault_alice.json";
    var Client = new client(User, master, vaultPath);

    // wire the vault
    await Client.loadVault(master, dump=true);

    // start the server test wise
    Client.connect("localhost", 3000)
    await Client.sleep(3)
    Client.close()

    return Client
}

async function run () {
    try {
        var Client = await createInstance();
        Client.newContact("bob", "-----BEGIN PUBLIC KEY-----\nMIICIjANBgkqhkiG9w0BAQEFAAOCAg8AMIICCgKCAgEAsTP1c7+WojEleyg+jsxH\nJOaj3UQi13F/p1XV0htPAQdUnQ6gDN+pX5Az5pCRxlfwAR+uvNZlcwi8HN7eHB2r\nmiKh1x9yHpSmevZLHD+yVvfo4aROZ9Mds4kcoNuSPgsr8HPCH4kSmys4rGm4xO3Z\nJXVGzErSktwf8iZNT/fTd494ORUzqA/sShysLbSZwimgh+lzVxG4fzub4We6bC5f\nfBuoC3UCBMJcggGolfEDSWEY3Mn4RcIweUU8cv59BY/G7ug3tDd5gOZ5RrOfuAEK\nadqLC1D2Y+nRcNYedG6/0oNxr5Q7Yd9bBPjQ8SC6X18a+a+ig40Zie923ZbdZgAK\nkeXM2E2SOYu+T4yFPMdTJB+u5n9ml45tkpSOluOlBapN5nPWcVD5mWPfvfIk6MWc\nOzOftrABmDnfWvIY02bm3JWCXoiykM/RSi0AMKsVdLuTJntE+5y1EHZ+AMBGh2aM\n4+UcqC3qlNC+lqbtYy/NnBixOyJReju8BR0QoYYDHaSSH4S8qmCVpn68zbD46HYH\nOmA9xhZX109plhhpn2zL0ayf+cjp58CNQnooqiWcOFeu45M8t+8PhPsRl81GEtQZ\nqO32wwPLTti1+4JJxxOd+fTx1atLwPeGMVRXxGi1duknZPPOnblpf6tesKfxfh5V\nxJqN1w50c3fY2Y5Q68IjEjUCAwEAAQ==\n-----END PUBLIC KEY-----\n", "12345");
    } catch (error) {
        console.log('Error - terminate\n', error);
    } finally {
        //
    }
}

run()