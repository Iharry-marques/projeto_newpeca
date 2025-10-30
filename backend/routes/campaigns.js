// Em: backend/routes/campaigns.js
// *** VERSÃO ATUALIZADA QUE SALVA ARQUIVOS DO DRIVE LOCALMENTE ***

const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const multer = require('multer');
const { Op } = require('sequelize');
const PptxGenJS = require('pptxgenjs');
const fetch = require('node-fetch');
const mime = require('mime-types');
const { Campaign, CreativeLine, Piece, Client, MasterClient } = require('../models');
// A rota /auth/google/callback salva o accessToken na sessão
const { ensureAuth } = require('../auth'); 
const {
  convertRawImageIfNeeded,
  downscaleImageIfNeeded,
  getMediaDimensions,
  compressVideoIfNeeded,
} = require('../utils/media');

// --- Configuração e Funções Auxiliares ---
const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}
const UPLOAD_MAX_FILE_BYTES = Number(process.env.UPLOAD_MAX_FILE_BYTES || 200 * 1024 * 1024); // ~200MB
const UPLOAD_MAX_FILE_MB = Math.round(UPLOAD_MAX_FILE_BYTES / (1024 * 1024));
const PPT_MAX_MEDIA_BYTES = Number(process.env.PPT_MAX_MEDIA_BYTES || 40 * 1024 * 1024); // ~40MB

const upload = multer({
  dest: uploadDir,
  limits: { fileSize: UPLOAD_MAX_FILE_BYTES },
});

const handleUpload = (req, res, next) => {
  const uploader = upload.array('files');
  uploader(req, res, (err) => {
    if (err) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(413).json({ error: `Cada arquivo deve ter no máximo ${UPLOAD_MAX_FILE_MB} MB.` });
      }
      return next(err);
    }
    next();
  });
};

const VIDEO_COVER_DATA_URI = (() => {
  const fileNames = ['capa_video.png', 'capa_video.jpg', 'capa_video.jpeg', 'capa_video.webp'];
  const searchDirs = [
    path.join(__dirname, '../assets'),
    path.join(__dirname, '../../frontend/src/assets'),
  ];

  for (const dir of searchDirs) {
    for (const name of fileNames) {
      const fullPath = path.join(dir, name);
      if (fs.existsSync(fullPath)) {
        const mimeType = mime.lookup(fullPath) || 'image/png';
        const base64 = fs.readFileSync(fullPath).toString('base64');
        return `data:${mimeType};base64,${base64}`;
      }
    }
  }
  return null;
})();

function safeFilename(name) {
  return String(name || '').replace(/[^\w.\-() ]/g, '_').slice(0, 200);
}

function sortPieces(pieces = []) {
  return [...pieces].sort((a, b) => {
    const orderA = Number.isInteger(a.order) ? a.order : Number.MAX_SAFE_INTEGER;
    const orderB = Number.isInteger(b.order) ? b.order : Number.MAX_SAFE_INTEGER;
    if (orderA !== orderB) return orderA - orderB;
    const dateA = new Date(a.createdAt || 0).getTime();
    const dateB = new Date(b.createdAt || 0).getTime();
    return dateA - dateB;
  });
}

function serializeCreativeLine(lineInstance) {
  const line = lineInstance?.toJSON ? lineInstance.toJSON() : lineInstance;
  return {
    ...line,
    pieces: sortPieces(line?.pieces || []),
  };
}

function serializeCampaign(campaignInstance) {
  const campaign = campaignInstance?.toJSON ? campaignInstance.toJSON() : campaignInstance;
  return {
    ...campaign,
    // CORREÇÃO: Usa masterClient.name se existir, senão o campo 'client' legado
    client: campaign?.masterClient?.name ?? campaign?.client ?? null,
    creativeLines: (campaign?.creativeLines || [])
      .slice()
      .sort((a, b) => new Date(a.createdAt || 0) - new Date(b.createdAt || 0))
      .map(serializeCreativeLine),
  };
}

