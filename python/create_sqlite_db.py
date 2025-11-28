import gzip
import json
import os.path
import shutil
import sqlite3


def generate_initial_data(cursor):
    page_size = 20
    cursor.execute("SELECT COUNT(DISTINCT s.id) FROM song s JOIN chart c ON s.id = c.id_song")
    total_count = cursor.fetchone()[0]

    cursor.execute("""
        SELECT s.id
        FROM song s
        JOIN chart c ON s.id = c.id_song
        GROUP BY s.id
        ORDER BY s.english_title
        LIMIT ?
    """, (page_size,))
    song_ids = [row[0] for row in cursor.fetchall()]

    cursor.execute(f"""
        SELECT s.id, s.japanese_title, s.english_title, s.artist, s.genre, s.min_bpm, s.max_bpm, s.unlock_type, s.folder,
               c.level, c.note_count, c.difficulty, c.chart_type
        FROM song s
        JOIN chart c ON s.id = c.id_song
        WHERE s.id IN ({','.join('?' * len(song_ids))})
    """, song_ids)

    songs = {}
    for row in cursor.fetchall():
        song_id, japanese_title, english_title, artist, genre, min_bpm, max_bpm, unlock_type, folder, level, note_count, difficulty, chart_type = row
        if song_id not in songs:
            songs[song_id] = {
                'id': song_id,
                'japaneseTitle': japanese_title,
                'englishTitle': english_title,
                'artist': artist,
                'genre': genre,
                'minBpm': min_bpm,
                'maxBpm': max_bpm,
                'unlockType': unlock_type,
                'folder': folder,
                'charts': []
            }
        songs[song_id]['charts'].append({
            'level': level,
            'noteCount': note_count,
            'difficulty': difficulty,
            'chartType': chart_type
        })

    initial_data = {
        'songIds': song_ids,
        'songs': songs,
        'totalCount': total_count
    }

    with open('../web/public/initial-data.json', 'w') as json_file:
        json.dump(initial_data, json_file, separators=(',', ':'))


if __name__ == '__main__':
    # Change the current working directory to the directory of this script
    abspath = os.path.abspath(__file__)
    dname = os.path.dirname(abspath)
    os.chdir(dname)

    db_path = "data/db.sqlite3"
    os.makedirs(os.path.dirname(db_path), exist_ok=True)

    if os.path.exists(db_path):
        os.remove(db_path)

    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    with open("./sql/ddl.sql") as ddl_file:
        ddl_script = ddl_file.read()
    cursor.executescript(ddl_script)
    conn.commit()

    with open("../raw_data/songs.tsv") as data_file:
        lines = data_file.readlines()

    cursor.execute("BEGIN TRANSACTION;")
    for row_number, line in enumerate(lines):
        if row_number == 0:
            continue
        fields = line.strip().split("\t")
        _, japanese_title, english_title, artist, genre, level_arr, notes_arr, folder, bpm_range, unlock_type = fields

        if japanese_title == english_title:
            japanese_title = None
        if "~" in bpm_range:
            min_bpm, max_bpm = map(int, bpm_range.split("~"))
        else:
            min_bpm = max_bpm = int(bpm_range)
        if unlock_type == "Base":
            unlock_type = 0
        elif unlock_type == "Bits":
            unlock_type = 1
        elif unlock_type == "Sub":
            unlock_type = 2
        else:
            print(f"Unknown unlock type: {unlock_type} for song {english_title}")
            unlock_type = -1
        levels = list(map(int, level_arr.split(",")))
        notes = list(map(int, notes_arr.split(",")))
        folder_id = int(folder)

        cursor.execute(
            "INSERT INTO song (japanese_title, english_title, artist, genre, min_bpm, max_bpm, unlock_type, folder)"
            " VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
            (japanese_title, english_title, artist, genre, min_bpm, max_bpm, unlock_type, folder_id)
        )
        row_id = cursor.lastrowid
        for chart_type in [0,1]: # single, double
            for difficulty in [0,1,2,3,4]: # beginner, standard, hyper, another, leggendaria
                index = difficulty + chart_type * 5
                if levels[index] == 0:
                    continue
                level = levels[index]
                note_count = notes[index]
                cursor.execute(
                    "INSERT INTO chart (id_song, difficulty, chart_type, level, note_count)"
                    " VALUES (?, ?, ?, ?, ?)",
                    (row_id, difficulty, chart_type, level, note_count)
                )

    cursor.execute("END TRANSACTION;")
    conn.commit()
    cursor.executescript("PRAGMA page_size = 1024;VACUUM;")
    conn.commit()

    generate_initial_data(cursor)

    conn.close()

    with open(db_path, "rb") as db_file:
        # gzip compress the database file
        with gzip.open("../web/public/db.sqlite3.gzipped", "wb") as gzip_file:
            shutil.copyfileobj(db_file, gzip_file)

