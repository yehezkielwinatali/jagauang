"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CalendarIcon, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { useRouter, useSearchParams } from "next/navigation";
import useFetch from "@/hooks/use-fetch";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import CreateAccountDrawer from "@/components/create-account-drawer";
import { cn } from "@/lib/utils";
import { createTransaction, updateTransaction } from "@/actions/transaction";
import { transactionSchema } from "@/app/lib/schema";
import { ReceiptScanner } from "./receipt-scanner";

type TransactionFormProps = {
  accounts: any;
  categories: Array<{ id: string; name: string; type: string }>;
  editMode?: boolean;
  initialData?: {
    type: string;
    amount: number;
    description: string;
    accountId: string;
    category: string;
    date: string | Date;
    isRecurring: boolean;
    recurringInterval?: string;
  } | null;
};

export function AddTransactionForm({
  accounts,
  categories,
  editMode = false,
  initialData = null,
}: TransactionFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get("edit");

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
    getValues,
    reset,
    trigger,
  } = useForm({
    resolver: zodResolver(transactionSchema),
    defaultValues:
      editMode && initialData
        ? {
            type: initialData.type as "EXPENSE" | "INCOME",
            amount: initialData.amount.toString(),
            description: initialData.description,
            accountId: initialData.accountId,
            category: initialData.category,
            date: new Date(initialData.date),
            isRecurring: initialData.isRecurring,
            ...(initialData.recurringInterval && {
              recurringInterval: initialData.recurringInterval as
                | "DAILY"
                | "WEEKLY"
                | "MONTHLY"
                | "YEARLY",
            }),
          }
        : {
            type: "EXPENSE" as "EXPENSE",
            amount: "",
            description: "",
            accountId: accounts.find((ac: any) => ac.isDefault)?.id,
            date: new Date(),
            isRecurring: false,
          },
  });

  const {
    loading: transactionLoading,
    fn: transactionFn,
    data: transactionResult,
  } = useFetch<any, any>(
    editMode
      ? (args) => updateTransaction(args.id, args.data)
      : createTransaction
  );

  interface TransactionFormData {
    type: "EXPENSE" | "INCOME";
    amount: string;
    description?: string;
    accountId: string;
    category: string;
    date: Date;
    isRecurring: boolean;
    recurringInterval?: "DAILY" | "WEEKLY" | "MONTHLY" | "YEARLY";
  }

  interface ScannedData {
    amount: number;
    date: string | Date;
    description?: string;
    category?: string;
  }

  const onSubmit = (data: TransactionFormData) => {
    const formData = {
      ...data,
      amount: parseFloat(data.amount),
    };

    if (editMode) {
      transactionFn({ id: editId, data: formData });
    } else {
      transactionFn(formData);
    }
  };

  const handleScanComplete = async (scannedData: any) => {
    if (scannedData) {
      setValue("amount", scannedData.amount.toString());
      setValue("date", new Date(scannedData.date));
      if (scannedData.description) {
        setValue("description", scannedData.description);
      }
      if (scannedData.category) {
        setValue("category", scannedData.category);
      }
      await trigger(); // re-validate all fields after setting values
      toast.success("Receipt scanned successfully");
    }
    console.log(scannedData);
  };

  useEffect(() => {
    if (transactionResult?.success && !transactionLoading) {
      toast.success(
        editMode
          ? "Transaction updated successfully"
          : "Transaction created successfully"
      );
      reset();
      router.push(`/account/${transactionResult.data.accountId}`);
    }
  }, [transactionResult, transactionLoading, editMode]);

  const type = watch("type");
  const isRecurring = watch("isRecurring");
  const date = watch("date");

  const filteredCategories = categories.filter(
    (category) => category.type === type
  );
  console.log("filteredCategories", filteredCategories);
  console.log("selected category id", watch("category"));
  useEffect(() => {
    if (filteredCategories.length > 0) {
      // Check if the current category is part of filteredCategories
      const currentCategory = getValues("category");
      const isValid = filteredCategories.some(
        (cat) => cat.id === currentCategory
      );

      if (!isValid) {
        // Set to first category in filtered list by default
        setValue("category", filteredCategories[0].id);
      }
    } else {
      // If no categories for this type, clear category field
      setValue("category", "");
    }
  }, [type, filteredCategories, setValue, getValues]);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {/* Receipt Scanner - Only show in create mode */}
      {!editMode && <ReceiptScanner onScanComplete={handleScanComplete} />}
      {/* Type */}
      <div className="space-y-3">
        <label className="text-sm font-medium text-gray-700">Type</label>
        <Select
          onValueChange={(value) =>
            setValue("type", value as "EXPENSE" | "INCOME")
          }
          defaultValue={type}
        >
          <SelectTrigger className="h-12 border-gray-300 rounded-lg w-full py-5">
            <SelectValue placeholder="Select type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="EXPENSE">Expense</SelectItem>
            <SelectItem value="INCOME">Income</SelectItem>
          </SelectContent>
        </Select>
        {errors.type && (
          <p className="text-sm text-red-500 mt-1">{errors.type.message}</p>
        )}
      </div>
      {/* Amount and Account */}
      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-3 w-full">
          <label className="text-sm font-medium text-gray-700">Amount</label>
          <Input
            type="number"
            step="0.01"
            placeholder="0.00"
            className="py-5 border-gray-300 rounded-lg"
            {...register("amount")}
          />
          {errors.amount && (
            <p className="text-sm text-red-500 mt-1">{errors.amount.message}</p>
          )}
        </div>

        <div className="space-y-3 w-full">
          <label className="text-sm font-medium text-gray-700">Account</label>
          <Select
            onValueChange={(value) => setValue("accountId", value)}
            defaultValue={getValues("accountId")}
          >
            <SelectTrigger className=" border-gray-300 rounded-lg w-full py-5">
              <SelectValue placeholder="Select account" />
            </SelectTrigger>
            <SelectContent>
              {accounts.map((account: any) => (
                <SelectItem key={account.id} value={account.id}>
                  {account.name} (${parseFloat(account.balance).toFixed(2)})
                </SelectItem>
              ))}
              <CreateAccountDrawer>
                <Button
                  variant="ghost"
                  className="relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none hover:bg-accent hover:text-accent-foreground"
                >
                  Create Account
                </Button>
              </CreateAccountDrawer>
            </SelectContent>
          </Select>
          {errors.accountId && (
            <p className="text-sm text-red-500 mt-1">
              {errors.accountId.message}
            </p>
          )}
        </div>
      </div>
      {/* Category */}
      <div>
        <label className="text-sm font-medium text-gray-700 mt-5">
          Category
        </label>
        <Select
          onValueChange={(value) => setValue("category", value)}
          value={watch("category")} // <-- controlled prop
        >
          <SelectTrigger className="border-gray-300 rounded-lg w-full py-5">
            <SelectValue placeholder="Select category" />
          </SelectTrigger>
          <SelectContent>
            {filteredCategories.map((category) => (
              <SelectItem key={category.id} value={category.id}>
                {category.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.category && (
          <p className="text-sm text-red-500 mt-1">{errors.category.message}</p>
        )}
      </div>
      {/* Date */}
      <div className="space-y-3">
        <label className="text-sm font-medium text-gray-700">Date</label>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "w-full h-12 pl-3 text-left font-normal border-gray-300 rounded-lg",
                !date && "text-muted-foreground"
              )}
            >
              {date ? format(date, "PPP") : <span>Pick a date</span>}
              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={date}
              onSelect={(date) => {
                if (date) setValue("date", date);
              }}
              disabled={(date) =>
                date > new Date() || date < new Date("1900-01-01")
              }
              initialFocus
            />
          </PopoverContent>
        </Popover>
        {errors.date && (
          <p className="text-sm text-red-500 mt-1">{errors.date.message}</p>
        )}
      </div>
      {/* Description */}
      <div className="space-y-3">
        <label className="text-sm font-medium text-gray-700">Description</label>
        <Input
          placeholder="Enter description"
          className="h-12 border-gray-300 rounded-lg"
          {...register("description")}
        />
        {errors.description && (
          <p className="text-sm text-red-500 mt-1">
            {errors.description.message}
          </p>
        )}
      </div>
      {/* Recurring Toggle */}
      <div className="flex flex-row items-center justify-between rounded-lg border border-gray-200 p-4 bg-gray-50">
        <div className="space-y-0.5">
          <label className="text-sm font-medium text-gray-700">
            Recurring Transaction
          </label>
          <div className="text-sm text-gray-500">
            Set up a recurring schedule for this transaction
          </div>
        </div>
        <Switch
          checked={isRecurring}
          onCheckedChange={(checked) => setValue("isRecurring", checked)}
        />
      </div>
      {/* Recurring Interval */}
      {isRecurring && (
        <div className="space-y-3">
          <label className="text-sm font-medium text-gray-700">
            Recurring Interval
          </label>
          <Select
            onValueChange={(value) =>
              setValue(
                "recurringInterval",
                value as "DAILY" | "WEEKLY" | "MONTHLY" | "YEARLY"
              )
            }
            defaultValue={getValues("recurringInterval")}
          >
            <SelectTrigger className="h-12 border-gray-300 rounded-lg">
              <SelectValue placeholder="Select interval" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="DAILY">Daily</SelectItem>
              <SelectItem value="WEEKLY">Weekly</SelectItem>
              <SelectItem value="MONTHLY">Monthly</SelectItem>
              <SelectItem value="YEARLY">Yearly</SelectItem>
            </SelectContent>
          </Select>
          {errors.recurringInterval && (
            <p className="text-sm text-red-500 mt-1">
              {errors.recurringInterval.message}
            </p>
          )}
        </div>
      )}
      {/* Actions */}
      <div className="flex gap-4 pt-4">
        <Button
          type="button"
          variant="outline"
          className="w-[48%] h-12 border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 cursor-pointer"
          onClick={() => router.back()}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          className="w-[50%] h-12 bg-blue-600 hover:bg-blue-700 rounded-lg cursor-pointer"
          disabled={!!transactionLoading}
        >
          {transactionLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {editMode ? "Updating..." : "Creating..."}
            </>
          ) : editMode ? (
            "Update Transaction"
          ) : (
            "Create Transaction"
          )}
        </Button>
      </div>
    </form>
  );
}