// Função agora retorna um objeto com o buffer e o mimetype
async function getFileData(piece, accessToken) {
  try {
    let fileBuffer;
    let sourceMimetype = piece.mimetype; // Mimetype original

    if (piece.filename) {
      // É um arquivo local, apenas leia
      const filePath = path.join(uploadDir, piece.filename);
      if (fs.existsSync(filePath)) {
        fileBuffer = await fs.promises.readFile(filePath);
      }
    } else if (piece.driveId && accessToken) {
      // É um arquivo do Drive, baixe-o
      const driveUrl = `https://www.googleapis.com/drive/v3/files/${piece.driveId}?alt=media`;
      const response = await fetch(driveUrl, {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      });
      if (!response.ok) throw new Error(`Falha ao buscar do Drive (${response.status}): ${response.statusText}`);
      fileBuffer = await response.buffer();
      // O mimetype do Drive (ex: 'application/vnd.google-apps.document') pode ser diferente
      // do mimetype salvo no 'piece' (que pode ser o 'originalName').
      // Vamos confiar no 'piece.mimetype' se ele existir.
      sourceMimetype = piece.mimetype || response.headers.get('content-type') || 'application/octet-stream';

    } else if (piece.driveId && !accessToken) {
        // Caso especial: import-from-drive precisa do token, export-ppt também.
        throw new Error('Access Token do Google Drive não fornecido para peça do Drive.');
    }

    if (fileBuffer) {
      // Normaliza o buffer (converte RAW, etc.)
      let { buffer: normalizedBuffer, mimetype: resolvedMimetype } = await convertRawImageIfNeeded(fileBuffer, {
        mimetype: sourceMimetype, // Usa o mimetype de origem
        originalName: piece.originalName,
        filename: piece.filename, // Pode ser null
      });

      normalizedBuffer = normalizedBuffer || fileBuffer;
      resolvedMimetype = resolvedMimetype || sourceMimetype;

      // Redimensiona imagens muito grandes (para exportação PPT)
      if ((resolvedMimetype || '').startsWith('image/')) {
        const downscaled = await downscaleImageIfNeeded(normalizedBuffer, { mimetype: resolvedMimetype });
        normalizedBuffer = downscaled.buffer || normalizedBuffer;
        resolvedMimetype = downscaled.mimetype || resolvedMimetype;
      }

      let cover = null;

      // Comprime vídeos muito grandes (para exportação PPT)
      if ((resolvedMimetype || '').startsWith('video/')) {
        const compressed = await compressVideoIfNeeded(
          normalizedBuffer,
          {
            mimetype: resolvedMimetype,
            originalName: piece.originalName,
            filename: piece.filename,
          },
          { maxBytes: PPT_MAX_MEDIA_BYTES }
        );
        normalizedBuffer = compressed.buffer || normalizedBuffer;
        resolvedMimetype = compressed.mimetype || resolvedMimetype;
        if (VIDEO_COVER_DATA_URI) {
          cover = VIDEO_COVER_DATA_URI;
        }
      }

      const mediaSizeBytes = normalizedBuffer.byteLength || normalizedBuffer.length || 0;

      // Verifica se o *resultado final* excede o limite do PPT
      if (PPT_MAX_MEDIA_BYTES && mediaSizeBytes > PPT_MAX_MEDIA_BYTES) {
        return {
          buffer: normalizedBuffer, // Retorna o buffer mesmo assim para a ROTA DE IMPORTAÇÃO
          mimetype: resolvedMimetype,
          skipPPT: true, // Adiciona flag para a rota de PPT ignorar
          reason: `Arquivo excede o limite de ${(PPT_MAX_MEDIA_BYTES / (1024 * 1024)).toFixed(1)} MB para inclusão no PPT.`,
        };
      }

      const dimensions = await getMediaDimensions(normalizedBuffer, {
        mimetype: resolvedMimetype,
        originalName: piece.originalName,
        filename: piece.filename,
      });

      return {
        buffer: normalizedBuffer,
        base64: `data:${resolvedMimetype};base64,${normalizedBuffer.toString('base64')}`,
        mimetype: resolvedMimetype,
        width: dimensions?.width || null,
        height: dimensions?.height || null,
        size: mediaSizeBytes, // Retorna o tamanho final do buffer
        cover,
      };
    }
    return null;
  } catch (error) {
    console.error(`Erro ao processar a peça ${piece.originalName} (ID: ${piece.id || piece.driveId}):`, error.message);
    return null;
  }
}

