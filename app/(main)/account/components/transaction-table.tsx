"use client";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { format } from "date-fns";
import React, { useEffect, useMemo } from "react";
import { categoryColors } from "@/data/categories";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Clock,
  MoreHorizontal,
  RefreshCw,
  Search,
  Trash,
  X,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuSeparator,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import useFetch from "@/hooks/use-fetch";
import { bulkDeleteTransactions } from "@/actions/accounts";
import { toast } from "sonner";
import { BarLoader } from "react-spinners";
const ITEMS_PER_PAGE = 10;

const RECURRING_INTERVALS = {
  DAILY: "Daily",
  WEEKLY: "Weekly",
  MONTHLY: "Monthly",
  YEARLY: "Yearly",
};

interface Transaction {
  id: string;
  amount: number;
  date: any;
  description: string;
  category: string;
  type: "EXPENSE" | "INCOME";
  isRecurring?: boolean;
  recurringInterval?: keyof typeof RECURRING_INTERVALS;
  nextRecurringDate?: any;
}

interface TransactionTableProps {
  transactions: Transaction[];
}

const TransactionTable: React.FC<TransactionTableProps> = ({
  transactions,
}) => {
  const [currentPage, setCurrentPage] = React.useState(1);
  const router = useRouter();
  const [selectedIds, setSelectedIds] = React.useState<string[]>([]);
  const [sortConfig, setSortConfig] = React.useState<{
    field: string;
    direction: "asc" | "desc";
  }>({
    field: "date",
    direction: "desc",
  });
  const [searchTerm, setSearchTerm] = React.useState<string>("");
  const [typeFilter, setTypeFilter] = React.useState<
    "EXPENSE" | "INCOME" | undefined
  >(undefined);
  const [reccuringFilter, setRecurringFilter] = React.useState<
    "reccuring" | "non-reccuring" | undefined
  >(undefined);
  const {
    loading: deleteLoading,
    fn: deleteFn,
    data: deleted,
  } = useFetch(bulkDeleteTransactions);
  const filteredAndSortedTransactions = React.useMemo(() => {
    let result = [...transactions];
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      result = result.filter((transaction) =>
        transaction.description.toLowerCase().includes(searchLower)
      );
    }
    if (reccuringFilter) {
      result = result.filter((transaction) => {
        if (reccuringFilter === "reccuring") return transaction.isRecurring;
        return !transaction.isRecurring;
      });
    }
    if (typeFilter) {
      result = result.filter((transaction) => transaction.type === typeFilter);
    }
    result.sort((a, b) => {
      let comparison = 0;
      switch (sortConfig.field) {
        case "date":
          comparison = new Date(a.date).getTime() - new Date(b.date).getTime();
          break;
        case "category":
          comparison = a.category.localeCompare(b.category);
          break;
        case "amount":
          comparison = a.amount - b.amount;
          break;
        default:
          break;
      }
      return sortConfig.direction === "asc" ? comparison : -comparison;
    });
    return result;
  }, [transactions, searchTerm, typeFilter, reccuringFilter, sortConfig]);
  const totalPages = Math.ceil(
    filteredAndSortedTransactions.length / ITEMS_PER_PAGE
  );
  const paginatedTransactions = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredAndSortedTransactions.slice(
      startIndex,
      startIndex + ITEMS_PER_PAGE
    );
  }, [filteredAndSortedTransactions, currentPage]);
  const handleSort = (field: string) => {
    setSortConfig((current) =>
      current.field === field && current.direction === "asc"
        ? { field, direction: "desc" }
        : { field, direction: "asc" }
    );
  };
  const handleSelect = (id: string) => {
    setSelectedIds((current) =>
      current.includes(id)
        ? current.filter((currentId) => currentId !== id)
        : [...current, id]
    );
  };
  const handleSelectAll = () => {
    setSelectedIds((current) =>
      current.length === paginatedTransactions.length
        ? []
        : paginatedTransactions.map((t) => t.id)
    );
  };
  const handleBulkDelete = async () => {
    if (
      !window.confirm(
        `Are you sure you want to delete ${selectedIds.length} transactions?`
      )
    )
      return;

    try {
      const result = (await deleteFn(selectedIds)) as unknown as {
        error?: string;
      };
      if (result?.error) {
        toast.error(result.error);
      } else {
        setSelectedIds([]);
        router.refresh();
      }
    } catch (error) {
      toast.error("Failed to delete transactions");
      console.error("Delete error:", error);
    }
  };
  useEffect(() => {
    console.log("Transactions:", transactions);
  }, [transactions]);

  useEffect(() => {
    if (deleted && !deleteLoading) {
      setSelectedIds([]);
      toast.success("Transactions successfully deleted", { duration: 2000 });
      router.refresh();
    }
  }, [deleted, deleteLoading, router]);

  const handleClearFilters = () => {
    setSearchTerm("");
    setTypeFilter(undefined);
    setRecurringFilter(undefined);
    setSelectedIds([]);
  };
  interface HandlePageChangeFn {
    (newPage: number): void;
  }

  const handlePageChange: HandlePageChangeFn = (newPage) => {
    setCurrentPage(newPage);
    setSelectedIds([]); // Clear selections on page change
  };

  const handleSingleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this transaction?"))
      return;

    try {
      await deleteFn([id]);
      router.refresh();
    } catch (error) {
      toast.error("Failed to delete transaction");
    }
  };
  return (
    <div className="space-y-4">
      {deleteLoading && (
        <BarLoader className="mt-4" width={"100%"} color="#9333ea" />
      )}{" "}
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            className="pl-8"
            placeholder="Search Transactions..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          <Select
            value={typeFilter}
            onValueChange={(value) =>
              setTypeFilter(value as "EXPENSE" | "INCOME" | undefined)
            }
          >
            <SelectTrigger className="cursor-pointer">
              <SelectValue placeholder="All Types" />
            </SelectTrigger>
            <SelectContent className="cursor-pointer">
              <SelectItem value="INCOME" className="cursor-pointer">
                Income
              </SelectItem>
              <SelectItem value="EXPENSE" className="cursor-pointer">
                Expense
              </SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={reccuringFilter}
            onValueChange={(value) =>
              setRecurringFilter(
                value as "reccuring" | "non-reccuring" | undefined
              )
            }
          >
            <SelectTrigger className="w-[140px] cursor-pointer">
              <SelectValue placeholder="All Transactions" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="reccuring" className="cursor-pointer">
                Recurring Only
              </SelectItem>
              <SelectItem value="non-reccuring" className="cursor-pointer">
                Non-Recurring Only
              </SelectItem>
            </SelectContent>
          </Select>

          {selectedIds.length > 0 && (
            <div className="flex items-center gap-2">
              <Button
                variant="destructive"
                size={"sm"}
                onClick={handleBulkDelete}
                className="cursor-pointer"
              >
                <Trash className="h-4 w-4 mr-2" />
                Delete Selected ({selectedIds.length})
              </Button>
            </div>
          )}
          {(searchTerm || typeFilter || reccuringFilter) && (
            <Button
              variant="outline"
              size="icon"
              onClick={handleClearFilters}
              title="Clear Filters"
            >
              <X className="h-4 w-5" />
            </Button>
          )}
        </div>
      </div>
      {/* Transactions */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[50px]">
                <Checkbox
                  checked={
                    selectedIds.length === paginatedTransactions.length &&
                    paginatedTransactions.length > 0
                  }
                  onCheckedChange={handleSelectAll}
                  className="cursor-pointer"
                />
              </TableHead>
              <TableHead
                className="cursor-pointer"
                onClick={() => handleSort("date")}
              >
                <div className="flex items-center">
                  Date{""}
                  {sortConfig.field === "date" &&
                    (sortConfig.direction === "asc" ? (
                      <ChevronUp className=" ml-1 h-4 w-4" />
                    ) : (
                      <ChevronDown className="ml-1 h-4 w-4" />
                    ))}
                </div>
              </TableHead>
              <TableHead>Description</TableHead>
              <TableHead
                className="cursor-pointer"
                onClick={() => handleSort("category")}
              >
                <div className="flex items-center">
                  Category{""}
                  {sortConfig.field === "category" &&
                    (sortConfig.direction === "asc" ? (
                      <ChevronUp className=" ml-1 h-4 w-4" />
                    ) : (
                      <ChevronDown className="ml-1 h-4 w-4" />
                    ))}
                </div>
              </TableHead>
              <TableHead
                className="cursor-pointer"
                onClick={() => handleSort("amount")}
              >
                <div className="flex items-center justify-end">
                  Amount{""}
                  {sortConfig.field === "amount" &&
                    (sortConfig.direction === "asc" ? (
                      <ChevronUp className=" ml-1 h-4 w-4" />
                    ) : (
                      <ChevronDown className="ml-1 h-4 w-4" />
                    ))}
                </div>
              </TableHead>
              <TableHead>Recurring</TableHead>
              <TableHead className="w-[50px]" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedTransactions.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="text-center text-muted-foreground"
                >
                  No transactions found
                </TableCell>
              </TableRow>
            ) : (
              paginatedTransactions.map((transaction) => (
                <TableRow key={transaction.id}>
                  <TableCell>
                    <Checkbox
                      checked={selectedIds.includes(transaction.id)}
                      onCheckedChange={() => handleSelect(transaction.id)}
                    />
                  </TableCell>
                  <TableCell>
                    {format(new Date(transaction.date), "PP")}
                  </TableCell>
                  <TableCell>{transaction.description}</TableCell>
                  <TableCell className="capitalize">
                    <span
                      style={{
                        background: categoryColors[transaction.category],
                      }}
                      className="px-2 py-1 rounded text-white text-sm"
                    >
                      {transaction.category}
                    </span>
                  </TableCell>
                  <TableCell
                    className="text-right font-medium"
                    style={{
                      color: transaction.type === "EXPENSE" ? "red" : "green",
                    }}
                  >
                    {transaction.type === "EXPENSE" ? "-" : "+"}$
                    {transaction.amount.toFixed(2)}
                  </TableCell>
                  <TableCell>
                    {transaction.isRecurring ? (
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger>
                            <Badge
                              variant="outline"
                              className="gap-1 bg-purple-100 text-purple-700 hover:bg-purple-200"
                            >
                              <RefreshCw className="h-3 w-3" />
                              {transaction.recurringInterval
                                ? RECURRING_INTERVALS[
                                    transaction.recurringInterval
                                  ]
                                : "Recurring"}
                            </Badge>
                          </TooltipTrigger>
                          <TooltipContent>
                            <div>
                              <div>Next Date:</div>
                              <div>
                                {format(
                                  new Date(transaction.nextRecurringDate),
                                  "PP"
                                )}
                              </div>
                            </div>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    ) : (
                      <Badge variant="outline" className="gap-1">
                        <Clock className="h-3 w-3" />
                        One-time
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          className="h-8 w-8 p-0 cursor-pointer"
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-32">
                        <DropdownMenuItem
                          onClick={() =>
                            router.push(
                              `/transaction/create?edit=${transaction.id}`
                            )
                          }
                          className="cursor-pointer"
                        >
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="cursor-pointer"
                          variant="destructive"
                          onClick={() => handleSingleDelete(transaction.id)}
                        >
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm">
            Page {currentPage} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="icon"
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
};

export default TransactionTable;
