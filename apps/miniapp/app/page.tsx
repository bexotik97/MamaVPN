import Link from "next/link";
import type { DashboardResponse } from "@mamavpn/shared";
import { safeFetchJson } from "../lib/safe-api-fetch";

const cards = [
  { title: "1 день", price: "49 ₽", note: "Быстрый вход" },
  { title: "1 месяц", price: "399 ₽", note: "Популярно" },
  { title: "1 год", price: "2990 ₽", note: "Самый выгодный" },
  { title: "Private Server", price: "от 1990 ₽", note: "Премиум" }
];

function Nav() {
  return (
    <nav
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(5, 1fr)",
        gap: 8
      }}
    >
      {[
        { href: "/", label: "Главная" },
        { href: "/plans", label: "Тарифы" },
        { href: "/support", label: "Поддержка" },
        { href: "/referral", label: "Рефералка" },
        { href: "/admin", label: "Admin" }
      ].map((item) => (
        <Link
          key={item.href}
          href={item.href}
          style={{
            textAlign: "center",
            padding: "12px 10px",
            borderRadius: 14,
            background: "rgba(10, 16, 30, 0.62)",
            border: "1px solid var(--panel-border)",
            color: "var(--muted)"
          }}
        >
          {item.label}
        </Link>
      ))}
    </nav>
  );
}

export default async function HomePage() {
  const dashboard = await loadDashboard();

  return (
    <main style={{ padding: 20 }}>
      <section
        style={{
          maxWidth: 460,
          margin: "0 auto",
          display: "grid",
          gap: 16
        }}
      >
        <Nav />

        <header
          style={{
            padding: 18,
            borderRadius: 22,
            background: "var(--panel)",
            border: "1px solid var(--panel-border)",
            backdropFilter: "blur(18px)"
          }}
        >
          <div style={{ fontSize: 14, color: "var(--muted)", marginBottom: 8 }}>
            MamaVPN | Личный кабинет
          </div>
          <div style={{ fontSize: 26, fontWeight: 700, marginBottom: 10 }}>
            Статус: {dashboard?.status === "active" || dashboard?.status === "trial" ? "Подключено" : "Неактивно"}
          </div>
          <div style={{ color: "var(--muted)" }}>
            Активная локация: {dashboard?.subscription?.activeLocationName ?? "Германия"}
          </div>
          <div style={{ color: "var(--success)", marginTop: 8 }}>
            {dashboard?.expiresAt
              ? `Доступ до ${new Date(dashboard.expiresAt).toLocaleDateString("ru-RU")}`
              : "Демо-режим кабинета"}
          </div>
        </header>

        <section
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 12
          }}
        >
          {cards.map((plan) => (
            <article
              key={plan.title}
              style={{
                padding: 16,
                borderRadius: 18,
                background: "var(--panel)",
                border: "1px solid var(--panel-border)"
              }}
            >
              <div style={{ color: "var(--muted)", fontSize: 14 }}>{plan.title}</div>
              <div style={{ fontSize: 28, fontWeight: 700, margin: "10px 0" }}>
                {plan.price}
              </div>
              <div style={{ color: "var(--muted)", fontSize: 13 }}>{plan.note}</div>
            </article>
          ))}
        </section>

        <section
          style={{
            padding: 18,
            borderRadius: 22,
            background: "var(--panel)",
            border: "1px solid var(--panel-border)",
            display: "grid",
            gap: 12
          }}
        >
          <div style={{ fontSize: 18, fontWeight: 700 }}>Поддержка и управление</div>
          <button
            style={{
              border: "none",
              borderRadius: 14,
              padding: "14px 16px",
              background: "linear-gradient(135deg, var(--accent), var(--accent-2))",
              color: "#fff",
              fontWeight: 600
            }}
          >
            Продлить подписку
          </button>
          <Link
            href="/plans"
            style={{
              border: "1px solid var(--panel-border)",
              borderRadius: 14,
              padding: "14px 16px",
              background: "rgba(8, 12, 24, 0.45)",
              color: "var(--text)",
              textAlign: "center"
            }}
          >
            Открыть все тарифы
          </Link>
          <button
            style={{
              border: "1px solid var(--panel-border)",
              borderRadius: 14,
              padding: "14px 16px",
              background: "rgba(8, 12, 24, 0.45)",
              color: "var(--text)"
            }}
          >
            Обновить подписку
          </button>
          <button
            style={{
              border: "1px solid var(--panel-border)",
              borderRadius: 14,
              padding: "14px 16px",
              background: "rgba(8, 12, 24, 0.45)",
              color: "var(--text)"
            }}
          >
            Запасной ключ
          </button>
        </section>
      </section>
    </main>
  );
}

async function loadDashboard(): Promise<DashboardResponse | null> {
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
    const url = `${base}/users/telegram/${telegramUserId}/dashboard`;
    return await safeFetchJson<DashboardResponse>(url);
  } catch {
    return null;
  }
}
