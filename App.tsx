import React, { useState, useEffect } from 'react';
import type { Tab } from './types';
import { Icon } from './components/icons';
import type { IconName } from './components/icons';
import ProductPhotography from './features/ProductPhotography';
import VirtualTryOn from './features/VirtualTryOn';
import FashionPose from './features/FashionPose';
import CombineText from './features/CombineText';
import { WelcomeScreen } from './features/WelcomeScreen';
import BackgroundChanger from './features/BackgroundChanger';
import AiVoiceStudio from './features/AiVoiceStudio';
import BrandKit from './features/BrandKit';
import CampaignStudio from './features/CampaignStudio';
import { useTheme } from './contexts/ThemeContext';
import { useNotification } from './contexts/NotificationContext';
import { useBrand } from './contexts/BrandContext';

const TABS: { id: Tab; name: string; icon: IconName; mobileName: string }[] = [
    { id: 'campaign', name: 'Campaign Studio', icon: 'zap', mobileName: 'Campaign' },
    { id: 'product', name: 'Product Shots', icon: 'image', mobileName: 'Product' },
    { id: 'background', name: 'Background Studio', icon: 'layers', mobileName: 'BG' },
    { id: 'vto', name: 'Virtual Try-On', icon: 'shoppingBag', mobileName: 'Virtual' },
    { id: 'fashion', name: 'Fashion Pose', icon: 'sparkles', mobileName: 'Pose' },
    { id: 'combine-text', name: 'Ad Creatives', icon: 'type', mobileName: 'Ads' },
    { id: 'voice', name: 'AI Voice Studio', icon: 'mic', mobileName: 'Voice' },
    { id: 'brand', name: 'Brand Kit', icon: 'palette', mobileName: 'Brand' },
];

interface NavbarProps {
    onGoHome: () => void;
    onToggleSidebar: () => void;
}

const Navbar: React.FC<NavbarProps> = ({ onGoHome, onToggleSidebar }) => {
    const { theme, toggleTheme } = useTheme();
    const { addToast } = useNotification();
    const { brandIdentity } = useBrand();

    return (
        <header className="bg-white/60 dark:bg-slate-950/60 backdrop-blur-lg sticky top-0 z-40 border-b border-slate-200/80 dark:border-slate-800/80">
            <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                     <div className="flex items-center">
                        <button 
                            onClick={onToggleSidebar} 
                            className="p-2 -ml-2 mr-2 text-slate-600 dark:text-slate-300"
                            aria-label="Open menu"
                        >
                            <Icon name="menu" size={24} />
                        </button>
                        <button onClick={onGoHome} className="flex items-center space-x-3 group focus:outline-none focus:ring-2 focus:ring-cyan-500/50 rounded-lg p-1">
                             <div className="w-9 h-9 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-lg flex items-center justify-center shadow-lg shadow-cyan-500/30 transform -rotate-12 transition-transform duration-300 ease-in-out group-hover:scale-110 group-hover:-rotate-6">
                                <Icon name="wand" className="text-white" size={20} />
                            </div>
                            <h1 className="text-2xl font-extrabold text-slate-800 dark:text-slate-100 tracking-tighter">Aisthetic Studio</h1>
                             {brandIdentity.primaryColor && (
                               <span 
                                className="hidden sm:block w-3 h-3 rounded-full transition-transform duration-300 group-hover:scale-125" 
                                style={{ backgroundColor: brandIdentity.primaryColor }}
                                title="Brand Kit is Active"
                               ></span>
                            )}
                        </button>
                    </div>
                    <div className="flex items-center space-x-2">
                        <nav className="hidden md:flex items-center space-x-2 text-sm font-semibold text-slate-600 dark:text-slate-300">
                            <a href="https://ai.google.dev/gemini-api/docs" target="_blank" rel="noopener noreferrer" className="px-3 py-2 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-cyan-500 transition-colors">Docs</a>
                            <a href="mailto:support@aisthetic.studio" className="px-3 py-2 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-cyan-500 transition-colors">Help</a>
                        </nav>
                         <button 
                            onClick={toggleTheme}
                            className="flex items-center justify-center w-9 h-9 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                            aria-label="Toggle theme"
                        >
                            <Icon name={theme === 'dark' ? 'sun' : 'moon'} size={18} />
                        </button>
                        <button 
                            onClick={() => addToast('User profile feature is coming soon!', 'info')}
                            className="flex items-center justify-center w-9 h-9 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                            aria-label="User Profile"
                        >
                            <Icon name="user" size={18} />
                        </button>
                    </div>
                </div>
            </div>
        </header>
    );
};

