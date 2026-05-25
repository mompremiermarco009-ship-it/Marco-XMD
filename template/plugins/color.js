// plugins/color.js
const Color = require('color');

module.exports = {
    name: 'color',
    aliases: ['couleur', 'hex'],
    description: 'Affiche les informations d\'une couleur (HEX, RGB, HSL...)',
    usage: '.color #ff5733 (ou red, rgb(255,87,51)...)',

    async execute(sock, message, args) {
        const jid = message.key.remoteJid;
        const input = args.join(' ');
        if (!input) return sock.sendMessage(jid, { text: '❌ Veuillez fournir une couleur (ex: #ff5733).' }, { quoted: message });

        try {
            const c = Color(input);
            const rgb = c.rgb().round().array();
            const hsl = c.hsl().round().array();
            const hex = c.hex();
            const display = c.toString();

            const info = `🎨 Analyse de couleur\n` +
                `• Entrée : ${input}\n` +
                `• HEX : ${hex}\n` +
                `• RGB : rgb(${rgb[0]}, ${rgb[1]}, ${rgb[2]})\n` +
                `• HSL : hsl(${hsl[0]}, ${hsl[1]}%, ${hsl[2]}%)\n` +
                `• Luminosité : ${c.isLight() ? 'Claire' : 'Foncée'}\n` +
                `• Alpha : ${c.alpha()}`;

            // Créer une petite image de la couleur
            const canvas = require('canvas').createCanvas(200, 100);
            const ctx = canvas.getContext('2d');
            ctx.fillStyle = hex;
            ctx.fillRect(0, 0, 200, 200);
            const buffer = canvas.toBuffer('image/png');

            await sock.sendMessage(jid, {
                image: buffer,
                caption: info
            }, { quoted: message });

        } catch (e) {
            await sock.sendMessage(jid, { text: `⚠️ Couleur invalide : ${e.message}` }, { quoted: message });
        }
    }
};
