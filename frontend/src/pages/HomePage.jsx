// Em: frontend/src/pages/HomePage.jsx (VERSÃO CORRIGIDA COM LAYOUT MASTER-DETAIL)

import React, { useState, useCallback, useEffect, Fragment } from "react";
import { Listbox, Transition } from "@headlessui/react";
import { Upload, Check, Image as ImageIcon, Video as VideoIcon, File as FileIcon, X, ChevronDown, PlusCircle, FolderPlus, Trash2, XCircle, Pencil, FileText, HelpCircle, ChevronsRight } from "lucide-react";
import toast from "react-hot-toast";

import aprobiLogo from "../assets/aprobi-logo.jpg";
import DriveImportButton from "../components/DriveImportButton";
import CampaignSidebar from "../components/CampaignSidebar"; // Novo Componente
import HelpModal from "../components/HelpModal"; // Novo Componente

// =================== COMPONENTES INTERNOS ===================
// Manter os componentes de Modal e Viewer aqui para evitar erros de escopo
// =============================================================

const FileTypeIcon = ({ fileType }) => {
    if ((fileType || "").startsWith("image/")) return <ImageIcon className="w-5 h-5 text-blue-500" />;
    if ((fileType || "").startsWith("video/")) return <VideoIcon className="w-5 h-5 text-purple-500" />;
    return <FileIcon className="w-5 h-5 text-slate-500" />;
};

const FileViewer = ({ file, onOpenPopup, isSelectionMode, isSelected, onSelect }) => {
    const mime = file.mimetype || "";
    const name = file.originalName || file.filename || "arquivo";
    
    let url = null;
    if (file.filename) {
      url = `${import.meta.env.VITE_BACKEND_URL}/campaigns/files/${file.filename}`;
    } else if (file.driveId) {
      url = `${import.meta.env.VITE_BACKEND_URL}/pieces/drive/${file.id}`;
    }
    
    const handleCardClick = () => {
        if (isSelectionMode) onSelect(file.id);
        else onOpenPopup({ ...file, _resolved: { mime, name, url } });
    };
    
    const renderPreview = () => {
        if (mime.startsWith("image/") && url) return <img src={url} alt={name} className="w-full h-40 object-cover rounded-lg" />;
        if (mime.startsWith("video/")) return <div className="w-full h-40 bg-purple-100 rounded-lg flex items-center justify-center"><VideoIcon className="w-12 h-12 text-purple-400" /></div>;
        return <div className="w-full h-40 bg-slate-100 rounded-lg flex items-center justify-center"><FileIcon className="w-12 h-12 text-slate-400" /></div>;
    };

    return (
        <div className="relative group" onClick={handleCardClick}>
             {isSelectionMode && (
                <div className={`absolute top-3 right-3 z-10 w-6 h-6 bg-white rounded-full border-2 flex items-center justify-center pointer-events-none ${isSelected ? 'border-blue-600' : 'border-slate-300'}`}>
                    {isSelected && <Check className="w-4 h-4 text-blue-600" />}
                </div>
            )}
            <div className={`bg-white rounded-xl shadow-sm border p-3 transition-all duration-200 cursor-pointer ${isSelectionMode ? (isSelected ? 'border-blue-500 shadow-md' : 'border-slate-200 hover:border-blue-400') : 'border-slate-200 hover:shadow-md hover:border-blue-400 hover:-translate-y-1'}`}>
                {renderPreview()}
                <div className="mt-3 flex items-center">
                    <div className="flex-shrink-0"><FileTypeIcon fileType={mime} /></div>
                    <span className="ml-2 text-sm font-medium text-slate-700 truncate">{name}</span>
                </div>
            </div>
        </div>
    );
};

const FilePopup = ({ file, onClose }) => {
    if (!file) return null;
    const { mime, name, url } = file._resolved;
    const renderContent = () => {
        if (mime.startsWith("image/") && url) return <img src={url} alt={name} className="max-w-full max-h-[70vh] object-contain rounded-xl shadow-lg" />;
        if (mime.startsWith("video/") && url) return <video src={url} controls autoPlay className="max-w-full max-h-[70vh] object-contain rounded-xl shadow-lg" />;
        return <div className="w-96 h-96 bg-slate-100 rounded-xl flex flex-col items-center justify-center text-center p-4"><FileIcon className="w-24 h-24 text-slate-400 mb-4" /><span className="text-slate-700 font-semibold">{name}</span><p className="text-slate-500 text-sm mt-2">Pré-visualização não disponível.</p></div>;
    };
    return <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}><div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto flex flex-col" onClick={(e) => e.stopPropagation()}><div className="flex items-center justify-between p-4 border-b border-slate-200"><h3 className="text-lg font-bold text-slate-800 truncate">{name}</h3><button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors"><X className="w-5 h-5 text-slate-600" /></button></div><div className="p-6 flex-grow flex items-center justify-center">{renderContent()}</div></div></div>;
};

