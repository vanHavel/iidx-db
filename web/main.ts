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
                params[`$${field}`] = input.value.trim();
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
    console.log("Song IDs:", ids);
    console.log("Total Count:", totalCount);
    const songInfo = await getSongInfo(ids, searchParams);
    console.log("Song Info:", songInfo);
    document.getElementById('results').innerHTML = renderSongInfo(ids, songInfo);
    updateNav(page, pageSize, totalCount);
}

document.getElementById('search').addEventListener('click', async (e) => {
    page = 1;
    [searchParams, sort] = getQueryParams();
    await search()
});
document.getElementById('firstPage').addEventListener('click', async (e) => {page = 1; await search();});
document.getElementById('prevPage').addEventListener('click', async (e) => {if (page > 1) {page--; await search();}});
document.getElementById('nextPage').addEventListener('click', async (e) => {if (page < maxPage) {page++; await search();}});
document.getElementById('lastPage').addEventListener('click', async (e) => {page = maxPage; await search();});

await search();