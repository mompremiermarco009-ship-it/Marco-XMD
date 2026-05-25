const express = require("express");
const path = require("path");
const fs = require("fs").promises;
const axios = require("axios");
const config = require("./config.json");

const app = express();
const PORT = process.env.PORT || 10000;

app.use(express.json({ limit: "5kb" }));
// Servir les fichiers statiques depuis le dossier public
app.use(express.static(path.join(__dirname, "public")));

// Rate limiter (avis)
const avisRequestCounts = new Map();
function rateLimiter(maxRequests, windowMs) {
    return (req, res, next) => {
        const ip = req.ip;
        const now = Date.now();
        const record = avisRequestCounts.get(ip) || [];
        const recent = record.filter(time => now - time < windowMs);
        recent.push(now);
        avisRequestCounts.set(ip, recent);
        if (recent.length > maxRequests) return res.status(429).json({ error: "Trop de requêtes." });
        next();
    };
}

// Avis (inchangé)
const avisFilePath = path.join(__dirname, "data", "avis.json");
async function loadAvisFromFile() {
    try { const data = await fs.readFile(avisFilePath, "utf-8"); return JSON.parse(data); }
    catch { return []; }
}
async function saveAvisToFile(avis) {
    await fs.mkdir(path.dirname(avisFilePath), { recursive: true });
    await fs.writeFile(avisFilePath, JSON.stringify(avis, null, 2));
}
async function migrateAvis() {
    let avis = await loadAvisFromFile();
    let changed = false;
    avis = avis.map(a => {
        const newAvis = { ...a };
        if (!newAvis.id) {
            newAvis.id = Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
            changed = true;
        }
        if (newAvis.likes === undefined) { newAvis.likes = 0; changed = true; }
        if (newAvis.dislikes === undefined) { newAvis.dislikes = 0; changed = true; }
        if (!newAvis.voters) { newAvis.voters = {}; changed = true; }
        return newAvis;
    });
    if (changed) await saveAvisToFile(avis);
    return avis;
}
migrateAvis().then(() => console.log("✅ Migration des avis terminée"));

app.get("/api/avis", async (req, res) => res.json(await loadAvisFromFile()));
app.post("/api/avis", rateLimiter(5, 60000), async (req, res) => {
    const { name, message } = req.body;
    if (!name || !message) return res.status(400).json({ success: false, error: "Nom et message requis." });
    if (name.length > 50 || message.length > 500) return res.status(400).json({ error: "Trop long." });
    const avis = await loadAvisFromFile();
    const newAvis = {
        id: Date.now().toString(36) + Math.random().toString(36).substr(2, 5),
        name,
        message,
        date: new Date().toISOString(),
        likes: 0,
        dislikes: 0,
        voters: {}
    };
    avis.push(newAvis);
    if (avis.length > 50) avis.shift();
    await saveAvisToFile(avis);
    res.json({ success: true, avis: newAvis });
});
app.post("/api/avis/vote", rateLimiter(10, 60000), async (req, res) => {
    const { id, type, voterId } = req.body;
    if (!id || !type || !voterId) return res.status(400).json({ error: "Paramètres manquants." });
    if (type !== "like" && type !== "dislike") return res.status(400).json({ error: "Type invalide." });
    const avis = await loadAvisFromFile();
    const avisItem = avis.find(a => a.id === id);
    if (!avisItem) return res.status(404).json({ error: "Avis introuvable." });
    if (!avisItem.voters) avisItem.voters = {};
    const previousVote = avisItem.voters[voterId];
    if (previousVote === type) {
        delete avisItem.voters[voterId];
        if (type === "like") avisItem.likes = Math.max(0, (avisItem.likes || 0) - 1);
        else avisItem.dislikes = Math.max(0, (avisItem.dislikes || 0) - 1);
    } else {
        if (previousVote) {
            if (previousVote === "like") avisItem.likes = Math.max(0, (avisItem.likes || 0) - 1);
            else avisItem.dislikes = Math.max(0, (avisItem.dislikes || 0) - 1);
        }
        avisItem.voters[voterId] = type;
        if (type === "like") avisItem.likes = (avisItem.likes || 0) + 1;
        else avisItem.dislikes = (avisItem.dislikes || 0) + 1;
    }
    await saveAvisToFile(avis);
    res.json({ success: true, likes: avisItem.likes, dislikes: avisItem.dislikes });
});

