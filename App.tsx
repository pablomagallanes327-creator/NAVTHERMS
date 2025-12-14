
import React, { useState, useCallback } from 'react';
import { getSimplifiedTranslation, generateVisualExplanation, generateInfographicPrompt } from './services/geminiService';
import type { TranslationResponse, GlossaryItem } from './types';

const ShipIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
        <path d="M19.95 11.24c-1.12-2.3-2.52-4.1-4.2-5.42a1 1 0 0 0-1.5 1.34c1.42 1.13 2.65 2.7 3.63 4.69l-3.38.68-2-4A1 1 0 0 0 11.5 6h-2a1 1 0 0 0-.95.68l-2 4-3.38-.68a1 1 0 0 0-1.17 1.17l.68 3.38-4 2A1 1 0 0 0 1 18h22a1 1 0 0 0 .68-1.72l-4-2 .68-3.38a1 1 0 0 0-.41-1.66zM5.5 13H4a1 1 0 0 0-1 1v1h2.5V13zm3 0v2H11V13h2v2h2.5V13H18a1 1 0 0 0 1-1h-2.5a1 1 0 0 0-1 1h-2a1 1 0 0 0-1-1h-2a1 1 0 0 0-1 1H8.5a1 1 0 0 0-1-1H5a1 1 0 0 0 1 1h2.5z" />
    </svg>
);

const LoaderIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
        <path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm0 18a8 8 0 1 1 8-8 8 8 0 0 1-8 8z" opacity=".2" />
        <path d="M12 4a8 8 0 0 1 8 8h-2a6 6 0 0 0-6-6V4z">
            <animateTransform attributeName="transform" attributeType="XML" type="rotate" dur="1s" from="0 12 12" to="360 12 12" repeatCount="indefinite" />
        </path>
    </svg>
);

const FileUploadIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
        <path d="M19.35 10.04A7.49 7.49 0 0 0 12 4C9.11 4 6.6 5.64 5.35 8.04A5.994 5.994 0 0 0 0 14a6 6 0 0 0 6 6h13a5 5 0 0 0 5-5c0-2.64-2.05-4.78-4.65-4.96zM14 13v4h-4v-4H7l5-5 5 5h-3z" />
    </svg>
);

const CloseIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
        <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
    </svg>
);

const ImageIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
        <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z" />
    </svg>
);

const PromptIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
        <path d="M20 2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h14l4 4V4c0-1.1-.9-2-2-2zm-2 12H6v-2h12v2zm0-3H6V9h12v2zm0-3H6V6h12v2z" />
    </svg>
);

const CopyIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
        <path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z" />
    </svg>
);

const CheckIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
        <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
    </svg>
);


