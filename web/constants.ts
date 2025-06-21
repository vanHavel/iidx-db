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
    }
};

export const inverseMappings = Object.fromEntries(
    Object.entries(mappings).map(([key, value]) => [
        key,
        Object.fromEntries(Object.entries(value).map(([k, v]) => [v, k]))
    ])
);


export const pageSize = 20;