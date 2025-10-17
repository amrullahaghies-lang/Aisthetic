import React, { useState, useMemo, useCallback } from 'react';
import { ImageUploader } from '../components/ImageUploader';
import { Loader } from '../components/Loader';
import { Icon } from '../components/icons';
import { Modal } from '../components/Modal';
import {
    getAdVariations,
    generateAdHeadline,
    generateAdImageWithText,
    generateProductDescription
} from '../services/geminiService';
import type { ImageData, GeneratedImageResult } from '../types';

const CombineText: React.FC = () => {
    const [adImage, setAdImage] = useState<ImageData | null>(null);
    const [description, setDescription] = useState('');
    const [headline, setHeadline] = useState('');
    const [theme, setTheme] = useState('');

    const [isGenerating, setIsGenerating] = useState(false);
    const [isDescLoading, setIsDescLoading] = useState(false);
    const [isHeadlineLoading, setIsHeadlineLoading] = useState(false);
    
    const [results, setResults] = useState<GeneratedImageResult[]>([]);
    const [status, setStatus] = useState('Generate 6 Ad Creatives');
    
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalContent, setModalContent] = useState({ title: '', body: <></> });

    const canGenerate = useMemo(() => {
        return adImage && description.trim() && headline.trim() && !isGenerating;
    }, [adImage, description, headline, isGenerating]);

    const handleGenerateDescription = async () => {
        if (!adImage) return;
        setIsDescLoading(true);
        try {
            const desc = await generateProductDescription(adImage);
            setDescription(desc);
        } catch (error) {
            console.error("Error generating description:", error);
            setDescription("Failed to generate description.");
        } finally {
            setIsDescLoading(false);
        }
    };

    const handleGenerateHeadline = async () => {
        if (!adImage || !description.trim()) return;
        setIsHeadlineLoading(true);
        try {
            const head = await generateAdHeadline(adImage, description);
            setHeadline(head);
        } catch (error) {
            console.error("Error generating headline:", error);
            setHeadline("Failed to generate headline.");
        } finally {
            setIsHeadlineLoading(false);
        }
    };
    
    const showModal = useCallback((title: string, body: React.ReactElement) => {
        setModalContent({ title, body });
        setIsModalOpen(true);
    }, []);

    const handleGenerate = async () => {
        if (!canGenerate || !adImage) return;
        setIsGenerating(true);
        setStatus('Analyzing...');
        setResults([]);

        try {
            const variations = await getAdVariations(adImage, headline, description, theme);
            setStatus('Creating visuals...');
            const initialResults = variations.map((idea, index) => ({
                id: index,
                title: idea.title,
                prompt: idea.prompt,
                isLoading: true,
            }));
            setResults(initialResults);

            const generationPromises = variations.map((variation, index) =>
                generateAdImageWithText(adImage, variation.prompt, headline, description)
                .then(base64Data => {
                    setResults(prev => prev.map(r => r.id === index ? { ...r, imageUrl: `data:image/png;base64,${base64Data}`, isLoading: false } : r));
                })
                .catch(err => {
                    console.error(`Error generating ad image for prompt: ${variation.prompt}`, err);
                    setResults(prev => prev.map(r => r.id === index ? { ...r, error: 'Failed to generate.', isLoading: false } : r));
                })
            );
            await Promise.allSettled(generationPromises);

        } catch (error) {
            console.error("Error during ad generation process:", error);
        } finally {
            setIsGenerating(false);
            setStatus('Generate 6 Ad Creatives');
        }
    };
    
    const handleEditAndRegenerate = async (result: GeneratedImageResult, newHeadline: string, newDescription: string) => {
        if (!adImage) return;

        setIsModalOpen(false);
        setResults(prev => prev.map(r => r.id === result.id ? { ...r, isLoading: true, imageUrl: undefined, error: undefined } : r));
        
        try {
            const base64Data = await generateAdImageWithText(adImage, result.prompt, newHeadline, newDescription);
            setResults(prev => prev.map(r => r.id === result.id ? { ...r, imageUrl: `data:image/png;base64,${base64Data}`, isLoading: false } : r));
        } catch (error) {
            console.error("Error regenerating ad image:", error);
            setResults(prev => prev.map(r => r.id === result.id ? { ...r, error: 'Failed to regenerate.', isLoading: false } : r));
        }
    };

    const EditModalBody: React.FC<{result: GeneratedImageResult}> = ({result}) => {
        const [modalHeadline, setModalHeadline] = useState(headline);
        const [modalDescription, setModalDescription] = useState(description);
        const [isRegenerating, setIsRegenerating] = useState(false);

        const onRegenerateClick = async () => {
            setIsRegenerating(true);
            await handleEditAndRegenerate(result, modalHeadline, modalDescription);
            // The parent component handles closing the modal.
        };

        return (
             <div className="space-y-4">
                {result.imageUrl && <img src={result.imageUrl} className="rounded-xl w-full mb-4" alt="Preview"/>}
                <div>
                    <label htmlFor="modal-headline" className="block text-sm font-medium text-slate-700 mb-1">Headline</label>
                    <textarea id="modal-headline" rows={2} value={modalHeadline} onChange={(e) => setModalHeadline(e.target.value)} className="w-full p-2 bg-slate-100 border border-slate-300 rounded-xl"/>
                </div>
                <div>
                    <label htmlFor="modal-desc" className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                    <textarea id="modal-desc" rows={3} value={modalDescription} onChange={(e) => setModalDescription(e.target.value)} className="w-full p-2 bg-slate-100 border border-slate-300 rounded-xl"/>
                </div>
                <button onClick={onRegenerateClick} disabled={isRegenerating} className="w-full bg-cyan-500 text-white font-bold py-2 px-4 rounded-xl flex items-center justify-center hover:bg-cyan-600 disabled:bg-slate-300 focus:ring-4 focus:ring-cyan-500/50">
                    {isRegenerating ? <Loader /> : 'Regenerate Image'}
                </button>
            </div>
        )
    }
    
    const handleEditClick = (result: GeneratedImageResult) => {
        showModal(`Edit Ad: ${result.title}`, <EditModalBody result={result} />);
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
                           <button onClick={() => handleEditClick(result)} className="bg-white/90 text-slate-700 p-2 rounded-full hover:bg-white hover:text-cyan-500 backdrop-blur-sm shadow-md" title="Edit & Regenerate">
                                <Icon name="edit" className="h-5 w-5" />
                            </button>
                             <a href={result.imageUrl} download={`aisthetic_ad_${result.title.replace(/\s+/g, '_')}.png`} className="bg-white/90 text-slate-700 p-2 rounded-full hover:bg-white hover:text-cyan-500 backdrop-blur-sm shadow-md" title="Download Image">
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
                        <h2 className="text-xl font-bold mb-3 text-slate-800">1. Upload Base Image</h2>
                        <ImageUploader id="ad-image-ct" onImageUpload={setAdImage} iconName="imagePlus" label="Upload Ad Image" />
                    </div>
                    <div>
                        <div className="flex justify-between items-center mb-2">
                            <h2 className="text-xl font-bold text-slate-800">2. Ad Description</h2>
                            <button onClick={handleGenerateDescription} disabled={!adImage || isDescLoading} className="bg-cyan-50 text-cyan-700 text-xs font-bold py-1 px-3 rounded-full flex items-center hover:bg-cyan-100 disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed">
                                {isDescLoading ? <Loader size="sm" /> : <>✨ Auto-generate</>}
                            </button>
                        </div>
                        <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} className="w-full p-3 bg-slate-100 border border-slate-300 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition" placeholder="Describe your product or offer..."></textarea>
                    </div>
                    <div>
                        <div className="flex justify-between items-center mb-2">
                            <h2 className="text-xl font-bold text-slate-800">3. Headline / Hook</h2>
                             <button onClick={handleGenerateHeadline} disabled={!adImage || !description.trim() || isHeadlineLoading} className="bg-cyan-50 text-cyan-700 text-xs font-bold py-1 px-3 rounded-full flex items-center hover:bg-cyan-100 disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed">
                                {isHeadlineLoading ? <Loader size="sm" /> : <>✨ Auto-generate</>}
                            </button>
                        </div>
                        <textarea value={headline} onChange={(e) => setHeadline(e.target.value)} rows={2} className="w-full p-3 bg-slate-100 border border-slate-300 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition" placeholder="Write your catchy headline here..."></textarea>
                    </div>
                     <div>
                        <h2 className="text-xl font-bold mb-3 text-slate-800">4. Ad Theme <span className="text-sm text-slate-500 font-medium">(Optional)</span></h2>
                        <textarea value={theme} onChange={(e) => setTheme(e.target.value)} rows={2} className="w-full p-3 bg-slate-100 border border-slate-300 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition" placeholder="e.g., Elegant & luxurious, colorful & fun..."></textarea>
                    </div>
                    <button onClick={handleGenerate} disabled={!canGenerate} className="w-full bg-cyan-500 text-white font-bold py-3 px-4 rounded-xl flex items-center justify-center text-lg hover:bg-cyan-600 disabled:bg-slate-300 disabled:cursor-not-allowed focus:ring-4 focus:ring-cyan-500/50 transition-all duration-200 shadow-lg shadow-cyan-500/30">
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

export default CombineText;