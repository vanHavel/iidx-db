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
    const res = await fetch('db.sqlite3.gz');
    const raw = new Uint8Array(await res.arrayBuffer());

    // load DB from buffer: https://stackoverflow.com/a/78119681
    const p = sqlite3.wasm.allocFromTypedArray(raw);
    let deserialize_flags = sqlite3.capi.SQLITE_DESERIALIZE_FREEONCLOSE;
    db = new sqlite3.oo1.DB(raw);
    const rc = sqlite3.capi.sqlite3_deserialize(db.pointer, 'main', p, raw.byteLength, raw.byteLength, deserialize_flags);
    db.checkRc(rc);
    return db;
}

function getQueryParams() {
    const params = {}
    for (const field of ['title', 'artist', 'genre', 'difficulty', 'level', 'chart_type', 'order']) {
        const input = document.getElementById(field);
        if (input.value.trim()) {
            if (mappings[field]) {
                params[`$${field}`] = mappings[field][input.value];
            } else {
                params[`$${field}`] = input.value.trim();
            }
        }
    }
    return params;
}

export async function getSongIds(page, pageSize = 50) {
    const db = await loadDatabase();
    const params = getQueryParams();
    console.log("params", JSON.stringify(params, null, 2));
    let query = `
    SELECT s.id
    FROM song s
    JOIN song_search ss ON s.id = ss.rowid
    JOIN chart c ON s.id = c.id_song
    WHERE 1=1`
    for (const match of ['title', 'artist', 'genre']) {
      if (`$${match}` in params) {
        query += ` AND ss.${match} MATCH $${match}`;
      }
    }
    for (const filter of ['difficulty', 'level', 'chart_type']) {
      if (`$${filter}` in params) {
        query += ` AND c.${filter} = $${filter}`;
      }
    }
    query += `
    GROUP BY s.id
    ORDER BY ${params.$order}
    LIMIT ${pageSize}
    OFFSET ${pageSize * (page - 1)}`;

    let resultRows = [];
    console.log("Executing query:", query);
    db.exec({
        sql: query,
        bind: params,
        rowMode: 'object',
        resultRows: resultRows
    });
    console.log("resultRows", JSON.stringify(resultRows, null, 2));
    return Array.from(resultRows).map(row => row.id);
}

export async function getSongInfo(songIds) {
    const db = await loadDatabase();
    const params = getQueryParams();
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
                artist: row.artist,
                genre: row.genre,
                min_bpm: row.min_bpm,
                max_bpm: row.max_bpm,
                unlock_type: UnlockType.fromInt(row.unlock_type),
                single: {},
                double: {}
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