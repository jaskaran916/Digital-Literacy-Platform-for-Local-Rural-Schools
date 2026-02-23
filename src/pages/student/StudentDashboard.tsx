import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, User } from '../../db/db';
import { Shield, Code, Star, LogOut, Award } from 'lucide-react';

export default function StudentDashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const modules = useLiveQuery(() => db.modules.toArray());
  const progress = useLiveQuery(() => db.userProgress.where('user_id').equals(user?.id || 0).toArray(), [user]);

  useEffect(() => {
    const userId = localStorage.getItem('currentUserId');
    if (!userId) {
      navigate('/student');
      return;
    }
    db.users.get(parseInt(userId)).then(u => {
      if (u) setUser(u);
      else navigate('/student');
    });
  }, [navigate]);

  if (!user) return null;

  const handleLogout = () => {
    localStorage.removeItem('currentUserId');
    navigate('/student');
  };

  const calculateProgress = (moduleId: string) => {
    const p = progress?.find(p => p.module_id === moduleId);
    return p?.status === 'done' ? 100 : p?.status === 'in-progress' ? 50 : 0;
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Profile Widget */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-6">
            <div className="relative">
              <img src={user.avatar} alt={user.name} className="w-24 h-24 rounded-full bg-slate-100 border-4 border-white shadow-md" />
              <div className="absolute -bottom-2 -right-2 bg-amber-400 text-amber-900 font-bold w-10 h-10 rounded-full flex items-center justify-center border-4 border-white shadow-sm">
                {user.level}
              </div>
            </div>
            <div>
              <h1 className="text-3xl font-bold text-slate-800">Hi, {user.name}!</h1>
              <div className="flex items-center gap-2 mt-2 text-emerald-600 font-medium">
                <Star size={20} className="fill-emerald-500" />
                <span>{user.xp} XP</span>
              </div>
            </div>
          </div>
          
          <div className="flex gap-4">
            <button className="flex items-center gap-2 px-6 py-3 bg-indigo-50 text-indigo-700 font-semibold rounded-2xl hover:bg-indigo-100 transition-colors">
              <Award size={20} />
              Badges
            </button>
            <button onClick={handleLogout} className="flex items-center gap-2 px-6 py-3 bg-slate-100 text-slate-600 font-semibold rounded-2xl hover:bg-slate-200 transition-colors">
              <LogOut size={20} />
              Exit
            </button>
          </div>
        </div>

        {/* Module Grid */}
        <div>
          <h2 className="text-2xl font-bold text-slate-800 mb-6">Your Missions</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {modules?.map(mod => {
              const isCoding = mod.type === 'coding';
              const percent = calculateProgress(mod.id);
              
              return (
                <Link 
                  key={mod.id}
                  to={`/student/learn/${mod.id}`}
                  className="group relative bg-white rounded-3xl p-6 shadow-sm border border-slate-100 hover:shadow-md hover:border-emerald-200 transition-all flex flex-col"
                >
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-6 ${isCoding ? 'bg-blue-100 text-blue-600' : 'bg-rose-100 text-rose-600'}`}>
                    {isCoding ? <Code size={28} /> : <Shield size={28} />}
                  </div>
                  
                  <h3 className="text-xl font-bold text-slate-800 mb-2">{mod.title}</h3>
                  <p className="text-slate-500 flex-grow">{mod.description}</p>
                  
                  <div className="mt-6 pt-6 border-t border-slate-100">
                    <div className="flex justify-between text-sm font-medium mb-2">
                      <span className="text-slate-500">Progress</span>
                      <span className={percent === 100 ? 'text-emerald-500' : 'text-slate-700'}>{percent}%</span>
                    </div>
                    <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all duration-500 ${percent === 100 ? 'bg-emerald-500' : 'bg-indigo-500'}`}
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>

      </div>
    </div>
  );
}
