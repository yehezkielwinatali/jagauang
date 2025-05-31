"use server";

import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { GoogleGenerativeAI } from "@google/generative-ai";
import aj from "@/lib/arcjet";
import { request } from "@arcjet/next";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

const serializeAmount = (obj: any) => ({
  ...obj,
  amount: obj.amount.toNumber(),
});

// Create Transaction
export async function createTransaction(data: any) {
  try {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");

    // Get request data for ArcJet
    const req = await request();

    // Check rate limit
    const decision = await aj.protect(req, {
      userId,
      requested: 1, // Specify how many tokens to consume
    });

    if (decision.isDenied()) {
      if (decision.reason.isRateLimit()) {
        const { remaining, reset } = decision.reason;
        console.error({
          code: "RATE_LIMIT_EXCEEDED",
          details: {
            remaining,
            resetInSeconds: reset,
          },
        });

        throw new Error("Too many requests. Please try again later.");
      }

      throw new Error("Request blocked");
    }

    const user = await db.user.findUnique({
      where: { clerkUserId: userId },
    });

    if (!user) {
      throw new Error("User not found");
    }

    const account = await db.account.findUnique({
      where: {
        id: data.accountId,
        userId: user.id,
      },
    });

    if (!account) {
      throw new Error("Account not found");
    }

    // Calculate new balance
    const balanceChange = data.type === "EXPENSE" ? -data.amount : data.amount;
    const newBalance = account.balance.toNumber() + balanceChange;

    // Create transaction and update account balance
    interface CreateTransactionData {
      accountId: string;
      type: "EXPENSE" | "INCOME";
      amount: number;
      date: string | Date;
      description?: string;
      category?: string;
      isRecurring?: boolean;
      recurringInterval?: RecurringInterval;
      [key: string]: any;
    }

    interface Transaction {
      id: string;
      userId: string;
      accountId: string;
      type: "EXPENSE" | "INCOME";
      amount: number;
      date: Date;
      description?: string;
      category?: string;
      isRecurring?: boolean;
      recurringInterval?: RecurringInterval | null;
      nextRecurringDate?: Date | null;
      [key: string]: any;
    }

    const transaction: Transaction = await db.$transaction(
      async (
        tx: import("@prisma/client").Prisma.TransactionClient
      ): Promise<Transaction> => {
        const newTransaction: Transaction = await tx.transaction.create({
          data: {
            ...(data as CreateTransactionData),
            userId: user.id,
            nextRecurringDate:
              data.isRecurring && data.recurringInterval
                ? calculateNextRecurringDate(data.date, data.recurringInterval)
                : null,
          },
        });

        await tx.account.update({
          where: { id: data.accountId },
          data: { balance: newBalance },
        });

        return newTransaction;
      }
    );

    revalidatePath("/dashboard");
    revalidatePath(`/account/${transaction.accountId}`);

    return { success: true, data: serializeAmount(transaction) };
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(error.message);
    } else {
      throw new Error(String(error));
    }
  }
}

interface GetTransactionResult {
  id: string;
  userId: string;
  accountId: string;
  type: "EXPENSE" | "INCOME";
  amount: number;
  date: Date;
  description?: string;
  category?: string;
  isRecurring?: boolean;
  recurringInterval?: RecurringInterval | null;
  nextRecurringDate?: Date | null;
  [key: string]: any;
}

export async function getTransaction(
  id: string
): Promise<GetTransactionResult> {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const user = await db.user.findUnique({
    where: { clerkUserId: userId },
  });

  if (!user) throw new Error("User not found");

  const transaction = await db.transaction.findUnique({
    where: {
      id,
      userId: user.id,
    },
  });

  if (!transaction) throw new Error("Transaction not found");

  return serializeAmount(transaction) as GetTransactionResult;
}

interface UpdateTransactionData {
  accountId: string;
  type: "EXPENSE" | "INCOME";
  amount: number;
  date: string | Date;
  description?: string;
  category?: string;
  isRecurring?: boolean;
  recurringInterval?: RecurringInterval;
  [key: string]: any;
}

interface UpdatedTransactionResult {
  success: boolean;
  data: any;
}

