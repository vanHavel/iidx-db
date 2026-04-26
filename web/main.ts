import { getSongIds, getSongInfo, loadInitialData, loadDatabase } from './db.ts';
import { pageSize } from './constants.ts';
import { renderSongInfo, updateNav } from './render.ts';
import { mappings } from './constants.ts';

let page = 1;
let maxPage = 1;

function getQueryParams() {
    const params = {}
    for (const field of ['title', 'artist', 'genre', 'difficulty', 'level', 'chart_type']) {
        const input = document.getElementById(field);
        if (input.value.trim()) {
            if (mappings[field]) {
                params[`$${field}`] = mappings[field][input.value];
            } else {
                // remove special characters
                const cleaned = input.value.replace(/[!"#$%&'()*+,\-./:;<=>?@[\\\]^_`{|}~]/g, ' ').trim();
                if (cleaned) {
                    params[`$${field}`] = cleaned;
                }
            }
        }
    }
    const order = document.getElementById('order').value;
    const sortDirectionButton = document.getElementById('sort-direction');
    const direction = sortDirectionButton.dataset.direction === 'desc' ? 'desc' : 'asc';
    const sort = mappings['order'][`${order}_${direction}`];
    return [params, sort];
}

let [searchParams, sort] = getQueryParams();

function isInitialView() {
    return Object.keys(searchParams).length === 0 && sort === 's.english_title' && page === 1;
}

async function search() {
    if (isInitialView()) {
        const { songIds, songInfo, totalCount } = await loadInitialData();
        maxPage = Math.ceil(totalCount / pageSize);
        document.getElementById('results').innerHTML = renderSongInfo(songIds, songInfo, searchParams);
        updateNav(page, pageSize, totalCount);
        // slightly delayed load of full database to avoid blocking UI
        setTimeout(() => loadDatabase(), 100);
    } else {
        const [ids, totalCount] = await getSongIds(searchParams, sort, page, pageSize);
        maxPage = Math.ceil(totalCount / pageSize);
        const songInfo = await getSongInfo(ids, searchParams);
        document.getElementById('results').innerHTML = renderSongInfo(ids, songInfo, searchParams);
        updateNav(page, pageSize, totalCount);
    }
}

document.getElementById('search').addEventListener('click', async (e) => {
    page = 1;
    [searchParams, sort] = getQueryParams();
    await search()
});

function getSortLabels(field) {
    switch (field) {
        case 'BPM':
        case 'level':
            return ['↑ Lowest', '↓ Highest'];
        case 'note':
            return ['↑ Fewest', '↓ Most'];
        default:
            return ['↑ First', '↓ Last'];
    }
}

function updateSortButton() {
    const button = document.getElementById('sort-direction');
    const field = document.getElementById('order').value;
    const direction = button.dataset.direction === 'desc' ? 'desc' : 'asc';
    const [ascLabel, descLabel] = getSortLabels(field);
    const label = direction === 'asc' ? ascLabel : descLabel;
    button.textContent = label;
    button.setAttribute('aria-label', `Sort ${direction === 'asc' ? 'ascending' : 'descending'}`);
}

document.getElementById('sort-direction').addEventListener('click', async () => {
    const button = document.getElementById('sort-direction');
    button.dataset.direction = button.dataset.direction === 'asc' ? 'desc' : 'asc';
    updateSortButton();
    page = 1;
    [searchParams, sort] = getQueryParams();
    await search();
});

document.getElementById('order').addEventListener('change', async () => {
    updateSortButton();
    page = 1;
    [searchParams, sort] = getQueryParams();
    await search();
});

updateSortButton();

// hitting enter in the search input should trigger the search
for (const field of ['title', 'artist', 'genre']) {
    document.getElementById(field).addEventListener('keydown', function(event) {
        if (event.key === 'Enter') {
            document.getElementById('search').click();
        }
    });
}

document.getElementById('firstPage').addEventListener('click', async (e) => {page = 1; await search();});
document.getElementById('prevPage').addEventListener('click', async (e) => {if (page > 1) {page--; await search();}});
document.getElementById('nextPage').addEventListener('click', async (e) => {if (page < maxPage) {page++; await search();}});
document.getElementById('lastPage').addEventListener('click', async (e) => {page = maxPage; await search();});

await search();
