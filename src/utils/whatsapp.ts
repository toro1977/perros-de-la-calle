// wa.me requires the phone in E.164 digits-only form and a URL-encoded
// prefilled message — see normalizeArPhone for why the number itself
// needs the "9" mobile marker before it ever reaches this function.
export function buildWhatsAppUrl(e164Phone: string, zoneText: string) {
  const digits = e164Phone.replace(/\D/g, '');
  const message = `Hola! Vi tu aviso de un perro en ${zoneText} en la app Perros de la calle.`;
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
}
