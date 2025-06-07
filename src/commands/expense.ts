import { Bot, Context } from "grammy";
import { findOrCreateUser } from "../services/user.service";
import { addExpense } from "../services/expense.service";
import { parseExpense } from "../utils/parse-expense";
import { showTyping } from "../utils/typing";
import { checkBudgetAlert } from "../services/budget.service";

export const registerExpenseHandler = (bot: Bot) => {
  bot.on("message:text", async (ctx: Context) => {
    await showTyping(ctx);

    const telegramId = ctx.from?.id;
    const text = ctx.message?.text;
    const firstName = ctx.from?.first_name ?? "";
    const lastName = ctx.from?.last_name ?? "";
    const username = ctx.from?.username ?? "";

    if (!telegramId || !text || text.startsWith("/") || !ctx.chat?.id) return;

    try {
      await findOrCreateUser(telegramId, firstName, lastName, username);
    } catch (err) {
      console.error("User creation error:", err);
      return ctx.reply("❌ Please use /start first.");
    }

    const parsed = parseExpense(text);
    if (!parsed) {
      return ctx.reply(
        "📝 I couldn't understand that expense format.\n\n" +
          "<b>Examples:</b>\n" +
          '• "🍔 Lunch 150"\n' +
          '• "🚕 Taxi 80 ETB"\n' +
          '• "🏠 Rent 5000 birr"\n\n' +
          "🔍 <i>Include amount and emoji if possible.</i>",
        { parse_mode: "HTML" }
      );
    }

    try {
      const processingMsg = await ctx.reply("💸 Processing your expense...");
      const { description, category, amount, currency } = parsed;

      await addExpense(telegramId, description, category, amount, currency);

      await ctx.api.editMessageText(
        ctx.chat.id,
        processingMsg.message_id,
        `✅ Expense added!\n\n📝 <b>Details:</b>\n• Category: ${category}\n• Description: ${description}\n• Amount: ${amount} ${currency}`,
        { parse_mode: "HTML" }
      );

      await checkBudgetAlert(ctx, telegramId);
    } catch (error) {
      console.error("Add expense error:", error);
      ctx.reply("❌ Failed to save your expense. Please try again.");
    }
  });
};
