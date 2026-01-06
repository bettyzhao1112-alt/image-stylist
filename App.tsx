
import React, { useState, useCallback } from 'react';
import { processImageStyle } from './services/geminiService';
import { GeneratedImage, STYLES, AppStatus } from './types';

// Components
const Header: React.FC = () => (
  <header className="py-8 text-center bg-slate-900 border-b border-slate-800 sticky top-0 z-50 shadow-lg">
    <h1 className="text-4xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-emerald-400">
      Gemini Stylist
    </h1>
    <p className="text-slate-400 mt-2">Transform your photos into 5 artistic masterpieces</p>
  </header>
);

const ImagePreview: React.FC<{ url: string | null; onClear: () => void }> = ({ url, onClear }) => {
  if (!url) return null;
  return (
    <div className="relative group max-w-sm mx-auto my-6">
      <img src={url} alt="Source" className="rounded-xl shadow-2xl border-4 border-slate-700 w-full object-cover aspect-square" />
      <button 
        onClick={onClear}
        className="absolute -top-3 -right-3 bg-red-500 hover:bg-red-600 text-white rounded-full p-2 shadow-lg transition-transform group-hover:scale-110"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
        </svg>
      </button>
      <div className="absolute bottom-3 left-3 bg-slate-900/80 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold text-blue-400">
        Source Image
      </div>
    </div>
  );
};

