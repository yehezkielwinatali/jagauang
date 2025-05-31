import { getUserAccounts } from "@/actions/dashboard";
import { defaultCategories } from "@/data/categories";
import { getTransaction } from "@/actions/transaction";
import { AddTransactionForm } from "../_components/transaction_form";

// Helper to serialize Account from Prisma (convert Decimal to number)
function serializeAccount(account: any) {
  return {
    ...account,
    balance: account.balance?.toNumber
      ? account.balance.toNumber()
      : account.balance,
    createdAt: account.createdAt?.toISOString(),
    updatedAt: account.updatedAt?.toISOString(),
  };
}

// Helper to serialize Transaction (Decimal and Date conversion)
// Includes nested account serialization if present
function serializeTransactionFull(tx: any) {
  return {
    ...tx,
    amount: tx.amount?.toNumber ? tx.amount.toNumber() : tx.amount,
    date: tx.date?.toISOString(),
    createdAt: tx.createdAt?.toISOString(),
    updatedAt: tx.updatedAt?.toISOString(),
    account: tx.account ? serializeAccount(tx.account) : undefined,
  };
}

export default async function AddTransactionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: editId } = await params;
  console.log("Edit ID:", editId);

  const accountsRaw = await getUserAccounts();

  type InitialData = {
    type: string;
    amount: number;
    description: string;
    accountId: string;
    category: string;
    date: string;
    isRecurring: boolean;
    recurringInterval?: string;
  };

  let initialData: InitialData | null = null;

  if (editId) {
    const transactionRaw = await getTransaction(editId);
    if (transactionRaw) {
      initialData = serializeTransactionFull(transactionRaw) as InitialData;
    }
  }

  // Serialize accounts array
  const accounts = Array.isArray(accountsRaw)
    ? accountsRaw.map(serializeAccount)
    : [];
  console.log("accountsRaw", accountsRaw);
  console.log("accounts", accounts);

  return (
    <div className="max-w-3xl mx-auto px-5">
      <div className="flex justify-center md:justify-normal mb-8">
        <h1 className="text-5xl gradient-title ">
          {editId ? "Update Transaction" : "Add Transaction"}
        </h1>
      </div>
      <AddTransactionForm
        accounts={accounts}
        categories={defaultCategories}
        initialData={initialData}
        editMode={!!editId}
      />
    </div>
  );
}
