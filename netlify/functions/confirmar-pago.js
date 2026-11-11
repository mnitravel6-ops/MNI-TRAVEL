// POST /.netlify/functions/confirmar-pago
// Flow llama a esta dirección (servidor a servidor) cuando cambia el estado de un pago.
// No confiamos en lo que llega: con el token le preguntamos a Flow el estado real.
const { flowGet, siteUrl } = require('./lib/flow');
const { registrarReservaPagada } = require('./lib/reserva');

// Estados de Flow: 1 pendiente, 2 pagada, 3 rechazada, 4 anulada
const PAGADA = 2;

exports.handler = async (event) => {
  const token = new URLSearchParams(event.body || '').get('token');
  if (!token) return { statusCode: 400, body: 'token requerido' };

  try {
    const estado = await flowGet('/payment/getStatus', { token });

    if (Number(estado.status) === PAGADA) {
      await registrarReservaPagada(estado, siteUrl(event));
    }
    return { statusCode: 200, body: 'ok' };
  } catch (err) {
    console.error('Error confirmando el pago:', err.message);
    // Un error 500 hace que Flow reintente más tarde
    return { statusCode: 500, body: 'error' };
  }
};
