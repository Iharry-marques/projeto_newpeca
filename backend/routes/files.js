const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const { convertRawImageIfNeeded, isRawImage } = require('../utils/media');

const uploadDir = path.join(__dirname, '../uploads');

// ROTA PÚBLICA PARA SERVIR ARQUIVOS
router.get('/files/:filename', async (req, res, next) => {
  try {
    const { filename } = req.params;
    const filePath = path.join(uploadDir, filename);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'Arquivo não encontrado' });
    }

    if (isRawImage(null, filename)) {
      const fileBuffer = await fs.promises.readFile(filePath);
      const { buffer: convertedBuffer, mimetype } = await convertRawImageIfNeeded(fileBuffer, { filename });
      res.setHeader('Content-Type', mimetype || 'image/jpeg');
      res.send(convertedBuffer);
    } else {
      res.sendFile(filePath);
    }
  } catch (error) {
    next(error);
  }
});

module.exports = router;
