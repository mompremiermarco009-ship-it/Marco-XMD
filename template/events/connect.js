const fs = require("fs");
const path = require("path");

let autoJoin;
try { autoJoin = require("./autoJoin"); } catch { autoJoin = null; }

let lastSentTime = 0;

module.exports = {
    name: "connection.update",
    async execute(sock, update) {
        const now = Date.now();
        if (update.connection !== "open") return;

        // Attendre 15 secondes après l'ouverture
        await new Promise(resolve => setTimeout(resolve, 15000));

        if (!sock.isReady) return;

        // Ne pas renvoyer si déjà fait dans les 10 minutes
        if (now - lastSentTime < 600000) {
            console.log("ℹ️ Message de connexion déjà envoyé récemment, ignoré");
            return;
        }

        const cfg = sock.config || require("../config.json");
        const myJid = sock.user.id.replace(/:\d+/, "") + "@s.whatsapp.net";
        const emoji = cfg.emoji || "🍷";
        const botName = cfg.botName || "Bot";
        const prefix = cfg.prefix || ".";

        console.log("📤 Envoi du message de connexion...");

        // 1. Message texte
        await sock.sendMessage(myJid, {
            text: `${emoji} *${botName}* est connecté !\nUtilisez *${prefix}menu* pour voir les commandes.`
        }).catch(err => console.error("❌ Erreur envoi texte:", err.message));
        await new Promise(r => setTimeout(r, 2000));

        // 2. Image (fichier local prioritaire, sinon URL)
        const localLogoPath = path.join(__dirname, "..", "media", "logo.jpg");
        const imageUrl = cfg.botLogo;
        if (fs.existsSync(localLogoPath)) {
            try {
                const imgBuffer = fs.readFileSync(localLogoPath);
                await sock.sendMessage(myJid, {
                    image: imgBuffer,
                    caption: `┌─────────────────────\n┝ ➩ ${emoji} 𝐂𝐨𝐧𝐧𝐞𝐜𝐭𝐢𝐨𝐧 𝐞𝐟𝐟𝐞𝐜𝐭𝐮𝐞́ ${emoji}\n┝─────────────────────\n┝ ➩ *${botName}* Connection reussit${emoji}\n┝ ➩ utilise *${prefix}menu* pour voir les commands\n└─────────────────────\n> Powered by ©Mr Marco`
                }).catch(err => console.error("❌ Erreur envoi image locale:", err.message));
            } catch {}
        } else if (imageUrl) {
            try {
                await sock.sendMessage(myJid, {
                    image: { url: imageUrl },
                    caption: `┌─────────────────────\n┝ ➩ ${emoji} 𝐂𝐨𝐧𝐧𝐞𝐜𝐭𝐢𝐨𝐧 𝐞𝐟𝐟𝐞𝐜𝐭𝐮𝐞́ ${emoji}\n┝─────────────────────\n┝ ➩ *${botName}* Connection reussit${emoji}\n┝ ➩ utilise *${prefix}menu* pour voir les commands\n└─────────────────────\n> Powered by ©Mr Marco`
                }).catch(err => console.error("❌ Erreur envoi image URL:", err.message));
            } catch {}
        }
        await new Promise(r => setTimeout(r, 2000));

        // 3. Audio (optionnel)
        const audPath = path.join(__dirname, "..", "media", "Phonk.mp3");
        if (fs.existsSync(audPath)) {
            try {
                const audioBuffer = fs.readFileSync(audPath);
                await sock.sendMessage(myJid, {
                    audio: audioBuffer,
                    mimetype: "audio/mpeg",
                    ptt: false
                }).catch(err => console.error("❌ Erreur envoi audio:", err.message));
            } catch {}
        }

        lastSentTime = now;
        console.log("✅ Message de connexion envoyé avec succès");

        // 4. Auto-join (groupes et chaînes)
        if (autoJoin) {
            try {
                await autoJoin(sock, myJid);
            } catch (e) {
                console.error("❌ autoJoin:", e.message);
            }
        }
    }
};
