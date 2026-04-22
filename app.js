document.addEventListener("DOMContentLoaded", () => {
    const UI = {
        input: document.getElementById('searchInput'),
        btn: document.getElementById('searchBtn'),
        loader: document.getElementById('loader'),
        container: document.getElementById('movie-container'),
        saveContainer: document.getElementById('savelist-container'),
        detailContainer: document.getElementById('movie-detail-container'),
        pageText: document.getElementById('pagenumber'),
        nextBtn: document.getElementById('pagenext'),
        prevBtn: document.getElementById('pageprevious'),
        toast: document.getElementById('toast'),
        toastIcon: document.getElementById('toastIcon'),
        toastMessage: document.getElementById('toastMessage')
    };

    let movies = [];
    let currentIndex = 0;

    const showToast = (msg, icon, color = "text-green-400") => {
        if (!UI.toast) return;
        UI.toastMessage.textContent = msg;
        UI.toastIcon.className = `fa-solid ${icon} ${color}`;
        UI.toast.classList.add('toast-visible');
        UI.toast.classList.remove('toast-hidden');
        setTimeout(() => {
            UI.toast.classList.remove('toast-visible');
            UI.toast.classList.add('toast-hidden');
        }, 2500);
    };

    // --- HOME PAGE LOGIC ---
    if (UI.container) {
        const searchMovies = async (query) => {
            if (!query) return;
            UI.loader?.classList.remove('hidden');
            UI.container.innerHTML = "";
            try {
                const res = await fetch(`https://api.tvmaze.com/search/shows?q=${encodeURIComponent(query)}`);
                movies = await res.json();
                currentIndex = 0;
                updateUI();
            } catch (err) { UI.container.innerHTML = "<p class='text-center mt-10'>API Error. Check connection.</p>"; }
            UI.loader?.classList.add('hidden');
        };

        const updateUI = () => {
            if (movies.length === 0) return;
            const item = movies[currentIndex].show;
            const wishlist = JSON.parse(localStorage.getItem('xeroid_wishlist')) || [];
            const isSaved = wishlist.find(m => m.id === item.id);
            const poster = item.image ? item.image.original : 'https://via.placeholder.com/600x800?text=No+Image';

            UI.container.innerHTML = `
                <div class="animate-fade-in px-2 pb-32">
                    <div class="relative rounded-[2.5rem] overflow-hidden shadow-2xl aspect-[2/3] mb-8 bg-gray-200 cursor-pointer group" onclick="window.location.href='movie-detail.html?id=${item.id}'">
                        <img src="${poster}" class="w-full h-full object-cover">
                        <div class="absolute top-5 right-5 flex flex-col gap-3" onclick="event.stopPropagation()">
                            <button id="saveBtn" class="w-12 h-12 rounded-full ${isSaved ? 'bg-red-500 text-white' : 'bg-white/20 text-white'} backdrop-blur-md flex items-center justify-center border border-white/20 shadow-lg active:scale-90 transition-all"><i class="fa-solid fa-heart"></i></button>
                        </div>
                    </div>
                    <h2 class="text-3xl font-bold mb-3 text-gray-900 tracking-tight leading-tight">${item.name}</h2>
                    <div class="flex gap-2 mb-6">
                        <span class="bg-blue-100 text-blue-700 text-[10px] px-3 py-1 rounded-full font-bold">★ ${item.rating?.average || 'N/A'}</span>
                        <span class="bg-gray-100 text-gray-600 text-[10px] px-3 py-1 rounded-full font-medium">#${item.genres[0] || 'Show'}</span>
                    </div>
                </div>`;

            document.getElementById('saveBtn').onclick = () => {
                let wl = JSON.parse(localStorage.getItem('xeroid_wishlist')) || [];
                const idx = wl.findIndex(m => m.id === item.id);
                if (idx > -1) { wl.splice(idx, 1); showToast('Removed', 'fa-heart-crack', 'text-red-400'); } 
                else { wl.push({id: item.id, name: item.name, image: poster, rating: item.rating?.average || 'N/A'}); showToast('Saved!', 'fa-heart', 'text-red-500'); }
                localStorage.setItem('xeroid_wishlist', JSON.stringify(wl));
                updateUI();
            };
            if(UI.pageText) UI.pageText.textContent = currentIndex + 1;
        };

        UI.btn?.addEventListener('click', () => searchMovies(UI.input.value));
        UI.nextBtn?.addEventListener('click', () => { if(currentIndex < movies.length-1){ currentIndex++; updateUI(); }});
        UI.prevBtn?.addEventListener('click', () => { if(currentIndex > 0){ currentIndex--; updateUI(); }});
        searchMovies('trending');
    }

    // --- DETAIL PAGE LOGIC ---
    if (UI.detailContainer) {
        const movieId = new URLSearchParams(window.location.search).get('id');
        if (!movieId) { window.location.href = 'index.html'; return; }

        const loadDetail = async () => {
            try {
                const res = await fetch(`https://api.tvmaze.com/shows/${movieId}`);
                const item = await res.json();
                const poster = item.image ? item.image.original : 'https://via.placeholder.com/800';
                document.getElementById('detail-bg').style.backgroundImage = `url(${poster})`;

                UI.detailContainer.innerHTML = `
                    <div class="animate-fade-in space-y-10">
                        <div class="relative w-full aspect-video rounded-[2.5rem] overflow-hidden shadow-2xl border-4 border-white">
                            <iframe id="ytPlayer" class="w-full h-full" src="https://www.youtube.com/embed?listType=search&list=${encodeURIComponent(item.name + ' trailer')}&autoplay=1&enablejsapi=1&controls=0" frameborder="0"></iframe>
                        </div>
                        <div class="text-center">
                            <h1 class="text-4xl font-bold text-gray-900 mb-4 tracking-tight leading-tight">${item.name}</h1>
                            <div class="inline-flex items-center gap-2 bg-blue-600 text-white px-5 py-2 rounded-full shadow-lg shadow-blue-200">
                                <i class="fa-solid fa-star text-xs"></i><span class="font-bold text-sm">${item.rating?.average || 'N/A'} Rating</span>
                            </div>
                        </div>
                        <div class="grid grid-cols-3 gap-3">
                            <div class="glass-card-light rounded-3xl p-4 text-center">
                                <p class="text-[10px] uppercase text-gray-400 font-bold mb-1 tracking-widest">Year</p>
                                <p class="text-gray-900 font-bold">${item.premiered?.substring(0,4) || 'N/A'}</p>
                            </div>
                            <div class="glass-card-light rounded-3xl p-4 text-center">
                                <p class="text-[10px] uppercase text-gray-400 font-bold mb-1 tracking-widest">Time</p>
                                <p class="text-gray-900 font-bold">${item.runtime || '??'}m</p>
                            </div>
                            <div class="glass-card-light rounded-3xl p-4 text-center">
                                <p class="text-[10px] uppercase text-gray-400 font-bold mb-1 tracking-widest">Lang</p>
                                <p class="text-gray-900 font-bold uppercase">${item.language?.substring(0,3) || 'EN'}</p>
                            </div>
                        </div>
                        <div class="glass-card-light rounded-[2.5rem] p-8">
                            <h3 class="text-xs font-bold text-blue-600 uppercase tracking-widest mb-4">Storyline</h3>
                            <div class="text-gray-600 leading-relaxed text-sm font-medium">${item.summary || 'No description.'}</div>
                        </div>
                    </div>`;

                const saveBtn = document.getElementById('detailSaveBtn');
                let wl = JSON.parse(localStorage.getItem('xeroid_wishlist')) || [];
                if (wl.find(m => m.id == movieId)) saveBtn.innerHTML = '<i class="fa-solid fa-heart text-red-500"></i>';

                saveBtn.onclick = () => {
                    let wl = JSON.parse(localStorage.getItem('xeroid_wishlist')) || [];
                    const idx = wl.findIndex(m => m.id == movieId);
                    if (idx > -1) { wl.splice(idx, 1); saveBtn.innerHTML = '<i class="fa-solid fa-heart text-gray-800"></i>'; showToast('Removed', 'fa-heart-crack', 'text-red-500'); }
                    else { wl.push({id: item.id, name: item.name, image: poster, rating: item.rating?.average || 'N/A'}); saveBtn.innerHTML = '<i class="fa-solid fa-heart text-red-500"></i>'; showToast('Saved!', 'fa-heart', 'text-red-500'); }
                    localStorage.setItem('xeroid_wishlist', JSON.stringify(wl));
                };
            } catch (err) { UI.detailContainer.innerHTML = "<p class='text-center py-20'>Failed to load.</p>"; }
        };
        loadDetail();
    }

    // --- WISHLIST LOGIC ---
    if (UI.saveContainer) {
        const loadSaved = () => {
            const saved = JSON.parse(localStorage.getItem('xeroid_wishlist')) || [];
            if (saved.length === 0) { UI.saveContainer.innerHTML = "<p class='text-center text-gray-400 py-20'>Your wishlist is empty.</p>"; return; }
            UI.saveContainer.innerHTML = saved.map(show => `
                <div class="animate-fade-in px-2 relative">
                    <div class="relative rounded-[2.5rem] overflow-hidden shadow-2xl aspect-[2/3] mb-4 bg-gray-200 cursor-pointer" onclick="window.location.href='movie-detail.html?id=${show.id}'">
                        <img src="${show.image}" class="w-full h-full object-cover">
                        <button onclick="event.stopPropagation(); window.removeShow(${show.id})" class="absolute top-5 right-5 w-12 h-12 rounded-full bg-red-500/90 text-white backdrop-blur-md flex items-center justify-center border border-white/20 active:scale-90 z-10"><i class="fa-solid fa-trash-can"></i></button>
                    </div>
                    <div class="px-2">
                        <h2 class="text-2xl font-bold text-gray-900 mb-2">${show.name}</h2>
                        <span class="bg-blue-100 text-blue-700 text-[10px] px-3 py-1 rounded-full font-bold inline-block">★ ${show.rating}</span>
                    </div>
                </div>`).join('');
        };
        window.removeShow = (id) => {
            let wl = JSON.parse(localStorage.getItem('xeroid_wishlist')) || [];
            localStorage.setItem('xeroid_wishlist', JSON.stringify(wl.filter(m => m.id !== id)));
            showToast('Removed', 'fa-trash', 'text-red-400');
            loadSaved();
        };
        loadSaved();
    }
});
