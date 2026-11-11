// Utilidades para hablar con la API de Flow (https://developers.flow.cl)
// Las claves NUNCA van en el código: se leen de variables de entorno de Netlify.
const crypto = require('crypto');

// Sandbox por defecto. Para cobrar de verdad: FLOW_API_URL = https://www.flow.cl/api
function apiUrl() {
  return (process.env.FLOW_API_URL || 'https://sandbox.flow.cl/api').replace(/\/$/, '');
}

// Firma: parámetros ordenados alfabéticamente, concatenados como nombre+valor,
// y firmados con HMAC-SHA256 usando la Secret Key.
function firmar(params) {
  const base = Object.keys(params).sort().map((k) => k + params[k]).join('');
  return crypto.createHmac('sha256', process.env.FLOW_SECRET_KEY).update(base).digest('hex');
}

function conFirma(params) {
  const p = { apiKey: process.env.FLOW_API_KEY, ...params };
  p.s = firmar(p);
  return p;
}

async function leerRespuesta(res) {
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(`Flow respondió ${res.status}: ${data.message || JSON.stringify(data)}`);
  }
  return data;
}

async function flowPost(ruta, params) {
  const res = await fetch(apiUrl() + ruta, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams(conFirma(params)).toString(),
  });
  return leerRespuesta(res);
}

async function flowGet(ruta, params) {
  const res = await fetch(apiUrl() + ruta + '?' + new URLSearchParams(conFirma(params)).toString());
  return leerRespuesta(res);
}

// URL pública del sitio (Netlify la entrega en la variable URL)
function siteUrl(event) {
  const u = process.env.SITE_URL || process.env.URL || `https://${event.headers.host}`;
  return u.replace(/\/$/, '');
}

module.exports = { flowPost, flowGet, siteUrl };
