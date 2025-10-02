import React, { useState, useCallback, useEffect, Fragment } from 'react';
import { Listbox, Transition } from '@headlessui/react';
import { Upload, Check, FileText, Image, Video, File, X, ChevronDown, PlusCircle, Briefcase, FolderPlus, Cloud, Trash2, XCircle } from 'lucide-react';
import aprobiLogo from '../assets/aprobi-logo.jpg';
import CampaignSelector from '../components/CampaignSelector';
import CampaignPreviewCard from '../components/CampaignPreviewCard';

// -- COMPONENTES INTERNOS --

const clients = [
    { name: 'AMERICANAS' }, { name: 'ARAMIS' }, { name: 'CANTU' }, { name: 'COGNA' }, { name: 'ESPORTE DA SORTE' },
    { name: 'HASDEX' }, { name: 'HORTIFRUTI NATURAL DA TERRA' }, { name: 'IDEAZARVOS' }, { name: 'KEETA' },
    { name: 'MASTERCARD' }, { name: 'O BOTICARIO' }, { name: 'RD' }, { name: 'SAMSUNG' },
    { name: 'SAMSUNG E STORE' }, { name: 'SICREDI' }, { name: 'VIVO' },
].sort((a, b) => a.name.localeCompare(b.name));

const FileTypeIcon = ({ fileType }) => {
    if (fileType.startsWith('image/')) return <Image className="w-5 h-5 text-blue-500" />;
    if (fileType.startsWith('video/')) return <Video className="w-5 h-5 text-purple-500" />;
    return <File className="w-5 h-5 text-slate-500" />;
};

const FileViewer = ({ file, onOpenPopup, isSelectionMode, isSelected, onSelect }) => {
    const handleCardClick = () => {
        if (isSelectionMode) {
            onSelect(file.id);
        } else {
            onOpenPopup(file);
        }
    };

    const renderPreview = () => {
        if (file.type.startsWith('image/')) return <img src={file.url} alt={file.name} className="w-full h-48 object-cover rounded-xl" />;
        if (file.type.startsWith('video/')) return <div className="w-full h-48 bg-purple-100 rounded-xl flex items-center justify-center"><Video className="w-16 h-16 text-purple-400" /></div>;
        return <div className="w-full h-48 bg-slate-100 rounded-xl flex items-center justify-center"><File className="w-16 h-16 text-slate-400" /></div>;
    };

    return (
        <div className="relative" onClick={handleCardClick}>
            {isSelectionMode && (
                <div className="absolute top-2 right-2 z-10 w-6 h-6 bg-white rounded-full border-2 flex items-center justify-center pointer-events-none">
                    {isSelected && <Check className="w-4 h-4 text-emerald-500" />}
                </div>
            )}
            <div className={`bg-white rounded-2xl shadow-lg border-2 p-4 transition-all duration-300 ${isSelectionMode ? 'cursor-pointer' : 'cursor-pointer hover:shadow-xl hover:-translate-y-1'} ${isSelected ? 'border-emerald-500' : 'border-slate-100'}`}>
                {renderPreview()}
                <div className="mt-4 flex items-center">
                    <FileTypeIcon fileType={file.type} />
                    <span className="ml-3 text-sm font-semibold text-slate-700 truncate">{file.name}</span>
                </div>
            </div>
        </div>
    );
};

