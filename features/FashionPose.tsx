import React, { useState, useMemo } from 'react';
import type { ImageData } from '../types';
import { generateFashionPose } from '../services/geminiService';
import { Loader } from '../components/Loader';
import { Icon } from '../components/icons';
import { ImageUploader } from '../components/ImageUploader';

const FashionPose: React.FC = () => {
    const [modelImage, setModelImage] = useState<ImageData | null>(null);
    const [poseInput, setPoseInput] = useState('');
    const [resultImage, setResultImage] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const canGenerate = useMemo(() => modelImage && poseInput.trim() && !isLoading, [modelImage, poseInput, isLoading]);
    
    const handleGenerate = async () => {
        if (!canGenerate) return;
        setIsLoading(true);
        setError('');
        setResultImage(null);
        try {
            const generatedBase64 = await generateFashionPose(modelImage!, poseInput);
            setResultImage(`data:image/png;base64,${generatedBase64}`);
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
            setError(`Failed to create pose: ${errorMessage}`);
            console.error("Fashion Pose generation failed:", err);
        } finally {
            setIsLoading(false);
        }
    };
    
    const ResultCard: React.FC = () => {
        let content;
        if (isLoading) {
            content = (
                <div className="text-center p-8">
                    <Loader size="lg" className="mx-auto" />
                    <p className="mt-4 text-slate-500 font-semibold">Generating new pose...</p>
                </div>
            );
        } else if (error && !resultImage) { // Only show general error if no image is displayed
            content = (
                 <div className="text-center p-8 text-red-500 bg-red-50 rounded-2xl">
                    <Icon name="x" className="w-8 h-8 mx-auto mb-2" />
                    <p className="font-semibold">{error}</p>
                </div>
            );
        } else if (resultImage) {
            content = (
                <div className="bg-white rounded-2xl overflow-hidden border border-gray-200 transition-all shadow-lg">
                    <img src={resultImage} alt={`Pose: ${poseInput}`} className="w-full h-auto object-cover aspect-[3/4]" />
                    <div className="p-3 text-center bg-slate-50 border-t border-gray-200">
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
                <h2 className="text-2xl font-bold text-center mb-6 text-slate-800">
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
        <div className="bg-white rounded-3xl shadow-xl p-6 md:p-10 w-full border border-gray-200 mx-auto max-w-4xl">
            <div className="text-center mb-8">
                 <p className="text-slate-500">Upload a photo, describe a pose, and let our AI bring it to life.</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
                 <div>
                    <h3 className="text-xl font-bold mb-3 text-slate-800">1. Upload Model Photo</h3>
                    <ImageUploader id="fashion-pose-uploader" iconName="cloudUpload" label="Click or drag image" onImageUpload={setModelImage} />
                </div>
                <div>
                    <h3 className="text-xl font-bold mb-3 text-slate-800">2. Describe The Pose</h3>
                    <textarea 
                        id="fp-poseInput" 
                        value={poseInput}
                        onChange={(e) => setPoseInput(e.target.value)}
                        className="w-full p-4 bg-slate-100 rounded-2xl text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 focus:outline-none transition" 
                        rows={5} 
                        placeholder="e.g., 'Dynamic pose with one hand on hip...', 'Standing tall with legs crossed', 'Sitting in a chair looking seriously at the camera'"
                    />
                </div>
            </div>

            <div className="mt-8 text-center">
                <button 
                    onClick={handleGenerate} 
                    disabled={!canGenerate} 
                    className="bg-cyan-500 text-white font-bold py-3 px-8 rounded-xl hover:bg-cyan-600 transition-all disabled:bg-slate-200 disabled:cursor-not-allowed disabled:text-slate-500 shadow-lg shadow-cyan-500/30 focus:ring-4 focus:ring-cyan-500/50"
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