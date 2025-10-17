import React, { useState, useMemo, useCallback } from 'react';
import { ImageUploader } from '../components/ImageUploader';
import { Loader } from '../components/Loader';
import { Icon } from '../components/icons';
import { Modal } from '../components/Modal';
import {
    generateProductDescription,
    generateProductPoses,
    generateImageFromPrompt,
    generateSocialCaption,
    generateVideoPrompt,
} from '../services/geminiService';
import type { ImageData, GeneratedImageResult } from '../types';

const ProductPhotography: React.FC = () => {
    const [productImage, setProductImage] = useState<ImageData | null>(null);
    const [modelImage, setModelImage] = useState<ImageData | null>(null);
    const [description, setDescription] = useState('');
    const [theme, setTheme] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [isDescLoading, setIsDescLoading] = useState(false);
    const [results, setResults] = useState<GeneratedImageResult[]>([]);
    const [status, setStatus] = useState('Generate 6 Product Shots');
    
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalContent, setModalContent] = useState({ title: '', body: <></> });

    const isGenerateButtonDisabled = useMemo(() => {
        return !productImage || !description.trim() || isGenerating;
    }, [productImage, description, isGenerating]);

    const handleGenerateDescription = async () => {
        if (!productImage) return;
        setIsDescLoading(true);
        try {
            const desc = await generateProductDescription(productImage);
            setDescription(desc);
        } catch (error) {
            console.error("Error generating description:", error);
            setDescription("Gagal membuat deskripsi. Coba lagi.");
        } finally {
            setIsDescLoading(false);
        }
    };

    const copyToClipboard = useCallback((text: string, buttonElement: HTMLButtonElement) => {
        navigator.clipboard.writeText(text).then(() => {
            const originalText = buttonElement.innerText;
            buttonElement.innerText = 'Copied!';
            setTimeout(() => {
                buttonElement.innerText = originalText;
            }, 2000);
        });
    }, []);

    const showModal = useCallback((title: string, body: React.ReactElement) => {
        setModalContent({ title, body });
        setIsModalOpen(true);
    }, []);

    const handleGenerate = async () => {
        if (!productImage || !description.trim()) return;
        setIsGenerating(true);
        setStatus('Analyzing...');
        setResults([]);

        try {
            const ideas = await generateProductPoses(productImage, description, modelImage, theme);
            setStatus('Creating visuals...');
            const initialResults = ideas.map((idea, index) => ({
                id: index,
                title: idea.title,
                prompt: idea.prompt,
                isLoading: true,
            }));
            setResults(initialResults);

            const generationPromises = ideas.map((idea, index) =>
                generateImageFromPrompt(idea.prompt, productImage, modelImage)
                .then(base64Data => {
                    setResults(prev => prev.map(r => r.id === index ? { ...r, imageUrl: `data:image/png;base64,${base64Data}`, isLoading: false } : r));
                })
                .catch(err => {
                    console.error(`Error generating image for prompt: ${idea.prompt}`, err);
                    setResults(prev => prev.map(r => r.id === index ? { ...r, error: 'Failed to generate.', isLoading: false } : r));
                })
            );
            await Promise.allSettled(generationPromises);

        } catch (error) {
            console.error("Error during generation process:", error);
            setResults([]); // Clear results on major error
        } finally {
            setIsGenerating(false);
            setStatus('Generate 6 Product Shots');
        }
    };
    
    const handleActionClick = async (type: 'caption' | 'video', result: GeneratedImageResult) => {
        if (!result.imageUrl) return;
        
        const loaderBody = (text: string) => (
            <div className="flex flex-col items-center gap-4">
                <Loader />
                <p className="text-slate-500">{text}</p>
            </div>
        );

        const apiCall = type === 'caption' ? generateSocialCaption : generateVideoPrompt;
        const title = type === 'caption' ? '✨ Social Media Caption' : '✨ Image-to-Video Prompt';
        const loadingText = type === 'caption' ? 'Brewing up a caption...' : 'Analyzing motion...';

        showModal(title, loaderBody(loadingText));

        try {
            const textContent = await apiCall(result.imageUrl, description, result.title);
            const contentBody = (
                <div>
                    <div id="modal-text-content" className="whitespace-pre-wrap bg-slate-100 p-4 rounded-xl text-slate-700 mb-4 font-mono text-sm">
                        {textContent}
                    </div>
                    <button
                        onClick={(e) => copyToClipboard(textContent, e.currentTarget as HTMLButtonElement)}
                        className="w-full bg-cyan-500 text-white font-bold py-2 px-4 rounded-xl flex items-center justify-center hover:bg-cyan-600 focus:ring-4 focus:ring-cyan-500/50"
                    >
                        <Icon name="copy" className="w-4 h-4 mr-2"/>
                        Copy Text
                    </button>
                </div>
            );
            showModal(title, contentBody);
        } catch (error) {
            console.error(`Error generating ${type}:`, error);
            showModal('Error', <p className="text-red-600">{`Failed to create ${type}. Please try again.`}</p>);
        }
    };


    const ResultCard: React.FC<{ result: GeneratedImageResult }> = ({ result }) => (
        <div className="bg-white border border-gray-200 rounded-2xl shadow-lg p-4 flex flex-col justify-between transition-all hover:shadow-cyan-500/20 hover:-translate-y-1">
            <h3 className="text-base font-bold text-slate-800 mb-3 truncate">{result.title}</h3>
            <div className="aspect-square bg-slate-100 rounded-xl flex items-center justify-center overflow-hidden">
                {result.isLoading && <Loader size="lg" />}
                {result.error && <p className="text-xs text-red-600 p-2 text-center font-semibold">{result.error}</p>}
                {result.imageUrl && (
                     <div className="relative w-full h-full group">
                        <img src={result.imageUrl} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" alt={result.title} />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                        <div className="absolute bottom-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0">
                           <button onClick={() => handleActionClick('video', result)} className="bg-white/90 text-slate-700 p-2 rounded-full hover:bg-white hover:text-cyan-500 backdrop-blur-sm shadow-md" title="Create Video Prompt">
                                <Icon name="video" className="h-5 w-5" />
                            </button>
                            <button onClick={() => handleActionClick('caption', result)} className="bg-white/90 text-slate-700 p-2 rounded-full hover:bg-white hover:text-cyan-500 backdrop-blur-sm shadow-md" title="Create Caption">
                                <Icon name="penSquare" className="h-5 w-5" />
                            </button>
                             <a href={result.imageUrl} download={`aisthetic_${result.title.replace(/\s+/g, '_')}.png`} className="bg-white/90 text-slate-700 p-2 rounded-full hover:bg-white hover:text-cyan-500 backdrop-blur-sm shadow-md" title="Download Image">
                                <Icon name="download" className="h-5 w-5" />
                            </a>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
    
    return (
      <>
        <main className="flex flex-col lg:flex-row gap-8">
            <div className="bg-white border border-gray-200 rounded-3xl shadow-xl p-6 w-full lg:w-1/3 lg:max-w-md flex-shrink-0 self-start">
                <div className="flex flex-col gap-6">
                    <div>
                        <h2 className="text-xl font-bold mb-3 text-slate-800">1. Upload Product Image</h2>
                        <ImageUploader id="product-image-pp" onImageUpload={setProductImage} iconName="box" label="Upload Product" />
                    </div>
                    <div>
                        <div className="flex justify-between items-center mb-2">
                            <h2 className="text-xl font-bold text-slate-800">2. Product Description</h2>
                            <button onClick={handleGenerateDescription} disabled={!productImage || isDescLoading} className="bg-cyan-50 text-cyan-700 text-xs font-bold py-1 px-3 rounded-full flex items-center hover:bg-cyan-100 disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed">
                                {isDescLoading ? <Loader size="sm" /> : <>✨ Auto-generate</>}
                            </button>
                        </div>
                        <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={4} className="w-full p-3 bg-slate-100 border border-slate-300 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition" placeholder="e.g., Waterproof smartwatch with GPS..."></textarea>
                    </div>
                    <div>
                        <h2 className="text-xl font-bold mb-3 text-slate-800">3. Upload Model <span className="text-sm text-slate-500 font-medium">(Optional)</span></h2>
                        <ImageUploader id="model-image-pp" onImageUpload={setModelImage} iconName="user" label="Upload Model" />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold mb-3 text-slate-800">4. Photo Theme <span className="text-sm text-slate-500 font-medium">(Optional)</span></h2>
                        <textarea value={theme} onChange={(e) => setTheme(e.target.value)} rows={3} className="w-full p-3 bg-slate-100 border border-slate-300 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition" placeholder="e.g., Minimalist & clean, tropical nature vibe..."></textarea>
                    </div>
                    <button onClick={handleGenerate} disabled={isGenerateButtonDisabled} className="w-full bg-cyan-500 text-white font-bold py-3 px-4 rounded-xl flex items-center justify-center text-lg hover:bg-cyan-600 disabled:bg-slate-300 disabled:cursor-not-allowed focus:ring-4 focus:ring-cyan-500/50 transition-all duration-200 shadow-lg shadow-cyan-500/30">
                        {isGenerating ? <><Loader /> <span className="ml-3">{status}</span></> : <span>{status}</span>}
                    </button>
                </div>
            </div>

            <div className="flex-grow">
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                    {results.length > 0 ? (
                        results.map(r => <ResultCard key={r.id} result={r} />)
                    ) : (
                        Array.from({ length: 6 }).map((_, i) => (
                            <div key={i} className="bg-white border border-gray-200 rounded-2xl shadow-lg p-4 flex flex-col justify-between">
                                <div className="h-5 bg-slate-200 rounded w-3/4 mb-4 animate-pulse"></div>
                                <div className="mt-4 aspect-square bg-slate-200 rounded-xl animate-pulse"></div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </main>
        <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={modalContent.title}>
            {modalContent.body}
        </Modal>
      </>
    );
};

export default ProductPhotography;