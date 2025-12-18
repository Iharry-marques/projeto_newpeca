const { S3 } = require('aws-sdk');
const { v4: uuidv4 } = require('uuid');
const path = require('path');

// 1. Configurar o Cliente S3 para apontar para o Cloudflare R2
const R2_ENDPOINT = process.env.R2_ENDPOINT;
const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID;
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID;
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY;
const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME;

// A URL pública do seu bucket R2 (configurada no Cloudflare)
// Ex: "https://pub-xxxxxxxx.r2.dev/aprobi-producao"
const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL;

if ((!R2_ENDPOINT && !R2_ACCOUNT_ID) || !R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY || !R2_BUCKET_NAME || !R2_PUBLIC_URL) {
  console.warn('[R2 UPLOADER] Variáveis de ambiente do R2/MinIO estão incompletas. Uploads falharão.');
}

const s3 = new S3({
  endpoint: R2_ENDPOINT || (R2_ACCOUNT_ID ? `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com` : undefined),
  accessKeyId: R2_ACCESS_KEY_ID,
  secretAccessKey: R2_SECRET_ACCESS_KEY,
  signatureVersion: 'v4',
  region: 'auto', // Importante para R2
});

/**
 * Faz o upload de um buffer de arquivo para o R2
 * @param {Buffer} buffer O buffer do arquivo
 * @param {string} originalName O nome original do arquivo (para pegar a extensão)
 * @param {string} mimetype O mimetype do arquivo
 * @returns {Promise<{storageKey: string, storageUrl: string, size: number}>}
 */
const uploadToR2 = async (buffer, originalName, mimetype) => {
  try {
    const fileExtension = path.extname(originalName) || '';
    const storageKey = `${uuidv4()}${fileExtension}`; // Ex: "a1b2c3d4-....jpg"
    
    const params = {
      Bucket: R2_BUCKET_NAME,
      Key: storageKey,
      Body: buffer,
      ContentType: mimetype || 'application/octet-stream',
    };

    // Faz o upload (stream) para o R2
    await s3.putObject(params).promise();

    // Monta a URL pública completa
    const storageUrl = `${R2_PUBLIC_URL}/${storageKey}`;

    return {
      storageKey: storageKey,
      storageUrl: storageUrl,
      size: buffer.length,
    };
  } catch (error) {
    console.error('Erro ao fazer upload para o R2:', error);
    throw new Error('Falha ao enviar arquivo para o armazenamento.');
  }
};

module.exports = { uploadToR2 };
