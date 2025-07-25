import { getSongIds, getSongInfo } from './db.ts';
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
    const sort = mappings['order'][document.getElementById('order').value];
    return [params, sort];
}

let [searchParams, sort] = getQueryParams();

async function search() {
    const [ids, totalCount] = await getSongIds(searchParams, sort, page, pageSize);
    maxPage = Math.ceil(totalCount / pageSize);
    const songInfo = await getSongInfo(ids, searchParams);
    document.getElementById('results').innerHTML = renderSongInfo(ids, songInfo, searchParams);
    updateNav(page, pageSize, totalCount);
}

document.getElementById('search').addEventListener('click', async (e) => {
    page = 1;
    [searchParams, sort] = getQueryParams();
    await search()
});
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