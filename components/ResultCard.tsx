import React, { useState, useEffect } from 'react';
import type { GeneratedImageResult } from '../types';
import { Loader } from './Loader';

interface ResultCardProps {
    result: GeneratedImageResult;
    children: React.ReactNode;
    index: number;
}

export const ResultCard: React.FC<ResultCardProps> = ({ result, children, index }) => {
    const [isAnimated, setIsAnimated] = useState(false);

    useEffect(() => {
        // Trigger animation only when the image URL is ready
        if (result.imageUrl || result.error) {
            // A short delay to ensure the element is in the DOM before animating
            const timer = setTimeout(() => setIsAnimated(true), 10);
            return () => clearTimeout(timer);
        } else {
            // Reset if the result is cleared
            setIsAnimated(false);
        }
    }, [result.imageUrl, result.error]);

    const animationClasses = isAnimated
        ? 'opacity-100 translate-y-0'
        : 'opacity-0 translate-y-4';

    return (
        <div 
            className={`bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-2xl shadow-lg p-4 flex flex-col justify-between transition-all duration-500 ease-out hover:shadow-cyan-500/20 hover:-translate-y-1 ${animationClasses}`}
            style={{ transitionDelay: `${index * 80}ms` }}
        >
            <h3 className="text-base font-bold text-slate-800 dark:text-slate-100 mb-3 truncate">{result.title}</h3>
            <div className="aspect-square bg-slate-100 dark:bg-slate-700 rounded-xl flex items-center justify-center overflow-hidden">
                {result.isLoading && <Loader size="lg" />}
                {result.error && <p className="text-xs text-red-600 dark:text-red-400 p-2 text-center font-semibold">{result.error}</p>}
                {result.imageUrl && (
                     <div className="relative w-full h-full group">
                        <img src={result.imageUrl} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" alt={result.title} />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                        <div className="absolute bottom-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0">
                           {children}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}