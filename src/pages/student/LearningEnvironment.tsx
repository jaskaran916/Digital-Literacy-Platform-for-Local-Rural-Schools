import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, Module, User } from '../../db/db';
import { ArrowLeft, Play, CheckCircle2, Video } from 'lucide-react';
import CanvasCodeEditor from '../../components/student/CanvasCodeEditor';
import QuizEngine from '../../components/student/QuizEngine';
import VideoTutorialModal from '../../components/student/VideoTutorialModal';

export default function LearningEnvironment() {
  const { moduleId } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [module, setModule] = useState<Module | null>(null);
  const [stage, setStage] = useState<'pre-test' | 'learning' | 'post-test' | 'completed'>('pre-test');
  const [isPlayingVideo, setIsPlayingVideo] = useState(false);
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);
  
  const assessment = useLiveQuery(() => 
    db.assessments.where({ user_id: user?.id || 0, module_id: moduleId || '' }).first(), 
  [user, moduleId]);

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

    if (moduleId) {
      db.modules.get(moduleId).then(m => {
        if (m) setModule(m);
      });
    }
  }, [navigate, moduleId]);

  useEffect(() => {
    if (assessment) {
      if (assessment.post_score !== null) {
        setStage('completed');
      } else if (assessment.pre_score !== null) {
        setStage('learning');
      }
    }
  }, [assessment]);

  if (!user || !module) return <div className="p-8 text-center">Loading...</div>;

  const handlePreTestComplete = async (score: number) => {
    await db.assessments.add({
      user_id: user.id!,
      module_id: module.id,
      pre_score: score,
      post_score: null
    });
    
    await db.userProgress.add({
      user_id: user.id!,
      module_id: module.id,
      status: 'in-progress'
    });
    
    setStage('learning');
  };

  const handleLearningComplete = () => {
    setStage('post-test');
  };

  const handlePostTestComplete = async (score: number) => {
    const record = await db.assessments.where({ user_id: user.id!, module_id: module.id }).first();
    if (record && record.id) {
      await db.assessments.update(record.id, { post_score: score });
    }
    
    const progressRecord = await db.userProgress.where({ user_id: user.id!, module_id: module.id }).first();
    if (progressRecord && progressRecord.id) {
      await db.userProgress.update(progressRecord.id, { status: 'done' });
    }

    // Award XP
    const xpGained = 100;
    const newXp = user.xp + xpGained;
    const newLevel = Math.floor(newXp / 100) + 1;
    
    await db.users.update(user.id!, { xp: newXp, level: newLevel });
    
    // Check and award badges
    const earnedBadges = await db.earnedBadges.where('user_id').equals(user.id!).toArray();
    const earnedBadgeIds = earnedBadges.map(b => b.badge_id);
    
    const newBadges: string[] = [];

    if (!earnedBadgeIds.includes('first_steps')) {
      newBadges.push('first_steps');
    }

    if (score === 100 && !earnedBadgeIds.includes('perfect_score')) {
      newBadges.push('perfect_score');
    }

    if (newLevel >= 5 && !earnedBadgeIds.includes('fast_learner')) {
      newBadges.push('fast_learner');
    }

    const allProgress = await db.userProgress.where('user_id').equals(user.id!).toArray();
    const completedModules = allProgress.filter(p => p.status === 'done' || p.module_id === module.id).map(p => p.module_id);
    
    const allModules = await db.modules.toArray();
    const completedCoding = allModules.filter(m => m.type === 'coding' && completedModules.includes(m.id)).length;
    const completedSafety = allModules.filter(m => m.type === 'safety' && completedModules.includes(m.id)).length;

    if (completedCoding >= 3 && !earnedBadgeIds.includes('coding_novice')) {
      newBadges.push('coding_novice');
    }
    if (completedSafety >= 3 && !earnedBadgeIds.includes('safety_novice')) {
      newBadges.push('safety_novice');
    }

    for (const badgeId of newBadges) {
      await db.earnedBadges.add({
        user_id: user.id!,
        badge_id: badgeId,
        awarded_at: Date.now()
      });
    }
    
    // Queue sync
    await db.syncQueue.add({
      action: 'module_completed',
      payload: { userId: user.id, moduleId: module.id, preScore: record?.pre_score, postScore: score },
      timestamp: Date.now(),
      status: 'pending'
    });

    setStage('completed');
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col">
      {/* Header */}
      <header className="bg-slate-800 border-b border-slate-700 p-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate('/student/dashboard')}
            className="p-2 hover:bg-slate-700 rounded-xl transition-colors text-slate-400 hover:text-white"
          >
            <ArrowLeft size={24} />
          </button>
          <h1 className="text-xl font-bold text-white">{module.title}</h1>
        </div>
        
        <div className="flex items-center gap-4">
          <button
            onClick={() => setIsVideoModalOpen(true)}
            className="flex items-center gap-2 bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-400 px-4 py-2 rounded-xl text-sm font-bold transition-colors border border-indigo-500/30"
          >
            <Video size={18} />
            <span className="hidden sm:inline">AI Tutorial</span>
          </button>
          <div className="flex items-center gap-2 bg-slate-700 px-4 py-2 rounded-full text-sm font-medium">
            <span className="text-slate-400">Stage:</span>
            <span className="text-emerald-400 capitalize">{stage.replace('-', ' ')}</span>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 overflow-hidden relative">
        {stage === 'pre-test' && (
          <QuizEngine 
            type="pre" 
            moduleType={module.type} 
            onComplete={handlePreTestComplete} 
          />
        )}

        {stage === 'learning' && (
          <div className="h-full flex flex-col">
            {module.type === 'coding' ? (
              <CanvasCodeEditor onComplete={handleLearningComplete} />
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center p-8 max-w-4xl mx-auto text-center space-y-8 w-full">
                <div className="w-full aspect-video bg-slate-800 rounded-3xl border-2 border-slate-700 flex items-center justify-center relative overflow-hidden group">
                  {isPlayingVideo ? (
                    <iframe 
                      className="w-full h-full absolute inset-0 z-30"
                      src={`${module.video_url || 'https://www.youtube.com/embed/dQw4w9WgXcQ'}?autoplay=1`} 
                      title="Video Lesson" 
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                      allowFullScreen
                    ></iframe>
                  ) : (
                    <>
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 to-transparent z-10" />
                      <div 
                        className="absolute inset-0 z-20 flex items-center justify-center cursor-pointer"
                        onClick={() => setIsPlayingVideo(true)}
                      >
                        <Play size={64} className="text-white opacity-50 group-hover:opacity-100 group-hover:scale-110 transition-all" />
                      </div>
                      <p className="absolute bottom-6 left-8 z-20 text-lg font-medium text-slate-300 pointer-events-none">
                        Video Lesson: {module.title}
                      </p>
                    </>
                  )}
                </div>
                <button 
                  onClick={handleLearningComplete}
                  className="px-8 py-4 bg-emerald-500 hover:bg-emerald-600 text-white text-xl font-bold rounded-2xl transition-colors shadow-lg shadow-emerald-500/20"
                >
                  I've finished watching!
                </button>
              </div>
            )}
          </div>
        )}

        {stage === 'post-test' && (
          <QuizEngine 
            type="post" 
            moduleType={module.type} 
            onComplete={handlePostTestComplete} 
          />
        )}

        {stage === 'completed' && (
          <div className="h-full flex flex-col items-center justify-center p-8 text-center space-y-6">
            <div className="w-24 h-24 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mb-4">
              <CheckCircle2 size={48} />
            </div>
            <h2 className="text-4xl font-bold text-white">Mission Accomplished!</h2>
            <p className="text-xl text-slate-400 max-w-md">
              You've successfully completed this module and earned 100 XP!
            </p>
            <button 
              onClick={() => navigate('/student/dashboard')}
              className="mt-8 px-8 py-4 bg-indigo-500 hover:bg-indigo-600 text-white text-xl font-bold rounded-2xl transition-colors"
            >
              Back to Dashboard
            </button>
          </div>
        )}
      </main>
      
      <VideoTutorialModal 
        isOpen={isVideoModalOpen} 
        onClose={() => setIsVideoModalOpen(false)} 
        moduleTitle={module.title}
        moduleType={module.type}
      />
    </div>
  );
}