// ================== ROTAS ==================

// GET /
router.get('/', ensureAuth, async (req, res, next) => {
  try {
    const campaigns = await Campaign.findAll({
      where: { createdBy: req.user.id },
      include: [
        {
          model: MasterClient,
          as: 'masterClient',
          attributes: ['id', 'name'],
        },
        {
          model: CreativeLine,
          as: 'creativeLines',
          attributes: ['id'],
          include: [{ model: Piece, as: 'pieces', attributes: ['id'] }],
        },
      ],
      order: [['createdAt', 'DESC']],
    });

    const payload = campaigns.map((campaignInstance) => {
      const campaign = campaignInstance.toJSON();
      const pieceCount =
        campaign.creativeLines?.reduce(
          (acc, line) => acc + (line?.pieces?.length || 0),
          0
        ) || 0;

      return {
        id: campaign.id,
        name: campaign.name,
        // CORREÇÃO: Usa masterClient.name ou 'client' legado
        client: campaign.masterClient?.name || campaign.client || 'Cliente não definido',
        MasterClientId: campaign.MasterClientId,
        status: campaign.status,
        createdAt: campaign.createdAt,
        pieceCount,
        masterClient: campaign.masterClient || null,
        // Adiciona dados para UX no frontend
        sentForApprovalAt: campaign.sentForApprovalAt,
      };
    });

    res.status(200).json(payload);
  } catch (error) {
    next(error);
  }
});

// POST /
router.post('/', ensureAuth, async (req, res, next) => {
  try {
    const { name, MasterClientId } = req.body;

    if (!name || typeof name !== 'string' || !name.trim()) {
      return res.status(400).json({ error: 'Nome da campanha é obrigatório.' });
    }

    // Valida o MasterClientId
    const masterClientIdNum = parseInt(MasterClientId, 10);
    if (Number.isNaN(masterClientIdNum)) {
      return res.status(400).json({ error: 'Cliente é obrigatório.' });
    }

    const masterClientExists = await MasterClient.findByPk(masterClientIdNum);
    if (!masterClientExists) {
      return res.status(400).json({ error: 'Cliente selecionado inválido.' });
    }

    const campaign = await Campaign.create({
      name: name.trim(),
      MasterClientId: masterClientIdNum, // Salva o ID do MasterClient
      createdBy: req.user.id,
      status: 'draft',
      creativeLine: req.body.creativeLine || null, // Campo legado
      startDate: req.body.startDate || null,
      endDate: req.body.endDate || null,
    });

    // Retorna a campanha com o nome do cliente (MasterClient)
    const campaignWithDetails = await Campaign.findByPk(campaign.id, {
      include: [{ model: MasterClient, as: 'masterClient', attributes: ['id', 'name'] }],
    });

    if (campaignWithDetails) {
      const createdCampaign = campaignWithDetails.toJSON();
      res.status(201).json({
        ...createdCampaign,
        client: createdCampaign.masterClient?.name || 'Cliente não definido',
        pieceCount: 0,
      });
      return;
    }

    res.status(201).json(campaign); // Fallback
  } catch (err) {
    if (err.name === 'SequelizeValidationError' || err.name === 'SequelizeUniqueConstraintError') {
      return res
        .status(400)
        .json({ error: err.errors.map((e) => e.message).join(', ') });
    }
    next(err);
  }
});

