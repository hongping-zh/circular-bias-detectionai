
import React, { useState, useCallback, useRef } from 'react';
import { EXAMPLE_GENERATED_TEXT, EXAMPLE_REFERENCE_TEXT } from './constants';
import type { AnalysisResult, FullAnalysisResult } from './types';
import { detectCircularBias } from './services/geminiService';
import Header from './components/Header';
import TextAreaInput from './components/TextAreaInput';
import Button from './components/Button';
import ResultsDisplay from './components/ResultsDisplay';
import Loader from './components/Loader';
import { RefreshCw, Trash2, TestTube, Upload, Download } from 'lucide-react';

const App: React.FC = () => {
  const [generatedText, setGeneratedText] = useState<string>('');
  const [referenceText, setReferenceText] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [batchResults, setBatchResults] = useState<FullAnalysisResult[]>([]);
  const [progress, setProgress] = useState<{ current: number; total: number } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);


  const handleLoadExample = useCallback(() => {
    setGeneratedText(EXAMPLE_GENERATED_TEXT);
    setReferenceText(EXAMPLE_REFERENCE_TEXT);
    setResult(null);
    setError(null);
    setBatchResults([]);
    setProgress(null);
  }, []);

  const handleClear = useCallback(() => {
    setGeneratedText('');
    setReferenceText('');
    setResult(null);
    setError(null);
    setBatchResults([]);
    setProgress(null);
    if(fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, []);

  const handleSubmit = async () => {
    if (!generatedText.trim() || !referenceText.trim()) {
      setError('Both text fields must be filled.');
      return;
    }
    setIsLoading(true);
    setError(null);
    setResult(null);
    setBatchResults([]);
    setProgress(null);
    try {
      const analysisResult = await detectCircularBias(generatedText, referenceText);
      setResult(analysisResult);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred.');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsLoading(true);
    setError(null);
    setResult(null);
    setBatchResults([]);
    setProgress(null);

    const reader = new FileReader();
    reader.onload = async (e) => {
        const text = e.target?.result as string;
        const rows = text.split(/\r?\n/).filter(row => row.trim() !== '');
        if (rows.length < 2) {
          setError('CSV file must contain a header and at least one data row.');
          setIsLoading(false);
          return;
        }

        const header = rows[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
        const generatedTextIndex = header.indexOf('generated_text');
        const referenceTextIndex = header.indexOf('reference_text');

        if (generatedTextIndex === -1 || referenceTextIndex === -1) {
          setError('CSV must have "generated_text" and "reference_text" columns.');
          setIsLoading(false);
          return;
        }

        const dataRows = rows.slice(1);
        setProgress({ current: 0, total: dataRows.length });

        const newBatchResults: FullAnalysisResult[] = [];
        for (let i = 0; i < dataRows.length; i++) {
          const row = dataRows[i];
          const values = row.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map(v => v.trim().replace(/^"|"$/g, ''));
          
          if (values.length <= Math.max(generatedTextIndex, referenceTextIndex)) {
            console.warn(`Skipping malformed CSV row: ${i + 1}`);
            continue;
          }

          const genText = values[generatedTextIndex] || '';
          const refText = values[referenceTextIndex] || '';

          setProgress({ current: i + 1, total: dataRows.length });

          try {
            const analysisResult = await detectCircularBias(genText, refText);
            newBatchResults.push({
              ...analysisResult,
              originalGeneratedText: genText,
              originalReferenceText: refText,
            });
          } catch (err) {
            console.error(`Error processing row ${i + 1}:`, err);
            newBatchResults.push({
              score: -1,
              explanation: `Failed to process row: ${err instanceof Error ? err.message : 'Unknown error'}`,
              highlightedText: genText,
              originalGeneratedText: genText,
              originalReferenceText: refText,
            });
          }
        }
        setBatchResults(newBatchResults);
        setIsLoading(false);
        setProgress(null);
    };
    reader.readAsText(file);
  };

  const handleDownload = () => {
    if (batchResults.length === 0) return;

    const headers = ['originalGeneratedText', 'originalReferenceText', 'score', 'explanation'];
    const csvContent = [
        headers.join(','),
        ...batchResults.map(item => [
            JSON.stringify(item.originalGeneratedText),
            JSON.stringify(item.originalReferenceText),
            item.score,
            JSON.stringify(item.explanation),
        ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.href = url;
    link.setAttribute('download', 'analysis_results.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };


  return (
    <div className="min-h-screen bg-slate-900 text-slate-200 font-sans p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <Header />

        <main className="mt-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <TextAreaInput
              id="generated-text"
              label="Generated Text"
              value={generatedText}
              onChange={(e) => setGeneratedText(e.target.value)}
              placeholder="Paste the generated text here..."
            />
            <TextAreaInput
              id="reference-text"
              label="Reference Text"
              value={referenceText}
              onChange={(e) => setReferenceText(e.target.value)}
              placeholder="Paste the reference text or source material here..."
            />
          </div>

          <div className="mt-6 flex flex-wrap gap-4 items-center justify-center">
            <Button onClick={handleSubmit} disabled={isLoading} variant="primary">
              {isLoading && !progress ? (
                <>
                  <Loader className="w-5 h-5 mr-2" />
                  Analyzing...
                </>
              ) : (
                <>
                  <TestTube className="w-5 h-5 mr-2" />
                  Submit for Analysis
                </>
              )}
            </Button>
            <Button onClick={handleUploadClick} disabled={isLoading} variant="secondary">
              <Upload className="w-5 h-5 mr-2" />
              Upload CSV
            </Button>
            <Button onClick={handleLoadExample} disabled={isLoading} variant="secondary">
              <RefreshCw className="w-5 h-5 mr-2" />
              Load Example
            </Button>
            <Button onClick={handleClear} disabled={isLoading} variant="danger">
               <Trash2 className="w-5 h-5 mr-2" />
              Clear
            </Button>
            {batchResults.length > 0 && !isLoading && (
              <Button onClick={handleDownload} variant="secondary">
                <Download className="w-5 h-5 mr-2" />
                Download Results
              </Button>
            )}
          </div>
          
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept=".csv"
            className="hidden"
          />

          {isLoading && progress && (
            <div className="mt-8 text-center max-w-2xl mx-auto">
                <p className="text-lg text-cyan-300">Analyzing {progress.current} of {progress.total} rows...</p>
                <div className="w-full bg-slate-700 rounded-full h-2.5 mt-2 overflow-hidden">
                    <div className="bg-cyan-400 h-2.5 rounded-full transition-all duration-300 ease-linear" style={{ width: `${(progress.current / progress.total) * 100}%` }}></div>
                </div>
            </div>
           )}

          {!isLoading && batchResults.length > 0 && (
            <div className="mt-8 text-center bg-green-900/50 border border-green-700 text-green-300 p-4 rounded-lg max-w-2xl mx-auto">
              <p>
                <strong>Batch analysis complete for {batchResults.length} items.</strong> Click "Download Results" to save.
              </p>
            </div>
          )}

          {error && (
            <div className="mt-8 text-center bg-red-900/50 border border-red-700 text-red-300 p-4 rounded-lg max-w-2xl mx-auto">
              <p>
                <strong>Error:</strong> {error}
              </p>
            </div>
          )}

          {result && !isLoading && (
            <div className="mt-12">
              <ResultsDisplay result={result} />
            </div>
          )}
        </main>
        
        <footer className="text-center mt-12 text-slate-500 text-sm">
            <p>Powered by Google Gemini. UI/UX designed by a world-class React engineer.</p>
        </footer>
      </div>
    </div>
  );
};

export default App;
