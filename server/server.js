const fs = require('fs');
var path = require('path');
const express = require('express')
const bodyParser = require('body-parser');

/*
Official Atlantic node code.
*/

var node = function () {
    this.conversations = {}
    this.server = express();
}



node.prototype.run = function (PORT) {

}