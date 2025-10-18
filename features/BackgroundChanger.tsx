import React, { useState, useMemo } from 'react';
import type { ImageData } from '../types';
import { changeImageBackground } from '../services/geminiService';
import { Loader } from '../components/Loader';
import { Icon } from '../components/icons';
import { ImageUploader } from '../components/ImageUploader';
import { useNotification } from '../contexts/NotificationContext';

const BackgroundChanger: React.FC = () => {
    const [productImage, setProductImage] = useState<ImageData | null>(null);
    const [backgroundPrompt, setBackgroundPrompt] = useState('');
    const [resultImage, setResultImage] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [mobileTab, setMobileTab] = useState<'controls' | 'result'>('controls');
    const { addToast } = useNotification();

    const canGenerate = useMemo(() => productImage && backgroundPrompt.trim() && !isLoading, [productImage, backgroundPrompt, isLoading]);

    const handleGenerate = async () => {
        if (!canGenerate) return;
        setIsLoading(true);
        setResultImage(null);
        if (window.innerWidth < 768) {
            setMobileTab('result');
        }
        try {
            const generatedBase64 = await changeImageBackground(productImage!, backgroundPrompt);
            setResultImage(`data:image/png;base64,${generatedBase64}`);
        } catch (err) {
            console.error("Background change generation failed:", err);
            addToast('Failed to change background. Please try again.', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    const Controls = () => (
         <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
            <div>
                <h3 className="text-xl font-bold mb-3 text-slate-800 dark:text-slate-100">1. Upload Product Photo</h3>
                <ImageUploader id="bg-changer-uploader" iconName="imagePlus" label="Click or drag image" onImageUpload={setProductImage} />
            </div>
            <div>
                <h3 className="text-xl font-bold mb-3 text-slate-800 dark:text-slate-100">2. Describe New Background</h3>
                <textarea 
                    id="bg-changer-prompt" 
                    value={backgroundPrompt}
                    onChange={(e) => setBackgroundPrompt(e.target.value)}
                    className="w-full p-4 bg-slate-100 dark:bg-slate-700 rounded-2xl text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-400 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 focus:outline-none transition" 
                    rows={5} 
                    placeholder="e.g., 'A beautiful beach at sunset', 'On a marble countertop with soft lighting', 'Floating in a galaxy of stars'"
                />
            </div>
        </div>
    );

    const ResultDisplay = () => {
        if (isLoading) {
            return (
                <div className="mt-12 text-center p-8">
                    <Loader size="lg" className="mx-auto" />
                    <p className="mt-4 text-slate-500 dark:text-slate-400 font-semibold">Changing background...</p>
                    <p className="mt-2 text-sm text-slate-400 dark:text-slate-500">This could take a few moments.</p>
                </div>
            );
        }

        if (resultImage) {
            return (
                <div className="mt-12">
                    <h2 className="text-2xl font-bold text-center mb-6 text-slate-800 dark:text-slate-100">Your New Background</h2>
                    <div className="max-w-md mx-auto bg-white dark:bg-slate-800 rounded-2xl overflow-hidden border border-gray-200 dark:border-slate-700 transition-all shadow-lg hover:shadow-cyan-500/20">
                        <img src={resultImage} alt={`New background: ${backgroundPrompt}`} className="w-full h-auto object-cover" />
                        <div className="p-4 text-center bg-slate-50 dark:bg-slate-800/50 border-t border-gray-200 dark:border-slate-700">
                            <a href={resultImage} download={`aisthetic_background_${backgroundPrompt.replace(/\s/g, '_')}.png`} className="inline-flex items-center bg-cyan-500 text-white text-sm font-semibold py-2 px-4 rounded-xl hover:bg-cyan-600 transition-colors shadow-md shadow-cyan-500/20">
                                <Icon name="download" className="w-4 h-4 mr-2" />
                                Download Image
                            </a>
                        </div>
                    </div>
                </div>
            );
        }
        
        // Placeholder for mobile view before results
        if (!isLoading && !resultImage) {
             return (
                <div className="mt-12 text-center p-8">
                    <Icon name="wand" className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto" />
                    <p className="mt-4 text-slate-500 dark:text-slate-400 font-semibold">Your generated image will appear here.</p>
                </div>
            );
        }

        return null;
    };

    return (
        <div className="bg-white dark:bg-slate-800/50 rounded-3xl shadow-xl p-6 md:p-10 w-full border border-gray-200 dark:border-slate-700 mx-auto max-w-5xl">
            <div className="text-center mb-8">
                 <p className="text-slate-500 dark:text-slate-400">Upload a product photo, describe a new background, and let AI do the magic.</p>
            </div>
            
             {/* Mobile Tab Navigation */}
            <div className="md:hidden mb-6">
                <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                    <button onClick={() => setMobileTab('controls')} className={`w-1/2 p-2 rounded-lg font-bold text-sm transition-colors ${mobileTab === 'controls' ? 'bg-white dark:bg-slate-700 text-cyan-500' : 'text-slate-600 dark:text-slate-300'}`}>
                        Controls
                    </button>
                     <button onClick={() => setMobileTab('result')} className={`w-1/2 p-2 rounded-lg font-bold text-sm transition-colors ${mobileTab === 'result' ? 'bg-white dark:bg-slate-700 text-cyan-500' : 'text-slate-600 dark:text-slate-300'}`}>
                        Result
                    </button>
                </div>
            </div>

            {/* Desktop View */}
            <div className="hidden md:block">
                <Controls />
            </div>

             {/* Mobile View */}
            <div className="md:hidden">
                {mobileTab === 'controls' && <Controls />}
                {mobileTab === 'result' && <ResultDisplay />}
            </div>

            <div className={`mt-8 text-center ${mobileTab === 'result' && 'md:hidden'}`}>
                <button 
                    onClick={handleGenerate} 
                    disabled={!canGenerate} 
                    className="bg-cyan-500 text-white font-bold py-3 px-8 rounded-xl hover:bg-cyan-600 transition-all disabled:bg-slate-300 dark:disabled:bg-slate-700 disabled:cursor-not-allowed disabled:text-slate-500 shadow-lg shadow-cyan-500/30 focus:ring-4 focus:ring-cyan-500/50"
                >
                    <span className="flex items-center justify-center">
                        {isLoading ? <Loader /> : <Icon name="layers" className="w-5 h-5 mr-2" />}
                        {isLoading ? 'Generating...' : 'Change Background'}
                    </span>
                </button>
            </div>
            
             {/* Desktop Result Display */}
            <div className="hidden md:block">
                <ResultDisplay />
            </div>
        </div>
    );
};

export default BackgroundChanger;