// Em: backend/routes/campaigns.js (VERSÃO FINAL COM DIMENSIONAMENTO INTELIGENTE DE MÍDIA)

const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const multer = require('multer');
const { Op } = require('sequelize');
const PptxGenJS = require('pptxgenjs');
const fetch = require('node-fetch');
const imageSize = require('image-size'); // Importa a biblioteca para ler dimensões

const { Campaign, CreativeLine, Piece, Client } = require('../models');
const { ensureAuth } = require('../auth');
const { convertRawImageIfNeeded } = require('../utils/media');

// --- Configuração e Funções Auxiliares ---
const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}
const upload = multer({ dest: uploadDir });

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
    if (piece.filename) {
      const filePath = path.join(uploadDir, piece.filename);
      if (fs.existsSync(filePath)) {
        fileBuffer = await fs.promises.readFile(filePath);
      }
    } else if (piece.driveId && accessToken) {
      const driveUrl = `https://www.googleapis.com/drive/v3/files/${piece.driveId}?alt=media`;
      const response = await fetch(driveUrl, {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      });
      if (!response.ok) throw new Error(`Falha ao buscar do Drive (${response.status}): ${response.statusText}`);
      fileBuffer = await response.buffer();
    }

    if (fileBuffer) {
      const { buffer: normalizedBuffer, mimetype } = await convertRawImageIfNeeded(fileBuffer, {
        mimetype: piece.mimetype,
        originalName: piece.originalName,
        filename: piece.filename,
      });

      const resolvedMimetype = mimetype || piece.mimetype;

      return {
        buffer: normalizedBuffer,
        base64: `data:${resolvedMimetype};base64,${normalizedBuffer.toString('base64')}`,
        mimetype: resolvedMimetype
      };
    }
    return null;
  } catch (error) {
    console.error(`Erro ao processar a peça ${piece.originalName}:`, error.message);
    return null;
  }
}

// ================== ROTAS EXISTENTES (Sem alterações) ==================

router.get('/', ensureAuth, async (req, res, next) => {
  try {
    const campaigns = await Campaign.findAll({
      where: { createdBy: req.user.id },
      include: [{ model: CreativeLine, as: 'creativeLines', include: [{ model: Piece, as: 'pieces' }] }],
      order: [['createdAt', 'DESC']],
    });
    const payload = campaigns.map(serializeCampaign);
    res.status(200).json(payload);
  } catch (error) { next(error); }
});

router.post('/', ensureAuth, async (req, res, next) => {
  try {
    const { name, client } = req.body;
    if (!name || !client) return res.status(400).json({ error: 'Nome e cliente da campanha são obrigatórios.' });
    const campaign = await Campaign.create({ ...req.body, createdBy: req.user.id, status: 'draft' });
    res.status(201).json(campaign);
  } catch (err) { next(err); }
});

router.put('/:id', ensureAuth, async (req, res, next) => {
  try {
    const { name, client } = req.body;
    if ((name === undefined || name === null) && (client === undefined || client === null)) {
      return res.status(400).json({ error: 'Nenhum dado para atualizar.' });
    }

    const campaign = await Campaign.findOne({ where: { id: req.params.id, createdBy: req.user.id } });
    if (!campaign) return res.status(404).json({ error: 'Campanha não encontrada.' });

    if (name !== undefined) {
      const trimmedName = String(name).trim();
      if (!trimmedName) return res.status(400).json({ error: 'O nome da campanha não pode ser vazio.' });
      campaign.name = trimmedName;
    }

    if (client !== undefined) {
      const trimmedClient = String(client).trim();
      if (!trimmedClient) return res.status(400).json({ error: 'O cliente não pode ser vazio.' });
      campaign.client = trimmedClient;
    }

    await campaign.save();
    res.status(200).json(campaign);
  } catch (err) { next(err); }
});

router.get('/:id', ensureAuth, async (req, res, next) => {
  try {
    const campaign = await Campaign.findOne({
      where: { id: req.params.id, createdBy: req.user.id },
      include: [
        { model: CreativeLine, as: 'creativeLines', include: [{ model: Piece, as: 'pieces', order: [['order', 'ASC']] }] },
        { model: Client, as: 'authorizedClients', through: { attributes: [] } },
      ],
    });
    if (!campaign) return res.status(404).json({ error: 'Campanha não encontrada' });
    res.json(serializeCampaign(campaign));
  } catch (err) { next(err); }
});

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

router.post('/:campaignId/upload', ensureAuth, upload.array('files'), async (req, res, next) => {
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
        filename: file.filename, originalName: file.originalname, mimetype: file.mimetype,
        size: file.size, status: 'uploaded', CreativeLineId: line.id,
        order: currentMaxOrder + index + 1,
      }))
    );
    res.json({ success: true, pieces });
  } catch (error) { next(error); }
});

