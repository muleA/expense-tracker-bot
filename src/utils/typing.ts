import { Context } from "grammy";

export const showTyping = async (ctx: Context, duration = 1000) => {
  if (!ctx.chat?.id) {
    console.error("No chat ID available for typing action");
    return;
  }
  try {
    await ctx.api.sendChatAction(ctx.chat.id, "typing");
    return new Promise((resolve) => setTimeout(resolve, duration));
  } catch (error) {
    console.error("Error in showTyping:", error);
  }
};
