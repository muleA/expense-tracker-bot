import { createObjectCsvWriter } from "csv-writer";
import fs from "fs";
import path from "path";

export const generateCsv = async (
  expenses: any[],
  userId: number
): Promise<string> => {
  const filename = `expenses_${userId}_${Date.now()}.csv`;
  const filepath = path.join(__dirname, `../../tmp/${filename}`);

  const csvWriter = createObjectCsvWriter({
    path: filepath,
    header: [
      { id: "date", title: "Date" },
      { id: "category", title: "Category" },
      { id: "description", title: "Description" },
      { id: "amount", title: "Amount (ETB)" },
    ],
  });

  await csvWriter.writeRecords(
    expenses.map((e) => ({
      date: new Date(e.created_at).toLocaleDateString(),
      category: e.category,
      description: e.description,
      amount: e.amount,
    }))
  );

  return filepath;
};