const App: React.FC = () => {
    const [inputText, setInputText] = useState<string>('');
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [isImageLoading, setIsImageLoading] = useState<boolean>(false);
    const [isPromptLoading, setIsPromptLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [apiResponse, setApiResponse] = useState<TranslationResponse | null>(null);
    const [generatedImage, setGeneratedImage] = useState<string | null>(null);
    const [infographicPrompt, setInfographicPrompt] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);

    const placeholderText = `Pegue aquí un párrafo de su manual técnico, por ejemplo: "La unidad de control de propulsión (PCU) modula el flujo de combustible al motor de turbina de gas principal (GTM) basándose en las entradas del acelerador desde el puente. La realimentación del sensor de RPM asegura que se mantenga la velocidad de eje deseada, mientras que los sensores de temperatura de los gases de escape (EGT) previenen condiciones de sobrecalentamiento."`;

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            if (!file.type.startsWith('text/') && !file.name.endsWith('.txt') && !file.name.endsWith('.md')) {
                setError("Por favor, sube un archivo de texto plano (ej. .txt, .md).");
                setSelectedFile(null);
                setInputText('');
                event.target.value = '';
                return;
            }

            setError(null);
            setApiResponse(null);
            setGeneratedImage(null);
            setInfographicPrompt(null);
            setSelectedFile(file);

            const reader = new FileReader();
            reader.onload = (e) => {
                const text = e.target?.result as string;
                setInputText(text);
            };
            reader.onerror = () => {
                setError("Error al leer el archivo.");
                setSelectedFile(null);
                setInputText('');
            };
            reader.readAsText(file);
        }
        event.target.value = '';
    };

    const handleRemoveFile = () => {
        setSelectedFile(null);
        setInputText('');
        setError(null);
        setGeneratedImage(null);
        setInfographicPrompt(null);
    };

    const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        if (selectedFile) {
            setSelectedFile(null);
        }
        setInputText(e.target.value);
    };


    const handleTranslate = useCallback(async () => {
        if (!inputText.trim() || isLoading) return;

        setIsLoading(true);
        setError(null);
        setApiResponse(null);
        setGeneratedImage(null);
        setInfographicPrompt(null);

        const response = await getSimplifiedTranslation(inputText);

        if (response.error) {
            setError(response.error);
        } else {
            setApiResponse(response);
        }

        setIsLoading(false);
    }, [inputText, isLoading]);

    const handleGenerateImage = useCallback(async () => {
        if (!inputText.trim() || isImageLoading) return;

        setIsImageLoading(true);
        setError(null);
        setGeneratedImage(null);
        // We keep the prompt result if it exists, or translation if it exists
        
        try {
            const imageUrl = await generateVisualExplanation(inputText);
            if (imageUrl) {
                setGeneratedImage(imageUrl);
            } else {
                setError("No se pudo generar la imagen.");
            }
        } catch (err) {
            setError("Error al generar la imagen. Intente de nuevo.");
        } finally {
            setIsImageLoading(false);
        }
    }, [inputText, isImageLoading]);

    const handleGeneratePrompt = useCallback(async () => {
        if (!inputText.trim() || isPromptLoading) return;

        setIsPromptLoading(true);
        setError(null);
        setInfographicPrompt(null);

        try {
            const promptText = await generateInfographicPrompt(inputText);
            if (promptText) {
                setInfographicPrompt(promptText);
            } else {
                setError("No se pudo generar el prompt.");
            }
        } catch (err) {
            setError("Error al generar el prompt. Intente de nuevo.");
        } finally {
            setIsPromptLoading(false);
        }
    }, [inputText, isPromptLoading]);

    const copyToClipboard = () => {
        if (infographicPrompt) {
            navigator.clipboard.writeText(infographicPrompt);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    const renderResponse = () => {
        if (!apiResponse) return null;
        
        return (
            <div className="space-y-6 animate-fade-in">
                {apiResponse.traduccionSimplificada && (
                    <div className="bg-slate-800/50 backdrop-blur-sm p-6 rounded-lg border border-slate-700">
                        <h2 className="text-xl font-bold text-cyan-400 mb-3">Traducción Simplificada</h2>
                        <p className="text-slate-300 leading-relaxed">{apiResponse.traduccionSimplificada}</p>
                    </div>
                )}

                {apiResponse.listaPorPasos && apiResponse.listaPorPasos.length > 0 && (
                    <div className="bg-slate-800/50 backdrop-blur-sm p-6 rounded-lg border border-slate-700">
                        <h2 className="text-xl font-bold text-cyan-400 mb-3">Procedimiento (Paso a Paso)</h2>
                        <ol className="list-decimal list-inside space-y-2 text-slate-300">
                            {apiResponse.listaPorPasos.map((step, index) => <li key={index}>{step}</li>)}
                        </ol>
                    </div>
                )}

                {apiResponse.glosario && apiResponse.glosario.length > 0 && (
                    <div className="bg-slate-800/50 backdrop-blur-sm p-6 rounded-lg border border-slate-700">
                        <h2 className="text-xl font-bold text-cyan-400 mb-3">Glosario para Cadete</h2>
                        <ul className="space-y-3 text-slate-300">
                            {apiResponse.glosario.map((item: GlossaryItem, index: number) => (
                                <li key={index}>
                                    <strong className="text-slate-100">{item.termino}:</strong> {item.definicion}
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
            </div>
        );
    };

    const renderImage = () => {
        if (!generatedImage) return null;

        return (
            <div className="mt-6 bg-slate-800/50 backdrop-blur-sm p-6 rounded-lg border border-slate-700 animate-fade-in">
                <h2 className="text-xl font-bold text-purple-400 mb-3">Ilustración Técnica Generada por IA</h2>
                <div className="rounded-lg overflow-hidden border border-slate-600 shadow-lg">
                    <img 
                        src={generatedImage} 
                        alt="Ilustración explicativa generada por IA" 
                        className="w-full h-auto object-cover"
                    />
                </div>
                <p className="text-xs text-slate-500 mt-2 text-center">Imagen generada por Gemini 2.5 (Sin texto). Los diagramas pueden ser aproximados.</p>
            </div>
        )
    }

    const renderPrompt = () => {
        if (!infographicPrompt) return null;

        return (
            <div className="mt-6 bg-slate-800/50 backdrop-blur-sm p-6 rounded-lg border border-orange-700/50 animate-fade-in">
                <div className="flex justify-between items-start mb-3">
                    <h2 className="text-xl font-bold text-orange-400">Prompt para Infografía</h2>
                    <button 
                        onClick={copyToClipboard}
                        className="flex items-center gap-1 text-xs bg-slate-700 hover:bg-slate-600 text-slate-200 py-1 px-3 rounded transition-colors"
                        title="Copiar al portapapeles"
                    >
                        {copied ? <CheckIcon className="w-4 h-4 text-green-400" /> : <CopyIcon className="w-4 h-4" />}
                        {copied ? "Copiado" : "Copiar"}
                    </button>
                </div>
                <div className="bg-slate-900 p-4 rounded-md border border-slate-700 font-mono text-sm text-slate-300 whitespace-pre-wrap leading-relaxed shadow-inner">
                    {infographicPrompt}
                </div>
                <p className="text-xs text-slate-500 mt-2">Copia este prompt y úsalo en herramientas como Midjourney o Imagen para obtener una infografía profesional.</p>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-slate-900 text-slate-200 font-sans p-4 sm:p-6 lg:p-8">
            <div 
                className="absolute inset-0 z-0 opacity-10"
                style={{
                    backgroundImage: `radial-gradient(circle, #1e293b 1px, transparent 1px)`,
                    backgroundSize: '20px 20px'
                }}
            />
            <main className="max-w-3xl mx-auto relative z-10">
                <header className="text-center mb-8">
                    <div className="flex justify-center items-center gap-4 mb-4">
                       <ShipIcon className="w-12 h-12 text-cyan-400" />
                       <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-50 tracking-tight">
                           Traductor de Jerga Técnica Naval
                       </h1>
                    </div>
                    <p className="text-slate-400">Una herramienta de IA para cadetes que simplifica manuales complejos.</p>
                </header>

                <div className="bg-slate-800 p-6 rounded-lg shadow-2xl border border-slate-700">
                    <input
                        type="file"
                        id="file-upload"
                        className="hidden"
                        onChange={handleFileChange}
                        accept=".txt,.md,text/plain"
                        disabled={isLoading || isImageLoading || isPromptLoading}
                    />
                    <label
                        htmlFor="file-upload"
                        className={`w-full flex justify-center items-center gap-2 bg-slate-700 text-slate-300 font-bold py-3 px-4 rounded-md transition-all duration-200 cursor-pointer ${isLoading || isImageLoading || isPromptLoading ? 'opacity-50 cursor-not-allowed' : 'hover:bg-slate-600 hover:scale-105 active:scale-100'}`}
                    >
                        <FileUploadIcon className="w-5 h-5" />
                        <span>Seleccionar archivo (.txt, .md)</span>
                    </label>

                    {selectedFile && (
                        <div className="mt-4 flex justify-between items-center bg-slate-900 p-3 rounded-md border border-slate-600 animate-fade-in">
                            <span className="text-slate-400 text-sm truncate pr-2">{selectedFile.name}</span>
                            <button onClick={handleRemoveFile} className="text-slate-500 hover:text-slate-300 transition-colors flex-shrink-0">
                                <CloseIcon className="w-5 h-5" />
                            </button>
                        </div>
                    )}

                    <div className="flex items-center my-4">
                        <div className="flex-grow border-t border-slate-600"></div>
                        <span className="flex-shrink mx-4 text-slate-500 text-xs font-semibold">O</span>
                        <div className="flex-grow border-t border-slate-600"></div>
                    </div>

                    <label htmlFor="manual-text" className="block text-sm font-medium text-slate-400 mb-2">Pegue el texto del manual aquí:</label>
                    <textarea
                        id="manual-text"
                        rows={8}
                        className="w-full p-4 bg-slate-900 text-slate-300 border border-slate-600 rounded-md focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-colors duration-200 placeholder-slate-500 disabled:bg-slate-800/50 disabled:cursor-not-allowed"
                        placeholder={placeholderText}
                        value={inputText}
                        onChange={handleTextChange}
                        disabled={isLoading || isImageLoading || isPromptLoading || !!selectedFile}
                    />
                    
                    <div className="flex flex-col sm:flex-row gap-4 mt-4">
                        <button
                            onClick={handleTranslate}
                            disabled={isLoading || isImageLoading || isPromptLoading || !inputText.trim()}
                            className="flex-1 flex justify-center items-center gap-2 bg-cyan-600 hover:bg-cyan-700 disabled:bg-slate-600 disabled:cursor-not-allowed text-white font-bold py-3 px-2 rounded-md transition-all duration-200 transform hover:scale-105 active:scale-100 disabled:scale-100 text-sm sm:text-base"
                        >
                            {isLoading ? (
                                <>
                                   <LoaderIcon className="w-5 h-5 animate-spin" />
                                   Traducir
                                </>
                            ) : (
                                'Traducir Texto'
                            )}
                        </button>
                        
                        <button
                            onClick={handleGenerateImage}
                            disabled={isLoading || isImageLoading || isPromptLoading || !inputText.trim()}
                            className="flex-1 flex justify-center items-center gap-2 bg-purple-600 hover:bg-purple-700 disabled:bg-slate-600 disabled:cursor-not-allowed text-white font-bold py-3 px-2 rounded-md transition-all duration-200 transform hover:scale-105 active:scale-100 disabled:scale-100 text-sm sm:text-base"
                        >
                            {isImageLoading ? (
                                <>
                                   <LoaderIcon className="w-5 h-5 animate-spin" />
                                   Generando
                                </>
                            ) : (
                                <>
                                    <ImageIcon className="w-5 h-5" />
                                    Generar Imagen
                                </>
                            )}
                        </button>

                        <button
                            onClick={handleGeneratePrompt}
                            disabled={isLoading || isImageLoading || isPromptLoading || !inputText.trim()}
                            className="flex-1 flex justify-center items-center gap-2 bg-orange-600 hover:bg-orange-700 disabled:bg-slate-600 disabled:cursor-not-allowed text-white font-bold py-3 px-2 rounded-md transition-all duration-200 transform hover:scale-105 active:scale-100 disabled:scale-100 text-sm sm:text-base"
                        >
                            {isPromptLoading ? (
                                <>
                                   <LoaderIcon className="w-5 h-5 animate-spin" />
                                   Creando
                                </>
                            ) : (
                                <>
                                    <PromptIcon className="w-5 h-5" />
                                    Prompt Infografía
                                </>
                            )}
                        </button>
                    </div>
                </div>

                {error && (
                    <div className="mt-8 bg-red-900/50 border border-red-700 text-red-300 px-4 py-3 rounded-lg relative animate-fade-in" role="alert">
                        <strong className="font-bold">Error: </strong>
                        <span className="block sm:inline">{error}</span>
                    </div>
                )}
                
                <div className="space-y-6 mt-8">
                     {renderResponse()}
                     {renderImage()}
                     {renderPrompt()}
                </div>

            </main>
             <footer className="text-center mt-12 text-slate-500 text-sm">
                <p>Versión 1.2 | Diseñado para la instrucción de cadetes.</p>
            </footer>
        </div>
    );
};

export default App;
