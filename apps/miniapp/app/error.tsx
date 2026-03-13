"use client";

export default function Error({
  error,
  reset
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main style={{ padding: 24, maxWidth: 480, margin: "0 auto" }}>
      <h1 style={{ fontSize: 22 }}>Ошибка загрузки</h1>
      <p style={{ color: "var(--muted)" }}>
        Сервер не смог отдать страницу. Часто это таймаут к API или упавший туннель.
      </p>
      {error.digest ? (
        <p style={{ fontSize: 12, color: "var(--muted)" }}>Digest: {error.digest}</p>
      ) : null}
      <button
        type="button"
        onClick={() => reset()}
        style={{
          marginTop: 16,
          padding: "12px 16px",
          borderRadius: 12,
          border: "none",
          background: "linear-gradient(135deg, var(--accent), var(--accent-2))",
          color: "#fff",
          fontWeight: 600
        }}
      >
        Попробовать снова
      </button>
    </main>
  );
}
