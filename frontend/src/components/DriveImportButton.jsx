// Em: frontend/src/components/DriveImportButton.jsx
import React, { useState } from 'react';

export default function DriveImportButton({
  campaignId,
  googleAccessToken,
  onImported,          // callback(piecesCriadas[]) -> opcional
  label = 'Importar do Google Drive',
}) {
  const [busy, setBusy] = useState(false);

  async function loadScript(src) {
    return new Promise((resolve, reject) => {
      const s = document.createElement('script');
      s.src = src;
      s.async = true;
      s.onload = resolve;
      s.onerror = reject;
      document.head.appendChild(s);
    });
  }

  async function handleClick() {
    if (!googleAccessToken) {
      alert('Não foi possível obter a permissão para acessar o Google Drive. Faça login e tente novamente.');
      return;
    }

    try {
      setBusy(true);

      // Carrega a plataforma Google e o Picker
      await loadScript('https://apis.google.com/js/api.js');

      await new Promise((resolve) => {
        window.gapi.load('picker', resolve);
      });

      // Monta a view do Picker
      /* global google */ // (o Picker expõe 'google.picker' no global)
      const view = new google.picker.DocsView()
        .setIncludeFolders(true)
        .setSelectFolderEnabled(true); // se quiser permitir pastas

      const picker = new google.picker.PickerBuilder()
        .setDeveloperKey(import.meta.env.VITE_GOOGLE_API_KEY)
        .setOAuthToken(googleAccessToken)
        .addView(view)
        .setCallback(async (data) => {
          if (data.action === google.picker.Action.PICKED) {
            const picked = data.docs.map(d => ({
              id: d.id,
              name: d.name,
              mimeType: d.mimeType,
            }));

            // Envia para o backend baixar e criar as Pieces
            const res = await fetch(
              `${import.meta.env.VITE_BACKEND_URL}/campaigns/${campaignId}/import-from-drive`,
              {
                method: 'POST',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ files: picked }),
              }
            );

            if (!res.ok) {
              const t = await res.text();
              throw new Error(`Falha ao importar do Drive: ${res.status} ${t}`);
            }

            const json = await res.json();
            if (onImported) onImported(json.saved || []);
            alert(`Importação concluída: ${json.saved?.length || 0} arquivo(s).`);
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
      title="Importar arquivos do seu Google Drive"
    >
      {busy ? 'Abrindo...' : label}
    </button>
  );
}
