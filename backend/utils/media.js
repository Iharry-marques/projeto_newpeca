const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFile } = require('child_process');
const { promisify } = require('util');
const { v4: uuidv4 } = require('uuid');
const mime = require('mime-types');
const imageSize = require('image-size');
const { path: ffprobePath } = require('@ffprobe-installer/ffprobe');
const { path: ffmpegPath } = require('@ffmpeg-installer/ffmpeg');
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
    const converted = await sharp(buffer)
      .rotate()
      .toFormat('jpeg', { quality: 90 })
      .toBuffer();
    return { buffer: converted, mimetype: 'image/jpeg' };
  } catch (error) {
    console.warn(`[media] Falha ao converter arquivo RAW (${nameForCheck || mimetype || 'desconhecido'}): ${error.message}`);
    return { buffer, mimetype };
  }
}

function guessExtension(mimetype, filename) {
  const extFromMime = mimetype ? mime.extension(mimetype) : null;
  if (extFromMime) return `.${extFromMime}`;
  if (filename) {
    const ext = path.extname(filename);
    if (ext) return ext;
  }
  return '.bin';
}

async function getVideoDimensions(buffer, { mimetype, originalName, filename } = {}) {
  if (!buffer || !Buffer.isBuffer(buffer) || !ffprobePath) return null;

  const tmpDir = await fs.promises.mkdtemp(path.join(os.tmpdir(), 'ffprobe-'));
  const tempFile = path.join(tmpDir, `${uuidv4()}${guessExtension(mimetype, originalName || filename)}`);

  try {
    await fs.promises.writeFile(tempFile, buffer);
    const execFileAsync = promisify(execFile);
    const args = [
      '-v',
      'error',
      '-select_streams',
      'v:0',
      '-show_entries',
      'stream=width,height',
      '-of',
      'json',
      tempFile,
    ];
    const { stdout } = await execFileAsync(ffprobePath, args);
    const parsed = JSON.parse(stdout);
    const stream = parsed?.streams?.[0];
    if (stream?.width && stream?.height) {
      return { width: Number(stream.width), height: Number(stream.height) };
    }
  } catch (error) {
    console.warn(`[media] Falha ao ler dimensões do vídeo (${originalName || filename || mimetype || 'desconhecido'}): ${error.message}`);
  } finally {
    await fs.promises.rm(tempFile, { force: true }).catch(() => {});
    await fs.promises.rm(tmpDir, { recursive: true, force: true }).catch(() => {});
  }
  return null;
}

function getImageDimensions(buffer, { originalName, filename, mimetype } = {}) {
  try {
    const dims = imageSize(buffer);
    if (dims?.width && dims?.height) {
      return { width: Number(dims.width), height: Number(dims.height), type: dims.type || mimetype };
    }
  } catch (error) {
    console.warn(`[media] Falha ao detectar dimensões da imagem (${originalName || filename || mimetype || 'desconhecido'}): ${error.message}`);
  }
  return null;
}

async function getMediaDimensions(buffer, { mimetype, originalName, filename } = {}) {
  if (!buffer || !Buffer.isBuffer(buffer)) return null;

  if ((mimetype || '').startsWith('image/')) {
    return getImageDimensions(buffer, { mimetype, originalName, filename });
  }

  if ((mimetype || '').startsWith('video/')) {
    return getVideoDimensions(buffer, { mimetype, originalName, filename });
  }

  return null;
}

async function downscaleImageIfNeeded(buffer, { mimetype }, { maxWidth = 4096, maxHeight = 4096 } = {}) {
  if (!sharp || !(mimetype || '').startsWith('image/')) {
    return { buffer, mimetype };
  }

  try {
    const meta = await sharp(buffer).metadata();
    if (
      (meta.width && meta.width > maxWidth) ||
      (meta.height && meta.height > maxHeight)
    ) {
      const resized = await sharp(buffer)
        .rotate()
        .resize({
          width: maxWidth,
          height: maxHeight,
          fit: 'inside',
          withoutEnlargement: true,
        })
        .toFormat('jpeg', { quality: 85 })
        .toBuffer();
      return { buffer: resized, mimetype: 'image/jpeg' };
    }
  } catch (error) {
    console.warn('[media] Falha ao redimensionar imagem:', error.message);
  }
  return { buffer, mimetype };
}

async function compressVideoIfNeeded(
  buffer,
  { mimetype, originalName, filename } = {},
  { maxBytes = 40 * 1024 * 1024 } = {}
) {
  if (!Buffer.isBuffer(buffer) || !(mimetype || '').startsWith('video/') || !ffmpegPath) {
    return { buffer, mimetype };
  }

  if ((buffer.byteLength || buffer.length || 0) <= maxBytes) {
    return { buffer, mimetype };
  }

  const tmpDir = await fs.promises.mkdtemp(path.join(os.tmpdir(), 'ffmpeg-'));
  const inputExt = guessExtension(mimetype, originalName || filename);
  const inputPath = path.join(tmpDir, `input${inputExt}`);
  const outputPath = path.join(tmpDir, `output.mp4`);
  const execFileAsync = promisify(execFile);

  try {
    await fs.promises.writeFile(inputPath, buffer);

    const crfAttempts = [26, 30, 32, 35];
    let bestBuffer = buffer;
    let bestMime = mimetype;

    for (const crf of crfAttempts) {
      await fs.promises.rm(outputPath, { force: true }).catch(() => {});
      const args = [
        '-y',
        '-i',
        inputPath,
        '-vf', "scale='if(gt(iw,ih),min(iw,1280),-2)':'if(gt(ih,iw),min(ih,1280),-2)'",
        '-c:v', 'libx264',
        '-preset', 'veryfast',
        '-crf', String(crf),
        '-c:a', 'aac',
        '-b:a', '128k',
        '-movflags', '+faststart',
        outputPath,
      ];

      await execFileAsync(ffmpegPath, args);

      const converted = await fs.promises.readFile(outputPath);
      if (converted.byteLength < bestBuffer.byteLength) {
        bestBuffer = converted;
        bestMime = 'video/mp4';
      }

      if (converted.byteLength <= maxBytes) {
        return { buffer: converted, mimetype: 'video/mp4' };
      }
    }

    return { buffer: bestBuffer, mimetype: bestMime };
  } catch (error) {
    console.warn(`[media] Falha ao comprimir vídeo (${originalName || filename || mimetype || 'desconhecido'}): ${error.message}`);
    return { buffer, mimetype };
  } finally {
    await fs.promises.rm(inputPath, { force: true }).catch(() => {});
    await fs.promises.rm(outputPath, { force: true }).catch(() => {});
    await fs.promises.rm(tmpDir, { recursive: true, force: true }).catch(() => {});
  }
}

module.exports = {
  isRawImage,
  convertRawImageIfNeeded,
  downscaleImageIfNeeded,
  compressVideoIfNeeded,
  getMediaDimensions,
};
