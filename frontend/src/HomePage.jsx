// frontend/src/HomePage.jsx - Atualizado com novo fluxo Suno

import React, { useState, useCallback, useEffect } from 'react';
import { 
  Upload, 
  Download, 
  FileText, 
  Image, 
  Video, 
  File, 
  X, 
  PlusCircle, 
  Briefcase, 
  Send,
  Eye,
  Check,
  Link,
  Users,
  ChevronDown,
  AlertTriangle,
  RefreshCw
} from 'lucide-react';
import aprobiLogo from './assets/aprobi-logo.jpg';
import CampaignSelector from './components/CampaignSelector';

// Estados das peças no fluxo Suno
const PIECE_STATUSES = {
  UPLOADED: 'uploaded',
  ATTACHED: 'attached', 
  PENDING: 'pending',
  APPROVED: 'approved',
  NEEDS_ADJUSTMENT: 'needs_adjustment',
  CRITICAL_POINTS: 'critical_points'
};

const STATUS_COLORS = {
  [PIECE_STATUSES.UPLOADED]: 'bg-slate-100 text-slate-700 border-slate-300',
  [PIECE_STATUSES.ATTACHED]: 'bg-blue-100 text-blue-700 border-blue-300',
  [PIECE_STATUSES.PENDING]: 'bg-amber-100 text-amber-700 border-amber-300',
  [PIECE_STATUSES.APPROVED]: 'bg-emerald-100 text-emerald-700 border-emerald-300',
  [PIECE_STATUSES.NEEDS_ADJUSTMENT]: 'bg-orange-100 text-orange-700 border-orange-300',
  [PIECE_STATUSES.CRITICAL_POINTS]: 'bg-rose-100 text-rose-700 border-rose-300'
};

const STATUS_LABELS = {
  [PIECE_STATUSES.UPLOADED]: 'Enviado',
  [PIECE_STATUSES.ATTACHED]: 'Anexado',
  [PIECE_STATUSES.PENDING]: 'Aguardando',
  [PIECE_STATUSES.APPROVED]: 'Aprovado',
  [PIECE_STATUSES.NEEDS_ADJUSTMENT]: 'Precisa Ajustes',
  [PIECE_STATUSES.CRITICAL_POINTS]: 'Pontos Críticos'
};

// Componente para upload de arquivos
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

