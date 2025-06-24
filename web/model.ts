export enum UnlockType {
    Unknown = "unknown",
    Base = "base",
    Bits = "bits",
    Pack = "pack"
}

namespace UnlockType {
    export function fromInt(value: number): UnlockType {
        switch (value) {
            case 0: return UnlockType.Base;
            case 1: return UnlockType.Bits;
            case 2: return UnlockType.Pack;
            default: return UnlockType.Unknown;
        }
    }
}

export type Chart = {
    level: number;
    note_count: number;
}

export type ChartCollection = {
    beginner?: Chart;
    standard?: Chart;
    hyper?: Chart;
    another?: Chart;
    leggendaria?: Chart;
}

export type Song = {
    title: string;
    englishTitle: string;
    japaneseTitle?: string;
    artist: string;
    genre: string;
    min_bpm: number;
    max_bpm: number;
    unlock_type: UnlockType;
    single?: ChartCollection;
    double?: ChartCollection;
    folder: string;
}