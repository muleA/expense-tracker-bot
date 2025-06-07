import dotenv from "dotenv";
import { Bot } from "grammy";
import { registerStartCommand } from "./commands/start";
import { registerProfileCommand } from "./commands/profile";
import { registerDailyReportCommand } from "./commands/daily-report";
import { registerExpenseHandler } from "./commands/expense";
import { registerSetBudgetCommand } from "./commands/set-budget";
import { registerWeeklyReportCommand } from "./commands/weekly-report";
import { registerReportCommand } from "./commands/report";

dotenv.config();

// Initialize bot
const bot = new Bot(process.env.BOT_TOKEN!);

// Register commands and handlers
registerStartCommand(bot);
registerProfileCommand(bot);
registerSetBudgetCommand(bot);
registerDailyReportCommand(bot);
registerWeeklyReportCommand(bot);
registerReportCommand(bot);
registerProfileCommand(bot);
registerExpenseHandler(bot);
registerExpenseHandler(bot);

// Global error handling
bot.catch((err) => {
  console.error("Bot error:", err);
});

// Start the bot
bot.start();
