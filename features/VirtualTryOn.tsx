import React, { useState, useMemo } from 'react';
import type { ImageData } from '../types';
import { generateVirtualTryOn, upscaleImage } from '../services/geminiService';
import { Loader } from '../components/Loader';
import { Icon } from '../components/icons';
import { ImageUploader } from '../components/ImageUploader';
import { useNotification } from '../contexts/NotificationContext';

const VirtualTryOn: React.FC = () => {
    const [productImage, setProductImage] = useState<ImageData | null>(null);
    const [modelImage, setModelImage] = useState<ImageData | null>(null);
    const [resultImage, setResultImage] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isUpscaling, setIsUpscaling] = useState(false);
    const [mobileTab, setMobileTab] = useState<'controls' | 'result'>('controls');
    const { addToast } = useNotification();

    const canGenerate = useMemo(() => productImage && modelImage && !isLoading, [productImage, modelImage, isLoading]);

    const handleGenerate = async () => {
        if (!canGenerate) return;
        setIsLoading(true);
        setResultImage(null);
        if (window.innerWidth < 768) {
            setMobileTab('result');
        }
        try {
            const generatedBase64 = await generateVirtualTryOn(productImage!, modelImage!);
            setResultImage(`data:image/png;base64,${generatedBase64}`);
        } catch (err) {
            console.error("Virtual Try-On generation failed:", err);
            addToast('Failed to create virtual try-on. Please try again.', 'error');
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleUpscale = async () => {
        if (!resultImage) return;
        setIsUpscaling(true);
        try {
            const [header, base64Data] = resultImage.split(',');
            const mimeType = header.match(/:(.*?);/)?.[1] || 'image/png';
            const originalPrompt = "A model wearing a product in a photorealistic style.";
            const upscaledBase64 = await upscaleImage({ base64: base64Data, mimeType }, originalPrompt);
            setResultImage(`data:image/png;base64,${upscaledBase64}`);
            addToast('Image upscaled to HD!', 'success');
        } catch (error) {
            console.error("Error upscaling image:", error);
            addToast('Failed to upscale image. Please try again.', 'error');
        } finally {
            setIsUpscaling(false);
        }
    };

    const Controls = () => (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
            <div>
                <h3 className="text-xl font-bold mb-3 text-slate-800 dark:text-slate-100">1. Upload Product Image</h3>
                <ImageUploader id="vto-product-uploader" iconName="box" label="Upload Product" onImageUpload={setProductImage} />
            </div>
            <div>
                <h3 className="text-xl font-bold mb-3 text-slate-800 dark:text-slate-100">2. Upload Model Photo</h3>
                <ImageUploader id="vto-model-uploader" iconName="user" label="Upload Model" onImageUpload={setModelImage} />
            </div>
        </div>
    );

    const ResultDisplay: React.FC = () => {
        if (isLoading) {
            return (
                <div className="mt-12 text-center p-8">
                    <Loader size="lg" className="mx-auto" />
                    <p className="mt-4 text-slate-500 dark:text-slate-400 font-semibold">Placing product on model...</p>
                    <p className="mt-2 text-sm text-slate-400 dark:text-slate-500">This may take a moment.</p>
                </div>
            );
        }

        if (resultImage) {
            return (
                <div className="mt-12">
                    <h2 className="text-2xl font-bold text-center mb-6 text-slate-800 dark:text-slate-100">Your Virtual Try-On Result</h2>
                    <div className="max-w-md mx-auto bg-white dark:bg-slate-800 rounded-2xl overflow-hidden border border-gray-200 dark:border-slate-700 transition-all shadow-lg hover:shadow-cyan-500/20">
                        <div className="relative">
                            <img src={resultImage} alt="Virtual Try-On Result" className="w-full h-auto object-cover" />
                             {isUpscaling && (
                                <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center z-10">
                                    <Loader size="md" />
                                    <p className="text-white text-sm font-semibold mt-2">Upscaling to HD...</p>
                                </div>
                            )}
                        </div>
                        <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border-t border-gray-200 dark:border-slate-700 flex justify-center items-center gap-3">
                            <button onClick={handleUpscale} disabled={isUpscaling} className="inline-flex items-center bg-slate-600 text-white text-sm font-semibold py-2 px-4 rounded-xl hover:bg-slate-700 transition-colors shadow-md disabled:opacity-50">
                                {isUpscaling ? <Loader size="sm" className="mr-2" /> : <Icon name="wand" className="w-4 h-4 mr-2" />}
                                {isUpscaling ? 'Upscaling...' : 'Tingkatkan ke HD'}
                            </button>
                            <a href={resultImage} download="aisthetic_vto_result.png" className="inline-flex items-center bg-cyan-500 text-white text-sm font-semibold py-2 px-4 rounded-xl hover:bg-cyan-600 transition-colors shadow-md shadow-cyan-500/20">
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
                 <p className="text-slate-500 dark:text-slate-400">Upload a product and a model photo, and our AI will dress the model with your product.</p>
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
                        {isLoading ? <Loader /> : <Icon name="wand" className="w-5 h-5 mr-2" />}
                        {isLoading ? 'Generating...' : 'Create Try-On'}
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

export default VirtualTryOn;