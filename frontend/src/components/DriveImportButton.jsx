// Em: frontend/src/components/DriveImportButton.jsx
import React, { useState, useEffect } from 'react';

export default function DriveImportButton({
  campaignId,
  creativeLineId, // <-- opcional: passe se quiser depurar/enviar junto
  googleAccessToken,
  onImported,
  label = 'Importar do Google Drive',
}) {
  const [busy, setBusy] = useState(false);

  // Aviso útil em dev se algum prop essencial estiver faltando
  useEffect(() => {
    if (import.meta.env.DEV) {
      if (!campaignId) {
        console.warn('[DriveImportButton] campaignId AUSENTE ao montar o componente.');
      } else {
        console.log('[DriveImportButton] campaignId inicial:', campaignId);
      }
      if (creativeLineId) {
        console.log('[DriveImportButton] creativeLineId inicial:', creativeLineId);
      }
    }
  }, [campaignId, creativeLineId]);

  async function handleClick() {
    if (!googleAccessToken) {
      alert('Permissão do Google Drive ausente. Clique em "Conectar ao Google Drive" e tente novamente.');
      return;
    }

    try {
      setBusy(true);

      if (!window.gapi || !window.google?.picker) {
        alert('Não consegui preparar o seletor do Google. Atualize a página e tente de novo.');
        return;
      }

      const { google } = window;

      if (import.meta.env.DEV) {
        const tokenTail = String(googleAccessToken).slice(-6);
        console.log('[DriveImportButton] Clique: preparando Picker', {
          campaignId,
          creativeLineId,
          backendUrl: import.meta.env.VITE_BACKEND_URL,
          apiKeyEndsWith: String(import.meta.env.VITE_GOOGLE_API_KEY || '').slice(-6),
          tokenEndsWith: tokenTail,
        });
      }

      // View padrão (pastas e arquivos)
      const view = new google.picker.DocsView(google.picker.ViewId.DOCS)
        .setIncludeFolders(true)
        .setSelectFolderEnabled(true);
      // Ex.: limitar tipos:
      // .setMimeTypes('image/*,video/*,application/pdf')

      // Callback separado para facilitar logs e try/catch
      const onPickerAction = async (data) => {
        try {
          if (data.action === google.picker.Action.PICKED) {
            const picked = (data.docs || []).map((d) => ({
              id: d.id,
              name: d.name,
              mimeType: d.mimeType,
            }));

            if (import.meta.env.DEV) {
              console.log('[DriveImportButton] Itens selecionados no Picker:', picked);
              console.log('[DriveImportButton] Enviando para o backend.', {
                campaignId,
                creativeLineId,
                filesCount: picked.length,
              });
            }

            const url =
              `${import.meta.env.VITE_BACKEND_URL}` +
              `/campaigns/${encodeURIComponent(campaignId)}/import-from-drive` +
              (creativeLineId ? `?creativeLineId=${encodeURIComponent(creativeLineId)}` : '');

            const res = await fetch(url, {
              method: 'POST',
              credentials: 'include',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ files: picked, creativeLineId }), // mantém no body também, se quiser
            });

            const text = await res.text();
            if (!res.ok) {
              throw new Error(`Falha ao importar do Drive: ${res.status} ${text}`);
            }

            const json = JSON.parse(text);
            if (onImported) onImported(json.saved || []);
            alert(`Importação concluída: ${json.saved?.length || 0} arquivo(s).`);
          } else if (data.action === google.picker.Action.CANCEL) {
            if (import.meta.env.DEV) {
              console.log('[DriveImportButton] Picker cancelado.', { campaignId, creativeLineId });
            }
          }
        } catch (e) {
          console.error('[DriveImportButton] Erro no callback do Picker:', e);
          alert(e.message || 'Erro ao importar do Drive.');
        }
      };

      const picker = new google.picker.PickerBuilder()
        .setDeveloperKey(import.meta.env.VITE_GOOGLE_API_KEY)
        .setOAuthToken(googleAccessToken)
        .addView(view)
        .enableFeature(google.picker.Feature.MULTISELECT_ENABLED)
        .setSize(1050, 650)
        .setCallback(onPickerAction)
        .build();

      picker.setVisible(true);
    } catch (err) {
      console.error('[DriveImportButton] Erro ao abrir o Picker:', err);
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
      data-testid="drive-import-button"
    >
      {busy ? 'Abrindo...' : label}
    </button>
  );
}
