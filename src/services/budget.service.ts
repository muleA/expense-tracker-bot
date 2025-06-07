import { Context } from "grammy";
import { supabase } from "../database/supabase";
import dayjs from "dayjs";

export const setUserBudget = async (
  telegramId: number,
  monthlyLimit: number
) => {
  const { data: user } = await supabase
    .from("users")
    .select("id")
    .eq("telegram_id", telegramId)
    .single();

  if (!user) throw new Error("User not found");

  const { data, error } = await supabase
    .from("budgets")
    .upsert([
      {
        user_id: user.id,
        monthly_limit: monthlyLimit,
      },
    ])
    .select()
    .single();

  if (error) throw error;

  return data;
};

export const getUserBudget = async (telegramId: number) => {
  const { data: user } = await supabase
    .from("users")
    .select("id")
    .eq("telegram_id", telegramId)
    .single();

  if (!user) return null;

  const { data: budget } = await supabase
    .from("budgets")
    .select("*")
    .eq("user_id", user.id)
    .single();

  return budget;
};

export const checkBudgetAlert = async (ctx: Context, telegramId: number) => {
  try {
    const budget = await getUserBudget(telegramId);
    if (!budget) return;

    const { data: expenses } = await supabase
      .from("expenses")
      .select("amount")
      .eq("user_id", budget.user_id)
      .gte("created_at", dayjs().startOf("month").toISOString());

    const totalSpent =
      expenses?.reduce((acc, cur) => acc + parseFloat(cur.amount), 0) || 0;
    const limit = parseFloat(budget.monthly_limit);
    const threshold = limit * (budget.alert_threshold ?? 0.8);

    if (totalSpent > threshold && totalSpent < limit) {
      const progress = Math.min(Math.round((totalSpent / limit) * 100), 100);
      const progressBar =
        "🟩".repeat(progress / 10) + "⬜".repeat(10 - progress / 10);

      await ctx.reply(
        `⚠️ <b>Budget Alert</b>\n\nYou've spent ${totalSpent.toLocaleString()} / ${limit.toLocaleString()} ETB.\n\n${progressBar} ${progress}%\n<i>Remaining: ${(
          limit - totalSpent
        ).toLocaleString()} ETB</i>`,
        { parse_mode: "HTML" }
      );
    } else if (totalSpent >= limit) {
      await ctx.reply(
        `🚨 <b>Budget Exceeded!</b>\n\nYou've spent ${totalSpent.toLocaleString()} ETB, exceeding your ${limit.toLocaleString()} ETB limit.\nOverspent by ${(
          totalSpent - limit
        ).toLocaleString()} ETB.`,
        { parse_mode: "HTML" }
      );
    }
  } catch (err) {
    console.error("Budget alert error:", err);
  }
};
