// plugins/control.js
const { isAuthorized, normalizeNumber } = require("../utils/auth");
const { loadConfig, saveConfig } = require("../utils/configManager");

module.exports = {
    name: "control",
    alias: [
        "allowlink", "allowlinklist", "mutelist", "alllist", "unmute", "resetwarn",
        "reactstatus", "reactstatuslist", "welcome", "welcomelist", "eventlist", "antilink", "access"
    ],
    category: "owner",
    desc: "Commandes de contrôle du bot MARCO-XMD",
    execute: async (sock, msg, args, cmd, originalCmd) => {
        const jid = msg.key.remoteJid;
        const config = loadConfig();

        // Initialisation des tableaux s'ils n'existent pas
        if (!config.allowedLinkUsers) config.allowedLinkUsers = [];
        if (!config.excludedStatusNumbers) config.excludedStatusNumbers = [];
        if (!config.excludedWelcomeGroups) config.excludedWelcomeGroups = [];
        if (!config.disabledAntilinkGroups) config.disabledAntilinkGroups = [];
        if (!config.allowedAccessGroups) config.allowedAccessGroups = [];
        if (!config.muteList) config.muteList = [];
        if (!config.antilinkGroups) config.antilinkGroups = [];  // Groupes où l'antilien est activé

        const cmdName = originalCmd || cmd;

        switch (cmdName) {
            // ================== REACT STATUS ==================
            case "reactstatus": {
                if (!isAuthorized(sock, msg, config)) return sock.sendMessage(jid, { text: "❌ Commande réservée au propriétaire." }, { quoted: msg });
                if (args[0] === "on") {
                    config.reactstatus = true;
                    saveConfig(config);
                    return sock.sendMessage(jid, { text: "✅ Auto-réaction aux statuts activée." }, { quoted: msg });
                } else if (args[0] === "off") {
                    config.reactstatus = false;
                    saveConfig(config);
                    return sock.sendMessage(jid, { text: "❌ Auto-réaction aux statuts désactivée." }, { quoted: msg });
                }
                return sock.sendMessage(jid, { text: `❌ Utilisation : .reactstatus on/off` }, { quoted: msg });
            }

            // ================== REACT STATUS LIST ==================
            case "reactstatuslist": {
                if (!isAuthorized(sock, msg, config)) return sock.sendMessage(jid, { text: "❌ Commande réservée au propriétaire." }, { quoted: msg });
                if (!args[0]) return sock.sendMessage(jid, { text: `❌ Utilisation : .reactstatuslist add/del/list <numéro>` }, { quoted: msg });
                const num = args[1]?.replace(/[^0-9]/g, '');
                if (args[0] === "add" && num) {
                    const userJid = num + '@s.whatsapp.net';
                    if (!config.excludedStatusNumbers.includes(userJid)) {
                        config.excludedStatusNumbers.push(userJid);
                        saveConfig(config);
                    }
                    return sock.sendMessage(jid, { text: `✅ ${num} ajouté aux exclusions de réaction statut.` }, { quoted: msg });
                } else if (args[0] === "del" && num) {
                    config.excludedStatusNumbers = config.excludedStatusNumbers.filter(n => n !== num + '@s.whatsapp.net');
                    saveConfig(config);
                    return sock.sendMessage(jid, { text: `✅ ${num} retiré des exclusions.` }, { quoted: msg });
                } else if (args[0] === "list") {
                    const list = config.excludedStatusNumbers.map(n => n.split('@')[0]).join('\n') || 'Aucun';
                    return sock.sendMessage(jid, { text: `📋 Exclusions statut :\n${list}` }, { quoted: msg });
                }
                return sock.sendMessage(jid, { text: `❌ Usage: .reactstatuslist add/del/list <numéro>` }, { quoted: msg });
            }

            // ================== WELCOME ==================
            case "welcome": {
                if (!isAuthorized(sock, msg, config)) return sock.sendMessage(jid, { text: "❌ Commande réservée au propriétaire." }, { quoted: msg });
                if (args[0] === "on") {
                    config.welcome = true;
                    saveConfig(config);
                    return sock.sendMessage(jid, { text: "✅ Message de bienvenue activé." }, { quoted: msg });
                } else if (args[0] === "off") {
                    config.welcome = false;
                    saveConfig(config);
                    return sock.sendMessage(jid, { text: "❌ Message de bienvenue désactivé." }, { quoted: msg });
                }
                return sock.sendMessage(jid, { text: `❌ Utilisation : .welcome on/off` }, { quoted: msg });
            }

            // ================== WELCOME LIST ==================
            case "welcomelist": {
                if (!isAuthorized(sock, msg, config)) return sock.sendMessage(jid, { text: "❌ Commande réservée au propriétaire." }, { quoted: msg });
                if (!args[0]) return sock.sendMessage(jid, { text: `❌ Utilisation : .welcomelist add/del/list <JID groupe>` }, { quoted: msg });
                const groupJid = args[1];
                if (args[0] === "add" && groupJid && groupJid.includes('@g.us')) {
                    if (!config.excludedWelcomeGroups.includes(groupJid)) {
                        config.excludedWelcomeGroups.push(groupJid);
                        saveConfig(config);
                    }
                    return sock.sendMessage(jid, { text: `✅ Groupe exclu du welcome.` }, { quoted: msg });
                } else if (args[0] === "del" && groupJid) {
                    config.excludedWelcomeGroups = config.excludedWelcomeGroups.filter(g => g !== groupJid);
                    saveConfig(config);
                    return sock.sendMessage(jid, { text: `✅ Groupe retiré des exclusions.` }, { quoted: msg });
                } else if (args[0] === "list") {
                    const list = config.excludedWelcomeGroups.join('\n') || 'Aucun';
                    return sock.sendMessage(jid, { text: `📋 Exclusions welcome :\n${list}` }, { quoted: msg });
                }
                return sock.sendMessage(jid, { text: `❌ Usage: .welcomelist add/del/list <JID>` }, { quoted: msg });
            }

            // ================== EVENT LIST ==================
            case "eventlist": {
                if (!isAuthorized(sock, msg, config)) return sock.sendMessage(jid, { text: "❌ Commande réservée au propriétaire." }, { quoted: msg });
                let text = `📋 *État des événements*\n\n`;
                text += `👀 Auto-Status : ${config.reactstatus ? '✅ Activé' : '❌ Désactivé'}\n`;
                text += `👋 Welcome : ${config.welcome ? '✅ Activé' : '❌ Désactivé'}\n`;
                text += `⚙️ Mode : ${config.publicMode ? '🔓 Public' : '🔒 Privé'}\n`;
                text += `📦 Prefix : [ ${config.prefix} ]\n`;
                return sock.sendMessage(jid, { text }, { quoted: msg });
            }

            // ================== ANTILINK (groupe par groupe) ==================
            case "antilink": {
                if (!jid.endsWith('@g.us')) {
                    return sock.sendMessage(jid, { text: "❌ Commande utilisable uniquement dans un groupe." }, { quoted: msg });
                }

                // Vérifier que l'expéditeur est admin du groupe
                try {
                    const metadata = await sock.groupMetadata(jid);
                    const sender = msg.key.participant || msg.key.remoteJid;
                    const participant = metadata.participants.find(p => p.id === sender);
                    if (!participant || (participant.admin !== 'admin' && participant.admin !== 'superadmin')) {
                        return sock.sendMessage(jid, { text: "❌ Seuls les administrateurs du groupe peuvent gérer l'antilien." }, { quoted: msg });
                    }
                } catch (err) {
                    console.error("Erreur vérification admin antilink:", err.message);
                    return sock.sendMessage(jid, { text: "⚠️ Impossible de vérifier vos droits d'administration." }, { quoted: msg });
                }

                if (args[0] === "on") {
                    if (!config.antilinkGroups.includes(jid)) {
                        config.antilinkGroups.push(jid);
                        saveConfig(config);
                    }
                    return sock.sendMessage(jid, { text: "🔗 Antilien activé pour ce groupe." }, { quoted: msg });
                } else if (args[0] === "off") {
                    config.antilinkGroups = config.antilinkGroups.filter(g => g !== jid);
                    saveConfig(config);
                    return sock.sendMessage(jid, { text: "🔗 Antilien désactivé pour ce groupe." }, { quoted: msg });
                } else {
                    const status = config.antilinkGroups.includes(jid) ? "✅ activé" : "❌ désactivé";
                    return sock.sendMessage(jid, { text: `🔗 Antilien est ${status} dans ce groupe.\nUtilisez *.antilink on* ou *.antilink off*.` }, { quoted: msg });
                }
            }

            // ================== ALLOW LINK ==================
            case "allowlink": {
                if (!isAuthorized(sock, msg, config)) return sock.sendMessage(jid, { text: "❌ Commande réservée au propriétaire." }, { quoted: msg });
                const mentioned = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0];
                const target = mentioned || args[0]?.replace(/[^0-9]/g, '') + '@s.whatsapp.net';
                if (!target) return sock.sendMessage(jid, { text: "❌ Mentionnez un utilisateur ou donnez un numéro." }, { quoted: msg });
                if (!config.allowedLinkUsers.includes(target)) {
                    config.allowedLinkUsers.push(target);
                    saveConfig(config);
                }
                return sock.sendMessage(jid, { text: `✅ Utilisateur autorisé à envoyer des liens.` }, { quoted: msg });
            }

            // ================== ALLOW LINK LIST ==================
            case "allowlinklist": {
                if (!isAuthorized(sock, msg, config)) return sock.sendMessage(jid, { text: "❌ Commande réservée au propriétaire." }, { quoted: msg });
                const list = config.allowedLinkUsers.map(u => u.split('@')[0]).join('\n') || 'Aucun';
                return sock.sendMessage(jid, { text: `📋 Utilisateurs autorisés (liens) :\n${list}` }, { quoted: msg });
            }

            // ================== MUTE LIST ==================
            case "mutelist": {
                if (!isAuthorized(sock, msg, config)) return sock.sendMessage(jid, { text: "❌ Commande réservée au propriétaire." }, { quoted: msg });
                const mentioned = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0];
                const target = mentioned || args[0]?.replace(/[^0-9]/g, '') + '@s.whatsapp.net';
                if (!target) return sock.sendMessage(jid, { text: "❌ Mentionnez un utilisateur." }, { quoted: msg });
                if (!config.muteList.includes(target)) {
                    config.muteList.push(target);
                    saveConfig(config);
                    return sock.sendMessage(jid, { text: `🔇 Utilisateur mis en sourdine.` }, { quoted: msg });
                }
                return sock.sendMessage(jid, { text: "ℹ️ Cet utilisateur est déjà en sourdine." }, { quoted: msg });
            }

            // ================== UNMUTE ==================
            case "unmute": {
                if (!isAuthorized(sock, msg, config)) return sock.sendMessage(jid, { text: "❌ Commande réservée au propriétaire." }, { quoted: msg });
                const mentioned = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0];
                const target = mentioned || args[0]?.replace(/[^0-9]/g, '') + '@s.whatsapp.net';
                if (!target) return sock.sendMessage(jid, { text: "❌ Mentionnez un utilisateur." }, { quoted: msg });
                config.muteList = config.muteList.filter(u => u !== target);
                saveConfig(config);
                return sock.sendMessage(jid, { text: `🔊 Utilisateur retiré de la sourdine.` }, { quoted: msg });
            }

            // ================== RESET WARN ==================
            case "resetwarn": {
                if (!isAuthorized(sock, msg, config)) return sock.sendMessage(jid, { text: "❌ Commande réservée au propriétaire." }, { quoted: msg });
                const mentioned = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0];
                const target = mentioned || args[0]?.replace(/[^0-9]/g, '') + '@s.whatsapp.net';
                if (!target) return sock.sendMessage(jid, { text: "❌ Mentionnez un utilisateur." }, { quoted: msg });

                const warnsFile = `./data/warns_${jid}.json`;
                if (require('fs').existsSync(warnsFile)) {
                    const warns = JSON.parse(require('fs').readFileSync(warnsFile, 'utf-8'));
                    if (warns[target]) {
                        delete warns[target];
                        require('fs').writeFileSync(warnsFile, JSON.stringify(warns, null, 2));
                        return sock.sendMessage(jid, { text: `✅ Avertissements de @${target.split('@')[0]} réinitialisés.`, mentions: [target] }, { quoted: msg });
                    }
                }
                return sock.sendMessage(jid, { text: "ℹ️ Aucun avertissement trouvé pour cet utilisateur." }, { quoted: msg });
            }

            // ================== ALL LIST ==================
            case "alllist": {
                if (!isAuthorized(sock, msg, config)) return sock.sendMessage(jid, { text: "❌ Commande réservée au propriétaire." }, { quoted: msg });
                let text = `📋 *Listes de configuration*\n\n`;
                text += `🔗 Allowed Link Users : ${config.allowedLinkUsers.length}\n`;
                text += `🚫 Excluded Status Numbers : ${config.excludedStatusNumbers.length}\n`;
                text += `👋 Excluded Welcome Groups : ${config.excludedWelcomeGroups.length}\n`;
                text += `🔇 Mute List : ${config.muteList.length}\n`;
                text += `🔗 Antilien actifs dans : ${config.antilinkGroups.length} groupe(s)\n`;
                return sock.sendMessage(jid, { text }, { quoted: msg });
            }

            // ================== ACCESS ==================
            case "access": {
                if (!jid.endsWith('@g.us')) return sock.sendMessage(jid, { text: "❌ Commande utilisable uniquement dans un groupe." }, { quoted: msg });
                if (!isAuthorized(sock, msg, config)) return sock.sendMessage(jid, { text: "❌ Commande réservée au propriétaire." }, { quoted: msg });
                if (!config.allowedAccessGroups.includes(jid)) {
                    config.allowedAccessGroups.push(jid);
                    saveConfig(config);
                    return sock.sendMessage(jid, { text: "✅ Groupe autorisé à utiliser le bot (mode privé)." }, { quoted: msg });
                }
                return sock.sendMessage(jid, { text: "ℹ️ Ce groupe est déjà autorisé." }, { quoted: msg });
            }

            // ================== DÉFAUT ==================
            default: {
                return sock.sendMessage(jid, { text: `❌ Commande inconnue dans le module control.` }, { quoted: msg });
            }
        }
    }
};
