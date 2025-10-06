import React from 'react';
import { X, CheckCircle } from 'lucide-react';

const HelpModal = ({ isOpen, onClose }) => {
    if (!isOpen) return null;

    const steps = [
        "Crie ou selecione uma campanha na barra lateral à esquerda.",
        "Na área principal, crie uma ou mais 'Linhas Criativas' para organizar suas peças.",
        "Adicione peças a uma linha criativa arrastando arquivos para a área indicada ou importando do Google Drive.",
        "Quando terminar de adicionar todas as peças, clique em 'Exportar PPT' no topo para gerar sua apresentação."
    ];

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg" onClick={(e) => e.stopPropagation()}>
                <div className="p-6 border-b border-slate-200 flex justify-between items-center">
                    <h3 className="text-xl font-bold text-slate-800">Como Usar o Aprobi</h3>
                    <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                        <X className="w-5 h-5 text-slate-600" />
                    </button>
                </div>
                <div className="p-8">
                    <ul className="space-y-4">
                        {steps.map((step, index) => (
                            <li key={index} className="flex items-start">
                                <CheckCircle className="w-5 h-5 text-blue-500 mr-3 mt-0.5 flex-shrink-0" />
                                <span className="text-slate-700">{step}</span>
                            </li>
                        ))}
                    </ul>
                </div>
                <div className="p-6 bg-slate-50 rounded-b-2xl text-right">
                    <button
                        onClick={onClose}
                        className="px-6 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-all"
                    >
                        Entendi!
                    </button>
                </div>
            </div>
        </div>
    );
};

export default HelpModal;