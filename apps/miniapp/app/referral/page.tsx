import Link from "next/link";
import { safeFetchJson } from "../../lib/safe-api-fetch";

type ReferralProfile = {
  inviteLink: string;
  totalReferrals: number;
  rewardRub: number;
  rewardDays: number;
};

export default async function ReferralPage() {
  const referral = await loadReferral();

  return (
    <main style={{ padding: 20 }}>
      <section style={{ maxWidth: 460, margin: "0 auto", display: "grid", gap: 16 }}>
        <Link href="/" style={{ color: "var(--muted)" }}>
          ← Назад
        </Link>

        <header
          style={{
            padding: 18,
            borderRadius: 22,
            background: "var(--panel)",
            border: "1px solid var(--panel-border)"
          }}
        >
          <div style={{ fontSize: 26, fontWeight: 700 }}>Реферальная программа</div>
          <div style={{ color: "var(--muted)", marginTop: 8 }}>
            Приглашай друзей и получай бонусы на баланс или дополнительные дни
          </div>
        </header>

        <section
          style={{
            padding: 18,
            borderRadius: 22,
            background: "var(--panel)",
            border: "1px solid var(--panel-border)",
            display: "grid",
            gap: 10
          }}
        >
          <div style={{ fontSize: 16, color: "var(--muted)" }}>Твоя ссылка</div>
          <div
            style={{
              padding: 14,
              borderRadius: 14,
              background: "rgba(8, 12, 24, 0.45)",
              border: "1px solid var(--panel-border)",
              overflowWrap: "anywhere"
            }}
          >
            {referral?.inviteLink ?? "https://t.me/MamaVPN_bot?start=ref_demo"}
          </div>
          <button
            style={{
              border: "none",
              borderRadius: 14,
              padding: "14px 16px",
              background: "linear-gradient(135deg, var(--accent), var(--accent-2))",
              color: "#fff",
              fontWeight: 700
            }}
          >
            Поделиться ссылкой
          </button>
        </section>

        <section
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 12
          }}
        >
          {[
            { label: "Приглашено", value: String(referral?.totalReferrals ?? 12) },
            { label: "Бонусов ₽", value: String(referral?.rewardRub ?? 1480) },
            { label: "Бонусных дней", value: String(referral?.rewardDays ?? 21) },
            { label: "Конверсия", value: "33%" }
          ].map((item) => (
            <article
              key={item.label}
              style={{
                padding: 16,
                borderRadius: 18,
                background: "var(--panel)",
                border: "1px solid var(--panel-border)"
              }}
            >
              <div style={{ color: "var(--muted)", fontSize: 13 }}>{item.label}</div>
              <div style={{ fontSize: 28, fontWeight: 800, marginTop: 8 }}>{item.value}</div>
            </article>
          ))}
        </section>
      </section>
    </main>
  );
}

async function loadReferral(): Promise<ReferralProfile | null> {
  try {
    const telegramUserId = process.env.DEMO_TELEGRAM_USER_ID;
    const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3000";

    if (!telegramUserId) {
      return null;
    }

    if (
      process.env.VERCEL &&
      (apiBaseUrl.includes("localhost") || apiBaseUrl.includes("127.0.0.1"))
    ) {
      return null;
    }

    const base = apiBaseUrl.replace(/\/$/, "");
    const url = `${base}/referrals/telegram/${telegramUserId}`;
    return await safeFetchJson<ReferralProfile>(url);
  } catch {
    return null;
  }
}
