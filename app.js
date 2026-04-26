document.addEventListener("DOMContentLoaded", () => {
    const $ = id => document.getElementById(id);
    
    const UI = {
        container: $('movie-container'),
        saveContainer: $('savelist-container'),
        loader: $('loader'),
        input: $('searchInput'),
        pageText: $('pageCounter'),
        next: $('nextBtn'),
        prev: $('prevBtn'),
        refresh: $('refreshBtn'), // Make sure this ID exists in your HTML
        snack: $('snackbar'),
        snackText: $('snackText'),
        snackIcon: $('snackIcon'),
        cancelBtn: $('cancelBtn'),
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

    // --- CORE FETCH WITH CACHING & OFFLINE LOGIC ---
    const fetchShows = async (query = 'trending', isRefresh = false) => {
        if (!UI.container) return;
        UI.loader?.classList.remove('hidden');
        UI.container.innerHTML = '';
        
        // Caching logic
        const cacheKey = `xeroid_cache_${query}`;
        
        if (!navigator.onLine) {
            const cachedData = localStorage.getItem(cacheKey);
            if (cachedData) {
                movies = JSON.parse(cachedData);
                currentIndex = 0;
                renderDiscovery();
                showToast("Offline: Loaded from cache", "cloud_done");
                UI.loader?.classList.add('hidden');
                return;
            } else {
                UI.container.innerHTML = `
                    <div class="text-center py-20 animate-hero">
                        <span class="material-symbols-rounded text-6xl text-slate-300">wifi_off</span>
                        <p class="text-slate-500 mt-4 font-bold">No internet and no cache found.</p>
                        <button onclick="location.reload()" class="mt-4 text-blue-600 font-bold flex items-center gap-2 mx-auto">
                            <span class="material-symbols-rounded">refresh</span> Retry
                        </button>
                    </div>`;
                UI.loader?.classList.add('hidden');
                return;
            }
        }

        try {
            const res = await fetch(`https://api.tvmaze.com/search/shows?q=${query}`);
            movies = await res.json();
            
            // Save to cache if result is successful
            if (movies.length > 0) {
                localStorage.setItem(cacheKey, JSON.stringify(movies));
                localStorage.setItem('last_query', query); // Remember search for refresh
            }
            
            currentIndex = 0;
            renderDiscovery();
            if (isRefresh) showToast("Feed refreshed", "refresh");
        } catch (e) {
            UI.container.innerHTML = `
                <div class="text-center py-20">
                    <span class="material-symbols-rounded text-6xl text-red-300">error</span>
                    <p class="text-slate-500 mt-4">Connection error.</p>
                </div>`;
        } finally {
            UI.loader?.classList.add('hidden');
        }
    };

    // --- DISCOVERY RENDER (Home Page) ---
    const renderDiscovery = () => {
        if (!movies.length || !UI.container) return;

        const step = window.innerWidth >= 1024 ? 3 : 1;
        const currentBatch = movies.slice(currentIndex, currentIndex + step);
        const savelist = JSON.parse(localStorage.getItem('xeroid_savelist')) || [];

        UI.container.innerHTML = currentBatch.map(m => {
            const { show } = m;
            const isSaved = savelist.some(item => item.id === show.id);
            
            // Broken image replacement
            const img = show.image ? show.image.original : 'https://placeholder.com';

            return `
                <div class="animate-hero flex flex-col h-full">
                    <div class="m3-card relative shadow-2xl shadow-blue-900/10 mb-8 overflow-hidden group cursor-pointer">
                        <img src="${img}" class="w-full aspect-[3/4] object-cover group-hover:scale-105 transition-transform duration-500" 
                             onerror="this.src='data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wCEAAkGBwgHBgkIBwgKCgkLDRYPDQwMDRsUFRAWIB0iIiAdHx8kKDQsJCYxJx8fLT0tMTU3Ojo6Iys/RD84QzQ5OjcBCgoKDQwNGg8PGjclHyU3Nzc3Nzc3Nzc3Nzc3Nzc3Nzc3Nzc3Nzc3Nzc3Nzc3Nzc3Nzc3Nzc3Nzc3Nzc3Nzc3N//AABEIAJQAlAMBIgACEQEDEQH/xAAbAAEBAQEBAQEBAAAAAAAAAAAAAQQDBQIGB//EADYQAAICAQEFBwEHAwUBAAAAAAABAgMEEQUSITFRExQzQVRzkSIjQlNhcZLRUmKicpOh4fEV/8QAFAEBAAAAAAAAAAAAAAAAAAAAAP/EABQRAQAAAAAAAAAAAAAAAAAAAAD/2gAMAwEAAhEDEQA/AP7iAgBAUAQFAEBSAAUAQpABQQAUEAFBABQQAUAAAAAAAAAAAAAAAAA+JWQjOMJSSlLkm+YH2AAAAAAAAAAICgCcimPad1lNVbqkoylYo6tanx2W0fVVfs/6A3g81LNct1ZtDl03UffZbQ9VV+wDeQwqraL5ZVX7B2O0fU1fsA3k1MPY7R9VV/tnO23KxXF3Xxsb4RrhBayYGrMyo40OW9ZLhGC5tnLDxZKfeMl718v8V0RyrxMl/bucFky5uS13F0QsnmY9tCsvhKM5qOigB6YIUCAACggAoAAAADBtfwqfeidNp2SrwrZQ4PgtemrOe1/Cp96JtnCM4SjNaxfBoD8n566v9T1bs2S2ZUm/tbE0/wBNdNTrPZONBucrJ7i4teWh5WTb21rlppHlFdEB7GxsntKexk/rrXD/AEnon5bGvlj3xtj5c11XQ96/NrrpjOP1SsX2cFzYH1mZUcaC4b1kuEYLm2csPFkp94yXvXS/xXQuHiyU3kZL3r5fEF0RsApg2l4uJ7qN5g2n4uJ7qA3gAAAAAAAiKAAAAGDa/hU+9E3mDa/hU+9E132xoqlZPlFfIHm7aydIKiD4y4y/ToeOfVtkrbJWWPWUnqdaao7qsti2m/oguc3/AAApqSirLU2m9IQ85v8Ag9HZ/Z97atalkbuq/ph/ajHfa6nLWSeQ1o5R5VrojLXOVVkZwekovVMD9W5KMW29EuZ5lG01ZmShLRVS4Q/L/wBM+0NoK+mFdXBSWs/4PNA/Wow7U8XE91E2Tl9vV2c39pDr5rqXafi4nuoDcUiKBCgAAAABABQQAYdr+FR70TjteORfJVU1SlBcW0ubNuZjrJrjBzcNJa6ow5Ffdd1zyr7ZN6RrUtN4DBHGdLUsmDT+7X5zf8GmynKgt6NUpXTXGSXCtdEa6cKySlbdY1fPzX3F0R9dwt9bd8geQ8LK/As+CdyyvwJ/B7HcLfW3/I7hb62/5A8fuWV+BP4L3LK/An8Hr9wt9bf8j/59nrb/AJA8unHzKbY2QompR4rgelmy33hScXFu1ap+R9dws9bf8hbOfaQnPJsnuSUkpAb0CIoAEKAAAAAAQFAHHJslVTKcIOclyijhiYslN5GT9V8viK6I2gCA4239ldCEl9Mk3vdOQWRBL6no96S0014J8wOwOc7FHceq3Zfn+Wp8rJqbSUuLenJ+fIDsDl3ivjxfD8nx8h3mrTXefwwOoCepQBCgCAoAhQAAAAAgAoIAOc6lOalLit1x066nKGK4L6LHro03Ja8G9TUAOE8dSrhDV6QWn/GhO7/3P7nl/S9TQQDHZizSbUnKT0WvJ8HrrrrzLDGk0nLdT0a0cdeHzzNgAi4FIAKAAAIUAAAAAAgKAICgCAoAgKAICgCAoAEKAICgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA//2Q=='"
                             onclick="location.href='movie-detail.html?id=${show.id}'">
                        <div class="absolute inset-0 pointer-events-none bg-gradient-to-t from-black/70 via-transparent to-transparent"></div>
                        
                        <button onclick="toggleSave(${show.id}, '${show.name.replace(/'/g, "\\'")}', '${img}', '${show.rating?.average || 'N/A'}')" 
                                class="absolute top-6 right-6 w-14 h-14 rounded-full ${isSaved ? 'bg-red-500 text-white' : 'bg-white/20 text-white'} backdrop-blur-xl flex items-center justify-center border border-white/30 active:scale-90 transition-all z-20 shadow-xl">
                            <span class="material-symbols-rounded" style="font-variation-settings: 'FILL' ${isSaved ? 1 : 0}">favorite</span>
                        </button>

                        <div class="absolute bottom-8 left-8 right-8 pointer-events-none">
                            <div class="flex gap-2 mb-2">
                                 <span class="bg-blue-500 text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase">★ ${show.rating?.average || 'N/A'}</span>
                            </div>
                            <h2 class="text-3xl font-bold text-white tracking-tight leading-tight">${show.name}</h2>
                        </div>
                    </div>

                    <div class="px-2 flex-grow flex flex-col">
                        <h3 class="text-xs font-bold text-[#0061A4] uppercase tracking-widest mb-3">Storyline</h3>
                        <p class="text-slate-600 leading-relaxed line-clamp-3 mb-6">
                            ${show.summary ? show.summary.replace(/<[^>]*>/g, '') : 'No summary available.'}
                        </p>
                        <button onclick="location.href='movie-detail.html?id=${show.id}'" class="mt-auto w-full py-5 bg-[#1A1C1E] text-white rounded-[24px] font-bold flex items-center justify-center gap-2 active:scale-95 transition-all">
                            <span class="material-symbols-rounded">visibility</span> Details
                        </button>
                    </div>
                </div>
            `;
        }).join('');

        if (UI.pageText) UI.pageText.innerText = `${currentIndex + 1} / ${movies.length}`;
    };

    // --- SAVE LOGIC ---
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
        
        if (UI.container) renderDiscovery();
        if (UI.saveContainer) renderSavelist();
    };

    // --- SAVELIST RENDER ---
    const renderSavelist = () => {
        if (!UI.saveContainer) return;
        const savelist = JSON.parse(localStorage.getItem('xeroid_savelist')) || [];
        
        if (savelist.length === 0) {
            UI.saveContainer.innerHTML = `
                <div class="text-center py-20 col-span-full">
                    <span class="material-symbols-rounded text-6xl text-slate-200">folder_off</span>
                    <p class="text-slate-400 mt-4">Your library is empty</p>
                </div>`;
            return;
        }

        UI.saveContainer.innerHTML = savelist.map(m => `
            <div class=" w-max-xl flex flex-col items-center p-4 bg-white rounded-[24px] border border-slate-100 mb-4 shadow-sm animate-hero cursor-pointer hover:bg-slate-50 transition-all" 
                 onclick="location.href='movie-detail.html?id=${m.id}'">
                <img src="${m.image}" class="w-full h-full object-cover rounded-xl shadow-sm" 
                     onerror="this.src='https://placeholder.com'">
                <div class="ml-4 flex py-3 items-center  gap-3">
                    <h3 class="font-bold text-[#1A1C1E] line-clamp-1">${m.name}</h3>
                    <p class="text-blue-600 bg-blue-100 rounded-full p-0.5 text-xs font-bold">★ ${m.rating}</p>
                </div>
                <button onclick="event.stopPropagation(); toggleSave(${m.id})" class="w-full p-3 text-red-400 bg-red-100 hover:bg-red-100 rounded-full transition-all">
                    <span class="material-symbols-rounded">delete</span>
                </button>
            </div>
        `).join('');
    };

    // --- EVENTS ---
    if (UI.input) {
        UI.input.onkeypress = (e) => { if(e.key === 'Enter') fetchShows(UI.input.value); };
    }
    
    if (UI.refresh) {
        UI.refresh.onclick = () => {
            const lastQ = localStorage.getItem('last_query') || 'latest';
            fetchShows(lastQ, true);
        };
    }

    if(UI.cancelBtn) {
        UI.cancelBtn.onclick = () => {
            fetchShows("latest", true);
        }
    }

    if (UI.next) {
        UI.next.onclick = () => { 
            const step = window.innerWidth >= 1024 ? 3 : 1;
            if(currentIndex + step < movies.length) { 
                currentIndex += step; 
                renderDiscovery(); 
                window.scrollTo({top: 0, behavior: 'smooth'}); 
            }
        };
    }
    
    if (UI.prev) {
        UI.prev.onclick = () => { 
            const step = window.innerWidth >= 1024 ? 3 : 1;
            if(currentIndex > 0) { 
                currentIndex = Math.max(0, currentIndex - step); 
                renderDiscovery(); 
                window.scrollTo({top: 0, behavior: 'smooth'}); 
            }
        };
    }

    // --- INITIALIZATION ---
    // Try to load last search, else show default
    const initQuery = localStorage.getItem('last_query') || 'trending';
    if (UI.container) fetchShows(initQuery);
    if (UI.saveContainer) renderSavelist();
});
