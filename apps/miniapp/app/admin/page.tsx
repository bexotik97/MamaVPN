import Link from "next/link";
import { getAdminApiKey, ensureAdminEnv } from "../../lib/admin-env";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

type AdminOverview = {
  users: number;
  subscriptions: number;
  payments: number;
  openSupportTickets: number;
};

type AdminSubscription = {
  id: string;
  status: "trial" | "active" | "grace_period" | "expired" | "suspended";
  source: string;
  expiresAt: string | null;
  remainingDays: number | null;
  remainingHours: number | null;
  subscriptionUrl: string | null;
  fallbackSubscriptionUrl: string | null;
  plan: {
    code: string;
    title: string;
    priceRub: number;
  };
  user: {
    telegramUserId: string | null;
    username: string | null;
    displayName: string | null;
    referralCode: string;
  };
  latestAccessKey: {
    id: string;
    label: string;
    value: string;
    createdAt: string;
  } | null;
};

type AdminPageProps = {
  searchParams?: Promise<{
    status?: string;
    search?: string;
    login?: string; // e.g. /admin?login=error after failed loginAction
  }>;
};

const ADMIN_COOKIE_NAME = "mamavpn-admin-key";
const statusOptions = [
  { value: "", label: "Все" },
  { value: "active", label: "Active" },
  { value: "trial", label: "Trial" },
  { value: "grace_period", label: "Grace" },
  { value: "suspended", label: "Suspended" },
  { value: "expired", label: "Expired" }
] as const;

async function loginAction(formData: FormData) {
  "use server";

  ensureAdminEnv();
  const expected = getAdminApiKey();
  const apiKey = String(formData.get("apiKey") ?? "").trim();

  if (!expected || apiKey !== expected) {
    redirect("/admin?login=error");
  }

  const cookieStore = await cookies();
  cookieStore.set(ADMIN_COOKIE_NAME, apiKey, {
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 12
  });

  redirect("/admin");
}

async function logoutAction() {
  "use server";

  const cookieStore = await cookies();
  cookieStore.delete(ADMIN_COOKIE_NAME);
  redirect("/admin");
}

async function extendSubscriptionAction(formData: FormData) {
  "use server";

  await assertAdminSession();
  await mutateAdmin(`/admin/subscriptions/${String(formData.get("subscriptionId"))}/extend`, {
    days: Number(formData.get("days") ?? 30)
  });
  revalidatePath("/admin");
  redirectToAdmin(formData);
}

async function suspendSubscriptionAction(formData: FormData) {
  "use server";

  await assertAdminSession();
  await mutateAdmin(`/admin/subscriptions/${String(formData.get("subscriptionId"))}/suspend`);
  revalidatePath("/admin");
  redirectToAdmin(formData);
}

async function resumeSubscriptionAction(formData: FormData) {
  "use server";

  await assertAdminSession();
  await mutateAdmin(`/admin/subscriptions/${String(formData.get("subscriptionId"))}/resume`);
  revalidatePath("/admin");
  redirectToAdmin(formData);
}

async function refreshSubscriptionAction(formData: FormData) {
  "use server";

  await assertAdminSession();
  await mutateAdmin(`/admin/subscriptions/${String(formData.get("subscriptionId"))}/refresh`);
  revalidatePath("/admin");
  redirectToAdmin(formData);
}

