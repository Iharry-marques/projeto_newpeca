// frontend/src/components/CampaignSidebar.jsx
// *** VERSÃO FINAL AJUSTADA ***

import React from 'react';
import { PlusCircle, X, Users, List } from 'lucide-react';
import { Link } from 'react-router-dom';
import { AnimatedList } from './magicui/animated-list'; // Ajuste o caminho se necessário
import { useMe } from '../hooks/useMe';
import CampaignListItem from './CampaignListItem'; // Importa o novo item

const CampaignSidebar = ({
    campaigns,
    selectedCampaignId,
    onCampaignChange,
    onOpenNewCampaignModal,
    isLoading,
    isMobileOpen = false,
    onCloseMobile = () => {},
}) => {
    const { user } = useMe();
    const isAdmin = user?.role === 'admin';

    const baseAsideClasses =
        // Adicionado max-h-screen para garantir que não ultrapasse a altura da tela
        "bg-white flex flex-col transition-transform duration-200 ease-out lg:translate-x-0 lg:static max-h-screen shadow-lg";

    const calculatePieceCount = (campaign) => {
        if (!campaign) return 0;
        if (typeof campaign.pieceCount === 'number') {
            return campaign.pieceCount;
        }
        if (Array.isArray(campaign.creativeLines)) {
            return campaign.creativeLines.reduce(
                (total, line) => total + (line?.pieces?.length || 0),
                0
            );
        }
        if (Array.isArray(campaign.pieces)) {
            return campaign.pieces.length;
        }
        return 0;
    };

    return (
        <>
            {/* Overlay */}
            <div
                className={`fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-30 transition-opacity duration-200 ${
                    isMobileOpen ? 'opacity-100 pointer-events-auto lg:hidden' : 'opacity-0 pointer-events-none'
                }`}
                onClick={onCloseMobile}
            />
            {/* Sidebar */}
            <aside
                className={`fixed inset-y-0 left-0 z-40 w-80 transform ${isMobileOpen ? 'translate-x-0' : '-translate-x-full'} ${baseAsideClasses} lg:w-[23rem] lg:border-r lg:border-slate-200 lg:bg-white`}
            >
                {/* Botão Gerenciar Clientes */}
                {isAdmin && (
                    <div className="p-4 border-b border-slate-200">
                        <Link to="/clients" className="w-full block"> {/* Adicionado block */}
                            <button
                                type="button"
                                onClick={onCloseMobile} // Fecha o menu mobile ao navegar
                                className="w-full flex items-center justify-center px-4 py-2.5 bg-slate-700 text-white font-semibold rounded-lg hover:bg-slate-800 transition-all"
                            >
                                <Users className="w-5 h-5 mr-2" />
                                Gerenciar Clientes
                            </button>
                        </Link>
                    </div>
                )}
                {/* Botão Nova Campanha */}
                <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-white">
                    <button
                        onClick={onOpenNewCampaignModal}
                        className="flex-1 flex items-center justify-center px-4 py-2.5 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-all shadow-sm hover:shadow-md"
                    >
                        <PlusCircle className="w-5 h-5 mr-2" />
                        Nova Campanha
                    </button>
                    {/* Botão Fechar Mobile */}
                    <button
                        type="button"
                        onClick={onCloseMobile}
                        className="ml-3 p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors lg:hidden"
                        aria-label="Fechar menu"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Título da Lista */}
                <div className="px-5 pt-4 pb-2 flex items-center justify-between gap-2 sticky top-0 bg-white z-10 border-b border-slate-100">
                     {/* Movido sticky e bg para cá */}
                    <div>
                        <p className="text-[10px] uppercase tracking-[0.3em] text-slate-400 font-semibold">
                            Painel
                        </p>
                        <div className="mt-1 flex items-center gap-2">
                             <List className="w-4 h-4 text-slate-500" /> {/* Ícone List */}
                            <h2 className="text-base font-semibold text-slate-800"> {/* Tamanho ajustado */}
                                Sua Lista de Campanhas
                            </h2>
                        </div>
                    </div>
                    {campaigns.length > 0 && !isLoading && (
                        <span className="text-xs font-medium text-slate-400 whitespace-nowrap pt-5"> {/* Ajuste padding top */}
                            {campaigns.length} {campaigns.length === 1 ? 'campanha' : 'campanhas'}
                        </span>
                    )}
                </div>

                {/* Container da Lista com Scroll */}
                <div className="flex-grow p-5 pt-3 overflow-y-auto"> {/* Adicionado overflow-y-auto AQUI */}
                    {isLoading ? (
                        <div className="space-y-3"> {/* Removido mt-6 */}
                            <div className="h-20 rounded-2xl bg-slate-100 animate-pulse" />
                            <div className="h-20 rounded-2xl bg-slate-100 animate-pulse" />
                            <div className="h-20 rounded-2xl bg-slate-100 animate-pulse" />
                        </div>
                    ) : campaigns.length === 0 ? (
                        <div className="mt-2 rounded-2xl border border-dashed border-slate-300 bg-slate-50/70 p-6 text-center"> {/* Removido mt-8 */}
                            <p className="text-sm font-semibold text-slate-600">Nenhuma campanha por aqui.</p>
                            <p className="mt-2 text-xs text-slate-500">
                                Crie sua primeira campanha para começar a colaborar.
                            </p>
                        </div>
                    ) : (
                        <AnimatedList className="pb-8"> {/* Removido h-full e overflow daqui */}
                            {campaigns.map((campaign) => (
                                <CampaignListItem
                                    key={campaign.id} // Usar ID da campanha como key
                                    campaign={campaign}
                                    pieceCount={calculatePieceCount(campaign)} // Contagem das peças renderizadas
                                    isSelected={selectedCampaignId === campaign.id}
                                    onClick={() => {
                                        onCampaignChange(campaign.id);
                                        onCloseMobile();
                                    }}
                                />
                            ))}
                        </AnimatedList>
                    )}
                </div>
            </aside>
        </>
    );
};

export default CampaignSidebar;
