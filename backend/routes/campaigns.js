// backend/routes/campaigns.js
// Rotas de campanhas (Suno/Cliente) + upload + export PDF

const express = require('express');
const router = express.Router();

const path = require('path');
const fs = require('fs');

const multer = require('multer');             // npm i multer
const puppeteer = require('puppeteer');       // npm i puppeteer

const { Campaign, Piece, Client, CampaignClient, User } = require('../models');

// ---------- Auth guard ----------
function ensureAuthenticated(req, res, next) {
  // Passport preenche req.isAuthenticated/req.user quando a sessão está válida
  if (req.isAuthenticated && req.isAuthenticated()) return next();
  if (req.user) return next();
  return res.status(401).json({ error: 'Usuário não autenticado.' });
}

// ---------- Upload (em disco, por enquanto) ----------
const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const upload = multer({ dest: uploadDir });

// ---------- Helper Puppeteer ----------
async function openBrowser() {
  const execPath = process.env.PUPPETEER_EXECUTABLE_PATH || undefined;
  // Em Cloud Run use args sem sandbox; local também funciona.
  return puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
    executablePath: execPath, // se não definido, usa Chromium baixado pelo Puppeteer
  });
}

/* ================== CAMPANHAS ================== */

// Criar campanha
router.post('/', ensureAuthenticated, async (req, res) => {
  try {
    const { name, client, creativeLine, startDate, endDate, notes } = req.body;

    if (!name || !client) {
      return res.status(400).json({ error: 'Nome e cliente da campanha são obrigatórios.' });
    }

    const campaign = await Campaign.create({
      name,
      client,
      creativeLine: creativeLine || null,
      startDate: startDate || null,
      endDate: endDate || null,
      notes: notes || null,
      createdBy: req.user.id,
      status: 'draft',
    });

    res.status(201).json(campaign);
  } catch (err) {
    console.error('Erro ao criar campanha:', err);
    res.status(400).json({ error: err.message });
  }
});

// Listar campanhas do usuário logado
router.get('/', ensureAuthenticated, async (req, res) => {
  try {
    const campaigns = await Campaign.findAll({
      where: { createdBy: req.user.id },
      include: [
        { model: Piece, attributes: ['id', 'status'] },
        {
          model: Client,
          as: 'authorizedClients',
          through: { attributes: ['assignedAt'] },
          attributes: ['id', 'name', 'email'],
        },
      ],
      order: [['createdAt', 'DESC']],
    });
    res.json(campaigns);
  } catch (err) {
    console.error('Erro ao buscar campanhas:', err);
    res.status(500).json({ error: 'Erro interno ao buscar campanhas.' });
  }
});

