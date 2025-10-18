import React, { useState, useMemo, useCallback, useRef } from 'react';
import { ImageUploader } from '../components/ImageUploader';
import { Loader } from '../components/Loader';
import { Icon } from '../components/icons';
import { Modal } from '../components/Modal';
import { Accordion } from '../components/Accordion';
import { ResultCard } from '../components/ResultCard';
import { useNotification } from '../contexts/NotificationContext';
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
    
    const [openSection, setOpenSection] = useState('ad-image');
    const resultsRef = useRef<HTMLDivElement>(null);
    const { addToast } = useNotification();

    const handleToggleSection = (id: string) => {
        setOpenSection(prev => (prev === id ? '' : id));
    };

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
            addToast("Failed to generate description.", 'error');
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
            addToast("Failed to generate headline.", 'error');
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
        
        if (window.innerWidth < 1024) { 
            setTimeout(() => {
                resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }, 100);
        }

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
            addToast('An error occurred during generation. Please try again.', 'error');
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
            addToast('Failed to regenerate the image.', 'error');
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
                    <label htmlFor="modal-headline" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Headline</label>
                    <textarea id="modal-headline" rows={2} value={modalHeadline} onChange={(e) => setModalHeadline(e.target.value)} className="w-full p-2 bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-xl"/>
                </div>
                <div>
                    <label htmlFor="modal-desc" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Description</label>
                    <textarea id="modal-desc" rows={3} value={modalDescription} onChange={(e) => setModalDescription(e.target.value)} className="w-full p-2 bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-xl"/>
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
    
    return (
      <>
        <main className="flex flex-col lg:flex-row gap-8">
            <div className="bg-white dark:bg-slate-800/50 border border-gray-200 dark:border-slate-700 rounded-3xl shadow-xl dark:shadow-slate-900/50 p-6 w-full lg:w-1/3 lg:max-w-md flex-shrink-0 self-start">
                <div className="flex flex-col">
                    <Accordion
                        id="ad-image"
                        title="1. Upload Base Image"
                        isOpen={openSection === 'ad-image'}
                        onToggle={handleToggleSection}
                    >
                        <ImageUploader id="ad-image-ct" onImageUpload={(img) => {
                            setAdImage(img);
                            if (img) handleToggleSection('ad-desc');
                        }} iconName="imagePlus" label="Upload Ad Image" />
                    </Accordion>
                    <Accordion
                        id="ad-desc"
                        title="2. Ad Description"
                        isOpen={openSection === 'ad-desc'}
                        onToggle={handleToggleSection}
                    >
                         <div className="flex justify-end mb-2">
                            <button onClick={handleGenerateDescription} disabled={!adImage || isDescLoading} className="bg-cyan-50 text-cyan-700 dark:bg-cyan-500/20 dark:text-cyan-300 text-xs font-bold py-1 px-3 rounded-full flex items-center hover:bg-cyan-100 dark:hover:bg-cyan-500/30 disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed dark:disabled:bg-slate-700 dark:disabled:text-slate-500">
                                {isDescLoading ? <Loader size="sm" /> : <>✨ Auto-generate</>}
                            </button>
                        </div>
                        <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} className="w-full p-3 bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition dark:placeholder-slate-400" placeholder="Describe your product or offer..."></textarea>
                    </Accordion>
                    <Accordion
                        id="ad-headline"
                        title="3. Headline / Hook"
                        isOpen={openSection === 'ad-headline'}
                        onToggle={handleToggleSection}
                    >
                        <div className="flex justify-end mb-2">
                             <button onClick={handleGenerateHeadline} disabled={!adImage || !description.trim() || isHeadlineLoading} className="bg-cyan-50 text-cyan-700 dark:bg-cyan-500/20 dark:text-cyan-300 text-xs font-bold py-1 px-3 rounded-full flex items-center hover:bg-cyan-100 dark:hover:bg-cyan-500/30 disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed dark:disabled:bg-slate-700 dark:disabled:text-slate-500">
                                {isHeadlineLoading ? <Loader size="sm" /> : <>✨ Auto-generate</>}
                            </button>
                        </div>
                        <textarea value={headline} onChange={(e) => setHeadline(e.target.value)} rows={2} className="w-full p-3 bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition dark:placeholder-slate-400" placeholder="Write your catchy headline here..."></textarea>
                    </Accordion>
                    <Accordion
                        id="ad-theme"
                        title={<>4. Ad Theme <span className="text-base text-slate-500 dark:text-slate-400 font-medium">(Optional)</span></>}
                        isOpen={openSection === 'ad-theme'}
                        onToggle={handleToggleSection}
                    >
                        <textarea value={theme} onChange={(e) => setTheme(e.target.value)} rows={2} className="w-full p-3 bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition dark:placeholder-slate-400" placeholder="e.g., Elegant & luxurious, colorful & fun..."></textarea>
                    </Accordion>
                </div>
                <button onClick={handleGenerate} disabled={!canGenerate} className="w-full bg-cyan-500 text-white font-bold py-3 px-4 rounded-xl flex items-center justify-center text-lg hover:bg-cyan-600 disabled:bg-slate-300 dark:disabled:bg-slate-700 disabled:cursor-not-allowed focus:ring-4 focus:ring-cyan-500/50 transition-all duration-200 shadow-lg shadow-cyan-500/30 mt-6">
                     {isGenerating ? <><Loader /> <span className="ml-3">{status}</span></> : <span>{status}</span>}
                </button>
            </div>

            <div className="flex-grow" ref={resultsRef}>
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                     {results.length > 0 ? (
                        results.map((r, i) => (
                            <ResultCard key={r.id} result={r} index={i}>
                                <button onClick={() => handleEditClick(r)} className="bg-white/90 dark:bg-slate-800/80 text-slate-700 dark:text-slate-200 p-2 rounded-full hover:bg-white dark:hover:bg-slate-700 hover:text-cyan-500 backdrop-blur-sm shadow-md" title="Edit & Regenerate">
                                    <Icon name="edit" className="h-5 w-5" />
                                </button>
                                 <a href={r.imageUrl} download={`aisthetic_ad_${r.title.replace(/\s+/g, '_')}.png`} className="bg-white/90 dark:bg-slate-800/80 text-slate-700 dark:text-slate-200 p-2 rounded-full hover:bg-white dark:hover:bg-slate-700 hover:text-cyan-500 backdrop-blur-sm shadow-md" title="Download Image">
                                    <Icon name="download" className="h-5 w-5" />
                                </a>
                            </ResultCard>
                        ))
                    ) : (
                        Array.from({ length: 6 }).map((_, i) => (
                           <div key={i} className="bg-white dark:bg-slate-800/50 border border-gray-200 dark:border-slate-700 rounded-2xl shadow-lg p-4 flex flex-col justify-center items-center aspect-square animate-pulse">
                               <Icon name="wand" className="w-10 h-10 text-slate-300 dark:text-slate-600 mb-2" />
                               <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-3/4"></div>
                               <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/2 mt-2"></div>
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