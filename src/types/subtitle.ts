export interface Subtitle {
  id: number;
  startTime: string;
  endTime: string;
  text: string;
  paraphrasedText?: string;
  isParaphrased?: boolean;
  isEdited?: boolean;
}

export interface ParsedSubtitle {
  subtitles: Subtitle[];
  format: 'vtt' | 'srt';
}

export interface ParaphrasingError extends Error {
  subtitle?: Subtitle;
  details?: unknown;
}

export interface SubtitleHistory {
  id: string;
  filename: string;
  timestamp: number;
  format: 'vtt' | 'srt';
  originalSubtitles: Subtitle[];
  editedSubtitles: Subtitle[];
}