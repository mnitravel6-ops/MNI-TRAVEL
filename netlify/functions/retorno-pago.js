// /.netlify/functions/retorno-pago
// Flow devuelve aquí al cliente (su navegador) después de pagar, normalmente con un POST.
// Una página estática no puede recibir un POST, por eso lo recibe esta función, revisa el
// estado real del pago y redirige a la página de resultado correspondiente.
const { flowGet, siteUrl } = require('./lib/flow');

const redirigir = (url) => ({ statusCode: 302, headers: { Location: url }, body: '' });

exports.handler = async (event) => {
  const base = siteUrl(event);
  const token =
    new URLSearchParams(event.body || '').get('token') ||
    (event.queryStringParameters && event.queryStringParameters.token);

  if (!token) return redirigir(`${base}/pago-fallido.html`);

  try {
    const estado = await flowGet('/payment/getStatus', { token });
    if (Number(estado.status) === 2) {
      return redirigir(`${base}/gracias.html?orden=${encodeURIComponent(estado.commerceOrder || '')}`);
    }
    return redirigir(`${base}/pago-fallido.html`);
  } catch (err) {
    console.error('Error en el retorno del pago:', err.message);
    return redirigir(`${base}/pago-fallido.html`);
  }
};