const App: React.FC = () => {
    const [activeTab, setActiveTab] = useState<Tab | null>(null);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const { brandIdentity } = useBrand();

    useEffect(() => {
        const root = document.documentElement;
        root.style.setProperty('--brand-primary', brandIdentity.primaryColor || '#00B8C6');
    }, [brandIdentity.primaryColor]);

    const handleTabClick = (tabId: Tab) => {
        setActiveTab(tabId);
        setIsSidebarOpen(false);
    };
    
    const handleGoHome = () => {
        setActiveTab(null);
        setIsSidebarOpen(false);
    }

    const renderContent = () => {
        if (!activeTab) {
            return <WelcomeScreen onTabSelect={setActiveTab} />;
        }
        
        const contentMap: { [key in Tab]: { component: React.ReactNode, title: string, subtitle: string } } = {
            campaign: { component: <CampaignStudio />, title: "AI Campaign Generator", subtitle: "Generate a complete set of social media assets from one product image in a single click." },
            product: { component: <ProductPhotography />, title: "Product Shot Generator", subtitle: "Create professional, studio-quality product photos from a single image." },
            background: { component: <BackgroundChanger />, title: "AI Background Changer", subtitle: "Automatically remove and replace the background of your product photos with a simple text description." },
            vto: { component: <VirtualTryOn />, title: "Virtual Try-On", subtitle: "Place your products on models in realistic settings, instantly." },
            fashion: { component: <FashionPose />, title: "AI Fashion Pose", subtitle: "Transform your model's pose with a simple text description." },
            'combine-text': { component: <CombineText />, title: "Ad Creative Studio", subtitle: "Generate compelling ad visuals by combining your image with powerful text." },
            voice: { component: <AiVoiceStudio />, title: "AI Voice Studio", subtitle: "Generate professional ad scripts and turn them into high-quality voice-overs with advanced controls." },
            brand: { component: <BrandKit />, title: "Brand Identity Kit", subtitle: "Define your brand's look and feel to generate consistent, on-brand content across all features." },
        };
        
        const currentContent = contentMap[activeTab];

        return (
            <div className="animate-fade-in">
                <header className="text-center mb-10 md:mb-12">
                    <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 dark:text-slate-50 tracking-tighter">
                        <span className="bg-clip-text text-transparent bg-gradient-to-r from-[var(--brand-primary)] to-blue-600">{currentContent.title}</span>
                    </h1>
                    <p className="text-lg text-slate-500 dark:text-slate-400 mt-4 max-w-2xl mx-auto">
                        {currentContent.subtitle}
                    </p>
                </header>
                {currentContent.component}
            </div>
        );
    };

    const NavLinks: React.FC<{ onLinkClick: (tabId: Tab) => void }> = ({ onLinkClick }) => (
        <nav className="flex-1 px-4 py-6 space-y-2">
            {TABS.map(tab => (
                <button
                    key={tab.id}
                    onClick={() => onLinkClick(tab.id)}
                    className={`flex items-center w-full p-3 font-bold rounded-xl transition-all duration-200 text-sm ${
                        activeTab === tab.id 
                        ? 'text-white shadow-lg' 
                        : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                    style={activeTab === tab.id ? { backgroundColor: brandIdentity.primaryColor, boxShadow: `0 4px 14px 0 ${brandIdentity.primaryColor}55` } : {}}
                >
                    <Icon name={tab.icon} className="w-5 h-5 mr-3" />
                    <span>{tab.name}</span>
                </button>
            ))}
        </nav>
    );
    
    return (
        <div className="min-h-screen">
            <Navbar onGoHome={handleGoHome} onToggleSidebar={() => setIsSidebarOpen(true)} />

            {/* Sidebar Overlay */}
            {isSidebarOpen && (
                <div 
                    className="fixed inset-0 bg-black/60 z-40" 
                    onClick={() => setIsSidebarOpen(false)}
                    aria-hidden="true"
                ></div>
            )}

            {/* Sidebar */}
            <aside className={`fixed top-0 left-0 h-full z-50 bg-white dark:bg-slate-950 w-72 transform transition-transform duration-300 ease-in-out flex flex-col ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
                <div className="flex items-center justify-between h-16 px-4 border-b border-slate-200 dark:border-slate-800 flex-shrink-0">
                    <button onClick={handleGoHome} className="flex items-center space-x-2 group">
                        <div className="w-8 h-8 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-lg flex items-center justify-center shadow-md -rotate-12">
                            <Icon name="wand" className="text-white" size={18} />
                        </div>
                        <h1 className="text-xl font-extrabold text-slate-800 dark:text-slate-100">Aisthetic</h1>
                    </button>
                    <button onClick={() => setIsSidebarOpen(false)} className="p-2 text-slate-500 dark:text-slate-400">
                        <Icon name="x" size={24} />
                    </button>
                </div>
                <NavLinks onLinkClick={handleTabClick} />
            </aside>
            
            <div className="relative">
                {/* Main Content Area */}
                <div>
                    <main className="flex flex-col min-h-[calc(100vh-4rem)]">
                        <div className="w-full max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 py-10 lg:py-16 flex-grow">
                            {renderContent()}
                        </div>
                         <footer className="text-center py-4 text-sm text-slate-500 dark:text-slate-400 border-t border-slate-200/80 dark:border-slate-800/80 flex-shrink-0">
                            <p>&copy; 2025 Aisthetic Studio — Stay TechUp</p>
                        </footer>
                    </main>
                </div>
            </div>
        </div>
    );
};

export default App;