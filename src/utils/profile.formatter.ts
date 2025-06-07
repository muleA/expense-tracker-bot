import dayjs from "dayjs";
import { UserProfile } from "../services/profile.service";

export const formatProfileMessage = (profile: UserProfile): string => {
  // Format registration date and time
  const joinDateTime = dayjs(profile.created_at).format(
    "MMM D, YYYY [at] h:mm A"
  );

  // Format budget and expenses
  const budget = profile.monthly_budget
    ? `${profile.monthly_budget.toLocaleString()} ETB`
    : "Not set";
  const expenses = profile.total_expenses
    ? `${profile.total_expenses.toLocaleString()} ETB`
    : "0 ETB";

  // Calculate and format progress bar
  let progressBar = "";
  if (profile.monthly_budget && profile.total_expenses) {
    const progress = Math.min(
      Math.round((profile.total_expenses / profile.monthly_budget) * 100),
      100
    );
    const filled = Math.round(progress / 10);
    progressBar = `\n<span class="tg-spoiler">│${"█".repeat(
      filled
    )}${"─".repeat(10 - filled)}│</span> <b>${progress}%</b>`;
  }

  // Construct the fancy profile message
  return (
    `✨ <b>Expense Tracker Profile</b> ✨\n` +
    `──────────────────────\n\n` +
    `👤 <b>${profile.first_name} ${profile.last_name}</b>\n` +
    `📛 <b>Username:</b> @${profile.username || "Not set"}\n` +
    `📅 <b>Member Since:</b> ${joinDateTime}\n\n` +
    `💰 <b>Monthly Budget:</b> ${budget}\n` +
    `💸 <b>Expenses This Month:</b> ${expenses} (${profile.expenses_count} items)${progressBar}\n\n` +
    `📌 <b>Quick Tip:</b> Update your budget with <code>/setbudget [amount]</code>\n` +
    `──────────────────────\n` +
    `🌟 Keep track of your spending!`
  );
};