export default async function AdminPage({ searchParams }: AdminPageProps) {
  ensureAdminEnv();
  const adminKey = getAdminApiKey();
  const params = (await searchParams) ?? {};
  const cookieStore = await cookies();
  const isAuthorized =
    !!adminKey && cookieStore.get(ADMIN_COOKIE_NAME)?.value === adminKey;

  if (!isAuthorized) {
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
          <Link href="/" style={{ color: "var(--muted)" }}>
            ← Назад
          </Link>

          <section
            style={{
              padding: 20,
              borderRadius: 22,
              background: "var(--panel)",
              border: "1px solid var(--panel-border)",
              display: "grid",
              gap: 14
            }}
          >
            <div>
              <div style={{ fontSize: 28, fontWeight: 800 }}>Admin Login</div>
              <div style={{ marginTop: 8, color: "var(--muted)" }}>
                Введи `ADMIN_API_KEY`, чтобы открыть управление подписками.
              </div>
            </div>

            {params.login === "error" ? (
              <div
                style={{
                  padding: "12px 14px",
                  borderRadius: 14,
                  border: "1px solid rgba(255, 107, 107, 0.35)",
                  background: "rgba(110, 18, 18, 0.28)",
                  color: "#ffc9c9"
                }}
              >
                Неверный admin key.
              </div>
            ) : null}

            <form action={loginAction} style={{ display: "grid", gap: 12 }}>
              <input
                type="password"
                name="apiKey"
                placeholder="ADMIN_API_KEY"
                style={{
                  width: "100%",
                  padding: "14px 16px",
                  borderRadius: 14,
                  border: "1px solid var(--panel-border)",
                  background: "rgba(8, 12, 24, 0.5)",
                  color: "var(--text)"
                }}
              />
              <button
                type="submit"
                style={{
                  border: "none",
                  borderRadius: 14,
                  padding: "14px 16px",
                  background: "linear-gradient(135deg, var(--accent), var(--accent-2))",
                  color: "#fff",
                  fontWeight: 700
                }}
              >
                Войти
              </button>
            </form>
          </section>
        </section>
      </main>
    );
  }

  const [overview, subscriptions] = await Promise.all([
    loadOverview(),
    loadSubscriptions(params.status, params.search)
  ]);

  return (
    <main style={{ padding: 20 }}>
      <section
        style={{
          maxWidth: 920,
          margin: "0 auto",
          display: "grid",
          gap: 16
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
          <Link href="/" style={{ color: "var(--muted)" }}>
            ← Назад в кабинет
          </Link>

          <form action={logoutAction}>
            <button
              type="submit"
              style={{
                border: "1px solid var(--panel-border)",
                borderRadius: 12,
                padding: "10px 14px",
                background: "rgba(8, 12, 24, 0.45)",
                color: "var(--text)"
              }}
            >
              Выйти
            </button>
          </form>
        </div>

        <header
          style={{
            padding: 20,
            borderRadius: 22,
            background: "var(--panel)",
            border: "1px solid var(--panel-border)",
            display: "grid",
            gap: 8
          }}
        >
          <div style={{ fontSize: 30, fontWeight: 800 }}>Admin Panel</div>
          <div style={{ color: "var(--muted)" }}>
            Управление подписками, сроками и ручными действиями по пользователям.
          </div>
        </header>

        <section
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
            gap: 12
          }}
        >
          {[
            { label: "Пользователи", value: overview.users },
            { label: "Подписки", value: overview.subscriptions },
            { label: "Платежи", value: overview.payments },
            { label: "Открытые тикеты", value: overview.openSupportTickets }
          ].map((item) => (
            <article
              key={item.label}
              style={{
                padding: 18,
                borderRadius: 18,
                background: "var(--panel)",
                border: "1px solid var(--panel-border)"
              }}
            >
              <div style={{ color: "var(--muted)", fontSize: 13 }}>{item.label}</div>
              <div style={{ fontSize: 30, fontWeight: 800, marginTop: 8 }}>{item.value}</div>
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
          <form
            method="GET"
            style={{
              display: "grid",
              gridTemplateColumns: "minmax(0, 1.4fr) minmax(0, 0.8fr) auto",
              gap: 10
            }}
          >
            <input
              type="text"
              name="search"
              defaultValue={params.search ?? ""}
              placeholder="Поиск по telegram id, username, subscription id"
              style={{
                width: "100%",
                padding: "14px 16px",
                borderRadius: 14,
                border: "1px solid var(--panel-border)",
                background: "rgba(8, 12, 24, 0.5)",
                color: "var(--text)"
              }}
            />

            <select
              name="status"
              defaultValue={params.status ?? ""}
              style={{
                width: "100%",
                padding: "14px 16px",
                borderRadius: 14,
                border: "1px solid var(--panel-border)",
                background: "rgba(8, 12, 24, 0.5)",
                color: "var(--text)"
              }}
            >
              {statusOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>

            <button
              type="submit"
              style={{
                border: "none",
                borderRadius: 14,
                padding: "14px 18px",
                background: "linear-gradient(135deg, var(--accent), var(--accent-2))",
                color: "#fff",
                fontWeight: 700
              }}
            >
              Найти
            </button>
          </form>

          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {statusOptions.map((option) => {
              const isActive = (params.status ?? "") === option.value;
              const href = buildAdminPath(option.value, params.search ?? "");

              return (
                <Link
                  key={option.label}
                  href={href}
                  style={{
                    padding: "8px 12px",
                    borderRadius: 999,
                    border: "1px solid var(--panel-border)",
                    background: isActive ? "rgba(123, 140, 255, 0.25)" : "rgba(8, 12, 24, 0.35)",
                    color: isActive ? "var(--text)" : "var(--muted)"
                  }}
                >
                  {option.label}
                </Link>
              );
            })}
          </div>
        </section>

        <section style={{ display: "grid", gap: 12 }}>
          {subscriptions.length === 0 ? (
            <article
              style={{
                padding: 18,
                borderRadius: 22,
                background: "var(--panel)",
                border: "1px solid var(--panel-border)",
                color: "var(--muted)"
              }}
            >
              Подписок не найдено.
            </article>
          ) : (
            subscriptions.map((subscription) => (
              <article
                key={subscription.id}
                style={{
                  padding: 18,
                  borderRadius: 22,
                  background: "var(--panel)",
                  border: "1px solid var(--panel-border)",
                  display: "grid",
                  gap: 14
                }}
              >
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "minmax(0, 1fr) auto",
                    gap: 12,
                    alignItems: "start"
                  }}
                >
                  <div style={{ display: "grid", gap: 6 }}>
                    <div style={{ fontSize: 20, fontWeight: 800 }}>
                      {subscription.user.username ? `@${subscription.user.username}` : "Без username"}
                    </div>
                    <div style={{ color: "var(--muted)" }}>
                      Telegram ID: {subscription.user.telegramUserId ?? "не найден"}
                    </div>
                    <div style={{ color: "var(--muted)" }}>
                      Имя: {subscription.user.displayName ?? "не указано"}
                    </div>
                  </div>

                  <div
                    style={{
                      padding: "8px 12px",
                      borderRadius: 999,
                      border: "1px solid var(--panel-border)",
                      background: statusColor(subscription.status),
                      fontSize: 13,
                      fontWeight: 700
                    }}
                  >
                    {subscription.status}
                  </div>
                </div>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
                    gap: 10
                  }}
                >
                  <Metric label="План" value={`${subscription.plan.title} · ${subscription.plan.priceRub}₽`} />
                  <Metric
                    label="Осталось"
                    value={
                      subscription.remainingDays === null
                        ? "Нет срока"
                        : subscription.remainingDays >= 2
                          ? `${subscription.remainingDays} дн`
                          : `${subscription.remainingHours ?? 0} ч`
                    }
                  />
                  <Metric
                    label="Истекает"
                    value={
                      subscription.expiresAt
                        ? new Date(subscription.expiresAt).toLocaleString("ru-RU")
                        : "Не задано"
                    }
                  />
                  <Metric label="Источник" value={subscription.source} />
                </div>

                <div style={{ display: "grid", gap: 6, color: "var(--muted)", fontSize: 14 }}>
                  <div>Subscription ID: {subscription.id}</div>
                  <div>Referral code: {subscription.user.referralCode}</div>
                  <div style={{ overflowWrap: "anywhere" }}>
                    URL: {subscription.subscriptionUrl ?? "нет"}
                  </div>
                  <div style={{ overflowWrap: "anywhere" }}>
                    Запасной URL: {subscription.fallbackSubscriptionUrl ?? "нет"}
                  </div>
                  <div style={{ overflowWrap: "anywhere" }}>
                    Последний запасной ключ: {subscription.latestAccessKey?.value ?? "нет"}
                  </div>
                </div>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "minmax(0, 1.1fr) repeat(3, auto)",
                    gap: 10,
                    alignItems: "end"
                  }}
                >
                  <form action={extendSubscriptionAction} style={{ display: "grid", gap: 8 }}>
                    <input type="hidden" name="subscriptionId" value={subscription.id} />
                    <input type="hidden" name="status" value={params.status ?? ""} />
                    <input type="hidden" name="search" value={params.search ?? ""} />
                    <label style={{ color: "var(--muted)", fontSize: 13 }}>Продлить на дней</label>
                    <div style={{ display: "grid", gridTemplateColumns: "90px auto", gap: 8 }}>
                      <input
                        type="number"
                        name="days"
                        min={1}
                        defaultValue={30}
                        style={{
                          width: "100%",
                          padding: "12px 14px",
                          borderRadius: 12,
                          border: "1px solid var(--panel-border)",
                          background: "rgba(8, 12, 24, 0.5)",
                          color: "var(--text)"
                        }}
                      />
                      <button type="submit" style={actionButtonStyle("primary")}>
                        Продлить
                      </button>
                    </div>
                  </form>

                  <ActionForm
                    action={subscription.status === "suspended" ? resumeSubscriptionAction : suspendSubscriptionAction}
                    label={subscription.status === "suspended" ? "Возобновить" : "Заморозить"}
                    subscriptionId={subscription.id}
                    status={params.status ?? ""}
                    search={params.search ?? ""}
                    tone={subscription.status === "suspended" ? "primary" : "neutral"}
                  />

                  <ActionForm
                    action={refreshSubscriptionAction}
                    label="Обновить доступ"
                    subscriptionId={subscription.id}
                    status={params.status ?? ""}
                    search={params.search ?? ""}
                    tone="neutral"
                  />
                </div>
              </article>
            ))
          )}
        </section>
      </section>
    </main>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div
      style={{
        padding: 14,
        borderRadius: 16,
        background: "rgba(8, 12, 24, 0.4)",
        border: "1px solid var(--panel-border)"
      }}
    >
      <div style={{ color: "var(--muted)", fontSize: 13 }}>{label}</div>
      <div style={{ marginTop: 8, fontWeight: 700 }}>{value}</div>
    </div>
  );
}

