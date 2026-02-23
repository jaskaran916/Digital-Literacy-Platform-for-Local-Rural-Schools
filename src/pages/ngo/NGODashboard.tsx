import { useEffect, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db/db';
import { BarChart3, Users, Clock, Download, ArrowUpRight, CheckCircle2 } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function NGODashboard() {
  const users = useLiveQuery(() => db.users.toArray());
  const assessments = useLiveQuery(() => db.assessments.toArray());
  const modules = useLiveQuery(() => db.modules.toArray());
  const syncQueue = useLiveQuery(() => db.syncQueue.toArray());

  const [isSyncing, setIsSyncing] = useState(false);

  const handleSync = async () => {
    setIsSyncing(true);
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Mark all pending as synced
    const pending = await db.syncQueue.where('status').equals('pending').toArray();
    for (const item of pending) {
      await db.syncQueue.update(item.id!, { status: 'synced' });
    }
    
    setIsSyncing(false);
  };

  // Analytics Calculations
  const totalStudents = users?.length || 0;
  const totalXP = users?.reduce((acc, user) => acc + user.xp, 0) || 0;
  const pendingSyncs = syncQueue?.filter(q => q.status === 'pending').length || 0;

  // Impact Report Data
  const impactData = modules?.map(mod => {
    const modAssessments = assessments?.filter(a => a.module_id === mod.id && a.pre_score !== null && a.post_score !== null) || [];
    
    if (modAssessments.length === 0) return { ...mod, avgPre: 0, avgPost: 0, improvement: 0, completions: 0 };

    const avgPre = modAssessments.reduce((acc, a) => acc + (a.pre_score || 0), 0) / modAssessments.length;
    const avgPost = modAssessments.reduce((acc, a) => acc + (a.post_score || 0), 0) / modAssessments.length;
    
    return {
      ...mod,
      avgPre: Math.round(avgPre),
      avgPost: Math.round(avgPost),
      improvement: Math.round(avgPost - avgPre),
      completions: modAssessments.length
    };
  }).filter(d => d.completions > 0);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center text-indigo-600">
              <BarChart3 size={24} />
            </div>
            <h1 className="text-xl font-bold text-slate-900">NGO Impact Dashboard</h1>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-sm font-medium text-slate-500 bg-slate-100 px-3 py-1.5 rounded-full">
              <span className={`w-2 h-2 rounded-full ${navigator.onLine ? 'bg-emerald-500' : 'bg-rose-500'}`} />
              {navigator.onLine ? 'Online' : 'Offline'}
            </div>
            
            <button 
              onClick={handleSync}
              disabled={isSyncing || pendingSyncs === 0 || !navigator.onLine}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg transition-colors shadow-sm"
            >
              {isSyncing ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : pendingSyncs > 0 ? (
                <ArrowUpRight size={18} />
              ) : (
                <CheckCircle2 size={18} />
              )}
              {isSyncing ? 'Syncing...' : pendingSyncs > 0 ? `Sync ${pendingSyncs} Records` : 'Up to date'}
            </button>
            <Link to="/" className="text-sm font-medium text-slate-500 hover:text-slate-900 ml-4">
              Back to Home
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full space-y-8">
        
        {/* Top Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 flex items-center gap-4">
            <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center">
              <Users size={28} />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">Total Students</p>
              <p className="text-3xl font-bold text-slate-900">{totalStudents}</p>
            </div>
          </div>
          
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 flex items-center gap-4">
            <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center">
              <Clock size={28} />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">Total Learning XP</p>
              <p className="text-3xl font-bold text-slate-900">{totalXP}</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 flex items-center gap-4">
            <div className="w-14 h-14 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center">
              <CheckCircle2 size={28} />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">Modules Completed</p>
              <p className="text-3xl font-bold text-slate-900">
                {assessments?.filter(a => a.post_score !== null).length || 0}
              </p>
            </div>
          </div>
        </div>

        {/* Impact Report Section */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-6 border-b border-slate-200 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-slate-900">Impact Report</h2>
              <p className="text-sm text-slate-500 mt-1">Pre-test vs Post-test score comparison across modules.</p>
            </div>
            <button className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-medium rounded-lg transition-colors">
              <Download size={18} />
              Export PDF
            </button>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="p-4 font-semibold text-sm text-slate-600">Module Name</th>
                  <th className="p-4 font-semibold text-sm text-slate-600">Type</th>
                  <th className="p-4 font-semibold text-sm text-slate-600">Completions</th>
                  <th className="p-4 font-semibold text-sm text-slate-600">Avg Pre-Test</th>
                  <th className="p-4 font-semibold text-sm text-slate-600">Avg Post-Test</th>
                  <th className="p-4 font-semibold text-sm text-slate-600">Improvement</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {impactData && impactData.length > 0 ? (
                  impactData.map((row, i) => (
                    <tr key={i} className="hover:bg-slate-50 transition-colors">
                      <td className="p-4 font-medium text-slate-900">{row.title}</td>
                      <td className="p-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${
                          row.type === 'coding' ? 'bg-blue-100 text-blue-800' : 'bg-rose-100 text-rose-800'
                        }`}>
                          {row.type}
                        </span>
                      </td>
                      <td className="p-4 text-slate-600">{row.completions}</td>
                      <td className="p-4 text-slate-600">{row.avgPre}%</td>
                      <td className="p-4 font-medium text-slate-900">{row.avgPost}%</td>
                      <td className="p-4">
                        <div className="flex items-center gap-1 text-emerald-600 font-semibold bg-emerald-50 px-2 py-1 rounded-md w-fit">
                          <ArrowUpRight size={16} />
                          +{row.improvement}%
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-slate-500">
                      No completed assessments yet. Students need to finish a module to generate impact data.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

      </main>
    </div>
  );
}