// Recherche
app.get("/api/search", async (req, res) => {
    let query = req.query.q;
    if (!query) return res.status(400).json({ error: "Paramètre 'q' requis." });
    const cleanedQuery = query.replace(/[?.,;!]/g, '').replace(/\b(qu['’]elle|quelle|quel|quels|quelles|qui|que|quoi|comment|pourquoi|où|quand)\b/gi, '').trim();
    const queriesToTry = [cleanedQuery, query].filter(q => q.length > 0);
    for (const q of queriesToTry) {
        try {
            const searchResp = await axios.get("https://fr.wikipedia.org/w/api.php", { params: { action: "query", list: "search", srsearch: q, format: "json", srlimit: 1 } });
            const pages = searchResp.data?.query?.search;
            if (pages && pages.length > 0) {
                const pageTitle = pages[0].title;
                const summaryResp = await axios.get("https://fr.wikipedia.org/api/rest_v1/page/summary/" + encodeURIComponent(pageTitle));
                if (summaryResp.data && summaryResp.data.extract) {
                    const snippet = summaryResp.data.extract.length > 500 ? summaryResp.data.extract.substring(0, 500) + '…' : summaryResp.data.extract;
                    return res.json({ title: pageTitle, snippet, link: summaryResp.data.content_urls?.desktop?.page || "" });
                }
            }
        } catch (err) {}
        try {
            const ddgResp = await axios.get("https://api.duckduckgo.com/", { params: { q: q, format: "json", no_html: 1, skip_disambig: 1 } });
            const data = ddgResp.data;
            let snippet = data.AbstractText;
            if (!snippet && data.RelatedTopics?.length) snippet = data.RelatedTopics[0].Text;
            if (snippet) {
                if (snippet.length > 500) snippet = snippet.substring(0, 500) + '…';
                return res.json({ title: data.Heading || q, snippet, link: data.AbstractURL || "" });
            }
        } catch (err) {}
    }
    res.json({ error: "Aucune réponse trouvée." });
});

const startServer = (startBotFunc, sessionsMap) => {
    // Route principale : sert index.html depuis public/
    app.get("/", (req, res) => res.sendFile(path.join(__dirname, "public", "index.html")));

    // Pairing code
    app.get("/pair", async (req, res) => {
        let num = req.query.number;
        if (!num) return res.status(400).json({ error: "Numéro requis (?number=509...)" });
        num = num.replace(/[^0-9]/g, "");
        if (num.length < 10) return res.status(400).json({ error: "Numéro invalide." });
        let marcoInstance;
        try {
            marcoInstance = sessionsMap.get(num);
            if (!marcoInstance) marcoInstance = await startBotFunc(num);
            await marcoInstance._pairingReadyPromise;
            await new Promise(r => setTimeout(r, 3000));
            let code;
            for (let attempt = 0; attempt < 2; attempt++) {
                try {
                    code = await marcoInstance.requestPairingCode(num, "MARCOXMD");
                    break;
                } catch (err) {
                    if (attempt === 1) throw err;
                    await new Promise(r => setTimeout(r, 2000));
                }
            }
            res.status(200).json({ code });
        } catch (err) {
            console.error(`❌ Erreur Pairing pour ${num}:`, err);
            let message = "Erreur lors de la génération du code.";
            if (err.output?.statusCode === 428) message = "Connexion refusée (428). Utilisez le QR code.";
            else if (err.message?.includes("Timed Out")) message = "La connexion WhatsApp a pris trop de temps.";
            if (marcoInstance) {
                try { marcoInstance.end(); marcoInstance.ev.removeAllListeners(); } catch {}
                sessionsMap.delete(num);
            }
            res.status(500).json({ error: message });
        }
    });

    // QR Code (page légère)
    app.get("/qr", async (req, res) => {
        let num = req.query.number;
        if (!num) return res.status(400).json({ error: "Numéro requis (?number=509...)" });
        num = num.replace(/[^0-9]/g, "");
        if (num.length < 10) return res.status(400).json({ error: "Numéro invalide." });
        const oldSock = sessionsMap.get(num);
        if (oldSock) {
            try { oldSock.end(); oldSock.ev.removeAllListeners(); } catch(e) {}
            sessionsMap.delete(num);
        }
        let sock;
        try {
            sock = await startBotFunc(num, { needQR: true });
            const qrData = await sock._qrPromise;
            const qrHtml = `<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <style>
        body { background: #000; margin: 0; display: flex; justify-content: center; align-items: center; height: 100vh; }
        img { max-width: 100%; max-height: 100%; border: 4px solid #25D366; border-radius: 10px; }
    </style>
</head>
<body>
    <img src="${qrData}" alt="QR Code">
</body>
</html>`;
            res.send(qrHtml);
        } catch (err) {
            console.error(`❌ Erreur QR pour ${num}:`, err);
            if (sock) {
                try { sock.end(); sock.ev.removeAllListeners(); } catch {}
                sessionsMap.delete(num);
            }
            res.status(500).json({ error: err.message || "Erreur QR" });
        }
    });

    app.get("/status", (req, res) => {
        const active = Array.from(sessionsMap.keys());
        res.json({ botName: config.botName, activeSessionsCount: active.length, sessions: active });
    });

    const server = app.listen(PORT, "0.0.0.0", () => {
        console.log(`🌍 Serveur Web de ${config.botName} lancé sur le port ${PORT}`);
    });
    server.on('error', (err) => console.error('❌ Erreur serveur:', err.message));
};

module.exports = { startServer };
