import React, { useState, useEffect, useRef } from 'react';
import { useBrand } from '../contexts/BrandContext';
import { useNotification } from '../contexts/NotificationContext';
import { ImageUploader } from '../components/ImageUploader';
import { Icon } from '../components/icons';
import { Loader } from '../components/Loader';
import { compressImage } from '../utils/imageUtils';
import type { BrandIdentity, ImageData } from '../types';

const BrandKit: React.FC = () => {
    const { brandIdentity, saveBrandIdentity, setLogo, addAsset, removeAsset } = useBrand();
    const [localIdentity, setLocalIdentity] = useState<BrandIdentity>(brandIdentity);
    const { addToast } = useNotification();
    const assetUploaderRef = useRef<HTMLInputElement>(null);
    const [isAssetUploading, setIsAssetUploading] = useState(false);

    useEffect(() => {
        setLocalIdentity(brandIdentity);
    }, [brandIdentity]);
    
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setLocalIdentity(prev => ({ ...prev, [name]: value }));
    };
    
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        saveBrandIdentity(localIdentity);
        addToast('Brand Identity saved successfully!', 'success');
    };

    const handleAssetUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files) return;
        setIsAssetUploading(true);
        const files = Array.from(e.target.files);
        
        try {
            await Promise.all(files.map(async (file: File) => {
                const compressedAsset = await compressImage(file);
                addAsset(compressedAsset);
            }));
            addToast(`${files.length} asset(s) added successfully!`, 'success');
        } catch (error) {
            console.error("Error compressing assets:", error);
            addToast('Error processing one or more assets.', 'error');
        } finally {
            setIsAssetUploading(false);
            // Reset file input
            if(assetUploaderRef.current) {
                assetUploaderRef.current.value = "";
            }
        }
    };

    const ColorInput: React.FC<{ label: string, name: keyof BrandIdentity, value: string }> = ({ label, name, value }) => (
        <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">{label}</label>
            <div className="relative flex items-center">
                <input
                    type="color"
                    name={name}
                    value={String(value)}
                    onChange={handleInputChange}
                    className="absolute left-3 w-7 h-7 p-0 border-none rounded-full cursor-pointer appearance-none bg-transparent"
                />
                 <div className="absolute left-3 w-7 h-7 rounded-full pointer-events-none border border-slate-300 dark:border-slate-500" style={{ backgroundColor: String(value) }}></div>
                <input
                    type="text"
                    name={name}
                    value={String(value).toUpperCase()}
                    onChange={handleInputChange}
                    className="w-full p-3 pl-14 bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-cyan-500 font-mono"
                />
            </div>
        </div>
    );

    return (
        <div className="bg-white dark:bg-slate-800/50 rounded-3xl shadow-xl p-6 md:p-10 w-full border border-gray-200 dark:border-slate-700 mx-auto max-w-5xl">
            <form onSubmit={handleSubmit} className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-12 items-start">
                    {/* Left Column */}
                    <div className="space-y-10">
                        <div>
                            <h3 className="text-xl font-bold mb-4 text-slate-800 dark:text-slate-100">Logo & Visuals</h3>
                            <ImageUploader id="brand-logo-uploader" iconName="imagePlus" label="Upload Logo" onImageUpload={setLogo} />
                        </div>
                         {brandIdentity.logo && (
                            <div>
                               <p className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">Logo Preview:</p>
                               <div className="p-4 bg-slate-100 dark:bg-slate-700 rounded-xl flex justify-center items-center">
                                <img 
                                    src={`data:${brandIdentity.logo.mimeType};base64,${brandIdentity.logo.base64}`} 
                                    alt="Brand Logo Preview" 
                                    className="max-h-24 object-contain"
                                />
                               </div>
                            </div>
                        )}
                        <div>
                            <h3 className="text-xl font-bold mb-4 text-slate-800 dark:text-slate-100">Brand Assets</h3>
                            <input type="file" multiple ref={assetUploaderRef} onChange={handleAssetUpload} className="hidden" accept="image/png, image/jpeg, image/webp" />
                            <button type="button" onClick={() => assetUploaderRef.current?.click()} disabled={isAssetUploading} className="w-full flex items-center justify-center gap-2 p-3 text-sm font-bold text-cyan-600 dark:text-cyan-400 bg-cyan-50 dark:bg-cyan-500/10 rounded-xl border-2 border-dashed border-cyan-200 dark:border-cyan-500/30 hover:bg-cyan-100 dark:hover:bg-cyan-500/20 transition disabled:opacity-50">
                                {isAssetUploading ? <Loader size="sm" /> : <Icon name="uploadCloud" />}
                                {isAssetUploading ? 'Uploading...' : 'Upload More Assets'}
                            </button>
                            {brandIdentity.assets.length > 0 && (
                                <div className="mt-4 grid grid-cols-3 sm:grid-cols-4 gap-3">
                                    {brandIdentity.assets.map(asset => (
                                        <div key={asset.name} className="relative group aspect-square">
                                            <img src={`data:${asset.mimeType};base64,${asset.base64}`} alt={asset.name} className="w-full h-full object-cover rounded-lg bg-slate-100 dark:bg-slate-700" />
                                            <button type="button" onClick={() => removeAsset(asset.name)} className="absolute top-1 right-1 bg-black/50 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 hover:bg-red-500 transition">
                                                <Icon name="x" size={12} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right Column */}
                    <div className="space-y-10">
                        <div>
                            <h3 className="text-xl font-bold mb-4 text-slate-800 dark:text-slate-100">Brand Palette</h3>
                            <div className="space-y-4">
                                <ColorInput label="Primary Color" name="primaryColor" value={localIdentity.primaryColor} />
                                <ColorInput label="Secondary Color" name="secondaryColor" value={localIdentity.secondaryColor} />
                            </div>
                        </div>

                         <div>
                            <h3 className="text-xl font-bold mb-4 text-slate-800 dark:text-slate-100">Brand Fonts</h3>
                            <div className="space-y-4">
                                 <div>
                                    <label htmlFor="primaryFont" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Primary Font (Headlines)</label>
                                    <input id="primaryFont" name="primaryFont" type="text" value={localIdentity.primaryFont} onChange={handleInputChange} className="w-full p-3 bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-cyan-500" placeholder="e.g., Montserrat" />
                                </div>
                                <div>
                                    <label htmlFor="secondaryFont" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Secondary Font (Body)</label>
                                    <input id="secondaryFont" name="secondaryFont" type="text" value={localIdentity.secondaryFont} onChange={handleInputChange} className="w-full p-3 bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-cyan-500" placeholder="e.g., Lato" />
                                </div>
                            </div>
                        </div>

                        <div>
                            <h3 className="text-xl font-bold mb-4 text-slate-800 dark:text-slate-100">Brand Voice</h3>
                            <textarea 
                                name="voice" 
                                value={localIdentity.voice}
                                onChange={handleInputChange}
                                rows={5} 
                                className="w-full p-3 bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-cyan-500" 
                                placeholder="Contoh: Profesional & terpercaya. Nada bicara kami selalu jelas, informatif, dan menginspirasi kepercayaan. Hindari bahasa gaul."></textarea>
                        </div>
                    </div>
                </div>

                <div className="pt-8 border-t border-gray-200 dark:border-slate-700 text-right">
                    <button 
                        type="submit"
                        className="bg-cyan-500 text-white font-bold py-3 px-8 rounded-xl hover:bg-cyan-600 transition-all shadow-lg shadow-cyan-500/30 focus:ring-4 focus:ring-cyan-500/50"
                    >
                         <span className="flex items-center justify-center">
                            <Icon name="wand" className="w-5 h-5 mr-2" />
                            Save Brand Kit
                        </span>
                    </button>
                </div>
            </form>
        </div>
    );
};

export default BrandKit;