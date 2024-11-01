import React, { useState, useEffect } from 'react';
import { FileText, Save, Upload, Key } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import type { Subtitle, SubtitleHistory } from '../types/subtitle';
import { parseSubtitleFile, formatTimestamp } from '../utils/subtitleParser';
import { paraphraseText, initializeOpenAI } from '../utils/paraphraser';
import { saveToStorage, getHistory, deleteFromHistory } from '../utils/storage';
import SubtitleRow from './SubtitleRow';
import ParaphraseControls from './ParaphraseControls';
import FileHeader from './FileHeader';
import HistoryList from './HistoryList';

export default function SubtitleEditor() {
  const [subtitles, setSubtitles] = useState<Subtitle[]>([]);
  const [format, setFormat] = useState<'vtt' | 'srt'>('vtt');
  const [error, setError] = useState<string>('');
  const [paraphrasePercentage, setParaphrasePercentage] = useState(20);
  const [isParaphrasing, setIsParaphrasing] = useState(false);
  const [apiKey, setApiKey] = useState(() => import.meta.env.VITE_OPENAI_API_KEY || '');
  const [showApiInput, setShowApiInput] = useState(false);
  const [history, setHistory] = useState<SubtitleHistory[]>([]);
  const [currentFileId, setCurrentFileId] = useState<string>('');
  const [showParaphrasedOnly, setShowParaphrasedOnly] = useState(false);
  const [paraphrasingRow, setParaphrasingRow] = useState<number | null>(null);

  useEffect(() => {
    loadHistory();
    if (apiKey) {
      initializeOpenAI(apiKey);
    }
  }, []);

  const loadHistory = async () => {
    const loadedHistory = await getHistory();
    setHistory(loadedHistory);
  };

  const handleApiKeySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      initializeOpenAI(apiKey);
      setShowApiInput(false);
      setError('');
    } catch (err) {
      setError('Invalid API key');
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const { subtitles: parsedSubs, format: detectedFormat } = await parseSubtitleFile(file);
      const newFileId = uuidv4();
      const historyEntry: SubtitleHistory = {
        id: newFileId,
        filename: file.name,
        timestamp: Date.now(),
        format: detectedFormat,
        originalSubtitles: parsedSubs,
        editedSubtitles: parsedSubs
      };

      await saveToStorage(historyEntry);
      setCurrentFileId(newFileId);
      setSubtitles(parsedSubs);
      setFormat(detectedFormat);
      setError('');
      loadHistory();
    } catch (err) {
      setError('Failed to parse subtitle file. Please ensure it\'s a valid VTT or SRT file.');
    }
  };

  const handleSubtitleChange = (id: number, field: keyof Subtitle, value: string) => {
    setSubtitles(prev => {
      const updated = prev.map(sub =>
        sub.id === id ? { ...sub, [field]: value } : sub
      );
      
      if (currentFileId) {
        const historyEntry = history.find(h => h.id === currentFileId);
        if (historyEntry) {
          saveToStorage({
            ...historyEntry,
            editedSubtitles: updated
          });
        }
      }
      
      return updated;
    });
  };

  const handleParaphrase = async () => {
    if (!apiKey) {
      setShowApiInput(true);
      return;
    }

    if (isParaphrasing || subtitles.length === 0) return;

    setIsParaphrasing(true);
    setError('');

    try {
      const count = Math.ceil(subtitles.length * (paraphrasePercentage / 100));
      const indices = new Set<number>();
      
      while (indices.size < count) {
        indices.add(Math.floor(Math.random() * subtitles.length));
      }

      const updatedSubtitles = [...subtitles];
      
      await Promise.all(
        Array.from(indices).map(async (index) => {
          try {
            const paraphrasedText = await paraphraseText(subtitles[index].text);
            updatedSubtitles[index] = {
              ...updatedSubtitles[index],
              paraphrasedText,
              isParaphrased: true
            };
          } catch (error) {
            console.error(`Failed to paraphrase subtitle ${index + 1}:`, error);
          }
        })
      );

      setSubtitles(updatedSubtitles);
      
      if (currentFileId) {
        const historyEntry = history.find(h => h.id === currentFileId);
        if (historyEntry) {
          saveToStorage({
            ...historyEntry,
            editedSubtitles: updatedSubtitles
          });
        }
      }
    } catch (err) {
      setError('Failed to paraphrase subtitles. Please try again.');
    } finally {
      setIsParaphrasing(false);
    }
  };

  const handleParaphraseRow = async (id: number) => {
    if (!apiKey) {
      setShowApiInput(true);
      return;
    }

    setParaphrasingRow(id);
    try {
      const subtitle = subtitles.find(s => s.id === id);
      if (!subtitle) return;

      const paraphrasedText = await paraphraseText(subtitle.text);
      handleSubtitleChange(id, 'paraphrasedText', paraphrasedText);
      handleSubtitleChange(id, 'isParaphrased', 'true');
    } catch (err) {
      setError('Failed to paraphrase subtitle. Please try again.');
    } finally {
      setParaphrasingRow(null);
    }
  };

  const handleToggleParaphrase = (id: number) => {
    setSubtitles(prev => {
      const updated = prev.map(sub =>
        sub.id === id ? { ...sub, isParaphrased: !sub.isParaphrased } : sub
      );
      
      if (showParaphrasedOnly) {
        return updated.filter(s => s.isParaphrased);
      }
      
      return updated;
    });
  };

  const handleDeleteRow = (id: number) => {
    setSubtitles(prev => {
      const updated = prev.filter(sub => sub.id !== id);
      if (currentFileId) {
        const historyEntry = history.find(h => h.id === currentFileId);
        if (historyEntry) {
          saveToStorage({
            ...historyEntry,
            editedSubtitles: updated
          });
        }
      }
      return updated;
    });
  };

  const handleFilenameChange = (newName: string) => {
    if (!currentFileId) return;
    
    const historyEntry = history.find(h => h.id === currentFileId);
    if (!historyEntry) return;

    const updatedEntry = {
      ...historyEntry,
      filename: newName
    };

    saveToStorage(updatedEntry);
    loadHistory();
  };

  const handleHistoryEdit = (entry: SubtitleHistory) => {
    setCurrentFileId(entry.id);
    setSubtitles(entry.editedSubtitles);
    setFormat(entry.format);
  };

  const handleHistoryDelete = async (id: string) => {
    await deleteFromHistory(id);
    loadHistory();
  };

  const handleBack = () => {
    setCurrentFileId('');
    setSubtitles([]);
    setShowParaphrasedOnly(false);
  };

  const downloadSubtitles = () => {
    const currentFile = history.find(h => h.id === currentFileId);
    if (!currentFile) return;

    let content = 'WEBVTT\n\n';
    
    subtitles.forEach((sub, index) => {
      content += `${formatTimestamp(sub.startTime, 'vtt')} --> ${formatTimestamp(sub.endTime, 'vtt')}\n`;
      content += `${sub.isParaphrased && sub.paraphrasedText ? sub.paraphrasedText : sub.text}\n\n`;
    });

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const filename = currentFile.filename.replace(/\.[^/.]+$/, '');
    a.download = `${filename}-paraphrased.vtt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const displayedSubtitles = showParaphrasedOnly
    ? subtitles.filter(s => s.isParaphrased)
    : subtitles;

  const paraphrasedCount = subtitles.filter(s => s.isParaphrased).length;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {currentFileId ? (
          <>
            <FileHeader
              filename={history.find(h => h.id === currentFileId)?.filename || 'Untitled'}
              onFilenameChange={handleFilenameChange}
              onBack={handleBack}
            />

            {error && (
              <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
                {error}
              </div>
            )}

            {showApiInput && (
              <div className="mb-6 p-4 bg-white rounded-lg shadow-sm border border-gray-200">
                <form onSubmit={handleApiKeySubmit} className="flex gap-4 items-center">
                  <div className="flex-1">
                    <label htmlFor="apiKey" className="block text-sm font-medium text-gray-700 mb-1">
                      OpenAI API Key
                    </label>
                    <div className="relative">
                      <Key className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="password"
                        id="apiKey"
                        value={apiKey}
                        onChange={(e) => setApiKey(e.target.value)}
                        className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        placeholder="sk-..."
                      />
                    </div>
                  </div>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors mt-6"
                  >
                    Save Key
                  </button>
                </form>
              </div>
            )}

            <div className="mb-6">
              <ParaphraseControls
                percentage={paraphrasePercentage}
                onPercentageChange={setParaphrasePercentage}
                onParaphrase={handleParaphrase}
                disabled={subtitles.length === 0}
                isLoading={isParaphrasing}
              />
            </div>

            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setShowParaphrasedOnly(!showParaphrasedOnly)}
                  className={`px-4 py-2 rounded-lg transition-colors ${
                    showParaphrasedOnly
                      ? 'bg-indigo-600 text-white'
                      : 'bg-white text-indigo-600 border border-indigo-600'
                  }`}
                >
                  {paraphrasedCount} Paraphrased
                </button>
              </div>
              <button
                onClick={downloadSubtitles}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <Save className="w-5 h-5" />
                Download VTT
              </button>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-12">ID</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-32">Start</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-32">End</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Text</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {displayedSubtitles.map((subtitle) => (
                      <SubtitleRow
                        key={subtitle.id}
                        subtitle={subtitle}
                        onSubtitleChange={handleSubtitleChange}
                        onToggleParaphrase={handleToggleParaphrase}
                        onParaphraseRow={handleParaphraseRow}
                        onDeleteRow={handleDeleteRow}
                        isLoading={paraphrasingRow === subtitle.id}
                      />
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        ) : (
          <>
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-2">
                <FileText className="w-8 h-8 text-indigo-600" />
                <h1 className="text-3xl font-bold text-gray-900">Subtitle Editor</h1>
              </div>
              <label className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 cursor-pointer transition-colors">
                <Upload className="w-5 h-5" />
                Upload Subtitles
                <input
                  type="file"
                  accept=".vtt,.srt"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            </div>

            <HistoryList
              history={history}
              onEdit={handleHistoryEdit}
              onDelete={handleHistoryDelete}
            />
          </>
        )}
      </div>
    </div>
  );
}