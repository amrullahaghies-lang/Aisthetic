import React, { useEffect } from 'react';
import { Icon } from './icons';

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    children: React.ReactNode;
}

export const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children }) => {
    useEffect(() => {
        const handleEsc = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                onClose();
            }
        };
        window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, [onClose]);

    if (!isOpen) return null;

    return (
        <div 
            className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 transition-opacity duration-300"
            onClick={onClose}
        >
            <div 
                className="bg-white dark:bg-slate-800 p-6 sm:p-8 rounded-2xl w-11/12 max-w-lg max-h-[90vh] overflow-y-auto transform transition-transform duration-300 scale-100"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-slate-100">{title}</h3>
                    <button 
                        onClick={onClose} 
                        className="text-gray-400 dark:text-slate-400 hover:text-gray-900 dark:hover:text-slate-100 text-3xl"
                        aria-label="Close modal"
                    >
                        <Icon name="x" />
                    </button>
                </div>
                <div>{children}</div>
            </div>
        </div>
    );
};
