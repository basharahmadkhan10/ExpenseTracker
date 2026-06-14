'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from 'recharts';
import { 
  Plus, Upload, RefreshCw, LogOut, Info, AlertTriangle, CheckCircle, XCircle, Calendar, User, DollarSign, Users, ChevronRight, FileText
} from 'lucide-react';

export default function DashboardPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [groups, setGroups] = useState<any[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<any>(null);
  
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
      console.error(err);
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
      console.error(err);
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

      // Refresh list
      const groupsRes = await fetch('/api/groups');
      const groupsData = await groupsRes.json();
      setGroups(groupsData);
      setSelectedGroup(data);
      setIsCreateGroupOpen(false);
      setNewGroupName('');
    } catch (err: any) {
      alert(err.message || 'Failed to create group');
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

      // Refresh Group selection detail to include new member list
      const groupRes = await fetch(`/api/groups/${selectedGroup.id}`);
      const groupData = await groupRes.json();
      setSelectedGroup(groupData);

      setIsAddMemberOpen(false);
      setNewMemberName('');
      setNewMemberJoinDate('');
      fetchGroupDetailsAndData();
    } catch (err: any) {
      alert(err.message || 'Failed to add member');
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

      const groupRes = await fetch(`/api/groups/${selectedGroup.id}`);
      const groupData = await groupRes.json();
      setSelectedGroup(groupData);
      fetchGroupDetailsAndData();
    } catch (err: any) {
      alert(err.message || 'Failed to record departure');
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

      setImportReport(data.report);
      fetchGroupDetailsAndData();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setImportLoading(false);
    }
  };

  const handleManualExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedGroup) return;

    const formattedSplits: any[] = [];
    selectedGroup.members.forEach((m: any) => {
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
      alert(err.message || 'Failed to record expense');
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

      setIsRecordSettlementOpen(false);
      setSettlePayer('');
      setSettleReceiver('');
      setSettleAmount('');
      setSettleDate('');
      fetchGroupDetailsAndData();
    } catch (err: any) {
      alert(err.message || 'Failed to record settlement');
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
    } catch (err) {
      console.error(err);
    }
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

      setEditingAnomaly(null);
      fetchGroupDetailsAndData();
    } catch (err: any) {
      alert(err.message || 'Failed to resolve anomaly');
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

    // Date filters check
    const startLimit = startDate ? new Date(startDate).getTime() : 0;
    const endLimit = endDate ? new Date(endDate).getTime() : Infinity;

    // Combine transactions chronologically
    const events: any[] = [];
    expenses.forEach(e => {
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

    settlements.forEach(s => {
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
    selectedGroup.members.forEach((m: any) => {
      runningBalances[m.name] = 0;
    });

    const chartPoints: any[] = [];

    // Add starting point
    if (events.length > 0) {
      const firstDate = new Date(events[0].date);
      firstDate.setDate(firstDate.getDate() - 1);
      const point: any = { dateStr: firstDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) };
      selectedGroup.members.forEach((m: any) => {
        point[m.name] = 0;
      });
      chartPoints.push(point);
    }

    events.forEach(ev => {
      if (ev.type === 'EXPENSE') {
        const payerName = selectedGroup.members.find((m: any) => m.id === ev.payerId)?.name;
        if (payerName) {
          runningBalances[payerName] += ev.amount;
        }
        ev.splits.forEach((sp: any) => {
          if (runningBalances[sp.name] !== undefined) {
            runningBalances[sp.name] -= sp.amount;
          }
        });
      } else {
        const payerName = selectedGroup.members.find((m: any) => m.id === ev.payerId)?.name;
        const receiverName = selectedGroup.members.find((m: any) => m.id === ev.receiverId)?.name;
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
      selectedGroup.members.forEach((m: any) => {
        point[m.name] = Math.round(runningBalances[m.name] * 100) / 100;
      });
      chartPoints.push(point);
    });

    return chartPoints;
  };

  const chartData = generateChartData();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 text-slate-100">
        <div className="flex flex-col items-center gap-4">
          <RefreshCw className="h-10 w-10 animate-spin text-teal-400" />
          <p className="text-sm font-semibold tracking-wider text-slate-400">LOADING YOUR EXPENSE DASHBOARD...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 font-sans text-slate-100">
      {/* Top Navbar */}
      <header className="sticky top-0 z-40 border-b border-slate-800 bg-slate-950/80 backdrop-blur-md px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="rounded-lg bg-teal-500/10 p-2 border border-teal-500/20">
            <DollarSign className="h-6 w-6 text-teal-400" />
          </span>
          <h1 className="bg-gradient-to-r from-teal-400 to-cyan-400 bg-clip-text text-xl font-extrabold text-transparent">
            Expense Tracker
          </h1>
        </div>

        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-sm font-semibold text-slate-300">Hello, {currentUser?.name}</span>
          </div>

          <button 
            onClick={handleLogout}
            className="flex items-center gap-2 text-slate-400 hover:text-red-400 text-sm font-semibold transition cursor-pointer"
          >
            <LogOut className="h-4 w-4" />
            Sign Out
          </button>
        </div>
      </header>

      {/* Main Workspace Layout */}
      <main className="max-w-7xl mx-auto px-6 py-8 grid grid-cols-1 lg:grid-cols-4 gap-8">
        
        {/* Left Column: Group Sidebar */}
        <section className="lg:col-span-1 space-y-6">
          <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-5 backdrop-blur-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-bold tracking-widest text-slate-400 uppercase">My Groups</h2>
              <button 
                onClick={() => setIsCreateGroupOpen(true)}
                className="rounded-lg bg-teal-500/10 hover:bg-teal-500/20 p-1.5 border border-teal-500/20 transition cursor-pointer"
                title="Create Group"
              >
                <Plus className="h-4 w-4 text-teal-400" />
              </button>
            </div>

            <div className="space-y-2">
              {groups.map(g => (
                <button
                  key={g.id}
                  onClick={() => setSelectedGroup(g)}
                  className={`w-full text-left px-4 py-3 rounded-lg border text-sm font-semibold flex items-center justify-between transition cursor-pointer ${
                    selectedGroup?.id === g.id
                      ? 'bg-teal-950/40 border-teal-500/60 text-teal-300'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                  }`}
                >
                  <span className="truncate">{g.name}</span>
                  <ChevronRight className={`h-4 w-4 transition ${selectedGroup?.id === g.id ? 'translate-x-1 text-teal-400' : 'text-slate-600'}`} />
                </button>
              ))}

              {groups.length === 0 && (
                <p className="text-xs text-slate-500 text-center py-4">No groups yet. Create one to begin!</p>
              )}
            </div>
          </div>

          {selectedGroup && (
            <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-5 backdrop-blur-sm space-y-4">
              <h3 className="text-xs font-bold tracking-widest text-slate-400 uppercase">Active Date Filters</h3>
              <p className="text-xs text-slate-500">Recalculate balances by selecting an active date window (e.g. Sam&apos;s arrival date to exclude previous electricity bills).</p>
              
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Start Date</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-1.5 text-xs text-slate-300 outline-none focus:border-teal-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">End Date</label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-1.5 text-xs text-slate-300 outline-none focus:border-teal-500"
                  />
                </div>
                {(startDate || endDate) && (
                  <button
                    onClick={() => { setStartDate(''); setEndDate(''); }}
                    className="w-full py-1.5 text-xs font-semibold rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition cursor-pointer"
                  >
                    Clear Filter
                  </button>
                )}
              </div>
            </div>
          )}
        </section>

        {/* Right Columns: Main Group Dashboard Tab Workspace */}
        <section className="lg:col-span-3 space-y-6">
          {selectedGroup ? (
            <>
              {/* Tabs Navigation */}
              <div className="flex border-b border-slate-800 space-x-6 text-sm font-semibold">
                {[
                  { id: 'balances', label: 'Balances Summary', icon: Users },
                  { id: 'expenses', label: 'Expenses List', icon: DollarSign },
                  { id: 'settlements', label: 'Settlements History', icon: Calendar },
                  { id: 'anomalies', label: `Anomalies review (${anomalies.filter(a => a.status === 'PENDING').length})`, icon: AlertTriangle },
                  { id: 'members', label: 'Manage Members', icon: User },
                ].map(t => (
                  <button
                    key={t.id}
                    onClick={() => setActiveTab(t.id)}
                    className={`pb-3 border-b-2 flex items-center gap-2 transition cursor-pointer ${
                      activeTab === t.id
                        ? 'border-teal-500 text-teal-400'
                        : 'border-transparent text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <t.icon className="h-4 w-4" />
                    <span>{t.label}</span>
                  </button>
                ))}
              </div>

              {/* Error messages */}
              {error && (
                <div className="rounded-lg bg-red-950/40 border border-red-800/60 px-4 py-3 text-sm text-red-400">
                  {error}
                </div>
              )}

              {/* TAB CONTENT: BALANCES SUMMARY */}
              {activeTab === 'balances' && balancesData && (
                <div className="space-y-6">
                  {/* Aisha's Simplified Debts card */}
                  <div className="rounded-xl border border-slate-800 bg-teal-950/10 p-6">
                    <h3 className="text-sm font-bold text-teal-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                      <CheckCircle className="h-4 w-4" />
                      Aisha&apos;s Simplified Reconciliation
                    </h3>
                    <p className="text-xs text-slate-400 mb-4">Minimum payments calculated using debt-minimization algorithms to clear all balances:</p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {balancesData.reconciliation.map((tx: any, idx: number) => (
                        <div key={idx} className="flex items-center justify-between bg-slate-900/60 rounded-lg p-4 border border-slate-800">
                          <div>
                            <span className="text-sm font-bold text-red-400">{tx.from}</span>
                            <span className="text-xs text-slate-400 mx-2">owes</span>
                            <span className="text-sm font-bold text-emerald-400">{tx.to}</span>
                          </div>
                          <div className="text-base font-black text-slate-100">
                            ₹{tx.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </div>
                        </div>
                      ))}

                      {balancesData.reconciliation.length === 0 && (
                        <p className="text-xs text-slate-500 py-2 col-span-2">All debts settled! No outstanding balances for this period.</p>
                      )}
                    </div>
                  </div>

                  {/* General Net Balance Table */}
                  <div className="rounded-xl border border-slate-800 bg-slate-900/40 overflow-hidden">
                    <div className="p-5 border-b border-slate-800 flex justify-between items-center">
                      <h3 className="text-sm font-bold text-slate-300 uppercase tracking-widest">Running Net Balances</h3>
                      <p className="text-xs text-slate-500">Click any row to view breakdown splits (Rohan&apos;s request)</p>
                    </div>

                    <table className="w-full text-left text-sm text-slate-400">
                      <thead className="bg-slate-950 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                        <tr>
                          <th className="px-6 py-3">Member Name</th>
                          <th className="px-6 py-3">Total Paid</th>
                          <th className="px-6 py-3">Total Owed</th>
                          <th className="px-6 py-3">Net Balance</th>
                          <th className="px-6 py-3 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800">
                        {balancesData.balances.map((b: any) => (
                          <tr 
                            key={b.userId}
                            onClick={() => fetchDrilldown(b.userId, b.name)}
                            className="hover:bg-slate-900/50 cursor-pointer transition"
                          >
                            <td className="px-6 py-4 text-slate-100 font-bold">{b.name}</td>
                            <td className="px-6 py-4 text-slate-300">₹{b.totalPaid.toLocaleString()}</td>
                            <td className="px-6 py-4 text-slate-300">₹{b.totalOwed.toLocaleString()}</td>
                            <td className={`px-6 py-4 font-bold ${b.netBalance >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                              {b.netBalance >= 0 ? '+' : ''}₹{b.netBalance.toLocaleString()}
                            </td>
                            <td className="px-6 py-4 text-right">
                              <button className="text-xs font-semibold text-teal-400 hover:underline">
                                Explain Balance
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Recharts Running Balance Line Chart */}
                  {chartData.length > 0 && (
                    <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-6 space-y-4">
                      <h3 className="text-sm font-bold text-slate-300 uppercase tracking-widest">Balance Timeline View</h3>
                      <p className="text-xs text-slate-500">Tracks member balances over time. Note flat lines showing Meera&apos;s departure (end of March) and Sam&apos;s arrival (mid-April).</p>
                      
                      <div className="h-72 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={chartData} margin={{ top: 10, right: 30, left: 10, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                            <XAxis dataKey="dateStr" stroke="#64748b" fontSize={11} />
                            <YAxis stroke="#64748b" fontSize={11} />
                            <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#f8fafc' }} />
                            <Legend />
                            {selectedGroup.members.map((m: any, idx: number) => {
                              const colors = ['#2dd4bf', '#38bdf8', '#818cf8', '#fb7185', '#34d399', '#fbbf24'];
                              return (
                                <Line
                                  key={m.id}
                                  type="monotone"
                                  dataKey={m.name}
                                  stroke={colors[idx % colors.length]}
                                  strokeWidth={2}
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

              {/* TAB CONTENT: EXPENSES LIST */}
              {activeTab === 'expenses' && (
                <div className="space-y-6">
                  {/* CSV Import Panel */}
                  <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="space-y-1">
                      <h3 className="text-sm font-bold text-slate-300 uppercase tracking-widest flex items-center gap-2">
                        <Upload className="h-4 w-4" />
                        Import spreadsheet CSV
                      </h3>
                      <p className="text-xs text-slate-500">Upload Expenses Export.csv directly. Valid items are saved; anomalies are parked for review.</p>
                    </div>

                    <form onSubmit={handleCsvImport} className="flex items-center gap-4">
                      <input
                        type="file"
                        accept=".csv"
                        required
                        onChange={(e) => setCsvFile(e.target.files?.[0] || null)}
                        className="text-xs text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-teal-500/10 file:text-teal-400 hover:file:bg-teal-500/20 file:cursor-pointer"
                      />
                      <button
                        type="submit"
                        disabled={importLoading || !csvFile}
                        className="cursor-pointer flex items-center gap-2 bg-teal-500 hover:bg-teal-400 text-slate-950 text-xs font-bold py-2 px-4 rounded-lg transition disabled:opacity-50"
                      >
                        {importLoading ? 'Processing...' : 'Upload & Parse'}
                      </button>
                    </form>
                  </div>

                  {/* Interactive CSV Import Report (Niche 1) */}
                  {importReport && (
                    <div className="rounded-xl border border-slate-800 bg-teal-950/10 p-6 space-y-4">
                      <div className="flex justify-between items-center">
                        <h4 className="text-sm font-bold text-teal-400 uppercase tracking-widest flex items-center gap-2">
                          <FileText className="h-4 w-4" />
                          Live CSV Import Report
                        </h4>
                        <button 
                          onClick={() => setImportReport(null)}
                          className="text-xs text-slate-500 hover:text-slate-300 cursor-pointer"
                        >
                          Clear Report
                        </button>
                      </div>

                      <div className="max-h-80 overflow-y-auto space-y-2 text-xs">
                        {importReport.map((rep, idx) => (
                          <div 
                            key={idx} 
                            className={`p-3 rounded-lg border flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                              rep.status === 'INSERTED' ? 'bg-slate-900/60 border-slate-800' :
                              rep.status === 'SETTLEMENT' ? 'bg-emerald-950/20 border-emerald-800/40 text-emerald-300' :
                              'bg-amber-950/20 border-amber-800/40 text-amber-300'
                            }`}
                          >
                            <div className="space-y-1">
                              <span className="font-mono bg-slate-950 px-1.5 py-0.5 rounded border border-slate-800 mr-2 text-slate-400">Row {rep.rowNumber}</span>
                              <span className="font-bold">{rep.description}</span>
                              <p className="text-[10px] text-slate-400 mt-1">{rep.details}</p>
                            </div>
                            
                            <div className="flex items-center gap-4">
                              <div className="flex flex-col items-end gap-1">
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                  rep.status === 'INSERTED' ? 'bg-slate-800 text-slate-400' :
                                  rep.status === 'SETTLEMENT' ? 'bg-emerald-500/20 text-emerald-400' :
                                  'bg-amber-500/20 text-amber-400'
                                }`}>
                                  {rep.status}
                                </span>
                                
                                {rep.anomalies.map((a: any, aIdx: number) => (
                                  <span key={aIdx} className="text-[10px] text-red-400 italic">
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

                  {/* Manual Expense List Panel */}
                  <div className="rounded-xl border border-slate-800 bg-slate-900/40 overflow-hidden">
                    <div className="p-5 border-b border-slate-800 flex justify-between items-center">
                      <h3 className="text-sm font-bold text-slate-300 uppercase tracking-widest">Group Expenses</h3>
                      
                      <button
                        onClick={() => {
                          setExpenseDate(new Date().toISOString().slice(0, 10));
                          setExpensePayer(selectedGroup.members[0]?.id || '');
                          setIsAddExpenseOpen(true);
                        }}
                        className="cursor-pointer flex items-center gap-1 bg-teal-500 hover:bg-teal-400 text-slate-950 text-xs font-bold py-2 px-4 rounded-lg transition"
                      >
                        <Plus className="h-4.5 w-4.5" />
                        Add Expense
                      </button>
                    </div>

                    <table className="w-full text-left text-sm text-slate-400">
                      <thead className="bg-slate-950 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                        <tr>
                          <th className="px-6 py-3">Date</th>
                          <th className="px-6 py-3">Description</th>
                          <th className="px-6 py-3">Payer</th>
                          <th className="px-6 py-3">Amount</th>
                          <th className="px-6 py-3">Splits Detail</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800">
                        {expenses.map((e) => (
                          <tr key={e.id} className="hover:bg-slate-900/20 transition">
                            <td className="px-6 py-4 whitespace-nowrap text-slate-300">
                              {new Date(e.date).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                            </td>
                            <td className="px-6 py-4 text-slate-100 font-bold">{e.description}</td>
                            <td className="px-6 py-4 text-slate-300">{e.payerName}</td>
                            <td className="px-6 py-4 font-bold text-slate-100">
                              ₹{e.convertedAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                              {e.currency !== 'INR' && (
                                <span className="block text-[10px] text-teal-400 font-semibold mt-0.5" title="Priya's currency check">
                                  Original: {e.amount} {e.currency} (Rate: ₹{e.exchangeRate}/$)
                                </span>
                              )}
                            </td>
                            <td className="px-6 py-4 text-xs text-slate-400">
                              <div className="flex flex-wrap gap-2">
                                {e.splits.map((s: any, idx: number) => (
                                  <span key={idx} className="bg-slate-950 px-2 py-0.5 rounded border border-slate-800 text-[10px] font-mono">
                                    {s.name}: ₹{s.amount.toFixed(0)}
                                  </span>
                                ))}
                              </div>
                            </td>
                          </tr>
                        ))}

                        {expenses.length === 0 && (
                          <tr>
                            <td colSpan={5} className="text-center py-8 text-xs text-slate-500">No expenses recorded for this group.</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* TAB CONTENT: SETTLEMENTS */}
              {activeTab === 'settlements' && (
                <div className="rounded-xl border border-slate-800 bg-slate-900/40 overflow-hidden">
                  <div className="p-5 border-b border-slate-800 flex justify-between items-center">
                    <h3 className="text-sm font-bold text-slate-300 uppercase tracking-widest">Reconciliation Settlements</h3>
                    <button
                      onClick={() => {
                        setSettleDate(new Date().toISOString().slice(0, 10));
                        setSettlePayer(selectedGroup.members[0]?.id || '');
                        setSettleReceiver(selectedGroup.members[1]?.id || '');
                        setIsRecordSettlementOpen(true);
                      }}
                      className="cursor-pointer flex items-center gap-1 bg-teal-500 hover:bg-teal-400 text-slate-950 text-xs font-bold py-2 px-4 rounded-lg transition"
                    >
                      <Plus className="h-4.5 w-4.5" />
                      Record Settlement
                    </button>
                  </div>

                  <table className="w-full text-left text-sm text-slate-400">
                    <thead className="bg-slate-950 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                      <tr>
                        <th className="px-6 py-3">Date</th>
                        <th className="px-6 py-3">Payer (Who Paid)</th>
                        <th className="px-6 py-3">Receiver (Who Received)</th>
                        <th className="px-6 py-3">Settled Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                      {settlements.map((s) => (
                        <tr key={s.id} className="hover:bg-slate-900/20 transition">
                          <td className="px-6 py-4 text-slate-300">
                            {new Date(s.date).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                          </td>
                          <td className="px-6 py-4 text-red-400 font-bold">{s.payerName}</td>
                          <td className="px-6 py-4 text-emerald-400 font-bold">{s.receiverName}</td>
                          <td className="px-6 py-4 text-slate-100 font-black">
                            ₹{s.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </td>
                        </tr>
                      ))}

                      {settlements.length === 0 && (
                        <tr>
                          <td colSpan={4} className="text-center py-8 text-xs text-slate-500">No settlement transfers recorded yet.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}

              {/* TAB CONTENT: ANOMALIES REVIEW QUEUE */}
              {activeTab === 'anomalies' && (
                <div className="space-y-6">
                  <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-6 space-y-2">
                    <h3 className="text-sm font-bold text-slate-300 uppercase tracking-widest flex items-center gap-2">
                      <AlertTriangle className="h-5 w-5 text-amber-500" />
                      Meera&apos;s Review Queue
                    </h3>
                    <p className="text-xs text-slate-400">Meera requested full deletion and modification oversight. Any CSV row containing missing data, inconsistent split calculations, duplicates, or time-travel membership date conflicts is parked here. Approving inserts the row into active bookkeeping; rejecting soft-deletes the row.</p>
                  </div>

                  <div className="rounded-xl border border-slate-800 bg-slate-900/40 overflow-hidden">
                    <table className="w-full text-left text-sm text-slate-400">
                      <thead className="bg-slate-950 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                        <tr>
                          <th className="px-6 py-3">File / Row</th>
                          <th className="px-6 py-3">Anomaly Type</th>
                          <th className="px-6 py-3">Flagged Issues</th>
                          <th className="px-6 py-3">Status</th>
                          <th className="px-6 py-3 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800 text-xs">
                        {anomalies.map((anom) => (
                          <tr key={anom.id} className="hover:bg-slate-900/20 transition">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className="block text-slate-200 font-bold">{anom.session.fileName}</span>
                              <span className="text-[10px] text-slate-500">Row {anom.rowNumber}</span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className="font-mono bg-amber-950/20 text-amber-400 border border-amber-800/30 px-2 py-0.5 rounded-full">
                                {anom.anomalyType}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-slate-300 font-medium max-w-xs leading-5">
                              {anom.description}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`font-bold px-2 py-0.5 rounded ${
                                anom.status === 'PENDING' ? 'bg-amber-500/20 text-amber-400' :
                                anom.status === 'APPROVED' ? 'bg-emerald-500/20 text-emerald-400' :
                                'bg-red-500/20 text-red-400'
                              }`}>
                                {anom.status}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-right whitespace-nowrap space-x-2">
                              {anom.status === 'PENDING' ? (
                                <>
                                  <button
                                    onClick={() => openOverrideForm(anom)}
                                    className="cursor-pointer bg-teal-500 hover:bg-teal-400 text-slate-950 text-[10px] font-bold py-1 px-3 rounded transition"
                                  >
                                    Approve / Resolve
                                  </button>
                                  <button
                                    onClick={() => handleResolveAnomaly(anom.id, 'REJECT')}
                                    className="cursor-pointer bg-red-950 hover:bg-red-900 text-red-400 border border-red-800/40 text-[10px] font-bold py-1 px-3 rounded transition"
                                  >
                                    Reject
                                  </button>
                                </>
                              ) : (
                                <span className="text-slate-500 italic">Resolved</span>
                              )}
                            </td>
                          </tr>
                        ))}

                        {anomalies.length === 0 && (
                          <tr>
                            <td colSpan={5} className="text-center py-8 text-xs text-slate-500">No anomalies found in database. Upload a CSV containing messy rows to populate.</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* TAB CONTENT: MANAGE MEMBERS */}
              {activeTab === 'members' && (
                <div className="space-y-6">
                  {/* Active Members Grid */}
                  <div className="rounded-xl border border-slate-800 bg-slate-900/40 overflow-hidden">
                    <div className="p-5 border-b border-slate-800 flex justify-between items-center">
                      <h3 className="text-sm font-bold text-slate-300 uppercase tracking-widest">Time-Travel Group Memberships</h3>
                      <button
                        onClick={() => setIsAddMemberOpen(true)}
                        className="cursor-pointer flex items-center gap-1 bg-teal-500 hover:bg-teal-400 text-slate-950 text-xs font-bold py-2 px-4 rounded-lg transition"
                      >
                        <Plus className="h-4.5 w-4.5" />
                        Invite Member
                      </button>
                    </div>

                    <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                      {selectedGroup.members.map((m: any) => (
                        <div key={m.id} className="rounded-xl border border-slate-800 bg-slate-950 p-5 space-y-4 flex flex-col justify-between">
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <span className="rounded-full bg-slate-850 p-1.5 border border-slate-850">
                                <User className="h-5 w-5 text-teal-400" />
                              </span>
                              <h4 className="text-base font-bold text-slate-200">{m.name}</h4>
                            </div>
                            
                            <div className="space-y-1 text-xs text-slate-400">
                              <div className="flex items-center gap-2">
                                <span className="font-semibold text-slate-500">Joined:</span>
                                <span>{new Date(m.joinedAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="font-semibold text-slate-500">Status:</span>
                                {m.leftAt ? (
                                  <span className="text-red-400 font-semibold">Left on {new Date(m.leftAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}</span>
                                ) : (
                                  <span className="text-emerald-400 font-semibold flex items-center gap-1">
                                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                                    Active
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          {!m.leftAt && (
                            <div className="pt-2 border-t border-slate-900/60 flex items-center gap-2">
                              <input
                                type="date"
                                id={`left-date-${m.id}`}
                                className="rounded bg-slate-900 border border-slate-850 px-2.5 py-1 text-xs outline-none focus:border-teal-500 text-slate-300"
                              />
                              <button
                                onClick={() => {
                                  const dateInput = document.getElementById(`left-date-${m.id}`) as HTMLInputElement;
                                  if (dateInput?.value) {
                                    handleRecordDeparture(m.id, dateInput.value);
                                  } else {
                                    alert('Select a departure date');
                                  }
                                }}
                                className="cursor-pointer bg-red-950 hover:bg-red-900 text-red-400 border border-red-800/40 text-[10px] font-bold py-1 px-3 rounded transition"
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
            <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-12 text-center space-y-4">
              <span className="rounded-full bg-slate-850 p-4 border border-slate-850 inline-block">
                <Users className="h-8 w-8 text-teal-400" />
              </span>
              <h3 className="text-lg font-bold text-slate-300">Select or Create a Group</h3>
              <p className="text-sm text-slate-500 max-w-sm mx-auto">Create an expense sharing group for your flatmates or select an existing group to view balances, imports, and logs.</p>
              
              <button 
                onClick={() => setIsCreateGroupOpen(true)}
                className="cursor-pointer inline-flex items-center gap-1 bg-teal-500 hover:bg-teal-400 text-slate-950 text-sm font-bold py-2.5 px-6 rounded-lg transition"
              >
                <Plus className="h-4.5 w-4.5" />
                Create Group
              </button>
            </div>
          )}
        </section>
      </main>

      {/* MODAL: CREATE GROUP */}
      {isCreateGroupOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-slate-200">Create New Sharing Group</h3>
            <form onSubmit={handleCreateGroup} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-400 mb-1.5">Group Name</label>
                <input
                  type="text"
                  required
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                  placeholder="e.g. Goa Trip, Flat 402"
                  className="block w-full rounded-lg border border-slate-800 bg-slate-950 px-4 py-2 text-slate-100 placeholder-slate-500 outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCreateGroupOpen(false)}
                  className="px-4 py-2 text-sm font-semibold rounded-lg bg-slate-850 hover:bg-slate-800 text-slate-300 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-semibold rounded-lg bg-teal-500 hover:bg-teal-400 text-slate-950 cursor-pointer"
                >
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: INVITE MEMBER */}
      {isAddMemberOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-slate-200">Invite Flatmate to {selectedGroup?.name}</h3>
            
            <form onSubmit={handleAddMember} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-400 mb-1.5">Flatmate Username</label>
                <input
                  type="text"
                  required
                  value={newMemberName}
                  onChange={(e) => setNewMemberName(e.target.value)}
                  placeholder="e.g. Sam"
                  className="block w-full rounded-lg border border-slate-800 bg-slate-950 px-4 py-2 text-slate-100 placeholder-slate-500 outline-none focus:border-teal-500 transition"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-400 mb-1.5">Join Date</label>
                <input
                  type="date"
                  required
                  value={newMemberJoinDate}
                  onChange={(e) => setNewMemberJoinDate(e.target.value)}
                  className="block w-full rounded-lg border border-slate-800 bg-slate-950 px-4 py-2 text-slate-100 outline-none focus:border-teal-500 transition"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddMemberOpen(false)}
                  className="px-4 py-2 text-sm font-semibold rounded-lg bg-slate-850 hover:bg-slate-800 text-slate-300 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-semibold rounded-lg bg-teal-500 hover:bg-teal-400 text-slate-950 cursor-pointer"
                >
                  Invite
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: EXPLAIN BALANCE DRILLDOWN (Rohan's Ask) */}
      {drilldownUser && drilldownData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-3xl rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl space-y-6 max-h-[85vh] overflow-y-auto">
            <div className="flex justify-between items-start border-b border-slate-800 pb-4">
              <div>
                <h3 className="text-lg font-bold text-slate-200">Balance Breakdown: {drilldownUser.name}</h3>
                <p className="text-xs text-slate-500 mt-1">Audit log of all individual splits and settlements making up the net balance (No magic numbers!)</p>
              </div>
              <button 
                onClick={() => { setDrilldownUser(null); setDrilldownData(null); }}
                className="text-xs text-slate-400 hover:text-slate-200 font-semibold cursor-pointer"
              >
                Close
              </button>
            </div>

            {/* Aggregated Totals summary equation */}
            <div className="bg-slate-950 rounded-xl p-5 border border-slate-800 flex justify-between items-center text-center">
              <div>
                <span className="text-[10px] text-slate-500 uppercase font-semibold block mb-1">Expenses Paid</span>
                <span className="text-sm font-bold text-slate-300">₹{drilldownData.summary.totalPaid.toLocaleString()}</span>
              </div>
              <span className="text-slate-600 font-bold">+</span>
              <div>
                <span className="text-[10px] text-slate-500 uppercase font-semibold block mb-1">Settlements Paid</span>
                <span className="text-sm font-bold text-slate-300">₹{drilldownData.summary.settlementsPaid.toLocaleString()}</span>
              </div>
              <span className="text-slate-600 font-bold">-</span>
              <div>
                <span className="text-[10px] text-slate-500 uppercase font-semibold block mb-1">Expenses Owed</span>
                <span className="text-sm font-bold text-slate-300">₹{drilldownData.summary.totalOwed.toLocaleString()}</span>
              </div>
              <span className="text-slate-600 font-bold">-</span>
              <div>
                <span className="text-[10px] text-slate-500 uppercase font-semibold block mb-1">Settlements Received</span>
                <span className="text-sm font-bold text-slate-300">₹{drilldownData.summary.settlementsReceived.toLocaleString()}</span>
              </div>
              <span className="text-slate-600 font-bold">=</span>
              <div>
                <span className="text-[10px] text-slate-500 uppercase font-semibold block mb-1">Net Balance</span>
                <span className={`text-base font-black ${drilldownData.summary.netBalance >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                  ₹{drilldownData.summary.netBalance.toLocaleString()}
                </span>
              </div>
            </div>

            {/* List of Splits */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Owed Expense Splits</h4>
              <div className="max-h-56 overflow-y-auto space-y-2 text-xs">
                {drilldownData.splits.map((s: any, idx: number) => (
                  <div key={idx} className="bg-slate-950/60 rounded-lg p-3 border border-slate-800 flex justify-between items-center">
                    <div>
                      <p className="font-bold text-slate-200">{s.description}</p>
                      <span className="text-[10px] text-slate-500">
                        {new Date(s.date).toLocaleDateString()} • Paid by {s.payerName} • Type: {s.splitType}
                      </span>
                      {s.currency !== 'INR' && (
                        <span className="block text-[10px] text-teal-400 font-semibold mt-1">
                          Priya&apos;s Currency Transparency: Original Amount {s.originalAmount} {s.currency} @ ₹{s.exchangeRate}/$
                        </span>
                      )}
                    </div>
                    <div className="text-right">
                      <span className="font-bold text-red-400">-₹{s.yourShare.toFixed(2)}</span>
                    </div>
                  </div>
                ))}

                {drilldownData.splits.length === 0 && (
                  <p className="text-[11px] text-slate-500 italic py-2">No owed splits recorded.</p>
                )}
              </div>
            </div>

            {/* List of Paid Expenses */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Expenses You Paid</h4>
              <div className="max-h-56 overflow-y-auto space-y-2 text-xs">
                {drilldownData.paidExpenses.map((e: any, idx: number) => (
                  <div key={idx} className="bg-slate-950/60 rounded-lg p-3 border border-slate-800 flex justify-between items-center">
                    <div>
                      <p className="font-bold text-slate-200">{e.description}</p>
                      <span className="text-[10px] text-slate-500">
                        {new Date(e.date).toLocaleDateString()} • Splits: {e.splits.map((sp: any) => `${sp.name} (₹${sp.amount.toFixed(0)})`).join(', ')}
                      </span>
                      {e.currency !== 'INR' && (
                        <span className="block text-[10px] text-teal-400 font-semibold mt-1">
                          Converted original {e.originalAmount} {e.currency} using exchange rate ₹{e.exchangeRate}/$
                        </span>
                      )}
                    </div>
                    <div className="text-right">
                      <span className="font-bold text-emerald-400">+₹{e.convertedAmount.toFixed(2)}</span>
                    </div>
                  </div>
                ))}

                {drilldownData.paidExpenses.length === 0 && (
                  <p className="text-[11px] text-slate-500 italic py-2">No paid expenses recorded.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: ADD EXPENSE */}
      {isAddExpenseOpen && selectedGroup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold text-slate-200">Record Manual Expense</h3>
            
            <form onSubmit={handleManualExpense} className="space-y-4 text-sm">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Description</label>
                  <input
                    type="text"
                    required
                    value={expenseDesc}
                    onChange={(e) => setExpenseDesc(e.target.value)}
                    placeholder="e.g. March electricity"
                    className="block w-full rounded-lg border border-slate-800 bg-slate-950 px-4 py-2 text-slate-100 outline-none focus:border-teal-500 transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Amount</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={expenseAmount}
                    onChange={(e) => setExpenseAmount(e.target.value)}
                    placeholder="0.00"
                    className="block w-full rounded-lg border border-slate-800 bg-slate-950 px-4 py-2 text-slate-100 outline-none focus:border-teal-500 transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Currency</label>
                  <select
                    value={expenseCurrency}
                    onChange={(e) => setExpenseCurrency(e.target.value)}
                    className="block w-full rounded-lg border border-slate-800 bg-slate-950 px-4 py-2 text-slate-100 outline-none focus:border-teal-500 transition"
                  >
                    <option value="INR">INR (₹)</option>
                    <option value="USD">USD ($)</option>
                  </select>
                </div>

                {expenseCurrency === 'USD' && (
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1">USD Exchange Rate (INR per $)</label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={expenseRate}
                      onChange={(e) => setExpenseRate(e.target.value)}
                      placeholder="83.4"
                      className="block w-full rounded-lg border border-slate-800 bg-slate-950 px-4 py-2 text-slate-100 outline-none focus:border-teal-500 transition"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Date</label>
                  <input
                    type="date"
                    required
                    value={expenseDate}
                    onChange={(e) => setExpenseDate(e.target.value)}
                    className="block w-full rounded-lg border border-slate-800 bg-slate-950 px-4 py-2 text-slate-100 outline-none focus:border-teal-500 transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Paid By (Payer)</label>
                  <select
                    value={expensePayer}
                    onChange={(e) => setExpensePayer(e.target.value)}
                    className="block w-full rounded-lg border border-slate-800 bg-slate-950 px-4 py-2 text-slate-100 outline-none focus:border-teal-500 transition"
                  >
                    {selectedGroup.members.map((m: any) => (
                      <option key={m.id} value={m.id}>{m.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Split Type</label>
                  <select
                    value={expenseSplitType}
                    onChange={(e) => setExpenseSplitType(e.target.value)}
                    className="block w-full rounded-lg border border-slate-800 bg-slate-950 px-4 py-2 text-slate-100 outline-none focus:border-teal-500 transition"
                  >
                    <option value="EQUAL">Split Equally</option>
                    <option value="UNEQUAL">Custom Share Split (Exact)</option>
                  </select>
                </div>
              </div>

              {expenseSplitType === 'UNEQUAL' && (
                <div className="bg-slate-950 p-4 rounded-lg border border-slate-800 space-y-3">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Specify Split Shares (₹ in Converted INR)</h4>
                  <div className="grid grid-cols-2 gap-3">
                    {selectedGroup.members.map((m: any) => (
                      <div key={m.id} className="flex items-center justify-between gap-2">
                        <span className="text-xs text-slate-300">{m.name}</span>
                        <input
                          type="number"
                          step="0.01"
                          placeholder="0.00"
                          value={expenseSplitDetails[m.id] || ''}
                          onChange={(e) => setExpenseSplitDetails({
                            ...expenseSplitDetails,
                            [m.id]: e.target.value
                          })}
                          className="w-24 text-right rounded border border-slate-800 bg-slate-900 px-2 py-1 text-xs text-slate-100 outline-none focus:border-teal-500"
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
                  className="px-4 py-2 text-sm font-semibold rounded-lg bg-slate-850 hover:bg-slate-800 text-slate-300 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-semibold rounded-lg bg-teal-500 hover:bg-teal-400 text-slate-950 cursor-pointer"
                >
                  Save Expense
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: RECORD SETTLEMENT */}
      {isRecordSettlementOpen && selectedGroup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-slate-200">Record Settlement Transfer</h3>
            
            <form onSubmit={handleManualSettlement} className="space-y-4 text-sm">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">From Payer (Who paid)</label>
                <select
                  value={settlePayer}
                  onChange={(e) => setSettlePayer(e.target.value)}
                  className="block w-full rounded-lg border border-slate-800 bg-slate-950 px-4 py-2 text-slate-100 outline-none focus:border-teal-500 transition"
                >
                  {selectedGroup.members.map((m: any) => (
                    <option key={m.id} value={m.id}>{m.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">To Receiver (Who got paid)</label>
                <select
                  value={settleReceiver}
                  onChange={(e) => setSettleReceiver(e.target.value)}
                  className="block w-full rounded-lg border border-slate-800 bg-slate-950 px-4 py-2 text-slate-100 outline-none focus:border-teal-500 transition"
                >
                  {selectedGroup.members.map((m: any) => (
                    <option key={m.id} value={m.id}>{m.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Amount (₹ in INR)</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={settleAmount}
                  onChange={(e) => setSettleAmount(e.target.value)}
                  placeholder="0.00"
                  className="block w-full rounded-lg border border-slate-800 bg-slate-950 px-4 py-2 text-slate-100 outline-none focus:border-teal-500 transition"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Date</label>
                <input
                  type="date"
                  required
                  value={settleDate}
                  onChange={(e) => setSettleDate(e.target.value)}
                  className="block w-full rounded-lg border border-slate-800 bg-slate-950 px-4 py-2 text-slate-100 outline-none focus:border-teal-500 transition"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsRecordSettlementOpen(false)}
                  className="px-4 py-2 text-sm font-semibold rounded-lg bg-slate-850 hover:bg-slate-800 text-slate-300 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-semibold rounded-lg bg-teal-500 hover:bg-teal-400 text-slate-950 cursor-pointer"
                >
                  Save Settlement
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: OVERRIDE ANOMALY (Meera's Screen inline resolve) */}
      {editingAnomaly && selectedGroup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold text-slate-200">Resolve Row Anomaly</h3>
            <p className="text-xs text-slate-500">Edit the parsed values of this anomaly row to make it valid, and click Approve to save it into the bookkeeper.</p>

            <div className="bg-slate-950 p-4 rounded-lg border border-slate-800 text-[11px] space-y-1 font-mono">
              <p className="text-slate-400 font-bold">Flagged Reason:</p>
              <p className="text-red-400 font-medium">{editingAnomaly.description}</p>
            </div>

            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-semibold text-slate-400 mb-1">Description</label>
                  <input
                    type="text"
                    value={overrideForm.description || ''}
                    onChange={(e) => setOverrideForm({ ...overrideForm, description: e.target.value })}
                    className="block w-full rounded border border-slate-800 bg-slate-950 px-3 py-1.5 text-slate-100"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-slate-400 mb-1">Amount</label>
                  <input
                    type="text"
                    value={overrideForm.amount || ''}
                    onChange={(e) => setOverrideForm({ ...overrideForm, amount: e.target.value })}
                    className="block w-full rounded border border-slate-800 bg-slate-950 px-3 py-1.5 text-slate-100 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-slate-400 mb-1">Currency</label>
                  <input
                    type="text"
                    value={overrideForm.currency || ''}
                    onChange={(e) => setOverrideForm({ ...overrideForm, currency: e.target.value })}
                    className="block w-full rounded border border-slate-800 bg-slate-950 px-3 py-1.5 text-slate-100 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-slate-400 mb-1">Date</label>
                  <input
                    type="text"
                    value={overrideForm.date || ''}
                    onChange={(e) => setOverrideForm({ ...overrideForm, date: e.target.value })}
                    className="block w-full rounded border border-slate-800 bg-slate-950 px-3 py-1.5 text-slate-100 font-mono"
                    placeholder="DD-MM-YYYY"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-slate-400 mb-1">Paid By (Payer)</label>
                  <input
                    type="text"
                    value={overrideForm.paid_by || ''}
                    onChange={(e) => setOverrideForm({ ...overrideForm, paid_by: e.target.value })}
                    className="block w-full rounded border border-slate-800 bg-slate-950 px-3 py-1.5 text-slate-100"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-slate-400 mb-1">Split Type</label>
                  <input
                    type="text"
                    value={overrideForm.split_type || ''}
                    onChange={(e) => setOverrideForm({ ...overrideForm, split_type: e.target.value })}
                    className="block w-full rounded border border-slate-800 bg-slate-950 px-3 py-1.5 text-slate-100"
                    placeholder="equal, percentage, share"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-[10px] font-semibold text-slate-400 mb-1">Split With (Separated by semicolons)</label>
                  <input
                    type="text"
                    value={overrideForm.split_with || ''}
                    onChange={(e) => setOverrideForm({ ...overrideForm, split_with: e.target.value })}
                    className="block w-full rounded border border-slate-800 bg-slate-950 px-3 py-1.5 text-slate-100"
                    placeholder="Aisha;Rohan;Priya"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-[10px] font-semibold text-slate-400 mb-1">Split Details (Percentages/Ratios/Unequal Splits)</label>
                  <input
                    type="text"
                    value={overrideForm.split_details || ''}
                    onChange={(e) => setOverrideForm({ ...overrideForm, split_details: e.target.value })}
                    className="block w-full rounded border border-slate-800 bg-slate-950 px-3 py-1.5 text-slate-100"
                    placeholder="Aisha 30; Rohan 30..."
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingAnomaly(null)}
                  className="px-4 py-2 text-xs font-semibold rounded-lg bg-slate-850 hover:bg-slate-800 text-slate-300 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => handleResolveAnomaly(editingAnomaly.id, 'APPROVE')}
                  className="px-4 py-2 text-xs font-semibold rounded-lg bg-teal-500 hover:bg-teal-400 text-slate-950 cursor-pointer"
                >
                  Approve & Insert
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
