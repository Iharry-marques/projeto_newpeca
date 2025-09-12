import React from 'react';
import { CalendarIcon, UserIcon, SparklesIcon, ClockIcon, FolderIcon } from '@heroicons/react/20/solid';

const CampaignPreviewCard = ({ campaign, pieceCount = 0 }) => {
  if (!campaign) return null;

  const formatDate = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const getCampaignStatus = () => {
    if (!campaign.startDate && !campaign.endDate) return { status: 'Rascunho', color: 'yellow' };
    const now = new Date();
    const start = campaign.startDate ? new Date(campaign.startDate) : null;
    const end = campaign.endDate ? new Date(campaign.endDate) : null;

    if (start && start > now) return { status: 'Agendada', color: 'blue' };
    if (end && end < now) return { status: 'Finalizada', color: 'gray' };
    return { status: 'Ativa', color: 'green' };
  };

  const getStatusStyle = (color) => {
    const styles = {
      green: 'bg-green-100 text-green-800 border-green-200',
      blue: 'bg-blue-100 text-blue-800 border-blue-200',
      gray: 'bg-gray-100 text-gray-800 border-gray-200',
      yellow: 'bg-yellow-100 text-yellow-800 border-yellow-200'
    };
    return styles[color] || styles.yellow;
  };

  const getDaysRemaining = () => {
    if (!campaign.endDate) return null;
    const now = new Date();
    const end = new Date(campaign.endDate);
    const diffTime = end - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return `Finalizada há ${Math.abs(diffDays)} dias`;
    if (diffDays === 0) return 'Finaliza hoje';
    return `${diffDays} dias restantes`;
  };

  const campaignStatus = getCampaignStatus();

  return (
    <div className="bg-gradient-to-br from-slate-50 to-white p-6 rounded-2xl border border-slate-200 shadow-sm">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-4 h-4 bg-gradient-to-r from-[#ffc801] to-[#ffb700] rounded-full animate-pulse" />
            <h3 className="text-xl font-bold text-slate-800">{campaign.name}</h3>
          </div>
          <div className="flex items-center gap-2">
            <span className={`
              px-3 py-1 text-sm font-semibold rounded-full border
              ${getStatusStyle(campaignStatus.color)}
            `}>
              {campaignStatus.status}
            </span>
            {campaignStatus.status === 'Ativa' && getDaysRemaining() && (
              <span className="px-3 py-1 text-sm font-medium text-slate-600 bg-slate-100 rounded-full border border-slate-200">
                <ClockIcon className="w-4 h-4 inline mr-1" />
                {getDaysRemaining()}
              </span>
            )}
          </div>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-[#ffc801]">{pieceCount}</div>
          <div className="text-sm text-slate-500">peças</div>
        </div>
      </div>

      {/* Details Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Cliente */}
        <div className="flex items-center gap-3 p-3 bg-white rounded-xl border border-slate-100">
          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
            <UserIcon className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <div className="text-sm text-slate-500">Cliente</div>
            <div className="font-semibold text-slate-800">{campaign.client}</div>
          </div>
        </div>

        {/* Linha Criativa */}
        {campaign.creativeLine && (
          <div className="flex items-center gap-3 p-3 bg-white rounded-xl border border-slate-100">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <SparklesIcon className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <div className="text-sm text-slate-500">Linha Criativa</div>
              <div className="font-semibold text-slate-800">{campaign.creativeLine}</div>
            </div>
          </div>
        )}

        {/* Data de Início */}
        {campaign.startDate && (
          <div className="flex items-center gap-3 p-3 bg-white rounded-xl border border-slate-100">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <CalendarIcon className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <div className="text-sm text-slate-500">Início</div>
              <div className="font-semibold text-slate-800">{formatDate(campaign.startDate)}</div>
            </div>
          </div>
        )}

        {/* Data de Fim */}
        {campaign.endDate && (
          <div className="flex items-center gap-3 p-3 bg-white rounded-xl border border-slate-100">
            <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
              <CalendarIcon className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <div className="text-sm text-slate-500">Fim</div>
              <div className="font-semibold text-slate-800">{formatDate(campaign.endDate)}</div>
            </div>
          </div>
        )}
      </div>

      {/* Progress Bar para campanhas ativas */}
      {campaign.startDate && campaign.endDate && campaignStatus.status === 'Ativa' && (
        <div className="mt-4 p-3 bg-white rounded-xl border border-slate-100">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-slate-700">Progresso da Campanha</span>
            <span className="text-sm text-slate-500">
              {(() => {
                const start = new Date(campaign.startDate);
                const end = new Date(campaign.endDate);
                const now = new Date();
                const total = end - start;
                const elapsed = now - start;
                const progress = Math.max(0, Math.min(100, (elapsed / total) * 100));
                return `${Math.round(progress)}%`;
              })()}
            </span>
          </div>
          <div className="w-full bg-slate-200 rounded-full h-2">
            <div 
              className="bg-gradient-to-r from-[#ffc801] to-[#ffb700] h-2 rounded-full transition-all duration-500"
              style={{
                width: `${(() => {
                  const start = new Date(campaign.startDate);
                  const end = new Date(campaign.endDate);
                  const now = new Date();
                  const total = end - start;
                  const elapsed = now - start;
                  return Math.max(0, Math.min(100, (elapsed / total) * 100));
                })()}%`
              }}
            />
          </div>
        </div>
      )}

      {/* Call to Action */}
      <div className="mt-4 p-4 bg-gradient-to-r from-[#ffc801]/10 to-[#ffb700]/10 rounded-xl border border-[#ffc801]/20">
        <div className="flex items-center gap-2 text-[#B8860B]">
          <FolderIcon className="w-5 h-5" />
          <span className="font-medium">
            {pieceCount === 0 
              ? "Nenhuma peça adicionada ainda. Faça upload para começar!" 
              : `${pieceCount} peças aguardando validação`
            }
          </span>
        </div>
      </div>
    </div>
  );
};

export default CampaignPreviewCard;