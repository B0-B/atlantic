const fs = require('fs');
const bodyParser = require('body-parser');
var https = require('https');
const express = require('express');

/*
Official Atlantic node code.
*/

const PORT = 3000;

var node = function () {
    this.conversations = {};
    this.kill = false;
    this.stack = {};
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

node.prototype.sleep = function (seconds) {
    return new Promise(function(resolve) {
        setTimeout(function() {
            resolve(0);
        }, 1000*seconds);
    });
}

// --- node build blueprint ---
async function build (node) {
    
    /* Build node application structure */

    app = express();
    
    // ---- handshake path ----
    app.use(bodyParser.json());
    app.post('/handshake', async function (req, res) {
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
                clinet.stack[raw.to].stack.push(pkg)
            } catch (error) {
                node.stack[raw.to] = {stack: [pkg]}
            }
            rsp = {errors: []}
        } catch (error) {
            rsp = {errors: [error]}
        } finally {
            res.send(JSON.stringify(rsp))
        }
    });

    // ---- listener ----
    app.post('/listen', async function (req, res) {
        const raw = req.body;
        let stack = {errors: [], stack: []}
        try {
            if (node.stack.hasOwnProperty(raw.address)) {
                stack.stack = JSON.parse(JSON.stringify(node.stack[raw.address]))
                delete node.stack[raw.address]
            }
        } catch (error) {
            console.log('listen error:', error)
            stack.errors.push(error)
        }
        res.send(JSON.stringify(stack))
        console.log(`${raw.address.split('\n')[1]}... is up to date.`)
    });

    // ---- mail receive ----
    app.post('/receiver', async function (req, res) {
        console.log(`receive msg addressed to ${msg.to}`)
        let rsp = {errors: []}
        try {
            const msg = req.body;
            try {
                node.stack[msg.to].stack.push(msg)
            } catch (error) {
                node.stack[msg.to] = {stack: [msg]}
            }
        } catch (error) {
            rsp.errors.push(error)
        } finally {
            res.send(JSON.stringify(rsp))
        }
    });

    // wrap https server
    privateKey  = fs.readFileSync('./certificate/ssl.key', 'utf8');
    certificate = fs.readFileSync('./certificate/ssl.crt', 'utf8');
    server = https.createServer({
        key: privateKey,
        cert: certificate
    }, app);

    return server
}

// run node instance
(async () => {
    var _node = new node();
    var server = await build(_node);
    server.listen(PORT, () => {
        console.log(`Atlantic node running at https://localhost:${PORT}`);
    });
})();