// voice_studio/routes.js — API Voice Studio (Option C : temporaire)
const express = require('express');
const path = require('path');
const fs = require('fs');
const tts = require('./lib/tts');

const router = express.Router();

const VOICES = [
    'fr-FR-HenriNeural',
    'fr-FR-RemyMultilingualNeural',
    'fr-FR-DeniseNeural',
    'fr-FR-VivienneMultilingualNeural',
    'fr-FR-EloiseNeural'
];

// ─── GET /api/voice/status ───
router.get('/api/voice/status', async (req, res) => {
    const available = await tts.check();
    res.json({ available, voices: VOICES });
});

// ─── POST /api/voice/generer ───
router.post('/api/voice/generer', async (req, res) => {
    const { text, voice, rate, pitch, volume } = req.body || {};
    if (!text || !text.trim()) return res.status(400).json({ error: 'Texte vide' });

    const voiceName = VOICES.includes(voice) ? voice : 'fr-FR-HenriNeural';

    try {
        console.log(`🎙️  Génération: ${voiceName} (${text.length} chars)`);
        const result = await tts.generate({
            text: text.trim(),
            voice: voiceName,
            rate: rate || '+0%',
            pitch: pitch || '+0Hz',
            volume: volume || '+0%'
        });

        console.log(`✅ Audio: ${result.filename} (${(result.size / 1024).toFixed(1)} KB)`);
        res.json({
            ok: true,
            token: result.token,
            streamUrl: `/api/voice/stream?token=${result.token}`,
            downloadUrl: `/api/voice/download?token=${result.token}`,
            size: result.size
        });
    } catch (err) {
        console.error('❌ Erreur TTS:', err.message);
        res.status(500).json({ error: err.message });
    }
});

// ─── GET /api/voice/stream?token=... ───
router.get('/api/voice/stream', (req, res) => {
    const token = req.query.token;
    if (!token) return res.status(400).end('token manquant');

    const safe = String(token).replace(/[^a-f0-9]/gi, '');
    const filePath = path.join(tts.OUTPUT_DIR, `${safe}.mp3`);
    if (!fs.existsSync(filePath)) return res.status(404).end('Not found');

    const stat = fs.statSync(filePath);
    const range = req.headers.range;

    if (range) {
        const m = /bytes=(\d*)-(\d*)/.exec(range);
        const start = m[1] ? parseInt(m[1]) : 0;
        const end = m[2] ? parseInt(m[2]) : stat.size - 1;
        res.writeHead(206, {
            'Content-Range': `bytes ${start}-${end}/${stat.size}`,
            'Accept-Ranges': 'bytes',
            'Content-Length': end - start + 1,
            'Content-Type': 'audio/mpeg',
        });
        fs.createReadStream(filePath, { start, end }).pipe(res);
    } else {
        res.writeHead(200, {
            'Content-Length': stat.size,
            'Content-Type': 'audio/mpeg',
            'Accept-Ranges': 'bytes',
        });
        fs.createReadStream(filePath).pipe(res);
    }
});

// ─── GET /api/voice/download?token=... ───
router.get('/api/voice/download', (req, res) => {
    const token = req.query.token;
    if (!token) return res.status(400).end('token manquant');

    const safe = String(token).replace(/[^a-f0-9]/gi, '');
    const filePath = path.join(tts.OUTPUT_DIR, `${safe}.mp3`);
    if (!fs.existsSync(filePath)) return res.status(404).end('Not found');

    const stat = fs.statSync(filePath);
    const niceName = `marco_voice_${Date.now()}.mp3`;

    res.writeHead(200, {
        'Content-Length': stat.size,
        'Content-Type': 'audio/mpeg',
        'Content-Disposition': `attachment; filename="${niceName}"`,
    });
    fs.createReadStream(filePath).pipe(res);
});

// ─── DELETE /api/voice/:token ───
router.delete('/api/voice/:token', (req, res) => {
    const ok = tts.removeByToken(req.params.token);
    res.json({ ok });
});

// Nettoyage auto toutes les 5 minutes (fichiers > 30 min)
setInterval(() => tts.cleanup(30 * 60 * 1000), 5 * 60 * 1000);

module.exports = router;
