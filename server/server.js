const fs = require('fs');
var path = require('path');
const bodyParser = require('body-parser');

var http = require('http');
var https = require('https');

const express = require('express');
// create a new key pair:
// sudo openssl req -x509 -nodes -days 365 -newkey rsa:2048 -keyout ./selfsigned.key

/*
Official Atlantic node code.
*/

var node = function () {
    this.conversations = {};
    this.kill = false;
    this.stack = {};
    this.build();
    this.boneCollector();
}

node.prototype.boneCollector = async function (refresh=60) {
    // this method collects empty stacks and deletes them
    console.log('start the bone collector for garbage collection.')
    while (!this.kill) {
        try {
            let keys = Object.keys(this.stack); // get current stack keys
            for (let i = 0; i < keys.length; i++) {
                const address = keys[i];
                const stk = this.stack[address].stack;
                if (stk.length == 0) {
                    delete this.stack[address]
                }
            }
        } catch (error) {
            console.log(error)
        } finally {
            await this.sleep(refresh)
        }
    }
}

node.prototype.build = function () {
    
    /* Build server structure */

    this.app = express();
    var privateKey  = fs.readFileSync('./certificate/ssl.key', 'utf8');
    var certificate = fs.readFileSync('./certificate/ssl.crt', 'utf8');
    this.server = https.createServer({
        key: privateKey,
        cert: certificate
    }, this.app);

    // ---- handshake path ----
    this.app.use(bodyParser.json());
    this.app.post('/handshake', async function (req, res) {
        let rsp;
        try {
            const raw = req.body;
            pkg = {
                from: raw.from,
                name: raw.name,
                to: raw.to,
                tan: raw.tan,
                fp: raw.fingerprint
            }
            try {
                this.stack[raw.to].stack.push(pkg)
            } catch (error) {
                this.stack[raw.to] = {stack: [pkg]}
            }
            rsp = {errors: []}
        } catch (error) {
            rsp = {errors: [error]}
        } finally {
            res.send(JSON.stringify(rsp))
        }
    });

    // ---- listener ----
    this.app.post('/listen', async function (req, res) {
        const raw = req.body;
        let stack = {errors: [], stack: []}
        try {
            stack.stack = JSON.parse(JSON.stringify(this.stack[raw.address]))
            delete this.stack[raw.address]
        } catch (error) {
            stack.errors.push(error)
        }
        res.send(JSON.stringify(stack))
        console.log(`${msg.to} is up to date.`)
    });

    // ---- mail receive ----
    this.app.post('/receiver', async function (req, res) {
        console.log(`receive msg addressed to ${msg.to}`)
        let rsp = {errors: []}
        try {
            const msg = req.body;
            try {
                this.stack[msg.to].stack.push(msg)
            } catch (error) {
                this.stack[msg.to] = {stack: [msg]}
            }
        } catch (error) {
            rsp.errors.push(error)
        } finally {
            res.send(JSON.stringify(rsp))
        }
    });
}

node.prototype.run = function (PORT) {
    this.server.listen(PORT, () => {
        console.log(`Atlantic node running at https://localhost:${PORT}`);
    });
}

node.prototype.sleep = function (seconds) {
    return new Promise(function(resolve) {
        setTimeout(function() {
            resolve(0);
        }, 1000*seconds);
    });
}

// run node instance
var srv = new node();
srv.run(3000)