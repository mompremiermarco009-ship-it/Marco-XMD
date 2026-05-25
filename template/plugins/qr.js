const qrcode = require('qrcode');

module.exports = {
    name: 'qr',
    aliases: ['qrcode', 'genererqr', 'makeqr'],
    description: 'Génère un QR code à partir d\'un texte ou lien',
    usage: '.qr <texte ou lien>',

    async execute(sock, message, args, { config }) {
        const jid = message.key.remoteJid;
        const text = (Array.isArray(args) ? args.join(' ') : args) || '';

        if (!text.trim()) {
            return sock.sendMessage(jid, {
                text: '❌ Veuillez fournir un texte ou un lien.\nExemple : *.qr https://marcoxmd.com*'
            }, { quoted: message });
        }

        try {
            // Génération du QR code en image PNG (buffer)
            const buffer = await qrcode.toBuffer(text.trim(), {
                width: 500,
                margin: 2,
                color: {
                    dark: '#000000',   // couleur des modules
                    light: '#ffffff'   // couleur de fond
                }
            });

            // Envoi de l'image
            await sock.sendMessage(jid, {
                image: buffer,
                caption: '✅ QR code généré avec succès.'
            }, { quoted: message });

        } catch (error) {
            console.error('Erreur plugin qr:', error);
            await sock.sendMessage(jid, {
                text: '⚠️ Une erreur est survenue lors de la génération du QR code.'
            }, { quoted: message });
        }
    }
};
