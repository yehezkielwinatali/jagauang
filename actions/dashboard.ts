"use server";

import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

interface Account {
  id: string;
  name: string;
  balance: any;
  userId: string;
  isDefault: boolean;
  [key: string]: any;
}

interface SerializedAccount extends Omit<Account, "balance"> {
  balance: number;
}
interface CreateAccountData {
  name: string;
  balance: string | number;
  isDefault?: boolean;
  [key: string]: any;
}

interface CreateAccountResult {
  success: boolean;
  data: SerializedAccount;
}
const serializeTransaction = (obj: Account): SerializedAccount => {
  const serialized: SerializedAccount = { ...obj } as SerializedAccount;

  if (obj.balance != null) {
    serialized.balance = obj.balance.toNumber();
  } else {
    serialized.balance = 0;
  }

  if (obj.amount != null) {
    serialized.amount = obj.amount.toNumber();
  }

  return serialized;
};

export async function createAccount(
  data: CreateAccountData
): Promise<CreateAccountResult> {
  try {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");
    const user = await db.user.findUnique({
      where: {
        clerkUserId: userId,
      },
    });
    if (!user) {
      throw new Error("User not found");
    }
    const balanceFloat = parseFloat(data.balance as string);
    if (isNaN(balanceFloat)) {
      throw new Error("Invalid balance amount");
    }
    const existingAccounts = await db.account.findMany({
      where: {
        userId: user.id,
      },
    });
    const shouldBeDefault =
      existingAccounts.length === 0 ? true : data.isDefault;
    if (shouldBeDefault) {
      await db.account.updateMany({
        where: { userId: user.id, isDefault: true },
        data: {
          isDefault: false,
        },
      });
    }
    const account = await db.account.create({
      data: {
        ...data,
        balance: balanceFloat,
        userId: user.id,
        isDefault: shouldBeDefault,
      },
    });

    const serializedAccount = serializeTransaction(account);
    revalidatePath("/dashboard");
    return { success: true, data: serializedAccount };
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(error.message);
    } else {
      throw new Error("An unknown error occurred");
    }
  }
}

export async function getUserAccounts(): Promise<SerializedAccount[]> {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const user = await db.user.findUnique({
    where: {
      clerkUserId: userId,
    },
  });

  if (!user) {
    throw new Error("User not found");
  }

  const accounts = await db.account.findMany({
    where: {
      userId: user.id,
    },
    orderBy: {
      createdAt: "desc",
    },
    include: {
      _count: {
        select: {
          transactions: true,
        },
      },
    },
  });

  const serializedAccounts = accounts.map(serializeTransaction);
  return serializedAccounts;
}
export async function getDashboardData() {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const user = await db.user.findUnique({
    where: { clerkUserId: userId },
  });

  if (!user) {
    throw new Error("User not found");
  }

  const transactions = await db.transaction.findMany({
    where: { userId: user.id },
    orderBy: { date: "desc" },
  });

  return transactions.map(serializeTransaction);
}
