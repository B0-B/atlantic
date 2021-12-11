const fs = require('fs');
var path = require('path');
const express = require('express')
const bodyParser = require('body-parser');

/*
Official Atlantic node code.
*/

var node = function () {
    this.conversations = {};
    this.kill = false;
    this.stack = {};
    this.server = express();
    this.boneCollector();
    this.build();
    
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

    // ---- handshake path ----
    this.server.use(bodyParser.json());
    this.server.post('/handshake', async function (req, res) {
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
    this.server.post('/listen', async function (req, res) {
        const raw = req.body;
        let stack;
        try {
            stack = JSON.parse(JSON.stringify(this.stack[raw.address]))
            delete this.stack[raw.address]
        } catch (error) {
            stack = {stack: []}
        }
        res.send(JSON.stringify(stack))
        console.log(`${msg.to} is up to date.`)
    });

    // ---- mail receive ----
    this.server.post('/receiver', async function (req, res) {
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
    this.server.listen(PORT, function () {
        console.log(`Atlantic node running at http://localhost:${PORT}`);
    });
}

node.prototype.sleep = function (seconds) {
    return new Promise(function(resolve) {
        setTimeout(function() {
            resolve(0);
        }, 1000*seconds);
    });
}