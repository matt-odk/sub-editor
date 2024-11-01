import React from 'react';
import { Edit2, Trash2 } from 'lucide-react';
import type { SubtitleHistory } from '../types/subtitle';

interface HistoryListProps {
  history: SubtitleHistory[];
  onEdit: (history: SubtitleHistory) => void;
  onDelete: (id: string) => void;
}

export default function HistoryList({ history, onEdit, onDelete }: HistoryListProps) {
  if (history.length === 0) {
    return null;
  }

  return (
    <div className="mb-8">
      <h2 className="text-xl font-semibold mb-4">Recent Files</h2>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {history.map((item) => (
          <div key={item.id} className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
            <div className="flex justify-between items-start mb-2">
              <div>
                <h3 className="font-medium text-gray-900">{item.filename}</h3>
                <p className="text-sm text-gray-500">
                  {new Date(item.timestamp).toLocaleDateString()}
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => onEdit(item)}
                  className="p-2 text-indigo-600 hover:text-indigo-800 transition-colors"
                  title="Edit this file"
                >
                  <Edit2 className="w-5 h-5" />
                </button>
                <button
                  onClick={() => onDelete(item.id)}
                  className="p-2 text-red-600 hover:text-red-800 transition-colors"
                  title="Delete from history"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            </div>
            <div className="text-sm text-gray-600">
              <p>{item.editedSubtitles.length} subtitles</p>
              <p>{item.editedSubtitles.filter(s => s.isParaphrased).length} paraphrased</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}