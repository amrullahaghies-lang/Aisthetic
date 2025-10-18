import type { ImageData } from '../types';

const MAX_DIMENSION = 1024; // Max width or height of 1024px
const JPEG_QUALITY = 0.85; // 85% quality

export const compressImage = (file: File): Promise<ImageData> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
            if (!event.target?.result) {
                return reject(new Error('Failed to read file.'));
            }
            const img = new Image();
            img.src = event.target.result as string;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                let { width, height } = img;

                if (width > height) {
                    if (width > MAX_DIMENSION) {
                        height = Math.round((height * MAX_DIMENSION) / width);
                        width = MAX_DIMENSION;
                    }
                } else {
                    if (height > MAX_DIMENSION) {
                        width = Math.round((width * MAX_DIMENSION) / height);
                        height = MAX_DIMENSION;
                    }
                }

                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                if (!ctx) {
                    return reject(new Error('Could not get canvas context'));
                }
                ctx.drawImage(img, 0, 0, width, height);
                
                const mimeType = 'image/jpeg';
                const dataUrl = canvas.toDataURL(mimeType, JPEG_QUALITY);
                
                resolve({
                    base64: dataUrl.split(',')[1],
                    mimeType: mimeType,
                    name: file.name.replace(/\.[^/.]+$/, "") + ".jpg",
                });
            };
            img.onerror = (error) => reject(error);
        };
        reader.onerror = (error) => reject(error);
    });
};
