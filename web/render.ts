export function updateNav(page, pageSize, totalCount) {
    const totalPages = Math.max(Math.ceil(totalCount / pageSize), 1);
    document.getElementById('firstPage').disabled = (page === 1);
    document.getElementById('prevPage').disabled = (page === 1);
    document.getElementById('nextPage').disabled = (page === totalPages);
    document.getElementById('lastPage').disabled = (page === totalPages);
    document.getElementById('firstOffset').textContent = `${totalCount == 0 ? 0 : (page - 1) * pageSize + 1}`;
    document.getElementById('lastOffset').textContent = `${Math.min(page * pageSize, totalCount)}`;
    document.getElementById('totalCount').textContent = `${totalCount}`;
}

const difficultyColors = {
    beginner: "text-success",
    standard: "text-primary",
    hyper: "text-warning",
    another: "text-danger",
    leggendaria: "text-legg",
};

function renderChart(chart) {
    if (!chart) return "/";
    return `Lv.${chart.level} (${chart.note_count})`;
}

export function renderSongInfo(songIds, songInfo) {
    if (!songIds || songIds.length === 0) {
        return `<tr><td colspan="8" class="text-center">No songs found</td></tr>`;
    }

    return songIds
        .map((id) => {
            const song = songInfo[id];
            const title = song.japaneseTitle || song.englishTitle;
            const unlock = song.unlock_type.charAt(0).toUpperCase() + song.unlock_type.slice(1);
            const bpm = song.min_bpm === song.max_bpm ? `${song.min_bpm}` : `${song.min_bpm}~${song.max_bpm}`;
            const stripeClass = songIds.indexOf(id) % 2 === 0 ? "tr-striped" : "";

            function generateChartCells(chartCollection, isSingle) {
                return Object.keys(difficultyColors)
                    .map((difficulty) => {
                        const chart = chartCollection?.[difficulty];
                        return `<td class="${difficultyColors[difficulty]} chart-cell">${renderChart(chart)}</td>`;
                    })
                    .join("");
            }

            return `
            <tr class="${stripeClass}">
              <td class="song-image-cell" rowspan="3">
                <img
                  src="/img/${song.folder}.webp"
                  alt="${title}"
                  class="song-image"
                />
              </td>
              <td class="song-info" rowspan="3">
                <div class="song-title">${title}</div>
                <div class="text-muted fst-italic song-artist">${song.artist}</div>
                <div class="text-muted song-genre">${song.genre}</div>
              </td>
              <td></td>
              <td class="song-meta-label">BPM: ${bpm}</td>
              <td class="song-meta-label">Unlock: ${unlock}</td>
              <td></td> <td></td> <td></td>
            </tr>
            <tr class="${stripeClass} chart-row">
              <td class="chart-section-label">SP:</td>
              ${generateChartCells(song.single, true)}
            </tr>
            <tr class="${stripeClass} chart-row">
              <td class="chart-section-label">DP:</td>
              ${generateChartCells(song.double, false)}
            </tr>
            `;
        })
        .join("");
}

