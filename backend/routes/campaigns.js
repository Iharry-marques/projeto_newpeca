// Em: backend/routes/campaigns.js (VERSÃO FINAL E COMPLETA)

const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const multer = require('multer');
const puppeteer = require('puppeteer');
const { Readable } = require('node:stream');
const { pipeline } = require('node:stream/promises');
const { Op } = require('sequelize');
const PptxGenJS = require('pptxgenjs');


const { Campaign, CreativeLine, Piece, Client, CampaignClient } = require('../models');
// CORREÇÃO: A função de autenticação é exportada como 'ensureAuth' e não 'ensureAuthenticated'
const { ensureAuth } = require('../auth');

// --- Configuração de Upload ---
const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}
const upload = multer({ dest: uploadDir });

// --- Funções Auxiliares ---
async function openBrowser() {
  const execPath = process.env.PUPPETEER_EXECUTABLE_PATH || undefined;
  return puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
    executablePath: execPath,
  });
}

function safeFilename(name) {
  return String(name || '')
    .replace(/[^\w.\-() ]/g, '_')
    .slice(0, 200);
}

function makeApprovalHash() {
  return crypto.randomBytes(16).toString('hex');
}


/* ================== ROTAS DE CAMPANHAS ================== */

// LISTAR todas as campanhas do usuário
router.get('/', ensureAuth, async (req, res, next) => {
  try {
    const campaigns = await Campaign.findAll({
      where: { createdBy: req.user.id },
      include: [{
        model: CreativeLine,
        as: 'creativeLines',
        include: [{ model: Piece, as: 'pieces' }]
      }],
      order: [['createdAt', 'DESC']],
    });
    res.status(200).json(campaigns);
  } catch (error) {
    console.error('Erro ao buscar campanhas:', error);
    next(error);
  }
});

// CRIAR uma nova campanha
router.post('/', ensureAuth, async (req, res, next) => {
  try {
    const { name, client } = req.body;
    if (!name || !client) {
      return res.status(400).json({ error: 'Nome e cliente da campanha são obrigatórios.' });
    }
    const campaign = await Campaign.create({ ...req.body, createdBy: req.user.id, status: 'draft' });
    res.status(201).json(campaign);
  } catch (err) {
    next(err);
  }
});

// BUSCAR uma campanha específica
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
      ],
    });
    if (!campaign) return res.status(404).json({ error: 'Campanha não encontrada' });
    res.json(campaign);
  } catch (err) {
    next(err);
  }
});


/* ================== ROTAS DE LINHAS CRIATIVAS ================== */

// LISTAR linhas criativas de uma campanha
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
    res.status(200).json(creativeLines);
  } catch (error) {
    next(error);
  }
});

// CRIAR linha criativa
router.post('/:campaignId/creative-lines', ensureAuth, async (req, res, next) => {
  try {
    const { campaignId } = req.params;
    const { name } = req.body;
    if (!name || name.trim() === '') return res.status(400).json({ error: 'O nome da linha criativa é obrigatório.' });
    
    const campaign = await Campaign.findOne({ where: { id: campaignId, createdBy: req.user.id } });
    if (!campaign) return res.status(404).json({ error: 'Campanha não encontrada' });

    const newCreativeLine = await CreativeLine.create({ name: name.trim(), CampaignId: campaignId });
    res.status(201).json(newCreativeLine);
  } catch (error) {
    next(error);
  }
});


/* ================== ROTAS DE UPLOAD & IMPORTAÇÃO DE PEÇAS ================== */

// UPLOAD LOCAL (adaptado para o novo fluxo com Linhas Criativas)
router.post('/:campaignId/upload', ensureAuth, upload.array('files'), async (req, res, next) => {
  try {
    const { campaignId } = req.params;
    const creativeLineId = req.query.creativeLineId || req.body.creativeLineId;

    const line = await CreativeLine.findOne({ where: { id: creativeLineId, CampaignId: campaignId } });
    if (!line) return res.status(404).json({ error: 'Linha Criativa não encontrada ou não pertence à campanha.' });

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'Nenhum arquivo enviado' });
    }

    const pieces = await Promise.all(
      req.files.map((file) =>
        Piece.create({
          filename: file.filename,
          originalName: file.originalname,
          mimetype: file.mimetype,
          size: file.size,
          status: 'uploaded',
          CreativeLineId: line.id, // CORRIGIDO
        })
      )
    );
    res.json({ success: true, pieces });
  } catch (error) {
    next(error);
  }
});

