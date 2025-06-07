import { Bot, Context, InputFile } from "grammy";
import { findOrCreateUser } from "../services/user.service";
import { supabase } from "../database/supabase";
import dayjs from "dayjs";
import fs from "fs";
import { showTyping } from "../utils/typing";
import { generateCsv } from "../utils/generate-cv";

export const registerMonthlyReportCommand = (bot: Bot) => {
  bot.command("monthlyreport", async (ctx: Context) => {
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
      const loadingMsg = await ctx.reply(
        "📊 Generating your monthly report..."
      );

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

      const startOfMonth = dayjs().startOf("month").toISOString();
      const endOfMonth = dayjs().endOf("month").toISOString();
      const { data: expenses, error } = await supabase
        .from("expenses")
        .select("*")
        .eq("user_id", user.id)
        .gte("created_at", startOfMonth)
        .lte("created_at", endOfMonth);
      console.log("data", expenses);
      if (error || !expenses || expenses.length === 0) {
        await ctx.api.editMessageText(
          chatId,
          loadingMsg.message_id,
          "📭 No expenses recorded this month yet.\n💡 Try: '🍔 Lunch 150'",
          {
            parse_mode: "HTML",
            reply_markup: {
              remove_keyboard: true,
            } as any,
          }
        );
        return;
      }

      const filePath = await generateCsv(expenses, user.id);
      await ctx.replyWithDocument(
        new InputFile(fs.createReadStream(filePath)),
        {
          caption:
            `📅 <b>Monthly Report</b>\n\n` +
            `📊 Your expenses for this month have been exported to a CSV file.\n` +
            `📌 <b>Tip:</b> Use <code>/dailyreport</code> for today’s summary!`,
          parse_mode: "HTML",
          reply_markup: { remove_keyboard: true } as any,
        }
      );
      fs.unlinkSync(filePath); // Clean up the temporary CSV file
    } catch (error) {
      console.error("Monthly report error:", error);
      await ctx.reply(
        "❌ Failed to generate monthly report. Please try again later.",
        {
          reply_markup: { remove_keyboard: true } as any,
        }
      );
    }
  });
};
