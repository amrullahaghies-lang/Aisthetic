import React from 'react';
import { Icon } from '../components/icons';
import type { IconName } from '../components/icons';
import type { Tab } from '../types';

interface FeatureCardProps {
    icon: IconName;
    title: string;
    description: string;
    tabId: Tab;
    onSelect: (tabId: Tab) => void;
}

const FeatureCard: React.FC<FeatureCardProps> = ({ icon, title, description, tabId, onSelect }) => (
    <button 
        onClick={() => onSelect(tabId)}
        className="bg-white/50 dark:bg-slate-800/50 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 text-left hover:-translate-y-1 hover:shadow-xl hover:shadow-cyan-500/10 transition-all duration-300 group"
    >
        <div className="flex items-center gap-4">
            <div className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-700">
                 <Icon name={icon} className="w-6 h-6 text-cyan-500" />
            </div>
            <div>
                 <h3 className="font-bold text-lg text-slate-800 dark:text-slate-100">{title}</h3>
            </div>
        </div>
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-3">{description}</p>
    </button>
);


export const WelcomeScreen: React.FC<{ onTabSelect: (tabId: Tab) => void }> = ({ onTabSelect }) => {
    return (
        <div className="flex flex-col items-center justify-center h-full animate-fade-in">
            <div className="text-center max-w-4xl mx-auto">
                <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-slate-900 dark:text-slate-50 tracking-tighter">
                    Selamat Datang di <span className="bg-clip-text text-transparent bg-gradient-to-r from-cyan-500 to-blue-600">Aisthetic Studio</span>
                </h1>
                <p className="text-lg text-slate-500 dark:text-slate-400 mt-5 max-w-2xl mx-auto">
                    Pilih salah satu fitur di bawah ini untuk mulai membuat konten AI yang menakjubkan untuk bisnis Anda.
                </p>

                <div className="mt-12 pt-10">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <FeatureCard 
                            icon="zap"
                            title="Campaign Studio"
                            description="Generate a complete set of social media assets from one product image in a single click."
                            tabId="campaign"
                            onSelect={onTabSelect}
                        />
                        <FeatureCard 
                            icon="image"
                            title="Product Shots"
                            description="Create professional, studio-quality product photos from a single image."
                            tabId="product"
                            onSelect={onTabSelect}
                        />
                         <FeatureCard 
                            icon="layers"
                            title="Background Studio"
                            description="Automatically replace the background of your product photos with a simple text."
                            tabId="background"
                            onSelect={onTabSelect}
                        />
                         <FeatureCard 
                            icon="shoppingBag"
                            title="Virtual Try-On"
                            description="Place your products on models in realistic settings, instantly."
                            tabId="vto"
                            onSelect={onTabSelect}
                        />
                         <FeatureCard 
                            icon="sparkles"
                            title="Fashion Pose"
                            description="Transform your model's pose with a simple text description."
                            tabId="fashion"
                            onSelect={onTabSelect}
                        />
                         <FeatureCard 
                            icon="type"
                            title="Ad Creatives"
                            description="Generate compelling ad visuals by combining your image with powerful text."
                            tabId="combine-text"
                            onSelect={onTabSelect}
                        />
                         <FeatureCard 
                            icon="mic"
                            title="AI Voice Studio"
                            description="Generate professional ad scripts and turn them into high-quality voice-overs."
                            tabId="voice"
                            onSelect={onTabSelect}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};