// Componente para visualizar um arquivo (sem validação, apenas gerenciamento)
const FileViewer = ({ piece, onToggleSelect, isSelected, onViewFile, showClientFeedback = false }) => {
  const [isHovered, setIsHovered] = useState(false);

  const renderPreview = () => {
    const imageUrl = `${import.meta.env.VITE_BACKEND_URL}/campaigns/files/${piece.filename}`;
    
    if (piece.mimetype && piece.mimetype.startsWith('image/')) {
      return (
        <div className="relative group">
          <img
            src={imageUrl}
            alt={piece.originalName || piece.filename}
            className="w-full h-48 object-cover rounded-xl"
          />
          {isHovered && (
            <div className="absolute inset-0 bg-black/40 rounded-xl flex items-center justify-center transition-all duration-200">
              <button
                onClick={() => onViewFile(piece)}
                className="bg-white/90 backdrop-blur-sm px-4 py-2 rounded-full flex items-center space-x-2 hover:bg-white transition-colors"
              >
                <Eye className="w-4 h-4 text-slate-700" />
                <span className="text-sm font-semibold text-slate-700">Visualizar</span>
              </button>
            </div>
          )}
        </div>
      );
    } else if (piece.mimetype && piece.mimetype.startsWith('video/')) {
      return (
        <div className="relative group">
          <div className="w-full h-48 bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl flex items-center justify-center">
            <div className="text-center">
              <Video className="w-16 h-16 text-purple-400 mx-auto mb-2" />
              <span className="text-purple-600 font-medium">Vídeo</span>
            </div>
          </div>
          {isHovered && (
            <div className="absolute inset-0 bg-black/40 rounded-xl flex items-center justify-center transition-all duration-200">
              <button
                onClick={() => onViewFile(piece)}
                className="bg-white/90 backdrop-blur-sm px-4 py-2 rounded-full flex items-center space-x-2 hover:bg-white transition-colors"
              >
                <Eye className="w-4 h-4 text-slate-700" />
                <span className="text-sm font-semibold text-slate-700">Visualizar</span>
              </button>
            </div>
          )}
        </div>
      );
    }
    
    return (
      <div className="relative group">
        <div className="w-full h-48 bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl flex items-center justify-center">
          <div className="text-center">
            <FileTypeIcon fileType={piece.mimetype} />
            <span className="text-slate-600 font-medium mt-2 block">Arquivo</span>
          </div>
        </div>
        {isHovered && (
          <div className="absolute inset-0 bg-black/40 rounded-xl flex items-center justify-center transition-all duration-200">
            <button
              onClick={() => onViewFile(piece)}
              className="bg-white/90 backdrop-blur-sm px-4 py-2 rounded-full flex items-center space-x-2 hover:bg-white transition-colors"
            >
              <Eye className="w-4 h-4 text-slate-700" />
              <span className="text-sm font-semibold text-slate-700">Visualizar</span>
            </button>
          </div>
        )}
      </div>
    );
  };

  return (
    <div 
      className={`bg-white rounded-2xl shadow-xl border-2 p-6 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 cursor-pointer ${
        isSelected ? 'border-[#ffc801] ring-2 ring-[#ffc801]/20' : 'border-slate-100'
      }`}
      onClick={() => onToggleSelect && onToggleSelect(piece.id)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Checkbox de seleção para peças uploadadas */}
      {piece.status === PIECE_STATUSES.UPLOADED && onToggleSelect && (
        <div className="flex justify-end mb-2">
          <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
            isSelected ? 'bg-[#ffc801] border-[#ffc801]' : 'border-slate-300 hover:border-[#ffc801]'
          }`}>
            {isSelected && <Check className="w-4 h-4 text-white" />}
          </div>
        </div>
      )}

      {renderPreview()}
      
      <div className="mt-4 flex items-center justify-between">
        <div className="flex items-center flex-1 min-w-0">
          <FileTypeIcon fileType={piece.mimetype} />
          <span className="ml-3 text-sm font-semibold text-slate-700 truncate">
            {piece.originalName || piece.filename}
          </span>
        </div>
        <span className={`ml-2 inline-block px-3 py-1 text-xs font-semibold rounded-full border flex-shrink-0 ${STATUS_COLORS[piece.status]}`}>
          {STATUS_LABELS[piece.status]}
        </span>
      </div>

      {/* Mostrar comentário do cliente se houver */}
      {showClientFeedback && piece.comment && (
        <div className="mt-3 p-3 bg-slate-50 rounded-lg border border-slate-200">
          <div className="text-xs font-semibold text-slate-500 mb-1">Comentário do Cliente:</div>
          <p className="text-sm text-slate-700">{piece.comment}</p>
          {piece.reviewedAt && (
            <div className="text-xs text-slate-500 mt-1">
              Revisado em {new Date(piece.reviewedAt).toLocaleDateString('pt-BR')}
            </div>
          )}
        </div>
      )}

      {/* Botão de download */}
      <div className="mt-3 flex justify-center">
        <button
          onClick={(e) => {
            e.stopPropagation();
            window.open(`${import.meta.env.VITE_BACKEND_URL}/campaigns/files/${piece.filename}`, '_blank');
          }}
          className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
          title="Baixar arquivo"
        >
          <Download className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

// Modal para visualizar arquivo
const FileModal = ({ piece, onClose }) => {
  if (!piece) return null;

  const imageUrl = `${import.meta.env.VITE_BACKEND_URL}/campaigns/files/${piece.filename}`;

  const renderContent = () => {
    if (piece.mimetype && piece.mimetype.startsWith('image/')) {
      return (
        <img
          src={imageUrl}
          alt={piece.originalName || piece.filename}
          className="max-w-full max-h-[70vh] object-contain rounded-xl"
        />
      );
    } else if (piece.mimetype && piece.mimetype.startsWith('video/')) {
      return (
        <video
          src={imageUrl}
          controls
          className="max-w-full max-h-[70vh] object-contain rounded-xl"
        />
      );
    }
    return (
      <div className="w-96 h-96 bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl flex items-center justify-center">
        <div className="text-center">
          <FileTypeIcon fileType={piece.mimetype} />
          <p className="mt-4 text-slate-600">Clique no botão de download para visualizar</p>
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-slate-200">
          <div className="flex items-center space-x-3">
            <FileTypeIcon fileType={piece.mimetype} />
            <h3 className="text-xl font-bold text-slate-800">{piece.originalName || piece.filename}</h3>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-full transition-colors"
          >
            <X className="w-6 h-6 text-slate-600" />
          </button>
        </div>
        <div className="p-6 flex justify-center">
          {renderContent()}
        </div>
        <div className="flex justify-center p-6 border-t border-slate-200">
          <button
            onClick={() => window.open(imageUrl, '_blank')}
            className="px-6 py-3 bg-gradient-to-r from-[#ffc801] to-[#ffb700] text-white font-semibold rounded-xl hover:shadow-lg transition-all flex items-center space-x-2"
          >
            <Download className="w-5 h-5" />
            <span>Baixar Arquivo</span>
          </button>
        </div>
      </div>
    </div>
  );
};

// Modal para criar nova campanha
const NewCampaignModal = ({ isOpen, onClose, onCampaignCreated }) => {
  const [name, setName] = useState('');
  const [client, setClient] = useState('');
  const [creativeLine, setCreativeLine] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [notes, setNotes] = useState('');
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
        body: JSON.stringify({ 
          name, 
          client, 
          creativeLine: creativeLine || null,
          startDate: startDate || null,
          endDate: endDate || null,
          notes: notes || null
        }),
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
    setClient('');
    setCreativeLine('');
    setStartDate('');
    setEndDate('');
    setNotes('');
    setError('');
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-slate-200 flex justify-between items-center">
          <h3 className="text-xl font-bold text-slate-800">Criar Nova Campanha</h3>
          <button onClick={handleClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
            <X className="w-5 h-5 text-slate-600" />
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="p-6 space-y-4">
            {error && <p className="text-red-500 text-sm bg-red-50 border border-red-200 rounded-lg p-3">{error}</p>}
            
            <div>
              <label htmlFor="campaignName" className="block text-sm font-semibold text-slate-700 mb-2">
                Nome da Campanha *
              </label>
              <input 
                type="text" 
                id="campaignName" 
                value={name} 
                onChange={(e) => setName(e.target.value)} 
                className="w-full p-3 border border-slate-300 rounded-xl focus:border-[#ffc801] focus:ring-2 focus:ring-[#ffc801]/20 outline-none transition-all" 
                required 
                placeholder="Ex: Campanha Verão 2024"
              />
            </div>
            
            <div>
              <label htmlFor="clientName" className="block text-sm font-semibold text-slate-700 mb-2">
                Cliente *
              </label>
              <input 
                type="text" 
                id="clientName" 
                value={client} 
                onChange={(e) => setClient(e.target.value)} 
                className="w-full p-3 border border-slate-300 rounded-xl focus:border-[#ffc801] focus:ring-2 focus:ring-[#ffc801]/20 outline-none transition-all" 
                required 
                placeholder="Nome do cliente"
              />
            </div>
            
            <div>
              <label htmlFor="creativeLine" className="block text-sm font-semibold text-slate-700 mb-2">
                Linha Criativa
              </label>
              <input 
                type="text" 
                id="creativeLine" 
                value={creativeLine} 
                onChange={(e) => setCreativeLine(e.target.value)} 
                className="w-full p-3 border border-slate-300 rounded-xl focus:border-[#ffc801] focus:ring-2 focus:ring-[#ffc801]/20 outline-none transition-all"
                placeholder="Ex: Verão, Diversão, Liberdade"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="startDate" className="block text-sm font-semibold text-slate-700 mb-2">
                  Data de Início
                </label>
                <input 
                  type="date" 
                  id="startDate" 
                  value={startDate} 
                  onChange={(e) => setStartDate(e.target.value)} 
                  className="w-full p-3 border border-slate-300 rounded-xl focus:border-[#ffc801] focus:ring-2 focus:ring-[#ffc801]/20 outline-none transition-all"
                />
              </div>
              
              <div>
                <label htmlFor="endDate" className="block text-sm font-semibold text-slate-700 mb-2">
                  Data de Término
                </label>
                <input 
                  type="date" 
                  id="endDate" 
                  value={endDate} 
                  onChange={(e) => setEndDate(e.target.value)} 
                  className="w-full p-3 border border-slate-300 rounded-xl focus:border-[#ffc801] focus:ring-2 focus:ring-[#ffc801]/20 outline-none transition-all"
                />
              </div>
            </div>

            <div>
              <label htmlFor="notes" className="block text-sm font-semibold text-slate-700 mb-2">
                Observações
              </label>
              <textarea 
                id="notes" 
                value={notes} 
                onChange={(e) => setNotes(e.target.value)} 
                className="w-full p-3 border border-slate-300 rounded-xl focus:border-[#ffc801] focus:ring-2 focus:ring-[#ffc801]/20 outline-none transition-all resize-none"
                rows="3"
                placeholder="Observações sobre a campanha..."
              />
            </div>
          </div>
          
          <div className="flex items-center justify-end space-x-4 p-6 bg-slate-50 rounded-b-2xl border-t border-slate-200">
            <button 
              type="button" 
              onClick={handleClose} 
              className="px-6 py-3 text-slate-600 font-semibold hover:text-slate-800 transition-colors"
            >
              Cancelar
            </button>
            <button 
              type="submit" 
              disabled={isCreating} 
              className="px-8 py-3 bg-gradient-to-r from-[#ffc801] to-[#ffb700] text-white font-semibold rounded-xl hover:shadow-lg transform hover:scale-105 transition-all disabled:opacity-50 disabled:transform-none disabled:grayscale"
            >
              {isCreating ? 'Criando...' : 'Criar Campanha'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Componente principal da aplicação
const HomePage = () => {
  const [campaigns, setCampaigns] = useState([]);
  const [selectedCampaignId, setSelectedCampaignId] = useState('');
  const [selectedCampaign, setSelectedCampaign] = useState(null);
  const [isCampaignModalOpen, setCampaignModalOpen] = useState(false);
  const [pieces, setPieces] = useState([]);
  const [selectedPieces, setSelectedPieces] = useState(new Set());
  const [selectedFile, setSelectedFile] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  // Buscar campanhas
  useEffect(() => {
    const fetchCampaigns = async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/campaigns`, { 
          credentials: 'include' 
        });
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

  // Buscar detalhes da campanha selecionada
  useEffect(() => {
    if (selectedCampaignId) {
      const fetchCampaignDetails = async () => {
        try {
          const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/campaigns/${selectedCampaignId}`, { 
            credentials: 'include' 
          });
          if (response.ok) {
            const campaign = await response.json();
            setSelectedCampaign(campaign);
            setPieces(campaign.Pieces || []);
          }
        } catch (error) {
          console.error("Erro ao buscar detalhes da campanha:", error);
        }
      };
      fetchCampaignDetails();
    } else {
      setSelectedCampaign(null);
      setPieces([]);
    }
  }, [selectedCampaignId]);

  // Upload de arquivos
  const handleFilesAdded = useCallback(async (newFiles) => {
    if (!selectedCampaignId) {
      alert("Por favor, selecione uma campanha antes de fazer o upload.");
      return;
    }
    
    setIsLoading(true);
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

      if (!response.ok) {
        throw new Error('Falha no upload para o servidor.');
      }
      
      const result = await response.json();
      
      // Atualizar lista de peças
      setPieces(prev => [...prev, ...result.pieces]);
      alert(`${result.pieces.length} arquivo(s) enviado(s) com sucesso!`);
    } catch (error) {
      console.error('Erro no upload:', error);
      alert('Ocorreu um erro ao enviar os arquivos para o servidor.');
    } finally {
      setIsLoading(false);
    }
  }, [selectedCampaignId]);

  // Anexar peças selecionadas à campanha
  const handleAttachPieces = async () => {
    if (selectedPieces.size === 0) {
      alert("Selecione pelo menos uma peça para anexar.");
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/campaigns/${selectedCampaignId}/attach-pieces`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ pieceIds: Array.from(selectedPieces) }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Falha ao anexar peças.');
      }
      
      const result = await response.json();
      
      // Atualizar status das peças anexadas
      setPieces(prev => prev.map(piece => 
        selectedPieces.has(piece.id) 
          ? { ...piece, status: PIECE_STATUSES.ATTACHED, attachedAt: new Date().toISOString() }
          : piece
      ));
      
      setSelectedPieces(new Set());
      alert(result.message);
    } catch (error) {
      console.error('Erro ao anexar peças:', error);
      alert('Erro ao anexar peças: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Desanexar peças
  const handleDetachPieces = async () => {
    if (selectedPieces.size === 0) {
      alert("Selecione pelo menos uma peça para desanexar.");
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/campaigns/${selectedCampaignId}/detach-pieces`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.JSON.stringify({ pieceIds: Array.from(selectedPieces) }),
      });

      const result = await response.json();
      
      // Atualizar status das peças
      setPieces(prev => prev.map(piece => 
        selectedPieces.has(piece.id) 
          ? { ...piece, status: PIECE_STATUSES.UPLOADED, attachedAt: null }
          : piece
      ));
      
      setSelectedPieces(new Set());
      alert(result.message);
    } catch (error) {
      alert('Erro ao desanexar peças: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Enviar para aprovação
  const handleSendForApproval = async () => {
    if (!selectedCampaign) return;

    const attachedPieces = pieces.filter(piece => piece.status === PIECE_STATUSES.ATTACHED);
    if (attachedPieces.length === 0) {
      alert("Anexe pelo menos uma peça à campanha antes de enviar para aprovação.");
      return;
    }

    if (!confirm(`Enviar campanha "${selectedCampaign.name}" para aprovação?\n\n${attachedPieces.length} peça(s) será(ão) enviada(s).`)) {
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/campaigns/${selectedCampaignId}/send-for-approval`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao enviar campanha');
      }

      const result = await response.json();
      
      // Atualizar campanha e peças
      setSelectedCampaign(prev => ({ ...prev, status: 'sent_for_approval' }));
      setPieces(prev => prev.map(piece => 
        piece.status === PIECE_STATUSES.ATTACHED 
          ? { ...piece, status: PIECE_STATUSES.PENDING }
          : piece
      ));
      
      alert(`Campanha enviada com sucesso!\n\nLink de aprovação:\n${result.campaign.approvalLink}`);
    } catch (error) {
      alert('Erro ao enviar campanha: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Gerenciar seleção de peças
  const handleToggleSelect = (pieceId) => {
    setSelectedPieces(prev => {
      const newSet = new Set(prev);
      if (newSet.has(pieceId)) {
        newSet.delete(pieceId);
      } else {
        newSet.add(pieceId);
      }
      return newSet;
    });
  };

  const handleCampaignCreated = (newCampaign) => {
    setCampaigns(prev => [newCampaign, ...prev]);
    setSelectedCampaignId(newCampaign.id);
  };

  // Filtrar peças por status
  const uploadedPieces = pieces.filter(piece => piece.status === PIECE_STATUSES.UPLOADED);
  const attachedPieces = pieces.filter(piece => piece.status === PIECE_STATUSES.ATTACHED);
  const reviewPieces = pieces.filter(piece => 
    [PIECE_STATUSES.PENDING, PIECE_STATUSES.APPROVED, PIECE_STATUSES.NEEDS_ADJUSTMENT, PIECE_STATUSES.CRITICAL_POINTS].includes(piece.status)
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <header className="bg-white shadow-xl border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-6">
              <img src={aprobiLogo} alt="Aprobi Logo" className="w-32 h-auto" />
              <div className="border-l border-slate-300 pl-6">
                <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
                  Sistema de Aprovação
                </h1>
                <p className="text-lg text-slate-600 font-medium">
                  Gestão de Peças Criativas - Painel Suno
                </p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-12">
        {/* Gestão de Campanhas */}
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
            disabled={isLoading}
          />
        </div>

        {/* Status da Campanha */}
        {selectedCampaign && (
          <div className="bg-white p-6 rounded-2xl shadow-lg border border-slate-200 mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-slate-800 mb-2">Status: {selectedCampaign.name}</h3>
                <div className="flex items-center space-x-4">
                  <span className={`px-3 py-1 text-sm font-semibold rounded-full ${
                    selectedCampaign.status === 'draft' ? 'bg-slate-100 text-slate-700' :
                    selectedCampaign.status === 'sent_for_approval' ? 'bg-blue-100 text-blue-700' :
                    selectedCampaign.status === 'in_review' ? 'bg-amber-100 text-amber-700' :
                    selectedCampaign.status === 'approved' ? 'bg-emerald-100 text-emerald-700' :
                    'bg-orange-100 text-orange-700'
                  }`}>
                    {selectedCampaign.status === 'draft' ? 'Rascunho' :
                     selectedCampaign.status === 'sent_for_approval' ? 'Enviada para Aprovação' :
                     selectedCampaign.status === 'in_review' ? 'Em Revisão' :
                     selectedCampaign.status === 'approved' ? 'Aprovada' : 'Precisa Ajustes'}
                  </span>
                  <span className="text-slate-600">
                    {uploadedPieces.length} enviadas • {attachedPieces.length} anexadas • {reviewPieces.length} em revisão
                  </span>
                </div>
              </div>

              {/* Botão de enviar para aprovação */}
              {selectedCampaign.status === 'draft' && attachedPieces.length > 0 && (
                <button
                  onClick={handleSendForApproval}
                  disabled={isLoading}
                  className="flex items-center px-6 py-3 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white font-semibold rounded-xl hover:shadow-lg transition-all transform hover:scale-105 disabled:opacity-50"
                >
                  <Send className="w-5 h-5 mr-2" />
                  Enviar para Aprovação
                </button>
              )}

              {/* Link de aprovação para campanhas enviadas */}
              {['sent_for_approval', 'in_review', 'needs_changes'].includes(selectedCampaign.status) && (
                <div className="text-right">
                  <div className="text-sm text-slate-600 mb-2">Link de Aprovação:</div>
                  <button
                    onClick={() => {
                      const link = `${window.location.origin}/client/approval/${selectedCampaign.approvalHash}`;
                      navigator.clipboard.writeText(link);
                      alert('Link copiado!');
                    }}
                    className="flex items-center px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
                  >
                    <Link className="w-4 h-4 mr-2" />
                    Copiar Link
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Upload */}
        <FileUpload onFilesAdded={handleFilesAdded} disabled={!selectedCampaignId || isLoading} />
        
        {/* Peças Enviadas (uploaded) */}
        {uploadedPieces.length > 0 && (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-slate-800">Peças Enviadas ({uploadedPieces.length})</h2>
                <p className="text-slate-600">Selecione as peças que deseja anexar à campanha</p>
              </div>
              
              <div className="flex space-x-4">
                <button
                  onClick={() => {
                    const allIds = new Set(uploadedPieces.map(p => p.id));
                    setSelectedPieces(prev => 
                      prev.size === allIds.size ? new Set() : allIds
                    );
                  }}
                  className="px-4 py-2 text-slate-600 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
                >
                  {selectedPieces.size === uploadedPieces.length ? 'Desmarcar Todas' : 'Selecionar Todas'}
                </button>
                
                {selectedPieces.size > 0 && (
                  <button
                    onClick={handleAttachPieces}
                    disabled={isLoading}
                    className="flex items-center px-6 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white font-semibold rounded-lg hover:shadow-lg transition-all disabled:opacity-50"
                  >
                    <Check className="w-4 h-4 mr-2" />
                    Anexar {selectedPieces.size} Peça{selectedPieces.size > 1 ? 's' : ''}
                  </button>
                )}
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {uploadedPieces.map(piece => (
                <FileViewer
                  key={piece.id}
                  piece={piece}
                  onToggleSelect={handleToggleSelect}
                  isSelected={selectedPieces.has(piece.id)}
                  onViewFile={setSelectedFile}
                />
              ))}
            </div>
          </div>
        )}

        {/* Peças Anexadas */}
        {attachedPieces.length > 0 && (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-slate-800">Peças Anexadas à Campanha ({attachedPieces.length})</h2>
                <p className="text-slate-600">Essas peças serão enviadas para aprovação do cliente</p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {attachedPieces.map(piece => (
                <FileViewer
                  key={piece.id}
                  piece={piece}
                  onViewFile={setSelectedFile}
                />
              ))}
            </div>
          </div>
        )}

        {/* Peças em Revisão/Aprovadas */}
        {reviewPieces.length > 0 && (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-slate-800">Feedback do Cliente ({reviewPieces.length})</h2>
                <p className="text-slate-600">Peças que foram enviadas para aprovação</p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {reviewPieces.map(piece => (
                <FileViewer
                  key={piece.id}
                  piece={piece}
                  onViewFile={setSelectedFile}
                  showClientFeedback={true}
                />
              ))}
            </div>
          </div>
        )}

        {/* Estado vazio */}
        {!selectedCampaignId && (
          <div className="text-center py-12">
            <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Briefcase className="w-10 h-10 text-slate-400" />
            </div>
            <h3 className="text-xl font-semibold text-slate-600 mb-2">
              Nenhuma campanha selecionada
            </h3>
            <p className="text-slate-500">
              Selecione uma campanha existente ou crie uma nova para começar.
            </p>
          </div>
        )}
      </main>

      {/* Modal de visualização */}
      {selectedFile && (
        <FileModal
          piece={selectedFile}
          onClose={() => setSelectedFile(null)}
        />
      )}

      {/* Modal de nova campanha */}
      <NewCampaignModal 
        isOpen={isCampaignModalOpen}
        onClose={() => setCampaignModalOpen(false)}
        onCampaignCreated={handleCampaignCreated}
      />
    </div>
  );
};

export default HomePage;