import { createHmac, timingSafeEqual } from 'node:crypto';

const SESSION_TTL_MS = 20 * 60 * 1000;

function matchesCode(input, expected) {
  const inputBuffer = Buffer.from(input);
  const expectedBuffer = Buffer.from(expected);
  return inputBuffer.length === expectedBuffer.length && timingSafeEqual(inputBuffer, expectedBuffer);
}

function createSessionToken(secret) {
  const payload = Buffer.from(JSON.stringify({ exp: Date.now() + SESSION_TTL_MS })).toString('base64url');
  const signature = createHmac('sha256', secret).update(payload).digest('base64url');
  return `${payload}.${signature}`;
}

export default function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const configuredCode = process.env.PAY_ADMIN_CODE;
  if (!configuredCode) return res.status(503).json({ error: '관리자 인증이 아직 설정되지 않았습니다.' });
  let body;
  try {
    body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
  } catch {
    return res.status(400).json({ error: '잘못된 요청입니다.' });
  }
  if (!matchesCode(String(body.code || ''), configuredCode)) return res.status(401).json({ error: '관리자 코드가 일치하지 않습니다.' });
  return res.status(200).json({ ok: true, token: createSessionToken(configuredCode) });
}
