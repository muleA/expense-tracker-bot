import { Bot, Context } from "grammy";
import { setUserBudget } from "../services/budget.service";
import { showTyping } from "../utils/typing";

// In-memory state to track users waiting for budget input
const waitingForBudget: Record<
  number,
  { chatId: number; timeout: NodeJS.Timeout }
> = {};

export const registerSetBudgetCommand = (bot: Bot) => {
  // Handle /setbudget command
  bot.command("setbudget", async (ctx: Context) => {
    await showTyping(ctx);

    const telegramId = ctx.from?.id;
    const chatId = ctx.chat?.id;

    if (!telegramId || !chatId) {
      return ctx.reply("❌ Something went wrong. Please try again later.", {
        reply_markup: { remove_keyboard: true } as any,
      });
    }

    // Clear any existing timeout for this user
    if (waitingForBudget[telegramId]) {
      clearTimeout(waitingForBudget[telegramId].timeout);
    }

    // Set state to wait for budget input
    waitingForBudget[telegramId] = {
      chatId,
      timeout: setTimeout(() => {
        delete waitingForBudget[telegramId];
        ctx.reply("⌛ Budget input timed out. Please use /setbudget again.", {
          reply_markup: { remove_keyboard: true } as any,
        });
      }, 60 * 1000), // 1 minute timeout
    };

    await ctx.reply(
      "📝 Please enter your monthly budget amount (e.g., 5000).\n\n" +
        "<b>Example:</b>\n• 10000\n\n" +
        "🔍 <i>Enter a positive number.</i>",
      {
        parse_mode: "HTML",
        reply_markup: { remove_keyboard: true } as any,
      }
    );
  });

  // Handle follow-up numerical input
  bot.on("message:text", async (ctx: Context) => {
    const telegramId = ctx.from?.id;
    const chatId = ctx.chat?.id;
    const text = ctx.message?.text?.trim();

    if (!telegramId || !chatId || !text || !waitingForBudget[telegramId]) {
      return; // Ignore if not waiting for budget input
    }

    await showTyping(ctx);

    // Clear timeout and state
    clearTimeout(waitingForBudget[telegramId].timeout);
    delete waitingForBudget[telegramId];

    const value = parseFloat(text);
    if (isNaN(value) || value <= 0) {
      return ctx.reply(
        "❌ Please enter a valid positive number for your budget.\n\n" +
          "<b>Example:</b>\n• 5000\n\n" +
          "🔍 <i>Use /setbudget to try again.</i>",
        {
          parse_mode: "HTML",
          reply_markup: { remove_keyboard: true } as any,
        }
      );
    }

    try {
      const loadingMsg = await ctx.reply("🔄 Setting your budget...");
      await setUserBudget(telegramId, value);

      await ctx.api.editMessageText(
        chatId,
        loadingMsg.message_id,
        `✅ Budget set successfully!\n\n📌 New monthly budget: ${value.toLocaleString()} ETB\n💡 I'll notify you when you're close to exceeding it.`,
        {
          parse_mode: "HTML",
          reply_markup: {
            remove_keyboard: true,
            inline_keyboard: [],
          } as any,
        }
      );
    } catch (err) {
      console.error("Set budget error:", err);
      await ctx.reply("⚠️ Failed to set budget. Please try again later.", {
        reply_markup: { remove_keyboard: true } as any,
      });
    }
  });
};
