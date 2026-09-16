const { isAuthorized, normalizeNumber } = require('../utils/auth');

module.exports = {
    name: 'pair',
    aliases: ['connect', 'addbot', 'pairing'],
    category: 'owner',
    desc: 'Génère un code d\'appariement pour connecter un nouveau bot',
    usage: '.pair <numéro>',

    async execute(sock, msg, args) {
        const jid = msg.key.remoteJid;
        const cfg = sock.config || {};
        const owner = cfg.ownerName || '𝑀𝑟 𝑀𝑎𝑟𝑐𝑜';
        const publicUrl = cfg.publicUrl || 'https://marco-xmd-v2.onrender.com';
        const prefix = cfg.prefix || '.';

        if (!isAuthorized(sock, msg, cfg)) {
            return sock.sendMessage(jid, { text: '❌ Réservé au propriétaire.' }, { quoted: msg });
        }

        if (!args[0]) {
            return sock.sendMessage(jid, {
                text: `╔════════════════════════╗\n` +
                      `║   🔑  𝐏𝐀𝐈𝐑 𝐁𝐎𝐓\n` +
                      `╚════════════════════════╝\n\n` +
                      `┃  📱  Utilisation :\n` +
                      `┃  ${prefix}pair <numéro>\n\n` +
                      `┃  💡 Exemple :\n` +
                      `┃  ${prefix}pair 50941131299\n\n` +
                      `> 𝑃𝑜𝑤𝑒𝑟𝑒𝑑 𝑏𝑦 ${owner}`
            }, { quoted: msg });
        }

        const phone = normalizeNumber(args[0]);
        if (phone.length < 10) {
            return sock.sendMessage(jid, { text: '❌ Numéro invalide (min 10 chiffres).' }, { quoted: msg });
        }

        const waitMsg = await sock.sendMessage(jid, {
            text: `⏳ *Génération du code pour* +${phone}...\n\n_Merci de patienter (peut prendre 30 secondes)..._`
        }, { quoted: msg });

        try {
            const axios = require('axios');
            const res = await axios.get(`${publicUrl}/pair?number=${phone}`, { timeout: 90000 });

            if (!res.data || !res.data.code) {
                throw new Error('Aucun code reçu');
            }

            const code = res.data.code;

            try {
                await sock.sendMessage(jid, { delete: waitMsg.key });
            } catch {}

            await sock.sendMessage(jid, {
                text: `╔════════════════════════╗\n` +
                      `║   ✅  𝐂𝐎𝐃𝐄 𝐏𝐀𝐈𝐑\n` +
                      `╚════════════════════════╝\n\n` +
                      `┃  📱  Numéro : +${phone}\n` +
                      `┃  🔑  Code : *${code}*\n\n` +
                      `╭━━━〔 📝 𝐈𝐧𝐬𝐭𝐫𝐮𝐜𝐭𝐢𝐨𝐧𝐬 〕━━━╮\n` +
                      `┃  ① Ouvrez WhatsApp\n` +
                      `┃  ② Paramètres\n` +
                      `┃  ③ Appareils connectés\n` +
                      `┃  ④ Connecter un appareil\n` +
                      `┃  ⑤ Se connecter avec un numéro\n` +
                      `┃  ⑥ Entrez le code *${code}*\n` +
                      `╰━━━━━━━━━━━━━━━━━━━━━━╯\n\n` +
                      `> 𝑃𝑜𝑤𝑒𝑟𝑒𝑑 𝑏𝑦 ${owner}`
            }, { quoted: msg });
        } catch (err) {
            console.error('Erreur pair:', err.message);

            try {
                await sock.sendMessage(jid, { delete: waitMsg.key });
            } catch {}

            let errorMsg = '❌ Impossible de générer le code.';
            if (err.code === 'ECONNREFUSED' || err.code === 'ENOTFOUND') {
                errorMsg += '\n⚠️ Serveur injoignable.';
            } else if (err.response?.data?.error) {
                errorMsg += `\n⚠️ ${err.response.data.error}`;
            } else if (err.message) {
                errorMsg += `\n_Détail : ${err.message}_`;
            }

            await sock.sendMessage(jid, {
                text: `${errorMsg}\n\n> 𝑃𝑜𝑤𝑒𝑟𝑒𝑑 𝑏𝑦 ${owner}`
            }, { quoted: msg });
        }
    }
};
