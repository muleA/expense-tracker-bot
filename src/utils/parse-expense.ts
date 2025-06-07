export const parseExpense = (message: string) => {
  const regex =
    /^([\p{Emoji_Presentation}\p{Emoji}\u200d\s]*)?([\w\s]+)\s+([\d.]+)(\s*\w*)?$/u;

  const match = message.match(regex);
  if (!match) return null;

  const [, emoji, desc, amt, currency] = match;

  return {
    category: (emoji || "").trim() || "General",
    description: desc.trim(),
    amount: parseFloat(amt),
    currency: (currency || "ETB").trim().toUpperCase(),
  };
};