function ActionForm({
  action,
  label,
  subscriptionId,
  status,
  search,
  tone
}: {
  action: (formData: FormData) => Promise<void>;
  label: string;
  subscriptionId: string;
  status: string;
  search: string;
  tone: "primary" | "neutral";
}) {
  return (
    <form action={action} style={{ display: "grid", gap: 8 }}>
      <input type="hidden" name="subscriptionId" value={subscriptionId} />
      <input type="hidden" name="status" value={status} />
      <input type="hidden" name="search" value={search} />
      <button type="submit" style={actionButtonStyle(tone)}>
        {label}
      </button>
    </form>
  );
}

function actionButtonStyle(tone: "primary" | "neutral") {
  return {
    border: tone === "primary" ? "none" : "1px solid var(--panel-border)",
    borderRadius: 12,
    padding: "12px 14px",
    background:
      tone === "primary"
        ? "linear-gradient(135deg, var(--accent), var(--accent-2))"
        : "rgba(8, 12, 24, 0.45)",
    color: "#fff",
    fontWeight: 700
  } as const;
}

function statusColor(status: AdminSubscription["status"]) {
  switch (status) {
    case "active":
      return "rgba(86, 212, 138, 0.18)";
    case "trial":
      return "rgba(66, 199, 255, 0.18)";
    case "suspended":
      return "rgba(255, 160, 66, 0.2)";
    case "expired":
      return "rgba(255, 107, 107, 0.2)";
    default:
      return "rgba(123, 140, 255, 0.18)";
  }
}

