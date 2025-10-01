// frontend/src/ClientDashboard.jsx

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Calendar, 
  User, 
  Sparkles, 
  FileText, 
  Eye, 
  Clock,
  CheckCircle,
  AlertCircle,
  XCircle,
  LogOut,
  Building
} from 'lucide-react';
import aprobiLogo from "../assets/aprobi-logo.jpg";

const ClientDashboard = () => {
  const [campaigns, setCampaigns] = useState([]);
  const [clientData, setClientData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const loadClientData = () => {
      const savedClientData = localStorage.getItem('clientData');
      if (savedClientData) {
        setClientData(JSON.parse(savedClientData));
      }
    };

    // Atualizado para consumir o novo formato da rota
    const fetchCampaigns = async () => {
      try {
        const token = localStorage.getItem('clientToken');
        if (!token) {
          throw new Error('Token não encontrado');
        }

        const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/client-auth/campaigns`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          if (response.status === 401) {
            localStorage.removeItem('clientToken');
            localStorage.removeItem('clientData');
            navigate('/client/login');
            return;
          }
          throw new Error('Erro ao carregar campanhas');
        }

        const data = await response.json();
        setCampaigns(data.campaigns || []);
        if (data.client) setClientData(data.client);
      } catch (err) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    loadClientData();
    fetchCampaigns();
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('clientToken');
    localStorage.removeItem('clientData');
    navigate('/client/login');
  };

  const getCampaignStatusInfo = (campaign) => {
    switch (campaign.status) {
      case 'sent_for_approval':
        return {
          icon: <Clock className="w-5 h-5" />,
          label: 'Aguardando Revisão',
          color: 'text-blue-600',
          bgColor: 'bg-blue-100',
          borderColor: 'border-blue-200'
        };
      case 'in_review':
        return {
          icon: <Eye className="w-5 h-5" />,
          label: 'Em Revisão',
          color: 'text-amber-600',
          bgColor: 'bg-amber-100',
          borderColor: 'border-amber-200'
        };
      case 'approved':
        return {
          icon: <CheckCircle className="w-5 h-5" />,
          label: 'Aprovada',
          color: 'text-emerald-600',
          bgColor: 'bg-emerald-100',
          borderColor: 'border-emerald-200'
        };
      case 'needs_changes':
        return {
          icon: <AlertCircle className="w-5 h-5" />,
          label: 'Precisa Ajustes',
          color: 'text-orange-600',
          bgColor: 'bg-orange-100',
          borderColor: 'border-orange-200'
        };
      default:
        return {
          icon: <XCircle className="w-5 h-5" />,
          label: 'Rascunho',
          color: 'text-slate-600',
          bgColor: 'bg-slate-100',
          borderColor: 'border-slate-200'
        };
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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[#ffc801] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600">Carregando campanhas...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <header className="bg-white shadow-xl border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <img src={aprobiLogo} alt="Aprobi Logo" className="w-16 h-auto" />
              <div>
                <h1 className="text-2xl font-bold text-slate-800">Portal do Cliente</h1>
                <p className="text-slate-600">Suas campanhas para aprovação</p>
              </div>
            </div>
            
            {/* Info do cliente e logout */}
            <div className="flex items-center space-x-4">
              {clientData && (
                <div className="text-right">
                  <div className="text-sm font-semibold text-slate-800">{clientData.name}</div>
                  <div className="text-sm text-slate-600 flex items-center">
                    <Building className="w-3 h-3 mr-1" />
                    {clientData.company || clientData.email}
                  </div>
                </div>
              )}
              <button
                onClick={handleLogout}
                className="flex items-center px-4 py-2 text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
                title="Sair"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-12">
        {error && (
          <div className="mb-8 p-4 bg-red-50 border border-red-200 rounded-xl">
            <p className="text-red-700 font-medium">{error}</p>
          </div>
        )}

        {/* Resumo */}
        <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-8 mb-8">
          <h2 className="text-2xl font-bold text-slate-800 mb-6">Resumo das Campanhas</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Clock className="w-6 h-6 text-blue-600" />
              </div>
              <div className="text-2xl font-bold text-blue-600">
                {campaigns.filter(c => c.status === 'sent_for_approval').length}
              </div>
              <div className="text-sm text-slate-600">Aguardando</div>
            </div>
            
            <div className="text-center">
              <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Eye className="w-6 h-6 text-amber-600" />
              </div>
              <div className="text-2xl font-bold text-amber-600">
                {campaigns.filter(c => c.status === 'in_review').length}
              </div>
              <div className="text-sm text-slate-600">Em Revisão</div>
            </div>
            
            <div className="text-center">
              <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <CheckCircle className="w-6 h-6 text-emerald-600" />
              </div>
              <div className="text-2xl font-bold text-emerald-600">
                {campaigns.filter(c => c.status === 'approved').length}
              </div>
              <div className="text-sm text-slate-600">Aprovadas</div>
            </div>
            
            <div className="text-center">
              <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <AlertCircle className="w-6 h-6 text-orange-600" />
              </div>
              <div className="text-2xl font-bold text-orange-600">
                {campaigns.filter(c => c.status === 'needs_changes').length}
              </div>
              <div className="text-sm text-slate-600">Precisa Ajustes</div>
            </div>
          </div>
        </div>

        {/* Lista de Campanhas */}
        <div>
          <h2 className="text-2xl font-bold text-slate-800 mb-6">Suas Campanhas ({campaigns.length})</h2>
          
          {campaigns.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-2xl shadow-lg border border-slate-200">
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <FileText className="w-8 h-8 text-slate-400" />
              </div>
              <h3 className="text-xl font-semibold text-slate-600 mb-2">
                Nenhuma campanha encontrada
              </h3>
              <p className="text-slate-500">
                Você ainda não tem campanhas atribuídas para aprovação.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {campaigns.map((campaign) => {
                const statusInfo = getCampaignStatusInfo(campaign);
                
                return (
                  <div key={campaign.id} className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6 hover:shadow-xl transition-all duration-300">
                    {/* Header do Card */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h3 className="text-lg font-bold text-slate-800 mb-2 line-clamp-2">
                          {campaign.name}
                        </h3>
                        <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold border ${statusInfo.bgColor} ${statusInfo.color} ${statusInfo.borderColor}`}>
                          {statusInfo.icon}
                          <span className="ml-2">{statusInfo.label}</span>
                        </div>
                      </div>
                    </div>

                    {/* Detalhes da Campanha */}
                    <div className="space-y-3 mb-6">
                      <div className="flex items-center text-sm text-slate-600">
                        <User className="w-4 h-4 mr-2 flex-shrink-0" />
                        <span className="font-medium">{campaign.client}</span>
                      </div>
                      
                      {campaign.creativeLine && (
                        <div className="flex items-center text-sm text-slate-600">
                          <Sparkles className="w-4 h-4 mr-2 flex-shrink-0" />
                          <span>{campaign.creativeLine}</span>
                        </div>
                      )}
                      
                      {campaign.createdAt && (
                        <div className="flex items-center text-sm text-slate-600">
                          <Calendar className="w-4 h-4 mr-2 flex-shrink-0" />
                          <span>Criada em {formatDate(campaign.createdAt)}</span>
                        </div>
                      )}
                    </div>

                    {/* Estatísticas das Peças */}
                    {campaign.pieceStats && (
                      <div className="bg-slate-50 rounded-lg p-4 mb-6">
                        <h4 className="text-sm font-semibold text-slate-700 mb-3">Peças</h4>
                        <div className="grid grid-cols-2 gap-3 text-sm">
                          {campaign.pieceStats.pending > 0 && (
                            <div className="text-amber-600">
                              <span className="font-semibold">{campaign.pieceStats.pending}</span> pendente{campaign.pieceStats.pending > 1 ? 's' : ''}
                            </div>
                          )}
                          {campaign.pieceStats.approved > 0 && (
                            <div className="text-emerald-600">
                              <span className="font-semibold">{campaign.pieceStats.approved}</span> aprovada{campaign.pieceStats.approved > 1 ? 's' : ''}
                            </div>
                          )}
                          {campaign.pieceStats.needsAdjustment > 0 && (
                            <div className="text-orange-600">
                              <span className="font-semibold">{campaign.pieceStats.needsAdjustment}</span> ajuste{campaign.pieceStats.needsAdjustment > 1 ? 's' : ''}
                            </div>
                          )}
                          {campaign.pieceStats.criticalPoints > 0 && (
                            <div className="text-rose-600">
                              <span className="font-semibold">{campaign.pieceStats.criticalPoints}</span> crítica{campaign.pieceStats.criticalPoints > 1 ? 's' : ''}
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Botão de Ação */}
                    <button
                      onClick={() => navigate(`/client/approval/${campaign.approvalHash}`)}
                      className="w-full px-6 py-3 bg-gradient-to-r from-[#ffc801] to-[#ffb700] text-white font-semibold rounded-xl hover:shadow-lg transform hover:scale-105 transition-all duration-200 flex items-center justify-center"
                      disabled={campaign.status === 'draft'}
                    >
                      <Eye className="w-5 h-5 mr-2" />
                      {campaign.status === 'approved' ? 'Revisar Aprovação' : 
                       campaign.status === 'needs_changes' ? 'Revisar Ajustes' :
                       'Revisar Peças'}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default ClientDashboard;