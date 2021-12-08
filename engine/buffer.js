const crypto = require('crypto');
const algorithm = 'aes-256-cbc';

function encrypt(text, master) {
    const iv = crypto.randomBytes(16);
    let key = crypto.createHash('sha256').update(String(master)).digest('base64').substr(0, 32);
    let cipher = crypto.createCipheriv(algorithm, key, iv);
    let encrypted = cipher.update(text);
    encrypted = Buffer.concat([encrypted, cipher.final()]);
    return { iv: iv.toString('hex'), encryptedData: encrypted.toString('hex') };
}

function decrypt(payload, master) {
   let iv = Buffer.from(payload.iv, 'hex');
    let key = crypto.createHash('sha256').update(String(master)).digest('base64').substr(0, 32);
    let encryptedText = Buffer.from(payload.encryptedData, 'hex');
    let decipher = crypto.createDecipheriv(algorithm, key, iv);
    let decrypted = decipher.update(encryptedText);
    //decipher.setAutoPadding(false)
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    return decrypted.toString();
}

// plain = 'this is a secret'
pw = 'password'
// cipher = encrypt(plain, pw)
// console.log('cipher', cipher)
reveal = decrypt({ iv: 'd1cdcd662635362c90c5221db955b807',
encryptedData:
 '7c0c787b008de4234944de41735e1fd0f08cfefc5b9276f0f02198d3649a97d5' }, pw)
console.log(reveal)

module.exports = {
    decrypt: decrypt,
    encrypt: encrypt
}