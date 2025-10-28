import React from 'react';
import { Package, Calendar } from 'lucide-react';
import { cn } from '@/lib/utils'; // Ajuste o caminho se necessário

// Mapeamentos de Status (ajustados para combinar com o novo layout)
const badgeStyles = {
    sent_for_approval: 'bg-blue-100 text-blue-600 border-blue-200',
    in_review: 'bg-amber-100 text-amber-600 border-amber-200',
    needs_changes: 'bg-orange-100 text-orange-600 border-orange-200',
    approved: 'bg-emerald-100 text-emerald-600 border-emerald-200',
    draft: 'bg-slate-100 text-slate-500 border-slate-200',
};

const statusLabel = {
    sent_for_approval: 'Enviada',
    in_review: 'Revisão',
    needs_changes: 'Ajustes',
    approved: 'Aprovada',
    draft: 'Rascunho',
};

const formatDate = (dateString) => {
    if (!dateString) return '-';
    try {
        return new Date(dateString).toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
        });
    } catch (error) {
        return '-';
    }
};

const CampaignListItem = ({ campaign, pieceCount, isSelected, onClick }) => {
    if (!campaign) return null;

    const currentStatus = campaign.status || 'draft';
    const statusClass = badgeStyles[currentStatus] ?? badgeStyles.draft;
    const label = statusLabel[currentStatus] ?? statusLabel.draft;

    return (
        <div
            role="button"
            tabIndex={0}
            onClick={onClick}
            onKeyDown={(event) => (event.key === 'Enter' || event.key === ' ') && onClick()}
            className={cn(
                'group relative w-full rounded-xl border bg-white p-4 text-left shadow-sm transition-all duration-200 ease-out hover:-translate-y-0.5 hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-yellow-400',
                isSelected
                    ? 'ring-2 ring-offset-1 ring-yellow-400 border-yellow-300 bg-yellow-50/70 shadow'
                    : 'border-slate-200 hover:border-slate-300'
            )}
        >
            {/* Informações principais */}
            <div className="mb-2">
                <p
                    className={cn(
                        'text-base font-semibold truncate',
                        isSelected ? 'text-yellow-900' : 'text-slate-800'
                    )}
                >
                    {campaign.name}
                </p>
                <p
                    className={cn(
                        'mt-0.5 text-sm truncate',
                        isSelected ? 'text-yellow-800' : 'text-slate-600'
                    )}
                >
                    {campaign.client || 'Cliente não definido'}
                </p>
            </div>

            {/* Informações secundárias */}
            <div className="flex items-center justify-between text-xs">
                <div
                    className={cn(
                        'flex items-center space-x-3',
                        isSelected ? 'text-yellow-700' : 'text-slate-500'
                    )}
                >
                    <span className="flex items-center" title={`${pieceCount ?? 0} peças`}>
                        <Package className="mr-1 h-3 w-3" />
                        {pieceCount ?? 0}
                    </span>
                    <span
                        className="flex items-center"
                        title={
                            campaign.createdAt
                                ? `Criado em ${formatDate(campaign.createdAt)}`
                                : 'Data não disponível'
                        }
                    >
                        <Calendar className="mr-1 h-3 w-3" />
                        {formatDate(campaign.createdAt)}
                    </span>
                </div>
                <span
                    className={cn(
                        'ml-auto flex-shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide transition-colors',
                        statusClass
                    )}
                >
                    {label}
                </span>
            </div>
        </div>
    );
};

export default CampaignListItem;
