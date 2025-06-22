export function renderSongInfo(songIds, songInfo) {
    let ul = document.createElement('ul');
    for (const id of songIds) {
        const song = songInfo[id];
        let li = document.createElement('li');
        li.textContent = `${song.japaneseTitle}(${song.englishTitle}) - ${song.artist} (${song.genre}) - ${song.folder}`;
        ul.appendChild(li);
    }
    return ul.outerHTML;
}

export function updateNav(page, pageSize, totalCount) {
    const totalPages = Math.ceil(totalCount / pageSize);
    document.getElementById('firstPage').disabled = (page === 1);
    document.getElementById('prevPage').disabled = (page === 1);
    document.getElementById('nextPage').disabled = (page === totalPages);
    document.getElementById('lastPage').disabled = (page === totalPages);
    document.getElementById('firstOffset').textContent = `${totalCount == 0 ? 0 : (page - 1) * pageSize + 1}`;
    document.getElementById('lastOffset').textContent = `${Math.min(page * pageSize, totalCount)}`;
    document.getElementById('totalCount').textContent = `${totalCount}`;
}
