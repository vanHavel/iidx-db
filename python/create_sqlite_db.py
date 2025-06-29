import gzip
import os.path
import shutil
import sqlite3


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
    conn.close()

    with open(db_path, "rb") as db_file:
        # gzip compress the database file
        with gzip.open("../web/public/db.sqlite3.gzipped", "wb") as gzip_file:
            shutil.copyfileobj(db_file, gzip_file)


