// Em: frontend/src/pages/HomePage.jsx (VERSÃO FINAL, COMPLETA E CORRIGIDA)

import React, { useState, useCallback, useEffect, Fragment } from "react";
import { Listbox, Transition } from "@headlessui/react";
import { Upload, Check, Image as ImageIcon, Video as VideoIcon, File as FileIcon, X, ChevronDown, PlusCircle, FolderPlus, Trash2, XCircle, Pencil, FileText } from "lucide-react";
import toast from "react-hot-toast";

import aprobiLogo from "../assets/aprobi-logo.jpg";
import CampaignSelector from "../components/CampaignSelector";
import CampaignPreviewCard from "../components/CampaignPreviewCard";
import DriveImportButton from "../components/DriveImportButton";

// =================== DADOS AUXILIARES ===================
const clients = [
    { name: "AMERICANAS" }, { name: "ARAMIS" }, { name: "CANTU" }, { name: "COGNA" }, { name: "ESPORTE DA SORTE" },
    { name: "HASDEX" }, { name: "HORTIFRUTI NATURAL DA TERRA" }, { name: "IDEAZARVOS" }, { name: "KEETA" },
    { name: "MASTERCARD" }, { name: "O BOTICARIO" }, { name: "RD" }, { name: "SAMSUNG" },
    { name: "SAMSUNG E STORE" }, { name: "SICREDI" }, { name: "VIVO" },
].sort((a, b) => a.name.localeCompare(b.name));

// =================== COMPONENTES INTERNOS ===================
const FileTypeIcon = ({ fileType }) => {
    if ((fileType || "").startsWith("image/")) return <ImageIcon className="w-5 h-5 text-blue-500" />;
    if ((fileType || "").startsWith("video/")) return <VideoIcon className="w-5 h-5 text-purple-500" />;
    return <FileIcon className="w-5 h-5 text-slate-500" />;
};

const FileViewer = ({ file, onOpenPopup, isSelectionMode, isSelected, onSelect }) => {
    const mime = file.type || file.mimetype || "";
    const name = file.name || file.originalName || file.filename || "arquivo";
    const url = file.url || (file.filename ? `${import.meta.env.VITE_BACKEND_URL}/campaigns/files/${file.filename}` : null);
    const handleCardClick = () => {
        if (isSelectionMode) onSelect(file.id);
        else onOpenPopup({ ...file, _resolved: { mime, name, url } });
    };
    const renderPreview = () => {
        if (mime.startsWith("image/") && url) return <img src={url} alt={name} className="w-full h-48 object-cover rounded-xl" />;
        if (mime.startsWith("video/")) return <div className="w-full h-48 bg-purple-100 rounded-xl flex items-center justify-center"><VideoIcon className="w-16 h-16 text-purple-400" /></div>;
        return <div className="w-full h-48 bg-slate-100 rounded-xl flex items-center justify-center"><FileIcon className="w-16 h-16 text-slate-400" /></div>;
    };
    return (
        <div className="relative" onClick={handleCardClick}>
            {isSelectionMode && <div className="absolute top-2 right-2 z-10 w-6 h-6 bg-white rounded-full border-2 flex items-center justify-center pointer-events-none">{isSelected && <Check className="w-4 h-4 text-emerald-500" />}</div>}
            <div className={`bg-white rounded-2xl shadow-lg border-2 p-4 transition-all duration-300 ${isSelectionMode ? "cursor-pointer" : "cursor-pointer hover:shadow-xl hover:-translate-y-1"} ${isSelected ? "border-emerald-500" : "border-slate-100"}`}>
                {renderPreview()}
                <div className="mt-4 flex items-center"><FileTypeIcon fileType={mime} /><span className="ml-3 text-sm font-semibold text-slate-700 truncate">{name}</span></div>
            </div>
        </div>
    );
};

