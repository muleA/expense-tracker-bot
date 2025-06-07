import { supabase } from "../database/supabase";

export interface UserProfile {
  username: string;
  last_name: any;
  id: string;
  telegram_id: number;
  first_name: string;
  created_at: string;
  monthly_budget?: number;
  total_expenses?: number;
  expenses_count?: number;
}

export const getUserProfile = async (
  telegramId: number
): Promise<UserProfile> => {
  try {
    // Get user basic info
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("*")
      .eq("telegram_id", telegramId)
      .single();

    if (userError || !user) {
      throw new Error("User not found");
    }

    // Get budget info
    const { data: budget } = await supabase
      .from("budgets")
      .select("monthly_limit")
      .eq("user_id", user.id)
      .single();

    // Get expenses summary
    const { data: expenses } = await supabase
      .from("expenses")
      .select("amount")
      .eq("user_id", user.id)
      .gte(
        "created_at",
        new Date(
          new Date().getFullYear(),
          new Date().getMonth(),
          1
        ).toISOString()
      );

    const totalExpenses =
      expenses?.reduce((sum, e) => sum + parseFloat(e.amount), 0) || 0;

    return {
      ...user,
      monthly_budget: budget?.monthly_limit,
      total_expenses: totalExpenses,
      expenses_count: expenses?.length || 0,
    };
  } catch (error) {
    console.error("Error fetching user profile:", error);
    throw error;
  }
};