// PUT /:id (Atualizar Campanha)
router.put('/:id', ensureAuth, async (req, res, next) => {
  try {
    const { name, MasterClientId } = req.body;
    
    const campaign = await Campaign.findOne({ where: { id: req.params.id, createdBy: req.user.id } });
    if (!campaign) return res.status(404).json({ error: 'Campanha não encontrada.' });

    let hasChanges = false;
    let newMasterClient = null;

    if (name !== undefined) {
      const trimmedName = String(name).trim();
      if (!trimmedName) return res.status(400).json({ error: 'O nome da campanha não pode ser vazio.' });
      if (trimmedName !== campaign.name) {
          campaign.name = trimmedName;
          hasChanges = true;
      }
    }

    if (MasterClientId !== undefined) {
        const masterClientIdNum = parseInt(MasterClientId, 10);
        if (Number.isNaN(masterClientIdNum)) {
             return res.status(400).json({ error: 'Cliente inválido.' });
        }
        
        if (masterClientIdNum !== campaign.MasterClientId) {
            newMasterClient = await MasterClient.findByPk(masterClientIdNum);
            if (!newMasterClient) {
                return res.status(400).json({ error: 'Cliente selecionado inválido.' });
            }
            campaign.MasterClientId = masterClientIdNum;
            // Atualiza campo legado 'client' também por consistência, se precisar
            campaign.client = newMasterClient.name; 
            hasChanges = true;
        }
    }
    
    if (!hasChanges) {
         return res.status(200).json(campaign); // Retorna 200 OK
    }

    await campaign.save();

    // Retorna a campanha atualizada com o nome do cliente
    const updatedCampaignJson = campaign.toJSON();
    if (newMasterClient) {
        updatedCampaignJson.client = newMasterClient.name;
    } else if (campaign.client) {
        // Se não mudou o cliente, mas o nome ou outra coisa sim
        // Tenta buscar o nome do cliente atual
        const currentMasterClient = await MasterClient.findByPk(campaign.MasterClientId, { attributes: ['name'] });
        updatedCampaignJson.client = currentMasterClient?.name || campaign.client;
    }

    res.status(200).json(updatedCampaignJson);
  } catch (err) { next(err); }
});

// GET /:id (Detalhes da Campanha)
router.get('/:id', ensureAuth, async (req, res, next) => {
  try {
    const campaign = await Campaign.findOne({
      where: { id: req.params.id, createdBy: req.user.id },
      include: [
        { 
          model: CreativeLine, 
          as: 'creativeLines', 
          include: [{ model: Piece, as: 'pieces', order: [['order', 'ASC']] }] 
        },
        { 
          model: Client, 
          as: 'authorizedClients', 
          through: { attributes: [] } 
        },
        {
          model: MasterClient, // Inclui o MasterClient
          as: 'masterClient',
          attributes: ['id', 'name']
        }
      ],
    });
    if (!campaign) return res.status(404).json({ error: 'Campanha não encontrada' });
    res.json(serializeCampaign(campaign));
  } catch (err) { next(err); }
});

// GET /:campaignId/creative-lines
router.get('/:campaignId/creative-lines', ensureAuth, async (req, res, next) => {
  try {
    const { campaignId } = req.params;
    const campaign = await Campaign.findOne({ where: { id: campaignId, createdBy: req.user.id } });
    if (!campaign) return res.status(404).json({ error: 'Campanha não encontrada' });
    const creativeLines = await CreativeLine.findAll({
      where: { CampaignId: campaignId },
      include: [{ model: Piece, as: 'pieces' }],
      order: [['createdAt', 'ASC']],
    });
    res.status(200).json(creativeLines.map(serializeCreativeLine));
  } catch (error) { next(error); }
});

// POST /:campaignId/creative-lines
router.post('/:campaignId/creative-lines', ensureAuth, async (req, res, next) => {
  try {
    const { campaignId } = req.params;
    const { name } = req.body;
    if (!name || name.trim() === '') return res.status(400).json({ error: 'O nome da linha criativa é obrigatório.' });
    const campaign = await Campaign.findOne({ where: { id: campaignId, createdBy: req.user.id } });
    if (!campaign) return res.status(404).json({ error: 'Campanha não encontrada' });
    const newCreativeLine = await CreativeLine.create({ name: name.trim(), CampaignId: campaignId });
    res.status(201).json(newCreativeLine);
  } catch (error) { next(error); }
});

