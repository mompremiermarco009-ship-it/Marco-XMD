const { createCanvas } = require('canvas');
const fs = require('fs');

module.exports = {
    name: "command",
    aliases: ["cmd"],
    desc: "Génère une image de commande personnalisée",
    usage: ".command <commande> | <texte>",
    async execute(sock, msg, args) {
        const jid = msg.key.remoteJid;
        const input = args.join(' ');
        const parts = input.split('|').map(s => s.trim());
        const command = parts[0] || 'Commande';
        const text = parts[1] || 'Texte';

        try {
            const canvas = createCanvas(800, 400);
            const ctx = canvas.getContext('2d');
            ctx.fillStyle = '#1a1a2e';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.font = 'bold 32px "Sans"';
            ctx.fillStyle = '#e94560';
            ctx.fillText(`/${command}`, 50, 100);
            ctx.font = '24px "Sans"';
            ctx.fillStyle = '#ffffff';
            ctx.fillText(text, 50, 200);

            const buffer = canvas.toBuffer('image/png');
            await sock.sendMessage(jid, { image: buffer }, { quoted: msg });
        } catch (err) {
            console.error('Erreur command:', err);
            await sock.sendMessage(jid, { text: '❌ Erreur génération image.' }, { quoted: msg });
        }
    }
};
