'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import {
  Plus,
  Upload,
  RefreshCw,
  LogOut,
  Info,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Calendar,
  User,
  DollarSign,
  Users,
  ChevronRight,
  FileText,
  Sun,
  Moon,
  Trash2,
} from 'lucide-react';
import { toast } from 'react-toastify';

export default function DashboardPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [groups, setGroups] = useState<any[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<any>(null);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    const saved = localStorage.getItem('theme') as 'light' | 'dark' | null;
    const active = saved || 'light';
    setTheme(active);
    document.documentElement.classList.remove('dark', 'light');
    document.documentElement.classList.add(active === 'dark' ? 'dark' : 'light');
    document.body.className = active === 'dark' ? 'dark-theme' : 'light-theme';
  }, []);

  const toggleTheme = () => {
    const next = theme === 'light' ? 'dark' : 'light';
    setTheme(next);
    localStorage.setItem('theme', next);
    document.documentElement.classList.remove('dark', 'light');
    document.documentElement.classList.add(next === 'dark' ? 'dark' : 'light');
    document.body.className = next === 'dark' ? 'dark-theme' : 'light-theme';
  };

  // Dashboard tab states: 'balances' | 'expenses' | 'settlements' | 'anomalies' | 'members'
  const [activeTab, setActiveTab] = useState('balances');

  // Date filter states (Sam's Ask)
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Data states
  const [balancesData, setBalancesData] = useState<any>(null);
  const [expenses, setExpenses] = useState<any[]>([]);
  const [settlements, setSettlements] = useState<any[]>([]);
  const [anomalies, setAnomalies] = useState<any[]>([]);

  // Modals & form states
  const [isCreateGroupOpen, setIsCreateGroupOpen] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [isAddExpenseOpen, setIsAddExpenseOpen] = useState(false);
  const [isAddMemberOpen, setIsAddMemberOpen] = useState(false);
  const [isRecordSettlementOpen, setIsRecordSettlementOpen] = useState(false);
  const [confirmDeleteGroupId, setConfirmDeleteGroupId] = useState<string | null>(null);

  // Manual Expense form states
  const [expenseDesc, setExpenseDesc] = useState('');
  const [expenseAmount, setExpenseAmount] = useState('');
  const [expenseCurrency, setExpenseCurrency] = useState('INR');
  const [expenseRate, setExpenseRate] = useState('1.0');
  const [expenseDate, setExpenseDate] = useState('');
  const [expensePayer, setExpensePayer] = useState('');
  const [expenseSplitType, setExpenseSplitType] = useState('EQUAL');
  const [expenseSplitDetails, setExpenseSplitDetails] = useState<{ [userId: string]: string }>({});

  // Manual Member form states
  const [newMemberName, setNewMemberName] = useState('');
  const [newMemberJoinDate, setNewMemberJoinDate] = useState('');

  // Manual Settlement form states
  const [settlePayer, setSettlePayer] = useState('');
  const [settleReceiver, setSettleReceiver] = useState('');
  const [settleAmount, setSettleAmount] = useState('');
  const [settleDate, setSettleDate] = useState('');

  // Drilldown Modal state (Rohan's Ask)
  const [drilldownUser, setDrilldownUser] = useState<any>(null);
  const [drilldownData, setDrilldownData] = useState<any>(null);

  // CSV Import states (Trap 4)
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [importReport, setImportReport] = useState<any[] | null>(null);
  const [importLoading, setImportLoading] = useState(false);

  // Anomaly override form (Trap 3)
  const [editingAnomaly, setEditingAnomaly] = useState<any>(null);
  const [overrideForm, setOverrideForm] = useState<any>({});

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchUserAndGroups = async () => {
    try {
      setLoading(true);
      const userRes = await fetch('/api/auth/me');
      if (!userRes.ok) {
        router.push('/login');
        return;
      }
      const user = await userRes.json();
      setCurrentUser(user);

      const groupsRes = await fetch('/api/groups');
      const groups = await groupsRes.json();
      setGroups(groups);
      if (groups.length > 0) {
        setSelectedGroup(groups[0]);
      }
    } catch (err) {
      setError('Failed to fetch initial session details');
    } finally {
      setLoading(false);
    }
  };

  const fetchGroupDetailsAndData = async () => {
    if (!selectedGroup) return;
    try {
      setError('');
      // Build date filter query params
      let query = '';
      const params: string[] = [];
      if (startDate) params.push(`startDate=${startDate}`);
      if (endDate) params.push(`endDate=${endDate}`);
      if (params.length > 0) query = `?${params.join('&')}`;

      // 1. Fetch Balances
      const balRes = await fetch(`/api/groups/${selectedGroup.id}/balances${query}`);
      const balData = await balRes.json();
      setBalancesData(balRes.ok ? balData : null);

      // 2. Fetch Expenses
      const expRes = await fetch(`/api/groups/${selectedGroup.id}/expenses`);
      const expData = await expRes.json();
      setExpenses(expRes.ok ? expData : []);

      // 3. Fetch Settlements
      const setRes = await fetch(`/api/groups/${selectedGroup.id}/settle`);
      const setData = await setRes.json();
      setSettlements(setRes.ok ? setData : []);

      // 4. Fetch Anomalies
      const anomRes = await fetch(`/api/groups/${selectedGroup.id}/anomalies`);
      const anomData = await anomRes.json();
      setAnomalies(anomRes.ok ? anomData : []);
    } catch (err) {
      setError('Failed to fetch group data');
    }
  };

  // Initial user check and groups fetch
  useEffect(() => {
    fetchUserAndGroups();
  }, []);

  // Fetch group data on group selection or date filter change
  useEffect(() => {
    if (selectedGroup) {
      fetchGroupDetailsAndData();
    }
  }, [selectedGroup, startDate, endDate]);

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
  };

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGroupName.trim()) return;
    try {
      const res = await fetch('/api/groups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newGroupName }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      toast.success('Group created successfully!');
      // Refresh list
      const groupsRes = await fetch('/api/groups');
      const groupsData = await groupsRes.json();
      setGroups(groupsData);
      const created = groupsData.find((g: any) => g.id === data.id);
      setSelectedGroup(created || { ...data, members: [] });
      setIsCreateGroupOpen(false);
      setNewGroupName('');
    } catch (err: any) {
      toast.error(err.message || 'Failed to create group');
    }
  };

  const performDeleteGroup = async (groupId: string) => {
    setConfirmDeleteGroupId(null);
    try {
      const res = await fetch(`/api/groups/${groupId}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to delete group');
      }

      toast.success('Group deleted successfully!');
      // Refresh list
      const groupsRes = await fetch('/api/groups');
      const groupsData = await groupsRes.json();
      setGroups(groupsData);
      if (groupsData.length > 0) {
        setSelectedGroup(groupsData[0]);
      } else {
        setSelectedGroup(null);
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete group');
    }
  };

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMemberName.trim() || !newMemberJoinDate) return;
    try {
      const res = await fetch(`/api/groups/${selectedGroup.id}/members`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: newMemberName, joinedAt: newMemberJoinDate }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      toast.success(`Member "${newMemberName}" added successfully!`);
      // Refresh Group selection detail to include new member list
      const groupRes = await fetch(`/api/groups/${selectedGroup.id}`);
      const groupData = await groupRes.json();
      setSelectedGroup(groupData);

      setIsAddMemberOpen(false);
      setNewMemberName('');
      setNewMemberJoinDate('');
      fetchGroupDetailsAndData();
    } catch (err: any) {
      toast.error(err.message || 'Failed to add member');
    }
  };

  const handleRecordDeparture = async (userId: string, leftAtDate: string) => {
    if (!leftAtDate) return;
    try {
      const res = await fetch(`/api/groups/${selectedGroup.id}/members`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, leftAt: leftAtDate }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      toast.success('Departure date recorded successfully!');
      const groupRes = await fetch(`/api/groups/${selectedGroup.id}`);
      const groupData = await groupRes.json();
      setSelectedGroup(groupData);
      fetchGroupDetailsAndData();
    } catch (err: any) {
      toast.error(err.message || 'Failed to record departure');
    }
  };

  const handleCsvImport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!csvFile || !selectedGroup) return;

    setImportLoading(true);
    setImportReport(null);
    const formData = new FormData();
    formData.append('file', csvFile);

    try {
      const res = await fetch(`/api/groups/${selectedGroup.id}/import`, {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to parse file');

      toast.success('Spreadsheet import completed! Check details in the report below.');
      setImportReport(data.report);
      fetchGroupDetailsAndData();
    } catch (err: any) {
      toast.error(err.message || 'Failed to import CSV');
    } finally {
      setImportLoading(false);
    }
  };

  const handleExportReportCsv = () => {
    if (!importReport) return;
    const headers = ['Row Number', 'Expense/Settlement Description', 'Status', 'Anomalies Detected', 'Action Taken / Details'];
    const csvRows = [
      headers.join(','),
      ...importReport.map(rep => {
        const rowNum = rep.rowNumber;
        const desc = `"${rep.description.replace(/"/g, '""')}"`;
        const status = rep.status;
        const anomalies = `"${rep.anomalies.map((a: any) => a.description).join(' | ').replace(/"/g, '""')}"`;
        const details = `"${rep.details.replace(/"/g, '""')}"`;
        return [rowNum, desc, status, anomalies, details].join(',');
      })
    ];
    const csvContent = csvRows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Import_Report_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleManualExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedGroup) return;

    const formattedSplits: any[] = [];
    const members = selectedGroup.members || [];
    members.forEach((m: any) => {
      const val = expenseSplitDetails[m.id];
      if (val) {
        formattedSplits.push({ userId: m.id, amount: parseFloat(val) });
      }
    });

    try {
      const res = await fetch(`/api/groups/${selectedGroup.id}/expenses`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          description: expenseDesc,
          amount: parseFloat(expenseAmount),
          currency: expenseCurrency,
          exchangeRate: parseFloat(expenseRate),
          date: expenseDate,
          splitType: expenseSplitType,
          payerId: expensePayer,
          splits: formattedSplits,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      toast.success('Expense recorded successfully!');
      setIsAddExpenseOpen(false);
      setExpenseDesc('');
      setExpenseAmount('');
      setExpenseCurrency('INR');
      setExpenseRate('1.0');
      setExpenseDate('');
      setExpensePayer('');
      setExpenseSplitType('EQUAL');
      setExpenseSplitDetails({});
      fetchGroupDetailsAndData();
    } catch (err: any) {
      toast.error(err.message || 'Failed to record expense');
    }
  };

  const handleManualSettlement = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(`/api/groups/${selectedGroup.id}/settle`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          payerId: settlePayer,
          receiverId: settleReceiver,
          amount: parseFloat(settleAmount),
          date: settleDate,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      toast.success('Settlement recorded successfully!');
      setIsRecordSettlementOpen(false);
      setSettlePayer('');
      setSettleReceiver('');
      setSettleAmount('');
      setSettleDate('');
      fetchGroupDetailsAndData();
    } catch (err: any) {
      toast.error(err.message || 'Failed to record settlement');
    }
  };

  const fetchDrilldown = async (userId: string, name: string) => {
    try {
      let query = `?userId=${userId}`;
      if (startDate) query += `&startDate=${startDate}`;
      if (endDate) query += `&endDate=${endDate}`;

      const res = await fetch(`/api/groups/${selectedGroup.id}/balances/drilldown${query}`);
      const data = await res.json();
      if (res.ok) {
        setDrilldownUser({ id: userId, name });
        setDrilldownData(data);
      }
    } catch (err) {}
  };

  const handleResolveAnomaly = async (anomalyId: string, action: 'APPROVE' | 'REJECT') => {
    try {
      const body: any = { action };
      if (action === 'APPROVE' && editingAnomaly?.id === anomalyId) {
        body.resolvedRowData = overrideForm;
      }

      const res = await fetch(`/api/groups/${selectedGroup.id}/anomalies/${anomalyId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      toast.success(
        action === 'APPROVE'
          ? 'Anomaly resolved and transaction saved!'
          : 'Anomaly row rejected and discarded.',
      );
      setEditingAnomaly(null);
      fetchGroupDetailsAndData();
    } catch (err: any) {
      toast.error(err.message || 'Failed to resolve anomaly');
    }
  };

  const openOverrideForm = (anomaly: any) => {
    const raw = JSON.parse(anomaly.rawRowData);
    setEditingAnomaly(anomaly);
    setOverrideForm(raw);
  };

  // Generate running balance chart data from chronological expenses and settlements
  const generateChartData = () => {
    if (!selectedGroup || (!expenses.length && !settlements.length)) return [];

    const members = selectedGroup.members || [];
    if (members.length === 0) return [];

    // Date filters check
    const startLimit = startDate ? new Date(startDate).getTime() : 0;
    const endLimit = endDate ? new Date(endDate).getTime() : Infinity;

    // Combine transactions chronologically
    const events: any[] = [];
    expenses.forEach((e) => {
      const t = new Date(e.date).getTime();
      if (t >= startLimit && t <= endLimit) {
        events.push({
          type: 'EXPENSE',
          date: new Date(e.date),
          payerId: e.payerId,
          amount: e.convertedAmount,
          splits: e.splits,
        });
      }
    });

    settlements.forEach((s) => {
      const t = new Date(s.date).getTime();
      if (t >= startLimit && t <= endLimit) {
        events.push({
          type: 'SETTLEMENT',
          date: new Date(s.date),
          payerId: s.payerId,
          receiverId: s.receiverId,
          amount: s.amount,
        });
      }
    });

    events.sort((a, b) => a.date.getTime() - b.date.getTime());

    // Initialize running balances
    const runningBalances: { [name: string]: number } = {};
    members.forEach((m: any) => {
      runningBalances[m.name] = 0;
    });

    const chartPoints: any[] = [];

    // Add starting point
    if (events.length > 0) {
      const firstDate = new Date(events[0].date);
      firstDate.setDate(firstDate.getDate() - 1);
      const point: any = {
        dateStr: firstDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
      };
      members.forEach((m: any) => {
        point[m.name] = 0;
      });
      chartPoints.push(point);
    }

    events.forEach((ev) => {
      if (ev.type === 'EXPENSE') {
        const payerName = members.find((m: any) => m.id === ev.payerId)?.name;
        if (payerName) {
          runningBalances[payerName] += ev.amount;
        }
        ev.splits.forEach((sp: any) => {
          if (runningBalances[sp.name] !== undefined) {
            runningBalances[sp.name] -= sp.amount;
          }
        });
      } else {
        const payerName = members.find((m: any) => m.id === ev.payerId)?.name;
        const receiverName = members.find((m: any) => m.id === ev.receiverId)?.name;
        if (payerName) {
          runningBalances[payerName] += ev.amount; // payer paid money out, balances positive
        }
        if (receiverName) {
          runningBalances[receiverName] -= ev.amount; // receiver got money, balances decreases
        }
      }

      const point: any = {
        dateStr: ev.date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
      };
      members.forEach((m: any) => {
        point[m.name] = Math.round(runningBalances[m.name] * 100) / 100;
      });
      chartPoints.push(point);
    });

    return chartPoints;
  };

  const chartData = generateChartData();

  const groupMembers = selectedGroup?.members || [];

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#1b1b1b] text-white">
        <div className="flex flex-col items-center gap-4">
          <RefreshCw className="h-10 w-10 animate-spin text-brand-yellow" />
          <p className="text-xs font-black tracking-widest text-brand-yellow uppercase">
            LOADING THE SYSTEM...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen bg-dots-grid font-sans has-bottom-nav"
      style={{ color: 'var(--text-color)' }}
    >
      <header className="sticky top-0 z-40 bg-[#1b1b1b] border-b border-[rgba(255,255,255,0.08)] px-4 sm:px-6 py-3 flex items-center justify-between shadow-none safe-top">
        <div className="flex items-center gap-2">
          <h1 className="text-sm font-black text-white tracking-widest uppercase">
            EXPENSE{' '}
            <span className="text-[#111111] bg-[#f5bb1b] border-2 border-black px-2 py-0.5 rounded shadow-[2px_2px_0px_#000]">
              TRACKER
            </span>
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={toggleTheme}
            className="p-2.5 rounded-xl bg-neutral-900 border-2 border-neutral-700 text-[#f5bb1b] hover:text-white transition cursor-pointer touch-target"
            title="Toggle Theme"
          >
            {theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
          </button>

          <div className="hidden sm:flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-[#f5bb1b] border border-black animate-pulse"></span>
            <span className="text-xs font-bold text-white uppercase tracking-widest">
              {currentUser?.name}
            </span>
          </div>

          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 text-slate-400 hover:text-[#f5bb1b] text-xs font-black uppercase tracking-wider transition cursor-pointer touch-target"
          >
            <LogOut className="h-4 w-4" />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 grid grid-cols-1 lg:grid-cols-4 gap-6">
        <section className="lg:col-span-1 space-y-6">
          <div className="neobrutal-card-dark p-6 space-y-4">
            <div className="flex items-center justify-between border-b-2 border-neutral-800 pb-3">
              <h2 className="text-[10px] font-black tracking-widest text-slate-300 uppercase">
                My Groups
              </h2>
              <button
                onClick={() => setIsCreateGroupOpen(true)}
                className="rounded-xl bg-[#f5bb1b] text-black hover:bg-[#f6c333] p-2 border-2 border-black transition cursor-pointer shadow-[2px_2px_0px_#000]"
                title="Create Group"
              >
                <Plus className="h-3.5 w-3.5" />
              </button>
            </div>

            <div className="space-y-3">
              {groups.map((g) => (
                <div key={g.id} className="relative flex items-center gap-2 w-full">
                  <button
                    onClick={() => setSelectedGroup(g)}
                    className={`flex-1 text-left px-4 py-3 pr-12 rounded-2xl border-2 text-xs font-extrabold flex items-center justify-between transition cursor-pointer ${
                      selectedGroup?.id === g.id
                        ? 'bg-[#f5bb1b] border-black text-[#111111] shadow-[3px_3px_0px_#000]'
                        : 'bg-white border-black text-[#111111] shadow-[3px_3px_0px_#000] hover:bg-slate-50'
                    }`}
                  >
                    <span className="truncate">{g.name}</span>
                    <ChevronRight
                      className={`h-3.5 w-3.5 transition ${selectedGroup?.id === g.id ? 'translate-x-1 text-[#111111]' : 'text-slate-600'}`}
                    />
                  </button>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setConfirmDeleteGroupId(g.id);
                    }}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1.5 rounded-lg bg-red-50 hover:bg-red-100 border-2 border-black text-red-600 transition cursor-pointer shadow-[1.5px_1.5px_0px_#000] hover:scale-105"
                    title="Delete Group"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}

              {groups.length === 0 && (
                <p className="text-[10px] text-slate-550 text-center py-4 uppercase font-bold tracking-wider">
                  No groups found
                </p>
              )}
            </div>
          </div>

          {selectedGroup && (
            <div className="neobrutal-card-dark p-6 space-y-4 text-white">
              <h3 className="text-[10px] font-black tracking-widest text-brand-yellow uppercase">
                Active Date Filters
              </h3>
              <p className="text-[10.5px] text-slate-300 font-medium leading-relaxed">
                Specify a date range (e.g. Sam's arrival date to exclude March bills).
              </p>

              <div className="space-y-4">
                <div>
                  <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full neobrutal-input text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                    End Date
                  </label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full neobrutal-input text-xs"
                  />
                </div>
                {(startDate || endDate) && (
                  <button
                    onClick={() => {
                      setStartDate('');
                      setEndDate('');
                    }}
                    className="w-full neobrutal-btn-yellow py-2 text-[10px]"
                  >
                    Clear Filter
                  </button>
                )}
              </div>
            </div>
          )}
        </section>

        <section className="lg:col-span-3 space-y-6">
          {selectedGroup ? (
            <>
              <div className="tab-scroll flex gap-2 pb-1 text-[10px] font-black uppercase tracking-widest mb-4">
                {[
                  { id: 'balances', label: 'Balances Summary', icon: Users },
                  { id: 'expenses', label: 'Expenses List', icon: DollarSign },
                  { id: 'settlements', label: 'Settlements History', icon: Calendar },
                  {
                    id: 'anomalies',
                    label: `Review Queue (${anomalies.filter((a) => a.status === 'PENDING').length})`,
                    icon: AlertTriangle,
                  },
                  { id: 'members', label: 'Manage Members', icon: User },
                ].map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setActiveTab(t.id)}
                    className={`flex items-center gap-2 px-4 py-3 rounded-xl border-3 border-black transition cursor-pointer font-black text-[10px] uppercase tracking-wider ${
                      activeTab === t.id
                        ? 'bg-[#f5bb1b] text-black shadow-[3px_3px_0px_#000]'
                        : 'bg-white dark:bg-[#1c1c1e] text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-neutral-800 shadow-[3px_3px_0px_#000] hover:text-black dark:hover:text-white'
                    }`}
                  >
                    <t.icon className="h-4 w-4" />
                    <span>{t.label}</span>
                  </button>
                ))}
              </div>

              {error && (
                <div className="rounded-2xl bg-red-950/40 border-3 border-black px-4 py-3 text-xs font-bold text-red-400 shadow-[2px_2px_0px_#000]">
                  {error}
                </div>
              )}

              {activeTab === 'balances' && balancesData && (
                <div className="space-y-6">
                  <div className="neobrutal-card-white p-6">
                    <h3 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-widest mb-3 flex items-center gap-1.5">
                      <span className="neobrutal-tag-yellow flex items-center gap-1">
                        <CheckCircle className="h-3.5 w-3.5 stroke-[3]" />
                        Aisha's Debt Minimization
                      </span>
                    </h3>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold mb-4 leading-relaxed">
                      Optimal settlements computed to clear outstanding debts:
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {balancesData.reconciliation.map((tx: any, idx: number) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between bg-slate-50 dark:bg-neutral-900/40 rounded-2xl p-4 border-2 border-black shadow-[2px_2px_0px_#000]"
                        >
                          <div className="text-xs">
                            <span className="font-extrabold text-red-500 uppercase tracking-wider">
                              {tx.from}
                            </span>
                            <span className="text-[9px] text-slate-400 dark:text-slate-500 mx-2 font-bold uppercase">
                              pays
                            </span>
                            <span className="font-extrabold text-emerald-500 uppercase tracking-wider">
                              {tx.to}
                            </span>
                          </div>
                          <div className="text-sm font-black text-slate-900 dark:text-white">
                            ₹{tx.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </div>
                        </div>
                      ))}

                      {balancesData.reconciliation.length === 0 && (
                        <p className="text-xs text-slate-550 dark:text-slate-450 py-2 font-bold tracking-wider col-span-2">
                          All debts settled! Ledger balanced.
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="neobrutal-card-white overflow-hidden">
                    <div className="p-4 sm:p-5 border-b-2 border-black flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 bg-white dark:bg-[#1c1c1e]">
                      <h3 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-widest">
                        Running Net Balances
                      </h3>
                      <p className="text-[9px] text-slate-500 dark:text-slate-400 font-bold uppercase">
                        Tap row for breakdown
                      </p>
                    </div>
                    <div className="table-scroll">

                    <table className="w-full text-left text-xs text-slate-650">
                      <thead className="bg-slate-100 dark:bg-neutral-900 text-[10px] font-black text-[#111111] dark:text-white uppercase tracking-wider border-b-2 border-black">
                        <tr>
                          <th className="px-6 py-4">Member Name</th>
                          <th className="px-6 py-4">Total Paid</th>
                          <th className="px-6 py-4">Total Owed</th>
                          <th className="px-6 py-4">Net Balance</th>
                          <th className="px-6 py-4 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 dark:divide-neutral-800 font-medium">
                        {balancesData.balances.map((b: any) => (
                          <tr
                            key={b.userId}
                            onClick={() => fetchDrilldown(b.userId, b.name)}
                            className="hover:bg-slate-50/60 dark:hover:bg-neutral-800/40 cursor-pointer transition dark:text-[#e8e8e8]"
                          >
                            <td className="px-6 py-4 text-slate-900 dark:text-white font-extrabold">
                              {b.name}
                            </td>
                            <td className="px-6 py-4">₹{b.totalPaid.toLocaleString()}</td>
                            <td className="px-6 py-4">₹{b.totalOwed.toLocaleString()}</td>
                            <td
                              className={`px-6 py-4 font-black ${b.netBalance >= 0 ? 'text-emerald-500' : 'text-red-500'}`}
                            >
                              {b.netBalance >= 0 ? '+' : ''}₹{b.netBalance.toLocaleString()}
                            </td>
                            <td className="px-6 py-4 text-right">
                              <button className="neobrutal-btn-yellow text-[9.5px] px-3 py-1.5 border-2 border-black shadow-[2px_2px_0px_#000]">
                                Explain Balance
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    </div>
                  </div>

                  {chartData.length > 0 && (
                    <div className="neobrutal-card-white p-6 space-y-4">
                      <div className="space-y-1">
                        <h3 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-widest">
                          Balance Timeline View
                        </h3>
                        <p className="text-[10.5px] text-slate-550 dark:text-slate-400 font-medium leading-relaxed">
                          Tracks running balances over time, highlighting join/departure milestones.
                        </p>
                      </div>

                      <div className="h-72 w-full pt-4">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart
                            data={chartData}
                            margin={{ top: 10, right: 30, left: 10, bottom: 5 }}
                          >
                            <CartesianGrid
                              strokeDasharray="3 3"
                              stroke={theme === 'dark' ? '#333333' : '#e2e8f0'}
                            />
                            <XAxis
                              dataKey="dateStr"
                              stroke={theme === 'dark' ? '#94a3b8' : '#64748b'}
                              fontSize={10}
                              tickLine={false}
                            />
                            <YAxis
                              stroke={theme === 'dark' ? '#94a3b8' : '#64748b'}
                              fontSize={10}
                              tickLine={false}
                            />
                            <Tooltip
                              contentStyle={{
                                backgroundColor: theme === 'dark' ? '#1c1c1e' : '#ffffff',
                                borderColor: '#cbd5e1',
                                color: theme === 'dark' ? '#f5f5f7' : '#0f172a',
                                borderRadius: '12px',
                              }}
                            />
                            <Legend
                              wrapperStyle={{
                                fontSize: '9px',
                                fontWeight: 'bold',
                                textTransform: 'uppercase',
                              }}
                            />
                            {selectedGroup.members.map((m: any, idx: number) => {
                              const colors = [
                                '#f5bb1b',
                                '#0ea5e9',
                                '#6366f1',
                                '#f43f5e',
                                '#10b981',
                                '#f59e0b',
                              ];
                              return (
                                <Line
                                  key={m.id}
                                  type="monotone"
                                  dataKey={m.name}
                                  stroke={colors[idx % colors.length]}
                                  strokeWidth={3}
                                  dot={{ r: 3 }}
                                  activeDot={{ r: 5 }}
                                />
                              );
                            })}
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'expenses' && (
                <div className="space-y-6">
                  <div className="neobrutal-card-white p-4 sm:p-6 flex flex-col gap-4">
                    <div className="space-y-1">
                      <h3 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-widest flex items-center gap-1.5">
                        <span className="neobrutal-tag-black">
                          <Upload className="h-3.5 w-3.5 inline mr-1 stroke-[3] text-brand-yellow" />
                          Import Spreadsheet CSV
                        </span>
                      </h3>
                      <p className="text-[10.5px] text-slate-550 dark:text-slate-400 font-medium">
                        Upload Expenses Export.csv directly. Clean items are saved; anomalies are
                        reviewed.
                      </p>
                    </div>

                    <form onSubmit={handleCsvImport} className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                      <input
                        type="file"
                        accept=".csv"
                        required
                        onChange={(e) => setCsvFile(e.target.files?.[0] || null)}
                        className="text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-2 file:border-black file:text-[10px] file:font-black file:uppercase file:bg-white dark:file:bg-[#262626] file:text-[#111111] dark:file:text-white hover:file:bg-slate-5 file:cursor-pointer file:shadow-[2px_2px_0px_#000]"
                      />
                      <button
                        type="submit"
                        disabled={importLoading || !csvFile}
                        className="neobrutal-btn-yellow text-[9px] py-2 px-4 shadow-[2px_2px_0px_#000] border-2 border-black disabled:opacity-50"
                      >
                        {importLoading ? 'Processing...' : 'Upload & Parse'}
                      </button>
                    </form>
                  </div>

                  {importReport && (
                    <div className="neobrutal-card-yellow p-6 space-y-4 text-black">
                      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 border-b border-black/10 pb-2">
                        <h4 className="text-xs font-black text-slate-900 uppercase tracking-widest flex items-center gap-1.5">
                          <FileText className="h-4.5 w-4.5" />
                          Live CSV Import Report
                        </h4>
                        <div className="flex items-center gap-3">
                          <button
                            onClick={handleExportReportCsv}
                            className="text-[9px] bg-black text-[#f5bb1b] font-black uppercase tracking-wider py-1 px-3 border-2 border-black rounded-lg shadow-[2px_2px_0px_#000] cursor-pointer hover:bg-neutral-800"
                          >
                            Export to Excel/CSV
                          </button>
                          <button
                            onClick={() => setImportReport(null)}
                            className="text-[10px] text-slate-900 font-bold uppercase hover:text-slate-855 cursor-pointer"
                          >
                            Clear
                          </button>
                        </div>
                      </div>

                      <div className="max-h-80 overflow-y-auto space-y-2 text-xs">
                        {importReport.map((rep, idx) => (
                          <div
                            key={idx}
                            className="p-3 rounded-2xl border-2 border-black flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white shadow-[2px_2px_0px_#000]"
                          >
                            <div className="space-y-1 text-[#111111]">
                              <span className="font-mono bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200 mr-2 text-slate-500 text-[10px]">
                                Row {rep.rowNumber}
                              </span>
                              <span className="font-extrabold text-slate-900 uppercase tracking-wide">
                                {rep.description}
                              </span>
                              <p className="text-[9px] text-slate-550 font-semibold uppercase mt-1 leading-relaxed">
                                {rep.details}
                              </p>
                            </div>

                            <div className="flex items-center gap-4">
                              <div className="flex flex-col items-end gap-1">
                                <span
                                  className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border-2 border-black ${
                                    rep.status === 'INSERTED'
                                      ? 'bg-slate-150 text-slate-800'
                                      : rep.status === 'SETTLEMENT'
                                        ? 'bg-emerald-100 text-emerald-800'
                                        : 'bg-amber-100 text-amber-800'
                                  }`}
                                >
                                  {rep.status}
                                </span>

                                {rep.anomalies.map((a: any, aIdx: number) => (
                                  <span
                                    key={aIdx}
                                    className="text-[9px] text-red-650 font-bold uppercase tracking-wider"
                                  >
                                    ⚠️ {a.description}
                                  </span>
                                ))}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="neobrutal-card-white overflow-hidden">
                    <div className="p-4 sm:p-5 border-b-2 border-black flex flex-col sm:flex-row justify-between sm:items-center gap-3 bg-white dark:bg-[#1c1c1e]">
                      <h3 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-widest">
                        Group Expenses
                      </h3>

                      <button
                        onClick={() => {
                          setExpenseDate(new Date().toISOString().slice(0, 10));
                          setExpensePayer(selectedGroup.members[0]?.id || '');
                          setIsAddExpenseOpen(true);
                        }}
                        className="neobrutal-btn-yellow text-[9px] py-2 px-4 shadow-[2px_2px_0px_#000] border-2 border-black flex items-center gap-1"
                      >
                        <Plus className="h-4.5 w-4.5" />
                        Add Expense
                      </button>
                    </div>

                    <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300">
                      <thead className="bg-slate-100 dark:bg-neutral-900 text-[10px] font-black text-slate-700 dark:text-slate-350 uppercase tracking-wider border-b-2 border-black">
                        <tr>
                          <th className="px-6 py-4">Date</th>
                          <th className="px-6 py-4">Description</th>
                          <th className="px-6 py-4">Payer</th>
                          <th className="px-6 py-4">Amount</th>
                          <th className="px-6 py-4">Splits Detail</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 dark:divide-neutral-800 font-medium">
                        {expenses.map((e) => (
                          <tr
                            key={e.id}
                            className="hover:bg-slate-50/60 dark:hover:bg-neutral-800/40 text-[#111111] dark:text-slate-200 transition"
                          >
                            <td className="px-6 py-4 whitespace-nowrap text-slate-500 dark:text-slate-400">
                              {new Date(e.date).toLocaleDateString(undefined, {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric',
                              })}
                            </td>
                            <td className="px-6 py-4 text-slate-900 dark:text-white font-extrabold">
                              {e.description}
                            </td>
                            <td className="px-6 py-4 text-slate-700 dark:text-slate-300">
                              {e.payerName}
                            </td>
                            <td className="px-6 py-4 font-black text-slate-900 dark:text-white">
                              ₹
                              {e.convertedAmount.toLocaleString(undefined, {
                                minimumFractionDigits: 2,
                              })}
                              {e.currency !== 'INR' && (
                                <span className="block text-[9px] text-amber-600 dark:text-amber-500 font-bold uppercase mt-0.5">
                                  Original: {e.amount} {e.currency} (Rate: ₹{e.exchangeRate}/$)
                                </span>
                              )}
                            </td>
                            <td className="px-6 py-4 text-[10px]">
                              <div className="flex flex-wrap gap-2">
                                {e.splits.map((s: any, idx: number) => (
                                  <span
                                    key={idx}
                                    className="bg-slate-50 dark:bg-neutral-900 px-2 py-0.5 rounded border border-slate-200 dark:border-neutral-800 text-[9px] font-mono font-bold text-slate-605 dark:text-slate-400"
                                  >
                                    {s.name}: ₹{s.amount.toFixed(0)}
                                  </span>
                                ))}
                              </div>
                            </td>
                          </tr>
                        ))}

                        {expenses.length === 0 && (
                          <tr>
                            <td
                              colSpan={5}
                              className="text-center py-8 text-xs text-slate-400 font-bold uppercase"
                            >
                              No expenses recorded.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {activeTab === 'settlements' && (
                <div className="neobrutal-card-white overflow-hidden">
                  <div className="p-5 border-b-2 border-black flex justify-between items-center bg-white dark:bg-[#1c1c1e]">
                    <h3 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-widest">
                      Reconciliation Settlements
                    </h3>
                    <button
                      onClick={() => {
                        setSettleDate(new Date().toISOString().slice(0, 10));
                        setSettlePayer(selectedGroup.members[0]?.id || '');
                        setSettleReceiver(selectedGroup.members[1]?.id || '');
                        setIsRecordSettlementOpen(true);
                      }}
                      className="neobrutal-btn-yellow text-[9px] py-2 px-4 shadow-[2px_2px_0px_#000] border-2 border-black flex items-center gap-1"
                    >
                      <Plus className="h-4.5 w-4.5" />
                      Record Settlement
                    </button>
                  </div>

                  <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300">
                    <thead className="bg-slate-100 dark:bg-neutral-900 text-[10px] font-black text-slate-700 dark:text-slate-350 uppercase tracking-wider border-b-2 border-black">
                      <tr>
                        <th className="px-6 py-4">Date</th>
                        <th className="px-6 py-4">Payer (Who Paid)</th>
                        <th className="px-6 py-4">Receiver (Who Received)</th>
                        <th className="px-6 py-4">Settled Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-neutral-800 font-medium">
                      {settlements.map((s) => (
                        <tr
                          key={s.id}
                          className="hover:bg-slate-50/60 dark:hover:bg-neutral-800/40 text-[#111111] dark:text-slate-200 transition"
                        >
                          <td className="px-6 py-4 text-slate-500 dark:text-slate-400">
                            {new Date(s.date).toLocaleDateString(undefined, {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                            })}
                          </td>
                          <td className="px-6 py-4 text-red-500 font-extrabold uppercase tracking-wide">
                            {s.payerName}
                          </td>
                          <td className="px-6 py-4 text-emerald-500 font-extrabold uppercase tracking-wide">
                            {s.receiverName}
                          </td>
                          <td className="px-6 py-4 text-slate-900 dark:text-white font-black">
                            ₹{s.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </td>
                        </tr>
                      ))}

                      {settlements.length === 0 && (
                        <tr>
                          <td
                            colSpan={4}
                            className="text-center py-8 text-xs text-slate-400 font-bold uppercase"
                          >
                            No settlements logged.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}

              {activeTab === 'anomalies' && (
                <div className="space-y-6">
                  <div className="neobrutal-card-yellow p-6 space-y-2 text-black">
                    <h3 className="text-xs font-black uppercase tracking-widest flex items-center gap-1.5">
                      <span className="neobrutal-tag-black">
                        <AlertTriangle className="h-3.5 w-3.5 inline mr-1 stroke-[3] text-brand-yellow animate-pulse" />
                        Oversight Review Queue
                      </span>
                    </h3>
                    <p className="text-[10.5px] font-semibold leading-relaxed">
                      Approve rows with inline corrections or Reject to delete/discard duplicates
                      and conflicts.
                    </p>
                  </div>

                  <div className="neobrutal-card-white overflow-hidden">
                    <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300">
                      <thead className="bg-slate-100 dark:bg-neutral-900 text-[10px] font-black text-slate-750 dark:text-slate-350 uppercase tracking-wider border-b-2 border-black">
                        <tr>
                          <th className="px-6 py-4">File / Row</th>
                          <th className="px-6 py-4">Anomaly Type</th>
                          <th className="px-6 py-4">Flagged Issues</th>
                          <th className="px-6 py-4">Status</th>
                          <th className="px-6 py-4 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 dark:divide-neutral-800 font-medium">
                        {anomalies.map((anom) => (
                          <tr
                            key={anom.id}
                            className="hover:bg-slate-50/60 dark:hover:bg-neutral-800/40 text-[#111111] dark:text-slate-200 transition"
                          >
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className="block text-slate-900 dark:text-white font-extrabold uppercase">
                                {anom.session.fileName}
                              </span>
                              <span className="text-[9px] text-slate-400 dark:text-slate-500 font-semibold uppercase">
                                Row {anom.rowNumber}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className="font-mono text-[8.5px] font-bold uppercase tracking-wider bg-amber-50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-400 border-2 border-black px-2 py-0.5 rounded-full shadow-[1px_1px_0px_#000]">
                                {anom.anomalyType}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-slate-800 dark:text-slate-300 max-w-xs leading-relaxed text-[10.5px] font-semibold">
                              {anom.description}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span
                                className={`font-black uppercase tracking-wider px-2 py-0.5 rounded border-2 border-black text-[8.5px] ${
                                  anom.status === 'PENDING'
                                    ? 'bg-amber-100 text-amber-800'
                                    : anom.status === 'APPROVED'
                                      ? 'bg-emerald-100 text-emerald-800'
                                      : 'bg-red-100 text-red-800'
                                }`}
                              >
                                {anom.status}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-right whitespace-nowrap space-x-2">
                              {anom.status === 'PENDING' ? (
                                <>
                                  <button
                                    onClick={() => openOverrideForm(anom)}
                                    className="neobrutal-btn-yellow text-[9px] px-3 py-1.5 shadow-[2px_2px_0px_#000] border-2 border-black"
                                  >
                                    Approve / Resolve
                                  </button>
                                  <button
                                    onClick={() => handleResolveAnomaly(anom.id, 'REJECT')}
                                    className="neobrutal-btn-white text-[9px] px-3 py-1.5 shadow-[2px_2px_0px_#000] border-2 border-black text-red-650 hover:text-red-700"
                                  >
                                    Reject
                                  </button>
                                </>
                              ) : (
                                <span className="text-slate-450 italic font-bold uppercase">
                                  Resolved
                                </span>
                              )}
                            </td>
                          </tr>
                        ))}

                        {anomalies.length === 0 && (
                          <tr>
                            <td
                              colSpan={5}
                              className="text-center py-8 text-xs text-slate-400 font-bold uppercase"
                            >
                              No anomalies recorded.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {activeTab === 'members' && (
                <div className="space-y-6">
                  <div className="neobrutal-card-white overflow-hidden">
                    <div className="p-5 border-b-2 border-black flex justify-between items-center bg-white dark:bg-[#1c1c1e]">
                      <h3 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-widest">
                        Time-Travel Memberships
                      </h3>
                      <button
                        onClick={() => setIsAddMemberOpen(true)}
                        className="neobrutal-btn-yellow text-[9px] py-2 px-4 shadow-[2px_2px_0px_#000] border-2 border-black flex items-center gap-1"
                      >
                        <Plus className="h-4.5 w-4.5" />
                        Invite Member
                      </button>
                    </div>

                    <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                      {groupMembers.map((m: any) => (
                        <div
                          key={m.id}
                          className="rounded-2xl border-2 border-black bg-slate-50 dark:bg-neutral-900/40 p-5 space-y-4 flex flex-col justify-between text-slate-900 dark:text-white shadow-[3px_3px_0px_#000]"
                        >
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <span className="rounded-full bg-white dark:bg-neutral-900 p-1.5 border border-slate-250 dark:border-neutral-800 shadow-sm flex items-center justify-center">
                                <User className="h-5 w-5 text-amber-500" />
                              </span>
                              <h4 className="text-xs font-extrabold uppercase tracking-wide">
                                {m.name}
                              </h4>
                            </div>

                            <div className="space-y-1 text-[9.5px] text-slate-500 font-semibold uppercase">
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-slate-450">Joined:</span>
                                <span>
                                  {new Date(m.joinedAt).toLocaleDateString(undefined, {
                                    year: 'numeric',
                                    month: 'short',
                                    day: 'numeric',
                                  })}
                                </span>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-slate-450">Status:</span>
                                {m.leftAt ? (
                                  <span className="text-red-650 font-bold">
                                    Left on{' '}
                                    {new Date(m.leftAt).toLocaleDateString(undefined, {
                                      year: 'numeric',
                                      month: 'short',
                                      day: 'numeric',
                                    })}
                                  </span>
                                ) : (
                                  <span className="text-emerald-600 font-bold flex items-center gap-1">
                                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-600 animate-pulse"></span>
                                    Active
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          {!m.leftAt && (
                            <div className="pt-2 border-t border-slate-200 flex items-center gap-2">
                              <input
                                type="date"
                                id={`left-date-${m.id}`}
                                className="neobrutal-input text-xs py-1 px-2.5 shadow-[1px_1px_0px_#000] border-2 border-black"
                              />
                              <button
                                onClick={() => {
                                  const dateInput = document.getElementById(
                                    `left-date-${m.id}`,
                                  ) as HTMLInputElement;
                                  if (dateInput?.value) {
                                    handleRecordDeparture(m.id, dateInput.value);
                                  } else {
                                    toast.warning('Please select a departure date first.');
                                  }
                                }}
                                className="neobrutal-btn-white text-[9px] px-3 py-1.5 shadow-[2px_2px_0px_#000] border-2 border-black text-red-650 hover:text-red-700"
                              >
                                Record Departure
                              </button>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="neobrutal-card-white p-12 text-center space-y-4">
              <span className="rounded-full bg-slate-50 p-4 border border-slate-100 inline-block shadow-inner">
                <Users className="h-8 w-8 text-amber-500" />
              </span>
              <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest">
                Select or Create a Group
              </h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto font-medium leading-relaxed uppercase font-sans">
                Open an expense group or start a new ledger with your flatmates.
              </p>

              <button
                onClick={() => setIsCreateGroupOpen(true)}
                className="neobrutal-btn-yellow text-[9px] py-2 px-4 shadow-[2px_2px_0px_#000] border-2 border-black"
              >
                Create Group
              </button>
            </div>
          )}
        </section>
      </main>

      {isCreateGroupOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-md neobrutal-card-white p-6 space-y-4">
            <h3 className="text-xs font-black uppercase tracking-widest text-[#f5bb1b] bg-[#111111] border-2 border-black py-1 px-3 shadow-[2px_2px_0px_#000] rounded-lg inline-block">
              Create Sharing Group
            </h3>
            <form onSubmit={handleCreateGroup} className="space-y-4">
              <div className="space-y-2">
                <label className="block text-[9px] font-bold text-slate-555 dark:text-slate-400 uppercase tracking-widest">
                  Group Name
                </label>
                <input
                  type="text"
                  required
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                  placeholder="e.g. Goa Trip, Flat 402"
                  className="block w-full neobrutal-input text-xs"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCreateGroupOpen(false)}
                  className="neobrutal-btn-white px-4 py-2 text-xs"
                >
                  Cancel
                </button>
                <button type="submit" className="neobrutal-btn-yellow px-4 py-2 text-xs">
                  Create Group
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isAddMemberOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-md neobrutal-card-white p-6 space-y-4">
            <h3 className="text-xs font-black uppercase tracking-widest text-[#f5bb1b] bg-[#111111] border-2 border-black py-1 px-3 shadow-[2px_2px_0px_#000] rounded-lg inline-block">
              Invite Flatmate
            </h3>

            <form onSubmit={handleAddMember} className="space-y-4 font-semibold text-xs">
              <div className="space-y-2">
                <label className="block text-[9px] font-bold text-slate-555 dark:text-slate-400 uppercase tracking-widest">
                  Username
                </label>
                <input
                  type="text"
                  required
                  value={newMemberName}
                  onChange={(e) => setNewMemberName(e.target.value)}
                  placeholder="e.g. Sam"
                  className="block w-full neobrutal-input text-xs"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-[9px] font-bold text-slate-555 dark:text-slate-400 uppercase tracking-widest">
                  Join Date
                </label>
                <input
                  type="date"
                  required
                  value={newMemberJoinDate}
                  onChange={(e) => setNewMemberJoinDate(e.target.value)}
                  className="block w-full neobrutal-input text-xs"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddMemberOpen(false)}
                  className="neobrutal-btn-white px-4 py-2 text-xs"
                >
                  Cancel
                </button>
                <button type="submit" className="neobrutal-btn-yellow px-4 py-2 text-xs">
                  Invite Member
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {drilldownUser && drilldownData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-3xl neobrutal-card-white p-6 space-y-6 max-h-[85vh] overflow-y-auto text-black dark:text-white">
            <div className="flex justify-between items-start border-b-2 border-dashed border-black pb-4">
              <div>
                <h3 className="text-xs font-black uppercase tracking-widest text-[#f5bb1b] bg-[#111111] border-2 border-black py-1 px-3 shadow-[2px_2px_0px_#000] rounded-lg inline-block">
                  Breakdown: {drilldownUser.name}
                </h3>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold mt-1">
                  Audit trail mapping calculations (No magic numbers)
                </p>
              </div>
              <button
                onClick={() => {
                  setDrilldownUser(null);
                  setDrilldownData(null);
                }}
                className="neobrutal-btn-white text-[9.5px] px-3 py-1.5"
              >
                Close
              </button>
            </div>

            <div className="bg-slate-50 dark:bg-neutral-900 border-2 border-black rounded-2xl p-5 flex justify-between items-center text-center text-xs shadow-[2px_2px_0px_#000] text-black dark:text-white">
              <div>
                <span className="text-[9px] text-slate-500 dark:text-slate-450 uppercase font-bold block mb-1">
                  Paid
                </span>
                <span className="font-extrabold">
                  ₹{drilldownData.summary.totalPaid.toLocaleString()}
                </span>
              </div>
              <span className="text-slate-400 dark:text-slate-600 font-black">+</span>
              <div>
                <span className="text-[9px] text-slate-500 dark:text-slate-455 uppercase font-bold block mb-1">
                  Settled Paid
                </span>
                <span className="font-extrabold">
                  ₹{drilldownData.summary.settlementsPaid.toLocaleString()}
                </span>
              </div>
              <span className="text-slate-400 dark:text-slate-600 font-black">-</span>
              <div>
                <span className="text-[9px] text-slate-500 dark:text-slate-455 uppercase font-bold block mb-1">
                  Owed
                </span>
                <span className="font-extrabold">
                  ₹{drilldownData.summary.totalOwed.toLocaleString()}
                </span>
              </div>
              <span className="text-slate-400 dark:text-slate-600 font-black">-</span>
              <div>
                <span className="text-[9px] text-slate-500 dark:text-slate-455 uppercase font-bold block mb-1">
                  Settled Recv
                </span>
                <span className="font-extrabold">
                  ₹{drilldownData.summary.settlementsReceived.toLocaleString()}
                </span>
              </div>
              <span className="text-slate-400 dark:text-slate-600 font-black">=</span>
              <div>
                <span className="text-[9px] text-slate-500 dark:text-slate-455 uppercase font-bold block mb-1">
                  Balance
                </span>
                <span
                  className={`font-black ${drilldownData.summary.netBalance >= 0 ? 'text-emerald-500' : 'text-red-500'}`}
                >
                  ₹{drilldownData.summary.netBalance.toLocaleString()}
                </span>
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="text-[10px] font-black text-slate-450 uppercase tracking-widest">
                Owed Splits
              </h4>
              <div className="max-h-56 overflow-y-auto space-y-2 text-[11px] font-medium text-black dark:text-white">
                {drilldownData.splits.map((s: any, idx: number) => (
                  <div
                    key={idx}
                    className="bg-slate-50 dark:bg-neutral-900/60 rounded-xl p-3 border-2 border-black flex justify-between items-center shadow-[1.5px_1.5px_0px_#000]"
                  >
                    <div>
                      <p className="font-bold uppercase tracking-wide">{s.description}</p>
                      <span className="text-[9px] text-slate-500 dark:text-slate-400 uppercase font-semibold">
                        {new Date(s.date).toLocaleDateString()} • Paid by {s.payerName} • Type:{' '}
                        {s.splitType}
                      </span>
                      {s.currency !== 'INR' && (
                        <span className="block text-[9px] text-[#f5bb1b] font-bold uppercase mt-1">
                          Priya Rate check: Original {s.originalAmount} {s.currency} @ ₹
                          {s.exchangeRate}/$
                        </span>
                      )}
                    </div>
                    <div className="text-right">
                      <span className="font-bold text-red-500">-₹{s.yourShare.toFixed(2)}</span>
                    </div>
                  </div>
                ))}

                {drilldownData.splits.length === 0 && (
                  <p className="text-xs text-slate-500 italic py-2">No splits charged.</p>
                )}
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="text-[10px] font-black text-slate-450 uppercase tracking-widest">
                Paid Costs
              </h4>
              <div className="max-h-56 overflow-y-auto space-y-2 text-[11px] font-medium text-black dark:text-white">
                {drilldownData.paidExpenses.map((e: any, idx: number) => (
                  <div
                    key={idx}
                    className="bg-slate-50 dark:bg-neutral-900/60 rounded-xl p-3 border-2 border-black flex justify-between items-center shadow-[1.5px_1.5px_0px_#000]"
                  >
                    <div>
                      <p className="font-bold uppercase tracking-wide">{e.description}</p>
                      <span className="text-[9px] text-slate-500 dark:text-slate-400 uppercase font-semibold">
                        {new Date(e.date).toLocaleDateString()} • Splits:{' '}
                        {e.splits
                          .map((sp: any) => `${sp.name} (₹${sp.amount.toFixed(0)})`)
                          .join(', ')}
                      </span>
                      {e.currency !== 'INR' && (
                        <span className="block text-[9px] text-[#f5bb1b] font-bold uppercase mt-1">
                          USD conversion rate: ₹{e.exchangeRate}/$
                        </span>
                      )}
                    </div>
                    <div className="text-right">
                      <span className="font-bold text-emerald-500">
                        +₹{e.convertedAmount.toFixed(2)}
                      </span>
                    </div>
                  </div>
                ))}

                {drilldownData.paidExpenses.length === 0 && (
                  <p className="text-xs text-slate-500 italic py-2">No paid costs logged.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {isAddExpenseOpen && selectedGroup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg neobrutal-card-white p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <h3 className="text-xs font-black uppercase tracking-widest text-[#f5bb1b] bg-[#111111] border-2 border-black py-1 px-3 shadow-[2px_2px_0px_#000] rounded-lg inline-block">
              Record Expense
            </h3>

            <form onSubmit={handleManualExpense} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2 space-y-2">
                  <label className="block text-[9px] font-bold text-slate-555 dark:text-slate-400 uppercase tracking-widest">
                    Description
                  </label>
                  <input
                    type="text"
                    required
                    value={expenseDesc}
                    onChange={(e) => setExpenseDesc(e.target.value)}
                    placeholder="e.g. March utilities"
                    className="block w-full neobrutal-input text-xs"
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-[9px] font-bold text-slate-555 dark:text-slate-400 uppercase tracking-widest">
                    Amount
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={expenseAmount}
                    onChange={(e) => setExpenseAmount(e.target.value)}
                    placeholder="0.00"
                    className="block w-full neobrutal-input text-xs"
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-[9px] font-bold text-slate-555 dark:text-slate-400 uppercase tracking-widest">
                    Currency
                  </label>
                  <select
                    value={expenseCurrency}
                    onChange={(e) => setExpenseCurrency(e.target.value)}
                    className="block w-full neobrutal-input text-xs cursor-pointer"
                  >
                    <option value="INR">INR (₹)</option>
                    <option value="USD">USD ($)</option>
                  </select>
                </div>

                {expenseCurrency === 'USD' && (
                  <div className="space-y-2 col-span-2">
                    <label className="block text-[9px] font-bold text-slate-555 dark:text-slate-400 uppercase tracking-widest">
                      USD Exchange Rate (INR per $)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={expenseRate}
                      onChange={(e) => setExpenseRate(e.target.value)}
                      placeholder="83.4"
                      className="block w-full neobrutal-input text-xs"
                    />
                  </div>
                )}

                <div className="space-y-2">
                  <label className="block text-[9px] font-bold text-slate-555 dark:text-slate-400 uppercase tracking-widest">
                    Date
                  </label>
                  <input
                    type="date"
                    required
                    value={expenseDate}
                    onChange={(e) => setExpenseDate(e.target.value)}
                    className="block w-full neobrutal-input text-xs"
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-[9px] font-bold text-slate-555 dark:text-slate-400 uppercase tracking-widest">
                    Payer
                  </label>
                  <select
                    value={expensePayer}
                    onChange={(e) => setExpensePayer(e.target.value)}
                    className="block w-full neobrutal-input text-xs cursor-pointer"
                  >
                    {groupMembers.map((m: any) => (
                      <option key={m.id} value={m.id}>
                        {m.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2 col-span-2">
                  <label className="block text-[9px] font-bold text-slate-555 dark:text-slate-400 uppercase tracking-widest">
                    Split Type
                  </label>
                  <select
                    value={expenseSplitType}
                    onChange={(e) => setExpenseSplitType(e.target.value)}
                    className="block w-full neobrutal-input text-xs cursor-pointer"
                  >
                    <option value="EQUAL">Split Equally</option>
                    <option value="UNEQUAL">Custom Shares (Exact)</option>
                  </select>
                </div>
              </div>

              {expenseSplitType === 'UNEQUAL' && (
                <div className="bg-slate-50 dark:bg-neutral-900 p-4 rounded-xl border-2 border-black space-y-3 text-xs shadow-[2px_2px_0px_#000]">
                  <h4 className="text-[9px] font-bold text-slate-550 dark:text-slate-400 uppercase tracking-widest">
                    Splits share breakdown (₹ in INR)
                  </h4>
                  <div className="grid grid-cols-2 gap-3">
                    {groupMembers.map((m: any) => (
                      <div key={m.id} className="flex items-center justify-between gap-2">
                        <span className="text-slate-650 dark:text-slate-350 font-bold uppercase tracking-wider text-[9px]">
                          {m.name}
                        </span>
                        <input
                          type="number"
                          step="0.01"
                          placeholder="0.00"
                          value={expenseSplitDetails[m.id] || ''}
                          onChange={(e) =>
                            setExpenseSplitDetails({
                              ...expenseSplitDetails,
                              [m.id]: e.target.value,
                            })
                          }
                          className="w-24 text-right neobrutal-input text-xs px-2 py-1"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddExpenseOpen(false)}
                  className="neobrutal-btn-white px-4 py-2 text-xs"
                >
                  Cancel
                </button>
                <button type="submit" className="neobrutal-btn-yellow px-4 py-2 text-xs">
                  Save Expense
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isRecordSettlementOpen && selectedGroup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-md neobrutal-card-white p-6 space-y-4">
            <h3 className="text-xs font-black uppercase tracking-widest text-[#f5bb1b] bg-[#111111] border-2 border-black py-1 px-3 shadow-[2px_2px_0px_#000] rounded-lg inline-block">
              Record Settlement
            </h3>

            <form onSubmit={handleManualSettlement} className="space-y-4 text-xs">
              <div className="space-y-2">
                <label className="block text-[9px] font-bold text-slate-555 dark:text-slate-400 uppercase tracking-widest">
                  From Payer
                </label>
                <select
                  value={settlePayer}
                  onChange={(e) => setSettlePayer(e.target.value)}
                  className="block w-full neobrutal-input text-xs cursor-pointer"
                >
                  {groupMembers.map((m: any) => (
                    <option key={m.id} value={m.id}>
                      {m.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="block text-[9px] font-bold text-slate-555 dark:text-slate-400 uppercase tracking-widest">
                  To Receiver
                </label>
                <select
                  value={settleReceiver}
                  onChange={(e) => setSettleReceiver(e.target.value)}
                  className="block w-full neobrutal-input text-xs cursor-pointer"
                >
                  {groupMembers.map((m: any) => (
                    <option key={m.id} value={m.id}>
                      {m.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="block text-[9px] font-bold text-slate-555 dark:text-slate-400 uppercase tracking-widest">
                  Amount (₹ in INR)
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={settleAmount}
                  onChange={(e) => setSettleAmount(e.target.value)}
                  placeholder="0.00"
                  className="block w-full neobrutal-input text-xs"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-[9px] font-bold text-slate-555 dark:text-slate-400 uppercase tracking-widest">
                  Date
                </label>
                <input
                  type="date"
                  required
                  value={settleDate}
                  onChange={(e) => setSettleDate(e.target.value)}
                  className="block w-full neobrutal-input text-xs"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsRecordSettlementOpen(false)}
                  className="neobrutal-btn-white px-4 py-2 text-xs"
                >
                  Cancel
                </button>
                <button type="submit" className="neobrutal-btn-yellow px-4 py-2 text-xs">
                  Save Settlement
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {editingAnomaly && selectedGroup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg neobrutal-card-white p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <h3 className="text-xs font-black uppercase tracking-widest text-[#f5bb1b] bg-[#111111] border-2 border-black py-1 px-3 shadow-[2px_2px_0px_#000] rounded-lg inline-block">
              Resolve Anomaly
            </h3>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold uppercase leading-relaxed">
              Edit parsed records below, and approve to save.
            </p>

            <div className="bg-amber-50 dark:bg-neutral-900 p-4 rounded-xl border-2 border-black text-[9px] space-y-1 font-mono shadow-[2px_2px_0px_#000]">
              <p className="text-slate-500 dark:text-slate-400 font-bold uppercase">
                Reason Flagged:
              </p>
              <p className="text-red-600 dark:text-red-400 font-bold leading-normal uppercase">
                {editingAnomaly.description}
              </p>
            </div>

            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="block text-[9px] font-bold text-slate-555 dark:text-slate-400 uppercase tracking-widest">
                    Description
                  </label>
                  <input
                    type="text"
                    value={overrideForm.description || ''}
                    onChange={(e) =>
                      setOverrideForm({ ...overrideForm, description: e.target.value })
                    }
                    className="block w-full neobrutal-input text-xs"
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-[9px] font-bold text-slate-555 dark:text-slate-400 uppercase tracking-widest">
                    Amount
                  </label>
                  <input
                    type="text"
                    value={overrideForm.amount || ''}
                    onChange={(e) => setOverrideForm({ ...overrideForm, amount: e.target.value })}
                    className="block w-full neobrutal-input text-xs font-mono"
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-[9px] font-bold text-slate-555 dark:text-slate-400 uppercase tracking-widest">
                    Currency
                  </label>
                  <input
                    type="text"
                    value={overrideForm.currency || ''}
                    onChange={(e) => setOverrideForm({ ...overrideForm, currency: e.target.value })}
                    className="block w-full neobrutal-input text-xs font-mono"
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-[9px] font-bold text-slate-555 dark:text-slate-400 uppercase tracking-widest">
                    Date
                  </label>
                  <input
                    type="text"
                    value={overrideForm.date || ''}
                    onChange={(e) => setOverrideForm({ ...overrideForm, date: e.target.value })}
                    className="block w-full neobrutal-input text-xs font-mono"
                    placeholder="DD-MM-YYYY"
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-[9px] font-bold text-slate-555 dark:text-slate-400 uppercase tracking-widest">
                    Paid By (Payer)
                  </label>
                  <input
                    type="text"
                    value={overrideForm.paid_by || ''}
                    onChange={(e) => setOverrideForm({ ...overrideForm, paid_by: e.target.value })}
                    className="block w-full neobrutal-input text-xs"
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-[9px] font-bold text-slate-555 dark:text-slate-400 uppercase tracking-widest">
                    Split Type
                  </label>
                  <input
                    type="text"
                    value={overrideForm.split_type || ''}
                    onChange={(e) =>
                      setOverrideForm({ ...overrideForm, split_type: e.target.value })
                    }
                    className="block w-full neobrutal-input text-xs"
                    placeholder="equal, percentage, share"
                  />
                </div>
                <div className="col-span-2 space-y-2">
                  <label className="block text-[9px] font-bold text-slate-555 dark:text-slate-400 uppercase tracking-widest">
                    Split With (semicolon separated)
                  </label>
                  <input
                    type="text"
                    value={overrideForm.split_with || ''}
                    onChange={(e) =>
                      setOverrideForm({ ...overrideForm, split_with: e.target.value })
                    }
                    className="block w-full neobrutal-input text-xs"
                    placeholder="Aisha;Rohan;Priya"
                  />
                </div>
                <div className="col-span-2 space-y-2">
                  <label className="block text-[9px] font-bold text-slate-555 dark:text-slate-400 uppercase tracking-widest">
                    Split Details
                  </label>
                  <input
                    type="text"
                    value={overrideForm.split_details || ''}
                    onChange={(e) =>
                      setOverrideForm({ ...overrideForm, split_details: e.target.value })
                    }
                    className="block w-full neobrutal-input text-xs"
                    placeholder="Aisha 30; Rohan 30..."
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingAnomaly(null)}
                  className="neobrutal-btn-white px-4 py-2 text-xs"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => handleResolveAnomaly(editingAnomaly.id, 'APPROVE')}
                  className="neobrutal-btn-yellow px-4 py-2 text-xs"
                >
                  Approve & Insert
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {confirmDeleteGroupId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm neobrutal-card-white p-6 space-y-5">
            <div className="flex items-center gap-3">
              <span className="flex-shrink-0 bg-red-100 border-2 border-black rounded-xl p-2.5 shadow-[2px_2px_0px_#000]">
                <Trash2 className="h-5 w-5 text-red-600" />
              </span>
              <div>
                <h3 className="text-xs font-black uppercase tracking-widest text-[#f5bb1b] bg-[#111111] border-2 border-black py-1 px-3 shadow-[2px_2px_0px_#000] rounded-lg inline-block">
                  Delete Group
                </h3>
              </div>
            </div>

            <p className="text-[11px] text-slate-600 dark:text-slate-300 font-semibold leading-relaxed">
              Are you sure you want to permanently delete this group? This will erase all expenses,
              memberships, settlements, and review history.{' '}
              <span className="text-red-500 font-black">This cannot be undone.</span>
            </p>

            <div className="flex justify-end gap-3 pt-1">
              <button
                type="button"
                onClick={() => setConfirmDeleteGroupId(null)}
                className="neobrutal-btn-white px-4 py-2 text-xs"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => performDeleteGroup(confirmDeleteGroupId)}
                className="px-4 py-2 text-xs font-black uppercase tracking-wider rounded-xl bg-red-600 hover:bg-red-700 text-white border-2 border-black shadow-[2px_2px_0px_#000] cursor-pointer transition"
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