router.post('/:campaignId/import-from-drive', ensureAuth, async (req, res, next) => {
  try {
    const { campaignId } = req.params;
    const creativeLineId = req.query.creativeLineId || req.body.creativeLineId;
    const { files } = req.body;
    if (!creativeLineId) return res.status(400).json({ error: 'O ID da Linha Criativa é obrigatório.' });
    if (!Array.isArray(files) || files.length === 0) return res.status(400).json({ error: 'Nenhum arquivo do Drive informado.' });
    const creativeLine = await CreativeLine.findOne({ where: { id: creativeLineId, CampaignId: campaignId } });
    if (!creativeLine) return res.status(404).json({ error: 'Linha Criativa não encontrada.' });
    const savedPieces = [];
    let maxOrder = await Piece.max('order', { where: { CreativeLineId: creativeLine.id } });
    let nextOrder = Number.isInteger(maxOrder) ? maxOrder + 1 : 0;
    for (const file of files) {
      const [piece, created] = await Piece.findOrCreate({
        where: { driveId: file.id },
        defaults: {
          originalName: file.name, mimetype: file.mimeType || 'application/octet-stream',
          status: 'imported', CreativeLineId: creativeLine.id, driveId: file.id, size: file.size || null,
          order: nextOrder,
        }
      });
      if (created) {
        savedPieces.push(piece);
        nextOrder += 1;
      }
    }
    res.status(201).json({ saved: savedPieces });
  } catch (error) { next(error); }
});

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

    const filesToRemove = [];
    campaign.creativeLines?.forEach((line) => {
      line.pieces?.forEach((piece) => {
        if (piece.filename) {
          filesToRemove.push(path.join(uploadDir, piece.filename));
        }
      });
    });

    await campaign.destroy();

    await Promise.all(filesToRemove.map(async (filePath) => {
      try {
        await fs.promises.unlink(filePath);
      } catch (err) {
        if (err.code !== 'ENOENT') {
          console.warn(`Falha ao remover arquivo ${filePath}:`, err.message);
        }
      }
    }));

    res.status(204).send();
  } catch (err) { next(err); }
});

// ================== ROTA DE EXPORTAÇÃO DE PPT (FINALÍSSIMA) ==================

router.get('/:id/export-ppt', ensureAuth, async (req, res, next) => {
  try {
    const userAccessToken = req.session?.accessToken;
    if (!userAccessToken) {
        return res.status(403).json({ error: 'Autenticação com Google Drive não encontrada. Por favor, reconecte.' });
    }

    const campaign = await Campaign.findOne({
      where: { id: req.params.id, createdBy: req.user.id },
      include: [{
        model: CreativeLine, as: 'creativeLines', order: [['createdAt', 'ASC']],
        include: [{ model: Piece, as: 'pieces', order: [['order', 'ASC'], ['createdAt', 'ASC']] }],
      }],
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
            const fileData = await getFileData(piece, userAccessToken);
            if (fileData) {
              const area = { w: 6.0, h: 4.5 };
              let mediaDims = { w: area.w, h: area.h }; // Default to area size

              // Calcula as dimensões corretas mantendo a proporção
              if (isImage) {
                try {
                  const dims = imageSize(fileData.buffer);
                  const areaRatio = area.w / area.h;
                  const mediaRatio = dims.width / dims.height;

                  if (mediaRatio > areaRatio) { // Mídia mais larga que a área
                    mediaDims.h = area.w / mediaRatio;
                  } else { // Mídia mais alta ou na mesma proporção
                    mediaDims.w = area.h * mediaRatio;
                  }
                } catch (e) {
                  console.error(`Não foi possível ler as dimensões de ${piece.originalName}, usando tamanho padrão.`);
                }
              }
              // Para vídeos, o pptxgenjs faz um bom trabalho com 'contain', então não precisamos do cálculo manual.

              const mediaOptions = {
                data: fileData.base64,
                x: 3.5 + (area.w - mediaDims.w) / 2, // Centraliza horizontalmente
                y: 0.5 + (area.h - mediaDims.h) / 2, // Centraliza verticalmente
                w: mediaDims.w,
                h: mediaDims.h,
              };

              if (isImage) {
                slidePeca.addImage(mediaOptions);
              } else if (isVideo) {
                slidePeca.addMedia({ ...mediaOptions, type: 'video' });
              }
            } else {
              slidePeca.addText(`[Falha ao carregar: "${piece.originalName}"]`, { placeholder: 'media', align: 'center', color: 'C00000' });
            }
          } else {
            slidePeca.addText(`[Pré-visualização não disponível para "${piece.originalName}"]`, { placeholder: 'media', align: 'center', color: '6c757d' });
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
