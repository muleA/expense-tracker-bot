import { Bot, Context, InputFile } from "grammy";
import { findOrCreateUser } from "../services/user.service";
import { supabase } from "../database/supabase";
import dayjs from "dayjs";
import fs from "fs";
import { showTyping } from "../utils/typing";
import { generateCsv } from "../utils/generate-cv";

export const registerReportCommand = (bot: Bot) => {
  bot.command("report", async (ctx: Context) => {
    await showTyping(ctx);

    const telegramId = ctx.from?.id;
    const firstName = ctx.from?.first_name ?? "";
    const lastName = ctx.from?.last_name ?? "";
    const username = ctx.from?.username ?? "";

    if (!telegramId || !ctx.chat?.id) {
      return ctx.reply("❌ Something went wrong. Please try again.");
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
        return ctx.reply("❌ User not found. Please use /start first.");
      }

      const startOfMonth = dayjs().startOf("month").toISOString();
      const { data: expenses, error } = await supabase
        .from("expenses")
        .select("*")
        .eq("user_id", user.id)
        .gte("created_at", startOfMonth);

      if (error || !expenses || expenses.length === 0) {
        await ctx.api.editMessageText(
          ctx.chat.id,
          loadingMsg.message_id,
          "📭 No expenses recorded this month yet.\n💡 Try: '🍔 Lunch 150'",
          { parse_mode: "HTML" }
        );
        return;
      }

      const filePath = await generateCsv(expenses, user.id);
      await ctx.replyWithDocument(new InputFile(fs.createReadStream(filePath)));
      fs.unlinkSync(filePath); // Clean up the temporary CSV file
    } catch (error) {
      console.error("Report error:", error);
      ctx.reply("❌ Failed to generate report. Please try again later.");
    }
  });
};
