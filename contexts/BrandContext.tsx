import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';
import type { BrandIdentity, ImageData } from '../types';

interface BrandContextType {
    brandIdentity: BrandIdentity;
    saveBrandIdentity: (identity: Partial<BrandIdentity>) => void;
    setLogo: (logo: ImageData | null) => void;
    addAsset: (asset: ImageData) => void;
    removeAsset: (assetName: string) => void;
}

const BrandContext = createContext<BrandContextType | undefined>(undefined);

const defaultIdentity: BrandIdentity = {
    logo: null,
    primaryColor: '#00B8C6', // Default to brand color
    secondaryColor: '#1e293b', // Default to dark slate
    voice: '',
    primaryFont: '',
    secondaryFont: '',
    assets: [],
};

const getInitialState = (): BrandIdentity => {
    try {
        const item = window.localStorage.getItem('brandIdentity');
        if (item) {
            const parsed = JSON.parse(item);
            // Ensure all keys are present
            return { ...defaultIdentity, ...parsed };
        }
        return defaultIdentity;
    } catch (error) {
        console.error("Failed to parse brand identity from localStorage", error);
        return defaultIdentity;
    }
};

export const BrandProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [brandIdentity, setBrandIdentity] = useState<BrandIdentity>(getInitialState);

    const persistIdentity = (newIdentity: BrandIdentity) => {
        try {
            window.localStorage.setItem('brandIdentity', JSON.stringify(newIdentity));
        } catch (error) {
            console.error("Failed to save brand identity to localStorage", error);
        }
    };

    const saveBrandIdentity = useCallback((identityUpdate: Partial<BrandIdentity>) => {
        setBrandIdentity(prevIdentity => {
            const newIdentity = { ...prevIdentity, ...identityUpdate };
            persistIdentity(newIdentity);
            return newIdentity;
        });
    }, []);
    
    const setLogo = useCallback((logo: ImageData | null) => {
        saveBrandIdentity({ logo });
    }, [saveBrandIdentity]);

    const addAsset = useCallback((asset: ImageData) => {
        setBrandIdentity(prev => {
            // Avoid duplicates
            if (prev.assets.some(a => a.name === asset.name)) {
                return prev;
            }
            const newIdentity = { ...prev, assets: [...prev.assets, asset] };
            persistIdentity(newIdentity);
            return newIdentity;
        });
    }, []);

    const removeAsset = useCallback((assetName: string) => {
        setBrandIdentity(prev => {
            const newIdentity = { ...prev, assets: prev.assets.filter(a => a.name !== assetName) };
            persistIdentity(newIdentity);
            return newIdentity;
        });
    }, []);


    return (
        <BrandContext.Provider value={{ brandIdentity, saveBrandIdentity, setLogo, addAsset, removeAsset }}>
            {children}
        </BrandContext.Provider>
    );
};

export const useBrand = () => {
    const context = useContext(BrandContext);
    if (context === undefined) {
        throw new Error('useBrand must be used within a BrandProvider');
    }
    return context;
};