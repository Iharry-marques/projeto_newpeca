// frontend/src/ClientManagementPage.jsx

import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { 
  Users, 
  Plus, 
  Edit2, 
  Trash2, 
  Eye, 
  EyeOff, 
  Building, 
  Mail, 
  Calendar,
  ToggleLeft,
  ToggleRight,
  Search,
  X
} from 'lucide-react';
import aprobiLogo from "../assets/aprobi-logo.jpg";

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
    company: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Carregar clientes
  useEffect(() => {
    fetchClients();
  }, []);

  // Filtrar clientes
  useEffect(() => {
    let filtered = clients.filter(client => {
      const matchesSearch = client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           client.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           (client.company && client.company.toLowerCase().includes(searchTerm.toLowerCase()));
      
      const matchesStatus = showInactive ? true : client.isActive;
      
      return matchesSearch && matchesStatus;
    });
    
    setFilteredClients(filtered);
  }, [clients, searchTerm, showInactive]);

  const fetchClients = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/clients`, {
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Falha ao carregar clientes');
      }

      const data = await response.json();
      setClients(data);
    } catch (err) {
      setError('Erro ao carregar clientes: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenModal = (client = null) => {
    if (client) {
      setEditingClient(client);
      setFormData({
        name: client.name,
        email: client.email,
        company: client.company || '',
        password: ''
      });
    } else {
      setEditingClient(null);
      setFormData({
        name: '',
        email: '',
        company: '',
        password: ''
      });
    }
    setIsModalOpen(true);
    setShowPassword(false);
    setError('');
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingClient(null);
    setFormData({ name: '', email: '', company: '', password: '' });
    setError('');
    setShowPassword(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name || !formData.email || (!editingClient && !formData.password)) {
      setError('Preencha todos os campos obrigatórios');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const url = editingClient 
        ? `${import.meta.env.VITE_BACKEND_URL}/clients/${editingClient.id}`
        : `${import.meta.env.VITE_BACKEND_URL}/clients`;
      
      const method = editingClient ? 'PUT' : 'POST';
      
      const body = { ...formData };
      if (editingClient && !formData.password) {
        delete body.password; // Não enviar senha vazia em edição
      }

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao salvar cliente');
      }

      const savedClient = await response.json();
      
      if (editingClient) {
        setClients(prev => prev.map(client => 
          client.id === editingClient.id ? savedClient : client
        ));
      } else {
        setClients(prev => [savedClient, ...prev]);
      }

      handleCloseModal();
      toast.success(editingClient ? 'Cliente atualizado com sucesso!' : 'Cliente criado com sucesso!');
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleStatus = async (clientId, currentStatus) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/clients/${clientId}/toggle-status`, {
        method: 'PATCH',
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Erro ao alterar status');
      }

      const updatedClient = await response.json();
      setClients(prev => prev.map(client => 
        client.id === clientId ? updatedClient : client
      ));
      toast.success(`Cliente ${updatedClient.isActive ? 'reativado' : 'desativado'} com sucesso.`);
    } catch (err) {
      toast.error('Erro ao alterar status: ' + err.message);
    }
  };

  const handleViewCampaigns = async (clientId) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/clients/${clientId}/campaigns`, {
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Erro ao carregar campanhas');
      }

      const data = await response.json();
      
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
      toast.error('Erro ao carregar campanhas: ' + err.message);
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
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-6">
              <img src={aprobiLogo} alt="Aprobi Logo" className="w-32 h-auto" />
              <div className="border-l border-slate-300 pl-6">
                <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
                  Gerenciamento de Clientes
                </h1>
                <p className="text-lg text-slate-600 font-medium">
                  Cadastre e gerencie seus clientes
                </p>
              </div>
            </div>
            
            <button
              onClick={() => handleOpenModal()}
              className="flex items-center px-6 py-3 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white font-semibold rounded-xl hover:shadow-lg transform hover:scale-105 transition-all"
            >
              <Plus className="w-5 h-5 mr-2" />
              Novo Cliente
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-12">
        {/* Filtros e Busca */}
        <div className="bg-white p-6 rounded-2xl shadow-lg border border-slate-200 mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            {/* Busca */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar por nome, email ou empresa..."
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
                    <th className="text-left p-6 text-sm font-semibold text-slate-700">Cliente</th>
                    <th className="text-left p-6 text-sm font-semibold text-slate-700">Empresa</th>
                    <th className="text-left p-6 text-sm font-semibold text-slate-700">Status</th>
                    <th className="text-left p-6 text-sm font-semibold text-slate-700">Cadastrado em</th>
                    <th className="text-center p-6 text-sm font-semibold text-slate-700">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredClients.map((client) => (
                    <tr key={client.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                      <td className="p-6">
                        <div>
                          <div className="font-semibold text-slate-800">{client.name}</div>
                          <div className="text-sm text-slate-600 flex items-center mt-1">
                            <Mail className="w-3 h-3 mr-1" />
                            {client.email}
                          </div>
                        </div>
                      </td>
                      
                      <td className="p-6">
                        {client.company ? (
                          <div className="flex items-center text-slate-700">
                            <Building className="w-4 h-4 mr-2 text-slate-500" />
                            {client.company}
                          </div>
                        ) : (
                          <span className="text-slate-400 italic">Não informado</span>
                        )}
                      </td>
                      
                      <td className="p-6">
                        <button
                          onClick={() => handleToggleStatus(client.id, client.isActive)}
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
                      
                      <td className="p-6 text-slate-600">
                        <div className="flex items-center">
                          <Calendar className="w-4 h-4 mr-2" />
                          {formatDate(client.createdAt)}
                        </div>
                      </td>
                      
                      <td className="p-6">
                        <div className="flex items-center justify-center space-x-2">
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
                {error && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-red-700 text-sm font-medium">{error}</p>
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
                  <label htmlFor="company" className="block text-sm font-semibold text-slate-700 mb-2">
                    Empresa
                  </label>
                  <input 
                    type="text" 
                    id="company" 
                    value={formData.company} 
                    onChange={(e) => setFormData(prev => ({ ...prev, company: e.target.value }))}
                    className="w-full p-3 border border-slate-300 rounded-xl focus:border-[#ffc801] focus:ring-2 focus:ring-[#ffc801]/20 outline-none transition-all"
                    placeholder="Nome da empresa (opcional)"
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
