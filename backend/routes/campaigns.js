// Em: backend/routes/campaigns.js 

const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const multer = require('multer');
const puppeteer = require('puppeteer');
const { Op } = require('sequelize');
const PptxGenJS = require('pptxgenjs');
const fetch = require('node-fetch'); // Importe o node-fetch

const { Campaign, CreativeLine, Piece, Client, CampaignClient } = require('../models');
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

function inferImageMimeFromName(name = '') {
  const ext = name.toLowerCase().split('.').pop();
  switch (ext) {
    case 'jpg':
    case 'jpeg':
      return 'image/jpeg';
    case 'gif':
      return 'image/gif';
    case 'webp':
      return 'image/webp';
    case 'svg':
    case 'svg+xml':
      return 'image/svg+xml';
    case 'bmp':
      return 'image/bmp';
    case 'heic':
      return 'image/heic';
    case 'png':
    default:
      return 'image/png';
  }
}

// ================== ROTAS DE CAMPANHAS (Sem alterações) ==================
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


// ================== ROTAS DE LINHAS CRIATIVAS (Sem alterações) ==================
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


// ================== ROTAS DE UPLOAD & IMPORTAÇÃO DE PEÇAS (Sem alterações) ==================
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
          CreativeLineId: line.id,
        })
      )
    );
    res.json({ success: true, pieces });
  } catch (error) {
    next(error);
  }
});

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
          CreativeLineId: creativeLine.id,
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


// ================== ROTAS DE ENVIO E APROVAÇÃO (Sem alterações) ==================
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

// ================== ROTA DE EXPORTAÇÃO DE PDF (Sem alterações) ==================
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


// ================== ROTA DE EXPORTAÇÃO DE PPT (MODIFICADA) ==================

// NOVA FUNÇÃO para buscar a imagem e converter para Base64
async function getImageAsBase64(piece, options = {}) {
  const { accessToken, mimeOverride } = options;
  const targetMime = mimeOverride || piece.mimetype || 'image/png';
  try {
    // Se for arquivo local
    if (piece.filename) {
      const filePath = path.join(uploadDir, piece.filename);
      if (fs.existsSync(filePath)) {
        const fileBuffer = await fs.promises.readFile(filePath);
        return `data:${targetMime};base64,${fileBuffer.toString('base64')}`;
      }
    }
    // Se for do Google Drive
    if (piece.driveId) {
      // Quando temos o token, usamos a API oficial do Drive; caso contrário, caímos no link público.
      const headers = {};
      let driveUrl = `https://drive.google.com/uc?export=download&id=${piece.driveId}`;

      if (accessToken) {
        headers.Authorization = `Bearer ${accessToken}`;
        driveUrl = `https://www.googleapis.com/drive/v3/files/${piece.driveId}?alt=media`;
      }

      const response = await fetch(driveUrl, { headers });
      if (!response.ok) {
        throw new Error(`Failed to fetch from Drive (${response.status}): ${response.statusText}`);
      }

      const contentType = response.headers.get('content-type') || targetMime || 'application/octet-stream';
      if (!contentType.startsWith('image/')) {
        throw new Error(`Conteúdo inválido recebido do Drive (${contentType})`);
      }

      const imageBuffer = await response.buffer();
      const mime = contentType.startsWith('image/') ? contentType : targetMime;
      return `data:${mime};base64,${imageBuffer.toString('base64')}`;
    }
    return null;
  } catch (error) {
    console.error(`Erro ao processar a peça ${piece.originalName}:`, error.message);
    return null; // Retorna nulo se falhar, para não quebrar a geração
  }
}

