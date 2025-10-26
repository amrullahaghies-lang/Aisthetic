import React, { useState, useMemo, useCallback, useRef } from 'react';
import { ImageUploader } from '../components/ImageUploader';
import { Loader } from '../components/Loader';
import { Icon } from '../components/icons';
import { Modal } from '../components/Modal';
import { Accordion } from '../components/Accordion';
import { ResultCard } from '../components/ResultCard';
import { useNotification } from '../contexts/NotificationContext';
import { useBrand } from '../contexts/BrandContext';
import {
    generateProductDescription,
    generateProductPoses,
    generateImageFromPrompt,
    generateSocialCaption,
    generateVideoFromImage,
    suggestThemes,
    upscaleImage,
} from '../services/geminiService';
import type { ImageData, GeneratedImageResult, SuggestedTheme } from '../types';

const ProductPhotography: React.FC = () => {
    const [productImage, setProductImage] = useState<ImageData | null>(null);
    const [modelImage, setModelImage] = useState<ImageData | null>(null);
    const [description, setDescription] = useState('');
    const [productCategory, setProductCategory] = useState('');
    const [theme, setTheme] = useState('');
    
    const [isGenerating, setIsGenerating] = useState(false);
    const [isDescLoading, setIsDescLoading] = useState(false);
    const [isThemeLoading, setIsThemeLoading] = useState(false);
    
    const [results, setResults] = useState<GeneratedImageResult[]>([]);
    const [suggestedThemes, setSuggestedThemes] = useState<SuggestedTheme[]>([]);
    const [status, setStatus] = useState('Generate 6 Product Shots');
    
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalContent, setModalContent] = useState({ title: '', body: <></> });
    
    const [openSection, setOpenSection] = useState('product-image');
    const resultsRef = useRef<HTMLDivElement>(null);
    const { addToast } = useNotification();
    const { brandIdentity } = useBrand();

    const handleToggleSection = (id: string) => {
        setOpenSection(prev => (prev === id ? '' : id));
    };

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
            addToast('Failed to generate description. Please try again.', 'error');
            setDescription("");
        } finally {
            setIsDescLoading(false);
        }
    };
    
    const handleSuggestThemes = async () => {
        if (!productCategory.trim() || isThemeLoading) return;
        setIsThemeLoading(true);
        setSuggestedThemes([]);
        try {
            const themes = await suggestThemes(productCategory);
            setSuggestedThemes(themes);
        } catch (error) {
            console.error("Error suggesting themes:", error);
            addToast('Failed to suggest themes. Check your input and try again.', 'error');
        } finally {
            setIsThemeLoading(false);
        }
    };

    const copyToClipboard = useCallback((text: string) => {
        navigator.clipboard.writeText(text).then(() => {
            addToast('Copied to clipboard!', 'success');
        });
    }, [addToast]);

    const showModal = useCallback((title: string, body: React.ReactElement) => {
        setModalContent({ title, body });
        setIsModalOpen(true);
    }, []);

    const handleGenerate = async () => {
        if (!productImage || !description.trim()) return;
        setIsGenerating(true);
        setStatus('Analyzing...');
        setResults([]);

        if (window.innerWidth < 1024) { 
            setTimeout(() => {
                resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }, 100);
        }

        try {
            const ideas = await generateProductPoses(productImage, description, modelImage, theme, brandIdentity);
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
            addToast('An error occurred during generation. Please try again.', 'error');
            setResults([]); 
        } finally {
            setIsGenerating(false);
            setStatus('Generate 6 Product Shots');
        }
    };

    const handleUpscale = async (result: GeneratedImageResult) => {
        if (!result.imageUrl) {
            addToast('Image not available for upscaling.', 'error');
            return;
        }
        setResults(prev => prev.map(r => r.id === result.id ? { ...r, isUpscaling: true } : r));
        try {
            const [header, base64Data] = result.imageUrl.split(',');
            const mimeType = header.match(/:(.*?);/)?.[1] || 'image/png';

            const upscaledBase64 = await upscaleImage({ base64: base64Data, mimeType }, result.prompt);
            setResults(prev => prev.map(r => r.id === result.id ? { ...r, imageUrl: `data:image/png;base64,${upscaledBase64}`, isUpscaling: false } : r));
            addToast('Image upscaled to HD!', 'success');
        } catch (error) {
            console.error("Error upscaling image:", error);
            addToast('Failed to upscale image. Please try again.', 'error');
            setResults(prev => prev.map(r => r.id === result.id ? { ...r, isUpscaling: false } : r));
        }
    };
    
    const handleActionClick = async (type: 'caption' | 'video', result: GeneratedImageResult) => {
        if (!result.imageUrl) return;
        
        const loaderBody = (text: string, subtext = "") => (
            <div className="flex flex-col items-center gap-4 text-center">
                <Loader size="lg"/>
                <p className="text-slate-600 dark:text-slate-300 font-semibold">{text}</p>
                {subtext && <p className="text-sm text-slate-500 dark:text-slate-400">{subtext}</p>}
            </div>
        );

        if (type === 'caption') {
            showModal('✨ Social Media Caption', loaderBody('Brewing up a caption...'));
            try {
                const textContent = await generateSocialCaption(result.imageUrl, description, result.title, brandIdentity);
                const contentBody = (
                    <div>
                        <div id="modal-text-content" className="whitespace-pre-wrap bg-slate-100 dark:bg-slate-700 p-4 rounded-xl text-slate-700 dark:text-slate-200 mb-4 font-mono text-sm max-h-60 overflow-y-auto">
                            {textContent}
                        </div>
                        <button
                            onClick={() => copyToClipboard(textContent)}
                            className="w-full bg-cyan-500 text-white font-bold py-2 px-4 rounded-xl flex items-center justify-center hover:bg-cyan-600 focus:ring-4 focus:ring-cyan-500/50"
                        >
                            <Icon name="copy" className="w-4 h-4 mr-2"/>
                            Copy Text
                        </button>
                    </div>
                );
                showModal('✨ Social Media Caption', contentBody);
            } catch (error) {
                console.error('Error generating caption:', error);
                addToast('Failed to create caption. Please try again.', 'error');
                setIsModalOpen(false);
            }
        } else if (type === 'video') {
            showModal('🎬 Generate Cinematic Video', loaderBody('Checking API key status...'));
            
            try {
                // @ts-ignore
                if (!(await window.aistudio.hasSelectedApiKey())) {
                     const apiKeySelectionBody = (
                        <div className="text-center">
                            <p className="mb-4 text-slate-600 dark:text-slate-400">
                               Video generation requires a Gemini API key. Please select a project with an enabled API key to proceed.
                            </p>
                             <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" rel="noopener noreferrer" className="text-sm text-cyan-500 hover:underline mb-6 block">Learn more about billing.</a>
                            <button
                                onClick={async () => {
                                    // @ts-ignore
                                    await window.aistudio.openSelectKey();
                                    setIsModalOpen(false);
                                    addToast('API Key selected. Please try generating the video again.', 'info');
                                }}
                                className="w-full bg-cyan-500 text-white font-bold py-2 px-4 rounded-xl flex items-center justify-center hover:bg-cyan-600 focus:ring-4 focus:ring-cyan-500/50"
                            >
                                Select API Key
                            </button>
                        </div>
                    );
                    showModal('API Key Required', apiKeySelectionBody);
                    return;
                }

                showModal('🎬 Generate Cinematic Video', loaderBody('Brewing your video masterpiece...', 'This can take a minute or two. Please wait!'));
                
                const videoUrl = await generateVideoFromImage(result.imageUrl, description, result.title);
                
                const videoBody = (
                    <div>
                        <video controls autoPlay loop src={videoUrl} className="w-full rounded-xl mb-4" />
                         <a 
                            href={videoUrl} 
                            download={`aisthetic_video_${result.title.replace(/\s+/g, '_')}.mp4`}
                            className="w-full bg-cyan-500 text-white font-bold py-2 px-4 rounded-xl flex items-center justify-center hover:bg-cyan-600 focus:ring-4 focus:ring-cyan-500/50"
                        >
                            <Icon name="download" className="w-4 h-4 mr-2"/>
                            Download Video
                        </a>
                    </div>
                );
                showModal('🎬 Video Generation Complete!', videoBody);

            } catch (error: any) {
                console.error('Error generating video:', error);
                let errorMessage = 'Failed to create video. Please try again.';
                if (error?.message?.includes('Requested entity was not found')) {
                    errorMessage = 'API Key is invalid. Please select a different one.';
                     const retryBody = (
                        <div className="text-center">
                            <p className="mb-4 text-red-600 dark:text-red-400">{errorMessage}</p>
                            <button
                                onClick={async () => {
                                    // @ts-ignore
                                    await window.aistudio.openSelectKey();
                                    setIsModalOpen(false);
                                    addToast('API Key selected. Please try generating the video again.', 'info');
                                }}
                                className="w-full bg-cyan-500 text-white font-bold py-2 px-4 rounded-xl flex items-center justify-center hover:bg-cyan-600 focus:ring-4 focus:ring-cyan-500/50"
                            >
                                Select a Different API Key
                            </button>
                        </div>
                    );
                    showModal('API Key Error', retryBody);
                } else {
                    addToast(errorMessage, 'error');
                    setIsModalOpen(false);
                }
            }
        }
    };
    
    return (
      <>
        <main className="flex flex-col lg:flex-row gap-8">
            <div className="bg-white/70 dark:bg-slate-900/50 backdrop-blur-lg border border-slate-200/80 dark:border-slate-800/80 rounded-3xl shadow-2xl shadow-slate-600/10 dark:shadow-black/20 p-6 w-full lg:w-1/3 lg:max-w-md flex-shrink-0 self-start">
                <div className="flex flex-col">
                     <Accordion
                        id="product-image"
                        title="1. Upload Product Image"
                        isOpen={openSection === 'product-image'}
                        onToggle={handleToggleSection}
                     >
                        <ImageUploader id="product-image-pp" onImageUpload={(img) => {
                            setProductImage(img);
                            if (img) handleToggleSection('product-desc');
                        }} iconName="box" label="Upload Product" />
                     </Accordion>
                     <Accordion
                        id="product-desc"
                        title="2. Product Description"
                        isOpen={openSection === 'product-desc'}
                        onToggle={handleToggleSection}
                     >
                        <div className="flex justify-end mb-2">
                             <button onClick={handleGenerateDescription} disabled={!productImage || isDescLoading} className="bg-cyan-50 text-cyan-700 dark:bg-cyan-500/20 dark:text-cyan-300 text-xs font-bold py-1 px-3 rounded-full flex items-center hover:bg-cyan-100 dark:hover:bg-cyan-500/30 disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed dark:disabled:bg-slate-700 dark:disabled:text-slate-500">
                                {isDescLoading ? <Loader size="sm" /> : <>✨ Auto-generate</>}
                            </button>
                        </div>
                        <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={4} className="w-full p-3 bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition dark:placeholder-slate-400" placeholder="e.g., Waterproof smartwatch with GPS..."></textarea>
                     </Accordion>
                      <Accordion
                        id="model-image"
                        title={<>3. Upload Model <span className="text-base text-slate-500 dark:text-slate-400 font-medium">(Optional)</span></>}
                        isOpen={openSection === 'model-image'}
                        onToggle={handleToggleSection}
                     >
                        <ImageUploader id="model-image-pp" onImageUpload={(img) => {
                            setModelImage(img);
                             if (img) handleToggleSection('photo-theme');
                        }} iconName="user" label="Upload Model" />
                     </Accordion>
                      <Accordion
                        id="photo-theme"
                        title={<>4. Photo Theme & Style <span className="text-base text-slate-500 dark:text-slate-400 font-medium">(Optional)</span></>}
                        isOpen={openSection === 'photo-theme'}
                        onToggle={handleToggleSection}
                     >
                        <div className="space-y-3 mb-4">
                            <label htmlFor="product-category" className="text-sm font-semibold text-slate-600 dark:text-slate-300">Enter product category for AI suggestions</label>
                            <div className="flex gap-2">
                                <input 
                                    id="product-category"
                                    value={productCategory}
                                    onChange={(e) => setProductCategory(e.target.value)}
                                    className="flex-grow p-2 bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition text-sm dark:placeholder-slate-400" placeholder="e.g., skincare, shoes, jewelry"
                                />
                                <button 
                                    onClick={handleSuggestThemes} 
                                    disabled={!productCategory.trim() || isThemeLoading} 
                                    className="bg-cyan-500 text-white font-bold py-2 px-4 rounded-lg flex items-center justify-center hover:bg-cyan-600 disabled:bg-slate-300 dark:disabled:bg-slate-600 disabled:cursor-not-allowed focus:ring-4 focus:ring-cyan-500/50 transition-all text-sm"
                                >
                                    {isThemeLoading ? (
                                        <>
                                            <Loader size="sm" className="mr-2"/> 
                                            <span>Searching...</span>
                                        </>
                                    ) : (
                                        <>
                                            <Icon name="lightbulb" className="w-4 h-4 mr-2"/>
                                            <span>Get Ideas</span>
                                        </>
                                    )}
                                </button>
                            </div>
                            {suggestedThemes.length > 0 && (
                                <div className="pt-2">
                                    <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2">Click to use a theme:</p>
                                    <div className="flex flex-wrap gap-2">
                                        {suggestedThemes.map((sTheme) => (
                                            <button 
                                                key={sTheme.title} 
                                                onClick={() => setTheme(sTheme.description)}
                                                className="bg-cyan-50 text-cyan-800 dark:bg-cyan-500/20 dark:text-cyan-300 text-xs font-bold py-1 px-3 rounded-full hover:bg-cyan-100 dark:hover:bg-cyan-500/30 hover:text-cyan-900 transition"
                                                title={sTheme.description}
                                            >
                                                {sTheme.title}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                        <hr className="my-4 dark:border-slate-700"/>
                        <textarea value={theme} onChange={(e) => setTheme(e.target.value)} rows={3} className="w-full p-3 bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition dark:placeholder-slate-400" placeholder="Describe your own theme or use a suggestion above... e.g., Minimalist & clean, tropical nature vibe..."></textarea>
                     </Accordion>
                </div>
                 <button onClick={handleGenerate} disabled={isGenerateButtonDisabled} className="w-full bg-cyan-500 text-white font-bold py-3 px-4 rounded-xl flex items-center justify-center text-lg hover:bg-cyan-600 disabled:bg-slate-300 dark:disabled:bg-slate-700 disabled:cursor-not-allowed focus:ring-4 focus:ring-cyan-500/50 transition-all duration-200 shadow-lg shadow-cyan-500/30 mt-6">
                    {isGenerating ? <><Loader /> <span className="ml-3">{status}</span></> : <span>{status}</span>}
                </button>
            </div>

            <div className="flex-grow" ref={resultsRef}>
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                    {results.length > 0 ? (
                        results.map((r, i) => (
                            <ResultCard key={r.id} result={r} index={i}>
                                <button onClick={() => handleUpscale(r)} disabled={r.isUpscaling || r.isLoading} className="bg-white/90 dark:bg-slate-800/80 text-slate-700 dark:text-slate-200 p-2 rounded-full hover:bg-white dark:hover:bg-slate-700 hover:text-cyan-500 backdrop-blur-sm shadow-md disabled:opacity-50" title="Tingkatkan ke HD">
                                    <Icon name="wand" className="h-5 w-5" />
                                </button>
                                <button onClick={() => handleActionClick('video', r)} className="bg-white/90 dark:bg-slate-800/80 text-slate-700 dark:text-slate-200 p-2 rounded-full hover:bg-white dark:hover:bg-slate-700 hover:text-cyan-500 backdrop-blur-sm shadow-md" title="Generate Cinematic Video">
                                    <Icon name="video" className="h-5 w-5" />
                                </button>
                                <button onClick={() => handleActionClick('caption', r)} className="bg-white/90 dark:bg-slate-800/80 text-slate-700 dark:text-slate-200 p-2 rounded-full hover:bg-white dark:hover:bg-slate-700 hover:text-cyan-500 backdrop-blur-sm shadow-md" title="Create Caption">
                                    <Icon name="penSquare" className="h-5 w-5" />
                                </button>
                                 <a href={r.imageUrl} download={`aisthetic_${r.title.replace(/\s+/g, '_')}.png`} className="bg-white/90 dark:bg-slate-800/80 text-slate-700 dark:text-slate-200 p-2 rounded-full hover:bg-white dark:hover:bg-slate-700 hover:text-cyan-500 backdrop-blur-sm shadow-md" title="Download Image">
                                    <Icon name="download" className="h-5 w-5" />
                                </a>
                            </ResultCard>
                        ))
                    ) : (
                        Array.from({ length: 6 }).map((_, i) => (
                           <div key={i} className="bg-white/70 dark:bg-slate-900/50 border border-slate-200/80 dark:border-slate-800/80 rounded-2xl shadow-lg p-4 flex flex-col justify-center items-center aspect-square animate-pulse">
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

export default ProductPhotography;