import React, { Fragment } from 'react';
import { Listbox, Transition } from '@headlessui/react';
import { ChevronDownIcon, CheckIcon, PlusIcon, CalendarIcon, UserIcon, BriefcaseIcon } from '@heroicons/react/20/solid';

const CampaignSelector = ({ campaigns, selectedCampaignId, onCampaignChange, onCreateNew, disabled = false }) => {
  const selectedCampaign = campaigns.find(campaign => campaign.id === selectedCampaignId) || null;

  const formatDate = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const getCampaignStatus = (campaign) => {
    if (!campaign.startDate && !campaign.endDate) return 'Rascunho';
    const now = new Date();
    const start = campaign.startDate ? new Date(campaign.startDate) : null;
    const end = campaign.endDate ? new Date(campaign.endDate) : null;

    if (start && start > now) return 'Agendada';
    if (end && end < now) return 'Finalizada';
    return 'Ativa';
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Ativa': return 'bg-green-100 text-green-800 border-green-200';
      case 'Agendada': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Finalizada': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    }
  };

  return (
    <div className="w-full max-w-none">
      <Listbox value={selectedCampaignId} onChange={onCampaignChange} disabled={disabled}>
        <div className="relative">
          {/* Label */}
          <Listbox.Label className="block text-sm font-semibold text-slate-700 mb-3">
            <div className="flex items-center gap-2">
              <BriefcaseIcon className="w-5 h-5 text-slate-500" />
              Selecione uma Campanha
            </div>
          </Listbox.Label>

          {/* Button */}
          <Listbox.Button className={`
            relative w-full cursor-pointer rounded-xl bg-white py-4 px-6 text-left shadow-lg ring-1 ring-slate-200 
            focus:outline-none focus:ring-2 focus:ring-[#ffc801] focus:ring-offset-2 hover:shadow-xl transition-all duration-200
            ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:ring-slate-300'}
          `}>
            {selectedCampaign ? (
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-3 h-3 bg-gradient-to-r from-[#ffc801] to-[#ffb700] rounded-full flex-shrink-0" />
                    <h3 className="text-lg font-bold text-slate-800 truncate">{selectedCampaign.name}</h3>
                    <span className={`
                      px-2 py-1 text-xs font-semibold rounded-full border
                      ${getStatusColor(getCampaignStatus(selectedCampaign))}
                    `}>
                      {getCampaignStatus(selectedCampaign)}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-slate-600">
                    <div className="flex items-center gap-1">
                      <UserIcon className="w-4 h-4" />
                      <span className="font-medium">{selectedCampaign.client}</span>
                    </div>
                    {selectedCampaign.creativeLine && (
                      <div className="flex items-center gap-1">
                        <span className="w-4 h-4 text-center">🎨</span>
                        <span>{selectedCampaign.creativeLine}</span>
                      </div>
                    )}
                    {(selectedCampaign.startDate || selectedCampaign.endDate) && (
                      <div className="flex items-center gap-1">
                        <CalendarIcon className="w-4 h-4" />
                        <span>
                          {formatDate(selectedCampaign.startDate)} 
                          {selectedCampaign.startDate && selectedCampaign.endDate && ' - '}
                          {formatDate(selectedCampaign.endDate)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
                <ChevronDownIcon className="ml-4 h-6 w-6 text-slate-400 flex-shrink-0" aria-hidden="true" />
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-slate-100 rounded-lg flex items-center justify-center">
                    <BriefcaseIcon className="w-6 h-6 text-slate-400" />
                  </div>
                  <div>
                    <div className="text-slate-400 font-medium">Nenhuma campanha selecionada</div>
                    <div className="text-sm text-slate-500">Escolha uma campanha para começar</div>
                  </div>
                </div>
                <ChevronDownIcon className="ml-4 h-6 w-6 text-slate-400 flex-shrink-0" aria-hidden="true" />
              </div>
            )}
          </Listbox.Button>

          {/* Options */}
          <Transition
            as={Fragment}
            leave="transition ease-in duration-100"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <Listbox.Options className="
              absolute z-10 mt-2 w-full bg-white shadow-2xl max-h-80 rounded-xl py-2 text-base 
              ring-1 ring-slate-200 overflow-auto focus:outline-none
            ">
              {/* Create New Campaign Option */}
              <div className="px-3 py-2">
                <button
                  type="button"
                  onClick={() => {
                    onCreateNew();
                  }}
                  className="
                    w-full flex items-center gap-3 px-4 py-3 text-left rounded-lg
                    bg-gradient-to-r from-emerald-50 to-emerald-100 hover:from-emerald-100 hover:to-emerald-200
                    border-2 border-dashed border-emerald-300 hover:border-emerald-400
                    transition-all duration-200 group
                  "
                >
                  <div className="w-10 h-10 bg-emerald-500 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                    <PlusIcon className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <div className="font-semibold text-emerald-800">Criar Nova Campanha</div>
                    <div className="text-sm text-emerald-600">Clique para adicionar uma nova campanha</div>
                  </div>
                </button>
              </div>

              {/* Divider */}
              {campaigns.length > 0 && (
                <div className="mx-3 my-2 border-t border-slate-200" />
              )}

              {/* Campaign Options */}
              {campaigns.length === 0 ? (
                <div className="px-6 py-8 text-center">
                  <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <BriefcaseIcon className="w-8 h-8 text-slate-400" />
                  </div>
                  <div className="text-slate-600 font-medium mb-2">Nenhuma campanha encontrada</div>
                  <div className="text-sm text-slate-500">Crie sua primeira campanha para começar</div>
                </div>
              ) : (
                campaigns.map((campaign) => (
                  <Listbox.Option
                    key={campaign.id}
                    className={({ active }) =>
                      `relative cursor-pointer select-none mx-3 my-1 rounded-lg transition-all duration-150 ${
                        active ? 'bg-[#ffc801]/10 ring-2 ring-[#ffc801]/20' : ''
                      }`
                    }
                    value={campaign.id}
                  >
                    {({ selected, active }) => (
                      <div className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-3 mb-2">
                              <div className={`
                                w-3 h-3 rounded-full flex-shrink-0
                                ${selected ? 'bg-gradient-to-r from-[#ffc801] to-[#ffb700]' : 'bg-slate-300'}
                              `} />
                              <h4 className={`font-bold truncate ${selected ? 'text-slate-900' : 'text-slate-700'}`}>
                                {campaign.name}
                              </h4>
                              <span className={`
                                px-2 py-1 text-xs font-semibold rounded-full border flex-shrink-0
                                ${getStatusColor(getCampaignStatus(campaign))}
                              `}>
                                {getCampaignStatus(campaign)}
                              </span>
                            </div>
                            <div className="flex items-center gap-4 text-sm text-slate-600">
                              <div className="flex items-center gap-1">
                                <UserIcon className="w-4 h-4" />
                                <span className="font-medium">{campaign.client}</span>
                              </div>
                              {campaign.creativeLine && (
                                <div className="flex items-center gap-1">
                                  <span className="w-4 h-4 text-center">🎨</span>
                                  <span className="truncate">{campaign.creativeLine}</span>
                                </div>
                              )}
                            </div>
                            {(campaign.startDate || campaign.endDate) && (
                              <div className="flex items-center gap-1 text-sm text-slate-500 mt-1">
                                <CalendarIcon className="w-4 h-4" />
                                <span>
                                  {formatDate(campaign.startDate)} 
                                  {campaign.startDate && campaign.endDate && ' - '}
                                  {formatDate(campaign.endDate)}
                                </span>
                              </div>
                            )}
                          </div>
                          {selected && (
                            <CheckIcon className="w-6 h-6 text-[#ffc801] flex-shrink-0 ml-4" aria-hidden="true" />
                          )}
                        </div>
                      </div>
                    )}
                  </Listbox.Option>
                ))
              )}
            </Listbox.Options>
          </Transition>
        </div>
      </Listbox>
    </div>
  );
};

export default CampaignSelector;