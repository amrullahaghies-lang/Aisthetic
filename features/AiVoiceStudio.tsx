import React, { useState, useMemo, useCallback } from 'react';
import { Loader } from '../components/Loader';
import { Icon } from '../components/icons';
import { useNotification } from '../contexts/NotificationContext';
import { useBrand } from '../contexts/BrandContext';
import { generateAdScript, generateSpeech } from '../services/geminiService';
import { createWavDataUrl } from '../utils/audioUtils';

// As defined in user's provided code
const VOICES = [
    { name: "Aoede", label: "Aoede (Wanita, Ramah)" }, 
    { name: "Kore", label: "Kore (Pria, Tegas)" },
    { name: "Charon", label: "Charon (Pria, Informatif)" }, 
    { name: "Puck", label: "Puck (Pria, Ceria)" },
    { name: "Leda", label: "Leda (Wanita, Muda)" }, 
    { name: "Zephyr", label: "Zephyr (Wanita, Cerah)" },
    { name: "Sadachbia", label: "Sadachbia (Pria, Bersemangat)" }, 
    { name: "Vindemiatrix", label: "Vindemiatrix (Wanita, Lembut)" }
];

const TEXT_STYLES = [
    { name: "Normal (Default)", prompt: "" }, 
    { name: "Alur Cerita", prompt: "Bacakan sebagai narator cerita: " },
    { name: "Pembaca Berita", prompt: "Bacakan dengan nada formal seperti pembaca berita: " },
    { name: "Bersemangat", prompt: "Ucapkan dengan nada ceria dan bersemangat: " },
    { name: "Sedih", prompt: "Ucapkan dengan nada suara yang pelan dan sedih: " }
];

interface AudioResult {
    name: string;
    url: string;
}

