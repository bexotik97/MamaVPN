import { Bot, Context, InlineKeyboard } from "grammy";
import { config as loadEnv } from "dotenv";
import { resolve } from "node:path";

loadEnv({ path: resolve(process.cwd(), "../../.env") });
loadEnv();

const token = process.env.TELEGRAM_BOT_TOKEN;
const apiBaseUrl = process.env.API_BASE_URL ?? "http://localhost:3000";
const webAppUrl = process.env.TELEGRAM_WEBAPP_URL ?? "http://localhost:3001";

if (!token) {
  throw new Error("TELEGRAM_BOT_TOKEN is required");
}

const bot = new Bot(token);

bot.catch((error) => {
  console.error("Telegram bot update failed:", error.error);
});

const mainKeyboard = () => {
  const keyboard = new InlineKeyboard()
    .text("Попробовать бесплатно", "trial:start")
    .row()
    .text("Выбрать тариф", "plans:list")
    .text("Поддержка", "support:start")
    .row()
    .text("Диагностика", "diag:start")
    .text("Рефералка", "ref:start")
    .row();

  if (webAppUrl.startsWith("https://")) {
    return keyboard.webApp("Открыть кабинет", webAppUrl);
  }

  return keyboard;
};

const backKeyboard = (target: string) => new InlineKeyboard().text("Назад", target);

const platformKeyboard = () =>
  new InlineKeyboard()
    .text("iPhone", "trial:ios")
    .text("Android", "trial:android")
    .row()
    .text("macOS", "trial:macos")
    .text("Windows", "trial:windows")
    .row()
    .text("Linux", "trial:linux")
    .text("Android TV", "trial:android_tv")
    .row()
    .text("Назад", "nav:main");

const supportKeyboard = () =>
  new InlineKeyboard()
    .text("Не подключается", "support:cannot_connect")
    .row()
    .text("Нужно обновить конфиг", "support:update_config")
    .row()
    .text("Платеж не найден", "support:payment_missing")
    .row()
    .text("Нужен оператор", "support:operator")
    .row()
    .text("Назад", "nav:main");