// POST /:campaignId/upload (Upload Local)
router.post('/:campaignId/upload', ensureAuth, handleUpload, async (req, res, next) => {
  try {
    const { campaignId } = req.params;
    const creativeLineId = req.query.creativeLineId || req.body.creativeLineId;
    const line = await CreativeLine.findOne({ where: { id: creativeLineId, CampaignId: campaignId } });
    if (!line) return res.status(404).json({ error: 'Linha Criativa não encontrada ou não pertence à campanha.' });
    if (!req.files || req.files.length === 0) return res.status(400).json({ error: 'Nenhum arquivo enviado' });
    let currentMaxOrder = await Piece.max('order', { where: { CreativeLineId: line.id } });
    if (!Number.isInteger(currentMaxOrder)) currentMaxOrder = -1;
    const pieces = await Promise.all(
      req.files.map((file, index) => Piece.create({
        filename: file.filename, // Salva o nome do arquivo local
        originalName: file.originalname, 
        mimetype: file.mimetype,
        size: file.size, 
        status: 'pending', // *** NOVO STATUS PADRÃO: pending ***
        CreativeLineId: line.id,
        order: currentMaxOrder + index + 1,
      }))
    );
    res.json({ success: true, pieces });
  } catch (error) { next(error); }
});


// POST /:campaignId/import-from-drive (*** ROTA MODIFICADA ***)
router.post('/:campaignId/import-from-drive', ensureAuth, async (req, res, next) => {
  try {
    const { campaignId } = req.params;
    const creativeLineId = req.query.creativeLineId || req.body.creativeLineId;
    const { files } = req.body;
    
    // 1. Pega o Access Token do Google da sessão do usuário Suno
    const userAccessToken = req.session?.accessToken;
    if (!userAccessToken) {
        return res.status(401).json({ error: 'Token de acesso ao Google Drive não encontrado. Faça login novamente.' });
    }

    if (!creativeLineId) return res.status(400).json({ error: 'O ID da Linha Criativa é obrigatório.' });
    if (!Array.isArray(files) || files.length === 0) return res.status(400).json({ error: 'Nenhum arquivo do Drive informado.' });

    const creativeLine = await CreativeLine.findOne({ where: { id: creativeLineId, CampaignId: campaignId } });
    if (!creativeLine) return res.status(404).json({ error: 'Linha Criativa não encontrada.' });

    let maxOrder = await Piece.max('order', { where: { CreativeLineId: creativeLine.id } });
    let nextOrder = Number.isInteger(maxOrder) ? maxOrder + 1 : 0;
    
    const savedPieces = [];
    
    for (const file of files) {
      // 2. Cria um "pseudo-piece" para a função getFileData
      const pseudoPiece = {
        driveId: file.id,
        mimetype: file.mimeType || 'application/octet-stream',
        originalName: file.name
      };

      // 3. Baixa e processa o arquivo do Drive (converte, etc.)
      const fileData = await getFileData(pseudoPiece, userAccessToken);

      if (!fileData || !fileData.buffer) {
        console.warn(`Falha ao baixar ou processar arquivo do Drive: ${file.name}`);
        continue; // Pula este arquivo
      }

      // 4. Gera um nome de arquivo local único
      const fileExtension = mime.extension(fileData.mimetype) || 'bin';
      const localFilename = `${crypto.randomUUID()}.${fileExtension}`;
      const localFilePath = path.join(uploadDir, localFilename);

      // 5. Salva o buffer baixado no disco local (pasta /uploads)
      await fs.promises.writeFile(localFilePath, fileData.buffer);

      // 6. Cria a peça no banco de dados com o NOVO filename local
      const newPiece = await Piece.create({
          originalName: file.name,
          mimetype: fileData.mimetype,
          size: fileData.size,
          driveId: file.id, // Mantém o driveId para referência futura (ex: exportar PPT)
          filename: localFilename, // *** SALVA O NOME DO ARQUIVO LOCAL ***
          status: 'pending', // *** NOVO STATUS PADRÃO: pending ***
          CreativeLineId: creativeLine.id,
          order: nextOrder,
      });

      savedPieces.push(newPiece);
      nextOrder += 1;
    }
    
    res.status(201).json({ saved: savedPieces });
  } catch (error) { 
    console.error("Erro no import-from-drive:", error);
    next(error); 
  }
});


