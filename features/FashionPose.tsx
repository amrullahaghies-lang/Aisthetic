import React, { useState, useMemo } from 'react';
import type { ImageData } from '../types';
import { generateFashionPose, upscaleImage } from '../services/geminiService';
import { Loader } from '../components/Loader';
import { Icon } from '../components/icons';
import { ImageUploader } from '../components/ImageUploader';
import { useNotification } from '../contexts/NotificationContext';

const FashionPose: React.FC = () => {
    const [modelImage, setModelImage] = useState<ImageData | null>(null);
    const [poseInput, setPoseInput] = useState('');
    const [resultImage, setResultImage] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isUpscaling, setIsUpscaling] = useState(false);
    const { addToast } = useNotification();

    const canGenerate = useMemo(() => modelImage && poseInput.trim() && !isLoading, [modelImage, poseInput, isLoading]);
    
    const handleGenerate = async () => {
        if (!canGenerate) return;
        setIsLoading(true);
        setResultImage(null);
        try {
            const generatedBase64 = await generateFashionPose(modelImage!, poseInput);
            setResultImage(`data:image/png;base64,${generatedBase64}`);
        } catch (err) {
            console.error("Fashion Pose generation failed:", err);
            addToast('Failed to create pose. Please try again.', 'error');
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
            const originalPrompt = `Model in a new pose: ${poseInput}`;
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

    const ResultCard: React.FC = () => {
        let content;
        if (isLoading) {
            content = (
                <div className="text-center p-8">
                    <Loader size="lg" className="mx-auto" />
                    <p className="mt-4 text-slate-500 dark:text-slate-400 font-semibold">Generating new pose...</p>
                </div>
            );
        } else if (resultImage) {
            content = (
                <div className="bg-white dark:bg-slate-800 rounded-2xl overflow-hidden border border-gray-200 dark:border-slate-700 transition-all shadow-lg">
                    <div className="relative">
                        <img src={resultImage} alt={`Pose: ${poseInput}`} className="w-full h-auto object-cover aspect-[3/4]" />
                        {isUpscaling && (
                            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center z-10">
                                <Loader size="md" />
                                <p className="text-white text-sm font-semibold mt-2">Upscaling to HD...</p>
                            </div>
                        )}
                    </div>
                    <div className="p-3 bg-slate-50 dark:bg-slate-800/50 border-t border-gray-200 dark:border-slate-700 flex justify-center items-center gap-3">
                        <button onClick={handleUpscale} disabled={isUpscaling} className="inline-flex items-center bg-slate-600 text-white text-sm font-semibold py-2 px-4 rounded-xl hover:bg-slate-700 transition-colors shadow-md disabled:opacity-50">
                            {isUpscaling ? <Loader size="sm" className="mr-2" /> : <Icon name="wand" className="w-4 h-4 mr-2" />}
                            {isUpscaling ? 'Upscaling...' : 'Tingkatkan ke HD'}
                        </button>
                        <a href={resultImage} download={`aisthetic_pose_${poseInput.replace(/\s/g, '_')}.png`} className="inline-flex items-center bg-cyan-500 text-white text-sm font-semibold py-2 px-4 rounded-xl hover:bg-cyan-600 transition-colors shadow-md shadow-cyan-500/20">
                            <Icon name="download" className="w-4 h-4 mr-2" />
                            Download
                        </a>
                    </div>
                </div>
            );
        } else {
            return null;
        }

        return (
            <div className="mt-12">
                <h2 className="text-2xl font-bold text-center mb-6 text-slate-800 dark:text-slate-100">
                    {isLoading ? 'AI is working, please wait...' : 'Generated Result'}
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 justify-center">
                   <div className="sm:col-start-2 md:col-start-2 flex justify-center">
                        {content}
                   </div>
                </div>
            </div>
        );
    };

    return (
        <div className="bg-white dark:bg-slate-800/50 rounded-3xl shadow-xl p-6 md:p-10 w-full border border-gray-200 dark:border-slate-700 mx-auto max-w-4xl">
            <div className="text-center mb-8">
                 <p className="text-slate-500 dark:text-slate-400">Upload a photo, describe a pose, and let our AI bring it to life.</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
                 <div>
                    <h3 className="text-xl font-bold mb-3 text-slate-800 dark:text-slate-100">1. Upload Model Photo</h3>
                    <ImageUploader id="fashion-pose-uploader" iconName="cloudUpload" label="Click or drag image" onImageUpload={setModelImage} />
                </div>
                <div>
                    <h3 className="text-xl font-bold mb-3 text-slate-800 dark:text-slate-100">2. Describe The Pose</h3>
                    <textarea 
                        id="fp-poseInput" 
                        value={poseInput}
                        onChange={(e) => setPoseInput(e.target.value)}
                        className="w-full p-4 bg-slate-100 dark:bg-slate-700 rounded-2xl text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-400 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 focus:outline-none transition" 
                        rows={5} 
                        placeholder="e.g., 'Dynamic pose with one hand on hip...', 'Standing tall with legs crossed', 'Sitting in a chair looking seriously at the camera'"
                    />
                </div>
            </div>

            <div className="mt-8 text-center">
                <button 
                    onClick={handleGenerate} 
                    disabled={!canGenerate} 
                    className="bg-cyan-500 text-white font-bold py-3 px-8 rounded-xl hover:bg-cyan-600 transition-all disabled:bg-slate-300 dark:disabled:bg-slate-700 disabled:cursor-not-allowed disabled:text-slate-500 shadow-lg shadow-cyan-500/30 focus:ring-4 focus:ring-cyan-500/50"
                >
                    <span className="flex items-center justify-center">
                        {isLoading ? <Loader /> : <Icon name="sparkles" className="w-5 h-5 mr-2" />}
                        {isLoading ? 'Generating...' : 'Create Pose'}
                    </span>
                </button>
            </div>
            
            <ResultCard />
        </div>
    );
};

export default FashionPose;