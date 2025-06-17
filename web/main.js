import brotliPromise from 'brotli-dec-wasm';
import sqlite3InitModule from '@sqlite.org/sqlite-wasm';

let db = null;

async function loadDatabase() {
    if (db) {
        return db;
    }
    const brotli = await brotliPromise;
    const sqlite3 = await sqlite3InitModule({
      print: console.log,
      printErr: console.error,
    });
    const res = await fetch('db.sqlite3.brzip');
    const compressed = new Uint8Array(await res.arrayBuffer());
    const raw = brotli.decompress(compressed);

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
    const mappings = {
        'level': Object.fromEntries(Array.from({length: 12}, (_, i) => [(i+1).toString(), i+1])),
        'difficulty': {
            'Beginner': 0,
            'Standard': 1,
            'Hyper': 2,
            'Another': 3,
            'Leggendaria': 4,
        },
        'chart_type': {
            'Single': 0,
            'Double': 1,
        },
    }
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
    return params;
}

async function getSongData() {
    const db = await loadDatabase();
    const params = getQueryParams();
    console.log("params", JSON.stringify(params, null, 2));
    let query = `
    SELECT s.id, s.title, s.artist, s.genre, min_bpm, max_bpm, unlock_type,
    MAX(c.level) AS max_level, MIN(c.level) AS min_level,
    MAX(c.note_count) AS max_note_count, MIN(c.note_count) AS min_note_count
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
    GROUP BY s.id, s.title, s.artist, s.genre, min_bpm, max_bpm, unlock_type
    ORDER BY s.title
    LIMIT 10`;

    let resultRows = [];
    db.exec({
        sql: query,
        bind: params,
        rowMode: 'object',
        resultRows: resultRows
    });
    console.log("resultRows", JSON.stringify(resultRows, null, 2));
}

document.getElementById('search').addEventListener('click', (e) => {
    getSongData().then(() => {
        console.log("Search completed");
    })
});