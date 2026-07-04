"use client";

import { useState, useEffect } from "react";
import {
  Receipt,
  Plus,
  Search,
  Filter,
  TrendingDown,
  Calendar,
  Tag,
  Download,
  Trash2,
  Edit2,
  PieChart as PieChartIcon
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { format } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "react-hot-toast";
import { vendorService } from "@/services/vendor.service";

// Categories for expenses
const CATEGORIES = [
  "Equipment",
  "Travel",
  "Marketing",
  "Software",
  "Subcontractor",
  "Insurance",
  "Office",
  "Other"
];

interface Expense {
  id: string;
  title: string;
  amount: number;
  category: string;
  date: Date;
  status: "PENDING" | "PAID";
  reference?: string;
}

export default function ExpenseTrackerPage() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [currentExpenseId, setCurrentExpenseId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");

  // New/Edit expense form state
  const [formData, setFormData] = useState({
    title: "",
    amount: "",
    category: "",
    date: new Date().toISOString().split('T')[0],
  });

  const fetchExpenses = async () => {
    try {
      const data = await vendorService.getExpenses();
      setExpenses(data);
    } catch {
      toast.error("Failed to fetch expenses");
    }
  };

  useEffect(() => {
    fetchExpenses();
  }, []);

  const handleAddExpense = async () => {
    if (!formData.title || !formData.amount || !formData.category) {
      toast.error("Please fill in all fields");
      return;
    }

    try {
      await vendorService.addExpense({
        title: formData.title,
        amount: parseFloat(formData.amount),
        category: formData.category,
        date: new Date(formData.date),
      });

      toast.success("Expense added successfully!");
      setIsAddDialogOpen(false);
      resetForm();
      fetchExpenses();
    } catch {
      toast.error("Failed to add expense");
    }
  };

  const handleEditExpense = async () => {
    if (!currentExpenseId || !formData.title || !formData.amount || !formData.category) {
        toast.error("Please fill in all fields");
        return;
    }

    try {
      await vendorService.updateExpense(currentExpenseId, {
        title: formData.title,
        amount: parseFloat(formData.amount),
        category: formData.category,
        date: new Date(formData.date),
      });

      toast.success("Expense updated successfully!");
      setIsEditDialogOpen(false);
      resetForm();
      fetchExpenses();
    } catch {
      toast.error("Failed to update expense");
    }
  };

  const handleDeleteExpense = async (id: string) => {
    if (!confirm("Are you sure you want to delete this expense?")) return;
    try {
      await vendorService.deleteExpense(id);
      toast.success("Expense deleted");
      fetchExpenses();
    } catch {
      toast.error("Failed to delete expense");
    }
  };

  const resetForm = () => {
    setFormData({
      title: "",
      amount: "",
      category: "",
      date: new Date().toISOString().split('T')[0],
    });
    setCurrentExpenseId(null);
  };

  const openEditDialog = (expense: Expense) => {
    setFormData({
      title: expense.title,
      amount: expense.amount.toString(),
      category: expense.category,
      date: new Date(expense.date).toISOString().split('T')[0],
    });
    setCurrentExpenseId(expense.id);
    setIsEditDialogOpen(true);
  };

  const totalExpenses = Array.isArray(expenses) ? expenses.reduce((acc, curr) => acc + Number(curr.amount), 0) : 0;

  const filteredExpenses = Array.isArray(expenses) ? expenses.filter(e => {
    const matchesSearch = e.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = filterCategory === "all" || e.category === filterCategory;
    return matchesSearch && matchesCategory;
  }) : [];

  return (
    <div className="space-y-8 pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight uppercase">Expense Tracker</h1>
          <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px] mt-1">Manage your business expenditures</p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-primary hover:bg-blue-700 text-white rounded-xl font-black h-12 px-6 shadow-xl shadow-primary/20 transition-all hover:-translate-y-0.5 gap-2">
              <Plus className="h-5 w-5" /> Add Expense
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px] rounded-[2rem] border-none shadow-2xl">
            <DialogHeader>
              <DialogTitle className="text-2xl font-black">Add New Expense</DialogTitle>
              <DialogDescription className="font-medium">
                Log a business expenditure for your records.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-6 py-4">
              <div className="space-y-2">
                <Label htmlFor="title" className="font-bold">Expense Title</Label>
                <Input
                  id="title"
                  placeholder="e.g. Camera Gear"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="rounded-xl border-slate-200 h-12 font-bold"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="amount" className="font-bold">Amount (₹)</Label>
                  <Input
                    id="amount"
                    type="number"
                    placeholder="0.00"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    className="rounded-xl border-slate-200 h-12 font-bold"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="category" className="font-bold">Category</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(val) => setFormData({ ...formData, category: val })}
                  >
                    <SelectTrigger className="rounded-xl border-slate-200 h-12 font-bold">
                      <SelectValue placeholder="Category" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-slate-200">
                      {CATEGORIES.map(cat => (
                        <SelectItem key={cat} value={cat} className="font-bold">{cat}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="date" className="font-bold">Date</Label>
                <Input
                  id="date"
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className="rounded-xl border-slate-200 h-12 font-bold"
                />
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleAddExpense} className="w-full rounded-2xl h-12 font-black text-lg shadow-xl shadow-primary/20">
                Save Expense
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit Expense Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="sm:max-w-[425px] rounded-[2rem] border-none shadow-2xl">
            <DialogHeader>
              <DialogTitle className="text-2xl font-black">Edit Expense</DialogTitle>
              <DialogDescription className="font-medium">
                Update details for this expenditure.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-6 py-4">
              <div className="space-y-2">
                <Label htmlFor="edit-title" className="font-bold">Expense Title</Label>
                <Input
                  id="edit-title"
                  placeholder="e.g. Camera Gear"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="rounded-xl border-slate-200 h-12 font-bold"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-amount" className="font-bold">Amount (₹)</Label>
                  <Input
                    id="edit-amount"
                    type="number"
                    placeholder="0.00"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    className="rounded-xl border-slate-200 h-12 font-bold"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-category" className="font-bold">Category</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(val) => setFormData({ ...formData, category: val })}
                  >
                    <SelectTrigger className="rounded-xl border-slate-200 h-12 font-bold">
                      <SelectValue placeholder="Category" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-slate-200">
                      {CATEGORIES.map(cat => (
                        <SelectItem key={cat} value={cat} className="font-bold">{cat}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-date" className="font-bold">Date</Label>
                <Input
                  id="edit-date"
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className="rounded-xl border-slate-200 h-12 font-bold"
                />
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleEditExpense} className="w-full rounded-2xl h-12 font-black text-lg shadow-xl shadow-primary/20">
                Update Expense
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-none shadow-2xl shadow-slate-200/50 rounded-[2rem] overflow-hidden bg-white group">
          <CardHeader className="pb-2">
            <CardTitle className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center justify-between">
              Total Expenses
              <TrendingDown className="h-4 w-4 text-rose-500" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-black text-slate-900 tracking-tight">₹{totalExpenses.toLocaleString()}</div>
            <p className="text-[11px] font-bold text-slate-400 mt-2">Current billing cycle</p>
          </CardContent>
        </Card>

        <Card className="border-none shadow-2xl shadow-slate-200/50 rounded-[2rem] overflow-hidden bg-slate-900 text-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center justify-between">
              Top Category
              <PieChartIcon className="h-4 w-4 text-primary" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-black text-white tracking-tight">Equipment</div>
            <p className="text-[11px] font-bold text-slate-400 mt-2">65% of total spend</p>
          </CardContent>
        </Card>

        <Card className="border-none shadow-2xl shadow-slate-200/50 rounded-[2rem] overflow-hidden bg-white border border-slate-100">
          <CardHeader className="pb-2">
            <CardTitle className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center justify-between">
              Monthly Average
              <Calendar className="h-4 w-4 text-primary" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-black text-slate-900 tracking-tight">₹{(totalExpenses / 6).toFixed(0).toLocaleString()}</div>
            <p className="text-[11px] font-bold text-slate-400 mt-2">Based on last 6 months</p>
          </CardContent>
        </Card>
      </div>

      {/* List Section */}
      <div className="bg-white border border-slate-200 rounded-[2.5rem] overflow-hidden shadow-2xl shadow-slate-200/50">
        <div className="p-8 border-b border-slate-100 flex flex-col md:flex-row gap-4 items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-4 w-full md:w-auto">
            <div className="relative flex-1 md:w-80">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search expenses..."
                className="pl-10 rounded-xl border-slate-200 bg-white h-11 font-bold text-sm"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Select value={filterCategory} onValueChange={setFilterCategory}>
              <SelectTrigger className="w-[160px] rounded-xl border-slate-200 bg-white h-11 font-bold">
                <Filter className="h-4 w-4 mr-2 text-slate-400" />
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent className="rounded-xl border-slate-200">
                <SelectItem value="all" className="font-bold">All Categories</SelectItem>
                {CATEGORIES.map(cat => (
                  <SelectItem key={cat} value={cat} className="font-bold">{cat}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button variant="outline" className="rounded-xl border-slate-200 font-black h-11 px-6 gap-2 hover:bg-white transition-all shadow-sm">
            <Download className="h-4 w-4" /> Export CSV
          </Button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Expense & Date</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Category</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Amount</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              <AnimatePresence>
                {filteredExpenses.map((expense) => (
                  <motion.tr
                    key={expense.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="group hover:bg-slate-50/50 transition-colors"
                  >
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-2xl bg-rose-50 flex items-center justify-center text-rose-500 shrink-0 border border-rose-100">
                          <Receipt className="h-6 w-6" />
                        </div>
                        <div>
                          <p className="font-black text-slate-900 text-lg tracking-tight group-hover:text-primary transition-colors">{expense.title}</p>
                          <p className="text-xs font-bold text-slate-400 mt-0.5">{format(expense.date, 'MMMM dd, yyyy')}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <Badge className="bg-slate-100 text-slate-600 hover:bg-slate-100 border-none rounded-lg font-black text-[10px] uppercase tracking-widest px-3 py-1.5 shadow-sm">
                        <Tag className="h-3 w-3 mr-1.5 opacity-50" /> {expense.category}
                      </Badge>
                    </td>
                    <td className="px-8 py-6 text-right">
                      <span className="font-black text-xl text-slate-900">₹{expense.amount.toLocaleString()}</span>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-2 rounded-full bg-emerald-500" />
                        <span className="text-[10px] font-black text-slate-900 uppercase tracking-widest">{expense.status}</span>
                      </div>
                    </td>
                    <td className="px-8 py-6 text-right">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-10 w-10 rounded-xl hover:bg-white hover:shadow-sm"
                            onClick={() => openEditDialog(expense)}
                        >
                          <Edit2 className="h-4 w-4 text-slate-400" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-10 w-10 rounded-xl hover:bg-rose-50 group/del"
                          onClick={() => handleDeleteExpense(expense.id)}
                        >
                          <Trash2 className="h-4 w-4 text-slate-400 group-hover/del:text-rose-500" />
                        </Button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </AnimatePresence>
            </tbody>
          </table>
        </div>

        {filteredExpenses.length === 0 && (
          <div className="p-20 text-center">
            <div className="h-20 w-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <Search className="h-10 w-10 text-slate-300" />
            </div>
            <h3 className="text-xl font-black text-slate-900">No expenses found</h3>
            <p className="text-sm font-bold text-slate-500 mt-2">Try adjusting your filters or search query.</p>
          </div>
        )}
      </div>
    </div>
  );
}
