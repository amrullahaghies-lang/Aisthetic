import React from 'react';
import { Icon } from './icons';

interface AccordionProps {
    id: string;
    title: React.ReactNode;
    children: React.ReactNode;
    isOpen: boolean;
    onToggle: (id: string) => void;
}

export const Accordion: React.FC<AccordionProps> = ({ id, title, children, isOpen, onToggle }) => {
    return (
        <div className="border-b border-gray-200 dark:border-slate-700 last:border-b-0">
            <h2>
                <button
                    type="button"
                    className="flex justify-between items-center w-full py-4 font-bold text-left text-slate-800 dark:text-slate-100"
                    onClick={() => onToggle(id)}
                    aria-expanded={isOpen}
                    aria-controls={`accordion-content-${id}`}
                >
                    <span className="text-xl">{title}</span>
                    <Icon
                        name="chevronDown"
                        className={`w-5 h-5 transition-transform duration-300 text-slate-500 dark:text-slate-400 ${isOpen ? 'rotate-180' : ''}`}
                    />
                </button>
            </h2>
            <div
                id={`accordion-content-${id}`}
                className={`grid transition-all duration-300 ease-in-out ${
                    isOpen ? 'grid-rows-[1fr] opacity-100 pb-4' : 'grid-rows-[0fr] opacity-0'
                }`}
                aria-hidden={!isOpen}
            >
                <div className="overflow-hidden">
                    {children}
                </div>
            </div>
        </div>
    );
};
