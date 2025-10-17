import React, { useState, useMemo } from 'react';
import type { ImageData } from '../types';
import { generateVirtualTryOn } from '../services/geminiService';
import { Loader } from '../components/Loader';
import { Icon } from '../components/icons';

const GenericUploader: React.FC<{
  id: string;
  onUpload: (data: ImageData) => void;
  icon: 'box' | 'user';
  label: string;
}> = ({ id, onUpload, icon, label }) => {
    const [preview, setPreview] = useState<string | null>(null);
    const [isDragging, setIsDragging] = useState(false);

    const handleFile = (file: File) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const result = e.target?.result as string;
            setPreview(result);
            onUpload({ base64: result.split(',')[1], mimeType: file.type, name: file.name });
        };
        reader.readAsDataURL(file);
    };
    
    const onDragHandler = (e: React.DragEvent<HTMLDivElement>, enter: boolean) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(enter);
    };

    const onDropHandler = (e: React.DragEvent<HTMLDivElement>) => {
        onDragHandler(e, false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleFile(e.dataTransfer.files[0]);
        }
    };
    
    return (
        <div className="bg-white p-4 rounded-3xl shadow-xl border border-gray-200 flex flex-col h-full">
            <h2 className="text-xl font-bold mb-3 text-center text-slate-800">{label}</h2>
            <div 
                className={`border-2 border-dashed w-full flex-grow rounded-2xl flex items-center justify-center cursor-pointer relative overflow-hidden transition-all ${isDragging ? 'border-cyan-500 bg-cyan-500/10' : 'border-slate-300'}`}
                onClick={() => document.getElementById(id)?.click()}
                onDragEnter={(e) => onDragHandler(e, true)}
                onDragOver={(e) => onDragHandler(e, true)}
                onDragLeave={(e) => onDragHandler(e, false)}
                onDrop={onDropHandler}
            >
                {preview ? (
                    <img src={preview} className="absolute top-0 left-0 w-full h-full object-contain p-2" alt="Preview" />
                ) : (
                    <div className="text-center text-slate-400 p-4">
                        <Icon name={icon} className="mx-auto h-12 w-12" strokeWidth={1.5} />
                        <p className="mt-2 text-sm font-semibold">Drag & Drop or Click to Upload</p>
                    </div>
                )}
            </div>
            <input type="file" id={id} className="hidden" accept="image/*" onChange={(e) => e.target.files && handleFile(e.target.files[0])} />
        </div>
    );
};


const VirtualTryOn: React.FC = () => {
    const [productImage, setProductImage] = useState<ImageData | null>(null);
    const [modelImage, setModelImage] = useState<ImageData | null>(null);
    const [resultImage, setResultImage] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const canGenerate = useMemo(() => productImage && modelImage && !isLoading, [productImage, modelImage, isLoading]);

    const handleGenerate = async () => {
        if (!canGenerate) return;
        setIsLoading(true);
        setError('');
        setResultImage(null);

        try {
            const generatedBase64 = await generateVirtualTryOn(productImage!, modelImage!);
            setResultImage(`data:image/png;base64,${generatedBase64}`);
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
            setError(`Sorry, an error occurred: ${errorMessage}`);
            console.error("VTO generation failed:", err);
        } finally {
            setIsLoading(false);
        }
    };
    
    return (
        <div>
            <main className="w-full grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
                    <GenericUploader id="vto-product-input" onUpload={setProductImage} icon="box" label="1. Upload Product" />
                    <GenericUploader id="vto-model-input" onUpload={setModelImage} icon="user" label="2. Upload Model" />
                </div>

                <div className="lg:col-span-1 bg-white p-4 rounded-3xl shadow-xl border border-gray-200 flex flex-col">
                    <h2 className="text-xl font-bold mb-3 text-center text-slate-800">3. AI Generated Result</h2>
                    <div className="w-full flex-grow rounded-2xl bg-slate-100 flex items-center justify-center overflow-hidden relative min-h-[300px] md:min-h-[400px]">
                        {!isLoading && !resultImage && (
                            <div className="text-center text-slate-400 p-4">
                                <Icon name="wand" className="mx-auto h-16 w-16" strokeWidth={1} />
                                <p className="mt-2 font-semibold">Result will appear here</p>
                            </div>
                        )}
                        {isLoading && (
                            <div className="text-center">
                                <Loader size="lg" />
                                <p className="mt-4 text-slate-500 font-semibold">AI is working its magic...</p>
                            </div>
                        )}
                        {resultImage && (
                             <div className="w-full h-full group">
                                <img src={resultImage} className="w-full h-full object-contain" alt="AI Generated Result" />
                                <div className="absolute bottom-0 left-0 right-0 flex justify-center bg-black bg-opacity-60 p-3 transition-opacity duration-300 opacity-0 group-hover:opacity-100">
                                    <a href={resultImage} download="aisthetic_virtual_try_on.png" className="bg-cyan-500 hover:bg-cyan-600 text-white font-bold py-2 px-4 rounded-full text-sm transition-transform transform hover:scale-105 inline-flex items-center shadow-lg shadow-cyan-500/30">
                                        <Icon name="download" className="w-4 h-4 mr-2" />
                                        Download
                                    </a>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </main>
            <footer className="w-full mt-8 text-center">
                <button onClick={handleGenerate} disabled={!canGenerate} className="bg-cyan-500 hover:bg-cyan-600 text-white font-bold py-3 px-12 rounded-xl shadow-lg shadow-cyan-500/30 transform hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100 disabled:shadow-none focus:ring-4 focus:ring-cyan-500/50">
                    {isLoading ? 'Processing...' : 'Generate Image'}
                </button>
                {error && <p className="text-red-600 mt-4 h-6">{error}</p>}
            </footer>
        </div>
    );
};

export default VirtualTryOn;