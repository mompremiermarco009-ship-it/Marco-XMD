export default function initSearch(container, controlsContainer) {
    container.innerHTML = `
        <div style="margin-bottom:10px;">
            <input type="text" id="searchQuery" placeholder="Entrez votre question..." style="width:100%; padding:10px; border-radius:6px; border:1px solid #ccc; font-size:14px;">
        </div>
        <button id="btnSearch" style="padding:10px 20px; background:#007bff; color:#fff; border:none; border-radius:6px; cursor:pointer;">Rechercher</button>
        <div id="searchResult" style="margin-top:15px; text-align:left;"></div>
    `;
    controlsContainer.innerHTML = '';

    const input = document.getElementById('searchQuery');
    const btn = document.getElementById('btnSearch');
    const result = document.getElementById('searchResult');

    btn.addEventListener('click', async () => {
        const q = input.value.trim();
        if (!q) return;
        btn.disabled = true;
        btn.textContent = 'Recherche...';
        result.innerHTML = '<p>Chargement...</p>';
        try {
            const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
            const data = await res.json();
            if (data.error) {
                result.innerHTML = `<p style="color:red;">${data.error}</p>`;
            } else {
                result.innerHTML = `
                    <h4 style="margin:0 0 5px;">${data.title}</h4>
                    <p>${data.snippet}</p>
                    ${data.link ? `<a href="${data.link}" target="_blank">En savoir plus</a>` : ''}
                `;
            }
        } catch (e) {
            result.innerHTML = '<p style="color:red;">Erreur réseau.</p>';
        } finally {
            btn.disabled = false;
            btn.textContent = 'Rechercher';
        }
    });

    return { stop() {} };
}
