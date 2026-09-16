// voice_studio/lib/tts.js — Wrapper edge-tts CLI (fichiers temporaires)
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const OUTPUT_DIR = path.join(__dirname, '..', 'tmp');
if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });

function check() {
    return new Promise((resolve) => {
        const p = spawn('edge-tts', ['--version']);
        p.on('close', (code) => resolve(code === 0));
        p.on('error', () => resolve(false));
    });
}

/**
 * Génère un fichier audio temporaire
 * @returns {Promise<{token, filename, path, size}>}
 */
function generate({ text, voice = 'fr-FR-HenriNeural', rate = '+0%', pitch = '+0Hz', volume = '+0%' }) {
    return new Promise((resolve, reject) => {
        if (!text || !text.trim()) return reject(new Error('Texte vide'));

        const token = crypto.randomBytes(16).toString('hex');
        const filename = `${token}.mp3`;
        const outputPath = path.join(OUTPUT_DIR, filename);

        const args = [
            '--text', text,
            '--voice', voice,
            '--rate', rate,
            '--pitch', pitch,
            '--volume', volume,
            '--write-media', outputPath
        ];

        const proc = spawn('edge-tts', args);
        let stderr = '';
        proc.stderr.on('data', (d) => (stderr += d.toString()));
        proc.on('error', (err) => reject(new Error(`edge-tts introuvable : ${err.message}`)));
        proc.on('close', (code) => {
            if (code !== 0) return reject(new Error(stderr.trim() || `edge-tts code ${code}`));
            if (!fs.existsSync(outputPath)) return reject(new Error('Fichier non généré'));
            const stat = fs.statSync(outputPath);
            resolve({ token, filename, path: outputPath, size: stat.size });
        });
    });
}

/**
 * Supprime un fichier par token
 */
function removeByToken(token) {
    try {
        const filename = `${String(token).replace(/[^a-f0-9]/gi, '')}.mp3`;
        const full = path.join(OUTPUT_DIR, filename);
        if (fs.existsSync(full)) fs.unlinkSync(full);
        return true;
    } catch { return false; }
}

/**
 * Nettoyage des fichiers > maxAgeMs (défaut 30 min)
 */
function cleanup(maxAgeMs = 30 * 60 * 1000) {
    try {
        const now = Date.now();
        let count = 0;
        fs.readdirSync(OUTPUT_DIR).forEach((f) => {
            const full = path.join(OUTPUT_DIR, f);
            try {
                const stat = fs.statSync(full);
                if (now - stat.mtimeMs > maxAgeMs) {
                    fs.unlinkSync(full);
                    count++;
                }
            } catch {}
        });
        if (count > 0) console.log(`🧹 ${count} fichier(s) audio supprimé(s)`);
    } catch {}
}

module.exports = { check, generate, removeByToken, cleanup, OUTPUT_DIR };
