import { getSongIds, getSongInfo } from './db.ts';
import { pageSize } from './constants.ts';
import { renderSongInfo } from './render.ts';

const page = 1;

document.getElementById('search').addEventListener('click', async (e) => {
    const ids = await getSongIds(page, pageSize);
    console.log("Song IDs:", ids);
    const songInfo = await getSongInfo(ids);
    console.log("Song Info:", songInfo);
    document.getElementById('results').innerHTML = renderSongInfo(songInfo);
});