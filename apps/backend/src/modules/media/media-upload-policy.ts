import { BadRequestException } from '@nestjs/common';
import { extname } from 'path';

export interface RasterUpload { originalname: string; mimetype: string; buffer: Buffer; size: number; }
export function validateRasterUpload(file: RasterUpload): { extension: string; mimeType: string } {
  if (!file || typeof file.originalname !== 'string' || file.originalname.length > 255 || !Buffer.isBuffer(file.buffer) || !file.buffer.length || file.buffer.length > 5 * 1024 * 1024) throw new BadRequestException('Invalid image file');
  const bytes = file.buffer;
  let extension: string | undefined; let mimeType: string | undefined;
  if (bytes.length >= 45 && bytes.subarray(0, 8).equals(Buffer.from('89504e470d0a1a0a', 'hex')) && bytes.toString('ascii', 12, 16) === 'IHDR' && bytes.readUInt32BE(16) > 0 && bytes.readUInt32BE(20) > 0 && bytes.subarray(-12).equals(Buffer.from('0000000049454e44ae426082', 'hex'))) {
    extension = '.png'; mimeType = 'image/png';
  } else if (bytes.length >= 4 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff && bytes[bytes.length - 2] === 0xff && bytes[bytes.length - 1] === 0xd9) {
    extension = '.jpg'; mimeType = 'image/jpeg';
  } else if (bytes.length >= 14 && ['GIF87a', 'GIF89a'].includes(bytes.toString('ascii', 0, 6)) && bytes.readUInt16LE(6) > 0 && bytes.readUInt16LE(8) > 0 && bytes[bytes.length - 1] === 0x3b) {
    extension = '.gif'; mimeType = 'image/gif';
  } else if (bytes.length >= 20 && bytes.toString('ascii', 0, 4) === 'RIFF' && bytes.readUInt32LE(4) === bytes.length - 8 && bytes.toString('ascii', 8, 12) === 'WEBP' && ['VP8 ', 'VP8L', 'VP8X'].includes(bytes.toString('ascii', 12, 16))) {
    extension = '.webp'; mimeType = 'image/webp';
  }
  const providedExtension = extname(file.originalname).toLowerCase();
  if (!extension || file.mimetype !== mimeType || (providedExtension !== extension && !(extension === '.jpg' && providedExtension === '.jpeg'))) throw new BadRequestException('Only matching PNG, JPEG, GIF or WebP images are accepted; SVG requires sanitization');
  return { extension, mimeType };
}

const fields = ['filename', 'originalName', 'mimeType', 'size', 'url', 'thumbnailUrl', 'type', 'storageType', 'module', 'category', 'tags', 'altText', 'title', 'description', 'isActive'];
export function validateMediaMetadata(input: object, trustedUpload = false): void {
  if (!input || typeof input !== 'object' || Array.isArray(input) || Object.keys(input).some(key => !fields.includes(key))) throw new BadRequestException('Unsupported media fields');
  const data = input as Record<string, unknown>;
  if (typeof data.mimeType === 'string' && /svg|html|javascript/i.test(data.mimeType)) throw new BadRequestException('Active content media is not supported');
  for (const field of ['url', 'thumbnailUrl']) {
    const value = data[field];
    if (value === undefined) continue;
    if (typeof value !== 'string' || value.length > 2048 || /[\x00-\x20\\]/.test(value)) throw new BadRequestException('Invalid media URL');
    let decodedPath: string;
    try { decodedPath = decodeURIComponent(value.split('?')[0].split('#')[0]); } catch { throw new BadRequestException('Invalid media URL'); }
    if (/\.(?:svg|html?|js)$/i.test(decodedPath)) throw new BadRequestException('Active content media is not supported');
    // Private ticket metadata remains private: static serving is separately denied.
    if (/^\/uploads\/(?:public|tickets)\/[A-Za-z0-9_.-]+$/.test(value) && !value.includes('..')) continue;
    let url: URL;
    try { url = new URL(value); } catch { throw new BadRequestException('Invalid media URL'); }
    if (url.protocol !== 'https:' || url.username || url.password || /\.(?:svg|html?|js)$/i.test(url.pathname)) throw new BadRequestException('Unsafe media URL');
    const allowed = (process.env.MEDIA_ALLOWED_EXTERNAL_ORIGINS || '').split(',').map(value => value.trim()).filter(Boolean);
    if (!trustedUpload && !allowed.includes(url.origin)) throw new BadRequestException('Media origin is not configured; upload the asset instead');
  }
}
