import type { ParsedSubtitle, Subtitle } from '../types/subtitle';

export function formatTimestamp(timestamp: string, format: 'vtt' | 'srt'): string {
  // Ensure consistent format between VTT and SRT
  const normalized = timestamp.replace(',', '.');
  return format === 'srt' ? normalized.replace('.', ',') : normalized;
}

export async function parseSubtitleFile(file: File): Promise<ParsedSubtitle> {
  const text = await file.text();
  const format = file.name.toLowerCase().endsWith('.vtt') ? 'vtt' : 'srt';
  
  const lines = text.trim().split('\n');
  const subtitles: Subtitle[] = [];
  let currentSubtitle: Partial<Subtitle> = {};
  let id = 1;

  // Skip WEBVTT header if present
  let startIndex = format === 'vtt' && lines[0].includes('WEBVTT') ? 1 : 0;

  for (let i = startIndex; i < lines.length; i++) {
    const line = lines[i].trim();

    if (line === '') {
      if (currentSubtitle.startTime && currentSubtitle.endTime && currentSubtitle.text) {
        subtitles.push({
          id,
          startTime: currentSubtitle.startTime,
          endTime: currentSubtitle.endTime,
          text: currentSubtitle.text,
        });
        id++;
      }
      currentSubtitle = {};
      continue;
    }

    if (format === 'srt' && /^\d+$/.test(line)) {
      continue;
    }

    if (line.includes('-->')) {
      const [start, end] = line.split('-->').map(t => t.trim());
      currentSubtitle.startTime = start;
      currentSubtitle.endTime = end;
    } else if (currentSubtitle.startTime) {
      currentSubtitle.text = currentSubtitle.text 
        ? `${currentSubtitle.text} ${line}`
        : line;
    }
  }

  // Add the last subtitle if exists
  if (currentSubtitle.startTime && currentSubtitle.endTime && currentSubtitle.text) {
    subtitles.push({
      id,
      startTime: currentSubtitle.startTime,
      endTime: currentSubtitle.endTime,
      text: currentSubtitle.text,
    });
  }

  return { subtitles, format };
}