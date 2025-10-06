import React from 'react';
import { PlusCircle } from 'lucide-react';

const CampaignSidebar = ({ campaigns, selectedCampaignId, onCampaignChange, onOpenNewCampaignModal, isLoading }) => {
    return (
        <aside className="w-80 bg-white border-r border-slate-200 flex flex-col flex-shrink-0">
            <div className="p-4 border-b border-slate-200">
                <button 
                    onClick={onOpenNewCampaignModal} 
                    className="w-full flex items-center justify-center px-4 py-2.5 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-all shadow-sm hover:shadow-md"
                >
                    <PlusCircle className="w-5 h-5 mr-2" />
                    Nova Campanha
                </button>
            </div>

            <div className="flex-grow overflow-y-auto p-2">
                {isLoading ? (
                    <p className="p-4 text-sm text-slate-500 animate-pulse">Carregando campanhas...</p>
                ) : (
                    campaigns.map(campaign => (
                        <button 
                            key={campaign.id}
                            onClick={() => onCampaignChange(campaign.id)}
                            className={`w-full text-left p-3 my-1 rounded-lg transition-colors duration-150 ${selectedCampaignId === campaign.id ? 'bg-blue-100 text-blue-800' : 'text-slate-700 hover:bg-slate-100'}`}
                        >
                            <p className="font-semibold truncate">{campaign.name}</p>
                            <p className={`text-xs mt-1 truncate ${selectedCampaignId === campaign.id ? 'text-blue-600' : 'text-slate-500'}`}>{campaign.client}</p>
                        </button>
                    ))
                )}
                {!isLoading && campaigns.length === 0 && (
                    <p className="p-4 text-sm text-center text-slate-500">Nenhuma campanha encontrada.</p>
                )}
            </div>
        </aside>
    );
};

export default CampaignSidebar;