const fs = require('fs');
const { channelInfo } = require('../lib/messageConfig');
const isAdmin = require('../lib/isAdmin');
const { isSudo } = require('../lib/index');

module.exports = {
    name: "ban",
    aliases: ["bannir"],
    desc: "Bannir un utilisateur (admin/sudo)",
    usage: ".ban @user",
    async execute(sock, msg) {
        const chatId = msg.key.remoteJid;
        const isGroup = chatId.endsWith('@g.us');

        if (isGroup) {
            const senderId = msg.key.participant || msg.key.remoteJid;
            const { isSenderAdmin, isBotAdmin } = await isAdmin(sock, chatId, senderId);
            if (!isBotAdmin) {
                return sock.sendMessage(chatId, {
                    text: '❌ Je dois être *admin* pour utiliser la commande `.ban`.',
                    ...channelInfo
                }, { quoted: msg });
            }
            if (!isSenderAdmin && !msg.key.fromMe) {
                return sock.sendMessage(chatId, {
                    text: '❌ Seuls les *admins du groupe* peuvent utiliser `.ban`.',
                    ...channelInfo
                }, { quoted: msg });
            }
        } else {
            const senderId = msg.key.participant || msg.key.remoteJid;
            const senderIsSudo = await isSudo(senderId);
            if (!msg.key.fromMe && !senderIsSudo) {
                return sock.sendMessage(chatId, {
                    text: '❌ En privé, seuls le *propriétaire/sudo* peuvent utiliser `.ban`.',
                    ...channelInfo
                }, { quoted: msg });
            }
        }

        let userToBan;

        if (msg.message?.extendedTextMessage?.contextInfo?.mentionedJid?.length > 0) {
            userToBan = msg.message.extendedTextMessage.contextInfo.mentionedJid[0];
        } else if (msg.message?.extendedTextMessage?.contextInfo?.participant) {
            userToBan = msg.message.extendedTextMessage.contextInfo.participant;
        }

        if (!userToBan) {
            return sock.sendMessage(chatId, {
                text: `╭─────❏ MARCO-XMD\n│ 🚫 Erreur : utilisateur non détecté\n│ ✅ Utilise :\n│ • .ban @user\n│ • Ou réponds au message de la personne puis tape .ban\n╰─────❏`,
                ...channelInfo
            }, { quoted: msg });
        }

        try {
            const botId = sock.user.id.split(':')[0] + '@s.whatsapp.net';
            if (userToBan === botId || userToBan === botId.replace('@s.whatsapp.net', '@lid')) {
                return sock.sendMessage(chatId, {
                    text: '🤖❌ Tu ne peux pas bannir le compte du bot.',
                    ...channelInfo
                }, { quoted: msg });
            }
        } catch {}

        try {
            let bannedUsers = [];
            try {
                bannedUsers = JSON.parse(fs.readFileSync('./data/banned.json'));
            } catch {}
            if (!bannedUsers.includes(userToBan)) {
                bannedUsers.push(userToBan);
                fs.writeFileSync('./data/banned.json', JSON.stringify(bannedUsers, null, 2));

                await sock.sendMessage(chatId, {
                    text: `╭───❏ MARCO-XMD\n│ ✅ Bannissement réussi\n│ 👤 Utilisateur : @${userToBan.split('@')[0]}\n╰───❏`,
                    mentions: [userToBan],
                    ...channelInfo
                }, { quoted: msg });
            } else {
                await sock.sendMessage(chatId, {
                    text: `╭───❏ MARCO-XMD\n│ ⚠️ Déjà banni\n│ 👤 Utilisateur : @${userToBan.split('@')[0]}\n╰───❏`,
                    mentions: [userToBan],
                    ...channelInfo
                }, { quoted: msg });
            }
        } catch (error) {
            console.error('Erreur ban:', error);
            await sock.sendMessage(chatId, {
                text: '❌ Échec : impossible de bannir cet utilisateur.',
                ...channelInfo
            }, { quoted: msg });
        }
    }
};
