
import React from 'react';
import type { AnalysisResult } from '../types';

interface ResultsDisplayProps {
  result: AnalysisResult;
}

const ResultsDisplay: React.FC<ResultsDisplayProps> = ({ result }) => {
  const scoreColorClass = result.score >= 0.7 
    ? 'text-red-400' 
    : result.score >= 0.4 
    ? 'text-yellow-400' 
    : 'text-green-400';

  return (
    <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6 md:p-8 space-y-8 animate-fade-in">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-slate-300">Analysis Results</h2>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-center">
        <div className="flex flex-col items-center justify-center bg-slate-900 p-6 rounded-lg border border-slate-700 h-full">
          <h3 className="text-lg font-semibold text-slate-400 mb-2">Circularity Score</h3>
          <p className={`text-7xl font-bold ${scoreColorClass}`}>
            {(result.score * 100).toFixed(0)}
            <span className="text-4xl text-slate-500">%</span>
          </p>
        </div>
        
        <div className="md:col-span-2">
            <h3 className="text-lg font-semibold text-slate-300 mb-3">Explanation</h3>
            <div className="bg-slate-900 p-4 rounded-lg border border-slate-700 text-slate-300 prose prose-invert prose-p:my-2">
                <p>{result.explanation}</p>
            </div>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold text-slate-300 mb-3">Highlighted Text</h3>
        <div 
          className="bg-slate-900 p-4 rounded-lg border border-slate-700 text-slate-300 leading-relaxed"
        >
          <p
            dangerouslySetInnerHTML={{
              __html: result.highlightedText.replace(/<mark>/g, '<mark class="bg-purple-500/30 text-purple-200 rounded px-1 py-0.5">').replace(/\n/g, '<br />'),
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default ResultsDisplay;
