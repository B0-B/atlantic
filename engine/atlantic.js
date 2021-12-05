String.prototype.replaceAt = function(index, replacement) {
    return this.substr(0, index) + replacement + this.substr(index + replacement.length);
}

var atlantic = function (keyLength=4096) {
    this.ascii = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!"§$%&/()=?`´+*~#-_.:,;€@^°\\{]öäüÖÜÄß' + "'";
    this.keyLength = keyLength;
    this.cutoff = '///'
}

atlantic.prototype.encrypt = function (msg, key)
{
    let pad = this.entropy();
    msg += this.cutoff;
    for (let i = 0; i < msg.length; i++) {
        const char = msg[i];
        pad = pad.replaceAt(key[i], char);
    }
    return pad
}

atlantic.prototype.entropy = function (length=16000) {
    let pad = '';
    for (let index = 0; index < length; index++) {
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
    plainText = plainText.substr(0, plainText.length-this.cutoff.length)
    return plainText
}

atlantic.prototype.keygen = function (length=4096) {
    let key = []
    for (let i = 0; i < length; i++) {
        key.push(i)
    }
    // shuffle key
    key.sort(() => (Math.random() > .5) ? 1 : -1)
    return key
}

plainText = 'This is a secret!'
a = new atlantic()
key = a.keygen()
cipher = a.encrypt(plainText, key)
plainText = a.decrypt(cipher, key)
console.log(plainText)