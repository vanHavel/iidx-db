import sqlite3InitModule from '@sqlite.org/sqlite-wasm';
import { mappings, inverseMappings } from './constants.ts';
import { UnlockType } from './model.ts';
import type { Song, Chart, ChartCollection } from './model.ts';

let db = null;

async function loadDatabase() {
    if (db) {
        return db;
    }
    const sqlite3 = await sqlite3InitModule({
      print: console.log,
      printErr: console.error,
    });
    const res = await fetch('db.sqlite3.gzipped');
    const ds = new DecompressionStream('gzip');
    const decompressedStream = res.body.pipeThrough(ds);
    const raw = new Uint8Array(await new Response(decompressedStream).arrayBuffer());

    // load DB from buffer: https://stackoverflow.com/a/78119681
    const p = sqlite3.wasm.allocFromTypedArray(raw);
    let deserialize_flags = sqlite3.capi.SQLITE_DESERIALIZE_FREEONCLOSE;
    db = new sqlite3.oo1.DB(raw);
    const rc = sqlite3.capi.sqlite3_deserialize(db.pointer, 'main', p, raw.byteLength, raw.byteLength, deserialize_flags);
    db.checkRc(rc);
    return db;
}


function buildQuery(params, returnCount = false, sort = 's.english_title') {
    let query = `
    SELECT ${returnCount ? 'COUNT(DISTINCT s.id) AS countSongs' : 's.id'}
    FROM song s
    JOIN song_search ss ON s.id = ss.rowid
    JOIN chart c ON s.id = c.id_song
    WHERE 1=1`
    if ('$title' in params) {
        // fts5 does not allow to mix MATCH queries with disjunctions, so we need to do a subquery...
        query += ` AND (s.japanese_title LIKE '%' || $title || '%'
            OR s.id IN (
                SELECT id FROM song s JOIN song_search ss ON s.id = ss.rowid WHERE ss.english_title MATCH $title
            ))`;
    }
    for (const match of ['artist', 'genre']) {
      if (`$${match}` in params) {
        query += ` AND ss.${match} MATCH $${match}`;
      }
    }
    for (const filter of ['difficulty', 'level', 'chart_type']) {
      if (`$${filter}` in params) {
        query += ` AND c.${filter} = $${filter}`;
      }
    }

    if (!returnCount) {
        query += `
        GROUP BY s.id
        ORDER BY ${sort}
        LIMIT $limit
        OFFSET $offset`;
    }

    return query;
}

export async function getSongIds(params, sort, page, pageSize) {
    const db = await loadDatabase();
    params.$limit = pageSize;
    params.$offset = (page - 1) * pageSize;
    console.log("params", JSON.stringify(params, null, 2));
    let query = buildQuery(params, false, sort);
    let resultRows = [];
    console.log("Executing query:", query);
    db.exec({
        sql: query,
        bind: params,
        rowMode: 'object',
        resultRows: resultRows
    });
    console.log("resultRows", JSON.stringify(resultRows, null, 2));
    let countQuery = buildQuery(params, true);
    for (const paramToDrop of ['$limit', '$offset']) {
        delete params[paramToDrop];
    }
    let countRows = [];
    console.log("Executing count query:", countQuery);
    db.exec({
        sql: countQuery,
        bind: params,
        rowMode: 'object',
        resultRows: countRows
    });
    const ids = Array.from(resultRows).map(row => row.id);
    const totalCount = countRows[0].countSongs;
    return [ids, totalCount];
}

export async function getSongInfo(songIds, params) {
    const db = await loadDatabase();
    let query = `
    SELECT s.*,
    c.level, c.note_count, c.difficulty, c.chart_type
    FROM song s
    JOIN chart c ON s.id = c.id_song
    WHERE s.id IN (${songIds.join(', ')})
    `;
    let resultRows = [];
    console.log("Executing query:", query);
    db.exec({
        sql: query,
        bind: songIds,
        rowMode: 'object',
        resultRows: resultRows
    });
    console.log("resultRows", JSON.stringify(resultRows, null, 2));
    return createSongInfo(resultRows);
}

function createSongInfo(rows) {
    const songs = {}
    for (const row of rows) {
        if (!songs[row.id]) {
            songs[row.id] = {
                title: row.title,
                englishTitle: row.english_title,
                japaneseTitle: row.japanese_title,
                artist: row.artist,
                genre: row.genre,
                min_bpm: row.min_bpm,
                max_bpm: row.max_bpm,
                unlock_type: UnlockType.fromInt(row.unlock_type),
                single: {},
                double: {},
                folder: inverseMappings['folder'][row.folder]
            };
        }
        const chart: Chart = {
            level: row.level,
            note_count: row.note_count,
        };
        const chartType = inverseMappings['chart_type'][row.chart_type].toLowerCase();
        const difficulty = inverseMappings['difficulty'][row.difficulty].toLowerCase();
        songs[row.id][chartType][difficulty] = chart;
    }
    return songs;
}