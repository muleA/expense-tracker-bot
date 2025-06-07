import { supabase } from "../database/supabase";

export interface User {
  id: string;
  telegram_id: number;
  username?: string;
  first_name: string;
  last_name?: string;
  created_at: string;
}

export const findOrCreateUser = async (
  telegramId: number,
  firstName: string,
  lastName?: string,
  username?: string
): Promise<User> => {
  try {
    const { data: existingUser, error: findError } = await supabase
      .from("users")
      .select("*")
      .eq("telegram_id", telegramId)
      .single();

    if (existingUser && !findError) {
      return existingUser;
    }

    const { data: createdUser, error: createError } = await supabase
      .from("users")
      .insert([
        {
          telegram_id: telegramId,
          first_name: firstName,
          last_name: lastName,
          username: username,
        },
      ])
      .select()
      .single();

    if (createError || !createdUser) {
      throw createError || new Error("Failed to create user");
    }

    return createdUser;
  } catch (error) {
    console.error("User service error:", error);
    throw new Error("User operation failed");
  }
};
