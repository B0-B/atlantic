/*
Atlantic Crypto Algorithm
*/

String.prototype.replaceAt = function(index, replacement) {
    return this.substr(0, index) + replacement + this.substr(index + replacement.length);
}

var atlantic = function (keyLength=4096, padLength=16384) {
    this.ascii = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!"§$%&/()=?`´+*~#-_.:,;€@^°\\{]öäüÖÜÄß' + "'";
    this.cutoff = '///'
    this.keyLength = keyLength
    this.padLength = padLength
}

atlantic.prototype.encrypt = function (msg, key)
{
    let pad = this.pad();
    msg += this.cutoff;
    for (let i = 0; i < msg.length; i++) {
        const char = msg[i];
        pad = pad.replaceAt(key[i], char);
    }
    return pad
}

atlantic.prototype.pad = function () {
    let pad = '';
    for (let index = 0; index < this.padLength; index++) {
        pad += this.ascii[Math.floor(Math.random()*this.ascii.length)]
    }
    return pad
}

atlantic.prototype.decrypt = function (pad, key)
{   
    plainText = ''
    for (let i = 0; i < key.length; i++) {
        const char = pad[key[i]];
        plainText += char
        l = plainText.length
        if (char == this.cutoff[this.cutoff.length-1] && plainText.slice(l-this.cutoff.length) == this.cutoff) {
            break
        }
    }
    return plainText.substr(0, plainText.length-this.cutoff.length)
}

module.exports = atlantic;