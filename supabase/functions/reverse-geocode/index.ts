// Proxies reverse geocoding through Nominatim (OpenStreetMap) instead of
// calling it directly from the device. Two reasons:
//
// 1. fetch()'s `User-Agent` header is a spec-"forbidden" header — mobile
//    fetch implementations commonly drop/override it silently, so
//    Nominatim was seeing requests with no real identification and
//    falling back/failing, which showed up as the old single-segment
//    partido-only zone text never actually updating. Deno's fetch has
//    no such restriction.
// 2. Nominatim's usage policy wants one identified caller, not every
//    device hitting their servers directly — a single server-side
//    identity is the compliant way to do this at any real scale.
import { createClient } from 'jsr:@supabase/supabase-js@2';

type NominatimAddress = {
  suburb?: string;
  neighbourhood?: string;
  quarter?: string;
  city?: string;
  town?: string;
  village?: string;
  municipality?: string;
  state_district?: string;
  state?: string;
};

function stripPartidoPrefix(name: string) {
  return name.replace(/^Partido de\s+/i, '');
}

function shortenProvince(name: string) {
  return name === 'Ciudad Autónoma de Buenos Aires' ? 'CABA' : name;
}

function buildZoneText(address: NominatimAddress): string | null {
  const locality =
    address.suburb ??
    address.city ??
    address.town ??
    address.village ??
    address.municipality ??
    address.neighbourhood ??
    address.quarter ??
    null;
  const isComuna = address.state_district && /^Comuna\s+\d+/i.test(address.state_district);
  const partido = address.state_district && !isComuna ? stripPartidoPrefix(address.state_district) : null;
  const province = address.state ? shortenProvince(address.state) : null;

  const parts: string[] = [];
  for (const part of [locality, partido, province]) {
    if (part && parts[parts.length - 1] !== part) parts.push(part);
  }
  return parts.length > 0 ? parts.join(', ') : null;
}

Deno.serve(async req => {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader) {
    return new Response(JSON.stringify({ error: 'Missing Authorization header' }), { status: 401 });
  }
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
  const callerClient = createClient(supabaseUrl, anonKey, { global: { headers: { Authorization: authHeader } } });
  const {
    data: { user },
  } = await callerClient.auth.getUser();
  if (!user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }

  const { lat, lng } = await req.json();
  if (typeof lat !== 'number' || typeof lng !== 'number') {
    return new Response(JSON.stringify({ error: 'lat and lng are required numbers' }), { status: 400 });
  }

  const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=jsonv2&accept-language=es&zoom=14`;
  const response = await fetch(url, {
    headers: { 'User-Agent': 'PerrosDeLaCalleApp/1.0 (contacto@perrosdelacalle.app)' },
  });

  if (!response.ok) {
    return new Response(JSON.stringify({ zoneText: null }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  }

  const data: { address?: NominatimAddress } = await response.json();
  const zoneText = data.address ? buildZoneText(data.address) : null;

  return new Response(JSON.stringify({ zoneText }), { status: 200, headers: { 'Content-Type': 'application/json' } });
});
