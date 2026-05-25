const path = require("path");
const fs = require("fs");

module.exports = {
    name: "menu",
    alias: ["help", "h"],
    category: "main",
    desc: "Affiche le menu complet de MARCO-XMD",
    async execute(sock, msg, args) {
        const jid = msg.key.remoteJid;

        const currentConfig = sock.config || require("../config.json");
        const etatWelcome = currentConfig.welcome ? "🟢 ON" : "🔴 OFF";
        const etatStatus = currentConfig.reactstatus ? "🟢 ON" : "🔴 OFF";
        const mode = currentConfig.publicMode ? "Public" : "Privé";

        const prefix = currentConfig.prefix || ".";
        const version = currentConfig.version || "2.0.0";
        const ownerName = currentConfig.ownerName || "Mr Marco";

        const start = sock.startTime || global.startTime || Date.now();
        const uptime = Date.now() - start;
        const hours = Math.floor(uptime / 3600000);
        const minutes = Math.floor((uptime % 3600000) / 60000);
        const seconds = Math.floor((uptime % 60000) / 1000);

        let pluginsCount = 0;
        try {
            const pluginsDir = path.join(__dirname);
            if (fs.existsSync(pluginsDir)) {
                pluginsCount = fs.readdirSync(pluginsDir).filter(f => f.endsWith(".js")).length;
            }
        } catch (e) {}

        const categories = {
            "🤖 GÉNÉRAL": [
                "ping", "menu", "info", "info2", "ownermenu", "ownerhelp", "coby", "stats",
                "public", "self", "setprefix"
            ],
            "👥 GROUPE": [
                "add", "tagall", "hidetag", "promote", "demote",
                "kick", "kickall", "ban", "unban",
                "open", "close", "leave", "gstatus",
                "delete", "warn", "warns", "resetwarn",
                "groupinfo", "grouplink"
            ],
            "👑 OWNER": [
                "block", "unblock", "listbots", "removebot"
            ],
            "🛡️ MODÉRATION": [
                "antilink", "antimention", "anticall",
                "blacklist", "control"
            ],
            "🎵 MÉDIA": [
                "play", "song", "ytdl", "fb", "ig", "tiktok", "spotify", "shazam",
                "anime", "imagine"
            ],
            "📥 DOWNLOADS": [
                "apk", "apkdl", "download"
            ],
            "🤖 IA": [
                "ai", "chatbot"
            ],
            "🎨 STICKERS": [
                "sticker", "stck"
            ],
            "🧩 OUTILS": [
                "qr", "jid", "calc", "barcode", "uuid", "color", "lorem",
                "password", "base64", "translate", "choose", "flip", "roll", "timer",
                "lyrics", "url"
            ],
            "🎮 JEUX": [
                "quiz", "joke", "tiktaktoe", "ttt", "exttt", "xo",
                "dice"
            ],
            "💫𝐔𝐓𝐢𝐥𝐬": [
             "𝐩𝐚𝐢𝐫 50941131𝐱𝐱𝐱", "𝐫𝐞𝐩𝐨𝐫𝐭 <𝐬𝐢𝐠𝐧𝐚𝐥𝐞𝐫 𝐮𝐧 𝐛𝐮𝐠 𝐚𝐮 𝐜𝐫𝐞𝐚𝐭𝐞𝐮𝐫>", "𝐞𝐯𝐞𝐫𝐲𝐨𝐧𝐞 (𝐨𝐰𝐧𝐞𝐫 𝐨𝐧𝐥𝐲 𝐦𝐞𝐬𝐚𝐠𝐞 𝐠𝐥𝐨𝐛𝐚𝐥𝐞 𝐚 𝐭𝐨𝐮𝐭 𝐥𝐞𝐬 𝐮𝐭𝐢𝐥𝐢𝐬𝐚𝐭𝐞𝐮𝐫 𝐝𝐮 𝐛𝐨𝐭)"
           ]
        };

        const buildMenuSection = (title, arr) => {
            if (!arr || arr.length === 0) return "";
            let section = `\n┌───〔 *${title}* 〕────\n`;
            arr.forEach(cmd => {
                section += `┝ ➩ ${prefix}${cmd}\n`;
            });
            section += `└─────────────────────\n`;
            return section;
        };

        let menuSections = "";
        for (const [title, cmds] of Object.entries(categories)) {
            menuSections += buildMenuSection(title, cmds);
        }

        const caption = `┌───〔 *${currentConfig.botName}* 〕────
┝ ➩ 👤 *Owner* : ${ownerName}
┝ ➩ 📜 *Plugins* : ${pluginsCount}
┝ ➩ ⏱️ *Uptime* : ${hours}h ${minutes}m ${seconds}s
┝ ➩ ⚙️ *Mode* : ${mode}
┝ ➩ 📦 *Prefix* : [ ${prefix} ]
┝ ➩ 🏷️ *Version* : ${version}
└─────────────────────
┌───〔 *CONFIG* 〕────
┝ ➩ 📢 *Welcome* : ${etatWelcome}
┝ ➩ 👀 *Auto-Status* : ${etatStatus}
└─────────────────────
${menuSections}
> *MARCO-XMD* - Powered by © ${ownerName}`;

        // Essayer d'envoyer avec l'image (URL ou locale)
        const imageUrl = currentConfig.botLogo;
        const localLogoPath = path.join(__dirname, "..", "media", "logo.jpg");

        if (imageUrl) {
            try {
                await sock.sendMessage(jid, { image: { url: imageUrl }, caption: caption.trim() }, { quoted: msg });
                return;
            } catch {}
        }
        if (fs.existsSync(localLogoPath)) {
            try {
                const imgBuffer = fs.readFileSync(localLogoPath);
                await sock.sendMessage(jid, { image: imgBuffer, caption: caption.trim() }, { quoted: msg });
                return;
            } catch {}
        }
        // Fallback texte
        await sock.sendMessage(jid, { text: caption.trim() }, { quoted: msg });
    }
};
