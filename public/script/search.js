export default function initSearch(container, controlsContainer) {
    container.innerHTML = `
        <div style="max-width:500px; margin:0 auto;">
            <div style="display:flex; gap:10px; margin-bottom:16px;">
                <input type="text" id="searchInput" placeholder="Posez une question..." style="flex:1; padding:14px 18px; border-radius:12px; border:1.5px solid var(--border); background:var(--surface); color:var(--text); font-size:0.95rem; outline:none; font-family:inherit;">
                <button id="searchBtn" style="padding:14px 22px; border-radius:12px; background:linear-gradient(135deg, var(--primary), var(--primary-dark)); color:#fff; border:none; font-weight:700; cursor:pointer; font-size:1rem; display:flex; align-items:center; gap:6px;">
                    <i class="fas fa-search"></i>
                </button>
            </div>
            <div style="display:flex; gap:8px; flex-wrap:wrap; margin-bottom:18px;">
                <button class="search-ex" style="padding:7px 14px; border-radius:20px; background:var(--surface-alt); border:1px solid var(--border); color:var(--text-soft); font-size:0.8rem; font-weight:600; cursor:pointer; font-family:inherit;">Qui a inventé le téléphone ?</button>
                <button class="search-ex" style="padding:7px 14px; border-radius:20px; background:var(--surface-alt); border:1px solid var(--border); color:var(--text-soft); font-size:0.8rem; font-weight:600; cursor:pointer; font-family:inherit;">Capitale du Japon</button>
                <button class="search-ex" style="padding:7px 14px; border-radius:20px; background:var(--surface-alt); border:1px solid var(--border); color:var(--text-soft); font-size:0.8rem; font-weight:600; cursor:pointer; font-family:inherit;">Qu'est-ce que l'IA ?</button>
            </div>
            <div id="searchResult"></div>
        </div>
    `;
    controlsContainer.innerHTML = '';

    const input = document.getElementById('searchInput');
    const btn = document.getElementById('searchBtn');
    const result = document.getElementById('searchResult');

    document.querySelectorAll('.search-ex').forEach(b => {
        b.addEventListener('click', () => { input.value = b.textContent; doSearch(); });
    });

    async function doSearch() {
        const q = input.value.trim();
        if (!q) return;
        btn.disabled = true;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';

        result.innerHTML = `
            <div style="background:var(--surface-alt); border-radius:14px; padding:24px; text-align:center;">
                <div style="display:inline-block; width:32px; height:32px; border:3px solid var(--border); border-top-color:var(--primary); border-radius:50%; animation:spin 0.8s linear infinite;"></div>
                <p style="margin-top:12px; color:var(--text-soft); font-size:0.9rem;">Recherche en cours...</p>
            </div>
        `;

        try {
            const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
            const data = await res.json();

            if (data.error) throw new Error(data.error);

            result.innerHTML = `
                <div style="background:var(--surface); border:1px solid var(--border); border-radius:14px; padding:22px; animation:fadeIn 0.3s;">
                    <h3 style="font-size:1.1rem; font-weight:800; color:var(--primary); margin-bottom:14px; display:flex; align-items:center; gap:8px;">
                        <i class="fas fa-lightbulb"></i> ${escapeHtml(data.title || 'Résultat')}
                    </h3>
                    <p style="font-size:0.95rem; line-height:1.7; color:var(--text-soft); white-space:pre-wrap;">${escapeHtml(data.snippet || 'Aucun détail')}</p>
                    ${data.link ? `<a href="${escapeHtml(data.link)}" target="_blank" rel="noopener" style="display:inline-flex; align-items:center; gap:6px; margin-top:14px; color:var(--primary); text-decoration:none; font-weight:600; font-size:0.9rem;">En savoir plus <i class="fas fa-arrow-right"></i></a>` : ''}
                </div>
            `;
        } catch (err) {
            result.innerHTML = `
                <div style="background:rgba(239,68,68,0.08); border:1px solid rgba(239,68,68,0.2); border-radius:14px; padding:18px; color:var(--danger); text-align:center;">
                    <i class="fas fa-exclamation-circle"></i> ${escapeHtml(err.message)}
                </div>
            `;
        } finally {
            btn.disabled = false;
            btn.innerHTML = '<i class="fas fa-search"></i>';
        }
    }

    function escapeHtml(t) {
        const d = document.createElement('div');
        d.textContent = t ?? '';
        return d.innerHTML;
    }

    btn.addEventListener('click', doSearch);
    input.addEventListener('keypress', (e) => { if (e.key === 'Enter') doSearch(); });

    return { stop() {} };
}
