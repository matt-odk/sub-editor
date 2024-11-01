import React from 'react';
import { ArrowLeftRight, RefreshCw, Trash2 } from 'lucide-react';
import type { Subtitle } from '../types/subtitle';

interface SubtitleRowProps {
  subtitle: Subtitle;
  onSubtitleChange: (id: number, field: keyof Subtitle, value: string) => void;
  onToggleParaphrase: (id: number) => void;
  onParaphraseRow: (id: number) => Promise<void>;
  onDeleteRow: (id: number) => void;
  isLoading?: boolean;
}

export default function SubtitleRow({
  subtitle,
  onSubtitleChange,
  onToggleParaphrase,
  onParaphraseRow,
  onDeleteRow,
  isLoading
}: SubtitleRowProps) {
  const rowClassName = subtitle.isEdited || subtitle.isParaphrased 
    ? 'hover:bg-teal-200 bg-teal-200/50'
    : 'hover:bg-gray-50';

  return (
    <tr className={`${rowClassName} group`}>
      <td className="px-4 py-2 whitespace-nowrap text-xs text-gray-500 w-12">
        {subtitle.id}
      </td>
      <td className="px-4 py-2 whitespace-nowrap text-xs text-gray-500 w-32">
        {subtitle.startTime}
      </td>
      <td className="px-4 py-2 whitespace-nowrap text-xs text-gray-500 w-32">
        {subtitle.endTime}
      </td>
      <td className="p-2 text-sm text-gray-900">
        <div className="flex flex-col gap-2 min-h-[80px]">
          <textarea
            value={subtitle.isParaphrased && subtitle.paraphrasedText ? subtitle.paraphrasedText : subtitle.text}
            onChange={(e) => {
              onSubtitleChange(
                subtitle.id, 
                subtitle.isParaphrased ? 'paraphrasedText' : 'text',
                e.target.value
              );
              onSubtitleChange(subtitle.id, 'isEdited', 'true');
            }}
            className="flex-1 p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 resize-none"
          />
          <div className="flex justify-start gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
            {subtitle.paraphrasedText && (
              <button
                onClick={() => onToggleParaphrase(subtitle.id)}
                className="p-2 text-indigo-600 hover:text-indigo-800 transition-colors cursor-pointer"
                title="Toggle between original and paraphrased"
              >
                <ArrowLeftRight className="w-5 h-5" />
              </button>
            )}
            <button
              onClick={() => onParaphraseRow(subtitle.id)}
              disabled={isLoading}
              className="p-2 text-green-600 hover:text-green-800 transition-colors cursor-pointer"
              title="Paraphrase this subtitle"
            >
              <RefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={() => onDeleteRow(subtitle.id)}
              className="p-2 text-red-600 hover:text-red-800 transition-colors cursor-pointer"
              title="Delete this subtitle"
            >
              <Trash2 className="w-5 h-5" />
            </button>
          </div>
        </div>
      </td>
    </tr>
  );
}