// IMPORTAÇÃO DO GOOGLE DRIVE (CORRIGIDO)
router.post('/:campaignId/import-from-drive', ensureAuth, async (req, res, next) => {
  try {
    const { campaignId } = req.params;
    const creativeLineId = req.query.creativeLineId || req.body.creativeLineId;
    const { files } = req.body;

    if (!creativeLineId) {
      return res.status(400).json({ error: 'O ID da Linha Criativa é obrigatório.' });
    }
    if (!Array.isArray(files) || files.length === 0) {
      return res.status(400).json({ error: 'Nenhum arquivo do Drive informado.' });
    }

    const creativeLine = await CreativeLine.findOne({
      where: { id: creativeLineId, CampaignId: campaignId },
    });

    if (!creativeLine) {
      return res.status(404).json({ error: 'Linha Criativa não encontrada ou não pertence a esta campanha.' });
    }

    const savedPieces = [];
    for (const file of files) {
      const [piece, created] = await Piece.findOrCreate({
        where: { driveId: file.id },
        defaults: {
          originalName: file.name,
          mimetype: file.mimeType || 'application/octet-stream',
          status: 'imported',
          CreativeLineId: creativeLine.id, // CORRIGIDO
          driveId: file.id,
          size: file.size || null,
        }
      });
      if (created) {
        savedPieces.push(piece);
      }
    }
    res.status(201).json({ saved: savedPieces });
  } catch (error) {
    next(error);
  }
});


/* ================== ROTAS DE ENVIO E APROVAÇÃO ================== */

router.post('/:id/send-for-approval', ensureAuth, async (req, res, next) => {
  try {
    const campaignId = req.params.id;
    const { clientIds } = req.body || {};

    const campaign = await Campaign.findOne({ where: { id: campaignId, createdBy: req.user.id } });
    if (!campaign) return res.status(404).json({ error: 'Campanha não encontrada' });

    const lines = await CreativeLine.findAll({
      where: { CampaignId: campaignId },
      include: [{ model: Piece, as: 'pieces' }]
    });

    const readyStatuses = ['uploaded', 'imported'];
    const pieceIdsToSend = lines.flatMap(line => line.pieces.filter(p => readyStatuses.includes(p.status)).map(p => p.id));

    if (pieceIdsToSend.length === 0) {
      return res.status(400).json({ error: 'Não há peças prontas para enviar nesta campanha.' });
    }

    await Piece.update({ status: 'pending' }, { where: { id: { [Op.in]: pieceIdsToSend } } });

    let approvalHash = campaign.approvalHash || makeApprovalHash();

    await campaign.update({
      status: 'sent_for_approval',
      sentForApprovalAt: new Date(),
      approvalHash: approvalHash, // Garante que o hash está salvo
    });

    if (Array.isArray(clientIds) && clientIds.length > 0) {
      await Promise.all(clientIds.map(clientId => CampaignClient.upsert({ campaignId, clientId, assignedAt: new Date() })));
    }

    const approvalLinkBase = process.env.FRONTEND_URL || '';
    res.json({
      success: true,
      message: 'Campanha enviada para aprovação com sucesso',
      campaign: {
        id: campaign.id,
        approvalLink: approvalLinkBase ? `${approvalLinkBase}/client/approval/${approvalHash}` : null,
      },
    });
  } catch (error) {
    next(error);
  }
});

/* ================== ROTA DE EXPORTAÇÃO DE PDF ================== */

router.get('/:id/export-pdf', ensureAuth, async (req, res, next) => {
  try {
    const campaignId = req.params.id;
    const campaign = await Campaign.findOne({
      where: { id: campaignId, createdBy: req.user.id },
      include: [{ model: CreativeLine, as: 'creativeLines', include: [{ model: Piece, as: 'pieces' }] }],
    });

    if (!campaign) return res.status(404).json({ error: 'Campanha não encontrada' });

    const approvedByLine = (campaign.creativeLines || [])
      .map(line => ({
        lineName: line.name,
        pieces: (line.pieces || []).filter(p => p.status === 'approved'),
      }))
      .filter(bloc => bloc.pieces.length > 0);

    if (approvedByLine.length === 0) {
      return res.status(400).json({ error: 'Não há peças aprovadas para exportar' });
    }

    const frontendBase = process.env.FRONTEND_URL || '';
    const todayBR = new Date().toLocaleDateString('pt-BR');

    const html = `<!DOCTYPE html>
      <html><head><title>Peças Aprovadas - ${campaign.name}</title></head>
      <body>
        <h1>${campaign.name}</h1>
        <p><strong>Cliente:</strong> ${campaign.client}</p>
        <p><strong>Data de Exportação:</strong> ${todayBR}</p>
        ${approvedByLine.map(bloc => `
          <h2>Linha Criativa: ${bloc.lineName}</h2>
          ${bloc.pieces.map(piece => {
            const isImage = (piece.mimetype || '').startsWith('image/');
            const src = piece.driveId ? `https://drive.google.com/uc?export=view&id=${piece.driveId}` : `${frontendBase}/campaigns/files/${encodeURIComponent(piece.filename)}`;
            return `
              <div>
                <h3>${piece.originalName}</h3>
                ${isImage ? `<img src="${src}" style="max-width: 500px;">` : `<p>Arquivo não visualizável: ${piece.originalName}</p>`}
                <p style="color: green;">✅ APROVADA</p>
              </div>
            `;
          }).join('')}
        `).join('')}
      </body></html>`;

    const browser = await openBrowser();
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'load' });
    const pdfBuffer = await page.pdf({ format: 'A4', printBackground: true });
    await browser.close();

    const filename = `${safeFilename(campaign.name)}_aprovadas.pdf`;
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(pdfBuffer);
  } catch (error) {
    next(error);
  }
});

