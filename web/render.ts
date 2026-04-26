import { inverseMappings } from './constants.ts';

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

const difficulties = [
    'beginner',
    'standard',
    'hyper',
    'another',
    'leggendaria',
];

const difficultyLabels = {
    beginner: 'B',
    standard: 'N',
    hyper: 'H',
    another: 'A',
    leggendaria: 'L',
};

const difficultyNames = {
    beginner: 'Beginner',
    standard: 'Normal',
    hyper: 'Hyper',
    another: 'Another',
    leggendaria: 'Leggendaria',
};

function renderChart(chart, difficulty, isSingle, searchParams) {
    if (!chart) {
        return `
          <div class="chart-cell chart-cell-empty difficulty-${difficulty}">
            <span class="chart-difficulty">${difficultyNames[difficulty]}</span>
            <span class="chart-compact-label">${difficultyLabels[difficulty]} -</span>
            <span class="chart-empty-mark">-</span>
          </div>
        `;
    }

    const isSelected = isChartSelected(isSingle, difficulty, chart.level, searchParams);
    return `
      <div class="chart-cell difficulty-${difficulty} selected-${isSelected}">
        <span class="chart-difficulty">${difficultyNames[difficulty]}</span>
        <span class="chart-compact-label">${difficultyLabels[difficulty]} Lv.${chart.level}</span>
        <span class="chart-level">Lv.${chart.level}</span>
        <span class="chart-notes">${chart.note_count} notes</span>
      </div>
    `;
}

function isChartSelected(isSingle, difficulty, level, searchParams) {
    const searchSingle = searchParams.$chart_type;
    const searchDifficulty = searchParams.$difficulty;
    const searchLevel = searchParams.$level;
    if (searchSingle !== undefined && (searchSingle === 0) !== isSingle) {
        return false;
    }
    if (searchDifficulty !== undefined && inverseMappings['difficulty'][searchDifficulty].toLowerCase() !== difficulty) {
        return false;
    }
    if (searchLevel !== undefined && searchLevel !== level) {
        return false;
    }
    return true;
}

function renderChartGroup(label, chartCollection, isSingle, searchParams) {
    return `
      <section class="chart-group" aria-label="${label} charts">
        <div class="chart-group-label">${label}</div>
        <div class="chart-cells">
          ${difficulties.map((difficulty) => renderChart(chartCollection?.[difficulty], difficulty, isSingle, searchParams)).join('')}
        </div>
      </section>
    `;
}

function renderUnlock(unlockType) {
    if (!unlockType) return 'Unknown';
    return unlockType.charAt(0).toUpperCase() + unlockType.slice(1);
}

function renderBpm(song) {
    return song.min_bpm === song.max_bpm ? `${song.min_bpm}` : `${song.min_bpm}-${song.max_bpm}`;
}

function escapeHtml(value) {
    return String(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function escapeAttribute(value) {
    return escapeHtml(value);
}

export function renderSongInfo(songIds, songInfo, searchParams) {
    if (!songIds || songIds.length === 0) {
        return `<div class="no-results">No songs found.</div>`;
    }

    return songIds
        .map((id) => {
            const song = songInfo[id];
            if (!song) return '';

            const title = song.japaneseTitle || song.englishTitle;
            const bpm = renderBpm(song);
            const unlock = renderUnlock(song.unlock_type);

            return `
              <article class="song-card" data-song-id="${escapeAttribute(id)}">
                <div class="song-info">
                  <div
                    class="song-image"
                    style="background-image: url('/img/${escapeAttribute(song.folder)}.webp')"
                    role="img"
                    aria-label="${escapeAttribute(title)}"
                  ></div>
                  <div class="song-meta">
                    <h3 class="song-title">${escapeHtml(title)}</h3>
                    <div class="song-artist">${escapeHtml(song.artist)}</div>
                    <div class="song-genre">${escapeHtml(song.genre)}</div>
                    <div class="song-details">
                      <span>BPM ${escapeHtml(bpm)}</span>
                      <span>${escapeHtml(unlock)}</span>
                    </div>
                  </div>
                </div>
                <div class="song-charts">
                  ${renderChartGroup('SP', song.single, true, searchParams)}
                  ${renderChartGroup('DP', song.double, false, searchParams)}
                </div>
              </article>
            `;
        })
        .join('');
}
