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
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    return decrypted.toString();
}

module.exports = {
    decrypt: decrypt,
    encrypt: encrypt
}