const NewCampaignModal = ({ isOpen, onClose, onCampaignCreated }) => {
    const [name, setName] = useState('');
    const [selectedClient, setSelectedClient] = useState(null);
    const [error, setError] = useState('');
    const [isCreating, setIsCreating] = useState(false);

    if (!isOpen) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!name || !selectedClient) {
            setError('O nome da campanha e o cliente são obrigatórios.');
            return;
        }
        setError('');
        setIsCreating(true);

        try {
            const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/campaigns`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ name, client: selectedClient.name }),
            });

            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.error || 'Falha ao criar campanha.');
            }

            const newCampaign = await response.json();
            onCampaignCreated(newCampaign);
            handleClose();
        } catch (err) {
            setError(err.message);
        } finally {
            setIsCreating(false);
        }
    };

    const handleClose = () => {
        setName('');
        setSelectedClient(null);
        setError('');
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
                <div className="p-6 border-b border-slate-200 flex justify-between items-center">
                    <h3 className="text-xl font-bold text-slate-800">Criar Nova Campanha</h3>
                    <button onClick={handleClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                        <X className="w-5 h-5 text-slate-600" />
                    </button>
                </div>
                <form onSubmit={handleSubmit}>
                    <div className="p-6 space-y-6">
                        {error && <p className="text-red-500 text-sm">{error}</p>}
                        <div>
                            <label htmlFor="campaignName" className="block text-sm font-semibold text-slate-700 mb-2">Nome da Campanha *</label>
                            <input 
                                type="text" 
                                id="campaignName" 
                                value={name} 
                                onChange={(e) => setName(e.target.value)} 
                                className="w-full p-3 border border-slate-300 rounded-xl focus:border-[#ffc801] focus:ring-2 focus:ring-[#ffc801]/20 outline-none" 
                                required 
                            />
                        </div>
                        <div>
                            <Listbox value={selectedClient} onChange={setSelectedClient}>
                                <Listbox.Label className="block text-sm font-semibold text-slate-700 mb-2">Cliente *</Listbox.Label>
                                <div className="relative">
                                    <Listbox.Button className="relative w-full cursor-default rounded-xl bg-white py-3 pl-4 pr-10 text-left border border-slate-300 focus:border-[#ffc801] focus:ring-2 focus:ring-[#ffc801]/20 outline-none">
                                        <span className="block truncate">{selectedClient ? selectedClient.name : "Selecione um cliente"}</span>
                                        <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                                            <ChevronDown className="h-5 w-5 text-gray-400" aria-hidden="true" />
                                        </span>
                                    </Listbox.Button>
                                    <Transition as={Fragment} leave="transition ease-in duration-100" leaveFrom="opacity-100" leaveTo="opacity-0">
                                        <Listbox.Options className="absolute mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black/5 focus:outline-none sm:text-sm z-10">
                                            {clients.map((client) => (
                                                <Listbox.Option
                                                    key={client.name}
                                                    className={({ active }) => `relative cursor-default select-none py-2 pl-10 pr-4 ${ active ? 'bg-amber-100 text-amber-900' : 'text-gray-900' }`}
                                                    value={client}
                                                >
                                                    {({ selected }) => (
                                                        <>
                                                            <span className={`block truncate ${ selected ? 'font-medium' : 'font-normal' }`}>
                                                                {client.name}
                                                            </span>
                                                            {selected ? (
                                                                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-amber-600">
                                                                    <Check className="h-5 w-5" aria-hidden="true" />
                                                                </span>
                                                            ) : null}
                                                        </>
                                                    )}
                                                </Listbox.Option>
                                            ))}
                                        </Listbox.Options>
                                    </Transition>
                                </div>
                            </Listbox>
                        </div>
                    </div>
                    <div className="flex items-center justify-end space-x-4 p-6 bg-slate-50 rounded-b-2xl">
                        <button type="button" onClick={handleClose} className="px-4 py-2 text-slate-600 font-semibold hover:text-slate-800">Cancelar</button>
                        <button type="submit" disabled={isCreating} className="px-6 py-2 bg-gradient-to-r from-[#ffc801] to-[#ffb700] text-white font-semibold rounded-lg hover:shadow-lg disabled:opacity-50 disabled:grayscale">
                            {isCreating ? 'Criando...' : 'Criar Campanha'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const FilePopup = ({ file, onClose }) => {
    if (!file) return null;

    const renderContent = () => {
        if (file.type.startsWith('image/')) {
            return <img src={file.url} alt={file.name} className="max-w-full max-h-[70vh] object-contain rounded-xl shadow-lg" />;
        }
        if (file.type.startsWith('video/')) {
            return <video src={file.url} controls autoPlay className="max-w-full max-h-[70vh] object-contain rounded-xl shadow-lg" />;
        }
        return (
            <div className="w-96 h-96 bg-slate-100 rounded-xl flex flex-col items-center justify-center text-center p-4">
                <File className="w-24 h-24 text-slate-400 mb-4" />
                <span className="text-slate-700 font-semibold">{file.name}</span>
                <p className="text-slate-500 text-sm mt-2">Pré-visualização não disponível para este tipo de arquivo.</p>
            </div>
        );
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto flex flex-col" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center justify-between p-4 border-b border-slate-200">
                    <h3 className="text-lg font-bold text-slate-800 truncate">{file.name}</h3>
                    <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors"><X className="w-5 h-5 text-slate-600" /></button>
                </div>
                <div className="p-6 flex-grow flex items-center justify-center">{renderContent()}</div>
            </div>
        </div>
    );
};

const FileUpload = ({ onFilesAdded, onDriveClick, disabled, children }) => {
    const [isDragging, setIsDragging] = useState(false);
    const handleDrop = useCallback((e) => { e.preventDefault(); if (disabled) return; setIsDragging(false); onFilesAdded(Array.from(e.dataTransfer.files)); }, [onFilesAdded, disabled]);
    const handleDragOver = useCallback((e) => { e.preventDefault(); if (disabled) return; setIsDragging(true); }, [disabled]);
    const handleDragLeave = useCallback(() => setIsDragging(false), []);
    const handleFileInput = useCallback((e) => { if (disabled) return; onFilesAdded(Array.from(e.target.files)); }, [onFilesAdded, disabled]);

    return (
        <div className={`border-2 border-dashed rounded-2xl p-8 text-center transition-all duration-300 ${isDragging && !disabled ? 'border-[#ffc801] bg-[#ffc801]/5 scale-105' : 'border-slate-300'} ${disabled ? 'opacity-50' : ''}`} onDrop={handleDrop} onDragOver={handleDragOver} onDragLeave={handleDragLeave}>
            <div className={disabled ? 'pointer-events-none' : ''}>{children}</div>
            <div className="mt-6 flex flex-col sm:flex-row justify-center items-center gap-4">
                <label htmlFor="file-input" className={`inline-flex items-center px-6 py-3 bg-gradient-to-r from-[#ffc801] to-[#ffb700] text-white font-semibold rounded-xl transition-all duration-200 ${disabled ? 'cursor-not-allowed grayscale' : 'cursor-pointer hover:shadow-lg transform hover:scale-105'}`}>
                    <Upload className="w-5 h-5 mr-2" />
                    Selecionar Arquivos
                </label>
                <button onClick={onDriveClick} disabled={disabled} className={`inline-flex items-center px-6 py-3 bg-white border border-slate-300 text-slate-700 font-semibold rounded-xl transition-all duration-200 ${disabled ? 'cursor-not-allowed grayscale' : 'hover:shadow-lg transform hover:scale-105 hover:bg-slate-50'}`}>
                    <Cloud className="w-5 h-5 mr-2 text-blue-500" />
                    Importar do Google Drive
                </button>
            </div>
            <input type="file" multiple onChange={handleFileInput} className="hidden" id="file-input" disabled={disabled} />
        </div>
    );
};

