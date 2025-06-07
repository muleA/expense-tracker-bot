import { supabase } from "../database/supabase";

export const addExpense = async (
  telegramId: number,
  description: string,
  category: string,
  amount: number,
  currency = "ETB"
) => {
  // Get user
  const { data: user } = await supabase
    .from("users")
    .select("id")
    .eq("telegram_id", telegramId)
    .single();

  if (!user) throw new Error("User not found");

  const { data, error } = await supabase
    .from("expenses")
    .insert([
      {
        user_id: user.id,
        description,
        category,
        amount,
        currency,
      },
    ])
    .select()
    .single();

  if (error) throw error;

  return data;
};