// Buscar campanha específica
router.get('/:id', ensureAuthenticated, async (req, res) => {
  try {
    const campaign = await Campaign.findOne({
      where: { id: req.params.id, createdBy: req.user.id },
      include: [
        {
          model: Piece,
          order: [['order', 'ASC'], ['createdAt', 'ASC']],
        },
        {
          model: Client,
          as: 'authorizedClients',
          through: { attributes: ['assignedAt', 'canApprove', 'canComment', 'clientStatus'] },
          attributes: ['id', 'name', 'email', 'company'],
        },
      ],
    });

    if (!campaign) return res.status(404).json({ error: 'Campanha não encontrada' });

    res.json(campaign);
  } catch (err) {
    console.error('Erro ao buscar campanha:', err);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

/* ================== UPLOAD DE PEÇAS ================== */

// Upload (estado inicial: 'uploaded')
router.post('/:id/upload', ensureAuthenticated, upload.array('files'), async (req, res) => {
  try {
    const campaignId = req.params.id;

    const campaign = await Campaign.findOne({
      where: { id: campaignId, createdBy: req.user.id },
    });
    if (!campaign) return res.status(404).json({ error: 'Campanha não encontrada' });

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
          CampaignId: campaignId,
        })
      )
    );

    res.json({
      success: true,
      message: `${pieces.length} arquivo(s) enviado(s) com sucesso`,
      pieces: pieces.map((p) => ({
        id: p.id,
        filename: p.filename,
        originalName: p.originalName,
        mimetype: p.mimetype,
        size: p.size,
        status: p.status,
        createdAt: p.createdAt,
      })),
    });
  } catch (error) {
    console.error('Erro no upload:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Marcar peças como anexadas (uploaded → attached)
router.post('/:id/attach-pieces', ensureAuthenticated, async (req, res) => {
  try {
    const campaignId = req.params.id;
    const { pieceIds } = req.body;

    if (!pieceIds || !Array.isArray(pieceIds) || pieceIds.length === 0) {
      return res.status(400).json({ error: 'IDs das peças são obrigatórios' });
    }

    const campaign = await Campaign.findOne({
      where: { id: campaignId, createdBy: req.user.id },
    });
    if (!campaign) return res.status(404).json({ error: 'Campanha não encontrada' });

    const [updatedCount] = await Piece.update(
      { status: 'attached', attachedAt: new Date() },
      {
        where: { id: pieceIds, CampaignId: campaignId, status: 'uploaded' },
      }
    );

    if (updatedCount === 0) {
      return res.status(400).json({
        error: 'Nenhuma peça foi anexada. Verifique se as peças existem e estão no estado correto.',
      });
    }

    res.json({ success: true, message: `${updatedCount} peça(s) anexada(s)`, attachedCount: updatedCount });
  } catch (error) {
    console.error('Erro ao anexar peças:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Desanexar peças (attached → uploaded)
router.post('/:id/detach-pieces', ensureAuthenticated, async (req, res) => {
  try {
    const campaignId = req.params.id;
    const { pieceIds } = req.body;

    const [updatedCount] = await Piece.update(
      { status: 'uploaded', attachedAt: null },
      {
        where: { id: pieceIds, CampaignId: campaignId, status: 'attached' },
      }
    );

    res.json({ success: true, message: `${updatedCount} peça(s) desanexada(s)`, detachedCount: updatedCount });
  } catch (error) {
    console.error('Erro ao desanexar peças:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

/* ================== ENVIO PARA CLIENTE ================== */

router.post('/:id/send-for-approval', ensureAuthenticated, async (req, res) => {
  try {
    const campaignId = req.params.id;
    const { clientIds } = req.body; // opcional

    const campaign = await Campaign.findOne({
      where: { id: campaignId, createdBy: req.user.id },
      include: [{ model: Piece, where: { status: 'attached' }, required: false }],
    });

    if (!campaign) return res.status(404).json({ error: 'Campanha não encontrada' });

    if (!campaign.Pieces || campaign.Pieces.length === 0) {
      return res.status(400).json({ error: 'Não é possível enviar uma campanha sem peças anexadas' });
    }

    if (campaign.status !== 'draft') {
      return res.status(400).json({ error: 'Apenas campanhas em rascunho podem ser enviadas' });
    }

    await Piece.update(
      { status: 'pending' },
      { where: { CampaignId: campaignId, status: 'attached' } }
    );

    await campaign.update({ status: 'sent_for_approval', sentForApprovalAt: new Date() });

    if (clientIds && clientIds.length > 0) {
      await Promise.all(
        clientIds.map((clientId) =>
          CampaignClient.upsert({
            campaignId,
            clientId,
            assignedAt: new Date(),
          })
        )
      );
    }

    res.json({
      success: true,
      message: 'Campanha enviada para aprovação com sucesso',
      campaign: {
        id: campaign.id,
        name: campaign.name,
        status: 'sent_for_approval',
        approvalLink: `${process.env.FRONTEND_URL}/client/approval/${campaign.approvalHash}`,
        pieceCount: campaign.Pieces.length,
        sentForApprovalAt: campaign.sentForApprovalAt,
      },
    });
  } catch (error) {
    console.error('Erro ao enviar campanha:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

/* ================== EXPORTAR PDF ================== */

router.get('/:id/export-pdf', ensureAuthenticated, async (req, res) => {
  try {
    const campaignId = req.params.id;

    const campaign = await Campaign.findOne({
      where: { id: campaignId, createdBy: req.user.id },
      include: [{ model: Piece, where: { status: 'approved' }, required: false }],
    });

    if (!campaign) return res.status(404).json({ error: 'Campanha não encontrada' });

    const approvedPieces = campaign.Pieces || [];
    if (approvedPieces.length === 0) {
      return res.status(400).json({ error: 'Não há peças aprovadas para exportar' });
    }

    const html = `<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>Peças Aprovadas - ${campaign.name}</title>
<style>
  body { font-family: Arial, sans-serif; margin: 40px; }
  .header { text-align: center; border-bottom: 2px solid #ffc801; padding-bottom: 20px; margin-bottom: 30px; }
  .campaign-info { margin-bottom: 30px; }
  .piece { margin-bottom: 40px; page-break-inside: avoid; }
  .piece img { max-width: 100%; height: auto; border: 1px solid #ddd; }
  .piece-info { margin-top: 10px; }
  .approved-stamp { color: green; font-weight: bold; }
</style></head>
<body>
  <div class="header">
    <h1>${campaign.name}</h1>
    <h2>Peças Criativas Aprovadas</h2>
  </div>

  <div class="campaign-info">
    <p><strong>Cliente:</strong> ${campaign.client}</p>
    ${campaign.creativeLine ? `<p><strong>Linha Criativa:</strong> ${campaign.creativeLine}</p>` : ''}
    <p><strong>Data de Exportação:</strong> ${new Date().toLocaleDateString('pt-BR')}</p>
    <p><strong>Total de Peças Aprovadas:</strong> ${approvedPieces.length}</p>
  </div>

  ${approvedPieces
    .map((piece, index) => {
      const isImage = (piece.mimetype || '').startsWith('image/');
      const src = `${process.env.FRONTEND_URL}/campaigns/files/${piece.filename}`;
      return `<div class="piece">
        <h3>Peça ${index + 1} - ${piece.originalName || piece.filename}</h3>
        ${
          isImage
            ? `<img src="${src}" alt="${piece.originalName || piece.filename}">`
            : `<div style="padding: 40px; border: 1px solid #ddd; text-align: center; background-color: #f5f5f5;">
                 <p><strong>Arquivo:</strong> ${piece.originalName || piece.filename}</p>
                 <p><strong>Tipo:</strong> ${piece.mimetype}</p>
                 <p><strong>Tamanho:</strong> ${Math.round((piece.size || 0) / 1024)} KB</p>
               </div>`
        }
        <div class="piece-info">
          <p class="approved-stamp">✅ APROVADA</p>
          ${piece.comment ? `<p><strong>Comentário:</strong> ${piece.comment}</p>` : ''}
          ${piece.reviewedAt ? `<p><strong>Data de Aprovação:</strong> ${new Date(piece.reviewedAt).toLocaleDateString('pt-BR')}</p>` : ''}
        </div>
      </div>`;
    })
    .join('')}

  <div style="margin-top: 50px; text-align: center; color: #666; font-size: 12px;">
    <p>Relatório gerado pelo sistema Aprobi em ${new Date().toLocaleString('pt-BR')}</p>
  </div>
</body></html>`;

    const browser = await openBrowser();
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });

    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '20mm', right: '15mm', bottom: '20mm', left: '15mm' },
    });

    await browser.close();

    const filename = `${campaign.name.replace(/[^a-zA-Z0-9]/g, '_')}_aprovadas.pdf`;
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', pdfBuffer.length);
    return res.send(pdfBuffer);
  } catch (error) {
    console.error('Erro ao gerar PDF:', error);
    return res.status(500).json({ error: 'Erro interno do servidor ao gerar PDF' });
  }
});

/* ================== ARQUIVOS ESTÁTICOS ================== */

// Servir arquivos enviados (pasta uploads/)
router.get('/files/:filename', (req, res) => {
  const filePath = path.join(uploadDir, req.params.filename);
  if (!fs.existsSync(filePath)) return res.status(404).json({ error: 'Arquivo não encontrado' });
  res.sendFile(filePath);
});

module.exports = router;