router.get('/:id/export-ppt', ensureAuth, async (req, res, next) => {
  try {
    const driveAccessToken = req.session?.accessToken || null;
    if (!driveAccessToken) {
      console.warn('[export-ppt] Nenhum token do Google Drive encontrado na sessão. Tentando links públicos.');
    }

    const campaignId = req.params.id;
    const campaign = await Campaign.findOne({
      where: { id: campaignId, createdBy: req.user.id },
      include: [{
        model: CreativeLine,
        as: 'creativeLines',
        order: [['createdAt', 'ASC']],
        include: [{
          model: Piece,
          as: 'pieces',
          order: [['order', 'ASC'], ['createdAt', 'ASC']],
        }],
      }],
    });

    if (!campaign) {
      return res.status(404).json({ error: 'Campanha não encontrada' });
    }

    // 1. Inicia a apresentação
    let pptx = new PptxGenJS();
    pptx.layout = 'LAYOUT_16x9';

    const GREEN_BG = '00B050';
    const WHITE_TEXT = 'FFFFFF';
    const COVER_IMAGE_PATH = path.join(__dirname, '../assets/suno-cover.png');

    // 2. SLIDE 1: Capa Inicial
    let slideCapa = pptx.addSlide();
    const capaBase64 = fs.readFileSync(COVER_IMAGE_PATH, 'base64');
    slideCapa.addImage({ data: `data:image/png;base64,${capaBase64}`, w: '100%', h: '100%' });
    
    // 3. SLIDE 2: Título da Campanha (FUNDO VERDE)
    let slideTituloCampanha = pptx.addSlide();
    slideTituloCampanha.background = { color: GREEN_BG };
    slideTituloCampanha.addText(campaign.name, { 
        align: 'center', y: '40%', w: '100%', 
        color: WHITE_TEXT, fontSize: 40, bold: true 
    });

    // 4. Itera sobre cada Linha Criativa e suas Peças
    for (const line of (campaign.creativeLines || [])) {
      // SLIDE TÍTULO DA LINHA CRIATIVA (FUNDO VERDE)
      let slideTituloLinha = pptx.addSlide();
      slideTituloLinha.background = { color: GREEN_BG };
      slideTituloLinha.addText(line.name, { 
          align: 'center', y: '40%', w: '100%', 
          color: WHITE_TEXT, fontSize: 32 
      });

      // SLIDES DE CONTEÚDO (PEÇAS)
      for (const piece of (line.pieces || [])) {
        let slidePeca = pptx.addSlide();
        const hasImageMime = (piece.mimetype || '').startsWith('image/');
        const nameLooksImage = /\.(png|jpe?g|gif|webp|bmp|svg|heic)$/i.test(piece.originalName || '');
        const isImage = hasImageMime || nameLooksImage;

        if (isImage) {
          const mimeOverride = hasImageMime ? undefined : inferImageMimeFromName(piece.originalName || '');
          const imageBase64 = await getImageAsBase64(piece, {
            accessToken: driveAccessToken,
            mimeOverride,
          });
          if (imageBase64) {
            // Adiciona a imagem usando Base64
            slidePeca.addImage({
              data: imageBase64,
              x: '5%', y: '15%', w: '90%', h: '70%',
              sizing: { type: 'contain', w: '90%', h: '70%' } // Garante que a imagem caiba no espaço
            });
            
            // Adiciona a barra verde com o nome da peça
            slidePeca.addShape(pptx.shapes.RECTANGLE, {
              x: 0, y: 0, w: '100%', h: 0.5, fill: { color: GREEN_BG }
            });
            slidePeca.addText(piece.originalName, {
              x: 0, y: 0, w: '100%', h: 0.5,
              align: 'center', color: WHITE_TEXT, fontSize: 16, valign: 'middle'
            });

          } else {
            // Fallback se a imagem não puder ser carregada
            slidePeca.addText(`[Falha ao carregar a imagem: "${piece.originalName}"]`, { 
                x: 0, y: '45%', w: '100%', align: 'center', color: 'C00000' 
            });
          }
        } else {
          // Para arquivos que não são imagens
          slidePeca.addText(`[Pré-visualização não disponível para "${piece.originalName}"]\n(${piece.mimetype})`, { 
              x: 0, y: '45%', w: '100%', align: 'center', color: '6c757d' 
          });
        }
      }
    }

    // 5. SLIDE FINAL: Repete a capa
    let slideFinal = pptx.addSlide();
    slideFinal.addImage({ data: `data:image/png;base64,${capaBase64}`, w: '100%', h: '100%' });

    // 6. Gera o arquivo e envia para o usuário
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
