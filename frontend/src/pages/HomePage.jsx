// Em: frontend/src/pages/HomePage.jsx (VERSÃO FINAL E CORRIGIDA)

import React, { useState, useCallback, useEffect, useMemo } from "react";
import { Upload, Check, Image as ImageIcon, Video as VideoIcon, File as FileIcon, X, PlusCircle, FolderPlus, Trash2, Pencil, FileText, HelpCircle, ChevronsRight, Menu, Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import api from "../api/client";
import { DndContext, closestCorners, MouseSensor, TouchSensor, useSensor, useSensors } from "@dnd-kit/core";
import { SortableContext, rectSortingStrategy, useSortable, arrayMove } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

import LogoButton from "../components/LogoButton";
import DriveImportButton from "../components/DriveImportButton";
import CampaignSidebar from "../components/CampaignSidebar";
import HelpModal from "../components/HelpModal";
import ClientSelectionModal from "../components/ClientSelectionModal";
import LoadingSpinner from "../components/LoadingSpinner";

// =================== COMPONENTES INTERNOS ===================

const FileTypeIcon = ({ fileType }) => {
    if ((fileType || "").startsWith("image/")) return <ImageIcon className="w-5 h-5 text-blue-500" />;
    if ((fileType || "").startsWith("video/")) return <VideoIcon className="w-5 h-5 text-purple-500" />;
    return <FileIcon className="w-5 h-5 text-slate-500" />;
};

const FileViewer = ({ file, onOpenPopup, isSelectionMode = false, isSelected = false, onSelect = () => {}, isDragging = false }) => {
    const mime = file.mimetype || "";
    const name = file.originalName || file.filename || "arquivo";
    
    let url = null;
    if (file.filename) {
      url = `${import.meta.env.VITE_BACKEND_URL}/campaigns/files/${file.filename}`;
    } else if (file.driveId) {
      url = `${import.meta.env.VITE_BACKEND_URL}/pieces/drive/${file.id}`;
    }
    
    const handleCardClick = () => {
        if (isDragging) return;
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
            <div className={`bg-white rounded-xl shadow-sm border p-3 transition-all duration-200 cursor-pointer ${isSelectionMode ? (isSelected ? 'border-blue-500 shadow-md' : 'border-slate-200 hover:border-blue-400') : 'border-slate-200 hover:shadow-md hover:border-blue-400 hover:-translate-y-1'} ${isDragging ? 'pointer-events-none' : ''}`}>
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

const FileUpload = ({ onFilesAdded, driveButton, lineId, maxFileSizeMb }) => {
    const [isDragging, setIsDragging] = useState(false);
    const handleDrop = useCallback((e) => {
        e.preventDefault();
        setIsDragging(false);
        onFilesAdded(Array.from(e.dataTransfer.files), lineId);
    }, [onFilesAdded, lineId]);
    const handleDragOver = useCallback((e) => {
        e.preventDefault();
        setIsDragging(true);
    }, []);
    const handleDragLeave = useCallback(() => setIsDragging(false), []);
    const handleFileInput = useCallback((e) => {
        onFilesAdded(Array.from(e.target.files), lineId);
        e.target.value = null;
    }, [onFilesAdded, lineId]);

    const containerClasses = `relative border-2 border-dashed rounded-xl p-6 text-center transition-all duration-300 ${
        isDragging ? "border-blue-500 bg-blue-50" : "border-slate-300 bg-slate-50 hover:border-slate-400"
    }`;

    return <div className={containerClasses} onDrop={handleDrop} onDragOver={handleDragOver} onDragLeave={handleDragLeave}>
        <div className="flex flex-col items-center">
             <Upload className="h-8 w-8 text-slate-400 mb-2" />
            <p className="text-sm text-slate-600 font-medium">Arraste e solte ou <label htmlFor={`file-input-${lineId}`} className="font-semibold text-blue-600 hover:text-blue-800 cursor-pointer">selecione os arquivos</label></p>
            {maxFileSizeMb && <p className="mt-2 text-xs text-slate-400">Limite por arquivo: {maxFileSizeMb} MB</p>}
        </div>
        <input type="file" multiple onChange={handleFileInput} className="hidden" id={`file-input-${lineId}`} />
        <div className="mt-4">{driveButton}</div>
    </div>;
};

const ConfirmDialog = ({ isOpen, title, description, confirmLabel = "Confirmar", confirmVariant = "danger", loading = false, onConfirm, onCancel }) => {
    if (!isOpen) return null;

    const confirmClasses = confirmVariant === "danger"
        ? "bg-red-600 hover:bg-red-700 focus:ring-red-500"
        : "bg-blue-600 hover:bg-blue-700 focus:ring-blue-500";

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
                <div className="px-6 pt-6 pb-2">
                    <h3 className="text-lg font-semibold text-slate-800">{title}</h3>
                    <p className="mt-2 text-sm text-slate-500">{description}</p>
                </div>
                <div className="px-6 py-4 bg-slate-50 flex items-center justify-end gap-3">
                    <button type="button" onClick={onCancel} disabled={loading} className="px-4 py-2 rounded-lg text-sm font-semibold text-slate-600 hover:text-slate-800 transition-colors disabled:opacity-50">
                        Cancelar
                    </button>
                    <button type="button" onClick={onConfirm} disabled={loading} className={`px-5 py-2 rounded-lg text-sm font-semibold text-white transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 ${confirmClasses}`}>
                        {loading ? "Processando..." : confirmLabel}
                    </button>
                </div>
            </div>
        </div>
    );
};

const SortablePiece = ({
    piece,
    lineId,
    onOpenPopup,
    draggingPieceId,
    isSelectionMode,
    onToggleSelect,
    isSelected,
    onStartRename,
    isEditing,
    renameValue,
    onRenameChange,
    onRenameCancel,
    onRenameSubmit,
    isSavingRename,
}) => {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
        id: piece.id,
        data: { lineId },
        disabled: isSelectionMode || isEditing,
    });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };

    const isActive = isDragging || draggingPieceId === piece.id;

    const handleRenameSubmit = (e) => {
        e.preventDefault();
        onRenameSubmit(piece.id);
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            {...attributes}
            {...listeners}
            className={`cursor-${isSelectionMode || isEditing ? 'default' : 'grab'} ${isSelectionMode || isEditing ? '' : 'active:cursor-grabbing'} ${isActive ? 'opacity-60' : ''}`}
        >
            <div className="relative">
                {!isSelectionMode && !isEditing && (
                    <button
                        type="button"
                        onClick={(event) => {
                            event.stopPropagation();
                            onStartRename(piece);
                        }}
                        className="absolute top-2 right-2 z-20 p-2 rounded-full bg-white/90 text-slate-500 shadow hover:text-blue-600 hover:bg-white transition-colors"
                    >
                        <Pencil className="w-4 h-4" />
                    </button>
                )}

                <FileViewer
                    file={piece}
                    onOpenPopup={onOpenPopup}
                    isSelectionMode={isSelectionMode}
                    isSelected={isSelected}
                    onSelect={onToggleSelect}
                    isDragging={isActive}
                />

                {isEditing && (
                    <div className="absolute inset-0 z-30 bg-white/95 backdrop-blur-sm border border-slate-200 rounded-xl p-4 flex flex-col justify-center">
                        <form onSubmit={handleRenameSubmit} className="space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Renomear peça</label>
                                <input
                                    type="text"
                                    value={renameValue}
                                    onChange={(e) => onRenameChange(e.target.value)}
                                    className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                                    placeholder="Novo nome"
                                    autoFocus
                                />
                            </div>
                            <div className="flex items-center justify-end gap-2">
                                <button
                                    type="button"
                                    onClick={onRenameCancel}
                                    className="px-4 py-2 text-sm font-semibold text-slate-500 hover:text-slate-700"
                                    disabled={isSavingRename}
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50"
                                    disabled={isSavingRename}
                                >
                                    {isSavingRename ? 'Salvando...' : 'Salvar' }
                                </button>
                            </div>
                        </form>
                    </div>
                )}
            </div>
        </div>
    );
};