const App: React.FC = () => {
  const [sourceImage, setSourceImage] = useState<string | null>(null);
  const [mimeType, setMimeType] = useState<string>('');
  const [base64, setBase64] = useState<string>('');
  const [results, setResults] = useState<GeneratedImage[]>([]);
  const [customPrompt, setCustomPrompt] = useState('');
  const [status, setStatus] = useState<AppStatus>(AppStatus.IDLE);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setMimeType(file.type);
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        setSourceImage(result);
        setBase64(result.split(',')[1]);
        setResults([]);
        setError(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const generateStyles = async () => {
    if (!base64) return;
    
    setStatus(AppStatus.PROCESSING);
    setError(null);
    
    // Initialize placeholders
    const placeholders: GeneratedImage[] = STYLES.map((s, idx) => ({
      id: `style-${idx}`,
      url: '',
      style: s.name,
      isLoading: true
    }));
    setResults(placeholders);

    // Parallel execution for better UX
    const promises = STYLES.map(async (styleObj, index) => {
      try {
        const resultUrl = await processImageStyle(base64, mimeType, styleObj.prompt);
        if (resultUrl) {
          setResults(prev => prev.map((item, idx) => 
            idx === index ? { ...item, url: resultUrl, isLoading: false } : item
          ));
        }
      } catch (err) {
        console.error(`Failed to generate ${styleObj.name}`, err);
        setResults(prev => prev.map((item, idx) => 
          idx === index ? { ...item, isLoading: false, url: 'ERROR' } : item
        ));
      }
    });

    await Promise.allSettled(promises);
    setStatus(AppStatus.IDLE);
  };

  const applyCustomEdit = async () => {
    if (!base64 || !customPrompt.trim()) return;
    
    setStatus(AppStatus.PROCESSING);
    setError(null);
    
    const customResult: GeneratedImage = {
      id: `custom-${Date.now()}`,
      url: '',
      style: 'Custom Edit',
      isLoading: true
    };
    
    setResults(prev => [customResult, ...prev]);

    try {
      const resultUrl = await processImageStyle(base64, mimeType, customPrompt);
      if (resultUrl) {
        setResults(prev => prev.map(item => 
          item.id === customResult.id ? { ...item, url: resultUrl, isLoading: false } : item
        ));
      }
    } catch (err) {
      setError("Failed to apply custom edit. Please try again.");
      setResults(prev => prev.filter(item => item.id !== customResult.id));
    } finally {
      setStatus(AppStatus.IDLE);
      setCustomPrompt('');
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 font-sans">
      <Header />
      
      <main className="container mx-auto px-4 py-8 max-w-5xl">
        {/* Upload Section */}
        <section className="bg-slate-900 p-8 rounded-3xl border border-slate-800 shadow-xl mb-12">
          {!sourceImage ? (
            <div className="flex flex-col items-center justify-center border-2 border-dashed border-slate-700 rounded-2xl p-12 transition-colors hover:border-blue-500 group">
              <input 
                type="file" 
                accept="image/*" 
                onChange={handleFileChange}
                className="hidden" 
                id="file-upload" 
              />
              <label htmlFor="file-upload" className="cursor-pointer flex flex-col items-center">
                <div className="w-16 h-16 bg-blue-500/10 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <span className="text-xl font-semibold text-slate-200">Click to upload image</span>
                <p className="text-slate-500 text-sm mt-1">PNG, JPG or WebP (Max 5MB)</p>
              </label>
            </div>
          ) : (
            <div className="space-y-8">
              <ImagePreview url={sourceImage} onClear={() => {setSourceImage(null); setResults([]);}} />
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button
                  onClick={generateStyles}
                  disabled={status === AppStatus.PROCESSING}
                  className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-4 px-6 rounded-2xl shadow-lg transition-all flex items-center justify-center space-x-2"
                >
                  {status === AppStatus.PROCESSING ? (
                    <>
                      <svg className="animate-spin h-5 w-5 mr-3 text-white" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <span>Processing...</span>
                    </>
                  ) : (
                    <>
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                      </svg>
                      <span>Generate 5 Different Styles</span>
                    </>
                  )}
                </button>

                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={customPrompt}
                    onChange={(e) => setCustomPrompt(e.target.value)}
                    placeholder="E.g., 'Add a retro filter' or 'Convert to a sketch'..."
                    className="flex-grow bg-slate-800 border border-slate-700 rounded-2xl px-4 py-2 text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 placeholder:text-slate-600"
                    onKeyDown={(e) => e.key === 'Enter' && applyCustomEdit()}
                  />
                  <button
                    onClick={applyCustomEdit}
                    disabled={status === AppStatus.PROCESSING || !customPrompt.trim()}
                    className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white p-4 rounded-2xl transition-all shadow-md"
                    title="Apply Custom Edit"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          )}
        </section>

        {error && (
          <div className="bg-red-500/10 border border-red-500/50 text-red-500 p-4 rounded-2xl mb-8 flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            {error}
          </div>
        )}

        {/* Gallery Section */}
        {results.length > 0 && (
          <section>
            <h2 className="text-2xl font-bold mb-6 flex items-center">
              <span className="w-8 h-8 bg-blue-500 rounded-lg mr-3 flex items-center justify-center text-sm">✨</span>
              Creations
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {results.map((item) => (
                <div key={item.id} className="bg-slate-900 rounded-3xl overflow-hidden border border-slate-800 hover:border-slate-700 transition-all group shadow-lg">
                  <div className="aspect-square relative">
                    {item.isLoading ? (
                      <div className="w-full h-full skeleton flex items-center justify-center flex-col text-slate-400">
                        <div className="animate-pulse flex flex-col items-center">
                           <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 mb-2 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                           </svg>
                           <span className="text-xs font-mono">STYLIZING...</span>
                        </div>
                      </div>
                    ) : item.url === 'ERROR' ? (
                      <div className="w-full h-full bg-slate-800 flex items-center justify-center p-6 text-center text-red-400 text-sm">
                        Failed to generate this style. Please try again.
                      </div>
                    ) : (
                      <img 
                        src={item.url} 
                        alt={item.style} 
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" 
                      />
                    )}
                  </div>
                  <div className="p-4 flex justify-between items-center bg-slate-900/50 backdrop-blur-sm border-t border-slate-800">
                    <span className="font-semibold text-slate-300">{item.style}</span>
                    {item.url && item.url !== 'ERROR' && (
                      <a 
                        href={item.url} 
                        download={`stylized-${item.style}.png`}
                        className="p-2 bg-slate-800 hover:bg-slate-700 rounded-xl transition-colors text-blue-400"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </main>
      
      <footer className="py-12 text-center text-slate-600 text-sm">
        <p>Built with Gemini 2.5 Flash Image & React</p>
      </footer>
    </div>
  );
};

export default App;
