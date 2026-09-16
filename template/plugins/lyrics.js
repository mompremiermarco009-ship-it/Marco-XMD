// template/plugins/lyrics.js — Recherche de paroles via l'API Marco Lyrics
const axios = require('axios');

module.exports = {
    name: 'lyrics',
    aliases: ['ly', 'paroles', 'parole'],
    category: 'music',
    desc: 'Recherche les paroles d\'une chanson',
    usage: '.lyrics <titre> [artiste]',

    async execute(sock, msg, args, cmd) {
        const jid = msg.key.remoteJid;
        const cfg = sock.config || {};
        const prefix = cfg.prefix || '.';

        const query = args.join(' ').trim();

        // Si pas d'argument
        if (!query) {
            return sock.sendMessage(jid, {
                text: `🎵 *𝐌𝐚𝐫𝐜𝐨 𝐋𝐲𝐫𝐢𝐜𝐬*\n\n` +
                      `Utilisation :\n` +
                      `• ${prefix}lyrics <titre>\n` +
                      `• ${prefix}lyrics <titre> <artiste>\n\n` +
                      `Exemples :\n` +
                      `• ${prefix}lyrics Hoist the Colours\n` +
                      `• ${prefix}lyrics Dernière danse Indila\n` +
                      `• ${prefix}lyrics Believer Imagine Dragons\n\n` +
                      `> 𝑃𝑜𝑤𝑒𝑟𝑒𝑑 𝑏𝑦 𝑀𝑟 𝑀𝑎𝑟𝑐𝑜`
            }, { quoted: msg });
        }

        // Réaction de chargement
        try {
            await sock.sendMessage(jid, { react: { text: '⏳', key: msg.key } });
        } catch {}

        // Récupérer l'URL de base depuis la config (utilise le même serveur)
        const publicUrl = cfg.publicUrl || 'https://marco-xmd-v2.onrender.com';
        const apiUrl = `${publicUrl}/api/lyrics/search?q=${encodeURIComponent(query)}`;

        try {
            const res = await axios.get(apiUrl, { timeout: 30000 });

            if (!res.data || !res.data.ok) {
                throw new Error('Réponse invalide du serveur');
            }

            const { lyrics, video } = res.data;

            const title = video?.title || query;
            const artist = video?.artist || '';
            const thumbnail = video?.thumbnail || '';
            const duration = video?.duration || '';
            const views = video?.views || 0;

            // Formatage des vues
            let viewsText = '';
            if (views >= 1e9) viewsText = (views / 1e9).toFixed(1) + 'B';
            else if (views >= 1e6) viewsText = (views / 1e6).toFixed(1) + 'M';
            else if (views >= 1e3) viewsText = (views / 1e3).toFixed(1) + 'K';
            else if (views > 0) viewsText = String(views);

            // Construire le message
            let text = `╔════════════════════════════╗\n`;
            text += `║   🎵  𝐌𝐚𝐫𝐜𝐨_𝐋𝐲𝐫𝐢𝐜𝐬  🎵\n`;
            text += `╚════════════════════════════╝\n\n`;

            text += `╭━━━〔 🎶 𝐈𝐧𝐟𝐨𝐫𝐦𝐚𝐭𝐢𝐨𝐧𝐬 〕━━━╮\n`;
            text += `┃  🎵  𝐓𝐢𝐭𝐫𝐞   : ${title}\n`;
            if (artist) text += `┃  👤  𝐀𝐫𝐭𝐢𝐬𝐭𝐞 : ${artist}\n`;
            if (duration) text += `┃  ⏱️  𝐃𝐮𝐫𝐞́𝐞   : ${duration}\n`;
            if (viewsText) text += `┃  👀  𝐕𝐮𝐞𝐬    : ${viewsText}\n`;
            text += `╰━━━━━━━━━━━━━━━━━━━━━━━━╯\n\n`;

            if (lyrics) {
                // Découper les paroles si trop longues (limite WhatsApp ≈ 65k, mais on fait des morceaux de 4000 pour la lisibilité)
                const header = text;
                const footer = `\n\n> 𝑃𝑜𝑤𝑒𝑟𝑒𝑑 𝑏𝑦 ${cfg.ownerName || '𝑀𝑟 𝑀𝑎𝑟𝑐𝑜'}`;

                const fullMessage = header + lyrics + footer;

                if (fullMessage.length <= 4000) {
                    // Un seul message avec l'image
                    if (thumbnail) {
                        try {
                            await sock.sendMessage(jid, {
                                image: { url: thumbnail },
                                caption: fullMessage
                            }, { quoted: msg });
                        } catch {
                            await sock.sendMessage(jid, { text: fullMessage }, { quoted: msg });
                        }
                    } else {
                        await sock.sendMessage(jid, { text: fullMessage }, { quoted: msg });
                    }
                } else {
                    // Découper en plusieurs messages
                    if (thumbnail) {
                        try {
                            await sock.sendMessage(jid, {
                                image: { url: thumbnail },
                                caption: header + `📜 *Paroles complètes (découpées en plusieurs parties)*`
                            }, { quoted: msg });
                        } catch {
                            await sock.sendMessage(jid, {
                                text: header + `📜 *Paroles complètes (découpées en plusieurs parties)*`
                            }, { quoted: msg });
                        }
                    }

                    const chunkSize = 4000;
                    const chunks = [];
                    let current = '';
                    const lines = lyrics.split('\n');

                    for (const line of lines) {
                        if ((current + line).length > chunkSize) {
                            chunks.push(current);
                            current = line + '\n';
                        } else {
                            current += line + '\n';
                        }
                    }
                    if (current.trim()) chunks.push(current);

                    for (let i = 0; i < chunks.length; i++) {
                        let part = chunks[i];
                        if (i === chunks.length - 1) {
                            part += `\n> 𝑃𝑜𝑤𝑒𝑟𝑒𝑑 𝑏𝑦 ${cfg.ownerName || '𝑀𝑟 𝑀𝑎𝑟𝑐𝑜'}`;
                        }
                        await sock.sendMessage(jid, { text: part });
                        await new Promise(r => setTimeout(r, 800));
                    }
                }
            } else {
                // Pas de paroles trouvées : on affiche quand même les infos + image
                text += `╭━━━〔 ⚠️ 𝐏𝐚𝐫𝐨𝐥𝐞𝐬 〕━━━╮\n`;
                text += `┃  ❌  Paroles introuvables.\n`;
                text += `┃  💡  Essayez avec un autre titre\n`;
                text += `┃  📝  ou vérifiez l'orthographe.\n`;
                text += `╰━━━━━━━━━━━━━━━━━━━━━━━━╯\n\n`;
                text += `> 𝑃𝑜𝑤𝑒𝑟𝑒𝑑 𝑏𝑦 ${cfg.ownerName || '𝑀𝑟 𝑀𝑎𝑟𝑐𝑜'}`;

                if (thumbnail) {
                    try {
                        await sock.sendMessage(jid, {
                            image: { url: thumbnail },
                            caption: text
                        }, { quoted: msg });
                    } catch {
                        await sock.sendMessage(jid, { text }, { quoted: msg });
                    }
                } else {
                    await sock.sendMessage(jid, { text }, { quoted: msg });
                }
            }

            // Réaction succès
            try {
                await sock.sendMessage(jid, { react: { text: '✅', key: msg.key } });
            } catch {}

        } catch (err) {
            console.error('❌ Erreur lyrics:', err.message);

            try {
                await sock.sendMessage(jid, { react: { text: '❌', key: msg.key } });
            } catch {}

            let errorMsg = '❌ Impossible de récupérer les paroles.';
            if (err.code === 'ECONNREFUSED' || err.code === 'ENOTFOUND') {
                errorMsg += '\n⚠️ Le serveur Marco Lyrics est injoignable.';
            } else if (err.response?.status === 404) {
                errorMsg += '\n⚠️ Aucune chanson trouvée pour cette recherche.';
            } else if (err.response?.status === 500) {
                errorMsg += '\n⚠️ Erreur du serveur. Réessayez plus tard.';
            } else if (err.message) {
                errorMsg += `\n_Détail : ${err.message}_`;
            }

            await sock.sendMessage(jid, {
                text: `${errorMsg}\n\n> 𝑃𝑜𝑤𝑒𝑟𝑒𝑑 𝑏𝑦 ${cfg.ownerName || '𝑀𝑟 𝑀𝑎𝑟𝑐𝑜'}`
            }, { quoted: msg });
        }
    }
};
