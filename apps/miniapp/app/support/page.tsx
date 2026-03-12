import Link from "next/link";

const diagnostics = [
  { title: "Подключение", status: "OK" },
  { title: "Протокол", status: "VLESS / Reality" },
  { title: "Скорость", status: "OK" },
  { title: "Обход блокировок", status: "OK" }
];

export default function SupportPage() {
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
          <div style={{ fontSize: 26, fontWeight: 700 }}>Поддержка и управление</div>
          <div style={{ color: "var(--muted)", marginTop: 8 }}>
            Обнови доступ, проверь диагностику или открой тикет
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
            Получить запасной ключ
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
            Написать в поддержку
          </button>
        </section>

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
          <div style={{ fontSize: 18, fontWeight: 700 }}>Диагностика</div>
          {diagnostics.map((item) => (
            <div
              key={item.title}
              style={{
                display: "flex",
                justifyContent: "space-between",
                color: item.status === "OK" ? "var(--success)" : "var(--text)"
              }}
            >
              <span style={{ color: "var(--muted)" }}>{item.title}</span>
              <span>{item.status}</span>
            </div>
          ))}
        </section>
      </section>
    </main>
  );
}
