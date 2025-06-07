import { Bot, Context, Keyboard } from "grammy";
import { findOrCreateUser } from "../services/user.service";
import { supabase } from "../database/supabase";
import dayjs from "dayjs";
import { showTyping } from "../utils/typing";

interface User {
  id: string;
}

interface Expense {
  description: string;
  category: string;
  amount: string; // stored as string in DB
  currency: string;
  created_at: string;
}

export const registerWeeklyReportCommand = (bot: Bot<Context>) => {
  bot.command("weeklyreport", async (ctx) => {
    await showTyping(ctx);

    const telegramId = ctx.from?.id;
    const firstName = ctx.from?.first_name ?? "";
    const lastName = ctx.from?.last_name ?? "";
    const username = ctx.from?.username ?? "";
    const chatId = ctx.chat?.id;

    if (!telegramId || !chatId) {
      return ctx.reply("❌ Something went wrong. Please retry.", {
        reply_markup: { remove_keyboard: true },
      });
    }

    try {
      await findOrCreateUser(telegramId, firstName, lastName, username);

      const loadingMsg = await ctx.reply("📊 Generating your weekly report...");

      // Fetch user record
      const { data: user, error: userError } = await supabase
        .from("users")
        .select("id")
        .eq("telegram_id", telegramId)
        .single();

      if (userError || !user) {
        return ctx.reply("❌ User not found. Please try /start first.", {
          reply_markup: { remove_keyboard: true },
        });
      }

      // Get start and end of current week (Sunday to Saturday by default)
      const startOfWeek = dayjs().startOf("week").toISOString();
      const endOfWeek = dayjs().endOf("week").toISOString();

      // Fetch expenses for the week
      const { data: expenses, error: expensesError } = await supabase
        .from("expenses")
        .select("description, category, amount, currency, created_at")
        .eq("user_id", user.id)
        .gte("created_at", startOfWeek)
        .lte("created_at", endOfWeek);

      if (expensesError || !expenses || expenses.length === 0) {
        await ctx.api.editMessageText(
          chatId,
          loadingMsg.message_id,
          "📖️💖 No expenses recorded this week yet.\n\nPlease try: '🍔 Lunch $150'",
          {
            parse_mode: "HTML",
            // Removed invalid property
          }
        );
        return;
      }

      const total = expenses.reduce(
        (sum, exp) => sum + parseFloat(exp.amount),
        0
      );

      const report = expenses
        .map(
          (exp) =>
            `• ${exp.category}: ${exp.description} (${parseFloat(
              exp.amount
            ).toLocaleString()} ${exp.currency})`
        )
        .join("\n");

      await ctx.api.editMessageText(
        chatId,
        loadingMsg.message_id,
        `📅 <b>Weekly Report (This Week)</b>\n\n${report}\n\n` +
          `💸 <b>Total:</b> ${total.toLocaleString()} ETB\n` +
          `📖 <b>Tip:</b> Use <code>/monthlyreport</code> for a monthly overview!`,
        {
          parse_mode: "HTML",
          reply_markup: {
            inline_keyboard: [],
          },
        }
      );
    } catch (err) {
      console.error("❌ Weekly report error:", err);
      await ctx.reply(
        "❌ Failed to generate weekly report. Please try again.",
        {
          reply_markup: { remove_keyboard: true },
        }
      );
    }
  });
};
