import { createHash, randomBytes } from 'crypto';
import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

const TTL_SECONDS = 90;

function hashCode(value: string) {
  return createHash('sha256').update(value).digest('hex');
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const accessToken = String(body?.access_token ?? '');
    const refreshToken = String(body?.refresh_token ?? '');

    if (!accessToken || !refreshToken) {
      return NextResponse.json({ error: 'Sessão inválida.' }, { status: 400 });
    }

    const admin = createAdminClient();
    const { data: userData, error: userError } = await admin.auth.getUser(accessToken);

    if (userError || !userData.user) {
      return NextResponse.json(
        { error: 'Sessão expirada. Faça login novamente.' },
        { status: 401 }
      );
    }

    const code = randomBytes(32).toString('base64url');
    const expiresAt = new Date(Date.now() + TTL_SECONDS * 1000).toISOString();

    const { error } = await admin.from('mobile_auth_handoffs').insert({
      code_hash: hashCode(code),
      access_token: accessToken,
      refresh_token: refreshToken,
      expires_at: expiresAt,
    });

    if (error) {
      console.error('[mobile-handoff] insert:', error);
      return NextResponse.json(
        { error: 'Não foi possível preparar o acesso ao app.' },
        { status: 500 }
      );
    }

    return NextResponse.json({ code, expires_in: TTL_SECONDS });
  } catch (error) {
    console.error('[mobile-handoff] POST:', error);
    return NextResponse.json(
      { error: 'Não foi possível preparar o acesso ao app.' },
      { status: 500 }
    );
  }
}
