// ClientSelectionModal.jsx
import React, { useState, useEffect } from 'react';
import { X, Users, Check, Plus } from 'lucide-react';

const ClientSelectionModal = ({ isOpen, onClose, onConfirm, campaignName }) => {
  const [clients, setClients] = useState([]);
  const [selectedClients, setSelectedClients] = useState(new Set());
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchClients();
    }
  }, [isOpen]);

  const fetchClients = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/clients`, {
        credentials: 'include'
      });
      if (response.ok) {
        const data = await response.json();
        setClients(data.filter(client => client.isActive));
      }
    } catch (error) {
      console.error('Erro ao carregar clientes:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleClient = (clientId) => {
    setSelectedClients(prev => {
      const newSet = new Set(prev);
      if (newSet.has(clientId)) {
        newSet.delete(clientId);
      } else {
        newSet.add(clientId);
      }
      return newSet;
    });
  };

  const handleConfirm = () => {
    onConfirm(Array.from(selectedClients));
    handleClose();
  };

  const handleClose = () => {
    setSelectedClients(new Set());
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden">
        <div className="p-6 border-b border-slate-200 flex justify-between items-center">
          <div>
            <h3 className="text-xl font-bold text-slate-800">Selecionar Clientes</h3>
            <p className="text-slate-600">Quem poderá acessar a campanha "{campaignName}"?</p>
          </div>
          <button onClick={handleClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
            <X className="w-5 h-5 text-slate-600" />
          </button>
        </div>
        
        <div className="p-6">
          {isLoading ? (
            <div className="text-center py-8">
              <div className="w-8 h-8 border-2 border-[#ffc801] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-slate-600">Carregando clientes...</p>
            </div>
          ) : clients.length === 0 ? (
            <div className="text-center py-8">
              <Users className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <h4 className="text-xl font-semibold text-slate-600 mb-2">Nenhum cliente cadastrado</h4>
              <p className="text-slate-500">Cadastre clientes primeiro para poder atribuí-los às campanhas.</p>
            </div>
          ) : (
            <>
              <div className="mb-4 flex items-center justify-between">
                <p className="text-slate-600">
                  {selectedClients.size} de {clients.length} clientes selecionados
                </p>
                <button
                  onClick={() => {
                    if (selectedClients.size === clients.length) {
                      setSelectedClients(new Set());
                    } else {
                      setSelectedClients(new Set(clients.map(c => c.id)));
                    }
                  }}
                  className="text-sm text-[#ffc801] hover:text-[#e6b301] font-medium"
                >
                  {selectedClients.size === clients.length ? 'Desmarcar Todos' : 'Selecionar Todos'}
                </button>
              </div>

              <div className="max-h-80 overflow-y-auto space-y-3">
                {clients.map(client => (
                  <div 
                    key={client.id}
                    onClick={() => handleToggleClient(client.id)}
                    className={`p-4 border rounded-xl cursor-pointer transition-all ${
                      selectedClients.has(client.id) 
                        ? 'border-[#ffc801] bg-[#ffc801]/5 shadow-sm' 
                        : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                          selectedClients.has(client.id)
                            ? 'bg-[#ffc801] border-[#ffc801]'
                            : 'border-slate-300'
                        }`}>
                          {selectedClients.has(client.id) && (
                            <Check className="w-4 h-4 text-white" />
                          )}
                        </div>
                        <div>
                          <div className="font-semibold text-slate-800">{client.name}</div>
                          <div className="text-sm text-slate-600">{client.email}</div>
                          {client.company && (
                            <div className="text-sm text-slate-500">{client.company}</div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        <div className="flex items-center justify-between p-6 bg-slate-50 border-t border-slate-200">
          <div className="text-sm text-slate-600">
            💡 Dica: Clientes selecionados receberão acesso via login ou link direto
          </div>
          <div className="flex space-x-4">
            <button 
              onClick={handleClose}
              className="px-6 py-3 text-slate-600 font-semibold hover:text-slate-800 transition-colors"
            >
              Cancelar
            </button>
            <button 
              onClick={handleConfirm}
              disabled={selectedClients.size === 0}
              className="px-8 py-3 bg-gradient-to-r from-[#ffc801] to-[#ffb700] text-white font-semibold rounded-xl hover:shadow-lg transform hover:scale-105 transition-all disabled:opacity-50 disabled:transform-none"
            >
              Enviar para {selectedClients.size} Cliente{selectedClients.size !== 1 ? 's' : ''}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClientSelectionModal;