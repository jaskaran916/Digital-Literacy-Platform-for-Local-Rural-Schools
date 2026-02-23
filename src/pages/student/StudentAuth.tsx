import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db/db';
import { UserPlus, User as UserIcon } from 'lucide-react';

export default function StudentAuth() {
  const users = useLiveQuery(() => db.users.toArray());
  const navigate = useNavigate();
  const [isCreating, setIsCreating] = useState(false);
  const [newName, setNewName] = useState('');
  const [newPin, setNewPin] = useState('');

  const handleLogin = (userId: number) => {
    localStorage.setItem('currentUserId', userId.toString());
    navigate('/student/dashboard');
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName || !newPin) return;
    
    const id = await db.users.add({
      name: newName,
      pin: newPin,
      xp: 0,
      level: 1,
      avatar: `https://api.dicebear.com/7.x/bottts/svg?seed=${newName}`
    });
    
    handleLogin(id);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-4xl bg-white rounded-3xl shadow-sm border border-slate-100 p-8 md:p-12">
        <h1 className="text-3xl md:text-4xl font-bold text-slate-900 text-center mb-12">
          Who is playing today?
        </h1>

        {isCreating ? (
          <form onSubmit={handleCreate} className="max-w-md mx-auto space-y-6">
            <div>
              <label className="block text-lg font-medium text-slate-700 mb-2">Your Name</label>
              <input 
                type="text" 
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="w-full text-xl p-4 border-2 border-slate-200 rounded-2xl focus:border-emerald-500 focus:ring-emerald-500 outline-none transition-colors"
                placeholder="e.g. Alex"
                required
              />
            </div>
            <div>
              <label className="block text-lg font-medium text-slate-700 mb-2">Secret PIN (4 numbers)</label>
              <input 
                type="password" 
                maxLength={4}
                value={newPin}
                onChange={(e) => setNewPin(e.target.value.replace(/[^0-9]/g, ''))}
                className="w-full text-2xl tracking-widest text-center p-4 border-2 border-slate-200 rounded-2xl focus:border-emerald-500 focus:ring-emerald-500 outline-none transition-colors"
                placeholder="****"
                required
              />
            </div>
            <div className="flex gap-4 pt-4">
              <button 
                type="button"
                onClick={() => setIsCreating(false)}
                className="flex-1 py-4 text-lg font-medium text-slate-600 bg-slate-100 rounded-2xl hover:bg-slate-200 transition-colors"
              >
                Cancel
              </button>
              <button 
                type="submit"
                className="flex-1 py-4 text-lg font-medium text-white bg-emerald-500 rounded-2xl hover:bg-emerald-600 transition-colors"
              >
                Let's Go!
              </button>
            </div>
          </form>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {users?.map(user => (
              <button
                key={user.id}
                onClick={() => handleLogin(user.id!)}
                className="group flex flex-col items-center p-6 bg-slate-50 rounded-3xl hover:bg-emerald-50 hover:ring-2 ring-emerald-500 transition-all"
              >
                <img 
                  src={user.avatar} 
                  alt={user.name} 
                  className="w-24 h-24 rounded-full bg-white shadow-sm mb-4 group-hover:scale-110 transition-transform"
                />
                <span className="text-xl font-semibold text-slate-800">{user.name}</span>
                <span className="text-sm text-slate-500 mt-1">Level {user.level}</span>
              </button>
            ))}
            
            <button
              onClick={() => setIsCreating(true)}
              className="flex flex-col items-center justify-center p-6 bg-slate-50 border-2 border-dashed border-slate-300 rounded-3xl hover:bg-slate-100 hover:border-slate-400 transition-all min-h-[200px]"
            >
              <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center text-slate-400 mb-4 shadow-sm">
                <UserPlus size={32} />
              </div>
              <span className="text-xl font-semibold text-slate-600">New Player</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
