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

loadDatabase().then((db) => {
    const results = db.exec({
        sql:"SELECT count(1) FROM song",
        callback: function(row){
          console.log("row ",++this.counter,"=",row);
        }.bind({counter: 0})});
});