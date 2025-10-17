import React, { useState } from 'react';
import type { Tab } from './types';
import { Icon } from './components/icons';
import ProductPhotography from './features/ProductPhotography';
import VirtualTryOn from './features/VirtualTryOn';
import FashionPose from './features/FashionPose';
import CombineText from './features/CombineText';
import { WelcomeScreen } from './features/WelcomeScreen';

const TABS: { id: Tab; name: string; icon: 'image' | 'shoppingBag' | 'sparkles' | 'type'; mobileName: string }[] = [
    { id: 'product', name: 'Product Shots', icon: 'image', mobileName: 'Product' },
    { id: 'vto', name: 'Virtual Try-On', icon: 'shoppingBag', mobileName: 'Virtual' },
    { id: 'fashion', name: 'Fashion Pose', icon: 'sparkles', mobileName: 'Pose' },
    { id: 'combine-text', name: 'Ad Creatives', icon: 'type', mobileName: 'Ads' },
];

const Navbar: React.FC = () => (
    <header className="bg-white/80 backdrop-blur-md sticky top-0 z-50 border-b border-gray-200">
        <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
                <div className="flex items-center space-x-3">
                     <div className="w-9 h-9 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-lg flex items-center justify-center shadow-lg shadow-cyan-500/30 transform -rotate-12">
                        <Icon name="wand" className="text-white" size={20} />
                    </div>
                    <h1 className="text-2xl font-extrabold text-slate-800 tracking-tighter">Aisthetic Studio</h1>
                </div>
                <nav className="hidden md:flex items-center space-x-8 text-sm font-semibold text-slate-600">
                    <a href="#" className="hover:text-cyan-500 transition-colors">Docs</a>
                    <a href="#" className="hover:text-cyan-500 transition-colors">Help</a>
                    <button className="flex items-center justify-center w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 transition-colors">
                        <Icon name="user" size={16} />
                    </button>
                </nav>
            </div>
        </div>
    </header>
);

const App: React.FC = () => {
    const [activeTab, setActiveTab] = useState<Tab | null>(null);

    const handleTabClick = (tabId: Tab) => {
        setActiveTab(tabId);
    };

    const renderContent = () => {
        if (!activeTab) {
            return <WelcomeScreen />;
        }
        
        const contentMap = {
            product: { component: <ProductPhotography />, title: "Product Shot Generator", subtitle: "Create professional, studio-quality product photos from a single image." },
            vto: { component: <VirtualTryOn />, title: "Virtual Try-On", subtitle: "Place your products on models in realistic settings, instantly." },
            fashion: { component: <FashionPose />, title: "AI Fashion Pose", subtitle: "Transform your model's pose with a simple text description." },
            'combine-text': { component: <CombineText />, title: "Ad Creative Studio", subtitle: "Generate compelling ad visuals by combining your image with powerful text." },
        };
        
        const currentContent = contentMap[activeTab];

        return (
            <>
                <header className="text-center mb-10 md:mb-12">
                    <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 tracking-tighter">
                        <span className="bg-clip-text text-transparent bg-gradient-to-r from-cyan-500 to-blue-600">{currentContent.title}</span>
                    </h1>
                    <p className="text-lg text-slate-500 mt-4 max-w-2xl mx-auto">
                        {currentContent.subtitle}
                    </p>
                </header>
                {currentContent.component}
            </>
        );
    };
    
    return (
        <div className="min-h-screen bg-gray-50">
            <Navbar />
            <div className="relative md:flex">
                {/* Sidebar (Desktop) */}
                <aside className="hidden md:flex flex-col w-64 bg-white border-r border-gray-200 min-h-screen">
                    <div className="h-16 flex-shrink-0" /> {/* Spacer for Navbar */}
                    <nav className="flex-1 px-4 py-6 space-y-2">
                        {TABS.map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => handleTabClick(tab.id)}
                                className={`flex items-center w-full p-3 font-bold rounded-xl transition-all duration-200 text-sm ${
                                    activeTab === tab.id 
                                    ? 'bg-cyan-500 text-white shadow-lg shadow-cyan-500/30' 
                                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-800'
                                }`}
                            >
                                <Icon name={tab.icon} className="w-5 h-5 mr-3" />
                                <span>{tab.name}</span>
                            </button>
                        ))}
                    </nav>
                </aside>

                {/* Main Content */}
                <main className="flex-1 pb-24 md:pb-0">
                    <div className="w-full max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 py-10 lg:py-16">
                        {renderContent()}
                    </div>
                     <footer className="text-center py-8 text-sm text-slate-500 border-t border-gray-200">
                        <p>&copy; 2025 Aisthetic Studio — Stay TechUp</p>
                    </footer>
                </main>

                {/* Mobile Navigation */}
                 <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-md border-t border-gray-200 p-2 z-40 shadow-t-lg grid grid-cols-4 gap-2">
                    {TABS.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => handleTabClick(tab.id)}
                            className={`flex flex-col items-center justify-center gap-1 p-2 rounded-xl transition-colors ${
                                activeTab === tab.id ? 'text-cyan-500 bg-cyan-500/10' : 'text-slate-500 hover:bg-slate-100'
                            }`}
                        >
                            <Icon name={tab.icon} className="w-5 h-5" />
                            <span className="text-xs font-bold">{tab.mobileName}</span>
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default App;
