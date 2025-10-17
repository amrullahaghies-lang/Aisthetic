import React, { useState, useCallback, useRef } from 'react';
import type { ImageData } from '../types';
import { Icon } from './icons';
import type { IconName } from './icons';

interface ImageUploaderProps {
    onImageUpload: (imageData: ImageData | null) => void;
    iconName: IconName;
    label: string;
    id: string;
}

export const ImageUploader: React.FC<ImageUploaderProps> = ({ onImageUpload, iconName, label, id }) => {
    const [preview, setPreview] = useState<string | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFile = useCallback((file: File) => {
        if (file && file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = (e) => {
                const result = e.target?.result as string;
                setPreview(result);
                const base64 = result.split(',')[1];
                onImageUpload({ base64, mimeType: file.type, name: file.name });
            };
            reader.readAsDataURL(file);
        }
    }, [onImageUpload]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            handleFile(e.target.files[0]);
        }
    };
    
    const handleRemove = () => {
        setPreview(null);
        onImageUpload(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };
    
    const dragHandler = useCallback((e: React.DragEvent<HTMLLabelElement>, entering: boolean) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(entering);
    }, []);

    const handleDrop = useCallback((e: React.DragEvent<HTMLLabelElement>) => {
        dragHandler(e, false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleFile(e.dataTransfer.files[0]);
        }
    }, [dragHandler, handleFile]);

    if (preview) {
        return (
            <div className="mt-4 relative group">
                <img src={preview} alt="Pratinjau" className="rounded-2xl w-full h-auto object-contain max-h-80" />
                <button 
                    onClick={handleRemove} 
                    className="absolute top-3 right-3 bg-black/50 text-white rounded-full p-1.5 hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-all opacity-0 group-hover:opacity-100"
                    aria-label="Remove image"
                >
                    <Icon name="x" className="h-4 w-4" />
                </button>
            </div>
        );
    }

    return (
        <div>
            <label 
                htmlFor={id} 
                className={`cursor-pointer border-2 border-dashed rounded-2xl text-center text-slate-500 p-4 flex flex-col items-center justify-center transition-all h-full min-h-[150px] ${isDragging ? 'border-cyan-500 bg-cyan-500/10 text-cyan-600' : 'border-slate-300 hover:border-slate-400'}`}
                onDragEnter={(e) => dragHandler(e, true)}
                onDragOver={(e) => dragHandler(e, true)}
                onDragLeave={(e) => dragHandler(e, false)}
                onDrop={handleDrop}
            >
                <Icon name={iconName} className="w-10 h-10 mb-2 text-slate-400" />
                <span className="font-semibold">{label}</span>
                 <span className="text-xs mt-1">Drag & Drop or Click</span>
            </label>
            <input 
                type="file" 
                id={id} 
                ref={fileInputRef}
                className="hidden" 
                accept="image/png, image/jpeg, image/webp" 
                onChange={handleFileChange} 
            />
        </div>
    );
};