// DELETE /:id (Deletar Campanha)
router.delete('/:id', ensureAuth, async (req, res, next) => {
  try {
    const campaign = await Campaign.findOne({
      where: { id: req.params.id, createdBy: req.user.id },
      include: [{
        model: CreativeLine,
        as: 'creativeLines',
        include: [{ model: Piece, as: 'pieces' }],
      }],
    });

    if (!campaign) return res.status(404).json({ error: 'Campanha não encontrada.' });

    // Coleta todos os 'filenames' locais para apagar
    const filesToRemove = [];
    campaign.creativeLines?.forEach((line) => {
      line.pieces?.forEach((piece) => {
        if (piece.filename) {
          filesToRemove.push(path.join(uploadDir, piece.filename));
        }
      });
    });

    // Deleta a campanha (em cascata deletará linhas e peças do DB)
    await campaign.destroy();

    // Tenta apagar os arquivos locais
    await Promise.all(filesToRemove.map(async (filePath) => {
      try {
        await fs.promises.unlink(filePath);
      } catch (err) {
        if (err.code !== 'ENOENT') { // Ignora se o arquivo não existir
          console.warn(`Falha ao remover arquivo ${filePath}:`, err.message);
        }
      }
    }));

    res.status(204).send();
  } catch (err) { next(err); }
});


