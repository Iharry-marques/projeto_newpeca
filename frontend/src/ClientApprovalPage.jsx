// frontend/src/ClientApprovalPage.jsx - Atualizado com 3 estados

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Check, 
  Edit3, 
  AlertTriangle,
  Download, 
  Eye, 
  X, 
  FileText, 
  Image, 
  Video, 
  File,
  Calendar,
  User,
  Sparkles,
  Send
} from 'lucide-react';
import aprobiLogo from './assets/aprobi-logo.jpg';

// Estados de validação atualizados
const VALIDATION_STATUSES = {
  PENDING: 'pending',
  APPROVED: 'approved',
  NEEDS_ADJUSTMENT: 'needs_adjustment',
  CRITICAL_POINTS: 'critical_points'
};

const STATUS_COLORS = {
  [VALIDATION_STATUSES.PENDING]: 'bg-slate-100 text-slate-700 border-slate-300',
  [VALIDATION_STATUSES.APPROVED]: 'bg-emerald-100 text-emerald-700 border-emerald-300',
  [VALIDATION_STATUSES.NEEDS_ADJUSTMENT]: 'bg-amber-100 text-amber-700 border-amber-300',
  [VALIDATION_STATUSES.CRITICAL_POINTS]: 'bg-rose-100 text-rose-700 border-rose-300'
};

const STATUS_LABELS = {
  [VALIDATION_STATUSES.PENDING]: 'Pendente',
  [VALIDATION_STATUSES.APPROVED]: 'Aprovado',
  [VALIDATION_STATUSES.NEEDS_ADJUSTMENT]: 'Precisa Ajustes',
  [VALIDATION_STATUSES.CRITICAL_POINTS]: 'Pontos Críticos'
};

const STATUS_DESCRIPTIONS = {
  [VALIDATION_STATUSES.APPROVED]: 'Peça aprovada sem alterações',
  [VALIDATION_STATUSES.NEEDS_ADJUSTMENT]: 'Precisa de pequenos ajustes',
  [VALIDATION_STATUSES.CRITICAL_POINTS]: 'Requer atenção especial ou mudanças importantes'
};

// Componente para ícone do tipo de arquivo
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

