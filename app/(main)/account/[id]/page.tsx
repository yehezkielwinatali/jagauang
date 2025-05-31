import { getAccountWithTransactions } from "@/actions/accounts";
import { notFound } from "next/navigation";
import React, { Suspense } from "react";
import TransactionTable from "../components/transaction-table";
import { BarLoader } from "react-spinners";
import AccountChart from "../components/account-chart";

const AccountsPage = async ({
  params,
}: {
  params: Promise<{ id: string }>;
}) => {
  const { id } = await params;
  const accountData = await getAccountWithTransactions(id);
  if (!accountData) {
    notFound();
  }
  const { transactions, ...account } = accountData;
  return (
    <div className="space-y-8 px-5">
      <div className="flex gap-4 items-end justify-between">
        <div>
          <h1 className="text-5xl sm:text-6xl font-bold gradient-title capitalize">
            {account.name}
          </h1>
          <p className="text-muted-foreground ml-1">
            {account.type.charAt(0) + account.type.slice(1).toLowerCase()}{" "}
            Account
          </p>
        </div>
        <div className="text-right pb-2">
          <div className="text-xl sm:text-2xl font-bold">
            ${parseFloat(accountData.balance.toString()).toFixed(2)}
          </div>
          <p className="text-muted-foreground">
            {accountData._count.transactions} Transaction
          </p>
        </div>
      </div>
      {/* Chart Section */}
      <Suspense
        fallback={<BarLoader className="mt-4" width={"100%"} color="#9333ea" />}
      >
        <AccountChart
          transactions={transactions.map((t: any) => ({
            ...t,
            date: typeof t.date === "string" ? t.date : t.date.toISOString(),
          }))}
        />
      </Suspense>
      {/* Transaction Table */}
      <Suspense
        fallback={<BarLoader className="mt-4" width={"100%"} color="#9333ea" />}
      >
        <TransactionTable
          transactions={transactions.map((t: any) => ({
            ...t,
            description: t.description ?? "",
          }))}
        />
      </Suspense>
    </div>
  );
};

export default AccountsPage;