// GET /:id/export-ppt (Exportar PPTX)
router.get('/:id/export-ppt', ensureAuth, async (req, res, next) => {
  try {
    // Token de acesso da sessão do usuário Suno
    const userAccessToken = req.session?.accessToken;
    if (!userAccessToken) {
        return res.status(403).json({ error: 'Autenticação com Google Drive não encontrada. Por favor, reconecte.' });
    }

    const campaign = await Campaign.findOne({
      where: { id: req.params.id, createdBy: req.user.id },
      include: [
        {
          model: MasterClient, // Inclui MasterClient
          as: 'masterClient',
          attributes: ['name']
        },
        {
          model: CreativeLine, as: 'creativeLines', order: [['createdAt', 'ASC']],
          include: [{ model: Piece, as: 'pieces', order: [['order', 'ASC'], ['createdAt', 'ASC']] }],
        }
      ],
    });

    if (!campaign) return res.status(404).json({ error: 'Campanha não encontrada' });

    let pptx = new PptxGenJS();
    pptx.layout = 'LAYOUT_16x9';

    const SUNO_YELLOW = 'FFC801';
    const TEXT_DARK = '0F172A';
    const BG_LIGHT = 'F8FAFC';

    // MASTER SLIDES
    pptx.defineSlideMaster({
      title: 'MASTER_TITLE',
      background: { color: BG_LIGHT },
      objects: [
        { 'rect': { x: 0, y: 3.2, w: '100%', h: 1, fill: { color: SUNO_YELLOW } } },
        { 'placeholder': { options: { name: 'campaignTitle', type: 'title', x: 0.5, y: 2.2, w: 9.0, h: 1, fontFace: 'Montserrat', fontSize: 32, color: TEXT_DARK, bold: true }, text: '' }},
        { 'placeholder': { options: { name: 'lineTitle', type: 'body', x: 0.5, y: 3.4, w: 9.0, h: 0.6, fontFace: 'Montserrat', fontSize: 24, color: TEXT_DARK }, text: '' }},
      ],
    });

    pptx.defineSlideMaster({
        title: 'MASTER_CONTENT_SPLIT',
        background: { color: BG_LIGHT },
    });
    
    // SLIDE 1: Capa
    const COVER_IMAGE_PATH = path.join(__dirname, '../assets/suno-cover.png');
    let slideCapa = pptx.addSlide();
    if (fs.existsSync(COVER_IMAGE_PATH)) {
        const capaBase64 = fs.readFileSync(COVER_IMAGE_PATH, 'base64');
        slideCapa.addImage({ data: `data:image/png;base64,${capaBase64}`, w: '100%', h: '100%' });
    }

    // Itera sobre as Linhas Criativas e Peças
    for (const line of (campaign.creativeLines || [])) {
      if (line.pieces && line.pieces.length > 0) {
        let slideTituloLinha = pptx.addSlide({ masterName: 'MASTER_TITLE' });
        slideTituloLinha.addText(campaign.name, { placeholder: 'campaignTitle' });
        slideTituloLinha.addText(line.name, { placeholder: 'lineTitle' });

        for (const piece of line.pieces) {
          let slidePeca = pptx.addSlide({ masterName: 'MASTER_CONTENT_SPLIT' });
          slidePeca.addText([
            { text: 'Nome da Peça:', options: { fontFace: 'Montserrat', bold: true, breakLine: true } },
            { text: piece.originalName, options: { fontFace: 'Montserrat', fontSize: 12, breakLine: true } },
          ], {
            x: 0.5,
            y: 0.5,
            w: 2.5,
            h: 4.5,
            align: 'left',
            valign: 'top',
            color: TEXT_DARK,
          });

          const isImage = (piece.mimetype || '').startsWith('image/');
          const isVideo = (piece.mimetype || '').startsWith('video/');
          
          if (isImage || isVideo) {
            // *** getFileData AGORA busca local OU drive ***
            // Passamos o 'piece' inteiro (que tem 'filename' ou 'driveId')
            const fileData = await getFileData(piece, userAccessToken);
            
            if (fileData?.skipPPT) { // Verifica a nova flag
              slidePeca.addText(
                fileData.reason || 'Arquivo muito grande para ser incluído no PPT.',
                {
                  x: 3.5,
                  y: 2.2,
                  w: 6.0,
                  h: 1.2,
                  fontFace: 'Montserrat',
                  fontSize: 14,
                  color: 'C00000',
                  align: 'center',
                },
              );
              continue;
            }
            if (fileData && fileData.base64) {
              const area = { w: 6.0, h: 4.5 };
              let mediaDims = { w: area.w, h: area.h }; // Default to área inteira

              if (fileData.width && fileData.height) {
                const areaRatio = area.w / area.h;
                const mediaRatio = fileData.width / fileData.height;

                if (mediaRatio > areaRatio) {
                  mediaDims.h = area.w / mediaRatio;
                } else {
                  mediaDims.w = area.h * mediaRatio;
                }
              }

              const mediaOptions = {
                data: fileData.base64,
                x: 3.5 + (area.w - mediaDims.w) / 2, // Centraliza horizontalmente
                y: 0.5 + (area.h - mediaDims.h) / 2, // Centraliza verticalmente
                w: mediaDims.w,
                h: mediaDims.h,
                cover: fileData.cover || undefined,
              };

              if (isImage) {
                slidePeca.addImage(mediaOptions);
              } else if (isVideo) {
                slidePeca.addMedia({ ...mediaOptions, type: 'video' });
              }
            } else {
              slidePeca.addText(`[Falha ao carregar: "${piece.originalName}"]`, { x: 3.5, y: 2.5, w: 6.0, h: 0.5, align: 'center', color: 'C00000' });
            }
          } else {
            slidePeca.addText(`[Pré-visualização não disponível para "${piece.originalName}"]`, { x: 3.5, y: 2.5, w: 6.0, h: 0.5, align: 'center', color: '6c757d' });
          }
        }
      }
    }

    // SLIDE FINAL: Capa
    let slideFinal = pptx.addSlide();
    if (fs.existsSync(COVER_IMAGE_PATH)) {
        const capaBase64 = fs.readFileSync(COVER_IMAGE_PATH, 'base64');
        slideFinal.addImage({ data: `data:image/png;base64,${capaBase64}`, w: '100%', h: '100%' });
    }

    // Gera e envia o arquivo
    const filename = `${safeFilename(campaign.name)}.pptx`;
    const pptxBuffer = await pptx.write('arraybuffer');
    res.writeHead(200, {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Content-Length': pptxBuffer.byteLength,
    });
    res.end(Buffer.from(pptxBuffer));

  } catch (error) {
    console.error("Erro ao gerar PPT:", error);
    next(error);
  }
});

module.exports = router;