const AiVoiceStudio: React.FC = () => {
    // State for Step 1: Script Generation
    const [productDesc, setProductDesc] = useState('');
    const [productUsp, setProductUsp] = useState('');
    const [scriptQuantity, setScriptQuantity] = useState(1);
    const [isScriptLoading, setIsScriptLoading] = useState(false);

    // State for Step 2: Audio Generation
    const [textInput, setTextInput] = useState('');
    const [selectedVoice, setSelectedVoice] = useState(VOICES[0].name);
    const [selectedStyle, setSelectedStyle] = useState(TEXT_STYLES[0].prompt);
    const [isAudioLoading, setIsAudioLoading] = useState(false);
    const [audioLoadingMessage, setAudioLoadingMessage] = useState('Generating Audio...');
    const [audioResults, setAudioResults] = useState<AudioResult[]>([]);

    const { addToast } = useNotification();
    const { brandIdentity } = useBrand();

    const handleGenerateScript = async () => {
        if (!productDesc.trim() || !productUsp.trim()) {
            addToast("Harap isi Deskripsi Produk dan USP.", 'error');
            return;
        }
        setIsScriptLoading(true);
        setAudioResults([]);
        try {
            const script = await generateAdScript(productDesc, productUsp, scriptQuantity, brandIdentity);
            setTextInput(script);
            addToast("Script generated successfully!", 'success');
        } catch (error) {
            console.error("Error generating script:", error);
            addToast('Failed to generate script. Please try again.', 'error');
        } finally {
            setIsScriptLoading(false);
        }
    };
    
    const handleGenerateAudio = async () => {
        const scriptsToProcess = textInput.trim().split(/\n\s*\n/).filter(t => t.trim());
        if (scriptsToProcess.length === 0) {
            addToast("Script is empty. Please generate a script first.", 'error');
            return;
        }

        setIsAudioLoading(true);
        setAudioResults([]);
        
        for (let i = 0; i < scriptsToProcess.length; i++) {
            setAudioLoadingMessage(`Processing ${i + 1}/${scriptsToProcess.length}...`);
            try {
                const base64Audio = await generateSpeech(scriptsToProcess[i], selectedVoice, {
                    stylePrompt: selectedStyle
                });
                const url = createWavDataUrl(base64Audio);
                const newResult = { name: `audio_${i + 1}.wav`, url };
                // Update state inside the loop to show results as they come in
                setAudioResults(prevResults => [...prevResults, newResult]);
            } catch (error: any) {
                console.error(`Error generating audio for script ${i + 1}:`, error);
                addToast(`Failed on script ${i + 1}: ${error.message}`, 'error');
            }
        }
        setIsAudioLoading(false);
        setAudioLoadingMessage('Generating Audio...');
    };

    const handleDownloadZip = useCallback(async () => {
        if (audioResults.length === 0) return;
        // @ts-ignore
        const zip = new window.JSZip();
        
        await Promise.all(audioResults.map(async (result) => {
            const response = await fetch(result.url);
            const blob = await response.blob();
            zip.file(result.name, blob);
        }));

        zip.generateAsync({ type: "blob" }).then((content: Blob) => {
            const link = document.createElement('a');
            link.href = URL.createObjectURL(content);
            link.download = 'aisthetic_voice_studio_audios.zip';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        });
    }, [audioResults]);

    const canGenerateScript = useMemo(() => productDesc.trim() && productUsp.trim() && !isScriptLoading, [productDesc, productUsp, isScriptLoading]);
    const canGenerateAudio = useMemo(() => textInput.trim() && !isAudioLoading, [textInput, isAudioLoading]);

    return (
        <div className="bg-white dark:bg-slate-800/50 rounded-3xl shadow-xl p-6 md:p-10 w-full border border-gray-200 dark:border-slate-700 mx-auto max-w-4xl space-y-10">
            {/* --- STEP 1: SCRIPT GENERATION --- */}
            <div className="space-y-6">
                <div className="pb-3 border-b border-gray-200 dark:border-slate-700">
                    <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Langkah 1: Generate Script VO</h2>
                    <p className="text-slate-500 dark:text-slate-400 mt-1">Buat script iklan profesional dalam hitungan detik.</p>
                </div>
                <div>
                    <label htmlFor="product-desc" className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Deskripsi Produk</label>
                    <textarea id="product-desc" value={productDesc} onChange={e => setProductDesc(e.target.value)} rows={3} className="w-full p-3 bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-cyan-500" placeholder="Contoh: Kopi Gayo single origin, diproses secara natural..."></textarea>
                </div>
                <div>
                    <label htmlFor="product-usp" className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Unique Selling Point (USP)</label>
                    <textarea id="product-usp" value={productUsp} onChange={e => setProductUsp(e.target.value)} rows={2} className="w-full p-3 bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-cyan-500" placeholder="Contoh: 100% biji kopi Arabika pilihan, juara kontes kopi nasional."></textarea>
                </div>
                <div>
                    <label htmlFor="script-quantity" className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Jumlah Variasi Script</label>
                    <input type="number" id="script-quantity" value={scriptQuantity} onChange={e => setScriptQuantity(Math.max(1, parseInt(e.target.value, 10)) || 1)} min="1" max="10" className="w-full p-3 bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-cyan-500"></input>
                </div>
                <button onClick={handleGenerateScript} disabled={!canGenerateScript} className="w-full bg-slate-700 text-white font-bold py-3 px-4 rounded-xl flex items-center justify-center text-lg hover:bg-slate-800 dark:bg-slate-600 dark:hover:bg-slate-500 disabled:bg-slate-300 dark:disabled:bg-slate-700 disabled:cursor-not-allowed focus:ring-4 focus:ring-slate-500/50 transition-all duration-200">
                    {isScriptLoading ? <><Loader /> <span className="ml-3">Generating Script...</span></> : <><Icon name="penSquare" className="w-5 h-5 mr-2" /><span>Buat Script</span></>}
                </button>
            </div>

            <hr className="dark:border-slate-700" />

            {/* --- STEP 2: AUDIO GENERATION --- */}
            <div className="space-y-6">
                 <div className="pb-3 border-b border-gray-200 dark:border-slate-700">
                    <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Langkah 2: Generate Audio</h2>
                     <p className="text-slate-500 dark:text-slate-400 mt-1">Ubah script menjadi suara alami dengan AI.</p>
                </div>
                <div>
                    <label htmlFor="text-input" className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Teks untuk diucapkan</label>
                    <textarea id="text-input" value={textInput} onChange={e => setTextInput(e.target.value)} rows={8} className="w-full p-3 bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-cyan-500" placeholder="Script yang di-generate akan muncul di sini..."></textarea>
                    <p className="text-right text-xs text-slate-500 dark:text-slate-400 mt-1 pr-1">{textInput.length} karakter</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="voice-select" className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Pilih Suara</label>
                        <select id="voice-select" value={selectedVoice} onChange={e => setSelectedVoice(e.target.value)} className="w-full p-3 bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-cyan-500">
                            {VOICES.map(v => <option key={v.name} value={v.name}>{v.label}</option>)}
                        </select>
                    </div>
                     <div>
                        <label htmlFor="text-style-select" className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Gaya Bicara</label>
                        <select id="text-style-select" value={selectedStyle} onChange={e => setSelectedStyle(e.target.value)} className="w-full p-3 bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-cyan-500">
                            {TEXT_STYLES.map(s => <option key={s.name} value={s.prompt}>{s.name}</option>)}
                        </select>
                    </div>
                </div>
                 <button onClick={handleGenerateAudio} disabled={!canGenerateAudio} className="w-full bg-cyan-500 text-white font-bold py-3 px-4 rounded-xl flex items-center justify-center text-lg hover:bg-cyan-600 disabled:bg-slate-300 dark:disabled:bg-slate-700 disabled:cursor-not-allowed focus:ring-4 focus:ring-cyan-500/50 transition-all duration-200 shadow-lg shadow-cyan-500/30">
                    {isAudioLoading ? <><Loader /> <span className="ml-3">{audioLoadingMessage}</span></> : <><Icon name="mic" className="w-5 h-5 mr-2" /><span>Generate Audio</span></>}
                </button>
            </div>
            
            {/* --- RESULTS --- */}
            {audioResults.length > 0 && (
                <div className="space-y-6">
                    <div className="pb-3 border-b border-gray-200 dark:border-slate-700">
                        <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Hasil Audio</h2>
                    </div>
                    <div className="space-y-4">
                        {audioResults.map((result, index) => (
                            <div key={index} className="p-4 border border-slate-200 dark:border-slate-700 rounded-xl space-y-2 bg-slate-50 dark:bg-slate-800">
                                <p className="font-semibold text-gray-700 dark:text-slate-200">Hasil Audio {index + 1}</p>
                                <audio controls src={result.url} className="w-full"></audio>
                            </div>
                        ))}
                    </div>
                     <button onClick={handleDownloadZip} className="w-full bg-cyan-600 text-white font-bold py-2 px-4 rounded-xl flex items-center justify-center hover:bg-cyan-700 focus:ring-4 focus:ring-cyan-500/50 transition-all duration-200">
                        <Icon name="fileArchive" className="w-5 h-5 mr-2" />
                        Unduh Semua (.zip)
                    </button>
                </div>
            )}
        </div>
    );
};

export default AiVoiceStudio;