const FileUpload = ({ onFilesAdded, driveButton, lineId }) => {
    const [isDragging, setIsDragging] = useState(false);
    const handleDrop = useCallback((e) => { e.preventDefault(); setIsDragging(false); onFilesAdded(Array.from(e.dataTransfer.files), lineId); }, [onFilesAdded, lineId]);
    const handleDragOver = useCallback((e) => { e.preventDefault(); setIsDragging(true); }, []);
    const handleDragLeave = useCallback(() => setIsDragging(false), []);
    const handleFileInput = useCallback((e) => { onFilesAdded(Array.from(e.target.files), lineId); e.target.value = null; }, [onFilesAdded, lineId]);
    return <div className={`relative border-2 border-dashed rounded-xl p-6 text-center transition-all duration-300 ${isDragging ? "border-blue-500 bg-blue-50" : "border-slate-300 bg-slate-50 hover:border-slate-400"}`} onDrop={handleDrop} onDragOver={handleDragOver} onDragLeave={handleDragLeave}>
        <div className="flex flex-col items-center">
             <Upload className="h-8 w-8 text-slate-400 mb-2" />
            <p className="text-sm text-slate-600 font-medium">Arraste e solte ou <label htmlFor={`file-input-${lineId}`} className="font-semibold text-blue-600 hover:text-blue-800 cursor-pointer">selecione os arquivos</label></p>
        </div>
        <input type="file" multiple onChange={handleFileInput} className="hidden" id={`file-input-${lineId}`} />
        <div className="mt-4">{driveButton}</div>
    </div>;
};

const NewCampaignModal = ({ isOpen, onClose, onCampaignCreated }) => {
    const [name, setName] = useState("");
    const [selectedClient, setSelectedClient] = useState(null);
    const [error, setError] = useState("");
    const [isCreating, setIsCreating] = useState(false);
    const clients = [
        { name: "AMERICANAS" }, { name: "ARAMIS" }, { name: "CANTU" }, { name: "COGNA" }, { name: "ESPORTE DA SORTE" },
        { name: "HASDEX" }, { name: "HORTIFRUTI NATURAL DA TERRA" }, { name: "IDEAZARVOS" }, { name: "KEETA" },
        { name: "MASTERCARD" }, { name: "O BOTICARIO" }, { name: "RD" }, { name: "SAMSUNG" },
        { name: "SAMSUNG E STORE" }, { name: "SICREDI" }, { name: "VIVO" },
    ].sort((a, b) => a.name.localeCompare(b.name));

    if (!isOpen) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!name || !selectedClient) { setError("Nome e cliente são obrigatórios."); return; }
        setError("");
        setIsCreating(true);
        try {
            const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/campaigns`, { method: "POST", headers: { "Content-Type": "application/json" }, credentials: "include", body: JSON.stringify({ name, client: selectedClient.name }) });
            if (!res.ok) { const errData = await res.json().catch(() => ({})); throw new Error(errData.error || "Falha ao criar campanha."); }
            const newCampaign = await res.json();
            onCampaignCreated(newCampaign);
            handleClose();
        } catch (err) { setError(err.message); } 
        finally { setIsCreating(false); }
    };
    const handleClose = () => { setName(""); setSelectedClient(null); setError(""); onClose(); };
    
    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
                <div className="p-6 border-b border-slate-200 flex justify-between items-center"><h3 className="text-xl font-bold text-slate-800">Criar Nova Campanha</h3><button onClick={handleClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors"><X className="w-5 h-5 text-slate-600" /></button></div>
                <form onSubmit={handleSubmit}>
                    <div className="p-6 space-y-6">
                        {error && <p className="text-red-500 text-sm">{error}</p>}
                        <div><label htmlFor="campaignName" className="block text-sm font-semibold text-slate-700 mb-2">Nome da Campanha *</label><input type="text" id="campaignName" value={name} onChange={(e) => setName(e.target.value)} className="w-full p-3 border border-slate-300 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none" required /></div>
                        <div>
                           <label className="block text-sm font-semibold text-slate-700 mb-2">Cliente *</label>
                           <select value={selectedClient?.name || ''} onChange={e => setSelectedClient({name: e.target.value})} className="w-full p-3 border border-slate-300 rounded-xl bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none appearance-none bg-no-repeat bg-right pr-8" style={{backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`, backgroundPosition: 'right 0.5rem center', backgroundSize: '1.5em 1.5em' }}>
                                <option value="" disabled>Selecione um cliente</option>
                                {clients.map(c => <option key={c.name} value={c.name}>{c.name}</option>)}
                           </select>
                        </div>
                    </div>
                    <div className="flex items-center justify-end space-x-4 p-6 bg-slate-50 rounded-b-2xl"><button type="button" onClick={handleClose} className="px-4 py-2 text-slate-600 font-semibold hover:text-slate-800">Cancelar</button><button type="submit" disabled={isCreating} className="px-6 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50">{isCreating ? "Criando..." : "Criar Campanha"}</button></div>
                </form>
            </div>
        </div>
    );
};


