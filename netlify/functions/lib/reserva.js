// Cuando Flow confirma un pago, la reserva se registra en Netlify Forms
// (formulario "reserva-pagada", declarado en public/index.html). Desde ahí te llega
// por correo si activas las notificaciones, y queda guardada en el panel de Netlify.
const tarifas = require('./tarifas.json');

function leerOptional(opt) {
  if (!opt) return {};
  if (typeof opt === 'object') return opt;
  try {
    return JSON.parse(opt);
  } catch {
    return {};
  }
}

async function registrarReservaPagada(estado, base) {
  const o = leerOptional(estado.optional);
  const precio = tarifas[o.c] || 0;
  const pagado = Number(estado.amount) || 0;

  const campos = {
    'form-name': 'reserva-pagada',
    nombre: o.n || '',
    email: o.e || estado.payer || '',
    telefono: o.t || '',
    pasajeros: String(o.p || ''),
    trayecto: o.d || '',
    comuna: o.c || '',
    direccion_exacta: o.x || '',
    fecha: o.f || '',
    hora_o_vuelo: o.h || '',
    notas: o.o || '',
    tarifa_total: String(precio),
    abono_pagado: String(pagado),
    saldo_al_chofer: String(Math.max(precio - pagado, 0)),
    orden_comercio: estado.commerceOrder || '',
    orden_flow: String(estado.flowOrder || ''),
  };

  const res = await fetch(base + '/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams(campos).toString(),
  });
  if (!res.ok) throw new Error(`Netlify Forms respondió ${res.status}`);
}

module.exports = { registrarReservaPagada, leerOptional };
