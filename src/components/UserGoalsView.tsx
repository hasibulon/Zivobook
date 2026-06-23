import React, { useState, useEffect } from 'react';
import { 
  Target, 
  Sparkles, 
  Plus, 
  CheckCircle, 
  CheckCircle2, 
  Trash2, 
  PlusCircle, 
  Cpu, 
  Server, 
  ShieldCheck, 
  TrendingUp, 
  Calendar,
  AlertCircle
} from 'lucide-react';
import { User, UserGoal, AppSettings } from '../types';
import { dataRepository } from '../lib/dataRepository';
import { hasPermission } from '../lib/permissions';

interface UserGoalsViewProps {
  currentUser: User;
  theme: 'dark' | 'light';
  onShowToast?: (message: string) => void;
  appSettings?: AppSettings;
}

export default function UserGoalsView({ 
  currentUser, 
  theme, 
  onShowToast,
  appSettings
}: UserGoalsViewProps) {
  const isDark = theme === 'dark';
  const [goals, setGoals] = useState<UserGoal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Custom goal creation state
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newGoalTitle, setNewGoalTitle] = useState('');
  const [newGoalCategory, setNewGoalCategory] = useState('Career');
  const [newGoalTargetDate, setNewGoalTargetDate] = useState('');
  const [useAiRoadmap, setUseAiRoadmap] = useState(true);
  const [customMilestonesText, setCustomMilestonesText] = useState('');
  
  // Load goals
  useEffect(() => {
    loadUserGoals();
  }, [currentUser.id]);

  const loadUserGoals = async () => {
    try {
      setIsLoading(true);
      const userGoals = await dataRepository.getUserGoals(currentUser.id);
      setGoals(userGoals);
    } catch (error) {
      console.warn("Could not retrieve goals: ", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGoalTitle.trim()) return;

    const perm = hasPermission(currentUser, 'canCreateGoals', appSettings);
    if (!perm.allowed) {
      if (onShowToast) {
        onShowToast(perm.reason || "আপনার গোল বা লার্নিং পথ তৈরি করার অনুমতি অ্যাডমিন দ্বারা সীমাবদ্ধ করা হয়েছে।");
      }
      return;
    }

    try {
      let milestones: any[] = [];
      let aiRecommendations: string[] = [];

      if (useAiRoadmap) {
        // Retrieve milestones from the AI pathway generator in dataService
        const suggestions = await dataRepository.generateAiPathway(newGoalTitle, newGoalCategory);
        milestones = suggestions.map((title, index) => ({
          id: `m-${Date.now()}-${index}`,
          title,
          isCompleted: false,
          order: index + 1
        }));
        aiRecommendations = [
          "Regular knowledge transfer updates in community forums",
          "Continuous micro-project builds for deep validation",
          "Apply for professional peer-mentorship via VeriTrust system"
        ];
      } else if (customMilestonesText.trim()) {
        milestones = customMilestonesText.split('\n')
          .filter(line => line.trim())
          .map((line, index) => ({
            id: `m-${Date.now()}-${index}`,
            title: line.trim(),
            isCompleted: false,
            order: index + 1
          }));
      }

      await dataRepository.createUserGoal({
        userId: currentUser.id,
        title: newGoalTitle.trim(),
        category: newGoalCategory,
        targetDate: newGoalTargetDate || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        progressPercent: 0,
        status: 'active',
        milestones,
        aiRecommendations
      });

      if (onShowToast) {
        onShowToast("Dynamic learning goal successfully tracked!");
      }

      setNewGoalTitle('');
      setShowCreateForm(false);
      loadUserGoals();
    } catch (error) {
      console.error("Failed to add goal", error);
    }
  };

  const handleToggleMilestone = async (goal: UserGoal, milestoneId: string) => {
    const updatedMilestones = goal.milestones.map(m => {
      if (m.id === milestoneId) {
        return { ...m, isCompleted: !m.isCompleted };
      }
      return m;
    });

    const completedCount = updatedMilestones.filter(m => m.isCompleted).length;
    const totalCount = updatedMilestones.length;
    const newProgress = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

    try {
      // Optimistic state updates
      setGoals(prev => prev.map(g => {
        if (g.id === goal.id) {
          return {
            ...g,
            progressPercent: newProgress,
            milestones: updatedMilestones,
            status: newProgress >= 100 ? 'completed' : 'active'
          };
        }
        return g;
      }));

      await dataRepository.updateGoalProgress(goal.id, newProgress, updatedMilestones);
      
      if (newProgress >= 100 && onShowToast) {
        onShowToast(`Congratulations! You've achieved your goal: ${goal.title}!`);
      }
    } catch (error) {
      console.warn("Failed to persist milestone update: ", error);
      loadUserGoals();
    }
  };

  const handleDeleteGoal = async (goalId: string) => {
    try {
      setGoals(prev => prev.filter(g => g.id !== goalId));
      await dataRepository.deleteUserGoal(goalId);
      if (onShowToast) {
        onShowToast("Goal tracking deleted.");
      }
    } catch (err) {
      console.error(err);
      loadUserGoals();
    }
  };

  return (
    <div className={`space-y-6 ${isDark ? 'text-gray-100' : 'text-gray-900'} pb-12`}>
      {/* Structural Header Area with Architecture Status */}
      <div className={`p-6 rounded-3xl ${isDark ? 'bg-zinc-900/60 border border-zinc-800' : 'bg-white border border-gray-200/80 shadow-sm'} space-y-4`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-100 dark:bg-blue-950/40 rounded-2xl text-blue-600 dark:text-blue-400">
              <Target className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <h1 className="text-xl font-black tracking-tight" id="goals-main-header">
                Interactive Goal & Learning Paths
              </h1>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Identify system milestones and unlock Gemini AI pathways based on your career interests.
              </p>
            </div>
          </div>

          {/* Database-Agnostic Framework Integration Badge */}
          <div className="flex flex-col items-end shrink-0">
            <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-mono font-black tracking-wider uppercase text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200/50 dark:border-emerald-800/40">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
              Repository: DB-Agnostic
            </span>
            <span className="text-[9px] font-mono text-zinc-400 dark:text-zinc-500 mt-1">
              Active Server Provider: Firebase Core
            </span>
          </div>
        </div>

        {/* Informative system architecture note */}
        <div className="flex items-start gap-2.5 p-3 rounded-2xl bg-zinc-50 dark:bg-zinc-800/20 text-xs text-zinc-500 dark:text-zinc-400 border border-zinc-200/40 dark:border-zinc-800/40">
          <Cpu className="w-4 h-4 text-zinc-400 mt-0.5 shrink-0" />
          <span>
            <strong>Architectural Design Strategy:</strong> This module queries the backend exclusively via the custom compiled <code className="px-1 py-0.5 bg-zinc-200 dark:bg-zinc-800 rounded font-mono text-[10px]">IDataRepository</code> client layer. No low-level Firestore calls exist here, rendering it ready for 1-click PostgreSQL/Supabase transitions.
          </span>
        </div>
      </div>

      {/* Grid containing Goal list and controls */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left column - Goal overview & controls */}
        <div className="lg:col-span-1 space-y-6">
          <button
            onClick={() => setShowCreateForm(prev => !prev)}
            className="w-full flex items-center justify-center gap-2 p-4 rounded-2xl text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 active:scale-98 transition shadow-lg shadow-blue-600/10"
          >
            {showCreateForm ? 'Cancel Creation' : 'Track New Interest Goal'}
            <Plus className="w-4 h-4" />
          </button>

          {/* Form container */}
          {showCreateForm && (
            <form 
              onSubmit={handleCreateGoal}
              className={`p-5 rounded-3xl ${isDark ? 'bg-zinc-900 border border-zinc-800' : 'bg-white border border-gray-200 shadow-sm'} space-y-4`}
            >
              <h3 className="text-sm font-bold tracking-tight">Create Professional Roadmap</h3>
              
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-mono tracking-wider text-gray-500 select-none block">Goal Target Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Become a Senior iOS Architect"
                  value={newGoalTitle}
                  onChange={(e) => setNewGoalTitle(e.target.value)}
                  className={`w-full text-xs px-3.5 py-2.5 rounded-xl border focus:outline-none focus:ring-1 focus:ring-blue-500 ${
                    isDark 
                      ? 'bg-zinc-950 border-zinc-850 text-white placeholder-zinc-550' 
                      : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400'
                  }`}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-mono tracking-wider text-gray-500 select-none block">Category</label>
                  <select
                    value={newGoalCategory}
                    onChange={(e) => setNewGoalCategory(e.target.value)}
                    className={`w-full text-xs px-3 py-2.5 rounded-xl border focus:outline-none ${
                      isDark ? 'bg-zinc-950 border-zinc-850 text-white' : 'bg-gray-50 border-gray-200 text-gray-900'
                    }`}
                  >
                    <option value="Career">Career</option>
                    <option value="Academic">Academic</option>
                    <option value="Skill">Skill</option>
                    <option value="Personal">Personal</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-mono tracking-wider text-gray-500 select-none block">Target Date</label>
                  <input
                    type="date"
                    value={newGoalTargetDate}
                    onChange={(e) => setNewGoalTargetDate(e.target.value)}
                    className={`w-full text-xs px-3 py-2 rounded-xl border focus:outline-none ${
                      isDark ? 'bg-zinc-950 border-zinc-850 text-white' : 'bg-gray-50 border-gray-200 text-gray-900'
                    }`}
                  />
                </div>
              </div>

              {/* AI Pathway checkbox selector */}
              <div 
                className={`p-3.5 rounded-2xl border transition-colors ${
                  useAiRoadmap 
                    ? 'border-blue-500/30 bg-blue-500/5 text-blue-900 dark:text-blue-300' 
                    : isDark ? 'border-zinc-800 hover:border-zinc-700' : 'border-gray-100 hover:border-gray-200'
                }`}
              >
                <label className="flex items-start gap-2.5 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={useAiRoadmap}
                    onChange={() => setUseAiRoadmap(!useAiRoadmap)}
                    className="mt-0.5 rounded text-blue-600 focus:ring-blue-500"
                  />
                  <div className="leading-tight">
                    <span className="text-xs font-bold flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5 text-amber-500 fill-amber-500/20" />
                      Synthesize Generative Milestones
                    </span>
                    <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-0.5">
                      Synthesize dynamic system-recommended benchmarks tailored to this specific interest tier.
                    </p>
                  </div>
                </label>
              </div>

              {!useAiRoadmap && (
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-mono tracking-wider text-gray-500 select-none block">Milestones (One Per Line)</label>
                  <textarea
                    placeholder="Milestone 1&#10;Milestone 2&#10;Milestone 3"
                    value={customMilestonesText}
                    onChange={(e) => setCustomMilestonesText(e.target.value)}
                    rows={4}
                    className={`w-full text-xs px-3.5 py-2.5 rounded-xl border focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none ${
                      isDark 
                        ? 'bg-zinc-950 border-zinc-850 text-white placeholder-zinc-550' 
                        : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400'
                    }`}
                  />
                </div>
              )}

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-gray-900 dark:bg-blue-600 hover:opacity-90 font-black text-xs text-white tracking-wide transition-all uppercase"
              >
                Establish Active Roadmap
              </button>
            </form>
          )}

          {/* Quick learning highlights card */}
          <div className={`p-5 rounded-3xl ${isDark ? 'bg-zinc-900/40 border border-zinc-800' : 'bg-gray-50 border border-gray-200/50'}`}>
            <h3 className="text-xs font-black tracking-wide uppercase text-zinc-400 mb-2.5">Key Learning Pathways</h3>
            <div className="space-y-2.5">
              <div className="flex gap-2 text-xs text-zinc-500 dark:text-zinc-400">
                <CheckCircle2 className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                <span>Gain professional emerald/gold verified trust badges as you verify goals.</span>
              </div>
              <div className="flex gap-2 text-xs text-zinc-500 dark:text-zinc-400">
                <CheckCircle2 className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                <span>Verify progress using third party verification systems secure ledger protocols.</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right column - Goal lists and detailed milestone checklists */}
        <div className="lg:col-span-2 space-y-4">
          
          {isLoading ? (
            <div className="text-center py-12">
              <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              <p className="text-xs text-gray-400">Consulting DataRepository Ledger...</p>
            </div>
          ) : goals.length === 0 ? (
            <div className={`text-center py-12 p-8 rounded-3xl border border-dashed ${
              isDark ? 'border-zinc-800 bg-zinc-900/10' : 'border-gray-200 bg-gray-50/50'
            }`}>
              <Target className="w-8 h-8 text-zinc-400 mx-auto mb-2.5" />
              <h3 className="font-bold text-sm">No Active Learning Roadmaps Yet</h3>
              <p className="text-xs text-zinc-400 max-w-xs mx-auto mt-1">
                Establish an interest-based roadmap (e.g. software engineer, doctor) to track validation steps and pathways.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {goals.map((goal) => {
                const targetFormatted = goal.targetDate 
                  ? new Date(goal.targetDate).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
                  : 'Undated';

                return (
                  <div 
                    key={goal.id} 
                    className={`p-6 rounded-3xl transition ${
                      isDark ? 'bg-zinc-900 border border-zinc-800/80 hover:border-zinc-700/60' : 'bg-white border border-gray-200 hover:shadow-sm'
                    }`}
                  >
                    {/* Header line of card */}
                    <div className="flex justify-between items-start gap-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${
                            goal.category === 'Career' ? 'bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:text-blue-400' :
                            goal.category === 'Academic' ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-400' :
                            goal.category === 'Skill' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400' :
                            'bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300'
                          }`}>
                            {goal.category}
                          </span>
                          
                          <span className="flex items-center gap-1 text-[10px] text-gray-400">
                            <Calendar className="w-3 h-3 text-gray-500" />
                            Target: {targetFormatted}
                          </span>
                        </div>
                        
                        <h2 className="text-base font-black tracking-tight">{goal.title}</h2>
                      </div>

                      <button
                        onClick={() => handleDeleteGoal(goal.id)}
                        className={`p-1.5 rounded-lg transition-colors cursor-pointer text-zinc-400 hover:text-red-500 hover:bg-red-500/5`}
                        title="Delete Roadmap"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Simple progress bar */}
                    <div className="mt-4 space-y-1.5">
                      <div className="flex justify-between text-xs font-bold leading-none">
                        <span className="text-gray-500 dark:text-gray-400">Roadmap validation progress</span>
                        <span className="text-blue-600 dark:text-blue-400">{goal.progressPercent}%</span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-zinc-100 dark:bg-zinc-800/80 overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full transition-all duration-500"
                          style={{ width: `${goal.progressPercent}%` }}
                        />
                      </div>
                    </div>

                    {/* Milestones checklist block */}
                    {goal.milestones && goal.milestones.length > 0 && (
                      <div className="mt-5 pt-4 border-t border-zinc-100 dark:border-zinc-800/60 space-y-2.5">
                        <h4 className="text-[10px] uppercase font-bold tracking-wider text-zinc-400">Milestone Checkpoints</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                          {goal.milestones.map((milestone) => (
                            <button
                              key={milestone.id}
                              onClick={() => handleToggleMilestone(goal, milestone.id)}
                              className={`flex items-start text-left gap-2.5 p-2.5 rounded-xl border transition-all text-xs select-none ${
                                milestone.isCompleted 
                                  ? 'bg-blue-50/20 dark:bg-blue-950/10 border-blue-500/20 text-gray-500 dark:text-gray-400 line-through' 
                                  : isDark ? 'border-zinc-800 hover:bg-zinc-850/50' : 'border-gray-50 hover:bg-gray-100/50'
                              }`}
                            >
                              <div className="mt-0.5 shrink-0">
                                {milestone.isCompleted ? (
                                  <CheckCircle className="w-4 h-4 text-blue-500" />
                                ) : (
                                  <div className="w-4 h-4 rounded-full border border-zinc-400 dark:border-zinc-600" />
                                )}
                              </div>
                              <span className="leading-tight">{milestone.title}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Expert/AI Recommendations Pathways Block */}
                    {goal.aiRecommendations && goal.aiRecommendations.length > 0 && (
                      <div className="mt-5 pt-4 border-t border-zinc-100 dark:border-zinc-800/60 bg-yellow-50/10 dark:bg-orange-950/5 p-4 rounded-2xl border border-yellow-500/10">
                        <h4 className="text-[10px] uppercase font-bold tracking-wider text-amber-500 dark:text-amber-400 flex items-center gap-1 leading-none mb-2">
                          <Sparkles className="w-3.5 h-3.5" />
                          Platform-Agnostic AI Advisories
                        </h4>
                        <ul className="space-y-1.5">
                          {goal.aiRecommendations.map((rec, i) => (
                            <li key={i} className="text-xs text-gray-500 dark:text-gray-400 flex items-start gap-1.5 leading-snug">
                              <span className="text-amber-500 select-none">•</span>
                              {rec}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                  </div>
                );
              })}
            </div>
          )}

        </div>

      </div>

    </div>
  );
}
