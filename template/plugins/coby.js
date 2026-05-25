const fs = require('fs');
const path = require('path');

module.exports = {
    name: "coby",
    alias: ["koby", "kobymenu", "cobymenu", "cobypromo"],
    category: "general",
    desc: "Affiche les services COBY PROMO",
    async execute(sock, msg, args) {
        const jid = msg.key.remoteJid;
        const imagePath = path.join(__dirname, "../media/logokoby.jpg");
        let imageBuffer = null;
        if (fs.existsSync(imagePath)) {
            imageBuffer = fs.readFileSync(imagePath);
        } else {
            console.log("❌ Image logokoby.jpg non trouvée");
        }

        const caption = `┌─────────────────────
┝ COBYPROMO 〽️
└─────────────────────
┌─────────────────────
   [NOU OFRIW SÈVIS] 
└─────────────────────
┌─────────────────────
●TABLO PVC
● VALIZ PÈSONALIZE 
● CHÈN PÈSONALIZE 
● BIDON PÈSONALIZE
● TAS PÈSONALIZE
● KAYE PÈSONALIZE  
● ENPRESYON SOU KEPI  🪄🪄🪄
● ANKADREMAN 🖼️
● Banè rolop bilbòd
└─────────────────────
> Powered by Mr Marco`;

        await sock.sendMessage(jid, {
            image: imageBuffer,
            caption: caption
        });
    }
};
