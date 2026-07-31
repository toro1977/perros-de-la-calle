import { buildWhatsAppUrl } from '@/utils/whatsapp';

describe('buildWhatsAppUrl', () => {
  it('builds a wa.me link with digits-only phone and an encoded message', () => {
    const url = buildWhatsAppUrl('+5491122381010', 'Quilmes');
    expect(url).toBe(
      'https://wa.me/5491122381010?text=' +
        encodeURIComponent('Hola! Vi tu aviso de un perro en Quilmes en la app Perros de la calle.')
    );
  });

  it('strips any non-digit characters from the phone', () => {
    const url = buildWhatsAppUrl('+54 9 11 2238-1010', 'Lomas de Zamora');
    expect(url.startsWith('https://wa.me/5491122381010?text=')).toBe(true);
  });
});
