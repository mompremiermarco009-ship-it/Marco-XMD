// template/plugins/repo.js — Infos du projet MARCO-XMD
module.exports = {
    name: 'repo',
    aliases: ['site', 'website', 'web', 'project'],
    category: 'general',
    desc: 'Affiche les informations et le lien du site MARCO-XMD',
    usage: '.repo',

    async execute(sock, msg, args, cmd) {
        const jid = msg.key.remoteJid;
        const cfg = sock.config || {};

        const botName = cfg.botName || 'MARCO-XMD';
        const ownerName = cfg.ownerName || 'Mr Marco';
        const version = cfg.version || '2.0.0';
        const emoji = cfg.emoji || '🍷';
        const publicUrl = cfg.publicUrl || 'https://marco-xmd-v2.onrender.com';

        const text = `╔════════════════════════════╗
║  🌐  𝐌𝐀𝐑𝐂𝐎-𝐗𝐌𝐃  𝐒𝐈𝐓𝐄  🌐
╚════════════════════════════╝

╭━━━〔 📌 𝐈𝐧𝐟𝐨𝐫𝐦𝐚𝐭𝐢𝐨𝐧𝐬 〕━━━╮
┃  🤖  𝐍𝐨𝐦      : ${botName}
┃  👑  𝐎𝐰𝐧𝐞𝐫    : ${ownerName}
┃  🏷️  𝐕𝐞𝐫𝐬𝐢𝐨𝐧   : ${version}
┃  🌍  𝐏𝐥𝐚𝐭𝐟𝐨𝐫𝐦𝐞 : Render
┃  ${emoji}  𝐒𝐭𝐚𝐭𝐮𝐭   : Online
╰━━━━━━━━━━━━━━━━━━━━━━╯

╭━━━〔 🎯 𝐅𝐨𝐧𝐜𝐭𝐢𝐨𝐧𝐬 〕━━━╮
┃  📥  Video Downloader
┃  🎵  Marco Lyrics
┃  🎙️  Voice Studio
┃  🎮  Mini-Jeux
┃  📱  Multi-Session
┃  🛡️  Anti-Ban
╰━━━━━━━━━━━━━━━━━━━━━━╯

╭━━━〔 🔗 𝐀𝐜𝐜𝐞̀𝐬 𝐝𝐢𝐫𝐞𝐜𝐭 〕━━━╮
┃
┃  🌐  ${publicUrl}
┃
┃  📥  ${publicUrl}/video_downloader/
┃  🎵  ${publicUrl}/marco_lyrics/
┃  🎙️  ${publicUrl}/voice_studio/
┃  🎮  ${publicUrl}/games.html
┃
╰━━━━━━━━━━━━━━━━━━━━━━╯

╭━━━〔 ✨ 𝐏𝐨𝐢𝐧𝐭𝐬 𝐟𝐨𝐫𝐭𝐬 〕━━━╮
┃  ✅  100% Gratuit
┃  ✅  Ultra rapide
┃  ✅  Sécurisé
┃  ✅  Multi-Session
┃  ✅  Sans installation
╰━━━━━━━━━━━━━━━━━━━━━━╯

💡 _Cliquez sur le lien pour_
_ouvrir le site directement._

> 𝑃𝑜𝑤𝑒𝑟𝑒𝑑 𝑏𝑦 ${ownerName}`;

        // Envoyer avec le logo
        const logo = cfg.botLogo || cfg.logo;
        try {
            if (logo) {
                await sock.sendMessage(jid, {
                    image: { url: logo },
                    caption: text
                }, { quoted: msg });
            } else {
                await sock.sendMessage(jid, { text }, { quoted: msg });
            }
        } catch {
            await sock.sendMessage(jid, { text }, { quoted: msg });
        }
    }
};