// Componente para visualização de arquivo
const FileViewer = ({ piece, validation, onValidationChange, onOpenModal }) => {
  const renderPreview = () => {
    const imageUrl = `${import.meta.env.VITE_BACKEND_URL}${piece.downloadUrl}`;
    
    if (piece.mimetype.startsWith('image/')) {
      return (
        <img
          src={imageUrl}
          alt={piece.originalName || piece.filename}
          className="w-full h-48 object-cover rounded-xl cursor-pointer hover:opacity-90 transition-opacity"
          onClick={() => onOpenModal(piece)}
        />
      );
    } else if (piece.mimetype.startsWith('video/')) {
      return (
        <div 
          className="w-full h-48 bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl flex items-center justify-center cursor-pointer hover:opacity-90 transition-opacity"
          onClick={() => onOpenModal(piece)}
        >
          <div className="text-center">
            <Video className="w-16 h-16 text-purple-400 mx-auto mb-2" />
            <span className="text-purple-600 font-medium">Vídeo</span>
          </div>
        </div>
      );
    } else if (piece.mimetype === 'application/pdf') {
      return (
        <div 
          className="w-full h-48 bg-gradient-to-br from-red-50 to-red-100 rounded-xl flex items-center justify-center cursor-pointer hover:opacity-90 transition-opacity"
          onClick={() => onOpenModal(piece)}
        >
          <div className="text-center">
            <FileText className="w-16 h-16 text-red-400 mx-auto mb-2" />
            <span className="text-red-600 font-medium">PDF</span>
          </div>
        </div>
      );
    }
    return (
      <div 
        className="w-full h-48 bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl flex items-center justify-center cursor-pointer hover:opacity-90 transition-opacity"
        onClick={() => onOpenModal(piece)}
      >
        <div className="text-center">
          <File className="w-16 h-16 text-slate-400 mx-auto mb-2" />
          <span className="text-slate-600 font-medium">Arquivo</span>
        </div>
      </div>
    );
  };

  const handleStatusChange = (status) => {
    onValidationChange(piece.id, { ...validation, status });
  };

  const handleCommentChange = (comment) => {
    onValidationChange(piece.id, { ...validation, comment });
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6">
      {/* Preview */}
      <div className="mb-4">
        {renderPreview()}
      </div>

      {/* Nome do arquivo */}
      <div className="mb-4 flex items-center">
        <FileTypeIcon fileType={piece.mimetype} />
        <span className="ml-2 text-sm font-semibold text-slate-700 truncate">
          {piece.originalName || piece.filename}
        </span>
      </div>

      {/* Botões de Aprovação - 3 estados */}
      <div className="mb-4 grid grid-cols-3 gap-2">
        <button
          onClick={() => handleStatusChange(VALIDATION_STATUSES.APPROVED)}
          className={`p-3 rounded-xl text-sm font-semibold transition-all duration-200 flex flex-col items-center justify-center space-y-1 ${
            validation.status === VALIDATION_STATUSES.APPROVED
              ? 'bg-emerald-500 text-white shadow-lg scale-105'
              : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
          }`}
          title={STATUS_DESCRIPTIONS[VALIDATION_STATUSES.APPROVED]}
        >
          <Check className="w-4 h-4" />
          <span className="text-xs">Aprovado</span>
        </button>
        
        <button
          onClick={() => handleStatusChange(VALIDATION_STATUSES.NEEDS_ADJUSTMENT)}
          className={`p-3 rounded-xl text-sm font-semibold transition-all duration-200 flex flex-col items-center justify-center space-y-1 ${
            validation.status === VALIDATION_STATUSES.NEEDS_ADJUSTMENT
              ? 'bg-[#ffc801] text-white shadow-lg scale-105'
              : 'bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200'
          }`}
          title={STATUS_DESCRIPTIONS[VALIDATION_STATUSES.NEEDS_ADJUSTMENT]}
        >
          <Edit3 className="w-4 h-4" />
          <span className="text-xs">Ajustes</span>
        </button>

        <button
          onClick={() => handleStatusChange(VALIDATION_STATUSES.CRITICAL_POINTS)}
          className={`p-3 rounded-xl text-sm font-semibold transition-all duration-200 flex flex-col items-center justify-center space-y-1 ${
            validation.status === VALIDATION_STATUSES.CRITICAL_POINTS
              ? 'bg-rose-500 text-white shadow-lg scale-105'
              : 'bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200'
          }`}
          title={STATUS_DESCRIPTIONS[VALIDATION_STATUSES.CRITICAL_POINTS]}
        >
          <AlertTriangle className="w-4 h-4" />
          <span className="text-xs">Crítico</span>
        </button>
      </div>

      {/* Campo de Comentário - obrigatório para status diferentes de aprovado */}
      <div className="mb-4">
        <textarea
          value={validation.comment || ''}
          onChange={(e) => handleCommentChange(e.target.value)}
          placeholder={
            validation.status === VALIDATION_STATUSES.APPROVED 
              ? "Comentários (opcional)..."
              : validation.status === VALIDATION_STATUSES.CRITICAL_POINTS
                ? "Descreva os pontos críticos (obrigatório)..."
                : "Descreva os ajustes necessários (obrigatório)..."
          }
          className={`w-full p-3 border rounded-xl text-sm resize-none outline-none transition-all ${
            (validation.status !== VALIDATION_STATUSES.APPROVED && validation.status !== VALIDATION_STATUSES.PENDING && (!validation.comment || validation.comment.trim() === ''))
              ? 'border-red-300 bg-red-50 focus:border-red-500 focus:ring-2 focus:ring-red-500/20'
              : 'border-slate-200 focus:border-[#ffc801] focus:ring-2 focus:ring-[#ffc801]/20'
          }`}
          rows="3"
          required={validation.status !== VALIDATION_STATUSES.APPROVED && validation.status !== VALIDATION_STATUSES.PENDING}
        />
        {validation.status !== VALIDATION_STATUSES.APPROVED && validation.status !== VALIDATION_STATUSES.PENDING && (!validation.comment || validation.comment.trim() === '') && (
          <p className="text-red-500 text-xs mt-1">Comentário é obrigatório para este status</p>
        )}
      </div>

      {/* Status Atual */}
      <div className="flex items-center justify-between">
        <span className={`inline-block px-3 py-1 text-xs font-semibold rounded-full border ${STATUS_COLORS[validation.status]}`}>
          {STATUS_LABELS[validation.status]}
        </span>
        
        <button
          onClick={() => window.open(`${import.meta.env.VITE_BACKEND_URL}${piece.downloadUrl}`, '_blank')}
          className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
          title="Baixar arquivo"
        >
          <Download className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

// Modal para visualização ampliada (sem mudanças)
const FileModal = ({ piece, onClose }) => {
  if (!piece) return null;

  const imageUrl = `${import.meta.env.VITE_BACKEND_URL}${piece.downloadUrl}`;

  const renderContent = () => {
    if (piece.mimetype.startsWith('image/')) {
      return (
        <img
          src={imageUrl}
          alt={piece.originalName || piece.filename}
          className="max-w-full max-h-[70vh] object-contain rounded-xl"
        />
      );
    } else if (piece.mimetype.startsWith('video/')) {
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

const ClientApprovalPage = () => {
  const { hash } = useParams();
  const navigate = useNavigate();
  
  const [campaign, setCampaign] = useState(null);
  const [validations, setValidations] = useState({});
  const [selectedFile, setSelectedFile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Carregar dados da campanha
  useEffect(() => {
    const fetchCampaign = async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/approval/campaigns/review/${hash}`);
        
        if (!response.ok) {
          throw new Error('Campanha não encontrada ou não disponível');
        }

        const data = await response.json();
        setCampaign(data.campaign);

        // Inicializar validações com dados existentes
        const initialValidations = {};
        data.campaign.pieces.forEach(piece => {
          initialValidations[piece.id] = {
            status: piece.status || VALIDATION_STATUSES.PENDING,
            comment: piece.comment || ''
          };
        });
        setValidations(initialValidations);
      } catch (err) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCampaign();
  }, [hash]);

  const handleValidationChange = (pieceId, validation) => {
    setValidations(prev => ({
      ...prev,
      [pieceId]: validation
    }));
  };

  const validateSubmission = () => {
    for (const [pieceId, validation] of Object.entries(validations)) {
      // Se não foi avaliado, não pode enviar
      if (validation.status === VALIDATION_STATUSES.PENDING) {
        return { valid: false, message: 'Todas as peças devem ser avaliadas antes de enviar' };
      }
      
      // Se precisa ajustes ou tem pontos críticos, comentário é obrigatório
      if ((validation.status === VALIDATION_STATUSES.NEEDS_ADJUSTMENT || validation.status === VALIDATION_STATUSES.CRITICAL_POINTS) && 
          (!validation.comment || validation.comment.trim() === '')) {
        return { valid: false, message: 'Comentários são obrigatórios para peças que precisam de ajustes ou têm pontos críticos' };
      }
    }
    
    return { valid: true };
  };

  const handleSubmit = async () => {
    const validation = validateSubmission();
    if (!validation.valid) {
      alert(validation.message);
      return;
    }

    setIsSubmitting(true);
    try {
      // Preparar dados para envio
      const pieces = Object.entries(validations).map(([pieceId, validation]) => ({
        id: parseInt(pieceId),
        status: validation.status,
        comment: validation.comment
      }));

      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/approval/campaigns/review/${hash}/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ pieces }),
      });

      if (!response.ok) {
        throw new Error('Erro ao enviar aprovação');
      }

      const result = await response.json();

      // Mostrar resultado
      alert(`Aprovação registrada com sucesso!\n\nResumo:\n- Aprovadas: ${result.stats.approved}\n- Precisam ajustes: ${result.stats.needsAdjustment}\n- Pontos críticos: ${result.stats.criticalPoints}`);
      navigate('/client/success');
    } catch (err) {
      alert('Erro ao enviar aprovação: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getValidationStats = () => {
    return Object.values(validations).reduce((acc, validation) => {
      acc[validation.status] = (acc[validation.status] || 0) + 1;
      return acc;
    }, {});
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[#ffc801] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600">Carregando campanha...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <X className="w-8 h-8 text-red-500" />
          </div>
          <h1 className="text-xl font-bold text-slate-800 mb-2">Acesso Negado</h1>
          <p className="text-slate-600 mb-4">{error}</p>
          <button
            onClick={() => navigate('/client/login')}
            className="px-6 py-3 bg-gradient-to-r from-[#ffc801] to-[#ffb700] text-white font-semibold rounded-xl hover:shadow-lg transition-all"
          >
            Voltar ao Login
          </button>
        </div>
      </div>
    );
  }

  const stats = getValidationStats();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <header className="bg-white shadow-xl border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <img src={aprobiLogo} alt="Aprobi Logo" className="w-16 h-auto" />
              <div>
                <h1 className="text-2xl font-bold text-slate-800">Aprovação de Peças</h1>
                <p className="text-slate-600">Sistema de validação para clientes</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-12">
        {/* Informações da Campanha */}
        <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-8 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-gradient-to-r from-[#ffc801] to-[#ffb700] rounded-xl flex items-center justify-center">
                <FileText className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-800">{campaign.name}</h2>
                <p className="text-slate-600">Nome da Campanha</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <User className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="font-semibold text-slate-800">{campaign.client}</p>
                <p className="text-slate-600">Cliente</p>
              </div>
            </div>

            {campaign.creativeLine && (
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                  <Sparkles className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <p className="font-semibold text-slate-800">{campaign.creativeLine}</p>
                  <p className="text-slate-600">Linha Criativa</p>
                </div>
              </div>
            )}
          </div>

          {campaign.sentForApprovalAt && (
            <div className="mt-6 flex items-center space-x-2 text-sm text-slate-600">
              <Calendar className="w-4 h-4" />
              <span>Enviado para aprovação em {formatDate(campaign.sentForApprovalAt)}</span>
            </div>
          )}
        </div>

        {/* Estatísticas de Validação */}
        <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6 mb-8">
          <h3 className="text-lg font-bold text-slate-800 mb-4">Progresso da Validação</h3>
          <div className="grid grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-emerald-600">{stats.approved || 0}</div>
              <div className="text-sm text-slate-600">Aprovadas</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-amber-600">{stats.needs_adjustment || 0}</div>
              <div className="text-sm text-slate-600">Precisam Ajustes</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-rose-600">{stats.critical_points || 0}</div>
              <div className="text-sm text-slate-600">Pontos Críticos</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-slate-600">{stats.pending || 0}</div>
              <div className="text-sm text-slate-600">Pendentes</div>
            </div>
          </div>
        </div>

        {/* Peças para Aprovação */}
        <div className="mb-8">
          <h3 className="text-2xl font-bold text-slate-800 mb-4">
            Peças para Aprovação ({campaign.pieces.length})
          </h3>
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
            <h4 className="font-semibold text-amber-800 mb-2">Instruções de Aprovação:</h4>
            <ul className="text-amber-700 text-sm space-y-1">
              <li><strong>Aprovado:</strong> A peça está perfeita e pode ser utilizada</li>
              <li><strong>Precisa Ajustes:</strong> Pequenas correções são necessárias</li>
              <li><strong>Pontos Críticos:</strong> Requer atenção especial ou mudanças importantes</li>
            </ul>
            <p className="text-amber-600 text-sm mt-2 font-medium">
              Comentários são obrigatórios para peças que precisam de ajustes ou têm pontos críticos.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {campaign.pieces.map(piece => (
              <FileViewer
                key={piece.id}
                piece={piece}
                validation={validations[piece.id] || { status: VALIDATION_STATUSES.PENDING, comment: '' }}
                onValidationChange={handleValidationChange}
                onOpenModal={setSelectedFile}
              />
            ))}
          </div>
        </div>

        {/* Botão de Enviar */}
        <div className="flex justify-center">
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="px-8 py-4 bg-gradient-to-r from-[#ffc801] to-[#ffb700] text-white font-bold text-lg rounded-xl hover:shadow-lg transform hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:transform-none flex items-center space-x-3"
          >
            {isSubmitting ? (
              <>
                <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Enviando Aprovação...</span>
              </>
            ) : (
              <>
                <Send className="w-6 h-6" />
                <span>Enviar Aprovação</span>
              </>
            )}
          </button>
        </div>
      </main>

      {/* Modal de Visualização */}
      {selectedFile && (
        <FileModal
          piece={selectedFile}
          onClose={() => setSelectedFile(null)}
        />
      )}
    </div>
  );
};

export default ClientApprovalPage;