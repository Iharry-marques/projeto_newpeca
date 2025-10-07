const path = require('path');
let sharp;

try {
  // Lazy require to allow unit tests without native deps
  sharp = require('sharp');
} catch (error) {
  console.warn('[media] Biblioteca "sharp" não encontrada. Conversões de RAW serão puladas.');
  sharp = null;
}

const RAW_MIME_PATTERNS = [
  /image\/x-sony-arw/i,
  /image\/arw/i,
  /image\/x-canon-cr2/i,
  /image\/x-nikon-nef/i,
  /image\/x-pentax-pef/i,
  /image\/x-panasonic-raw/i,
  /image\/x-panasonic-rw2/i,
  /image\/x-fuji-raf/i,
  /image\/x-olympus-orf/i,
  /image\/x-adobe-dng/i,
  /image\/x-samsung-srw/i,
  /image\/x-minolta-mrw/i,
  /image\/x-sony-sr2/i,
];

const RAW_EXTENSIONS = [
  '.arw', '.cr2', '.cr3', '.nef', '.pef', '.rw2', '.raf', '.orf', '.dng', '.srw', '.mrw', '.sr2',
];

function hasRawExtension(filename = '') {
  const ext = path.extname(filename).toLowerCase();
  return RAW_EXTENSIONS.includes(ext);
}

function isRawImage(mimetype = '', filename = '') {
  if (mimetype && RAW_MIME_PATTERNS.some((pattern) => pattern.test(mimetype))) {
    return true;
  }
  if (hasRawExtension(filename)) {
    return true;
  }
  return false;
}

async function convertRawImageIfNeeded(buffer, { mimetype, originalName, filename } = {}) {
  if (!buffer || !Buffer.isBuffer(buffer)) {
    return { buffer, mimetype };
  }

  const nameForCheck = originalName || filename || '';

  if (!isRawImage(mimetype, nameForCheck) || !sharp) {
    return { buffer, mimetype };
  }

  try {
    const converted = await sharp(buffer).toFormat('jpeg', { quality: 90 }).toBuffer();
    return { buffer: converted, mimetype: 'image/jpeg' };
  } catch (error) {
    console.warn(`[media] Falha ao converter arquivo RAW (${nameForCheck || mimetype || 'desconhecido'}): ${error.message}`);
    return { buffer, mimetype };
  }
}

module.exports = {
  isRawImage,
  convertRawImageIfNeeded,
};