const NewCampaignModal = ({ isOpen, onClose, onCampaignCreated }) => {
    const [name, setName] = useState("");
    const [selectedClient, setSelectedClient] = useState(null);
    const [error, setError] = useState("");
    const [isCreating, setIsCreating] = useState(false);
    if (!isOpen) return null;
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!name || !selectedClient) { setError("O nome da campanha e o cliente são obrigatórios."); return; }
        setError("");
        setIsCreating(true);
        try {
            const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/campaigns`, { method: "POST", headers: { "Content-Type": "application/json" }, credentials: "include", body: JSON.stringify({ name, client: selectedClient.name }) });
            if (!res.ok) { const errData = await res.json().catch(() => ({})); throw new Error(errData.error || "Falha ao criar campanha."); }
            const newCampaign = await res.json();
            onCampaignCreated(newCampaign);
            handleClose();
        } catch (err) { setError(err.message); } finally { setIsCreating(false); }
    };
    const handleClose = () => { setName(""); setSelectedClient(null); setError(""); onClose(); };
    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
                <div className="p-6 border-b border-slate-200 flex justify-between items-center"><h3 className="text-xl font-bold text-slate-800">Criar Nova Campanha</h3><button onClick={handleClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors"><X className="w-5 h-5 text-slate-600" /></button></div>
                <form onSubmit={handleSubmit}>
                    <div className="p-6 space-y-6">{error && <p className="text-red-500 text-sm">{error}</p>}<div><label htmlFor="campaignName" className="block text-sm font-semibold text-slate-700 mb-2">Nome da Campanha *</label><input type="text" id="campaignName" value={name} onChange={(e) => setName(e.target.value)} className="w-full p-3 border border-slate-300 rounded-xl focus:border-[#ffc801] focus:ring-2 focus:ring-[#ffc801]/20 outline-none" required /></div><div><Listbox value={selectedClient} onChange={setSelectedClient}><Listbox.Label className="block text-sm font-semibold text-slate-700 mb-2">Cliente *</Listbox.Label><div className="relative"><Listbox.Button className="relative w-full cursor-default rounded-xl bg-white py-3 pl-4 pr-10 text-left border border-slate-300 focus:border-[#ffc801] focus:ring-2 focus:ring-[#ffc801]/20 outline-none"><span className="block truncate">{selectedClient ? selectedClient.name : "Selecione um cliente"}</span><span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2"><ChevronDown className="h-5 w-5 text-gray-400" aria-hidden="true" /></span></Listbox.Button><Transition as={Fragment} leave="transition ease-in duration-100" leaveFrom="opacity-100" leaveTo="opacity-0"><Listbox.Options className="absolute mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black/5 focus:outline-none sm:text-sm z-10">{clients.map((c) => (<Listbox.Option key={c.name} className={({ active }) => `relative cursor-default select-none py-2 pl-10 pr-4 ${active ? "bg-amber-100 text-amber-900" : "text-gray-900"}`} value={c}>{({ selected }) => (<><span className={`block truncate ${selected ? "font-medium" : "font-normal"}`}>{c.name}</span>{selected ? (<span className="absolute inset-y-0 left-0 flex items-center pl-3 text-amber-600"><Check className="h-5 w-5" aria-hidden="true" /></span>) : null}</>)}</Listbox.Option>))}</Listbox.Options></Transition></div></Listbox></div></div>
                    <div className="flex items-center justify-end space-x-4 p-6 bg-slate-50 rounded-b-2xl"><button type="button" onClick={handleClose} className="px-4 py-2 text-slate-600 font-semibold hover:text-slate-800">Cancelar</button><button type="submit" disabled={isCreating} className="px-6 py-2 bg-gradient-to-r from-[#ffc801] to-[#ffb700] text-white font-semibold rounded-lg hover:shadow-lg disabled:opacity-50 disabled:grayscale">{isCreating ? "Criando..." : "Criar Campanha"}</button></div>
                </form>
            </div>
        </div>
    );
};

const FilePopup = ({ file, onClose }) => {
    if (!file) return null;
    const mime = file._resolved?.mime || file.type || file.mimetype || "";
    const name = file._resolved?.name || file.name || file.originalName || file.filename;
    const url = file._resolved?.url || file.url || (file.filename ? `${import.meta.env.VITE_BACKEND_URL}/campaigns/files/${file.filename}` : null);
    const renderContent = () => {
        if (mime.startsWith("image/") && url) return <img src={url} alt={name} className="max-w-full max-h-[70vh] object-contain rounded-xl shadow-lg" />;
        if (mime.startsWith("video/") && url) return <video src={url} controls autoPlay className="max-w-full max-h-[70vh] object-contain rounded-xl shadow-lg" />;
        return <div className="w-96 h-96 bg-slate-100 rounded-xl flex flex-col items-center justify-center text-center p-4"><FileIcon className="w-24 h-24 text-slate-400 mb-4" /><span className="text-slate-700 font-semibold">{name}</span><p className="text-slate-500 text-sm mt-2">Pré-visualização não disponível.</p></div>;
    };
    return <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}><div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto flex flex-col" onClick={(e) => e.stopPropagation()}><div className="flex items-center justify-between p-4 border-b border-slate-200"><h3 className="text-lg font-bold text-slate-800 truncate">{name}</h3><button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors"><X className="w-5 h-5 text-slate-600" /></button></div><div className="p-6 flex-grow flex items-center justify-center">{renderContent()}</div></div></div>;
};

const FileUpload = ({ onFilesAdded, disabled, children, driveButton }) => {
    const [isDragging, setIsDragging] = useState(false);
    const handleDrop = useCallback((e) => { e.preventDefault(); if (disabled) return; setIsDragging(false); onFilesAdded(Array.from(e.dataTransfer.files)); }, [onFilesAdded, disabled]);
    const handleDragOver = useCallback((e) => { e.preventDefault(); if (disabled) return; setIsDragging(true); }, [disabled]);
    const handleDragLeave = useCallback(() => setIsDragging(false), []);
    const handleFileInput = useCallback((e) => { if (disabled) return; onFilesAdded(Array.from(e.target.files)); }, [onFilesAdded, disabled]);
    return <div className={`border-2 border-dashed rounded-2xl p-8 text-center transition-all duration-300 ${isDragging && !disabled ? "border-[#ffc801] bg-[#ffc801]/5 scale-105" : "border-slate-300"} ${disabled ? "opacity-50" : ""}`} onDrop={handleDrop} onDragOver={handleDragOver} onDragLeave={handleDragLeave}><div className={disabled ? 'pointer-events-none' : ''}>{children}</div><div className="mt-6 flex flex-col sm:flex-row justify-center items-center gap-4"><label htmlFor="file-input" className={`inline-flex items-center px-6 py-3 bg-gradient-to-r from-[#ffc801] to-[#ffb700] text-white font-semibold rounded-xl transition-all duration-200 ${disabled ? 'cursor-not-allowed grayscale' : 'cursor-pointer hover:shadow-lg transform hover:scale-105'}`}><Upload className="w-5 h-5 mr-2" />Selecionar Arquivos</label>{driveButton}</div><input type="file" multiple onChange={handleFileInput} className="hidden" id="file-input" disabled={disabled} /></div>;
};

// =================== COMPONENTE PRINCIPAL ===================
const HomePage = ({ googleAccessToken }) => {
    const [campaigns, setCampaigns] = useState([]);
    const [creativeLines, setCreativeLines] = useState([]);
    const [selectedCampaignId, setSelectedCampaignId] = useState("");
    const [selectedCreativeLineId, setSelectedCreativeLineId] = useState(null);
    const [isLoadingCampaigns, setIsLoadingCampaigns] = useState(true);
    const [isLoadingCreativeLines, setIsLoadingCreativeLines] = useState(false);
    const [isCampaignModalOpen, setCampaignModalOpen] = useState(false);
    const [newCreativeLineName, setNewCreativeLineName] = useState("");
    const [selectedFile, setSelectedFile] = useState(null);
    const [isSelectionMode, setIsSelectionMode] = useState(false);
    const [selectedPieces, setSelectedPieces] = useState(new Set());

    const fetchCampaigns = useCallback(async () => {
        try {
            setIsLoadingCampaigns(true);
            const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/campaigns`, { credentials: "include" });
            if (!res.ok) throw new Error("Falha ao buscar campanhas.");
            const data = await res.json();
            setCampaigns(data);
        } catch (error) {
            toast.error(error.message);
        } finally {
            setIsLoadingCampaigns(false);
        }
    }, []);

    const fetchCreativeLines = useCallback(async (campaignId) => {
        if (!campaignId) {
            setCreativeLines([]);
            return;
        }
        try {
            setIsLoadingCreativeLines(true);
            const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/campaigns/${campaignId}/creative-lines`, { credentials: "include" });
            if (!res.ok) throw new Error("Falha ao buscar pastas.");
            const data = await res.json();
            setCreativeLines(data || []);
        } catch (error) {
            toast.error(error.message);
        } finally {
            setIsLoadingCreativeLines(false);
        }
    }, []);

    useEffect(() => {
        fetchCampaigns();
    }, [fetchCampaigns]);

    useEffect(() => {
        fetchCreativeLines(selectedCampaignId);
        setSelectedCreativeLineId(null);
    }, [selectedCampaignId, fetchCreativeLines]);

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
            setSelectedCreativeLineId(newLine.id);
            setNewCreativeLineName("");
            toast.success("Pasta criada!", { id: loadingToast });
        } catch (error) {
            toast.error(error.message, { id: loadingToast });
        }
    };

    const handleEditCreativeLine = async (lineId, currentName) => {
        const newName = prompt("Digite o novo nome para a pasta:", currentName);
        if (newName && newName.trim() && newName.trim() !== currentName) {
            const loadingToast = toast.loading("Renomeando...");
            try {
                const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/creative-lines/${lineId}`, { method: "PUT", headers: { "Content-Type": "application/json" }, credentials: "include", body: JSON.stringify({ name: newName.trim() }) });
                if (!res.ok) throw new Error("Falha ao renomear a pasta.");
                const updatedLine = await res.json();
                setCreativeLines((prev) => prev.map((l) => (l.id === lineId ? { ...l, name: updatedLine.name } : l)));
                toast.success("Pasta renomeada!", { id: loadingToast });
            } catch (error) {
                toast.error(error.message, { id: loadingToast });
            }
        }
    };

    const handleDeleteCreativeLine = async (lineId, lineName) => {
        if (window.confirm(`Tem certeza que deseja apagar a pasta "${lineName}"? Todas as peças serão perdidas.`)) {
            const loadingToast = toast.loading("Apagando pasta...");
            try {
                const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/creative-lines/${lineId}`, { method: "DELETE", credentials: "include" });
                if (!res.ok) throw new Error("Falha ao apagar a pasta.");
                setCreativeLines((prev) => prev.filter((l) => l.id !== lineId));
                toast.success("Pasta apagada!", { id: loadingToast });
            } catch (error) {
                toast.error(error.message, { id: loadingToast });
            }
        }
    };
    
    const handleFilesAdded = useCallback(async (newFiles) => {
        if (!selectedCreativeLineId) return toast.error("Por favor, selecione uma pasta antes de fazer o upload.");
        if (!newFiles || newFiles.length === 0) return;
        const loadingToast = toast.loading(`Enviando ${newFiles.length} arquivo(s)...`);
        try {
            const formData = new FormData();
            newFiles.forEach((file) => formData.append("files", file));
            const url = `${import.meta.env.VITE_BACKEND_URL}/campaigns/${selectedCampaignId}/upload?creativeLineId=${selectedCreativeLineId}`;
            const res = await fetch(url, { method: "POST", credentials: "include", body: formData });
            if (!res.ok) throw new Error("Falha ao fazer upload dos arquivos.");
            await res.json();
            fetchCreativeLines(selectedCampaignId);
            toast.success(`${newFiles.length} arquivo(s) enviados com sucesso!`, { id: loadingToast });
        } catch (error) {
            toast.error(error.message, { id: loadingToast });
        }
    }, [selectedCampaignId, selectedCreativeLineId, fetchCreativeLines]);

    const handleDriveImport = (savedPieces) => {
        fetchCreativeLines(selectedCampaignId);
        if (savedPieces && savedPieces.length > 0) {
            toast.success(`${savedPieces.length} peça(s) importada(s) do Drive!`);
        }
    };

    const handleTogglePieceSelection = (pieceId) => {
        setSelectedPieces((prev) => {
            const next = new Set(prev);
            next.has(pieceId) ? next.delete(pieceId) : next.add(pieceId);
            return next;
        });
    };

    const handleSelectAllPieces = () => {
        const allPieceIds = piecesOfSelectedLine.map((p) => p.id);
        setSelectedPieces(new Set(allPieceIds));
    };

    const handleCancelSelection = () => {
        setIsSelectionMode(false);
        setSelectedPieces(new Set());
    };

    const handleRemoveSelectedPieces = async () => {
        if (selectedPieces.size === 0) return;
        if (window.confirm(`Tem certeza que deseja apagar ${selectedPieces.size} peça(s) selecionada(s)?`)) {
            const loadingToast = toast.loading("Apagando peças...");
            try {
                const pieceIds = Array.from(selectedPieces);
                const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/pieces`, { method: "DELETE", headers: { "Content-Type": "application/json" }, credentials: "include", body: JSON.stringify({ pieceIds }) });
                if (!res.ok) {
                    const errData = await res.json().catch(() => ({}));
                    throw new Error(errData.error || "Falha ao apagar as peças.");
                }
                setCreativeLines((prev) => prev.map((line) => ({ ...line, pieces: line.pieces.filter((p) => !selectedPieces.has(p.id)) })));
                toast.success("Peças apagadas com sucesso!", { id: loadingToast });
            } catch (error) {
                toast.error(error.message, { id: loadingToast });
            } finally {
                setIsSelectionMode(false);
                setSelectedPieces(new Set());
            }
        }
    };

    const selectedCampaign = campaigns.find((c) => c.id === selectedCampaignId);
    const piecesOfSelectedLine = creativeLines.find((l) => l.id === selectedCreativeLineId)?.pieces || [];
    const totalPieces = creativeLines.reduce((acc, l) => acc + (l.pieces?.length || 0), 0);

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
            <header className="bg-white shadow-md border-b border-slate-200">
                <div className="max-w-7xl mx-auto px-6 py-8 flex items-center space-x-6"><img src={aprobiLogo} alt="Aprobi Logo" className="w-32 h-auto" /><div className="border-l border-slate-300 pl-6"><h1 className="text-3xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">Sistema de Aprovação</h1><p className="text-lg text-slate-600 font-medium">Validação de Peças Criativas</p></div></div>
            </header>
            <main className="max-w-7xl mx-auto px-6 py-12">
                <div className="bg-white p-8 rounded-2xl shadow-lg mb-8 border border-slate-200">
                    <div className="flex items-center justify-between mb-6"><h2 className="text-2xl font-bold text-slate-800">Gestão de Campanhas</h2><button onClick={() => setCampaignModalOpen(true)} className="flex items-center px-6 py-3 bg-emerald-500 text-white font-semibold rounded-xl hover:bg-emerald-600 transition-all"><PlusCircle className="w-5 h-5 mr-2" />Nova Campanha</button></div>
                    {isLoadingCampaigns ? <div className="text-slate-500">Carregando campanhas…</div> : <CampaignSelector campaigns={campaigns} selectedCampaignId={selectedCampaignId} onCampaignChange={setSelectedCampaignId} onCreateNew={() => setCampaignModalOpen(true)} />}
                </div>
{selectedCampaignId && (<>
    <CampaignPreviewCard campaign={selectedCampaign} pieceCount={totalPieces} />

    {/* ======================= BOTÃO DE EXPORTAÇÃO ADICIONADO ======================= */}
    <div className="mt-4 flex justify-end">
        <a
            href={`${import.meta.env.VITE_BACKEND_URL}/campaigns/${selectedCampaignId}/export-ppt`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center px-4 py-2 bg-orange-500 text-white font-semibold rounded-lg hover:bg-orange-600 transition-colors"
        >
            <FileText className="w-4 h-4 mr-2" />
            Exportar PPT
        </a>
    </div>
    {/* ============================================================================= */}

    <div className="mt-8 bg-white p-8 rounded-2xl shadow-lg border border-slate-200">
        <h3 className="text-xl font-bold text-slate-800 mb-4">Linha Criativa / Pasta</h3>
        <form onSubmit={handleCreateCreativeLine} className="flex gap-4 mb-6"><input type="text" value={newCreativeLineName} onChange={(e) => setNewCreativeLineName(e.target.value)} placeholder="Nome da nova pasta..." className="flex-grow p-3 border border-slate-300 rounded-xl focus:border-[#ffc801] focus:ring-2 focus:ring-[#ffc801]/20 outline-none" /><button type="submit" className="flex-shrink-0 px-6 py-3 bg-emerald-500 text-white font-semibold rounded-xl hover:bg-emerald-600 transition-all"><FolderPlus className="w-5 h-5 mr-2 inline-block" />Criar Pasta</button></form>
        {isLoadingCreativeLines ? <div className="text-slate-500">Carregando pastas…</div> : <div className="space-y-2">
            {creativeLines.map((line) => (
                <div key={line.id} className={`p-4 rounded-lg border-2 transition-all flex justify-between items-center group ${selectedCreativeLineId === line.id ? "bg-amber-50 border-amber-300" : "bg-slate-50 border-transparent hover:bg-slate-100"}`}>
                    <div className="flex-grow cursor-pointer" onClick={() => setSelectedCreativeLineId(line.id === selectedCreativeLineId ? null : line.id)}><span className="font-semibold text-slate-700">{line.name}</span></div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button title="Editar nome" onClick={(e) => { e.stopPropagation(); handleEditCreativeLine(line.id, line.name); }} className="p-2 text-slate-500 hover:text-blue-600 hover:bg-slate-200 rounded-full"><Pencil className="w-4 h-4" /></button>
                            <button title="Apagar pasta" onClick={(e) => { e.stopPropagation(); handleDeleteCreativeLine(line.id, line.name); }} className="p-2 text-slate-500 hover:text-red-600 hover:bg-slate-200 rounded-full"><Trash2 className="w-4 h-4" /></button>
                        </div>
                        <span className="text-sm text-slate-500 font-medium bg-slate-200 px-2 py-1 rounded-md">{line.pieces?.length || 0} peças</span>
                    </div>
                </div>
            ))}
        </div>}
    </div>
    <div className="mt-8">
        <FileUpload onFilesAdded={handleFilesAdded} disabled={!selectedCreativeLineId} driveButton={<DriveImportButton campaignId={selectedCampaign?.id} creativeLineId={selectedCreativeLineId} googleAccessToken={googleAccessToken} onImported={handleDriveImport} label="Importar do Google Drive" disabled={!selectedCreativeLineId} />}>
            <div className="flex flex-col items-center">
                <div className={`mx-auto w-16 h-16 bg-gradient-to-br from-[#ffc801] to-[#ffb700] rounded-full flex items-center justify-center mb-4 shadow-lg ${!selectedCreativeLineId ? "grayscale" : ""}`}><Upload className="h-8 w-8 text-white" /></div>
                <h3 className="text-lg font-bold text-slate-800 mb-2">{!selectedCreativeLineId ? "Selecione uma pasta para adicionar peças" : `Adicionar peças em "${creativeLines.find((l) => l.id === selectedCreativeLineId)?.name}"`}</h3><p className="text-slate-500 text-sm">Arraste e solte os arquivos ou use os botões abaixo</p>
            </div>
        </FileUpload>
    </div>
    {piecesOfSelectedLine.length > 0 && (
        <div className="mt-8">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-2xl font-bold text-slate-800">Peças em "{creativeLines.find((l) => l.id === selectedCreativeLineId)?.name}"</h3>
                {!isSelectionMode ? <button onClick={() => setIsSelectionMode(true)} className="flex items-center px-4 py-2 bg-white border border-slate-300 text-slate-600 font-semibold rounded-lg hover:bg-slate-50 transition-colors"><Trash2 className="w-4 h-4 mr-2" />Remover Peças</button> : <div className="flex items-center gap-4"><button onClick={handleSelectAllPieces} className="flex items-center px-4 py-2 bg-blue-500 text-white font-semibold rounded-lg hover:bg-blue-600 transition-colors">Selecionar Todas</button><button onClick={handleCancelSelection} className="flex items-center px-4 py-2 bg-white border border-slate-300 text-slate-600 font-semibold rounded-lg hover:bg-slate-50 transition-colors"><XCircle className="w-4 h-4 mr-2" />Cancelar</button><button onClick={handleRemoveSelectedPieces} disabled={selectedPieces.size === 0} className="flex items-center px-4 py-2 bg-red-500 text-white font-semibold rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"><Trash2 className="w-4 h-4 mr-2" />Remover ({selectedPieces.size})</button></div>}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {piecesOfSelectedLine.map((piece) => (<FileViewer key={piece.id} file={piece} onOpenPopup={setSelectedFile} isSelectionMode={isSelectionMode} isSelected={selectedPieces.has(piece.id)} onSelect={handleTogglePieceSelection} />))}
            </div>
        </div>
    )}
</>)}
            </main>
            <NewCampaignModal isOpen={isCampaignModalOpen} onClose={() => setCampaignModalOpen(false)} onCampaignCreated={handleCampaignCreated} />
            <FilePopup file={selectedFile} onClose={() => setSelectedFile(null)} />
        </div>
    );
};

export default HomePage;