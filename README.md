# iidx-db
iidx Chart Database. 

[iidx.directory](https://iidx.directory) is currently live with the data for Infinitas. Console data might be added in the future.

# Obtaining the raw data 
To obtain the raw song / chart info for Infinitas, we use [Reflux](https://github.com/olji/Reflux) which reads it from Infinitas memory.

In the Reflux config.ini while, we must set `Debug.outputdb=true`.

The output is written to the file `songs.tsv` which will exist somewhere inside the project build when run via Visual Studio.

By default, Reflux writes the song id, title, english title, artist and genre. 
We made a small edit to the code to write additional columns for the export.
We also parse the unlock info before writing the tsv.

```C#
Utils.GetUnlockStates();

/* Primarily for debugging and checking for encoding issues */
if (Config.Output_songlist)
{
    List<string> p = new List<string>() { "id\ttitle\english_title\tartist\tgenre\tlevel\tnotes\tfolder\tbpm\tunlockType" };
    foreach (var v in Utils.songDb)
    {
        p.Add($"{v.Key}\t{v.Value.title}\t{v.Value.title_english}\t{v.Value.artist}\t{v.Value.genre}\t{String.Join(",", v.Value.level)}\t{String.Join(",", v.Value.totalNotes)}\t{v.Value.folder}\t{v.Value.bpm}\t{v.Value.type}");
    }
    File.WriteAllLines("songs.tsv", p.ToArray());
}
```

# Generating the database
To generate the database

```bash
cd python
uv sync
uv run create_sqlite_db.py
```

The db will be gzip-compressed and placed into the `web/public` directory.

# Running the dev server
```bash
cd web
npm run dev
```

# Building the web app
```bash
cd web
npm run build
```

# Serving the production build
```bash
cd web
npm run serve
```