
import React, { useEffect } from 'react';
import { Icon, IconName } from './icons';
import type { ToastMessage } from '../types';

interface ToastProps {
    message: ToastMessage;
    onDismiss: (id: number) => void;
}

const toastConfig: Record<ToastMessage['type'], { icon: IconName; bg: string }> = {
    success: { icon: 'success', bg: 'bg-green-500' },
    error: { icon: 'error', bg: 'bg-red-500' },
    info: { icon: 'info', bg: 'bg-blue-500' },
};

export const Toast: React.FC<ToastProps> = ({ message, onDismiss }) => {
    useEffect(() => {
        const timer = setTimeout(() => {
            onDismiss(message.id);
        }, 5000);

        return () => {
            clearTimeout(timer);
        };
    }, [message.id, onDismiss]);

    const config = toastConfig[message.type];

    return (
        <div className={`flex items-center text-white p-3 rounded-xl shadow-lg animate-fade-in-right ${config.bg}`}>
            <Icon name={config.icon} className="w-6 h-6 mr-3 flex-shrink-0" />
            <span className="flex-grow text-sm font-semibold">{message.message}</span>
            <button onClick={() => onDismiss(message.id)} className="ml-4 p-1 rounded-full hover:bg-white/20 flex-shrink-0">
                <Icon name="x" className="w-4 h-4" />
            </button>
        </div>
    );
};
