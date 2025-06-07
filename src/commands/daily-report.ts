import { Bot, Context } from "grammy";
import { findOrCreateUser } from "../services/user.service";
import { supabase } from "../database/supabase";
import dayjs from "dayjs";
import { showTyping } from "../utils/typing";

export const registerDailyReportCommand = (bot: Bot) => {
  bot.command("dailyreport", async (ctx: Context) => {
    await showTyping(ctx);

    const telegramId = ctx.from?.id;
    const firstName = ctx.from?.first_name ?? "";
    const lastName = ctx.from?.last_name ?? "";
    const username = ctx.from?.username ?? "";
    const chatId = ctx.chat?.id;

    if (!telegramId || !chatId) {
      return ctx.reply("❌ Something went wrong. Please try again.", {
        reply_markup: { remove_keyboard: true } as any,
      });
    }

    try {
      await findOrCreateUser(telegramId, firstName, lastName, username);
      const loadingMsg = await ctx.reply("📊 Generating your daily report...");

      const { data: user } = await supabase
        .from("users")
        .select("id")
        .eq("telegram_id", telegramId)
        .single();

      if (!user) {
        return ctx.reply("❌ User not found. Please use /start first.", {
          reply_markup: { remove_keyboard: true } as any,
        });
      }

      const startOfDay = dayjs().startOf("day").toISOString();
      const endOfDay = dayjs().endOf("day").toISOString();
      const { data: expenses, error } = await supabase
        .from("expenses")
        .select("description, category, amount, currency, created_at")
        .eq("user_id", user.id)
        .gte("created_at", startOfDay)
        .lte("created_at", endOfDay);

      if (error || !expenses || expenses.length === 0) {
        await ctx.api.editMessageText(
          chatId,
          loadingMsg.message_id,
          "📭 No expenses recorded today yet.\n💡 Try: '🍔 Lunch 150'",
          {
            parse_mode: "HTML",
            reply_markup: {
              remove_keyboard: true,
            } as any,
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
        `📅 <b>Daily Report (Today)</b>\n\n` +
          `${report}\n\n` +
          `💸 <b>Total:</b> ${total.toLocaleString()} ETB\n` +
          `📌 <b>Tip:</b> Use <code>/weeklyreport</code> for a weekly summary!`,
        {
          parse_mode: "HTML",
          reply_markup: { remove_keyboard: true } as any,
        }
      );
    } catch (error) {
      console.error("Daily report error:", error);
      await ctx.reply(
        "❌ Failed to generate daily report. Please try again later.",
        {
          reply_markup: { remove_keyboard: false } as any,
        }
      );
    }
  });
};
