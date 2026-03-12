import Link from "next/link";

const plans = [
  { title: "1 день", price: "49 ₽", note: "Для быстрого входа", devices: "1 устройство" },
  { title: "1 месяц", price: "399 ₽", note: "Основной план", devices: "3 устройства" },
  { title: "1 год", price: "2990 ₽", note: "Лучшая экономия", devices: "5 устройств" },
  { title: "Private Server", price: "от 1990 ₽", note: "Премиум-контур", devices: "до 10 устройств" }
];

export default function PlansPage() {
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
          <div style={{ fontSize: 26, fontWeight: 700 }}>Тарифы</div>
          <div style={{ color: "var(--muted)", marginTop: 8 }}>
            Выбери план под свой сценарий использования
          </div>
        </header>

        {plans.map((plan) => (
          <article
            key={plan.title}
            style={{
              padding: 18,
              borderRadius: 22,
              background: "var(--panel)",
              border: "1px solid var(--panel-border)",
              display: "grid",
              gap: 8
            }}
          >
            <div style={{ fontSize: 20, fontWeight: 700 }}>{plan.title}</div>
            <div style={{ fontSize: 32, fontWeight: 800 }}>{plan.price}</div>
            <div style={{ color: "var(--muted)" }}>{plan.note}</div>
            <div style={{ color: "var(--muted)" }}>{plan.devices}</div>
            <button
              style={{
                marginTop: 8,
                border: "none",
                borderRadius: 14,
                padding: "14px 16px",
                background: "linear-gradient(135deg, var(--accent), var(--accent-2))",
                color: "#fff",
                fontWeight: 700
              }}
            >
              Выбрать
            </button>
          </article>
        ))}
      </section>
    </main>
  );
}
