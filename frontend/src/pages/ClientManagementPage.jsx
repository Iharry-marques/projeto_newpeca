// frontend/src/ClientManagementPage.jsx

import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import {
  Users,
  Plus,
  Edit2,
  Eye,
  EyeOff,
  Building,
  Mail,
  Calendar,
  ToggleLeft,
  ToggleRight,
  Search,
  X,
} from 'lucide-react';
import LogoButton from "../components/LogoButton";
import api from '../api/client';

const ClientManagementPage = () => {
  const [clients, setClients] = useState([]);
  const [filteredClients, setFilteredClients] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showInactive, setShowInactive] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState(null);
  const [error, setError] = useState('');

  // Estados do formulário
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    MasterClientId: '',
    password: '',
    company: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [modalError, setModalError] = useState('');

  const [masterClients, setMasterClients] = useState([]);
  const [isLoadingMasterClients, setIsLoadingMasterClients] = useState(false);

  // Carregar clientes
  useEffect(() => {
    fetchClients();
  }, []);

  // Filtrar clientes
  useEffect(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();
    const filtered = clients.filter(client => {
      const masterClientName = client.masterClient?.name || '';
      const matchesSearch =
        client.name.toLowerCase().includes(normalizedSearch) ||
        client.email.toLowerCase().includes(normalizedSearch) ||
        (client.company && client.company.toLowerCase().includes(normalizedSearch)) ||
        masterClientName.toLowerCase().includes(normalizedSearch);
      
      const matchesStatus = showInactive ? true : client.isActive;
      
      return matchesSearch && matchesStatus;
    });
    
    setFilteredClients(filtered);
  }, [clients, searchTerm, showInactive]);

  // Busca MasterClients quando o modal é aberto
  useEffect(() => {
    if (!isModalOpen) return;

    const fetchMasterClients = async () => {
      setIsLoadingMasterClients(true);
      setModalError('');
      try {
        const { data } = await api.get('/master-clients');
        setMasterClients(data || []);
      } catch (err) {
        console.error('Erro ao buscar Master Clients:', err);
        const message =
          err.response?.data?.error ||
          err.message ||
          'Não foi possível carregar a lista de empresas.';
        setModalError(message);
        setMasterClients([]);
      } finally {
        setIsLoadingMasterClients(false);
      }
    };

    fetchMasterClients();
  }, [isModalOpen]);

  const fetchClients = async () => {
    try {
      const { data } = await api.get('/clients');
      setClients(data);
      setError('');
    } catch (err) {
      const message = err.response?.data?.error || err.message || 'Falha ao carregar clientes';
      setError('Erro ao carregar clientes: ' + message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenModal = (client = null) => {
    if (client) {
      setEditingClient(client);
      setFormData({
        name: client.name || '',
        email: client.email || '',
        MasterClientId: client.MasterClientId
          ? String(client.MasterClientId)
          : client.masterClient?.id
          ? String(client.masterClient.id)
          : '',
        password: '',
        company: client.company || '',
      });
    } else {
      setEditingClient(null);
      setFormData({
        name: '',
        email: '',
        MasterClientId: '',
        password: '',
        company: '',
      });
    }
    setIsModalOpen(true);
    setShowPassword(false);
    setModalError('');
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingClient(null);
    setFormData({
      name: '',
      email: '',
      MasterClientId: '',
      password: '',
      company: '',
    });
    setModalError('');
    setShowPassword(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (
      !formData.name.trim() ||
      !formData.email.trim() ||
      !formData.MasterClientId ||
      (!editingClient && !formData.password)
    ) {
      setModalError('Preencha todos os campos obrigatórios (*)');
      return;
    }

    setIsSubmitting(true);
    setModalError('');

    try {
      const url = editingClient ? `/clients/${editingClient.id}` : '/clients';
      const method = editingClient ? 'put' : 'post';

      const payload = {
        name: formData.name.trim(),
        email: formData.email.trim(),
        MasterClientId: parseInt(formData.MasterClientId, 10),
        company: formData.company.trim() || null,
      };

      if (editingClient) {
        payload.isActive = editingClient.isActive;
      }

      if (!editingClient || formData.password) {
        if (!formData.password) {
          setModalError('Senha é obrigatória para novos clientes.');
          setIsSubmitting(false);
          return;
        }
        payload.password = formData.password;
      }

      const { data: savedClient } = await api.request({ method, url, data: payload });

      if (editingClient) {
        setClients(prev =>
          prev.map(client =>
            client.id === editingClient.id ? savedClient : client
          )
        );
        toast.success('Cliente atualizado!');
      } else {
        setClients(prev =>
          [savedClient, ...prev].sort((a, b) => a.name.localeCompare(b.name))
        );
        toast.success('Cliente criado!');
      }

      handleCloseModal();
    } catch (err) {
      const message =
        err.response?.data?.error || err.message || 'Erro ao salvar cliente';
      setModalError(message);
      console.error('Erro ao salvar cliente:', err.response?.data || err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleStatus = async (clientId) => {
    try {
      const { data: updatedClient } = await api.patch(`/clients/${clientId}/toggle-status`);
      setClients(prev =>
        prev.map(client =>
          client.id === clientId ? updatedClient : client
        )
      );
      toast.success(
        `Cliente ${updatedClient.isActive ? 'reativado' : 'desativado'} com sucesso.`
      );
    } catch (err) {
      const message = err.response?.data?.error || err.message || 'Erro ao alterar status';
      toast.error('Erro ao alterar status: ' + message);
    }
  };

  const handleViewCampaigns = async (clientId) => {
    try {
      const { data } = await api.get(`/clients/${clientId}/campaigns`);
      
      if (data.campaigns.length === 0) {
        toast('Este cliente ainda não tem campanhas atribuídas.');
      } else {
        toast.custom((t) => (
          <div className="px-4 py-3 bg-white rounded-lg shadow-lg border border-slate-200 text-slate-700">
            <p className="text-sm font-semibold">Campanhas de {data.client.name}</p>
            <ul className="mt-2 text-xs space-y-1 list-disc list-inside">
              {data.campaigns.map((c) => (
                <li key={c.id}>{c.name} ({c.status})</li>
              ))}
            </ul>
          </div>
        ), { duration: 5000 });
      }
    } catch (err) {
      const message = err.response?.data?.error || err.message || 'Erro ao carregar campanhas';
      toast.error('Erro ao carregar campanhas: ' + message);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[#ffc801] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600">Carregando clientes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <header className="bg-white shadow-xl border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-start sm:items-center gap-4 sm:gap-6">
              <LogoButton imageClassName="w-24 sm:w-28 md:w-32" />
              <div className="sm:border-l sm:border-slate-300 sm:pl-6">
                <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
                  Gerenciamento de Clientes
                </h1>
                <p className="text-base sm:text-lg text-slate-600 font-medium">
                  Cadastre e gerencie seus clientes
                </p>
              </div>
            </div>
            
            <button
              onClick={() => handleOpenModal()}
              className="self-start sm:self-auto flex items-center px-5 sm:px-6 py-2.5 sm:py-3 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white font-semibold rounded-xl hover:shadow-lg transform hover:scale-105 transition-all"
            >
              <Plus className="w-5 h-5 mr-2" />
              Novo Cliente
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-10 sm:py-12">
        {/* Filtros e Busca */}
        <div className="bg-white p-6 rounded-2xl shadow-lg border border-slate-200 mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            {/* Busca */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar por nome, email ou empresa mestre..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl focus:border-[#ffc801] focus:ring-2 focus:ring-[#ffc801]/20 outline-none transition-all"
              />
            </div>

            {/* Toggle para mostrar inativos */}
            <div className="flex items-center space-x-3">
              <span className="text-sm font-medium text-slate-700">Mostrar inativos</span>
              <button
                onClick={() => setShowInactive(!showInactive)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  showInactive ? 'bg-[#ffc801]' : 'bg-slate-200'
                }`}
              >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  showInactive ? 'translate-x-6' : 'translate-x-1'
                }`} />
              </button>
            </div>

            {/* Contador */}
            <div className="text-sm text-slate-600">
              {filteredClients.length} de {clients.length} cliente{clients.length !== 1 ? 's' : ''}
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-8">
            <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
              {error}
            </div>
          </div>
        )}

        {/* Lista de Clientes */}
        {filteredClients.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-2xl shadow-lg border border-slate-200">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Users className="w-8 h-8 text-slate-400" />
            </div>
            <h3 className="text-xl font-semibold text-slate-600 mb-2">
              {clients.length === 0 ? 'Nenhum cliente cadastrado' : 'Nenhum cliente encontrado'}
            </h3>
            <p className="text-slate-500">
              {clients.length === 0 
                ? 'Comece criando seu primeiro cliente' 
                : 'Tente ajustar os filtros de busca'}
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="text-left px-4 sm:px-6 py-4 text-sm font-semibold text-slate-700">Cliente</th>
                    <th className="text-left px-4 sm:px-6 py-4 text-sm font-semibold text-slate-700">Empresa (Master)</th>
                    <th className="text-left px-4 sm:px-6 py-4 text-sm font-semibold text-slate-700">Status</th>
                    <th className="text-left px-4 sm:px-6 py-4 text-sm font-semibold text-slate-700">Cadastrado em</th>
                    <th className="text-center px-4 sm:px-6 py-4 text-sm font-semibold text-slate-700">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredClients.map((client) => (
                    <tr key={client.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                      <td className="px-4 sm:px-6 py-4">
                        <div>
                          <div className="font-semibold text-slate-800">{client.name}</div>
                          <div className="text-sm text-slate-600 flex items-center mt-1">
                            <Mail className="w-3 h-3 mr-1" />
                            {client.email}
                          </div>
                        </div>
                      </td>
                      
                      <td className="px-4 sm:px-6 py-4">
                        {client.masterClient?.name ? (
                          <div className="flex items-center text-slate-700">
                            <Building className="w-4 h-4 mr-2 text-slate-500 flex-shrink-0" />
                            {client.masterClient.name}
                          </div>
                        ) : client.company ? (
                          <div className="flex items-center text-slate-500 italic">
                            <Building className="w-4 h-4 mr-2 flex-shrink-0" />
                            {client.company}
                          </div>
                        ) : (
                          <span className="text-slate-400 italic">Não informado</span>
                        )}
                      </td>
                      
                      <td className="px-4 sm:px-6 py-4">
                        <button
                          onClick={() => handleToggleStatus(client.id)}
                          className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold transition-colors ${
                            client.isActive
                              ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                          }`}
                        >
                          {client.isActive ? (
                            <>
                              <ToggleRight className="w-4 h-4 mr-1" />
                              Ativo
                            </>
                          ) : (
                            <>
                              <ToggleLeft className="w-4 h-4 mr-1" />
                              Inativo
                            </>
                          )}
                        </button>
                      </td>
                      
                      <td className="px-4 sm:px-6 py-4 text-slate-600">
                        <div className="flex items-center">
                          <Calendar className="w-4 h-4 mr-2" />
                          {formatDate(client.createdAt)}
                        </div>
                      </td>
                      
                      <td className="px-4 sm:px-6 py-4">
                        <div className="flex items-center justify-center space-x-2 sm:space-x-3">
                          <button
                            onClick={() => handleViewCampaigns(client.id)}
                            className="p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Ver campanhas"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          
                          <button
                            onClick={() => handleOpenModal(client)}
                            className="p-2 text-slate-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                            title="Editar cliente"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>

      {/* Modal de Criar/Editar Cliente */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-200 flex justify-between items-center">
              <h3 className="text-xl font-bold text-slate-800">
                {editingClient ? 'Editar Cliente' : 'Novo Cliente'}
              </h3>
              <button 
                onClick={handleCloseModal} 
                className="p-2 hover:bg-slate-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-slate-600" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit}>
              <div className="p-6 space-y-4">
                {modalError && !isLoadingMasterClients && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-red-700 text-sm font-medium">{modalError}</p>
                  </div>
                )}
                
                <div>
                  <label htmlFor="name" className="block text-sm font-semibold text-slate-700 mb-2">
                    Nome Completo *
                  </label>
                  <input 
                    type="text" 
                    id="name" 
                    value={formData.name} 
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full p-3 border border-slate-300 rounded-xl focus:border-[#ffc801] focus:ring-2 focus:ring-[#ffc801]/20 outline-none transition-all" 
                    required 
                    placeholder="Nome do cliente"
                  />
                </div>
                
                <div>
                  <label htmlFor="email" className="block text-sm font-semibold text-slate-700 mb-2">
                    Email *
                  </label>
                  <input 
                    type="email" 
                    id="email" 
                    value={formData.email} 
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    className="w-full p-3 border border-slate-300 rounded-xl focus:border-[#ffc801] focus:ring-2 focus:ring-[#ffc801]/20 outline-none transition-all" 
                    required 
                    placeholder="email@exemplo.com"
                  />
                </div>

                <div>
                  <label htmlFor="masterClient" className="block text-sm font-semibold text-slate-700 mb-2">
                    Empresa Cliente *
                  </label>
                  <select
                    id="masterClient"
                    value={formData.MasterClientId}
                    onChange={(e) => setFormData(prev => ({ ...prev, MasterClientId: e.target.value }))}
                    className="w-full p-3 border border-slate-300 rounded-xl bg-white focus:border-[#ffc801] focus:ring-2 focus:ring-[#ffc801]/20 outline-none appearance-none bg-no-repeat bg-right pr-8 disabled:opacity-50 disabled:bg-slate-50"
                    style={{
                      backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
                      backgroundPosition: 'right 0.75rem center',
                      backgroundSize: '1.5em 1.5em',
                    }}
                    required
                    disabled={isLoadingMasterClients || masterClients.length === 0}
                  >
                    <option value="" disabled>
                      {isLoadingMasterClients ? 'Carregando empresas...' : 'Selecione a empresa'}
                    </option>
                    {masterClients.map((mc) => (
                      <option key={mc.id} value={mc.id}>
                        {mc.name}
                      </option>
                    ))}
                  </select>
                  {!isLoadingMasterClients && masterClients.length === 0 && !modalError && (
                    <p className="text-xs text-slate-500 mt-1">
                      Nenhuma empresa cadastrada. Cadastre uma empresa mestre primeiro.
                    </p>
                  )}
                </div>

                <div>
                  <label htmlFor="company" className="block text-sm font-semibold text-slate-700 mb-2">
                    Detalhe Empresa (Opcional)
                  </label>
                  <input 
                    type="text" 
                    id="company" 
                    value={formData.company} 
                    onChange={(e) => setFormData(prev => ({ ...prev, company: e.target.value }))}
                    className="w-full p-3 border border-slate-300 rounded-xl focus:border-[#ffc801] focus:ring-2 focus:ring-[#ffc801]/20 outline-none transition-all"
                    placeholder="Ex: Departamento Marketing"
                  />
                </div>

                <div>
                  <label htmlFor="password" className="block text-sm font-semibold text-slate-700 mb-2">
                    Senha {editingClient ? '(deixe em branco para não alterar)' : '*'}
                  </label>
                  <div className="relative">
                    <input 
                      type={showPassword ? 'text' : 'password'}
                      id="password" 
                      value={formData.password} 
                      onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                      className="w-full p-3 pr-12 border border-slate-300 rounded-xl focus:border-[#ffc801] focus:ring-2 focus:ring-[#ffc801]/20 outline-none transition-all" 
                      required={!editingClient}
                      placeholder={editingClient ? "Nova senha (opcional)" : "Senha de acesso"}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 text-slate-500 hover:text-slate-700"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center justify-end space-x-4 p-6 bg-slate-50 rounded-b-2xl border-t border-slate-200">
                <button 
                  type="button" 
                  onClick={handleCloseModal} 
                  className="px-6 py-3 text-slate-600 font-semibold hover:text-slate-800 transition-colors"
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  disabled={isSubmitting} 
                  className="px-8 py-3 bg-gradient-to-r from-[#ffc801] to-[#ffb700] text-white font-semibold rounded-xl hover:shadow-lg transform hover:scale-105 transition-all disabled:opacity-50 disabled:transform-none disabled:grayscale"
                >
                  {isSubmitting ? 'Salvando...' : editingClient ? 'Salvar Alterações' : 'Criar Cliente'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClientManagementPage;
