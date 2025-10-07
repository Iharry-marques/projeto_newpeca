import React from 'react';
import { PlusCircle, X } from 'lucide-react';

const CampaignSidebar = ({
    campaigns,
    selectedCampaignId,
    onCampaignChange,
    onOpenNewCampaignModal,
    isLoading,
    isMobileOpen = false,
    onCloseMobile = () => {},
}) => {
    const baseAsideClasses =
        "bg-white border-r border-slate-200 flex flex-col transition-transform duration-200 ease-out lg:translate-x-0 lg:static lg:h-full";

    return (
        <>
            <div
                className={`fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-30 transition-opacity duration-200 ${
                    isMobileOpen ? 'opacity-100 pointer-events-auto lg:hidden' : 'opacity-0 pointer-events-none'
                }`}
                onClick={onCloseMobile}
            />
            <aside
                className={`fixed inset-y-0 left-0 z-40 w-72 transform ${
                    isMobileOpen ? 'translate-x-0' : '-translate-x-full'
                } ${baseAsideClasses} lg:w-80`}
            >
                <div className="p-4 border-b border-slate-200 flex items-center justify-between">
                    <button
                        onClick={onOpenNewCampaignModal}
                        className="flex-1 flex items-center justify-center px-4 py-2.5 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-all shadow-sm hover:shadow-md"
                    >
                        <PlusCircle className="w-5 h-5 mr-2" />
                        Nova Campanha
                    </button>
                    <button
                        type="button"
                        onClick={onCloseMobile}
                        className="ml-3 p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors lg:hidden"
                        aria-label="Fechar menu"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="flex-grow overflow-y-auto p-2">
                    {isLoading ? (
                        <p className="p-4 text-sm text-slate-500 animate-pulse">Carregando campanhas...</p>
                    ) : (
                        campaigns.map((campaign) => (
                            <button
                                key={campaign.id}
                                onClick={() => {
                                    onCampaignChange(campaign.id);
                                    onCloseMobile();
                                }}
                                className={`w-full text-left p-3 my-1 rounded-lg transition-colors duration-150 ${
                                    selectedCampaignId === campaign.id
                                        ? 'bg-blue-100 text-blue-800'
                                        : 'text-slate-700 hover:bg-slate-100'
                                }`}
                            >
                                <p className="font-semibold truncate">{campaign.name}</p>
                                <p
                                    className={`text-xs mt-1 truncate ${
                                        selectedCampaignId === campaign.id ? 'text-blue-600' : 'text-slate-500'
                                    }`}
                                >
                                    {campaign.client}
                                </p>
                            </button>
                        ))
                    )}
                    {!isLoading && campaigns.length === 0 && (
                        <p className="p-4 text-sm text-center text-slate-500">Nenhuma campanha encontrada.</p>
                    )}
                </div>
            </aside>
        </>
    );
};

export default CampaignSidebar;
