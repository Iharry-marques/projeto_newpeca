import React, { useState, useCallback, useEffect } from 'react';
// ADICIONEI ÍCONES NOVOS AQUI
import { Upload, Check, Edit3, Download, FileText, Image, Video, File, BarChart3, X, Save, Eye, ChevronDown, PlusCircle, Briefcase } from 'lucide-react';
import aprobiLogo from './assets/aprobi-logo.jpg';
import CampaignSelector from './components/CampaignSelector';
import CampaignPreviewCard from './components/CampaignPreviewCard';


// Tipos de status de validação
const VALIDATION_STATUSES = {
  PENDING: 'pending',
  APPROVED: 'approved',
  NEEDS_ADJUSTMENT: 'needs_adjustment',
  REJECTED: 'rejected'
};

// Cores para cada status com nova paleta
const STATUS_COLORS = {
  [VALIDATION_STATUSES.PENDING]: 'bg-slate-100 text-slate-700 border-slate-300',
  [VALIDATION_STATUSES.APPROVED]: 'bg-emerald-100 text-emerald-700 border-emerald-300',
  [VALIDATION_STATUSES.NEEDS_ADJUSTMENT]: 'bg-amber-100 text-amber-700 border-amber-300',
  [VALIDATION_STATUSES.REJECTED]: 'bg-rose-100 text-rose-700 border-rose-300'
};

// Labels para os status
const STATUS_LABELS = {
  [VALIDATION_STATUSES.PENDING]: 'Pendentes',
  [VALIDATION_STATUSES.APPROVED]: 'Aprovados',
  [VALIDATION_STATUSES.NEEDS_ADJUSTMENT]: 'Precisa Ajustes',
  [VALIDATION_STATUSES.REJECTED]: 'Reprovado'
};

// Componente para upload de arquivos
// ADICIONEI A PROP 'disabled' PARA DESABILITAR O UPLOAD SE NENHUMA CAMPANHA ESTIVER SELECIONADA
const FileUpload = ({ onFilesAdded, disabled }) => {
  const [isDragging, setIsDragging] = useState(false);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    if (disabled) return;
    setIsDragging(false);
    
    const files = Array.from(e.dataTransfer.files);
    onFilesAdded(files);
  }, [onFilesAdded, disabled]);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    if (disabled) return;
    setIsDragging(true);
  }, [disabled]);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleFileInput = useCallback((e) => {
    if (disabled) return;
    const files = Array.from(e.target.files);
    onFilesAdded(files);
  }, [onFilesAdded, disabled]);

  const disabledClasses = disabled ? 'opacity-50 cursor-not-allowed' : 'hover:border-[#ffc801]/60 hover:bg-slate-50';

  return (
    <div className="mb-8">
      <div
        className={`border-2 border-dashed rounded-2xl p-12 text-center transition-all duration-300 ${
          isDragging && !disabled
            ? 'border-[#ffc801] bg-[#ffc801]/5 scale-105' 
            : 'border-slate-300'
        } ${disabledClasses}`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        <div className={`mx-auto w-20 h-20 bg-gradient-to-br from-[#ffc801] to-[#ffb700] rounded-full flex items-center justify-center mb-6 shadow-lg ${disabled ? 'grayscale' : ''}`}>
          <Upload className="h-10 w-10 text-white" />
        </div>
        <h3 className="text-xl font-bold text-slate-800 mb-2">
          {disabled ? 'Selecione uma campanha para começar' : 'Arraste e solte seus arquivos aqui'}
        </h3>
        <p className="text-slate-600 mb-6 max-w-md mx-auto">
          {disabled ? 'Após selecionar uma campanha, você poderá fazer o upload das peças.' : 'Suporte para imagens, vídeos e PDFs. Arraste múltiplos arquivos ou clique para selecionar.'}
        </p>
        <input
          type="file"
          multiple
          onChange={handleFileInput}
          className="hidden"
          id="file-input"
          accept="image/*,video/*,.pdf"
          disabled={disabled}
        />
        <label
          htmlFor="file-input"
          className={`inline-flex items-center px-8 py-4 bg-gradient-to-r from-[#ffc801] to-[#ffb700] text-white font-semibold rounded-xl transition-all duration-200 ${disabled ? 'cursor-not-allowed grayscale' : 'cursor-pointer hover:shadow-lg transform hover:scale-105'}`}
        >
          <Upload className="w-5 h-5 mr-2" />
          Selecionar Arquivos
        </label>
      </div>
    </div>
  );
};

