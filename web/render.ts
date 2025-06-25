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
                        return `<td class="${difficultyColors[difficulty]}" style="width: 10%">${renderChart(chart)}</td>`;
                    })
                    .join("");
            }

            return `
            <tr class="${stripeClass}">
              <td
                style="width: 15%; padding: 0;"
                rowspan="3"
              >
                <img
                  src="/img/${song.folder}.webp"
                  alt="${title}"
                  style="
                    max-width: 100%;
                    max-height: 75px;
                    margin: auto;
                    width: 85%;
                    height: auto;
                    display: block;
                    object-fit: contain;
                  "
                />
              </td>
              <td
                class="text-start"
                style="
                  width: 20%;
                  word-wrap: break-word;
                  white-space: normal;
                "
                rowspan="3"
              >
                <div style="font-weight: 600">${title}</div>
                <div class="text-muted fst-italic" style="font-size: 0.9em;">${song.artist}</div>
                <div class="text-muted" style="font-size: 0.85em;">${song.genre}</div>
              </td>
              <td/>
              <td style="width: 10%; text-align: left; font-weight: 600; font-size: 0.9em;">
                BPM: ${bpm}
              </td>
              <td style="width: 10%; text-align: left; font-weight: 600; font-size: 0.9em;">
                Unlock: ${unlock}
              </td>
              <td/> <td/> <td/>
            </tr>
            <tr class="${stripeClass}" style="font-size: 0.9em;">
              <td style="width: 5%; font-weight: 600; text-align: left;">SP:</td>
              ${generateChartCells(song.single, true)}
            </tr>
            <tr class="${stripeClass}" style="font-size: 0.9em;">
              <td style="width: 5%; font-weight: 600; text-align: left;">DP:</td>
              ${generateChartCells(song.double, false)}
            </tr>
            `;
        })
        .join("");
}