export async function updateTransaction(
  id: string,
  data: UpdateTransactionData
): Promise<UpdatedTransactionResult> {
  try {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");

    const user = await db.user.findUnique({
      where: { clerkUserId: userId },
    });

    if (!user) throw new Error("User not found");

    // Get original transaction to calculate balance change
    const originalTransaction = await db.transaction.findUnique({
      where: {
        id,
        userId: user.id,
      },
      include: {
        account: true,
      },
    });

    if (!originalTransaction) throw new Error("Transaction not found");

    // Calculate balance changes
    const oldBalanceChange =
      originalTransaction.type === "EXPENSE"
        ? -originalTransaction.amount.toNumber()
        : originalTransaction.amount.toNumber();

    const newBalanceChange =
      data.type === "EXPENSE" ? -data.amount : data.amount;

    const netBalanceChange = newBalanceChange - oldBalanceChange;

    // Update transaction and account balance in a transaction
    const transaction = await db.$transaction(
      async (tx: import("@prisma/client").Prisma.TransactionClient) => {
        const updated = await tx.transaction.update({
          where: {
            id,
            userId: user.id,
          },
          data: {
            ...data,
            nextRecurringDate:
              data.isRecurring && data.recurringInterval
                ? calculateNextRecurringDate(data.date, data.recurringInterval)
                : null,
          },
        });

        // Update account balance
        await tx.account.update({
          where: { id: data.accountId },
          data: {
            balance: {
              increment: netBalanceChange,
            },
          },
        });

        return updated;
      }
    );

    revalidatePath("/dashboard");
    revalidatePath(`/account/${data.accountId}`);

    return { success: true, data: serializeAmount(transaction) };
  } catch (error: any) {
    throw new Error(error.message);
  }
}

// Get User Transactions
export async function getUserTransactions(query = {}) {
  try {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");

    const user = await db.user.findUnique({
      where: { clerkUserId: userId },
    });

    if (!user) {
      throw new Error("User not found");
    }

    const transactions = await db.transaction.findMany({
      where: {
        userId: user.id,
        ...query,
      },
      include: {
        account: true,
      },
      orderBy: {
        date: "desc",
      },
    });

    return { success: true, data: transactions };
  } catch (error: any) {
    throw new Error(error.message);
  }
}

// Scan Receipt
interface ScanReceiptResult {
  amount: number;
  date: Date;
  description: string;
  category: string;
  merchantName: string;
}

interface GeminiReceiptResponse {
  amount: number | string;
  date: string;
  description: string;
  merchantName: string;
  category: string;
}

export async function scanReceipt(file: File): Promise<ScanReceiptResult> {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    // Convert File to ArrayBuffer
    const arrayBuffer: ArrayBuffer = await file.arrayBuffer();
    // Convert ArrayBuffer to Base64
    const base64String: string = Buffer.from(arrayBuffer).toString("base64");

    const prompt: string = `
            Analyze this receipt image and extract the following information in JSON format:
            - Total amount (just the number)
            - Date (in ISO format)
            - Description or items purchased (brief summary)
            - Merchant/store name
            - Suggested category (one of: housing,transportation,groceries,utilities,entertainment,food,shopping,healthcare,education,personal,travel,insurance,gifts,bills,other-expense )

            Only respond with valid JSON in this exact format:
            {
                "amount": number,
                "date": "ISO date string",
                "description": "string",
                "merchantName": "string",
                "category": "string"
            }

            If its not a recipt, return an empty object
        `;

    const result = await model.generateContent([
      {
        inlineData: {
          data: base64String,
          mimeType: file.type,
        },
      },
      prompt,
    ]);

    const response = await result.response;
    const text: string = response.text();
    const cleanedText: string = text.replace(/```(?:json)?\n?/g, "").trim();

    try {
      const data: GeminiReceiptResponse = JSON.parse(cleanedText);
      return {
        amount: parseFloat(data.amount as string),
        date: new Date(data.date),
        description: data.description,
        category: data.category,
        merchantName: data.merchantName,
      };
    } catch (parseError) {
      console.error("Error parsing JSON response:", parseError);
      throw new Error("Invalid response format from Gemini");
    }
  } catch (error: any) {
    console.error("Error scanning receipt:", error);
    throw new Error("Failed to scan receipt");
  }
}

// Helper function to calculate next recurring date
type RecurringInterval = "DAILY" | "WEEKLY" | "MONTHLY" | "YEARLY";

function calculateNextRecurringDate(
  startDate: string | Date,
  interval: RecurringInterval
): Date {
  const date = new Date(startDate);

  switch (interval) {
    case "DAILY":
      date.setDate(date.getDate() + 1);
      break;
    case "WEEKLY":
      date.setDate(date.getDate() + 7);
      break;
    case "MONTHLY":
      date.setMonth(date.getMonth() + 1);
      break;
    case "YEARLY":
      date.setFullYear(date.getFullYear() + 1);
      break;
  }

  return date;
}