// =================== COMPONENTE PRINCIPAL DA PÁGINA ===================
const HomePage = ({ googleAccessToken }) => {
    const [campaigns, setCampaigns] = useState([]);
    const [selectedCampaignId, setSelectedCampaignId] = useState("");
    const [creativeLines, setCreativeLines] = useState([]);
    const [isLoadingCampaigns, setIsLoadingCampaigns] = useState(true);
    const [isLoadingCreativeLines, setIsLoadingCreativeLines] = useState(false);
    
    const [isCampaignModalOpen, setCampaignModalOpen] = useState(false);
    const [newCreativeLineName, setNewCreativeLineName] = useState("");
    const [selectedFile, setSelectedFile] = useState(null);
    const [isHelpModalOpen, setHelpModalOpen] = useState(false);
    
    const fetchCampaigns = useCallback(async () => {
        setIsLoadingCampaigns(true);
        try {
            const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/campaigns`, { credentials: "include" });
            if (!res.ok) throw new Error("Falha ao buscar campanhas.");
            const data = await res.json();
            setCampaigns(data);
        } catch (error) { toast.error(error.message); } 
        finally { setIsLoadingCampaigns(false); }
    }, []);

    const fetchCreativeLines = useCallback(async (campaignId) => {
        if (!campaignId) { setCreativeLines([]); return; }
        setIsLoadingCreativeLines(true);
        try {
            const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/campaigns/${campaignId}/creative-lines`, { credentials: "include" });
            if (!res.ok) throw new Error("Falha ao buscar pastas.");
            const data = await res.json();
            setCreativeLines(data || []);
        } catch (error) { toast.error(error.message); } 
        finally { setIsLoadingCreativeLines(false); }
    }, []);

    useEffect(() => { fetchCampaigns(); }, [fetchCampaigns]);
    useEffect(() => { fetchCreativeLines(selectedCampaignId); }, [selectedCampaignId, fetchCreativeLines]);

    const handleCampaignCreated = (newCampaign) => {
        setCampaigns((prev) => [newCampaign, ...prev]);
        setSelectedCampaignId(newCampaign.id);
        toast.success(`Campanha "${newCampaign.name}" criada!`);
    };
    
    const handleCreateCreativeLine = async (e) => {
        e.preventDefault();
        if (!newCreativeLineName.trim() || !selectedCampaignId) return;
        const loadingToast = toast.loading("Criando pasta...");
        try {
            const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/campaigns/${selectedCampaignId}/creative-lines`, { method: "POST", headers: { "Content-Type": "application/json" }, credentials: "include", body: JSON.stringify({ name: newCreativeLineName }) });
            if (!res.ok) throw new Error("Falha ao criar a pasta.");
            const newLine = await res.json();
            setCreativeLines((prev) => [...prev, { ...newLine, pieces: [] }]);
            setNewCreativeLineName("");
            toast.success("Pasta criada!", { id: loadingToast });
        } catch (error) {
            toast.error(error.message, { id: loadingToast });
        }
    };
    
    const handleFilesAdded = useCallback(async (newFiles, lineId) => {
        if (!lineId) return toast.error("Erro: ID da pasta não encontrado.");
        if (!newFiles || newFiles.length === 0) return;
        
        const loadingToast = toast.loading(`Enviando ${newFiles.length} arquivo(s)...`);
        try {
            const formData = new FormData();
            newFiles.forEach((file) => formData.append("files", file));
            const url = `${import.meta.env.VITE_BACKEND_URL}/campaigns/${selectedCampaignId}/upload?creativeLineId=${lineId}`;
            const res = await fetch(url, { method: "POST", credentials: "include", body: formData });
            if (!res.ok) throw new Error("Falha no upload.");
            const { pieces } = await res.json();
            
            setCreativeLines(prevLines => prevLines.map(line => 
                line.id === lineId 
                    ? { ...line, pieces: [...(line.pieces || []), ...pieces] }
                    : line
            ));
            
            toast.success(`${newFiles.length} arquivo(s) enviados!`, { id: loadingToast });
        } catch (error) {
            toast.error(error.message, { id: loadingToast });
        }
    }, [selectedCampaignId]);

    const handleDriveImport = (savedPieces, lineId) => {
        if (savedPieces && savedPieces.length > 0 && lineId) {
            setCreativeLines(prevLines => prevLines.map(line => 
                line.id === lineId 
                    ? { ...line, pieces: [...(line.pieces || []), ...savedPieces] }
                    : line
            ));
            toast.success(`${savedPieces.length} peça(s) importada(s) do Drive!`);
        }
    };
    
    const selectedCampaign = campaigns.find((c) => c.id === selectedCampaignId);

    return (
        <div className="h-screen w-screen bg-slate-100 flex flex-col antialiased">
            <header className="bg-white shadow-sm border-b border-slate-200 flex-shrink-0 z-10">
                <div className="max-w-full mx-auto px-6 h-24 flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                        <img src={aprobiLogo} alt="Aprobi Logo" className="w-24 h-auto" />
                    </div>
                    <button onClick={() => setHelpModalOpen(true)} className="p-2 rounded-full text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition-colors">
                        <HelpCircle className="w-6 h-6" />
                    </button>
                </div>
            </header>
            
            <div className="flex-grow flex overflow-hidden">
                <CampaignSidebar 
                    campaigns={campaigns}
                    selectedCampaignId={selectedCampaignId}
                    onCampaignChange={setSelectedCampaignId}
                    onOpenNewCampaignModal={() => setCampaignModalOpen(true)}
                    isLoading={isLoadingCampaigns}
                />

                <main className="flex-1 overflow-y-auto p-8">
                    {!selectedCampaign ? (
                         <div className="flex flex-col items-center justify-center h-full text-center text-slate-500">
                             <ChevronsRight className="w-16 h-16 text-slate-300 mb-4" />
                             <h2 className="text-2xl font-bold">Bem-vindo ao Aprobi!</h2>
                             <p className="mt-2 max-w-md">Selecione uma campanha na barra lateral para começar a trabalhar, ou crie uma nova para iniciar seu projeto.</p>
                         </div>
                    ) : (
                        <div>
                            <div className="flex items-start justify-between mb-8">
                                <div>
                                    <p className="text-sm text-slate-500">{selectedCampaign.client}</p>
                                    <h1 className="text-3xl font-bold text-slate-800">{selectedCampaign.name}</h1>
                                </div>
                                <a href={`${import.meta.env.VITE_BACKEND_URL}/campaigns/${selectedCampaignId}/export-ppt`} target="_blank" rel="noopener noreferrer" className="flex items-center px-4 py-2 bg-orange-500 text-white font-semibold rounded-lg hover:bg-orange-600 transition-colors shadow-sm hover:shadow-md">
                                    <FileText className="w-4 h-4 mr-2" />
                                    Exportar PPT
                                </a>
                            </div>

                            <div className="mb-10">
                                <form onSubmit={handleCreateCreativeLine} className="flex gap-4 max-w-xl">
                                    <input type="text" value={newCreativeLineName} onChange={(e) => setNewCreativeLineName(e.target.value)} placeholder="Nome da nova Linha Criativa / Pasta..." className="flex-grow p-3 border border-slate-300 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition" />
                                    <button type="submit" className="flex-shrink-0 px-5 py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-all shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed" disabled={!newCreativeLineName.trim()}>
                                        <FolderPlus className="w-5 h-5" />
                                    </button>
                                </form>
                            </div>
                            
                            {isLoadingCreativeLines ? ( <p className="text-slate-500">Carregando...</p> ) : (
                                <div className="space-y-12">
                                    {creativeLines.map(line => (
                                        <section key={line.id}>
                                            <h2 className="text-xl font-bold text-slate-700 pb-2 border-b-2 border-slate-200 mb-6">{line.name}</h2>
                                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-6">
                                                {(line.pieces || []).map(piece => (
                                                    <FileViewer key={piece.id} file={piece} onOpenPopup={setSelectedFile} />
                                                ))}
                                                <FileUpload 
                                                    onFilesAdded={handleFilesAdded}
                                                    lineId={line.id}
                                                    driveButton={
                                                        <DriveImportButton 
                                                            campaignId={selectedCampaignId} 
                                                            creativeLineId={line.id} 
                                                            googleAccessToken={googleAccessToken}
                                                            onImported={(pieces) => handleDriveImport(pieces, line.id)}
                                                            label="Importar do Drive" 
                                                        />
                                                    }
                                                />
                                            </div>
                                        </section>
                                    ))}
                                    {creativeLines.length === 0 && (
                                         <p className="text-slate-500 text-center py-8">Nenhuma linha criativa foi criada para esta campanha ainda.</p>
                                    )}
                                </div>
                            )}
                        </div>
                    )}
                </main>
            </div>
            
            <FilePopup file={selectedFile} onClose={() => setSelectedFile(null)} />
            <HelpModal isOpen={isHelpModalOpen} onClose={() => setHelpModalOpen(false)} />
            <NewCampaignModal isOpen={isCampaignModalOpen} onClose={() => setCampaignModalOpen(false)} onCampaignCreated={handleCampaignCreated} />
        </div>
    );
};

export default HomePage;
