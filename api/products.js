import { createHmac, timingSafeEqual } from 'node:crypto';
import { get, put } from '@vercel/blob';

const PRODUCT_PATH = 'ossium/fair-payment-products.json';
const SESSION_TTL_MS = 20 * 60 * 1000;
const DEFAULT_PRODUCTS = [
  { id: 'moray-wallet', name: 'MORAY MAGSAFE WALLET', price: 20000, discountRate: 0 },
  { id: 'shark-lighter', name: 'SHARK LIGHTER CASE', price: 15000, discountRate: 0 },
  { id: 'hammerhead-airpods', name: 'HAMMERHEAD AIRPODS CASE', price: 18000, discountRate: 0 },
  { id: 'eclipse-case', name: 'ECLIPSE CASE', price: 15000, discountRate: 0 },
  { id: 'keyring', name: 'KEYRING', price: 4000, discountRate: 0 },
  { id: 'postcard', name: 'POSTCARD', price: 4000, discountRate: 0 },
  { id: 'poster', name: 'POSTER', price: 4000, discountRate: 0 },
  { id: 'calendar', name: 'CALENDAR', price: 9000, discountRate: 0 },
  { id: 'sheet-sticker', name: 'SHEET STICKER', price: 4000, discountRate: 0 },
  { id: 'jibbitz', name: 'JIBBITZ', price: 9000, discountRate: 0 },
];

function readBody(req) {
  if (typeof req.body === 'string') return JSON.parse(req.body || '{}');
  return req.body || {};
}

function isValidProduct(product) {
  return product
    && typeof product.id === 'string'
    && /^[a-z0-9-]{1,80}$/i.test(product.id)
    && typeof product.name === 'string'
    && product.name.trim().length > 0
    && product.name.trim().length <= 80
    && Number.isInteger(product.price)
    && product.price >= 0
    && Number.isInteger(product.discountRate)
    && product.discountRate >= 0
    && product.discountRate <= 100;
}

function verifySession(req, secret) {
  const token = String(req.headers.authorization || '').replace(/^Bearer\s+/i, '');
  const [payload, signature] = token.split('.');
  if (!payload || !signature) return false;
  const expected = createHmac('sha256', secret).update(payload).digest('base64url');
  const provided = Buffer.from(signature);
  const calculated = Buffer.from(expected);
  if (provided.length !== calculated.length || !timingSafeEqual(provided, calculated)) return false;
  try {
    const session = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
    return Number.isFinite(session.exp) && session.exp > Date.now() && session.exp <= Date.now() + SESSION_TTL_MS;
  } catch {
    return false;
  }
}

async function getSavedProducts() {
  try {
    const result = await get(PRODUCT_PATH, { access: 'private', useCache: false });
    if (result.statusCode !== 200 || !result.stream) return DEFAULT_PRODUCTS;
    const data = await new Response(result.stream).json();
    return Array.isArray(data.products) && data.products.length && data.products.every(isValidProduct)
      ? data.products
      : DEFAULT_PRODUCTS;
  } catch {
    return DEFAULT_PRODUCTS;
  }
}

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store, max-age=0');
  if (req.method === 'GET') {
    try {
      return res.status(200).json({ products: await getSavedProducts() });
    } catch {
      return res.status(503).json({ error: '상품 설정을 불러오지 못했습니다.' });
    }
  }
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const configuredCode = process.env.PAY_ADMIN_CODE;
  if (!configuredCode || !process.env.BLOB_READ_WRITE_TOKEN) return res.status(503).json({ error: '관리자 저장소가 아직 설정되지 않았습니다.' });
  if (!verifySession(req, configuredCode)) return res.status(401).json({ error: '관리자 인증이 만료되었습니다. 다시 로그인해 주세요.' });
  let body;
  try {
    body = readBody(req);
  } catch {
    return res.status(400).json({ error: '잘못된 요청입니다.' });
  }
  const products = body.products;
  const uniqueIds = new Set(Array.isArray(products) ? products.map((product) => product.id) : []);
  if (!Array.isArray(products) || !products.length || products.length > 40 || uniqueIds.size !== products.length || !products.every(isValidProduct)) {
    return res.status(400).json({ error: '상품 설정 형식이 올바르지 않습니다.' });
  }
  const normalizedProducts = products.map((product) => ({
    id: product.id,
    name: product.name.trim(),
    price: product.price,
    discountRate: product.discountRate,
  }));
  try {
    await put(PRODUCT_PATH, JSON.stringify({ products: normalizedProducts, updatedAt: new Date().toISOString() }), {
      access: 'private',
      addRandomSuffix: false,
      allowOverwrite: true,
      contentType: 'application/json',
      cacheControlMaxAge: 60,
    });
    return res.status(200).json({ ok: true, products: normalizedProducts });
  } catch {
    return res.status(503).json({ error: '상품 설정을 저장하지 못했습니다.' });
  }
}
