// plugins/barcode.js
const bwipjs = require('bwip-js');

module.exports = {
    name: 'barcode',
    aliases: ['codebarre', 'ean', 'qr2'],  // qr2 pour éviter conflit avec le plugin qr existant
    description: 'Génère un code‑barres (image) à partir d\'un texte',
    usage: '.barcode <texte> [type: ean13, code128...]',

    async execute(sock, message, args) {
        const jid = message.key.remoteJid;
        let text = args[0];
        if (!text) return sock.sendMessage(jid, { text: '❌ Donnez le contenu du code‑barres.' }, { quoted: message });

        const type = args[1] || 'code128';  // Type de code-barres, par défaut code128 compatible texte libre

        try {
            const pngBuffer = await bwipjs.toBuffer({
                bcid: type,           // Type de code
                text: text,
                scale: 3,             // Facteur d'échelle
                height: 10,           // Hauteur en mm
                includetext: true,    // Afficher le texte sous le code
                textxalign: 'center'
            });

            await sock.sendMessage(jid, {
                image: pngBuffer,
                caption: `📊 Code‑barres ${type.toUpperCase()} : ${text}`
            }, { quoted: message });
        } catch (e) {
            await sock.sendMessage(jid, { text: `⚠️ Erreur : ${e.message}\nTypes supportés : ean13, ean8, code128, code39, datamatrix, qrcode...` }, { quoted: message });
        }
    }
};
