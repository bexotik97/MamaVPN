import { NextResponse } from "next/server";
import { getAdminApiKey, ensureAdminEnv } from "../../../../lib/admin-env";

/**
 * GET /api/admin/ping — только проверка, видит ли рантайм ADMIN_API_KEY (ключ не отдаём).
 * После деплоя на Vercel: открой в браузере; если adminKeyConfigured: false — в Env нет переменной или не сделан Redeploy.
 */
export async function GET() {
  ensureAdminEnv();
  const key = getAdminApiKey();
  return NextResponse.json({
    adminKeyConfigured: Boolean(key && key.length > 0)
  });
}
