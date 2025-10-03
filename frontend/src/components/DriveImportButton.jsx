// Em: frontend/src/components/DriveImportButton.jsx
import React, { useState } from 'react';

export default function DriveImportButton({
  campaignId,
  googleAccessToken,
  onImported,
  label = 'Importar do Google Drive',
}) {
  const [busy, setBusy] = useState(false);

  async function handleClick() {
    if (!googleAccessToken) {
      alert('Permissão do Google Drive ausente. Clique em "Conectar ao Google Drive" e tente novamente.');
      return;
    }

    try {
      setBusy(true);

      // "api.js" e 'picker' já devem estar carregados pelo App.jsx.
      if (!window.gapi || !window.google?.picker) {
        alert('Não consegui preparar o seletor do Google. Atualize a página e tente de novo.');
        return;
      }

      const { google } = window;

      // view padrão de docs (com pastas)
      const view = new google.picker.DocsView(google.picker.ViewId.DOCS)
        .setIncludeFolders(true)
        .setSelectFolderEnabled(true);

      // se quiser limitar os tipos selecionáveis (opcional)
      // .setMimeTypes('image/*,video/*,application/pdf')

      const picker = new google.picker.PickerBuilder()
        .setDeveloperKey(import.meta.env.VITE_GOOGLE_API_KEY)  // a SUA API key deste projeto
        .setOAuthToken(googleAccessToken)                      // token OAuth da sessão
        .addView(view)
        .enableFeature(google.picker.Feature.MULTISELECT_ENABLED) // << multiseleção
        .setSize(1050, 650)                                       // caixa maior
        .setCallback(async (data) => {
          if (data.action === google.picker.Action.PICKED) {
            const picked = data.docs.map((d) => ({
              id: d.id,
              name: d.name,
              mimeType: d.mimeType,
            }));

            try {
              const res = await fetch(
                `${import.meta.env.VITE_BACKEND_URL}/campaigns/${campaignId}/import-from-drive`,
                {
                  method: 'POST',
                  credentials: 'include',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ files: picked }),
                }
              );

              const text = await res.text();
              if (!res.ok) {
                throw new Error(`Falha ao importar do Drive: ${res.status} ${text}`);
              }

              const json = JSON.parse(text);
              if (onImported) onImported(json.saved || []);
              alert(`Importação concluída: ${json.saved?.length || 0} arquivo(s).`);
            } catch (e) {
              console.error(e);
              alert(e.message || 'Erro ao importar do Drive.');
            }
          }
        })
        .build();

      picker.setVisible(true);
    } catch (err) {
      console.error(err);
      alert('Não foi possível abrir o seletor do Google Drive.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={busy}
      className="inline-flex items-center rounded-lg border px-4 py-2 text-sm font-medium"
    >
      {busy ? 'Abrindo...' : label}
    </button>
  );
}
