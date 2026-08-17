const express = require("express");
const path = require("path");
const fs = require("fs").promises;
const axios = require("axios");
const config = require("./config.json");

const app = express();
const PORT = process.env.PORT || 10000;

app.use(express.json({ limit: "5kb" }));
app.use(express.static(path.join(__dirname, "public")));

app.use("/api/admin", require("./admin-routes.js"));

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
    app.get("/", (req, res) => res.sendFile(path.join(__dirname, "public", "index.html")));

    // Pairing code (utilise forcePairing et écoute l'événement pairing-code)
    app.get("/pair", async (req, res) => {
        let num = req.query.number;
        if (!num) return res.status(400).json({ error: "Numéro requis (?number=509...)" });
        num = num.replace(/[^0-9]/g, "");
        if (num.length < 10) return res.status(400).json({ error: "Numéro invalide." });

        let sock;
        try {
            if (sessionsMap.has(num) && sessionsMap.get(num).isReady) {
                return res.status(400).json({ error: "Cette session est déjà active." });
            }
            sock = await startBotFunc(num, { forcePairing: true });
            const code = await new Promise((resolve, reject) => {
                const timeout = setTimeout(() => reject(new Error("Timeout génération code")), 60000);
                sock.ev.on('pairing-code', (c) => {
                    clearTimeout(timeout);
                    resolve(c);
                });
            });
            res.json({ code });
        } catch (err) {
            console.error(`❌ Erreur Pairing pour ${num}:`, err);
            if (sock) {
                try { sock.end(); sock.ev.removeAllListeners(); } catch {}
                sessionsMap.delete(num);
            }
            res.status(500).json({ error: err.message || "Erreur pairing" });
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