async function loadOverview() {
  return callAdminApi<AdminOverview>("/admin/overview");
}

async function loadSubscriptions(status?: string, search?: string) {
  const query = new URLSearchParams();

  if (status) {
    query.set("status", status);
  }

  if (search) {
    query.set("search", search);
  }

  const suffix = query.toString() ? `?${query.toString()}` : "";
  return callAdminApi<AdminSubscription[]>(`/admin/subscriptions${suffix}`);
}

async function callAdminApi<T>(path: string, init?: RequestInit) {
  const response = await fetch(`${getApiBaseUrl()}${path}`, {
    ...init,
    headers: {
      "x-admin-api-key": getAdminApiKey() ?? "",
      ...(init?.headers ?? {})
    },
    cache: "no-store"
  });

  if (!response.ok) {
    throw new Error(`Admin API request failed: ${response.status}`);
  }

  return (await response.json()) as T;
}

async function mutateAdmin(path: string, body?: unknown) {
  await callAdminApi(path, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: body ? JSON.stringify(body) : undefined
  });
}

function buildAdminPath(status: string, search: string) {
  const query = new URLSearchParams();

  if (status) {
    query.set("status", status);
  }

  if (search) {
    query.set("search", search);
  }

  return `/admin${query.toString() ? `?${query.toString()}` : ""}`;
}

function redirectToAdmin(formData: FormData) {
  const status = String(formData.get("status") ?? "");
  const search = String(formData.get("search") ?? "");
  redirect(buildAdminPath(status, search));
}

async function assertAdminSession() {
  ensureAdminEnv();
  const adminKey = getAdminApiKey();
  const cookieStore = await cookies();

  if (!adminKey || cookieStore.get(ADMIN_COOKIE_NAME)?.value !== adminKey) {
    redirect("/admin");
  }
}

function getApiBaseUrl() {
  return process.env.API_BASE_URL ?? process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3000";
}
