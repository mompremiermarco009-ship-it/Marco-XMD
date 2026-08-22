// plugins/leaveall.js - Quitte tous les groupes sauf ceux à garder
const fs = require('fs');
const path = require('path');
const { isAuthorized } = require('../utils/auth');

module.exports = {
    name: "leaveall",
    aliases: ["quittetout", "leavegroups"],
    category: "owner",
    desc: "Quitte tous les groupes sauf ceux listés dans config.keepGroups",
    usage: ".leaveall [confirm]",
    async execute(sock, msg, args, cmd) {
        const jid = msg.key.remoteJid;
        const config = sock.config;

        if (!isAuthorized(sock, msg, config)) {
            return sock.sendMessage(jid, { text: "❌ Commande réservée au propriétaire." }, { quoted: msg });
        }

        const force = args[0]?.toLowerCase() === 'confirm' || args[0]?.toLowerCase() === 'force';

        try {
            await sock.sendMessage(jid, { react: { text: '⏳', key: msg.key } });

            const groups = await sock.groupFetchAllParticipating();
            const groupList = Object.values(groups);

            if (groupList.length === 0) {
                return sock.sendMessage(jid, { text: "ℹ️ Le bot n'est dans aucun groupe." }, { quoted: msg });
            }

            const keepGroups = Array.isArray(config.keepGroups) ? config.keepGroups : [];

            let groupsToLeave = [];
            if (force || keepGroups.length === 0) {
                groupsToLeave = groupList;
                if (!force && keepGroups.length === 0) {
                    return sock.sendMessage(jid, {
                        text: "⚠️ Aucun groupe à conserver trouvé. Le bot va quitter TOUS les groupes.\n" +
                              "Si tu es sûr, tape : `.leaveall confirm`"
                    }, { quoted: msg });
                }
            } else {
                groupsToLeave = groupList.filter(g => !keepGroups.includes(g.id));
            }

            if (groupsToLeave.length === 0) {
                return sock.sendMessage(jid, { text: "✅ Le bot est déjà uniquement dans les groupes à conserver." }, { quoted: msg });
            }

            await sock.sendMessage(jid, {
                text: `🔄 Départ de ${groupsToLeave.length} groupe(s)...`
            }, { quoted: msg });

            let successCount = 0;
            let failCount = 0;

            for (const g of groupsToLeave) {
                try {
                    await sock.groupLeave(g.id);
                    successCount++;
                    console.log(`✅ Quitté : ${g.subject || g.id}`);
                    await new Promise(r => setTimeout(r, 2000));
                } catch (e) {
                    failCount++;
                    console.error(`❌ Échec pour ${g.subject || g.id}:`, e.message);
                }
            }

            let reply = `📊 *Résultat :*\n` +
                        `✅ Groupes quittés : ${successCount}\n` +
                        `❌ Échecs : ${failCount}\n\n`;
            if (keepGroups.length > 0) {
                reply += `🛡️ Groupes conservés : ${keepGroups.length}\n`;
            }
            reply += `> Powered by ©Mr Marco`;

            await sock.sendMessage(jid, { text: reply }, { quoted: msg });

        } catch (err) {
            console.error("Erreur plugin leaveall:", err);
            await sock.sendMessage(jid, {
                text: "❌ Une erreur est survenue lors du départ des groupes.\n> Powered by ©Mr Marco"
            }, { quoted: msg });
        }
    }
};
