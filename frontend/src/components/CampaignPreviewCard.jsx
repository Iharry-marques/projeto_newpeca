// Em: frontend/src/components/CampaignPreviewCard.jsx (VERSÃO ATUALIZADA)

import React from 'react';
import { CalendarIcon, UserIcon } from '@heroicons/react/20/solid';

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

  return (
    <div>
      <h2 className="text-2xl font-bold text-slate-800 mb-4">Painel da Campanha</h2>
      <div className="bg-gradient-to-br from-slate-50 to-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h3 className="text-xl font-bold text-slate-800">{campaign.name}</h3>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-[#ffc801]">{pieceCount}</div>
            <div className="text-sm text-slate-500">peças</div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-center gap-3 p-3 bg-white rounded-xl border border-slate-100">
            <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
              <UserIcon className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <div className="text-sm text-slate-500">Cliente</div>
              <div className="font-semibold text-slate-800">{campaign.client}</div>
            </div>
          </div>

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
        </div>
      </div>
    </div>
  );
};

export default CampaignPreviewCard;