// POST /.netlify/functions/crear-pago
// Recibe los datos de la reserva, recalcula el precio EN EL SERVIDOR (nunca se confía
// en el monto que manda el navegador), y crea la orden de pago del abono en Flow.
const { flowPost, siteUrl } = require('./lib/flow');
const tarifas = require('./lib/tarifas.json');

const ABONO_PORCENTAJE = Number(process.env.ABONO_PORCENTAJE || 30);
const TRAYECTOS = ['Aeropuerto → Destino', 'Destino → Aeropuerto'];

const json = (statusCode, obj) => ({
  statusCode,
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(obj),
});

const texto = (v, max) => String(v ?? '').trim().slice(0, max);

function hoyEnChile() {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Santiago' }).format(new Date());
}

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') return json(405, { error: 'Método no permitido' });

  if (!process.env.FLOW_API_KEY || !process.env.FLOW_SECRET_KEY) {
    console.error('Faltan FLOW_API_KEY / FLOW_SECRET_KEY en las variables de entorno');
    return json(500, { error: 'El pago online no está disponible por ahora. Escríbenos por WhatsApp.' });
  }

  let d;
  try {
    d = JSON.parse(event.body || '{}');
  } catch {
    return json(400, { error: 'Solicitud inválida' });
  }

  // Trampa para bots: este campo está oculto y las personas lo dejan vacío
  if (d['bot-field']) return json(400, { error: 'Solicitud inválida' });

  const r = {
    nombre: texto(d.nombre, 80),
    email: texto(d.email, 100),
    telefono: texto(d.telefono, 25),
    pasajeros: parseInt(d.pasajeros, 10),
    direccion: texto(d.direccion, 30),
    comuna: texto(d.comuna, 60),
    destino: texto(d.destino, 120),
    fecha: texto(d.fecha, 10),
    hora: texto(d.hora, 40),
    notas: texto(d.notas, 200),
  };

  // Validaciones
  if (!r.nombre || !r.telefono || !r.destino || !r.hora) return json(400, { error: 'Faltan datos de la reserva.' });
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(r.email)) return json(400, { error: 'El correo no es válido.' });
  if (!(r.pasajeros >= 1 && r.pasajeros <= 6)) return json(400, { error: 'Los pasajeros deben ser entre 1 y 6.' });
  if (!TRAYECTOS.includes(r.direccion)) return json(400, { error: 'Trayecto inválido.' });
  if (!/^\d{4}-\d{2}-\d{2}$/.test(r.fecha) || r.fecha < hoyEnChile()) {
    return json(400, { error: 'La fecha del traslado no es válida.' });
  }

  // Precio calculado en el servidor a partir del tarifario
  const precio = tarifas[r.comuna];
  if (!precio) return json(400, { error: 'Destino no encontrado en el tarifario.' });

  // Abono redondeado a la centena
  const abono = Math.round((precio * ABONO_PORCENTAJE) / 100 / 100) * 100;

  const commerceOrder =
    'MNI-' + Date.now().toString(36).toUpperCase() + Math.random().toString(36).slice(2, 6).toUpperCase();
  const base = siteUrl(event);

  // Los datos de la reserva viajan dentro de la orden de Flow (campo "optional") y
  // vuelven cuando Flow confirma el pago. Claves cortas para no pasarnos de tamaño.
  const optional = JSON.stringify({
    n: r.nombre, e: r.email, t: r.telefono, p: r.pasajeros, d: r.direccion,
    c: r.comuna, x: r.destino, f: r.fecha, h: r.hora, o: r.notas,
  });

  try {
    const orden = await flowPost('/payment/create', {
      commerceOrder,
      subject: `Abono traslado MNI Travel - ${r.comuna}`,
      currency: 'CLP',
      amount: String(abono),
      email: r.email,
      optional,
      urlConfirmation: `${base}/.netlify/functions/confirmar-pago`,
      urlReturn: `${base}/.netlify/functions/retorno-pago`,
    });

    return json(200, { url: `${orden.url}?token=${orden.token}`, abono, precio });
  } catch (err) {
    console.error('Error creando la orden en Flow:', err.message);
    return json(502, { error: 'No pudimos iniciar el pago. Intenta de nuevo o escríbenos por WhatsApp.' });
  }
};
