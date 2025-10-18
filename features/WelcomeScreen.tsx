import React from 'react';
import { Icon } from '../components/icons';

const Step: React.FC<{ number: string; title: string; description: string; icon: 'image' | 'sparkles' | 'download' }> = ({ number, title, description, icon }) => (
    <div className="flex flex-col items-center text-center">
        <div className="relative mb-4">
            <div className="w-16 h-16 bg-cyan-500/10 rounded-full flex items-center justify-center">
                <Icon name={icon} className="w-8 h-8 text-cyan-500" />
            </div>
            <div className="absolute -top-1 -left-1 w-8 h-8 bg-cyan-500 text-white font-bold text-sm rounded-full flex items-center justify-center border-4 border-white dark:border-slate-800">
                {number}
            </div>
        </div>
        <h3 className="font-bold text-lg text-slate-800 dark:text-slate-100">{title}</h3>
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">{description}</p>
    </div>
);

export const WelcomeScreen: React.FC = () => {
    return (
        <div className="flex flex-col items-center justify-center h-full animate-fade-in">
            <div className="bg-white dark:bg-slate-800/50 border border-gray-200 dark:border-slate-700 rounded-3xl shadow-2xl dark:shadow-slate-900/50 p-8 sm:p-12 text-center max-w-4xl mx-auto">
                <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-slate-900 dark:text-slate-50 tracking-tighter">
                    Selamat Datang di <span className="bg-clip-text text-transparent bg-gradient-to-r from-cyan-500 to-blue-600">Aisthetic Studio</span>
                </h1>
                <p className="text-lg text-slate-500 dark:text-slate-400 mt-5 max-w-2xl mx-auto">
                    Pilih salah satu fitur dari bilah sisi di sebelah kiri untuk mulai membuat konten AI yang menakjubkan untuk bisnis Anda.
                </p>

                <div className="mt-12 pt-10 border-t border-gray-200 dark:border-slate-700">
                    <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-8">Cara Menggunakan Aplikasi</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
                        <Step 
                            number="1"
                            title="Pilih Fitur"
                            description="Pilih alat yang Anda butuhkan dari menu, seperti Product Shots atau Virtual Try-On."
                            icon="image"
                        />
                         <Step 
                            number="2"
                            title="Unggah & Deskripsikan"
                            description="Unggah gambar Anda dan berikan deskripsi atau tema untuk memandu AI."
                            icon="sparkles"
                        />
                         <Step 
                            number="3"
                            title="Generate & Unduh"
                            description="Klik generate untuk membuat visual, lalu unduh hasil favorit Anda dalam resolusi tinggi."
                            icon="download"
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};
