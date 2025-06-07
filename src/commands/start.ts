import { Bot, Context, Keyboard } from "grammy";
import { findOrCreateUser } from "../services/user.service";
import { getUserProfile } from "../services/profile.service";
import { formatProfileMessage } from "../utils/profile.formatter";
import { showTyping } from "../utils/typing";

export const registerStartCommand = (bot: Bot) => {
  bot.command("start", async (ctx: Context) => {
    const telegramId = ctx.from?.id;
    const firstName = ctx.from?.first_name ?? "User";
    const lastName = ctx.from?.last_name ?? "";
    const username = ctx.from?.username ?? "";
    const chatId = ctx.chat?.id;

    if (!telegramId || !chatId) {
      console.error("Invalid telegramId or chatId:", { telegramId, chatId });
      return ctx.reply("❌ Something went wrong. Please try again later.", {
        reply_markup: { remove_keyboard: true },
      });
    }

    try {
      await showTyping(ctx);

      // Create reply keyboard with updated commands (Reply keyboard, NOT inline keyboard)
      const mainKeyboard = new Keyboard()
        .text("/profile")
        .text("/setbudget")
        .row()
        .text("/dailyreport")
        .text("/weeklyreport")
        .row()
        .text("/monthlyreport")
        .text("/reportprofile")
        .row()
        .text("/addexpense")
        .resized()
        .oneTime();

      // Send a loading message
      const loadingMessage = await ctx.reply("🔄 Setting up your account...");

      // Create or find user
      await findOrCreateUser(telegramId, firstName, lastName, username);

      // Fetch user profile
      const profile = await getUserProfile(telegramId);

      // Format profile message
      const profileMessage = formatProfileMessage(profile);

      // Prepare welcome message text
      const welcomeMessage =
        `✨ <b>Welcome to Expense Tracker Bot!</b> ✨\n\n` +
        `${profileMessage}\n\n` +
        `📌 <b>How to use me:</b>\n` +
        `💸 Add expenses like: "🍕 Lunch 150" or use <code>/addexpense 🍕 Lunch 150</code>\n` +
        `🛠 Use the keyboard below to explore commands:\n` +
        `  ➡️ /profile - View your profile\n` +
        `  ➡️ /setbudget - Set monthly budget (enter a number after)\n` +
        `  ➡️ /dailyreport - Daily expense summary\n` +
        `  ➡️ /weeklyreport - Weekly expense summary\n` +
        `  ➡️ /monthlyreport - Monthly expense summary\n` +
        `  ➡️ /reportprofile - Detailed profile report\n` +
        `  ➡️ /addexpense - Add a new expense\n` +
        `💰 <b>Pro Tip:</b> Set a budget with <code>/setbudget</code> and enter a number like 5000!\n\n` +
        `📅 <i>Current time: June 7, 2025, 3:36 PM CDT</i>`;

      // Can't edit message to add reply keyboard, so delete loading message
      await ctx.api.deleteMessage(chatId, loadingMessage.message_id);

      // Send a NEW message with reply keyboard
      await ctx.reply(welcomeMessage, {
        reply_markup: mainKeyboard,
        parse_mode: "HTML",
      });
    } catch (error) {
      console.error("❌ Error in /start command:", error);
      await ctx.reply(
        "⚠️ Something went wrong while setting up your account. Please try again later.",
        { reply_markup: { remove_keyboard: true } }
      );
    }
  });
};
