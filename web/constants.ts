export const mappings = {
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
    'order': {
        'title': 's.english_title',
        'level_asc': 'MIN(c.level)',
        'level_desc': 'MAX(c.level) DESC',
        'BPM_asc': 's.min_bpm',
        'BPM_desc': 's.max_bpm DESC',
        'note_asc': 'MIN(c.note_count)',
        'note_desc': 'MAX(c.note_count) DESC',
    },
    // map of iidx game versions to folder IDs. Images for game versions are stored in public/img.
    'folder': {
        '1': 0,
        '1-substream': 1,
        '2': 2,
        '3': 3,
        '4': 4,
        '5': 5,
        '6': 6,
        '7': 7,
        '8': 8,
        '9': 9,
        '10': 10,
        '11-red': 11,
        '12-happysky': 12,
        '13-distorted': 13,
        '14-gold': 14,
        '15-djtroopers': 15,
        '16-empress': 16,
        '17-sirius': 17,
        '18-resortanthem': 18,
        '19-lincle': 19,
        '20-tricoro': 20,
        '21-spada': 21,
        '22-pendual': 22,
        '23-copula': 23,
        '24-sinobuz': 24,
        '25-cannonballers': 25,
        '26-rootage': 26,
        '27-heroicverse': 27,
        '28-bistrover': 28,
        '29-casthour': 29,
        '30-resident': 30,
        '31-epolis': 31,
        '32-pinkycrush': 32,
        '33-sparkleshower': 33,
        'infinitas': 80,
    }
};

export const inverseMappings = Object.fromEntries(
    Object.entries(mappings).map(([key, value]) => [
        key,
        Object.fromEntries(Object.entries(value).map(([k, v]) => [v, k]))
    ])
);


export const pageSize = 20;