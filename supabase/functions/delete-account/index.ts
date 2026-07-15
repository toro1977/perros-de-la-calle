// Deletes the calling user's account entirely — Apple requires apps that
// allow account creation to offer in-app deletion, not just a support
// email. Needs the service role key (auth.admin.deleteUser), which can
// never live in the client, hence this Edge Function.
//
// public.users -> auth.users and dog_posts -> public.users are both
// "on delete cascade" (see supabase/migrations/20260706000002 and
// 20260706000003), so deleting the auth user cleans up the DB rows for
// free. Storage objects aren't DB rows, so those get removed explicitly
// first.
import { createClient } from 'jsr:@supabase/supabase-js@2';

const STORAGE_BUCKETS = ['dog-photos', 'avatars'];

Deno.serve(async req => {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader) {
    return new Response(JSON.stringify({ error: 'Missing Authorization header' }), { status: 401 });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

  // Verifies the JWT belongs to a real, current session — the anon
  // client only trusts the token, it doesn't grant any extra access.
  const callerClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authHeader } },
  });
  const {
    data: { user },
    error: userError,
  } = await callerClient.auth.getUser();
  if (userError || !user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }

  const admin = createClient(supabaseUrl, serviceRoleKey);

  for (const bucket of STORAGE_BUCKETS) {
    const { data: files } = await admin.storage.from(bucket).list(user.id);
    if (files && files.length > 0) {
      await admin.storage.from(bucket).remove(files.map(f => `${user.id}/${f.name}`));
    }
  }

  const { error: deleteError } = await admin.auth.admin.deleteUser(user.id);
  if (deleteError) {
    return new Response(JSON.stringify({ error: deleteError.message }), { status: 500 });
  }

  return new Response(JSON.stringify({ success: true }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
});