// --- NENHUMA MUDANÇA NOS COMPONENTES ABAIXO ---

// Componente para mostrar ícone do tipo de arquivo
const FileTypeIcon = ({ fileType }) => {
  if (fileType.startsWith('image/')) {
    return <Image className="w-5 h-5 text-blue-500" />;
  } else if (fileType.startsWith('video/')) {
    return <Video className="w-5 h-5 text-purple-500" />;
  } else if (fileType === 'application/pdf') {
    return <FileText className="w-5 h-5 text-red-500" />;
  }
  return <File className="w-5 h-5 text-slate-500" />;
};

// Componente pop-up para validação
const FilePopup = ({ file, validation, onValidationChange, onClose, onSave }) => {
  const [localValidation, setLocalValidation] = useState({
    status: validation?.status || VALIDATION_STATUSES.PENDING,
    comment: validation?.comment || ''
  });

  const handleStatusChange = (status) => {
    setLocalValidation(prev => ({ ...prev, status }));
  };

  const handleCommentChange = (comment) => {
    setLocalValidation(prev => ({ ...prev, comment }));
  };

  const handleSave = () => {
    onSave(file.id, localValidation);
    onClose();
  };

  const renderContent = () => {
    if (file.type.startsWith('image/')) {
      return (
        <img
          src={file.url}
          alt={file.name}
          className="max-w-full max-h-[60vh] object-contain rounded-xl shadow-lg"
        />
      );
    } else if (file.type.startsWith('video/')) {
      return (
        <video
          src={file.url}
          controls
          className="max-w-full max-h-[60vh] object-contain rounded-xl shadow-lg"
        />
      );
    } else if (file.type === 'application/pdf') {
      return (
        <div className="w-96 h-96 bg-gradient-to-br from-red-50 to-red-100 rounded-xl flex items-center justify-center shadow-lg">
          <div className="text-center">
            <FileText className="w-24 h-24 text-red-400 mx-auto mb-4" />
            <span className="text-red-600 font-medium text-lg">Arquivo PDF</span>
            <p className="text-red-500 text-sm mt-2">Clique para baixar e visualizar</p>
          </div>
        </div>
      );
    }
    return (
      <div className="w-96 h-96 bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl flex items-center justify-center shadow-lg">
        <div className="text-center">
          <File className="w-24 h-24 text-slate-400 mx-auto mb-4" />
          <span className="text-slate-600 font-medium text-lg">Arquivo</span>
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl shadow-2xl max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-slate-200">
          <div className="flex items-center space-x-3">
            <FileTypeIcon fileType={file.type} />
            <div>
              <h3 className="text-xl font-bold text-slate-800">{file.name}</h3>
              <p className="text-sm text-slate-600">Validação de peça criativa</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-full transition-colors"
          >
            <X className="w-6 h-6 text-slate-600" />
          </button>
        </div>
        <div className="p-6">
          <div className="flex justify-center mb-8">
            {renderContent()}
          </div>
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-3">
                Status da Validação
              </label>
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => handleStatusChange(VALIDATION_STATUSES.APPROVED)}
                  className={`p-4 rounded-xl text-sm font-semibold transition-all duration-200 flex items-center justify-center space-x-2 ${
                    localValidation.status === VALIDATION_STATUSES.APPROVED
                      ? 'bg-emerald-500 text-white shadow-lg scale-105'
                      : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
                  }`}
                >
                  <Check className="w-5 h-5" />
                  <span>Aprovar</span>
                </button>
                
                <button
                  onClick={() => handleStatusChange(VALIDATION_STATUSES.NEEDS_ADJUSTMENT)}
                  className={`p-4 rounded-xl text-sm font-semibold transition-all duration-200 flex items-center justify-center space-x-2 ${
                    localValidation.status === VALIDATION_STATUSES.NEEDS_ADJUSTMENT
                      ? 'bg-[#ffc801] text-white shadow-lg scale-105'
                      : 'bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200'
                  }`}
                >
                  <Edit3 className="w-5 h-5" />
                  <span>Precisa Ajustes</span>
                </button>
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-3">
                Comentário (opcional)
              </label>
              <textarea
                value={localValidation.comment}
                onChange={(e) => handleCommentChange(e.target.value)}
                placeholder="Digite suas observações sobre a peça..."
                className="w-full p-4 border border-slate-200 rounded-xl text-sm resize-none focus:border-[#ffc801] focus:ring-2 focus:ring-[#ffc801]/20 outline-none transition-all"
                rows="4"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-3">
                Status Atual
              </label>
              <span className={`inline-block px-4 py-2 text-sm font-semibold rounded-full border ${STATUS_COLORS[localValidation.status]}`}>
                {STATUS_LABELS[localValidation.status]}
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center justify-end space-x-4 p-6 border-t border-slate-200 bg-slate-50 rounded-b-3xl">
          <button
            onClick={onClose}
            className="px-6 py-3 text-slate-600 font-semibold hover:text-slate-800 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            className="px-8 py-3 bg-gradient-to-r from-[#ffc801] to-[#ffb700] text-white font-semibold rounded-xl hover:shadow-lg transform hover:scale-105 transition-all duration-200 flex items-center space-x-2"
          >
            <Save className="w-5 h-5" />
            <span>Salvar Validação</span>
          </button>
        </div>
      </div>
    </div>
  );
};

// Componente para visualizar um arquivo (apenas preview)
const FileViewer = ({ file, validation, onOpenPopup }) => {
  const [isHovered, setIsHovered] = useState(false);

  const renderPreview = () => {
    if (file.type.startsWith('image/')) {
      return (
        <div className="relative group">
          <img
            src={file.url}
            alt={file.name}
            className="w-full h-48 object-cover rounded-xl"
          />
          {isHovered && (
            <div className="absolute inset-0 bg-black/40 rounded-xl flex items-center justify-center transition-all duration-200">
              <div className="bg-white/90 backdrop-blur-sm px-4 py-2 rounded-full flex items-center space-x-2">
                <Eye className="w-4 h-4 text-slate-700" />
                <span className="text-sm font-semibold text-slate-700">Visualizar</span>
              </div>
            </div>
          )}
        </div>
      );
    } else if (file.type.startsWith('video/')) {
      return (
        <div className="relative group">
          <video
            src={file.url}
            className="w-full h-48 object-cover rounded-xl"
          />
          {isHovered && (
            <div className="absolute inset-0 bg-black/40 rounded-xl flex items-center justify-center transition-all duration-200">
              <div className="bg-white/90 backdrop-blur-sm px-4 py-2 rounded-full flex items-center space-x-2">
                <Eye className="w-4 h-4 text-slate-700" />
                <span className="text-sm font-semibold text-slate-700">Visualizar</span>
              </div>
            </div>
          )}
        </div>
      );
    } else if (file.type === 'application/pdf') {
      return (
        <div className="relative group">
          <div className="w-full h-48 bg-gradient-to-br from-red-50 to-red-100 rounded-xl flex items-center justify-center">
            <div className="text-center">
              <FileText className="w-16 h-16 text-red-400 mx-auto mb-2" />
              <span className="text-red-600 font-medium">PDF</span>
            </div>
          </div>
          {isHovered && (
            <div className="absolute inset-0 bg-black/40 rounded-xl flex items-center justify-center transition-all duration-200">
              <div className="bg-white/90 backdrop-blur-sm px-4 py-2 rounded-full flex items-center space-x-2">
                <Eye className="w-4 h-4 text-slate-700" />
                <span className="text-sm font-semibold text-slate-700">Visualizar</span>
              </div>
            </div>
          )}
        </div>
      );
    }
    return (
      <div className="relative group">
        <div className="w-full h-48 bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl flex items-center justify-center">
          <div className="text-center">
            <File className="w-16 h-16 text-slate-400 mx-auto mb-2" />
            <span className="text-slate-600 font-medium">Arquivo</span>
          </div>
        </div>
        {isHovered && (
          <div className="absolute inset-0 bg-black/40 rounded-xl flex items-center justify-center transition-all duration-200">
            <div className="bg-white/90 backdrop-blur-sm px-4 py-2 rounded-full flex items-center space-x-2">
              <Eye className="w-4 h-4 text-slate-700" />
              <span className="text-sm font-semibold text-slate-700">Visualizar</span>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div 
      className="bg-white rounded-2xl shadow-xl border border-slate-100 p-6 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 cursor-pointer"
      onClick={() => onOpenPopup(file)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {renderPreview()}
      <div className="mt-4 flex items-center">
        <FileTypeIcon fileType={file.type} />
        <span className="ml-3 text-sm font-semibold text-slate-700 truncate">
          {file.name}
        </span>
      </div>
      <div className="mt-4">
        <span className={`inline-block px-3 py-1 text-xs font-semibold rounded-full border ${STATUS_COLORS[validation.status]}`}>
          {STATUS_LABELS[validation.status]}
        </span>
      </div>
      {validation.comment && (
        <div className="mt-3">
          <p className="text-xs text-slate-600 bg-slate-50 p-2 rounded-lg border border-slate-200 line-clamp-2">
            {validation.comment}
          </p>
        </div>
      )}
    </div>
  );
};

// Componente de filtros de validação
const ValidationFilters = ({ validations, activeFilter, onFilterChange }) => {
  const stats = Object.values(validations).reduce((acc, validation) => {
    acc[validation.status] = (acc[validation.status] || 0) + 1;
    return acc;
  }, {});

  const total = Object.values(validations).length;

  if (total === 0) return null;

  const filters = [
    { id: 'all', title: 'Todas', value: total, color: 'slate', icon: '📋' },
    { id: VALIDATION_STATUSES.PENDING, title: 'Pendentes', value: stats[VALIDATION_STATUSES.PENDING] || 0, color: 'slate', icon: '⏳' },
    { id: VALIDATION_STATUSES.APPROVED, title: 'Aprovados', value: stats[VALIDATION_STATUSES.APPROVED] || 0, color: 'emerald', icon: '✅' },
    { id: VALIDATION_STATUSES.NEEDS_ADJUSTMENT, title: 'Precisam Ajustes', value: stats[VALIDATION_STATUSES.NEEDS_ADJUSTMENT] || 0, color: 'amber', icon: '✏️' }
  ];

  return (
    <div className="mb-8">
      <div className="flex flex-wrap gap-3 mb-6">
        {filters.map((filter) => (
          <button
            key={filter.id}
            onClick={() => onFilterChange(filter.id === 'all' ? null : filter.id)}
            className={`inline-flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 border ${
              activeFilter === (filter.id === 'all' ? null : filter.id)
                ? filter.color === 'slate' ? 'bg-slate-600 text-white border-slate-600 shadow-md'
                : filter.color === 'emerald' ? 'bg-emerald-600 text-white border-emerald-600 shadow-md'
                : 'bg-amber-600 text-white border-amber-600 shadow-md'
                : filter.color === 'slate' ? 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                : filter.color === 'emerald' ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                : 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100'
            }`}
          >
            <span className="mr-2 text-base">{filter.icon}</span>
            <span>{filter.title}</span>
            <span className={`ml-2 px-2 py-0.5 rounded-full text-xs font-bold ${
              activeFilter === (filter.id === 'all' ? null : filter.id)
                ? 'bg-white/20 text-white'
                : filter.color === 'slate' ? 'bg-slate-200 text-slate-700'
                : filter.color === 'emerald' ? 'bg-emerald-200 text-emerald-700'
                : 'bg-amber-200 text-amber-700'
            }`}>
              {filter.value}
            </span>
          </button>
        ))}
      </div>
      {activeFilter && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center text-blue-700">
              <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
              <span className="text-sm font-medium">
                Mostrando apenas peças: {STATUS_LABELS[activeFilter]}
              </span>
            </div>
            <button
              onClick={() => onFilterChange(null)}
              className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center"
            >
              <X className="w-4 h-4 mr-1" />
              Limpar filtro
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// Componente da Logo Aprobi
const AprobiLogo = ({ size = "large" }) => {
  const sizeClass = size === "large" ? "w-32" : "w-24";
  return (
    <img src={aprobiLogo} alt="Aprobi Logo" className={`${sizeClass} h-auto`} />
  );
};

// ====================================================================
// =================== NOVO COMPONENTE: MODAL DE CAMPANHA =============
// ====================================================================

const NewCampaignModal = ({ isOpen, onClose, onCampaignCreated }) => {
  const [name, setName] = useState('');
  const [client, setClient] = useState('');
  const [creativeLine, setCreativeLine] = useState('');
  const [error, setError] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name || !client) {
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
        body: JSON.stringify({ name, client, creativeLine }),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || 'Falha ao criar campanha.');
      }

      const newCampaign = await response.json();
      onCampaignCreated(newCampaign);
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setIsCreating(false);
    }
  };
  
  // Limpar campos ao fechar
  const handleClose = () => {
      setName('');
      setClient('');
      setCreativeLine('');
      setError('');
      onClose();
  }

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
          <div className="p-6 space-y-4">
            {error && <p className="text-red-500 text-sm">{error}</p>}
            <div>
              <label htmlFor="campaignName" className="block text-sm font-semibold text-slate-700 mb-1">Nome da Campanha *</label>
              <input type="text" id="campaignName" value={name} onChange={(e) => setName(e.target.value)} className="w-full p-2 border border-slate-300 rounded-md focus:border-[#ffc801] focus:ring-1 focus:ring-[#ffc801]" required />
            </div>
            <div>
              <label htmlFor="clientName" className="block text-sm font-semibold text-slate-700 mb-1">Cliente *</label>
              <input type="text" id="clientName" value={client} onChange={(e) => setClient(e.target.value)} className="w-full p-2 border border-slate-300 rounded-md focus:border-[#ffc801] focus:ring-1 focus:ring-[#ffc801]" required />
            </div>
            <div>
              <label htmlFor="creativeLine" className="block text-sm font-semibold text-slate-700 mb-1">Linha Criativa (Opcional)</label>
              <input type="text" id="creativeLine" value={creativeLine} onChange={(e) => setCreativeLine(e.target.value)} className="w-full p-2 border border-slate-300 rounded-md focus:border-[#ffc801] focus:ring-1 focus:ring-[#ffc801]" />
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

// =====================================
// PASSO 2A: Adicione o componente CampaignStatusCard após os imports
// =====================================
const CampaignStatusCard = ({ campaign, pieceCount, onSendForApproval }) => {
  if (!campaign) return null;

  const canSendForApproval = campaign.status === 'draft' && pieceCount > 0;
  const isAlreadySent = ['sent_for_approval', 'in_review', 'needs_changes', 'approved'].includes(campaign.status);

  const getStatusInfo = () => {
    switch (campaign.status) {
      case 'draft':
        return {
          label: 'Rascunho',
          color: 'bg-slate-100 text-slate-700 border-slate-300',
          description: 'Campanha ainda não foi enviada para aprovação'
        };
      case 'sent_for_approval':
        return {
          label: 'Enviada para Aprovação',
          color: 'bg-blue-100 text-blue-700 border-blue-300',
          description: 'Aguardando revisão do cliente'
        };
      case 'in_review':
        return {
          label: 'Em Revisão',
          color: 'bg-amber-100 text-amber-700 border-amber-300',
          description: 'Cliente está analisando as peças'
        };
      case 'needs_changes':
        return {
          label: 'Precisa de Ajustes',
          color: 'bg-orange-100 text-orange-700 border-orange-300',
          description: 'Cliente solicitou modificações'
        };
      case 'approved':
        return {
          label: 'Aprovada',
          color: 'bg-emerald-100 text-emerald-700 border-emerald-300',
          description: 'Campanha aprovada pelo cliente'
        };
      default:
        return {
          label: 'Status Desconhecido',
          color: 'bg-slate-100 text-slate-700 border-slate-300',
          description: ''
        };
    }
  };

  const statusInfo = getStatusInfo();

  return (
    <div className="bg-white p-6 rounded-2xl shadow-lg border border-slate-200 mb-8">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-4">
            <h3 className="text-lg font-bold text-slate-800">Status da Campanha</h3>
            <span className={`px-3 py-1 text-sm font-semibold rounded-full border ${statusInfo.color}`}>
              {statusInfo.label}
            </span>
          </div>
          
          <p className="text-slate-600 mb-4">{statusInfo.description}</p>
          
          {isAlreadySent && campaign.sentForApprovalAt && (
            <p className="text-sm text-slate-500 mb-4">
              Enviada em: {new Date(campaign.sentForApprovalAt).toLocaleDateString('pt-BR', {
                day: '2-digit',
                month: 'long',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </p>
          )}

          {isAlreadySent && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
              <h4 className="font-semibold text-blue-800 mb-2">Link de Aprovação</h4>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={`${window.location.origin}/client/approval/${campaign.approvalHash}`}
                  readOnly
                  className="flex-1 px-3 py-2 text-sm bg-white border border-blue-200 rounded-lg"
                />
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(`${window.location.origin}/client/approval/${campaign.approvalHash}`);
                    alert('Link copiado para área de transferência!');
                  }}
                  className="px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Copiar
                </button>
              </div>
              <p className="text-sm text-blue-600 mt-2">
                Envie este link para o cliente realizar a aprovação das peças.
              </p>
            </div>
          )}
        </div>

        {canSendForApproval && (
          <button
            onClick={() => onSendForApproval(campaign.id)}
            className="ml-6 px-6 py-3 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white font-semibold rounded-xl hover:from-emerald-600 hover:to-emerald-700 transition-all transform hover:scale-105 shadow-lg hover:shadow-xl flex items-center space-x-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
            <span>Enviar para Aprovação</span>
          </button>
        )}

        {!canSendForApproval && campaign.status === 'draft' && (
          <div className="ml-6 px-6 py-3 bg-slate-100 text-slate-500 font-semibold rounded-xl flex items-center space-x-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.062 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            <span>Adicione peças primeiro</span>
          </div>
        )}
      </div>
    </div>
  );
};

// Componente principal da aplicação
const App = () => {
  // --- MUDANÇA: ESTADOS NOVOS E ANTIGOS AGRUPADOS ---
  const [campaigns, setCampaigns] = useState([]);
  const [selectedCampaignId, setSelectedCampaignId] = useState('');
  const [isCampaignModalOpen, setCampaignModalOpen] = useState(false);
  const [files, setFiles] = useState([]);
  const [validations, setValidations] = useState({});
  const [selectedFile, setSelectedFile] = useState(null);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [activeFilter, setActiveFilter] = useState(null);

  // MUDANÇA: EFEITO PARA BUSCAR AS CAMPANHAS
  useEffect(() => {
    const fetchCampaigns = async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/campaigns`, { credentials: 'include' });
        if (response.ok) {
          const data = await response.json();
          setCampaigns(data);
        } else {
          console.error("Falha ao buscar campanhas.");
        }
      } catch (error) {
        console.error("Erro de rede ao buscar campanhas:", error);
      }
    };
    fetchCampaigns();
  }, []);
  
  // MUDANÇA: O upload agora depende da campanha selecionada e envia os arquivos para o backend
  const handleFilesAdded = useCallback(async (newFiles) => {
    if (!selectedCampaignId) {
      alert("Por favor, selecione uma campanha antes de fazer o upload.");
      return;
    }
    
    // Simula o upload local para feedback visual imediato (Opcional, mas melhora a UX)
    const processedFiles = newFiles.map(file => ({
      id: Date.now() + Math.random(),
      name: file.name,
      type: file.type,
      size: file.size,
      url: URL.createObjectURL(file),
      file: file
    }));
    setFiles(prev => [...prev, ...processedFiles]);
    const newValidations = {};
    processedFiles.forEach(file => {
      newValidations[file.id] = { status: VALIDATION_STATUSES.PENDING, comment: '' };
    });
    setValidations(prev => ({ ...prev, ...newValidations }));

    // Envio para o backend em segundo plano
    const formData = new FormData();
    newFiles.forEach(file => {
      formData.append('files', file);
    });

    try {
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/campaigns/${selectedCampaignId}/upload`, {
        method: 'POST',
        credentials: 'include',
        body: formData,
      });

      if (!response.ok) throw new Error('Falha no upload para o servidor.');
      
      console.log("Arquivos enviados com sucesso para o backend.");
      // Futuramente, podemos recarregar as peças da campanha aqui
    } catch (error) {
      console.error('Erro no upload para o backend:', error);
      alert('Ocorreu um erro ao enviar os arquivos para o servidor.');
      // Opcional: remover os arquivos da UI se o upload falhar
    }
  }, [selectedCampaignId]);


  // Carrega dados salvos do localStorage ao iniciar
  useEffect(() => {
    // ... (código existente)
  }, []);

  // Fecha o menu de exportação
  useEffect(() => {
    // ... (código existente)
  }, [showExportMenu]);

  // Salva no localStorage sempre que files ou validations mudarem
  useEffect(() => {
    // ... (código existente)
  }, [files]);

  useEffect(() => {
    // ... (código existente)
  }, [validations]);

  const handleOpenPopup = useCallback((file) => { setSelectedFile(file); }, []);
  const handleClosePopup = useCallback(() => { setSelectedFile(null); }, []);
  const handleSaveValidation = useCallback((fileId, validation) => {
    setValidations(prev => ({ ...prev, [fileId]: validation }));
  }, []);
  const handleFilterChange = useCallback((filter) => { setActiveFilter(filter); }, []);
  const filteredFiles = files.filter(file => {
    if (!activeFilter) return true;
    const validation = validations[file.id];
    return validation && validation.status === activeFilter;
  });

  const exportCSV = () => { /* ... (código existente) */ };
  const exportPDF = async () => { /* ... (código existente) */ };
  const clearAll = () => { /* ... (código existente) */ };

  // MUDANÇA: Nova função para lidar com a campanha criada pelo modal
  const handleCampaignCreated = (newCampaign) => {
    setCampaigns(prev => [newCampaign, ...prev]);
    setSelectedCampaignId(newCampaign.id);
  };

  // =====================================
  // PASSO 2B: Adicione a função handleSendForApproval dentro do componente App
  // =====================================
  const handleSendForApproval = async (campaignId) => {
    if (!confirm('Tem certeza que deseja enviar esta campanha para aprovação? Esta ação não pode ser desfeita.')) {
      return;
    }

    try {
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/campaigns/${campaignId}/send-for-approval`, {
        method: 'POST',
        credentials: 'include',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao enviar campanha para aprovação');
      }

      const data = await response.json();
      
      alert(`Campanha enviada para aprovação com sucesso!\n\nLink de aprovação:\n${data.campaign.approvalLink}`);
      window.location.reload();
    } catch (error) {
      alert('Erro ao enviar campanha: ' + error.message);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
<header className="bg-white shadow-xl border-b border-slate-200">
  <div className="max-w-7xl mx-auto px-6 py-8">
    <div className="flex items-center justify-between">
      <div className="flex items-center space-x-6">
        <AprobiLogo size="large" />
        <div className="border-l border-slate-300 pl-6">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
            Sistema de Aprovação
          </h1>
          <p className="text-lg text-slate-600 font-medium">
            Validação de Peças Criativas
          </p>
        </div>
      </div>

      {files.length > 0 && (
        <div className="flex gap-4">
          <div className="relative export-menu-container">
            <button
              onClick={() => setShowExportMenu(!showExportMenu)}
              disabled={isExporting}
              className={`bg-gradient-to-r from-emerald-500 to-emerald-600 text-white px-6 py-3 rounded-xl hover:shadow-lg transition-all duration-200 flex items-center font-semibold transform hover:scale-105 ${isExporting ? 'opacity-75 cursor-not-allowed' : ''}`}
            >
              {isExporting ? (
                <>
                  <div className="w-5 h-5 mr-2 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Exportando...
                </>
              ) : (
                <>
                  <Download className="w-5 h-5 mr-2" />
                  Exportar
                  <ChevronDown className="w-4 h-4 ml-2" />
                </>
              )}
            </button>

            {showExportMenu && !isExporting && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-slate-200 z-50">
                <div className="py-2">
                  <button onClick={() => { exportCSV(); setShowExportMenu(false); }} className="w-full text-left px-4 py-3 text-slate-700 hover:bg-slate-50 flex items-center transition-colors">
                    <FileText className="w-4 h-4 mr-3 text-emerald-600" />
                    <div>
                      <div className="font-semibold">Exportar CSV</div>
                      <div className="text-xs text-slate-500">Planilha para análise</div>
                    </div>
                  </button>
                  <button onClick={() => { exportPDF(); setShowExportMenu(false); }} className="w-full text-left px-4 py-3 text-slate-700 hover:bg-slate-50 flex items-center transition-colors">
                    <File className="w-4 h-4 mr-3 text-red-600" />
                    <div>
                      <div className="font-semibold">Exportar PDF</div>
                      <div className="text-xs text-slate-500">Relatório visual completo</div>
                    </div>
                  </button>
                </div>
              </div>
            )}
          </div>

          <button onClick={clearAll} className="bg-gradient-to-r from-rose-500 to-rose-600 text-white px-6 py-3 rounded-xl hover:shadow-lg transition-all duration-200 font-semibold transform hover:scale-105">
            Limpar Tudo
          </button>
        </div>
      )}
    </div>
  </div>
</header>

      <main className="max-w-7xl mx-auto px-6 py-12">
        {/* ======================================================= */}
        {/* ============ NOVA SEÇÃO DE CAMPANHAS MODERNA ========== */}
        {/* ======================================================= */}
        <div className="bg-white p-8 rounded-2xl shadow-lg mb-8 border border-slate-200">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 mb-6">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-gradient-to-r from-[#ffc801] to-[#ffb700] rounded-xl flex items-center justify-center mr-4 shadow-lg">
                <Briefcase className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-slate-800">Gestão de Campanhas</h2>
                <p className="text-slate-600">Selecione ou crie uma campanha para começar</p>
              </div>
            </div>
            <button
              onClick={() => setCampaignModalOpen(true)}
              className="flex items-center justify-center px-6 py-3 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white font-semibold rounded-xl hover:from-emerald-600 hover:to-emerald-700 transition-all transform hover:scale-105 shadow-lg hover:shadow-xl"
            >
              <PlusCircle className="w-5 h-5 mr-2" />
              Nova Campanha
            </button>
          </div>
          
          <CampaignSelector
            campaigns={campaigns}
            selectedCampaignId={selectedCampaignId}
            onCampaignChange={setSelectedCampaignId}
            onCreateNew={() => setCampaignModalOpen(true)}
            disabled={false}
          />
        </div>

        {/* Preview Card da Campanha Selecionada */}
        {selectedCampaignId && (
          <div className="mb-8">
            <CampaignPreviewCard 
              campaign={campaigns.find(c => c.id === selectedCampaignId)}
              pieceCount={files.length}
            />
          </div>
        )}

        <FileUpload onFilesAdded={handleFilesAdded} disabled={!selectedCampaignId} />
        
        {files.length > 0 && (
          <>
            <ValidationFilters 
              validations={validations} 
              activeFilter={activeFilter}
              onFilterChange={handleFilterChange}
            />
            
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-slate-800 mb-4">
                {activeFilter 
                  ? `Peças ${STATUS_LABELS[activeFilter]} (${filteredFiles.length})`
                  : `Peças para Validação (${filteredFiles.length})`
                }
              </h2>
              <p className="text-slate-600 mb-6">
                Clique em qualquer peça para abrir a visualização completa e realizar a validação.
              </p>
            </div>
            
            {filteredFiles.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                {filteredFiles.map(file => (
                  <FileViewer
                    key={file.id}
                    file={file}
                    validation={validations[file.id] || { status: VALIDATION_STATUSES.PENDING, comment: '' }}
                    onOpenPopup={handleOpenPopup}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FileText className="w-10 h-10 text-slate-400" />
                </div>
                <h3 className="text-lg font-semibold text-slate-600 mb-2">
                  Nenhuma peça encontrada
                </h3>
                <p className="text-slate-500">
                  Não há peças com o status "{STATUS_LABELS[activeFilter]}" no momento.
                </p>
              </div>
            )}
          </>
        )}
      </main>

      {/* Pop-up Modal */}
      {selectedFile && (
        <FilePopup
          file={selectedFile}
          validation={validations[selectedFile.id] || { status: VALIDATION_STATUSES.PENDING, comment: '' }}
          onValidationChange={handleSaveValidation}
          onClose={handleClosePopup}
          onSave={handleSaveValidation}
        />
      )}

      {/* MUDANÇA: RENDERIZAÇÃO DO MODAL DE CAMPANHA */}
      <NewCampaignModal 
        isOpen={isCampaignModalOpen}
        onClose={() => setCampaignModalOpen(false)}
        onCampaignCreated={handleCampaignCreated}
      />
    </div>
  );
};

export default App;