async function postJson<T>(path: string, body: unknown): Promise<T> {
  const response = await fetch(`${apiBaseUrl}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(body)
  });

  if (!response.ok) {
    throw new Error(`API request failed: ${response.status}`);
  }

  return response.json() as Promise<T>;
}

async function getJson<T>(path: string): Promise<T> {
  const response = await fetch(`${apiBaseUrl}${path}`);

  if (!response.ok) {
    throw new Error(`API request failed: ${response.status}`);
  }

  return response.json() as Promise<T>;
}

function getRequiredFrom(ctx: Context) {
  if (!ctx.from) {
    throw new Error("Telegram user context is missing");
  }

  return ctx.from;
}

async function renderScreen(ctx: Context, text: string, replyMarkup?: InlineKeyboard) {
  const options = replyMarkup ? { reply_markup: replyMarkup } : undefined;

  if (ctx.callbackQuery?.message) {
    try {
      await ctx.editMessageText(text, options);
      return;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);

      if (!message.includes("message is not modified")) {
        console.warn("Falling back to reply after edit failure:", message);
      }
    }
  }

  await ctx.reply(text, options);
}

async function renderMainMenu(ctx: Context) {
  await renderScreen(
    ctx,
    [
      "Главное меню MamaVPN.",
      "",
      "Что делаем дальше?"
    ].join("\n"),
    mainKeyboard()
  );
}

async function renderTrialMenu(ctx: Context) {
  await renderScreen(ctx, "Выбери устройство для быстрого старта:", platformKeyboard());
}

async function renderPlansMenu(ctx: Context) {
  const plans = await getJson<
    Array<{ code: string; title: string; priceRub: number; deviceLimit: number; isTrial: boolean }>
  >("/plans");

  const keyboard = new InlineKeyboard();
  plans
    .filter((plan) => !plan.isTrial)
    .forEach((plan) => keyboard.text(`${plan.title} · ${plan.priceRub}₽`, `buy:${plan.code}`).row());
  keyboard.text("Назад", "nav:main");

  await renderScreen(ctx, "Доступные тарифы:", keyboard);
}

async function renderSupportMenu(ctx: Context) {
  await renderScreen(ctx, "Выбери тип проблемы:", supportKeyboard());
}

async function renderDiagnostics(ctx: Context) {
  await renderScreen(
    ctx,
    [
      "Быстрая диагностика:",
      "1. Проверь срок подписки",
      "2. Если не работает - обнови подписку",
      "3. Если не помогло - запроси запасной ключ через поддержку"
    ].join("\n"),
    backKeyboard("nav:main")
  );
}

async function renderReferralProfile(ctx: Context) {
  const from = getRequiredFrom(ctx);
  const referral = await getJson<{
    inviteLink: string;
    totalReferrals: number;
    rewardRub: number;
    rewardDays: number;
  }>(`/referrals/telegram/${from.id}`);

  await renderScreen(
    ctx,
    [
      `Твоя ссылка: ${referral.inviteLink}`,
      `Рефералов: ${referral.totalReferrals}`,
      `Накоплено ₽: ${referral.rewardRub}`,
      `Накоплено дней: ${referral.rewardDays}`
    ].join("\n"),
    backKeyboard("nav:main")
  );
}

bot.command("start", async (ctx) => {
  const from = getRequiredFrom(ctx);
  await postJson("/subscriptions/bootstrap", {
    telegramUserId: String(from.id),
    username: from.username,
    firstName: from.first_name,
    lastName: from.last_name,
    languageCode: from.language_code
  });

  await ctx.reply(
    [
      "Привет. Это MamaVPN.",
      "Быстрый Telegram-first VPN с trial, подписками и поддержкой внутри Telegram.",
      "",
      "Что делаем дальше?"
    ].join("\n"),
    { reply_markup: mainKeyboard() }
  );
});

bot.callbackQuery("nav:main", async (ctx) => {
  await ctx.answerCallbackQuery();
  await renderMainMenu(ctx);
});

bot.callbackQuery("nav:trial", async (ctx) => {
  await ctx.answerCallbackQuery();
  await renderTrialMenu(ctx);
});

bot.callbackQuery("nav:plans", async (ctx) => {
  await ctx.answerCallbackQuery();
  await renderPlansMenu(ctx);
});

bot.callbackQuery("nav:support", async (ctx) => {
  await ctx.answerCallbackQuery();
  await renderSupportMenu(ctx);
});

bot.callbackQuery("trial:start", async (ctx) => {
  await ctx.answerCallbackQuery();
  await renderTrialMenu(ctx);
});

bot.callbackQuery(/^trial:(ios|android|macos|windows|linux|android_tv)$/, async (ctx) => {
  await ctx.answerCallbackQuery();
  const from = getRequiredFrom(ctx);
  const platform = ctx.callbackQuery.data.replace("trial:", "");
  const trial = await postJson<{
    subscriptionUrl: string;
    fallbackSubscriptionUrl?: string;
    expiresAt: string;
  }>("/subscriptions/trial", {
    telegramUserId: String(from.id),
    username: from.username,
    firstName: from.first_name,
    lastName: from.last_name,
    languageCode: from.language_code,
    platform
  });

  await renderScreen(
    ctx,
    [
      "Trial активирован.",
      `Доступ до: ${new Date(trial.expiresAt).toLocaleString("ru-RU")}`,
      `Основная подписка: ${trial.subscriptionUrl}`,
      trial.fallbackSubscriptionUrl ? `Запасной вариант: ${trial.fallbackSubscriptionUrl}` : ""
    ]
      .filter(Boolean)
      .join("\n"),
    new InlineKeyboard()
      .text("Выбрать тариф", "plans:list")
      .row()
      .text("Назад", "nav:trial")
  );
});

bot.callbackQuery("plans:list", async (ctx) => {
  await ctx.answerCallbackQuery();
  await renderPlansMenu(ctx);
});

bot.callbackQuery(/^buy:(.+)$/, async (ctx) => {
  await ctx.answerCallbackQuery();
  const from = getRequiredFrom(ctx);
  const planCode = ctx.callbackQuery.data.replace("buy:", "");
  const result = await postJson<{
    subscriptionId: string;
    invoice: { paymentId: string; amountRub: number; payUrl?: string };
  }>("/subscriptions/purchase", {
    telegramUserId: String(from.id),
    username: from.username,
    firstName: from.first_name,
    lastName: from.last_name,
    languageCode: from.language_code,
    planCode
  });

  const keyboard = new InlineKeyboard()
    .text("Подтвердить mock-оплату", `pay:${result.invoice.paymentId}`)
    .row()
    .text("Назад", "nav:plans");

  await renderScreen(
    ctx,
    `Счет создан на ${result.invoice.amountRub}₽. Для MVP можно завершить mock-оплату кнопкой ниже.`,
    keyboard
  );
});

bot.callbackQuery(/^pay:(.+)$/, async (ctx) => {
  await ctx.answerCallbackQuery();
  const paymentId = ctx.callbackQuery.data.replace("pay:", "");
  const subscription = await postJson<{ subscriptionUrl?: string | null }>(
    `/subscriptions/activate-payment/${paymentId}`,
    {}
  );

  await renderScreen(
    ctx,
    subscription.subscriptionUrl
      ? `Оплата подтверждена. Подписка активна: ${subscription.subscriptionUrl}`
      : "Оплата подтверждена. Подписка активирована.",
    backKeyboard("nav:plans")
  );
});

bot.callbackQuery("support:start", async (ctx) => {
  await ctx.answerCallbackQuery();
  await renderSupportMenu(ctx);
});

bot.callbackQuery(/^support:(.+)$/, async (ctx) => {
  await ctx.answerCallbackQuery();
  const from = getRequiredFrom(ctx);
  const diagnosticCode = ctx.callbackQuery.data.replace("support:", "");
  const topicMap: Record<string, string> = {
    cannot_connect: "Не подключается",
    update_config: "Нужно обновить конфиг",
    payment_missing: "Платеж не найден",
    operator: "Нужен оператор"
  };

  await postJson("/support/tickets", {
    telegramUserId: String(from.id),
    diagnosticCode,
    topic: topicMap[diagnosticCode] ?? "Поддержка",
    details: {
      fromBot: true
    }
  });

  await renderScreen(
    ctx,
    [
      `Тикет создан: ${topicMap[diagnosticCode] ?? "Поддержка"}.`,
      "В MVP обращение ушло в backend и доступно через admin endpoints."
    ].join("\n"),
    backKeyboard("nav:support")
  );
});

bot.callbackQuery("diag:start", async (ctx) => {
  await ctx.answerCallbackQuery();
  await renderDiagnostics(ctx);
});

bot.callbackQuery("ref:start", async (ctx) => {
  await ctx.answerCallbackQuery();
  await renderReferralProfile(ctx);
});

console.log("Starting MamaVPN bot polling...");
bot.start().catch((error) => {
  console.error("Telegram bot failed to start:", error);
  process.exit(1);
});
