export async function saveToStorage(history: SubtitleHistory): Promise<void> {
  const existingData = await localStorage.getItem('subtitleHistory');
  const historyList = existingData ? JSON.parse(existingData) : [];
  
  // Update if exists, otherwise add new
  const index = historyList.findIndex((h: SubtitleHistory) => h.id === history.id);
  if (index !== -1) {
    historyList[index] = history;
  } else {
    historyList.unshift(history);
  }
  
  await localStorage.setItem('subtitleHistory', JSON.stringify(historyList));
}

export async function getHistory(): Promise<SubtitleHistory[]> {
  const data = await localStorage.getItem('subtitleHistory');
  return data ? JSON.parse(data) : [];
}

export async function deleteFromHistory(id: string): Promise<void> {
  const existingData = await localStorage.getItem('subtitleHistory');
  if (!existingData) return;
  
  const historyList = JSON.parse(existingData);
  const filtered = historyList.filter((h: SubtitleHistory) => h.id !== id);
  await localStorage.setItem('subtitleHistory', JSON.stringify(filtered));
}