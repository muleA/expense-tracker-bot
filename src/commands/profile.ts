import { Bot, Context } from "grammy";
import { getUserProfile } from "../services/profile.service";
import { formatProfileMessage } from "../utils/profile.formatter";
import { showTyping } from "../utils/typing";

export const registerProfileCommand = (bot: Bot) => {
  bot.command("profile", async (ctx: Context) => {
    await showTyping(ctx);

    const telegramId = ctx.from?.id;
    if (!telegramId || !ctx.chat?.id) {
      return ctx.reply("❌ Something went wrong. Please try again.");
    }

    try {
      const loadingMsg = await ctx.reply("🔄 Fetching your profile...");
      const profile = await getUserProfile(telegramId);

      await ctx.api.editMessageText(
        ctx.chat.id,
        loadingMsg.message_id,
        formatProfileMessage(profile),
        { parse_mode: "HTML" }
      );
    } catch (error) {
      console.error("Profile error:", error);
      ctx.reply("❌ Couldn't fetch your profile. Please try /start first.");
    }
  });
};