/* ================== ROTA PARA SERVIR ARQUIVOS LOCAIS ================== */

router.get('/files/:filename', (req, res) => {
  const filePath = path.join(uploadDir, req.params.filename);
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: 'Arquivo não encontrado' });
  }
  res.sendFile(filePath);
});

/* ================== ROTA DE EXPORTAÇÃO DE PPT ================== */
router.get('/:id/export-ppt', ensureAuth, async (req, res, next) => {
  try {
    const campaignId = req.params.id;
    const campaign = await Campaign.findOne({
      where: { id: campaignId, createdBy: req.user.id },
      include: [{
        model: CreativeLine,
        as: 'creativeLines',
        order: [['createdAt', 'ASC']], // Ordena as linhas criativas
        include: [{
          model: Piece,
          as: 'pieces',
          order: [['order', 'ASC'], ['createdAt', 'ASC']], // Ordena as peças
        }],
      }],
    });

    if (!campaign) {
      return res.status(404).json({ error: 'Campanha não encontrada' });
    }

    // 1. Inicia a apresentação
    let pptx = new PptxGenJS();
    pptx.layout = 'LAYOUT_16x9'; // Layout widescreen padrão

    const GREEN_BG = '00B050';
    const WHITE_TEXT = 'FFFFFF';
    const COVER_IMAGE_PATH = path.join(__dirname, '../assets/suno-cover.png');

    // 2. SLIDE 1: Capa Inicial
    let slideCapa = pptx.addSlide();
    slideCapa.addImage({ path: COVER_IMAGE_PATH, w: '100%', h: '100%' });

    // 3. SLIDE 2: Título da Campanha
    let slideTituloCampanha = pptx.addSlide();
    slideTituloCampanha.background = { color: GREEN_BG };
    slideTituloCampanha.addText(campaign.name, { 
        align: 'center', y: '40%', w: '100%', 
        color: WHITE_TEXT, fontSize: 40, bold: true 
    });

    // 4. Itera sobre cada Linha Criativa e suas Peças
    for (const line of (campaign.creativeLines || [])) {
      // SLIDE TÍTULO DA LINHA CRIATIVA
      let slideTituloLinha = pptx.addSlide();
      slideTituloLinha.background = { color: GREEN_BG };
      slideTituloLinha.addText(line.name, { 
          align: 'center', y: '40%', w: '100%', 
          color: WHITE_TEXT, fontSize: 32 
      });

      // SLIDES DE CONTEÚDO (PEÇAS)
      for (const piece of (line.pieces || [])) {
        let slidePeca = pptx.addSlide();
        const isImage = (piece.mimetype || '').startsWith('image/');

        // Define a URL da imagem, seja do Drive ou de upload local
        const imageUrl = piece.driveId 
          ? `https://drive.google.com/uc?export=view&id=${piece.driveId}` 
          : (piece.filename ? `${process.env.BACKEND_URL || `http://localhost:${process.env.PORT || 3000}`}/campaigns/files/${piece.filename}` : null);

        if (isImage && imageUrl) {
          // Adiciona a imagem centralizada
          slidePeca.addImage({ path: imageUrl, x: '5%', y: '15%', w: '90%', h: '70%' });
          
          // Adiciona o "molde verde" com o nome da peça
          slidePeca.addText(piece.originalName, {
            x: '5%', y: '10%', w: '90%', h: 0.5,
            align: 'center', fill: { color: GREEN_BG }, color: WHITE_TEXT,
            fontSize: 14,
          });
        } else {
          slidePeca.addText(`[Pré-visualização não disponível para "${piece.originalName}"]`, { 
              x: 0, y: '45%', w: '100%', align: 'center', color: '6c757d' 
          });
        }
      }
    }

    // 5. SLIDE FINAL: Repete a capa
    let slideFinal = pptx.addSlide();
    slideFinal.addImage({ path: COVER_IMAGE_PATH, w: '100%', h: '100%' });


    // 6. Gera o arquivo e envia para o usuário
    const filename = `${safeFilename(campaign.name)}.pptx`;
    res.writeHead(200, {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'Content-Disposition': `attachment; filename=${filename}`,
    });
    const data = await pptx.stream();
    res.end(data);

  } catch (error) {
    console.error("Erro ao gerar PPT:", error);
    next(error);
  }
});

module.exports = router;