// --- COMPONENTE PRINCIPAL ---
const HomePage = ({ googleAccessToken }) => {
    // Persistência localStorage
    const [campaigns, setCampaigns] = useState(() => {
        const saved = localStorage.getItem('aprobi-campaigns');
        return saved ? JSON.parse(saved) : [];
    });
    const [creativeLines, setCreativeLines] = useState(() => {
        const saved = localStorage.getItem('aprobi-creativeLines');
        return saved ? JSON.parse(saved) : [];
    });

    const [selectedCampaignId, setSelectedCampaignId] = useState('');
    const [isCampaignModalOpen, setCampaignModalOpen] = useState(false);
    const [selectedCreativeLineId, setSelectedCreativeLineId] = useState(null);
    const [newCreativeLineName, setNewCreativeLineName] = useState("");
    const [selectedFile, setSelectedFile] = useState(null);
    const [isSelectionMode, setIsSelectionMode] = useState(false);
    const [selectedPieces, setSelectedPieces] = useState(new Set());

    useEffect(() => {
        localStorage.setItem('aprobi-campaigns', JSON.stringify(campaigns));
    }, [campaigns]);

    useEffect(() => {
        localStorage.setItem('aprobi-creativeLines', JSON.stringify(creativeLines));
    }, [creativeLines]);

    useEffect(() => {
        if (selectedCampaignId) {
            setSelectedCreativeLineId(null);
        }
    }, [selectedCampaignId]);

    const handleCreateCreativeLine = (e) => {
        e.preventDefault();
        if (!newCreativeLineName.trim() || !selectedCampaignId) return;
        const newLine = { id: Date.now(), campaignId: selectedCampaignId, name: newCreativeLineName, pieces: [] };
        setCreativeLines(prev => [...prev, newLine]);
        setNewCreativeLineName("");
    };

    const handleFilesAdded = useCallback((newFiles) => {
        if (!selectedCreativeLineId) {
            alert("Por favor, selecione ou crie uma 'Linha Criativa / Pasta' antes de adicionar peças.");
            return;
        }
        const processedFiles = newFiles.map(file => ({
            id: Date.now() + Math.random(), name: file.name, type: file.type, url: URL.createObjectURL(file),
        }));
        setCreativeLines(prevLines =>
            prevLines.map(line =>
                line.id === selectedCreativeLineId
                    ? { ...line, pieces: [...line.pieces, ...processedFiles] }
                    : line
            )
        );
    }, [selectedCreativeLineId]);

    const handleTogglePieceSelection = (pieceId) => {
        setSelectedPieces(prevSelected => {
            const newSelected = new Set(prevSelected);
            if (newSelected.has(pieceId)) {
                newSelected.delete(pieceId);
            } else {
                newSelected.add(pieceId);
            }
            return newSelected;
        });
    };

    const handleRemoveSelectedPieces = () => {
        setCreativeLines(prevLines =>
            prevLines.map(line => {
                if (line.id === selectedCreativeLineId) {
                    return {
                        ...line,
                        pieces: line.pieces.filter(piece => !selectedPieces.has(piece.id))
                    };
                }
                return line;
            })
        );
        setIsSelectionMode(false);
        setSelectedPieces(new Set());
    };

    const handleCancelSelection = () => {
        setIsSelectionMode(false);
        setSelectedPieces(new Set());
    };

    const handleCampaignCreated = (newCampaign) => {
        setCampaigns(prev => [newCampaign, ...prev]);
        setSelectedCampaignId(newCampaign.id);
    };

    // --- Google Drive Picker ---
    const handleGoogleDriveClick = () => {
        if (!googleAccessToken) {
            alert("Não foi possível obter a permissão para acessar o Google Drive. Tente recarregar a página.");
            return;
        }

        const DEVELOPER_KEY = 'AIzaSyC_5PqvhXD8sS-woM_HMFcfY08cSJPvs-w'; 
        const APP_ID = '901573618274';

        const showPicker = () => {
            const picker = new window.google.picker.PickerBuilder()
                .addView(window.google.picker.ViewId.DOCS)
                .setOAuthToken(googleAccessToken)
                .setDeveloperKey(DEVELOPER_KEY)
                .setAppId(APP_ID)
                .setCallback(pickerCallback)
                .build();
            picker.setVisible(true);
        };

        if (window.google && window.google.picker) {
            showPicker();
        } else {
            const script = document.createElement('script');
            script.src = 'https://apis.google.com/js/api.js';
            script.onload = () => {
                window.gapi.load('picker', showPicker);
            };
            document.head.appendChild(script);
        }
    };

    const pickerCallback = (data) => {
        if (data.action === window.google.picker.Action.PICKED) {
            const files = data.docs.map(doc => ({
                id: doc.id,
                name: doc.name,
                type: doc.mimeType,
                url: doc.embedUrl || doc.url,
            }));
            console.log("Arquivos selecionados do Google Drive:", files);
            alert(`${files.length} arquivo(s) selecionado(s) do Google Drive!`);
            // Aqui você pode adicionar lógica para importar os arquivos para a pasta selecionada
        }
    };

    const selectedCampaign = campaigns.find(c => c.id === selectedCampaignId);
    const currentCreativeLines = creativeLines.filter(line => line.campaignId === selectedCampaignId);
    const piecesOfSelectedLine = currentCreativeLines.find(line => line.id === selectedCreativeLineId)?.pieces || [];
    const totalPieces = currentCreativeLines.reduce((acc, line) => acc + line.pieces.length, 0);

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
            <header className="bg-white shadow-md border-b border-slate-200">
                <div className="max-w-7xl mx-auto px-6 py-8 flex items-center space-x-6">
                    <img src={aprobiLogo} alt="Aprobi Logo" className="w-32 h-auto" />
                    <div className="border-l border-slate-300 pl-6">
                        <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">Sistema de Aprovação</h1>
                        <p className="text-lg text-slate-600 font-medium">Validação de Peças Criativas</p>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-6 py-12">
                <div className="bg-white p-8 rounded-2xl shadow-lg mb-8 border border-slate-200">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-2xl font-bold text-slate-800">Gestão de Campanhas</h2>
                        <button onClick={() => setCampaignModalOpen(true)} className="flex items-center px-6 py-3 bg-emerald-500 text-white font-semibold rounded-xl hover:bg-emerald-600 transition-all">
                            <PlusCircle className="w-5 h-5 mr-2" />
                            Nova Campanha
                        </button>
                    </div>
                    <CampaignSelector campaigns={campaigns} selectedCampaignId={selectedCampaignId} onCampaignChange={setSelectedCampaignId} onCreateNew={() => setCampaignModalOpen(true)} />
                </div>

                {selectedCampaignId && (
                    <>
                        <CampaignPreviewCard campaign={selectedCampaign} pieceCount={totalPieces} />
                        
                        <div className="mt-8 bg-white p-8 rounded-2xl shadow-lg border border-slate-200">
                            <h3 className="text-xl font-bold text-slate-800 mb-4">Linha Criativa / Pasta</h3>
                            <form onSubmit={handleCreateCreativeLine} className="flex gap-4 mb-6">
                                <input type="text" value={newCreativeLineName} onChange={(e) => setNewCreativeLineName(e.target.value)} placeholder="Nome da nova pasta..." className="flex-grow p-3 border border-slate-300 rounded-xl focus:border-[#ffc801] focus:ring-2 focus:ring-[#ffc801]/20 outline-none" />
                                <button type="submit" className="flex-shrink-0 px-6 py-3 bg-emerald-500 text-white font-semibold rounded-xl hover:bg-emerald-600 transition-all">
                                    <FolderPlus className="w-5 h-5 mr-2 inline-block" />
                                    Criar Pasta
                                </button>
                            </form>
                            <div className="space-y-2">
                                {currentCreativeLines.map(line => (
                                    <div key={line.id} onClick={() => setSelectedCreativeLineId(line.id === selectedCreativeLineId ? null : line.id)} className={`p-4 rounded-lg cursor-pointer border-2 transition-all flex justify-between items-center ${selectedCreativeLineId === line.id ? 'bg-amber-50 border-amber-300' : 'bg-slate-50 border-transparent hover:bg-slate-100'}`}>
                                        <span className="font-semibold text-slate-700">{line.name}</span>
                                        <span className="text-sm text-slate-500 font-medium bg-slate-200 px-2 py-1 rounded-md">{line.pieces.length} peças</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="mt-8">
                            <FileUpload onFilesAdded={handleFilesAdded} onDriveClick={handleGoogleDriveClick} disabled={!selectedCreativeLineId}>
                                <div className="flex flex-col items-center">
                                    <div className={`mx-auto w-16 h-16 bg-gradient-to-br from-[#ffc801] to-[#ffb700] rounded-full flex items-center justify-center mb-4 shadow-lg ${!selectedCreativeLineId ? 'grayscale' : ''}`}>
                                        <Upload className="h-8 w-8 text-white" />
                                    </div>
                                    <h3 className="text-lg font-bold text-slate-800 mb-2">
                                        {!selectedCreativeLineId ? "Selecione uma pasta para adicionar peças" : `Adicionar peças em "${currentCreativeLines.find(l => l.id === selectedCreativeLineId)?.name}"`}
                                    </h3>
                                    <p className="text-slate-500 text-sm">Arraste e solte os arquivos ou use os botões abaixo</p>
                                </div>
                            </FileUpload>
                        </div>
                        
                        {piecesOfSelectedLine.length > 0 && (
                            <div className="mt-8">
                                <div className="flex justify-between items-center mb-4">
                                    <h3 className="text-2xl font-bold text-slate-800">Peças em "{currentCreativeLines.find(l => l.id === selectedCreativeLineId)?.name}"</h3>
                                    {!isSelectionMode ? (
                                        <button onClick={() => setIsSelectionMode(true)} className="flex items-center px-4 py-2 bg-white border border-slate-300 text-slate-600 font-semibold rounded-lg hover:bg-slate-50 transition-colors">
                                            <Trash2 className="w-4 h-4 mr-2" />
                                            Remover Peças
                                        </button>
                                    ) : (
                                        <div className="flex items-center gap-4">
                                            <button onClick={handleCancelSelection} className="flex items-center px-4 py-2 bg-white border border-slate-300 text-slate-600 font-semibold rounded-lg hover:bg-slate-50 transition-colors">
                                                <XCircle className="w-4 h-4 mr-2" />
                                                Cancelar
                                            </button>
                                            <button onClick={handleRemoveSelectedPieces} disabled={selectedPieces.size === 0} className="flex items-center px-4 py-2 bg-red-500 text-white font-semibold rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                                                <Trash2 className="w-4 h-4 mr-2" />
                                                Remover ({selectedPieces.size})
                                            </button>
                                        </div>
                                    )}
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {piecesOfSelectedLine.map(piece => (
                                        <FileViewer 
                                            key={piece.id} 
                                            file={piece} 
                                            onOpenPopup={setSelectedFile} 
                                            isSelectionMode={isSelectionMode}
                                            isSelected={selectedPieces.has(piece.id)}
                                            onSelect={handleTogglePieceSelection}
                                        />
                                    ))}
                                </div>
                            </div>
                        )}
                    </>
                )}
            </main>

            <NewCampaignModal isOpen={isCampaignModalOpen} onClose={() => setCampaignModalOpen(false)} onCampaignCreated={handleCampaignCreated} />
            <FilePopup file={selectedFile} onClose={() => setSelectedFile(null)} />
        </div>
    );
};

export default HomePage;