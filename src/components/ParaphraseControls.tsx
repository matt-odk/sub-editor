import React from 'react';
import { RefreshCw } from 'lucide-react';

interface ParaphraseControlsProps {
  percentage: number;
  onPercentageChange: (value: number) => void;
  onParaphrase: () => Promise<void>;
  disabled: boolean;
  isLoading: boolean;
}

export default function ParaphraseControls({
  percentage,
  onPercentageChange,
  onParaphrase,
  disabled,
  isLoading
}: ParaphraseControlsProps) {
  return (
    <div className="flex items-center gap-4 p-4 bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="flex-1">
        <label htmlFor="percentage" className="block text-sm font-medium text-gray-700 mb-1">
          Paraphrase Percentage
        </label>
        <div className="flex items-center gap-4">
          <input
            type="range"
            id="percentage"
            min="1"
            max="100"
            value={percentage}
            onChange={(e) => onPercentageChange(Number(e.target.value))}
            className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
          />
          <span className="text-sm text-gray-600 w-12">{percentage}%</span>
        </div>
      </div>
      <button
        onClick={onParaphrase}
        disabled={disabled || isLoading}
        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-white transition-colors ${
          disabled || isLoading ? 'bg-gray-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700'
        }`}
      >
        <RefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
        {isLoading ? 'Paraphrasing...' : 'Paraphrase'}
      </button>
    </div>
  );
}