const NewCampaignModal = ({ isOpen, onClose, onCampaignCreated }) => {
    const [name, setName] = useState("");
    const [selectedMasterClientId, setSelectedMasterClientId] = useState("");
    const [masterClients, setMasterClients] = useState([]);
    const [isLoadingClients, setIsLoadingClients] = useState(false);
    const [error, setError] = useState("");
    const [isCreating, setIsCreating] = useState(false);

    useEffect(() => {
        if (!isOpen) {
            setName("");
            setSelectedMasterClientId("");
            setError("");
            setMasterClients([]);
            setIsLoadingClients(false);
            return;
        }

        let isActive = true;

        const fetchMasterClients = async () => {
            setIsLoadingClients(true);
            setError("");
            try {
                const response = await api.get("/master-clients");
                if (isActive) {
                    setMasterClients(response.data || []);
                }
            } catch (err) {
                console.error("Erro ao buscar Master Clients:", err);
                if (isActive) {
                    setError("Não foi possível carregar a lista de clientes.");
                    setMasterClients([]);
                }
            } finally {
                if (isActive) {
                    setIsLoadingClients(false);
                }
            }
        };

        fetchMasterClients();

        return () => {
            isActive = false;
        };
    }, [isOpen]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!name.trim() || !selectedMasterClientId) {
            setError("Nome da Campanha e Cliente são obrigatórios.");
            return;
        }
        setError("");
        setIsCreating(true);
        try {
            const response = await api.post("/campaigns", {
                name: name.trim(),
                MasterClientId: parseInt(selectedMasterClientId, 10),
            });
            const newCampaign = response.data;
            onCampaignCreated(newCampaign);
            toast.success(`Campanha "${newCampaign.name}" criada!`);
            onClose();
        } catch (err) {
            const message =
                err.response?.data?.error ||
                err.message ||
                "Falha ao criar campanha.";
            setError(message);
            toast.error(message);
        } finally {
            setIsCreating(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
                <div className="p-6 border-b border-slate-200 flex justify-between items-center">
                    <h3 className="text-xl font-bold text-slate-800">Criar Nova Campanha</h3>
                    <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                        <X className="w-5 h-5 text-slate-600" />
                    </button>
                </div>
                <form onSubmit={handleSubmit}>
                    <div className="p-6 space-y-6">
                        {error && !isLoadingClients && <p className="text-red-600 text-sm bg-red-50 p-3 rounded-md">{error}</p>}
                        <div>
                            <label htmlFor="campaignName" className="block text-sm font-semibold text-slate-700 mb-2">Nome da Campanha *</label>
                            <input
                                type="text"
                                id="campaignName"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="w-full p-3 border border-slate-300 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none"
                                required
                                placeholder="Ex: Lançamento Produto X"
                            />
                        </div>
                        <div>
                            <label htmlFor="campaignClient" className="block text-sm font-semibold text-slate-700 mb-2">Cliente *</label>
                            <select
                                id="campaignClient"
                                value={selectedMasterClientId}
                                onChange={(e) => setSelectedMasterClientId(e.target.value)}
                                className="w-full p-3 border border-slate-300 rounded-xl bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none appearance-none bg-no-repeat bg-right pr-8 disabled:opacity-50 disabled:bg-slate-50"
                                style={{ backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")` }}
                                required
                                disabled={isLoadingClients || masterClients.length === 0}
                            >
                                <option value="" disabled>
                                    {isLoadingClients ? "Carregando clientes..." : "Selecione um cliente"}
                                </option>
                                {masterClients.map((client) => (
                                    <option key={client.id} value={client.id}>
                                        {client.name}
                                    </option>
                                ))}
                            </select>
                            {!isLoadingClients && masterClients.length === 0 && !error && (
                                <p className="text-xs text-slate-500 mt-1">Nenhum cliente mestre cadastrado.</p>
                            )}
                        </div>
                    </div>
                    <div className="flex items-center justify-end space-x-4 p-6 bg-slate-50 rounded-b-2xl">
                        <button type="button" onClick={onClose} disabled={isCreating} className="px-4 py-2 text-slate-600 font-semibold hover:text-slate-800 disabled:opacity-50">
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={isCreating || isLoadingClients || !name.trim() || !selectedMasterClientId}
                            className="px-6 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50"
                        >
                            {isCreating ? "Criando..." : "Criar Campanha"}
                        </button>
                    </div>
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
    const [isSidebarOpen, setSidebarOpen] = useState(false);
    const [newCreativeLineName, setNewCreativeLineName] = useState("");
    const [selectedFile, setSelectedFile] = useState(null);
    const [isHelpModalOpen, setHelpModalOpen] = useState(false);
    const [isEditingCampaign, setIsEditingCampaign] = useState(false);
    const [campaignDraft, setCampaignDraft] = useState({ name: "", MasterClientId: "" });
    const [masterClientsForEdit, setMasterClientsForEdit] = useState([]);
    const [isLoadingMasterClientsForEdit, setIsLoadingMasterClientsForEdit] = useState(false);
    const [isSavingCampaign, setIsSavingCampaign] = useState(false);
    const [campaignDeleteTarget, setCampaignDeleteTarget] = useState(null);
    const [isDeletingCampaign, setIsDeletingCampaign] = useState(false);
    const [editingLineId, setEditingLineId] = useState(null);
    const [lineNameDraft, setLineNameDraft] = useState("");
    const [isSavingLine, setIsSavingLine] = useState(false);
    const [lineDeleteTarget, setLineDeleteTarget] = useState(null);
    const [isDeletingLine, setIsDeletingLine] = useState(false);
    const [dragState, setDragState] = useState(null);
    const [draggingPieceId, setDraggingPieceId] = useState(null);
    const [isSelectionMode, setIsSelectionMode] = useState(false);
    const [selectedPieceIds, setSelectedPieceIds] = useState(new Set());
    const [isDeletingPieces, setIsDeletingPieces] = useState(false);
    const [isDeletePiecesDialogOpen, setDeletePiecesDialogOpen] = useState(false);
    const [editingPieceId, setEditingPieceId] = useState(null);
    const [pieceNameDraft, setPieceNameDraft] = useState('');
    const [isSavingPieceName, setIsSavingPieceName] = useState(false);
    const [isExportingPpt, setIsExportingPpt] = useState(false);
    const [isClientSelectionModalOpen, setClientSelectionModalOpen] = useState(false);
    const [uploadingLineId, setUploadingLineId] = useState(null);

    const sensors = useSensors(
        useSensor(MouseSensor, { activationConstraint: { distance: 6 } }),
        useSensor(TouchSensor, { pressDelay: 150, activationConstraint: { distance: 6 } })
    );
    

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

    const parseErrorMessage = useCallback(async (response, fallbackMessage) => {
        try {
            const data = await response.json();
            if (data?.error) return data.error;
            if (data?.message) return data.message;
        } catch (_) { /* body já consumido ou vazio */ }
        return fallbackMessage;
    }, []);

    const persistPiecesOrder = useCallback(async (lineId, pieceIds) => {
        const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/creative-lines/${lineId}/reorder`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({ pieceOrder: pieceIds }),
        });
        if (!res.ok) {
            const message = await parseErrorMessage(res, "Não foi possível salvar a nova ordem das peças.");
            throw new Error(message);
        }
        const data = await res.json().catch(() => ({}));
        return data?.pieces || [];
    }, [parseErrorMessage]);

    useEffect(() => { fetchCampaigns(); }, [fetchCampaigns]);
    useEffect(() => { fetchCreativeLines(selectedCampaignId); }, [selectedCampaignId, fetchCreativeLines]);
    useEffect(() => {
        setIsEditingCampaign(false);
        setIsSavingCampaign(false);
        setCampaignDraft({ name: "", MasterClientId: "" });
        setCampaignDeleteTarget(null);
        setIsDeletingCampaign(false);
        setEditingLineId(null);
        setIsSavingLine(false);
        setLineNameDraft("");
        setLineDeleteTarget(null);
        setIsDeletingLine(false);
        setDragState(null);
        setDraggingPieceId(null);
        setIsSelectionMode(false);
        setSelectedPieceIds(new Set());
        setIsDeletingPieces(false);
        setDeletePiecesDialogOpen(false);
        setEditingPieceId(null);
        setPieceNameDraft('');
        setIsSavingPieceName(false);
        setSidebarOpen(false);
        setIsExportingPpt(false);
        setUploadingLineId(null);
    }, [selectedCampaignId]);

    const selectedCampaign = campaigns.find((c) => c.id === selectedCampaignId);
    const loadingText = useMemo(() => {
        if (!uploadingLineId) return "Processando arquivos...";
        const line = creativeLines.find((item) => item.id === uploadingLineId);
        if (line?.name) {
            return `Processando arquivos da pasta "${line.name}"...`;
        }
        return "Processando arquivos...";
    }, [creativeLines, uploadingLineId]);

    const handleCampaignCreated = (newCampaign) => {
        setCampaigns((prev) => [newCampaign, ...prev]);
        setSelectedCampaignId(newCampaign.id);
        toast.success(`Campanha "${newCampaign.name}" criada!`);
    };

    const handleAssignClients = async (clientIds) => {
        if (!selectedCampaignId || clientIds.length === 0) return;

        const loadingToast = toast.loading(`Enviando para ${clientIds.length} cliente(s)...`);

        try {
            let lastResponseData = null;
            for (const clientId of clientIds) {
                const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/clients/assign-campaign`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    credentials: "include",
                    body: JSON.stringify({ campaignId: selectedCampaignId, clientId }),
                });

                if (!res.ok) {
                    const message = await parseErrorMessage(res, `Falha ao atribuir cliente ID: ${clientId}`);
                    throw new Error(message);
                }
                lastResponseData = await res.json();
            }

            toast.success("Campanha enviada para aprovação com sucesso!", { id: loadingToast });
            setClientSelectionModalOpen(false);
            setCampaigns(prevCampaigns =>
                prevCampaigns.map(c => {
                    if (c.id !== selectedCampaignId) return c;
                    const nextStatus = lastResponseData?.campaignStatus || 'sent_for_approval';
                    const sentForApprovalAt =
                        lastResponseData?.sentForApprovalAt || c.sentForApprovalAt || null;
                    return {
                        ...c,
                        status: nextStatus,
                        sentForApprovalAt,
                    };
                })
            );
        } catch (error) {
            toast.error(error.message || "Não foi possível enviar a campanha para os clientes selecionados.", { id: loadingToast });
        }
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
    
    const uploadMaxBytes = Number(import.meta.env.VITE_UPLOAD_MAX_BYTES || 200 * 1024 * 1024);
    const uploadMaxMb = Math.round(uploadMaxBytes / (1024 * 1024));

    const handleFilesAdded = useCallback(async (newFiles, lineId) => {
        if (!lineId) return toast.error("Erro: ID da pasta não encontrado.");
        if (!newFiles || newFiles.length === 0) return;
        if (uploadingLineId) {
            toast.error("Por favor, aguarde o processamento atual terminar.");
            return;
        }

        const filesArray = Array.from(newFiles);
        const oversized = filesArray.filter((file) => file.size > uploadMaxBytes);
        const allowed = filesArray.filter((file) => file.size <= uploadMaxBytes);

        if (oversized.length > 0) {
            if (oversized.length === filesArray.length) {
                toast.error(`Os arquivos selecionados excedem o limite de ${uploadMaxMb} MB.`);
                return;
            }
            toast.error(`Alguns arquivos foram ignorados por exceder ${uploadMaxMb} MB.`);
        }

        if (allowed.length === 0) return;

        setUploadingLineId(lineId);
        try {
            const formData = new FormData();
            allowed.forEach((file) => formData.append("files", file));
            const url = `${import.meta.env.VITE_BACKEND_URL}/campaigns/${selectedCampaignId}/upload?creativeLineId=${lineId}`;
            const res = await fetch(url, { method: "POST", credentials: "include", body: formData });
            if (!res.ok) {
                const message = await parseErrorMessage(res, "Falha no upload.");
                throw new Error(message);
            }
            const { pieces } = await res.json();
            
            setCreativeLines(prevLines => prevLines.map(line => 
                line.id === lineId 
                    ? { ...line, pieces: [...(line.pieces || []), ...pieces] }
                    : line
            ));

            toast.success(`${allowed.length} arquivo(s) enviados!`);
        } catch (error) {
            toast.error(error.message);
        } finally {
            setUploadingLineId(null);
        }
    }, [selectedCampaignId, uploadMaxBytes, uploadMaxMb, parseErrorMessage, uploadingLineId]);

    const handleDriveImport = (savedPieces, lineId) => {
        if (savedPieces && savedPieces.length > 0 && lineId) {
            setCreativeLines(prevLines => prevLines.map(line => 
                line.id === lineId 
                    ? { ...line, pieces: [...(line.pieces || []), ...savedPieces] }
                    : line
            ));
        }
    };

    const handleExportPpt = async () => {
        if (!selectedCampaignId || !selectedCampaign) return;
        if (isExportingPpt) return;
        setIsExportingPpt(true);
        const loadingToast = toast.loading("Gerando apresentação...");
        try {
            const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/campaigns/${selectedCampaignId}/export-ppt`, {
                credentials: "include",
            });
            if (!res.ok) {
                const errorData = await res.json().catch(() => ({}));
                throw new Error(errorData.error || "Não foi possível gerar a apresentação.");
            }
            const blob = await res.blob();
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            const fallbackName = selectedCampaign?.name ? `${selectedCampaign.name}.pptx` : 'campanha.pptx';
            link.download = fallbackName;
            document.body.appendChild(link);
            link.click();
            link.remove();
            setTimeout(() => window.URL.revokeObjectURL(url), 3000);
            toast.success("Apresentação gerada com sucesso!", { id: loadingToast });
        } catch (error) {
            toast.error(error.message || "Erro ao exportar a apresentação.", { id: loadingToast });
        } finally {
            setIsExportingPpt(false);
        }
    };

    const allPieceIds = useMemo(() => {
        const ids = [];
        creativeLines.forEach((line) => {
            (line.pieces || []).forEach((piece) => ids.push(piece.id));
        });
        return ids;
    }, [creativeLines]);

    const totalPieces = allPieceIds.length;
    const totalSelectedPieces = selectedPieceIds.size;
    const allPiecesSelected = totalPieces > 0 && totalSelectedPieces === totalPieces;

    const exitSelectionMode = useCallback(() => {
        setIsSelectionMode(false);
        setSelectedPieceIds(new Set());
    }, []);

    const handleToggleSelectionMode = () => {
        if (isSelectionMode) {
            exitSelectionMode();
            return;
        }
        if (totalPieces === 0) {
            toast.error('Não há peças para remover.');
            return;
        }
        if (editingPieceId) {
            setEditingPieceId(null);
            setPieceNameDraft('');
        }
        setIsSelectionMode(true);
    };

    const handleToggleSelectPiece = (pieceId) => {
        setSelectedPieceIds((prev) => {
            const next = new Set(prev);
            if (next.has(pieceId)) next.delete(pieceId);
            else next.add(pieceId);
            return next;
        });
    };

    const handleSelectAllPieces = () => {
        if (totalPieces === 0) return;
        if (allPiecesSelected) return;
        setSelectedPieceIds(new Set(allPieceIds));
    };

    const handleDeleteSelectedPiecesRequest = () => {
        if (totalSelectedPieces === 0) {
            toast.error('Selecione ao menos uma peça para remover.');
            return;
        }
        setDeletePiecesDialogOpen(true);
    };

    const handleConfirmDeleteSelectedPieces = async () => {
        const pieceIds = Array.from(selectedPieceIds);
        if (pieceIds.length === 0) return;
        setIsDeletingPieces(true);
        const loadingToast = toast.loading('Removendo peças selecionadas...');
        try {
            const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/pieces`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ pieceIds }),
            });
            if (!res.ok) {
                const message = await parseErrorMessage(res, 'Não foi possível remover as peças selecionadas.');
                throw new Error(message);
            }
            setCreativeLines((prevLines) =>
                prevLines.map((line) => ({
                    ...line,
                    pieces: (line.pieces || []).filter((piece) => !selectedPieceIds.has(piece.id)),
                }))
            );
            toast.success(`${pieceIds.length} peça(s) removida(s).`, { id: loadingToast });
            exitSelectionMode();
        } catch (error) {
            toast.error(error.message || 'Erro ao remover peças.', { id: loadingToast });
        } finally {
            setIsDeletingPieces(false);
            setDeletePiecesDialogOpen(false);
        }
    };

    const startPieceRename = (piece) => {
        setEditingPieceId(piece.id);
        setPieceNameDraft(piece.originalName || '');
        if (isSelectionMode) {
            exitSelectionMode();
        }
    };

    const cancelPieceRename = () => {
        if (isSavingPieceName) return;
        setEditingPieceId(null);
        setPieceNameDraft('');
    };

    const handlePieceRenameSubmit = async (pieceId) => {
        const trimmed = pieceNameDraft.trim();
        if (!trimmed) {
            toast.error('O nome da peça não pode ser vazio.');
            return;
        }

        setIsSavingPieceName(true);
        const loadingToast = toast.loading('Salvando nome da peça...');
        try {
            const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/pieces/${pieceId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ originalName: trimmed }),
            });
            if (!res.ok) {
                const message = await parseErrorMessage(res, 'Não foi possível atualizar o nome da peça.');
                throw new Error(message);
            }
            const updatedPiece = await res.json();
            setCreativeLines((prevLines) =>
                prevLines.map((line) => ({
                    ...line,
                    pieces: (line.pieces || []).map((piece) =>
                        piece.id === updatedPiece.id ? { ...piece, originalName: updatedPiece.originalName } : piece
                    ),
                }))
            );
            toast.success('Nome da peça atualizado!', { id: loadingToast });
            setEditingPieceId(null);
            setPieceNameDraft('');
        } catch (error) {
            toast.error(error.message || 'Erro ao atualizar a peça.', { id: loadingToast });
        } finally {
            setIsSavingPieceName(false);
        }
    };

    const handlePieceDragStart = useCallback((event) => {
        if (isSelectionMode || editingPieceId) return;
        const lineId = event.active?.data?.current?.lineId;
        if (!lineId) return;
        setDraggingPieceId(event.active.id);
        setDragState(() => {
            const line = creativeLines.find((l) => l.id === lineId);
            return {
                lineId,
                initialPieces: line ? [...(line.pieces || [])] : [],
            };
        });
    }, [creativeLines, isSelectionMode, editingPieceId]);

    const handlePieceDragCancel = useCallback(() => {
        if (dragState?.lineId && dragState.initialPieces) {
            setCreativeLines((prev) =>
                prev.map((line) =>
                    line.id === dragState.lineId ? { ...line, pieces: [...dragState.initialPieces] } : line
                )
            );
        }
        setDragState(null);
        setDraggingPieceId(null);
    }, [dragState]);

    const handlePieceDragEnd = useCallback(async (event) => {
        if (isSelectionMode || editingPieceId) {
            handlePieceDragCancel();
            return;
        }
        const { active, over } = event;
        if (!active || !over) {
            handlePieceDragCancel();
            return;
        }

        const activeLineId = active.data?.current?.lineId;
        const overLineId = over.data?.current?.lineId;

        if (!activeLineId || !overLineId || activeLineId !== overLineId) {
            handlePieceDragCancel();
            return;
        }

        if (active.id === over.id) {
            setDragState(null);
            setDraggingPieceId(null);
            return;
        }

        let reorderedPieces = null;
        setCreativeLines((prevLines) =>
            prevLines.map((line) => {
                if (line.id !== activeLineId) return line;
                const currentPieces = line.pieces || [];
                const oldIndex = currentPieces.findIndex((piece) => piece.id === active.id);
                const newIndex = currentPieces.findIndex((piece) => piece.id === over.id);
                if (oldIndex === -1 || newIndex === -1 || oldIndex === newIndex) return line;
                reorderedPieces = arrayMove(currentPieces, oldIndex, newIndex);
                return { ...line, pieces: reorderedPieces };
            })
        );

        if (!reorderedPieces) {
            setDragState(null);
            setDraggingPieceId(null);
            return;
        }

        try {
            const pieceIds = reorderedPieces.map((piece) => piece.id);
            const updatedPieces = await persistPiecesOrder(activeLineId, pieceIds);
            if (Array.isArray(updatedPieces) && updatedPieces.length > 0) {
                setCreativeLines((prevLines) =>
                    prevLines.map((line) =>
                        line.id === activeLineId ? { ...line, pieces: updatedPieces } : line
                    )
                );
            }
            toast.success("Ordem atualizada!");
        } catch (error) {
            toast.error(error.message || "Falha ao salvar a nova ordem.");
            if (dragState?.initialPieces) {
                setCreativeLines((prevLines) =>
                    prevLines.map((line) =>
                        line.id === dragState.lineId ? { ...line, pieces: [...dragState.initialPieces] } : line
                    )
                );
            }
        } finally {
            setDragState(null);
            setDraggingPieceId(null);
        }
    }, [persistPiecesOrder, dragState, handlePieceDragCancel, isSelectionMode, editingPieceId]);

    const fetchMasterClientsForEdit = useCallback(async () => {
        if (masterClientsForEdit.length > 0) return;
        setIsLoadingMasterClientsForEdit(true);
        try {
            const response = await api.get("/master-clients");
            setMasterClientsForEdit(response.data || []);
        } catch (err) {
            console.error("Erro ao buscar Master Clients para edição:", err);
            toast.error("Não foi possível carregar a lista de empresas cliente.");
            setMasterClientsForEdit([]);
        } finally {
            setIsLoadingMasterClientsForEdit(false);
        }
    }, [masterClientsForEdit.length]);

    const startCampaignEdit = () => {
        if (!selectedCampaign) return;
        fetchMasterClientsForEdit();
        const draftMasterClientId =
            selectedCampaign.MasterClientId ??
            selectedCampaign.masterClient?.id ??
            "";
        setCampaignDraft({
            name: selectedCampaign.name || "",
            MasterClientId: draftMasterClientId ? String(draftMasterClientId) : "",
        });
        setIsEditingCampaign(true);
    };

    const cancelCampaignEdit = () => {
        if (isSavingCampaign) return;
        setIsEditingCampaign(false);
        setCampaignDraft({ name: "", MasterClientId: "" });
    };

    const handleCampaignEditSubmit = async (e) => {
        e.preventDefault();
        if (!selectedCampaignId) return;

        const name = campaignDraft.name.trim();
        const masterClientId = campaignDraft.MasterClientId;
        if (!name || !masterClientId) {
            toast.error("Nome e Empresa Cliente são obrigatórios.");
            return;
        }

        const loadingToast = toast.loading("Atualizando campanha...");
        setIsSavingCampaign(true);
        try {
            const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/campaigns/${selectedCampaignId}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({ name, MasterClientId: parseInt(masterClientId, 10) }),
            });
            if (!res.ok) {
                const message = await parseErrorMessage(res, "Não foi possível atualizar a campanha.");
                throw new Error(message);
            }
            const updatedCampaignResult = await res.json();
            const updatedMasterClient =
                masterClientsForEdit.find((mc) => mc.id === updatedCampaignResult.MasterClientId) ||
                updatedCampaignResult.masterClient ||
                selectedCampaign?.masterClient ||
                null;

            setCampaigns((prev) =>
                prev.map((c) =>
                    c.id === updatedCampaignResult.id
                        ? {
                              ...c,
                              ...updatedCampaignResult,
                              client: updatedMasterClient?.name || c.client,
                              masterClient: updatedMasterClient
                                  ? { id: updatedMasterClient.id, name: updatedMasterClient.name }
                                  : c.masterClient,
                          }
                        : c
                )
            );
            setIsEditingCampaign(false);
            setCampaignDraft({ name: "", MasterClientId: "" });
            toast.success("Campanha atualizada!", { id: loadingToast });
        } catch (error) {
            toast.error(error.message || "Erro ao atualizar a campanha.", { id: loadingToast });
        } finally {
            setIsSavingCampaign(false);
        }
    };

    const handleDeleteCampaignRequest = () => {
        if (!selectedCampaign) return;
        setCampaignDeleteTarget(selectedCampaign);
    };

    const handleConfirmDeleteCampaign = async () => {
        if (!campaignDeleteTarget) return;
        const target = campaignDeleteTarget;
        const loadingToast = toast.loading("Removendo campanha...");
        setIsDeletingCampaign(true);
        try {
            const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/campaigns/${target.id}`, {
                method: "DELETE",
                credentials: "include",
            });
            if (!res.ok) {
                const message = await parseErrorMessage(res, "Não foi possível remover a campanha.");
                throw new Error(message);
            }
            setCampaigns(prev => {
                const updated = prev.filter(c => c.id !== target.id);
                if (target.id === selectedCampaignId) {
                    const fallback = updated[0]?.id || "";
                    setSelectedCampaignId(fallback);
                    if (!fallback) setCreativeLines([]);
                }
                return updated;
            });
            setCampaignDeleteTarget(null);
            toast.success(`Campanha "${target.name}" removida!`, { id: loadingToast });
        } catch (error) {
            toast.error(error.message || "Erro ao remover campanha.", { id: loadingToast });
        } finally {
            setIsDeletingCampaign(false);
        }
    };

    const startLineEdit = (line) => {
        setEditingLineId(line.id);
        setLineNameDraft(line.name || "");
    };

    const cancelLineEdit = () => {
        if (isSavingLine) return;
        setEditingLineId(null);
        setLineNameDraft("");
    };

    const handleLineEditSubmit = async (e) => {
        e.preventDefault();
        if (!editingLineId) return;

        const nextName = lineNameDraft.trim();
        if (!nextName) {
            toast.error("O nome da pasta não pode ser vazio.");
            return;
        }

        const loadingToast = toast.loading("Atualizando pasta...");
        setIsSavingLine(true);
        try {
            const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/creative-lines/${editingLineId}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({ name: nextName }),
            });
            if (!res.ok) {
                const message = await parseErrorMessage(res, "Não foi possível atualizar a pasta.");
                throw new Error(message);
            }
            const updatedLine = await res.json();
            setCreativeLines(prev => prev.map(line => line.id === updatedLine.id ? { ...line, name: updatedLine.name } : line));
            toast.success("Pasta atualizada!", { id: loadingToast });
            cancelLineEdit();
        } catch (error) {
            toast.error(error.message || "Erro ao atualizar a pasta.", { id: loadingToast });
        } finally {
            setIsSavingLine(false);
        }
    };

    const handleDeleteLineRequest = (line) => {
        setLineDeleteTarget(line);
    };

    const handleConfirmDeleteLine = async () => {
        if (!lineDeleteTarget) return;
        const target = lineDeleteTarget;
        const loadingToast = toast.loading("Removendo pasta...");
        setIsDeletingLine(true);
        try {
            const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/creative-lines/${target.id}`, {
                method: "DELETE",
                credentials: "include",
            });
            if (!res.ok) {
                const message = await parseErrorMessage(res, "Não foi possível remover a pasta.");
                throw new Error(message);
            }
            setCreativeLines(prev => prev.filter(line => line.id !== target.id));
            if (editingLineId === target.id) {
                setEditingLineId(null);
                setLineNameDraft("");
            }
            setLineDeleteTarget(null);
            toast.success(`Pasta "${target.name}" removida!`, { id: loadingToast });
        } catch (error) {
            toast.error(error.message || "Erro ao remover pasta.", { id: loadingToast });
        } finally {
            setIsDeletingLine(false);
        }
    };

    return (
        <div className="min-h-screen w-full bg-slate-100 flex flex-col antialiased">
            <header className="bg-white shadow-sm border-b border-slate-200 flex-shrink-0 z-20">
                <div className="max-w-full mx-auto px-4 sm:px-6 py-5 flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                        <button
                            type="button"
                            onClick={() => setSidebarOpen(true)}
                            className="lg:hidden p-2 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition-colors"
                            aria-label="Abrir menu de campanhas"
                        >
                            <Menu className="w-6 h-6" />
                        </button>
                        <LogoButton imageClassName="w-28 sm:w-32 max-h-20 object-contain" />
                    </div>
                    <button
                        onClick={() => setHelpModalOpen(true)}
                        className="p-2 rounded-full text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition-colors"
                        aria-label="Abrir ajuda"
                    >
                        <HelpCircle className="w-6 h-6" />
                    </button>
                </div>
            </header>
            
            <div className="flex flex-1 overflow-hidden relative bg-slate-100">
                <CampaignSidebar 
                    campaigns={campaigns}
                    selectedCampaignId={selectedCampaignId}
                    onCampaignChange={setSelectedCampaignId}
                    onOpenNewCampaignModal={() => setCampaignModalOpen(true)}
                    isLoading={isLoadingCampaigns}
                    isMobileOpen={isSidebarOpen}
                    onCloseMobile={() => setSidebarOpen(false)}
                />

                <main className="flex-1 overflow-y-auto border-l border-slate-200 bg-white/70 px-4 sm:px-6 lg:px-8 py-6">
                    {!selectedCampaign ? (
                         <div className="flex flex-col items-center justify-center h-full text-center text-slate-500">
                             <ChevronsRight className="w-16 h-16 text-slate-300 mb-4" />
                             <h2 className="text-2xl font-bold">Bem-vindo ao Aprobi!</h2>
                             <p className="mt-2 max-w-md">Selecione uma campanha na barra lateral para começar a trabalhar, ou crie uma nova para iniciar seu projeto.</p>
                         </div>
                    ) : (
                        <div>
                            <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6 mb-8">
                                <div className="flex-1">
                                    {isEditingCampaign ? (
                                        <form onSubmit={handleCampaignEditSubmit} className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                                            <div className="grid gap-4 md:grid-cols-2">
                                                <div>
                                                    <label className="block text-sm font-semibold text-slate-600 mb-2">Nome da Campanha</label>
                                                    <input type="text" value={campaignDraft.name} onChange={(e) => setCampaignDraft((prev) => ({ ...prev, name: e.target.value }))} className="w-full p-3 border border-slate-300 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none" placeholder="Nome da campanha" />
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-semibold text-slate-600 mb-2">Empresa Cliente</label>
                                                    <select
                                                        value={campaignDraft.MasterClientId}
                                                        onChange={(e) =>
                                                            setCampaignDraft((prev) => ({
                                                                ...prev,
                                                                MasterClientId: e.target.value,
                                                            }))
                                                        }
                                                        className="w-full p-3 border border-slate-300 rounded-xl bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none appearance-none bg-no-repeat bg-right pr-8 disabled:opacity-50 disabled:bg-slate-50"
                                                        style={{
                                                            backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
                                                            backgroundPosition: "right 0.5rem center",
                                                            backgroundSize: "1.5em 1.5em",
                                                        }}
                                                        required
                                                        disabled={isLoadingMasterClientsForEdit}
                                                    >
                                                        <option value="" disabled>
                                                            {isLoadingMasterClientsForEdit
                                                                ? "Carregando empresas..."
                                                                : "Selecione uma empresa"}
                                                        </option>
                                                        {masterClientsForEdit.map((mc) => (
                                                            <option key={mc.id} value={mc.id}>
                                                                {mc.name}
                                                            </option>
                                                        ))}
                                                    </select>
                                                </div>
                                            </div>
                                            <div className="flex flex-col sm:flex-row sm:justify-end gap-3 mt-6">
                                                <button type="button" onClick={cancelCampaignEdit} disabled={isSavingCampaign} className="px-5 py-2 rounded-lg border border-slate-300 text-slate-600 font-semibold hover:text-slate-800 hover:border-slate-400 transition-colors disabled:opacity-50">
                                                    Cancelar
                                                </button>
                                                <button
                                                    type="submit"
                                                    disabled={
                                                        isSavingCampaign ||
                                                        isLoadingMasterClientsForEdit ||
                                                        !campaignDraft.name ||
                                                        !campaignDraft.MasterClientId
                                                    }
                                                    className="px-6 py-2 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50"
                                                >
                                                    {isSavingCampaign ? "Salvando..." : "Salvar alterações"}
                                                </button>
                                            </div>
                                        </form>
                                    ) : (
                                        <div className="flex flex-col gap-3">
                                            <span className="text-xs font-semibold tracking-[0.2em] text-slate-400 uppercase">{selectedCampaign.client}</span>
                                            <div className="flex items-start gap-3">
                                                <h1 className="text-3xl font-bold text-slate-800">{selectedCampaign.name}</h1>
                                                <div className="flex items-center gap-2">
                                                    <button type="button" onClick={startCampaignEdit} className="p-2 rounded-lg border border-slate-200 text-slate-500 hover:text-blue-600 hover:border-blue-200 transition-colors">
                                                        <Pencil className="w-4 h-4" />
                                                    </button>
                                                    <button type="button" onClick={handleDeleteCampaignRequest} className="p-2 rounded-lg border border-slate-200 text-slate-500 hover:text-red-600 hover:border-red-200 transition-colors">
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                                <button
                                    type="button"
                                    onClick={handleExportPpt}
                                    disabled={isExportingPpt}
                                    className="flex items-center justify-center h-11 px-4 bg-orange-500 text-white font-semibold rounded-lg transition-colors shadow-sm hover:shadow-md lg:self-start disabled:opacity-60 disabled:cursor-not-allowed"
                                >
                                    {isExportingPpt ? (
                                        <>
                                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                            Gerando PPT...
                                        </>
                                    ) : (
                                        <>
                                            <FileText className="w-4 h-4 mr-2" />
                                            Exportar PPT
                                        </>
                                    )}
                                </button>
                            </div>

                            <div className="mb-10">
                                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                                    <form onSubmit={handleCreateCreativeLine} className="flex gap-4 max-w-xl flex-1">
                                        <input type="text" value={newCreativeLineName} onChange={(e) => setNewCreativeLineName(e.target.value)} placeholder="Nome da nova Linha Criativa / Pasta..." className="flex-grow p-3 border border-slate-300 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition" />
                                        <button type="submit" className="flex-shrink-0 px-5 py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-all shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed" disabled={!newCreativeLineName.trim()}>
                                            <FolderPlus className="w-5 h-5" />
                                        </button>
                                    </form>
                                    <div className="flex items-center gap-3">
                                        {isSelectionMode ? (
                                            <>
                                                <button type="button" onClick={exitSelectionMode} className="px-4 py-2 rounded-lg border border-slate-300 text-slate-600 font-semibold hover:text-slate-800 hover:border-slate-400 transition-colors">
                                                    Cancelar seleção
                                                </button>
                                                <button type="button" onClick={handleSelectAllPieces} disabled={allPiecesSelected} className="px-4 py-2 rounded-lg border border-blue-200 text-blue-600 font-semibold hover:border-blue-300 hover:text-blue-700 transition-colors disabled:opacity-50">
                                                    {allPiecesSelected ? 'Todas selecionadas' : 'Selecionar todas'}
                                                </button>
                                                <button type="button" onClick={handleDeleteSelectedPiecesRequest} disabled={isDeletingPieces || totalSelectedPieces === 0} className="px-4 py-2 rounded-lg bg-red-600 text-white font-semibold hover:bg-red-700 transition-colors disabled:opacity-50">
                                                    {isDeletingPieces ? 'Removendo...' : `Apagar peças (${totalSelectedPieces})`}
                                                </button>
                                            </>
                                        ) : (
                                            <>
                                                <button type="button" onClick={handleToggleSelectionMode} className="px-4 py-2 rounded-lg border border-slate-300 text-slate-600 font-semibold hover:text-slate-800 hover:border-slate-400 transition-colors" disabled={totalPieces === 0}>
                                                    Remover Peças
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => setClientSelectionModalOpen(true)}
                                                    className="px-4 py-2 rounded-lg bg-green-600 text-white font-semibold hover:bg-green-700 transition-colors"
                                                >
                                                    Enviar para Cliente
                                                </button>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>
                            
                            {isLoadingCreativeLines ? ( <p className="text-slate-500">Carregando...</p> ) : (
                                <DndContext
                                    sensors={sensors}
                                    collisionDetection={closestCorners}
                                    onDragStart={handlePieceDragStart}
                                    onDragEnd={handlePieceDragEnd}
                                    onDragCancel={handlePieceDragCancel}
                                >
                                    <div className="space-y-12">
                                        {creativeLines.map(line => (
                                            <section key={line.id}>
                                                <div className="pb-3 border-b-2 border-slate-200 mb-6">
                                                    {editingLineId === line.id ? (
                                                        <form onSubmit={handleLineEditSubmit} className="flex flex-col sm:flex-row sm:items-center gap-3">
                                                            <input type="text" value={lineNameDraft} onChange={(e) => setLineNameDraft(e.target.value)} className="flex-1 p-3 border border-slate-300 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none" placeholder="Nome da pasta" />
                                                            <div className="flex items-center gap-2">
                                                                <button type="button" onClick={cancelLineEdit} disabled={isSavingLine} className="px-4 py-2 rounded-lg border border-slate-300 text-slate-600 font-semibold hover:text-slate-800 hover:border-slate-400 transition-colors disabled:opacity-50">
                                                                    Cancelar
                                                                </button>
                                                                <button type="submit" disabled={isSavingLine} className="px-4 py-2 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50">
                                                                    {isSavingLine ? "Salvando..." : "Salvar"}
                                                                </button>
                                                            </div>
                                                        </form>
                                                    ) : (
                                                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                                                            <h2 className="text-xl font-bold text-slate-700">{line.name}</h2>
                                                            <div className="flex items-center gap-2">
                                                                <button type="button" onClick={() => startLineEdit(line)} className="p-2 rounded-lg border border-slate-200 text-slate-500 hover:text-blue-600 hover:border-blue-200 transition-colors">
                                                                    <Pencil className="w-4 h-4" />
                                                                </button>
                                                                <button type="button" onClick={() => handleDeleteLineRequest(line)} className="p-2 rounded-lg border border-slate-200 text-slate-500 hover:text-red-600 hover:border-red-200 transition-colors">
                                                                    <Trash2 className="w-4 h-4" />
                                                                </button>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                                <SortableContext items={(line.pieces || []).map(piece => piece.id)} strategy={rectSortingStrategy}>
                                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-6">
                                                        {(line.pieces || []).map(piece => (
                                                            <SortablePiece
                                                                key={piece.id}
                                                                piece={piece}
                                                                lineId={line.id}
                                                                onOpenPopup={setSelectedFile}
                                                                draggingPieceId={draggingPieceId}
                                                                isSelectionMode={isSelectionMode}
                                                                onToggleSelect={() => handleToggleSelectPiece(piece.id)}
                                                                isSelected={selectedPieceIds.has(piece.id)}
                                                                onStartRename={startPieceRename}
                                                                isEditing={editingPieceId === piece.id}
                                                                renameValue={pieceNameDraft}
                                                                onRenameChange={setPieceNameDraft}
                                                                onRenameCancel={cancelPieceRename}
                                                                onRenameSubmit={handlePieceRenameSubmit}
                                                                isSavingRename={isSavingPieceName}
                                                            />
                                                        ))}
                                                        {uploadingLineId && uploadingLineId !== line.id ? (
                                                            <div className="relative border-2 border-dashed rounded-xl p-6 text-center bg-slate-100/80">
                                                                <div className="flex flex-col items-center opacity-60">
                                                                    <Loader2 className="h-8 w-8 text-slate-400 mb-2 animate-spin" />
                                                                    <p className="text-sm text-slate-500 font-medium">
                                                                        Aguarde o processamento anterior...
                                                                    </p>
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            <FileUpload
                                                                onFilesAdded={handleFilesAdded}
                                                                lineId={line.id}
                                                                maxFileSizeMb={uploadMaxMb}
                                                                driveButton={
                                                                    <DriveImportButton
                                                                        campaignId={selectedCampaignId}
                                                                        creativeLineId={line.id}
                                                                        googleAccessToken={googleAccessToken}
                                                                        onImported={(pieces) => handleDriveImport(pieces, line.id)}
                                                                        onImportStart={() => setUploadingLineId(line.id)}
                                                                        onImportEnd={() => setUploadingLineId(null)}
                                                                        disabled={Boolean(uploadingLineId)}
                                                                        label="Importar do Drive"
                                                                    />
                                                                }
                                                            />
                                                        )}
                                                    </div>
                                                </SortableContext>
                                            </section>
                                        ))}
                                        {creativeLines.length === 0 && (
                                             <p className="text-slate-500 text-center py-8">Nenhuma linha criativa foi criada para esta campanha ainda.</p>
                                        )}
                                    </div>
                                </DndContext>
                            )}
                        </div>
                    )}
                </main>
            </div>
            
            <ConfirmDialog
                isOpen={isDeletePiecesDialogOpen}
                title="Excluir peças selecionadas"
                description={totalSelectedPieces === 1 ? 'Tem certeza que deseja excluir a peça selecionada?' : `Tem certeza que deseja excluir ${totalSelectedPieces} peças selecionadas?`}
                confirmLabel="Excluir"
                confirmVariant="danger"
                loading={isDeletingPieces}
                onCancel={() => { if (!isDeletingPieces) setDeletePiecesDialogOpen(false); }}
                onConfirm={handleConfirmDeleteSelectedPieces}
            />
            <ConfirmDialog
                isOpen={!!campaignDeleteTarget}
                title="Excluir campanha"
                description={`Tem certeza que deseja excluir a campanha "${campaignDeleteTarget?.name}"? Todas as linhas criativas e arquivos serão removidos.`}
                confirmLabel="Excluir"
                confirmVariant="danger"
                loading={isDeletingCampaign}
                onCancel={() => { if (!isDeletingCampaign) setCampaignDeleteTarget(null); }}
                onConfirm={handleConfirmDeleteCampaign}
            />
            <ConfirmDialog
                isOpen={!!lineDeleteTarget}
                title="Excluir pasta"
                description={`Tem certeza que deseja excluir a pasta "${lineDeleteTarget?.name}"? Os arquivos vinculados serão removidos.`}
                confirmLabel="Excluir"
                confirmVariant="danger"
                loading={isDeletingLine}
                onCancel={() => { if (!isDeletingLine) setLineDeleteTarget(null); }}
                onConfirm={handleConfirmDeleteLine}
            />
            <FilePopup file={selectedFile} onClose={() => setSelectedFile(null)} />
            <HelpModal isOpen={isHelpModalOpen} onClose={() => setHelpModalOpen(false)} />
            <NewCampaignModal
                isOpen={isCampaignModalOpen}
                onClose={() => setCampaignModalOpen(false)}
                onCampaignCreated={handleCampaignCreated}
            />
            <ClientSelectionModal
                isOpen={isClientSelectionModalOpen}
                onClose={() => setClientSelectionModalOpen(false)}
                onConfirm={handleAssignClients}
                campaignName={selectedCampaign?.name || ""}
                masterClientId={selectedCampaign?.MasterClientId}
            />
            <LoadingSpinner isOpen={Boolean(uploadingLineId)} text={loadingText} />
            {isExportingPpt && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-2xl px-8 py-6 flex flex-col items-center gap-3 text-center">
                        <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
                        <h3 className="text-lg font-semibold text-slate-800">Gerando apresentação</h3>
                        <p className="text-sm text-slate-500 max-w-xs">Dependendo do número de arquivos pode levar alguns minutos. Você será notificado automaticamente quando finalizar.</p>
                    </div>
                </div>
            )}
        </div>
    );
};

export default HomePage;
