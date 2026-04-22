document.addEventListener("DOMContentLoaded", () => {
    // --- API CONFIGURATION ---
    const CONFIG = {
        API_KEY: '7fb7b13fbffda051a422ea2b8e0004e5',
        ACCESS_TOKEN: 'eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiI3ZmI3YjEzZmJmZmRhMDUxYTQyMmVhMmI4ZTAwMDRlNSIsIm5iZiI6MTczNjI0MDU4Ni42OCwic3ViIjoiNjc3Y2VkY2FlYzUxNzkxZGZlNjZhYjlkIiwic2NvcGVzIjpbImFwaV9yZWFkIl0sInZlcnNpb24iOjF9.MzchRDLW4-gnT2--YCjwVSFE_XkJ8TDKi9_LusWbgrE',
        BASE_URL: 'https://api.themoviedb.org/3',
        IMG_URL: 'https://image.tmdb.org/t/p/w500',
        BG_URL: 'https://image.tmdb.org/t/p/original'
    };

    const requestOptions = {
        method: 'GET',
        headers: {
            accept: 'application/json',
            Authorization: `Bearer ${CONFIG.ACCESS_TOKEN}`
        }
    };

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

    // --- HOME / DISCOVERY PAGE ---
    if (UI.container) {
        async function fetchMovies(query = '') {
            try {
                UI.loader?.classList.remove('hidden');
                UI.container.innerHTML = '';
                const url = query 
                    ? `${CONFIG.BASE_URL}/search/movie?query=${encodeURIComponent(query)}`
                    : `${CONFIG.BASE_URL}/movie/popular`;

                const res = await fetch(url, requestOptions);
                const data = await res.json();
                movies = data.results || [];
                currentIndex = 0;
                updateDisplay();
            } catch (error) {
                UI.container.innerHTML = `<p class="text-center text-red-400">Failed to load movies.</p>`;
            } finally {
                UI.loader?.classList.add('hidden');
            }
        }

        function updateDisplay() {
            if (!movies.length) return;
            const item = movies[currentIndex];
            const wishlist = JSON.parse(localStorage.getItem('xeroid_wishlist')) || [];
            const isSaved = wishlist.some(m => m.id === item.id);
            const poster = item.poster_path ? CONFIG.IMG_URL + item.poster_path : 'https://via.placeholder.com/600x800?text=No+Image';

            UI.container.innerHTML = `
                <div class="animate-fade-in px-2 pb-32">
                    <div class="relative rounded-[2.5rem] overflow-hidden shadow-2xl aspect-[2/3] mb-8 bg-gray-200 cursor-pointer" onclick="window.location.href='movie-detail.html?id=${item.id}'">
                        <img src="${poster}" class="w-full h-full object-cover">
                        <div class="absolute top-5 right-5" onclick="event.stopPropagation()">
                            <button id="saveBtn" class="w-12 h-12 rounded-full ${isSaved ? 'bg-red-500 text-white' : 'bg-white/20 text-white'} backdrop-blur-md flex items-center justify-center border border-white/20 shadow-lg active:scale-90 transition-all">
                                <i class="fa-solid fa-heart"></i>
                            </button>
                        </div>
                    </div>
                    <h2 class="text-3xl font-bold mb-3 text-gray-900 tracking-tight leading-tight">${item.title}</h2>
                    <div class="flex gap-2 mb-6">
                        <span class="bg-blue-100 text-blue-700 text-[10px] px-3 py-1 rounded-full font-bold">★ ${item.vote_average.toFixed(1)}</span>
                        <span class="bg-gray-100 text-gray-600 text-[10px] px-3 py-1 rounded-full font-medium">${item.release_date?.split('-')[0] || 'N/A'}</span>
                    </div>
                </div>`;

            document.getElementById('saveBtn').onclick = () => {
                let wl = JSON.parse(localStorage.getItem('xeroid_wishlist')) || [];
                const idx = wl.findIndex(m => m.id === item.id);
                if (idx > -1) {
                    wl.splice(idx, 1);
                    showToast('Removed from Wishlist', 'fa-heart-crack', 'text-red-400');
                } else {
                    wl.push({id: item.id, name: item.title, image: poster, rating: item.vote_average.toFixed(1)});
                    showToast('Added to Wishlist!', 'fa-heart', 'text-red-500');
                }
                localStorage.setItem('xeroid_wishlist', JSON.stringify(wl));
                updateDisplay();
            };
            if(UI.pageText) UI.pageText.textContent = currentIndex + 1;
        }

        UI.btn?.addEventListener('click', () => fetchMovies(UI.input.value));
        UI.input?.addEventListener('keypress', (e) => { if (e.key === 'Enter') fetchMovies(UI.input.value); });
        UI.nextBtn?.addEventListener('click', () => { if(currentIndex < movies.length - 1) { currentIndex++; updateDisplay(); }});
        UI.prevBtn?.addEventListener('click', () => { if(currentIndex > 0) { currentIndex--; updateDisplay(); }});
        fetchMovies();
    }

    // --- ENHANCED MOVIE DETAILS PAGE ---
    if (UI.detailContainer) {
        const movieId = new URLSearchParams(window.location.search).get('id');
        if (!movieId) window.location.href = 'index.html';

        async function loadDetails() {
            try {
                const res = await fetch(`${CONFIG.BASE_URL}/movie/${movieId}?append_to_response=videos,credits`, requestOptions);
                const item = await res.json();
                
                const trailer = item.videos.results.find(v => v.type === 'Trailer' && v.site === 'YouTube');
                const backdrop = item.backdrop_path ? CONFIG.BG_URL + item.backdrop_path : (item.poster_path ? CONFIG.IMG_URL + item.poster_path : '');
                const formatter = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });

                document.getElementById('detail-bg').style.backgroundImage = `url(${backdrop})`;

                UI.detailContainer.innerHTML = `
                    <div class="animate-fade-in space-y-8">
                        <div class="relative w-full aspect-video rounded-[2.5rem] overflow-hidden shadow-2xl border-4 border-white bg-black">
                            ${trailer 
                                ? `<iframe class="w-full h-full" src="https://www.youtube.com/embed/${trailer.key}?autoplay=1&mute=1" frameborder="0" allowfullscreen></iframe>`
                                : `<img src="${backdrop}" class="w-full h-full object-cover opacity-60">`
                            }
                        </div>

                        <div class="text-center">
                            <h1 class="text-4xl font-bold text-gray-900 mb-2 tracking-tight">${item.title}</h1>
                            <p class="text-blue-500 italic text-sm mb-4">"${item.tagline || ''}"</p>
                            <div class="flex flex-wrap justify-center gap-2 mb-6">
                                ${item.genres.map(g => `<span class="text-[10px] font-bold px-3 py-1 bg-white border border-gray-100 rounded-full text-gray-500 uppercase shadow-sm">${g.name}</span>`).join('')}
                            </div>
                        </div>

                        <div class="grid grid-cols-3 gap-3">
                            <div class="glass-card-light rounded-3xl p-4 text-center">
                                <p class="text-[10px] font-bold text-gray-400 uppercase mb-1">Score</p>
                                <p class="text-blue-600 font-bold">★ ${item.vote_average.toFixed(1)}</p>
                            </div>
                            <div class="glass-card-light rounded-3xl p-4 text-center">
                                <p class="text-[10px] font-bold text-gray-400 uppercase mb-1">Runtime</p>
                                <p class="text-gray-900 font-bold">${item.runtime}m</p>
                            </div>
                            <div class="glass-card-light rounded-3xl p-4 text-center">
                                <p class="text-[10px] font-bold text-gray-400 uppercase mb-1">Status</p>
                                <p class="text-gray-900 font-bold text-[10px]">${item.status}</p>
                            </div>
                        </div>

                        <div class="glass-card-light rounded-[2.5rem] p-6 space-y-4">
                            <div class="flex justify-between items-center border-b border-gray-100 pb-3">
                                <span class="text-xs font-bold text-gray-400 uppercase">Budget</span>
                                <span class="text-sm font-bold text-gray-800">${item.budget > 0 ? formatter.format(item.budget) : 'N/A'}</span>
                            </div>
                            <div class="flex justify-between items-center border-b border-gray-100 pb-3">
                                <span class="text-xs font-bold text-gray-400 uppercase">Revenue</span>
                                <span class="text-sm font-bold text-green-600">${item.revenue > 0 ? formatter.format(item.revenue) : 'N/A'}</span>
                            </div>
                            <div class="flex justify-between items-center">
                                <span class="text-xs font-bold text-gray-400 uppercase">Release</span>
                                <span class="text-sm font-bold text-gray-800">${item.release_date}</span>
                            </div>
                        </div>

                        <div class="glass-card-light rounded-[2.5rem] p-8">
                            <h3 class="text-xs font-bold text-blue-600 uppercase tracking-widest mb-4">Storyline</h3>
                            <p class="text-gray-600 text-sm leading-relaxed font-medium">${item.overview || 'No overview available.'}</p>
                        </div>

                        <div class="px-2">
                            <h3 class="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Produced By</h3>
                            <div class="flex flex-wrap gap-2">
                                ${item.production_companies.map(co => `<span class="bg-gray-100 text-gray-600 text-[10px] px-3 py-1.5 rounded-lg font-bold">${co.name}</span>`).join('')}
                            </div>
                        </div>

                        <div class="pb-10">
                            <h3 class="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4 ml-2">Top Cast</h3>
                            <div class="flex gap-4 overflow-x-auto no-scrollbar pb-4">
                                ${item.credits.cast.slice(0, 12).map(c => `
                                    <div class="flex-shrink-0 w-20 text-center">
                                        <img src="${c.profile_path ? CONFIG.IMG_URL + c.profile_path : 'https://via.placeholder.com/100'}" class="w-16 h-16 rounded-full object-cover mx-auto mb-2 border-2 border-white shadow-md">
                                        <p class="text-[9px] font-bold text-gray-800 truncate">${c.name}</p>
                                        <p class="text-[8px] text-gray-400 truncate">${c.character}</p>
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                    </div>`;

                const detailSaveBtn = document.getElementById('detailSaveBtn');
                const updateDetailBtn = () => {
                    const wl = JSON.parse(localStorage.getItem('xeroid_wishlist')) || [];
                    detailSaveBtn.innerHTML = wl.some(m => m.id == movieId) ? '<i class="fa-solid fa-heart text-red-500"></i>' : '<i class="fa-solid fa-heart text-gray-800"></i>';
                };
                updateDetailBtn();

                detailSaveBtn.onclick = () => {
                    let wl = JSON.parse(localStorage.getItem('xeroid_wishlist')) || [];
                    const idx = wl.findIndex(m => m.id == movieId);
                    if (idx > -1) {
                        wl.splice(idx, 1);
                        showToast('Removed', 'fa-heart-crack', 'text-red-500');
                    } else {
                        wl.push({id: item.id, name: item.title, image: CONFIG.IMG_URL + item.poster_path, rating: item.vote_average.toFixed(1)});
                        showToast('Saved!', 'fa-heart', 'text-red-500');
                    }
                    localStorage.setItem('xeroid_wishlist', JSON.stringify(wl));
                    updateDetailBtn();
                };
            } catch (error) { UI.detailContainer.innerHTML = "<p class='text-center py-20 text-red-500'>Error loading details.</p>"; }
        }
        loadDetails();
    }

    // --- WISHLIST PAGE ---
    if (UI.saveContainer) {
        function renderWishlist() {
            const wishlist = JSON.parse(localStorage.getItem('xeroid_wishlist')) || [];
            if (!wishlist.length) { UI.saveContainer.innerHTML = "<p class='text-center text-gray-400 py-20'>Wishlist is empty.</p>"; return; }
            UI.saveContainer.innerHTML = wishlist.map(movie => `
                <div class="animate-fade-in relative px-2">
                    <div class="relative rounded-[2.5rem] overflow-hidden shadow-2xl aspect-[2/3] mb-4 cursor-pointer" onclick="window.location.href='movie-detail.html?id=${movie.id}'">
                        <img src="${movie.image}" class="w-full h-full object-cover">
                        <button onclick="event.stopPropagation(); removeMovie(${movie.id})" class="absolute top-5 right-5 w-12 h-12 rounded-full bg-red-500 text-white flex items-center justify-center shadow-lg active:scale-90"><i class="fa-solid fa-trash-can"></i></button>
                    </div>
                    <div class="px-2">
                        <h2 class="text-2xl font-bold text-gray-900 mb-2">${movie.name}</h2>
                        <span class="bg-blue-100 text-blue-700 text-[10px] px-3 py-1 rounded-full font-bold">★ ${movie.rating}</span>
                    </div>
                </div>`).join('');
        }
        window.removeMovie = (id) => {
            let wl = JSON.parse(localStorage.getItem('xeroid_wishlist')) || [];
            localStorage.setItem('xeroid_wishlist', JSON.stringify(wl.filter(m => m.id !== id)));
            showToast('Removed Movie', 'fa-trash', 'text-red-400');
            renderWishlist();
        };
        renderWishlist();
    }
});
