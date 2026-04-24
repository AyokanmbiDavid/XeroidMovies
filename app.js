document.addEventListener("DOMContentLoaded", () => {
    const $ = id => document.getElementById(id);
    
    const UI = {
        container: $('movie-container'),
        saveContainer: $('savelist-container'), // Matches your savelist.html
        loader: $('loader'),
        input: $('searchInput'),
        pageText: $('pageCounter'),
        next: $('nextBtn'),
        prev: $('prevBtn'),
        snack: $('snackbar'),
        snackText: $('snackText'),
        snackIcon: $('snackIcon')
    };

    let movies = [];
    let currentIndex = 0;

    // --- TOAST NOTIFICATION ---
    const showToast = (msg, icon = "info") => {
        if (!UI.snack) return;
        UI.snackText.innerText = msg;
        UI.snackIcon.innerText = icon;
        UI.snack.classList.add('show');
        setTimeout(() => UI.snack.classList.remove('show'), 3000);
    };

    // --- CORE FETCH ---
    const fetchShows = async (query = 'trending') => {
        if (!UI.container) return;
        UI.loader?.classList.remove('hidden');
        UI.container.innerHTML = '';
        try {
            const res = await fetch(`https://api.tvmaze.com/search/shows?q=${query}`);
            movies = await res.json();
            currentIndex = 0;
            renderDiscovery();
        } catch (e) {
            UI.container.innerHTML = `<p class="text-center p-10 text-red-500">Connection error.</p>`;
        } finally {
            UI.loader?.classList.add('hidden');
        }
    };

    // --- DISCOVERY RENDER (Home Page) ---
    const renderDiscovery = () => {
        if (!movies.length || !UI.container) return;

        const { show } = movies[currentIndex];
        const savelist = JSON.parse(localStorage.getItem('xeroid_savelist')) || [];
        const isSaved = savelist.some(m => m.id === show.id);
        const img = show.image ? show.image.original : 'https://via.placeholder.com/600x800';

        UI.container.innerHTML = `
            <div class="animate-hero">
                <div class="m3-card relative shadow-2xl shadow-blue-900/10 mb-8 overflow-hidden">
                    <img src="${img}" class="w-full aspect-[3/4] object-cover" onclick="location.href='movie-detail.html?id=${show.id}'">
                    <div class="absolute inset-0 pointer-events-none bg-gradient-to-t from-black/70 via-transparent to-transparent"></div>
                    
                    <button onclick="toggleSave(${show.id}, '${show.name.replace(/'/g, "\\'")}', '${img}', '${show.rating?.average || 'N/A'}')" 
                            class="absolute top-6 right-6 w-14 h-14 rounded-full ${isSaved ? 'bg-red-500 text-white' : 'bg-white/20 text-white'} backdrop-blur-xl flex items-center justify-center border border-white/30 active:scale-90 transition-all z-20 shadow-xl">
                        <span class="material-symbols-rounded" style="font-variation-settings: 'FILL' ${isSaved ? 1 : 0}">favorite</span>
                    </button>

                    <div class="absolute bottom-8 left-8 right-8 pointer-events-none">
                        <div class="flex gap-2 mb-2">
                             <span class="bg-blue-500 text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase">★ ${show.rating?.average || 'N/A'}</span>
                        </div>
                        <h2 class="text-3xl font-bold text-white tracking-tight">${show.name}</h2>
                    </div>
                </div>

                <div class="px-2">
                    <h3 class="text-xs font-bold text-[#0061A4] uppercase tracking-widest mb-3">Storyline</h3>
                    <p class="text-slate-600 leading-relaxed line-clamp-3 mb-6">
                        ${show.summary ? show.summary.replace(/<[^>]*>/g, '') : 'No summary available.'}
                    </p>
                    <button onclick="location.href='movie-detail.html?id=${show.id}'" class="w-full py-5 bg-[#1A1C1E] text-white rounded-[24px] font-bold flex items-center justify-center gap-2 active:scale-95 transition-all">
                        <span class="material-symbols-rounded">visibility</span> Details
                    </button>
                </div>
            </div>
        `;

        if (UI.pageText) UI.pageText.innerText = `${currentIndex + 1} / ${movies.length}`;
    };

    // --- SAVE LOGIC (Global Scope) ---
    window.toggleSave = (id, name, image, rating) => {
        let savelist = JSON.parse(localStorage.getItem('xeroid_savelist')) || [];
        const idx = savelist.findIndex(m => m.id === id);

        if (idx > -1) {
            savelist.splice(idx, 1);
            showToast("Removed from Library", "delete");
        } else {
            savelist.push({ id, name, image, rating });
            showToast("Added to Library", "auto_awesome");
        }
        localStorage.setItem('xeroid_savelist', JSON.stringify(savelist));
        
        // Re-render whichever page we are on
        if (UI.container) renderDiscovery();
        if (UI.saveContainer) renderSavelist();
    };

    // --- SAVELIST RENDER (Wishlist Page) ---
    const renderSavelist = () => {
        if (!UI.saveContainer) return;
        const savelist = JSON.parse(localStorage.getItem('xeroid_savelist')) || [];
        
        if (savelist.length === 0) {
            UI.saveContainer.innerHTML = `
                <div class="text-center py-20">
                    <span class="material-symbols-rounded text-6xl text-slate-200">folder_off</span>
                    <p class="text-slate-400 mt-4">Your library is empty</p>
                </div>`;
            return;
        }

        UI.saveContainer.innerHTML = savelist.map(m => `
            <div class="flex items-center p-4 bg-white rounded-[24px] border border-slate-100 mb-4 shadow-sm animate-hero">
                <img src="${m.image}" class="w-16 h-20 object-cover rounded-xl shadow-sm" onclick="location.href='movie-detail.html?id=${m.id}'">
                <div class="ml-4 flex-1">
                    <h3 class="font-bold text-[#1A1C1E] line-clamp-1">${m.name}</h3>
                    <p class="text-blue-600 text-xs font-bold">★ ${m.rating}</p>
                </div>
                <button onclick="toggleSave(${m.id})" class="p-3 text-red-400 hover:bg-red-50 rounded-full transition-all">
                    <span class="material-symbols-rounded">delete</span>
                </button>
            </div>
        `).join('');
    };

    // --- EVENTS ---
    if (UI.input) {
        UI.input.onkeypress = (e) => { if(e.key === 'Enter') fetchShows(UI.input.value); };
    }
    if (UI.next) {
        UI.next.onclick = () => { if(currentIndex < movies.length - 1) { currentIndex++; renderDiscovery(); window.scrollTo(0,0); }};
    }
    if (UI.prev) {
        UI.prev.onclick = () => { if(currentIndex > 0) { currentIndex--; renderDiscovery(); window.scrollTo(0,0); }};
    }

    // Initialize
    if (UI.container) fetchShows('cyberpunk');
    if (UI.saveContainer) renderSavelist();
});
