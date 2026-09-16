const express = require("express");
const path = require("path");
const config = require("./config.json");

const app = express();
const PORT = process.env.PORT || 10000;

app.use(express.json({ limit: "5kb" }));
app.use(express.static(path.join(__dirname, "public")));

// Dashboard admin (sessions, commandes, logs, paramètres)
app.use("/api/admin", require("./admin-routes.js"));

const startServer = (startBotFunc, sessionsMap) => {
    // Page principale
    app.get("/", (req, res) => res.sendFile(path.join(__dirname, "public", "index.html")));

    // ---------- Pairing code ----------
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

    // ---------- QR Code (data URL PNG) ----------
    app.get("/qr", async (req, res) => {
        let num = req.query.number;
        if (!num) return res.status(400).json({ error: "Numéro requis" });
        num = num.replace(/[^0-9]/g, "");
        if (num.length < 10) return res.status(400).json({ error: "Numéro invalide." });

        const QRCode = require('qrcode');
        const oldSock = sessionsMap.get(num);
        if (oldSock) {
            try { oldSock.end(); oldSock.ev.removeAllListeners(); } catch(e) {}
            sessionsMap.delete(num);
        }
        let sock;
        try {
            sock = await startBotFunc(num, { needQR: true });
            const rawQR = await sock._qrPromise;
            const qrImage = await QRCode.toDataURL(rawQR, { width: 300 });
            res.json({ qr: qrImage });
        } catch (err) {
            console.error(`❌ Erreur QR pour ${num}:`, err);
            if (sock) {
                try { sock.end(); sock.ev.removeAllListeners(); } catch {}
                sessionsMap.delete(num);
            }
            res.status(500).json({ error: err.message || "Erreur QR" });
        }
    });

    // ---------- Statut ----------
    app.get("/status", (req, res) => {
        // Si on demande explicitement du JSON
        if (req.query.json === '1' || req.headers.accept?.includes('application/json')) {
            const active = Array.from(sessionsMap.keys());
            return res.json({
                botName: config.botName,
                activeSessionsCount: active.length,
                sessions: active
            });
        }
        // Sinon, servir la page HTML stylée
        res.sendFile(path.join(__dirname, "public", "status.html"));
    });

    // ---------- Video Downloader (Option C : temporaire) ----------
    app.use(require("./video_downloader/routes.js"));
    app.use("/video_downloader", express.static(path.join(__dirname, "video_downloader", "public")));
    app.get("/video_downloader.html", (req, res) => res.redirect("/video_downloader/"));

    // ---------- MarcoVoice Studio (Option C : temporaire) ----------
    app.use(require("./voice_studio/routes.js"));
    app.use("/voice_studio", express.static(path.join(__dirname, "voice_studio", "public")));
    app.get("/voice_studio.html", (req, res) => res.redirect("/voice_studio/"));

    // ---------- Marco Lyrics ----------
    app.use(require("./marco_lyrics/routes.js"));
    app.use("/marco_lyrics", express.static(path.join(__dirname, "marco_lyrics", "public")));
    app.get("/marco_lyrics.html", (req, res) => res.redirect("/marco_lyrics/"));

    // ---------- Page 404 ----------
    app.use((req, res) => {
        res.status(404).sendFile(path.join(__dirname, "public", "404.html"));
    });


    const server = app.listen(PORT, "0.0.0.0", () => {
        console.log(`🌍 Serveur Web de ${config.botName} sur le port ${PORT}`);
    });
    server.on('error', (err) => console.error('❌ Erreur serveur:', err.message));
};

module.exports = { startServer };
