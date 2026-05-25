const fs = require('fs');
const { channelInfo } = require('../lib/messageConfig');
const isAdmin = require('../lib/isAdmin');
const { isSudo } = require('../lib/index');

module.exports = {
    name: "unban",
    aliases: ["debannir"],
    desc: "Débannir un utilisateur (admin/sudo)",
    usage: ".unban @user",
    async execute(sock, msg) {
        const chatId = msg.key.remoteJid;
        const isGroup = chatId.endsWith('@g.us');

        if (isGroup) {
            const senderId = msg.key.participant || msg.key.remoteJid;
            const { isSenderAdmin, isBotAdmin } = await isAdmin(sock, chatId, senderId);
            if (!isBotAdmin) {
                return sock.sendMessage(chatId, {
                    text: '❌ Je dois être *admin* pour utiliser la commande `.unban`.',
                    ...channelInfo
                }, { quoted: msg });
            }
            if (!isSenderAdmin && !msg.key.fromMe) {
                return sock.sendMessage(chatId, {
                    text: '❌ Seuls les *admins du groupe* peuvent utiliser `.unban`.',
                    ...channelInfo
                }, { quoted: msg });
            }
        } else {
            const senderId = msg.key.participant || msg.key.remoteJid;
            const senderIsSudo = await isSudo(senderId);
            if (!msg.key.fromMe && !senderIsSudo) {
                return sock.sendMessage(chatId, {
                    text: '❌ En privé, seul le *propriétaire/sudo* peut utiliser `.unban`.',
                    ...channelInfo
                }, { quoted: msg });
            }
        }

        let userToUnban;

        if (msg.message?.extendedTextMessage?.contextInfo?.mentionedJid?.length > 0) {
            userToUnban = msg.message.extendedTextMessage.contextInfo.mentionedJid[0];
        } else if (msg.message?.extendedTextMessage?.contextInfo?.participant) {
            userToUnban = msg.message.extendedTextMessage.contextInfo.participant;
        }

        if (!userToUnban) {
            return sock.sendMessage(chatId, {
                text: `╭───❏ MARCO-XMD\n│ 🚫 Erreur : utilisateur non détecté\n│ ✅ Utilise :\n│ • .unban @user\n│ • réponds au message puis .unban\n╰───❏`,
                ...channelInfo
            }, { quoted: msg });
        }

        try {
            let bannedUsers = [];
            try {
                bannedUsers = JSON.parse(fs.readFileSync('./data/banned.json'));
            } catch {}
            const index = bannedUsers.indexOf(userToUnban);

            if (index > -1) {
                bannedUsers.splice(index, 1);
                fs.writeFileSync('./data/banned.json', JSON.stringify(bannedUsers, null, 2));

                await sock.sendMessage(chatId, {
                    text: `╭───❏ MARCO-XMD\n│ ✅ Débannissement réussi\n│ 👤 Utilisateur : @${userToUnban.split('@')[0]}\n╰───❏`,
                    mentions: [userToUnban],
                    ...channelInfo
                }, { quoted: msg });
            } else {
                await sock.sendMessage(chatId, {
                    text: `╭───❏ MARCO-XMD\n│ ⚠️ Non banni\n│ 👤 Utilisateur : @${userToUnban.split('@')[0]}\n╰───❏`,
                    mentions: [userToUnban],
                    ...channelInfo
                }, { quoted: msg });
            }
        } catch (error) {
            console.error('Erreur unban:', error);
            await sock.sendMessage(chatId, {
                text: '❌ Échec : impossible de débannir cet utilisateur.',
                ...channelInfo
            }, { quoted: msg });
        }
    }
};
