import React, { useState, useMemo, useCallback, useRef } from 'react';
import { ImageUploader } from '../components/ImageUploader';
import { Loader } from '../components/Loader';
import { Icon } from '../components/icons';
import { Accordion } from '../components/Accordion';
import { useNotification } from '../contexts/NotificationContext';
import { useBrand } from '../contexts/BrandContext';
import {
    generateProductDescription,
    generateCampaignBrief,
    generateImageFromPrompt,
    upscaleImage,
} from '../services/geminiService';
import type { ImageData, Platform, CampaignResult, CampaignAsset } from '../types';

const PLATFORMS_CONFIG: { id: Platform; name: string; aspect: string }[] = [
    { id: 'instagram_post', name: 'Instagram Post', aspect: 'aspect-square' },
    { id: 'instagram_story', name: 'Instagram Story', aspect: 'aspect-[9/16]' },
    { id: 'facebook_ad', name: 'Facebook Ad', aspect: 'aspect-[1.91/1]' },
];

const CampaignStudio: React.FC = () => {
    const [productImage, setProductImage] = useState<ImageData | null>(null);
    const [description, setDescription] = useState('');
    const [selectedPlatforms, setSelectedPlatforms] = useState<Platform[]>(['instagram_post']);
    
    const [isGenerating, setIsGenerating] = useState(false);
    const [isDescLoading, setIsDescLoading] = useState(false);
    const [status, setStatus] = useState('Generate Campaign');
    
    const [results, setResults] = useState<CampaignResult>({});
    
    const [openSection, setOpenSection] = useState('product-image');
    const resultsRef = useRef<HTMLDivElement>(null);
    const { addToast } = useNotification();
    const { brandIdentity } = useBrand();

    const handleToggleSection = (id: string) => {
        setOpenSection(prev => (prev === id ? '' : id));
    };

    const handlePlatformToggle = (platformId: Platform) => {
        setSelectedPlatforms(prev => 
            prev.includes(platformId) 
            ? prev.filter(p => p !== platformId)
            : [...prev, platformId]
        );
    };

    const isGenerateButtonDisabled = useMemo(() => {
        return !productImage || !description.trim() || selectedPlatforms.length === 0 || isGenerating;
    }, [productImage, description, selectedPlatforms, isGenerating]);

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
    
    const copyToClipboard = useCallback((text: string) => {
        navigator.clipboard.writeText(text).then(() => {
            addToast('Copied to clipboard!', 'success');
        });
    }, [addToast]);
    
    const handleUpscale = async (asset: CampaignAsset) => {
        if (!asset.imageUrl) {
            addToast('Image not available for upscaling.', 'error');
            return;
        }

        setResults(prev => ({
            ...prev,
            [asset.platform]: { ...prev[asset.platform]!, isUpscaling: true }
        }));
        
        try {
            const [header, base64Data] = asset.imageUrl.split(',');
            const mimeType = header.match(/:(.*?);/)?.[1] || 'image/png';

            const upscaledBase64 = await upscaleImage({ base64: base64Data, mimeType }, asset.imagePrompt);
            setResults(prev => ({
                ...prev,
                [asset.platform]: { ...prev[asset.platform]!, imageUrl: `data:image/png;base64,${upscaledBase64}`, isUpscaling: false }
            }));
            addToast(`${asset.platform} image upscaled to HD!`, 'success');
        } catch (error) {
            console.error(`Error upscaling image for ${asset.platform}:`, error);
            addToast(`Failed to upscale image for ${asset.platform}.`, 'error');
            setResults(prev => ({
                ...prev,
                [asset.platform]: { ...prev[asset.platform]!, isUpscaling: false }
            }));
        }
    };

    const handleGenerate = async () => {
        if (!productImage || !description.trim() || selectedPlatforms.length === 0) return;
        setIsGenerating(true);
        setStatus('Generating creative brief...');
        
        // Initialize results with loading state, but no text yet
        const initialResults: CampaignResult = {};
        selectedPlatforms.forEach(p => {
            initialResults[p] = { platform: p, isLoading: true, caption: 'Generating caption...', imagePrompt: '' };
        });
        setResults(initialResults);

        if (window.innerWidth < 1024) { 
            setTimeout(() => {
                resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }, 100);
        }

        try {
            const brief = await generateCampaignBrief(productImage, description, selectedPlatforms, brandIdentity);
            setStatus('Creating visuals...');

            // Update results with captions and prompts from brief first
            setResults(prev => {
                const updated = { ...prev };
                brief.forEach(item => {
                    if (updated[item.platform]) {
                        updated[item.platform]!.caption = item.caption;
                        updated[item.platform]!.imagePrompt = item.imagePrompt;
                    }
                });
                return updated;
            });
            
            // Sequentially process image generation to show progress
            for (const item of brief) {
                 try {
                    const base64Data = await generateImageFromPrompt(item.imagePrompt, productImage, null);
                     setResults(prev => ({
                        ...prev,
                        [item.platform]: { ...prev[item.platform]!, imageUrl: `data:image/png;base64,${base64Data}`, isLoading: false }
                    }));
                } catch (err) {
                    console.error(`Error generating image for ${item.platform}:`, err);
                    setResults(prev => ({
                        ...prev,
                        [item.platform]: { ...prev[item.platform]!, error: 'Failed to generate.', isLoading: false }
                    }));
                }
            }

        } catch (error) {
            console.error("Error during campaign generation:", error);
            addToast('An error occurred during generation. Please try again.', 'error');
            setResults({});
        } finally {
            setIsGenerating(false);
            setStatus('Generate Campaign');
        }
    };

    const CampaignResultCard: React.FC<{ asset: CampaignAsset }> = ({ asset }) => {
        const config = PLATFORMS_CONFIG.find(p => p.id === asset.platform);
        if (!config) return null;

        return (
             <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-2xl shadow-lg p-4 flex flex-col transition-all duration-500 ease-out animate-fade-in">
                <h3 className="text-base font-bold text-slate-800 dark:text-slate-100 mb-3">{config.name}</h3>
                <div className={`bg-slate-100 dark:bg-slate-700 rounded-xl flex items-center justify-center overflow-hidden relative ${config.aspect}`}>
                    {asset.isLoading && !asset.imageUrl && <Loader size="lg" />}
                    {asset.error && <p className="text-xs text-red-600 dark:text-red-400 p-2 text-center font-semibold">{asset.error}</p>}
                    {asset.imageUrl && (
                        <div className="relative w-full h-full group">
                            <img src={asset.imageUrl} className="w-full h-full object-cover" alt={`${config.name} asset`} />
                             <div className="absolute bottom-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0">
                                <button onClick={() => handleUpscale(asset)} disabled={asset.isUpscaling || asset.isLoading} className="bg-white/90 dark:bg-slate-800/80 text-slate-700 dark:text-slate-200 p-2 rounded-full hover:bg-white dark:hover:bg-slate-700 hover:text-cyan-500 backdrop-blur-sm shadow-md disabled:opacity-50" title="Tingkatkan ke HD">
                                    <Icon name="wand" className="h-5 w-5" />
                                </button>
                                <a href={asset.imageUrl} download={`aisthetic_campaign_${config.id}.png`} className="bg-white/90 dark:bg-slate-800/80 text-slate-700 dark:text-slate-200 p-2 rounded-full hover:bg-white dark:hover:bg-slate-700 hover:text-cyan-500 backdrop-blur-sm shadow-md" title="Download Image">
                                    <Icon name="download" className="h-5 w-5" />
                                </a>
                            </div>
                        </div>
                    )}
                     {asset.isUpscaling && (
                        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center z-10">
                            <Loader size="md" />
                            <p className="text-white text-sm font-semibold mt-2">Upscaling to HD...</p>
                        </div>
                    )}
                </div>
                {asset.caption && (
                    <div className="mt-4">
                        <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold mb-2">Suggested Caption:</p>
                        <div className="relative">
                           { (asset.isLoading && !asset.imageUrl) ? 
                             <div className="space-y-2">
                                <div className="h-3 bg-slate-200 dark:bg-slate-600 rounded w-full animate-pulse"></div>
                                <div className="h-3 bg-slate-200 dark:bg-slate-600 rounded w-3/4 animate-pulse"></div>
                             </div>
                            :
                            <>
                                <p className="text-sm text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-700/50 p-3 rounded-lg max-h-28 overflow-y-auto pr-10">
                                    {asset.caption}
                                </p>
                                <button onClick={() => copyToClipboard(asset.caption)} className="absolute top-2 right-2 p-1.5 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-md" title="Copy caption">
                                    <Icon name="copy" size={16} />
                                </button>
                            </>
                            }
                        </div>
                    </div>
                )}
            </div>
        );
    };

    return (
        <main className="flex flex-col lg:flex-row gap-8">
            <div className="bg-white/70 dark:bg-slate-900/50 backdrop-blur-lg border border-slate-200/80 dark:border-slate-800/80 rounded-3xl shadow-2xl shadow-slate-600/10 dark:shadow-black/20 p-6 w-full lg:w-1/3 lg:max-w-md flex-shrink-0 self-start">
                <div className="flex flex-col">
                     <Accordion
                        id="product-image"
                        title="1. Upload Product Image"
                        isOpen={openSection === 'product-image'}
                        onToggle={handleToggleSection}
                     >
                        <ImageUploader id="campaign-product-image" onImageUpload={(img) => {
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
                        id="platforms"
                        title="3. Select Platforms"
                        isOpen={openSection === 'platforms'}
                        onToggle={handleToggleSection}
                     >
                        <div className="space-y-3">
                            {PLATFORMS_CONFIG.map(p => (
                                <button key={p.id} onClick={() => handlePlatformToggle(p.id)} className={`w-full text-left p-3 rounded-xl border-2 transition-all flex items-center ${selectedPlatforms.includes(p.id) ? 'border-cyan-500 bg-cyan-500/10 text-cyan-700 dark:text-cyan-300' : 'border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-800/50 hover:border-slate-400 dark:hover:border-slate-500'}`}>
                                    <div className={`w-4 h-4 rounded-full border-2 mr-3 flex-shrink-0 ${selectedPlatforms.includes(p.id) ? 'bg-cyan-500 border-cyan-500' : 'border-slate-400'}`}></div>
                                    <span className="font-semibold">{p.name}</span>
                                </button>
                            ))}
                        </div>
                     </Accordion>
                </div>
                 <button onClick={handleGenerate} disabled={isGenerateButtonDisabled} className="w-full bg-cyan-500 text-white font-bold py-3 px-4 rounded-xl flex items-center justify-center text-lg hover:bg-cyan-600 disabled:bg-slate-300 dark:disabled:bg-slate-700 disabled:cursor-not-allowed focus:ring-4 focus:ring-cyan-500/50 transition-all duration-200 shadow-lg shadow-cyan-500/30 mt-6">
                    {isGenerating ? <><Loader /> <span className="ml-3">{status}</span></> : <><Icon name="zap" className="w-5 h-5 mr-2"/> <span>{status}</span></>}
                </button>
            </div>

            <div className="flex-grow" ref={resultsRef}>
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                    {Object.values(results).length > 0 ? (
                        // FIX: Explicitly type `asset` to fix type inference issue where it was considered `unknown`.
                        Object.values(results).map((asset: CampaignAsset | undefined) => (
                            asset && <CampaignResultCard key={asset.platform} asset={asset} />
                        ))
                    ) : (
                        PLATFORMS_CONFIG.map((p) => (
                           <div key={p.id} className="bg-white/70 dark:bg-slate-900/50 border border-slate-200/80 dark:border-slate-800/80 rounded-2xl shadow-lg p-4 flex flex-col justify-between animate-pulse">
                               <div className="h-5 bg-slate-200 dark:bg-slate-700 rounded w-3/4 mb-3"></div>
                               <div className={`bg-slate-200 dark:bg-slate-700 rounded-xl ${p.aspect}`}></div>
                               <div className="mt-4 space-y-2">
                                   <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-1/2"></div>
                                   <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-full"></div>
                                    <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-3/4"></div>
                               </div>
                           </div>
                        ))
                    )}
                </div>
            </div>
        </main>
    );
};

export default CampaignStudio;