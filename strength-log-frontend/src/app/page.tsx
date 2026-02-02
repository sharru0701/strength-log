"use client";

import { useEffect, useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DashboardResponse, UserConfig, WorkoutLog } from "@/types/api";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

export default function Dashboard() {
  // --- 1. State ---
  const [loading, setLoading] = useState(true);
  const [historyLoading, setHistoryLoading] = useState(false);

  const [config, setConfig] = useState<UserConfig | null>(null);
  const [sheets, setSheets] = useState<Record<string, WorkoutLog>>({});
  
  const [historyLogs, setHistoryLogs] = useState<WorkoutLog[]>([]);
  const [activeTab, setActiveTab] = useState("record");
  const [viewLog, setViewLog] = useState<WorkoutLog | null>(null);
  const [isClosing, setIsClosing] = useState(false);

  const [selectedCode, setSelectedCode] = useState("SQ");
  const [todayDate, setTodayDate] = useState(new Date().toISOString().split("T")[0]);
  const [tm, setTm] = useState(100);
  const [session, setSession] = useState<"a" | "b" | "c">("a");
  const [actualReps, setActualReps] = useState({ s1: 5, s2: 5, s3: "" });
  const [doneSets, setDoneSets] = useState({ s1: false, s2: false, s3: false });
  const [weight, setWeight] = useState(0);
  const [reps, setReps] = useState(5);
  const [rpe, setRpe] = useState(8);
  const [ohpSets, setOhpSets] = useState({ s1: 5, s2: 5, s3: 5 });

  const [settingsForm, setSettingsForm] = useState<UserConfig>({
    id: 0,
    body_weight: 0,
    unit_standard: 0,
    unit_pullup: 0,
  });

  // --- 2. Effects ---
  useEffect(() => {
    const fetchData = async () => {
      try {
        const dashRes = await fetch(`${API_URL}/api/dashboard`);
        const dashData: DashboardResponse = await dashRes.json();
        setConfig(dashData.config);
        if (dashData.config) setSettingsForm(dashData.config);
        setSheets(dashData.sheets);
        if (dashData.sheets["SQ"]) initForm("SQ", dashData.sheets["SQ"]);

        setHistoryLoading(true);
        const histRes = await fetch(`${API_URL}/api/history?code=SQ`);
        if (histRes.ok) {
            const histData = await histRes.json();
            setHistoryLogs(histData || []);
        }
        setLoading(false);
        setHistoryLoading(false);
      } catch (err) { console.error(err); }
    };
    fetchData();
  }, []);

  useEffect(() => {
    const fetchHistory = async () => {
      setHistoryLoading(true);
      setHistoryLogs([]);
      try {
        const res = await fetch(`${API_URL}/api/history?code=${selectedCode}`);
        if (res.ok) {
            const data = await res.json();
            setHistoryLogs(data || []);
        }
      } catch (err) { console.error(err); }
      finally { setHistoryLoading(false); }
    };
    if (activeTab === 'history' || !loading) { 
        fetchHistory();
    }
  }, [selectedCode]);

  // --- 3. Handlers ---
  const closeDetailModal = () => {
    setIsClosing(true);
    setTimeout(() => { setViewLog(null); setIsClosing(false); }, 200);
  };

  const handleExerciseChange = (code: string) => {
    setSelectedCode(code);
    if (sheets[code]) initForm(code, sheets[code]);
  };

  const initForm = (code: string, log: WorkoutLog) => {
    const data = log.data;
    setDoneSets({ s1: false, s2: false, s3: false }); 
    if (log.exercise_type === "531") {
      setTm(data.tm || 100);
      setSession(data.session || "a");
      setActualReps({ s1: 5, s2: 5, s3: "" });
    } else if (log.exercise_type === "custom_dl") {
      setWeight(data.weight || 100);
    } else if (log.exercise_type === "custom_ohp") {
      setWeight(data.weight || 40);
    }
  };

  // --- 4. Logic ---
  const preview = useMemo(() => {
    if (!config || !selectedCode) return null;
    const isPullUp = selectedCode === "PU";
    const unit = isPullUp ? config.unit_pullup : config.unit_standard;
    const currentTm = tm;
    let r1 = 0.65, r2 = 0.75, r3 = 0.85;
    let s1_target = 5, s2_target = 5;
    if (session === "b") { r1 = 0.70; r2 = 0.80; r3 = 0.90; s1_target = 3; s2_target = 3; }
    if (session === "c") { r1 = 0.75; r2 = 0.85; r3 = 0.95; s1_target = 5; s2_target = 3; }
    const calcWeight = (ratio: number) => {
      let raw = currentTm * ratio;
      if (isPullUp) raw -= config.body_weight;
      raw = Math.max(0, raw);
      return Math.round(raw / unit) * unit;
    };
    return { w1: calcWeight(r1), w2: calcWeight(r2), w3: calcWeight(r3), s1_target, s2_target };
  }, [config, selectedCode, tm, session]);

  useEffect(() => {
    if (preview) {
      setActualReps(prev => ({ ...prev, s1: preview.s1_target, s2: preview.s2_target }));
    }
  }, [preview?.s1_target, preview?.s2_target]);

  const handleSave = async () => {
    const is531 = sheets[selectedCode]?.exercise_type === "531";
    if (is531 && !actualReps.s3) return alert("Top Set 횟수(AMRAP)를 입력해주세요!");
    setLoading(true);
    let payloadData: any = {};
    if (is531 && preview) {
      payloadData = { tm, session, s1_reps: Number(actualReps.s1), s2_reps: Number(actualReps.s2), s3_reps: Number(actualReps.s3), top_weight: preview.w3 };
    } else if (selectedCode === "DL") {
      payloadData = { weight, reps, rpe };
    } else if (selectedCode === "OHP") {
      payloadData = { weight, s1: ohpSets.s1, s2: ohpSets.s2, s3: ohpSets.s3 };
    } else {
      payloadData = { weight, reps };
    }
    try {
      const res = await fetch(`${API_URL}/api/workouts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workout_date: todayDate, exercise_code: selectedCode, data: payloadData, memo: "" }),
      });
      if (res.ok) {
        if (navigator.vibrate) navigator.vibrate(50);
        window.location.reload();
      } else alert("저장 실패: " + await res.text());
    } catch (e) { alert("서버 오류!"); } 
    finally { setLoading(false); }
  };

  const handleSaveConfig = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/config`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settingsForm),
      });
      if (res.ok) {
        if (navigator.vibrate) navigator.vibrate(50);
        setConfig(settingsForm);
        alert("Settings Saved!");
      } else alert("저장 실패");
    } catch(e) { alert("서버 오류"); } 
    finally { setLoading(false); }
  };

  const toggleDone = (key: 's1' | 's2' | 's3') => {
    setDoneSets(prev => ({ ...prev, [key]: !prev[key] }));
    if (navigator.vibrate) navigator.vibrate(10);
  };

  if (loading) return <div className="flex h-[100dvh] items-center justify-center bg-black text-violet-500 font-bold tracking-widest animate-pulse">LOADING...</div>;

  const currentLog = sheets[selectedCode];
  const is531 = currentLog?.exercise_type === "531";

  // --- Components ---
  const calculate1RM = (weight: number, reps: number) => {
    if (!weight || !reps) return 0;
    return Math.round(weight * (1 + reps / 30));
  }

  const getHistoricalSets = (log: WorkoutLog) => {
    if (!config || log.exercise_type !== '531') return [];
    const { tm, session } = log.data;
    const isPullUp = log.exercise_code === 'PU';
    const unit = isPullUp ? config.unit_pullup : config.unit_standard;
    const bw = config.body_weight;
    let r1 = 0.65, r2 = 0.75;
    if (session === 'b') { r1 = 0.70; r2 = 0.80; }
    if (session === 'c') { r1 = 0.75; r2 = 0.85; }
    const calc = (ratio: number) => {
       let raw = tm * ratio;
       if (isPullUp) raw -= bw;
       raw = Math.max(0, raw);
       return Math.round(raw / unit) * unit;
    }
    return [
      { label: "Set 1", weight: calc(r1), reps: log.data.s1_reps },
      { label: "Set 2", weight: calc(r2), reps: log.data.s2_reps },
      { label: "Top Set", weight: log.data.top_weight, reps: log.data.s3_reps, isTop: true }
    ];
  };

  // --- JSX ---
  return (
    // [수정] overscroll-none 추가하여 전체 화면 튕김 방지
    <div className="flex flex-col h-[100dvh] bg-black text-white font-sans overflow-hidden relative overscroll-none">
      
      {/* Header (Fixed & Blurred) */}
      <div className="fixed top-0 left-0 right-0 z-50 px-6 pt-12 pb-4 bg-zinc-950/90 backdrop-blur-xl border-b border-white/5 flex justify-between items-center transition-all duration-300 gap-4">
          <div>
            <h1 className="text-2xl font-black tracking-tighter text-white leading-none">Strength Logger</h1>
            <div className="flex items-center gap-2 mt-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"/>
              <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">System Ready</span>
            </div>
          </div>
      </div>

      {/* Content */}
      {/* [수정] overflow-x-hidden 추가하여 가로 스크롤 방지 */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden px-5 pt-32 pb-32 space-y-6 scrollbar-hide">
        
        {/* Workout Date Card */}
        {activeTab !== 'settings' && (
            <div className="relative bg-zinc-900 rounded-[24px] p-6 border border-zinc-800/50 mb-2 flex items-center group active:scale-[0.98] transition-all">
               <div>
                  <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1">Workout Date</div>
                  <div className="text-3xl font-black text-white tracking-tighter">{todayDate}</div>
               </div>
               
               <Input 
                 type="date" 
                 value={todayDate} 
                 onChange={(e) => setTodayDate(e.target.value)} 
                 className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" 
               />
            </div>
        )}

        {/* Exercise Selector */}
        {activeTab !== 'settings' && (
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide snap-x">
            {["SQ", "BP", "PU", "DL", "OHP"].map((code) => {
              const isSelected = selectedCode === code;
              return (
                <button 
                  key={code} 
                  onClick={() => handleExerciseChange(code)} 
                  className={`snap-start shrink-0 px-6 py-4 rounded-2xl border-2 transition-all duration-300 ${isSelected 
                    ? 'bg-violet-600 text-white border-violet-500 shadow-[0_0_20px_rgba(124,58,237,0.5)]' 
                    : 'bg-zinc-900 text-zinc-500 border-transparent hover:bg-zinc-800'}`}
                >
                  <span className="text-xl font-black tracking-tighter">{code}</span>
                </button>
              )
            })}
          </div>
        )}

        {/* RECORD TAB */}
        {activeTab === "record" && (
          <div key={selectedCode} className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
             
             {/* Last Session Info */}
             {currentLog && currentLog.workout_date && (
                <div className="flex items-center justify-between p-5 bg-zinc-900/50 rounded-2xl border border-zinc-800">
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest bg-zinc-950 px-2 py-1 rounded">{currentLog.workout_date}</span>
                            {/* 5/3/1 Info */}
                            {currentLog.exercise_type === "531" && (
                                <>
                                    {currentLog.data.session && (
                                        <span className="text-[10px] font-bold text-zinc-400 bg-zinc-800 border border-zinc-700 px-2 py-1 rounded">
                                            {currentLog.data.session.toUpperCase()}
                                        </span>
                                    )}
                                    <span className="text-[10px] font-bold text-white bg-violet-600 px-2 py-1 rounded shadow-[0_0_10px_rgba(124,58,237,0.4)]">
                                        TM {currentLog.data.tm}kg
                                    </span>
                                </>
                            )}
                        </div>
                        <div className="text-lg font-bold text-white">
                        {currentLog.exercise_type === "531" ? `Top: ${currentLog.data.top_weight}kg × ${currentLog.data.s3_reps}` : `${currentLog.data.weight}kg`}
                        </div>
                    </div>
                    <div className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest border border-zinc-800 px-3 py-2 rounded-full">LAST</div>
                </div>
             )}

             {is531 && preview ? (
                // ========== 5/3/1 UI ==========
                <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                        <div className="relative w-full h-40">
                            <div className="absolute inset-0 bg-zinc-900 rounded-3xl flex flex-col items-center justify-center border border-zinc-800/50 pointer-events-none">
                                <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-2">Session</span>
                                <div className="text-5xl font-black text-white leading-none">{session.toUpperCase()}</div>
                                <div className="text-xs text-zinc-600 font-bold mt-2">TYPE</div>
                            </div>
                            <Select value={session} onValueChange={(v: any) => setSession(v)}>
                                <SelectTrigger className="w-full opacity-0 p-0 border-none bg-transparent" style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 50 }}><SelectValue placeholder="" /></SelectTrigger>
                                <SelectContent className="bg-zinc-900 border-zinc-800 text-white rounded-xl z-50">
                                <SelectItem value="a" className="py-4 font-bold text-lg justify-center">A (5+)</SelectItem>
                                <SelectItem value="b" className="py-4 font-bold text-lg justify-center">B (3+)</SelectItem>
                                <SelectItem value="c" className="py-4 font-bold text-lg justify-center">C (1+)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="h-40 bg-zinc-900 rounded-3xl relative flex flex-col items-center justify-center overflow-hidden border border-zinc-800/50">
                            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-2">TM</span>
                            <Input type="number" value={tm || ""} onFocus={(e) => e.target.select()} onChange={(e) => setTm(Number(e.target.value))} className="bg-transparent border-none text-center text-5xl font-black text-white h-auto p-0 focus-visible:ring-0 w-full" />
                            <div className="text-xs text-zinc-600 font-bold mt-2">KG</div>
                        </div>
                    </div>

                    <div className="space-y-2">
                    {[
                        { label: 'Warmup 1', weight: preview.w1, reps: actualReps.s1, key: 's1' as const },
                        { label: 'Warmup 2', weight: preview.w2, reps: actualReps.s2, key: 's2' as const }
                    ].map((set, i) => (
                        <div key={i} onClick={() => toggleDone(set.key)} className={`flex items-center justify-between p-5 rounded-3xl border-2 transition-all cursor-pointer select-none ${doneSets[set.key] ? 'bg-green-500 text-black border-green-500' : 'bg-zinc-900 border-transparent text-zinc-400'}`}>
                        <div className="flex flex-col">
                            <span className={`text-[10px] font-bold uppercase tracking-widest ${doneSets[set.key] ? 'text-black/60' : 'text-zinc-600'}`}>{set.label}</span>
                            <span className="text-3xl font-black tracking-tighter">{set.weight}<span className="text-sm font-bold opacity-50 ml-1">kg</span></span>
                        </div>
                        <div onClick={(e) => e.stopPropagation()} className="w-16">
                            <Input type="number" value={set.reps || ""} onFocus={(e) => e.target.select()} onChange={(e) => setActualReps({...actualReps, [set.key]: Number(e.target.value)})} className={`h-12 text-center text-xl font-bold rounded-xl border-none focus-visible:ring-0 ${doneSets[set.key] ? 'bg-black/20 text-black placeholder:text-black/40' : 'bg-black/40 text-white'}`} />
                            <div className={`text-[8px] text-center font-bold mt-1 ${doneSets[set.key] ? 'text-black/60' : 'text-zinc-600'}`}>REPS</div>
                        </div>
                        </div>
                    ))}
                    </div>

                    <div onClick={() => toggleDone('s3')} className={`relative p-5 rounded-[32px] border-2 transition-all cursor-pointer overflow-hidden group select-none ${doneSets.s3 ? 'bg-green-500 border-green-500' : 'bg-zinc-900 border-zinc-700'}`}>
                        <div className="relative z-10 flex flex-col items-center text-center">
                            <div className={`text-xs font-black tracking-[0.3em] uppercase mb-3 ${doneSets.s3 ? 'text-black/70' : 'text-violet-400'}`}>Top Set Target</div>
                            <div className="flex items-baseline gap-1 mb-4">
                                <span className={`text-5xl font-black tracking-tighter ${doneSets.s3 ? 'text-black' : 'text-white'}`}>{preview.w3}</span>
                                <span className={`text-lg font-bold ${doneSets.s3 ? 'text-black/60' : 'text-zinc-500'}`}>kg</span>
                            </div>
                            <div onClick={(e) => e.stopPropagation()} className="w-full max-w-[120px]">
                                <Input placeholder="?" value={actualReps.s3} onFocus={(e) => e.target.select()} onChange={(e) => setActualReps({...actualReps, s3: e.target.value})} type="number" className={`h-14 text-center text-3xl font-black rounded-2xl border-none focus-visible:ring-0 shadow-xl ${doneSets.s3 ? 'bg-black/20 text-black placeholder:text-black/40' : 'bg-black/40 text-white placeholder:text-zinc-700'}`} />
                                <div className={`text-[9px] font-bold tracking-widest mt-2 ${doneSets.s3 ? 'text-black/70' : 'text-zinc-500'}`}>AMRAP REPS</div>
                            </div>
                        </div>
                    </div>

                    <div className="pt-4 pb-4">
                        <Button 
                            className="w-full h-20 rounded-[28px] text-xl font-black bg-violet-600 text-white hover:bg-violet-500 shadow-[0_0_30px_rgba(124,58,237,0.5)] transition-all active:scale-[0.98]" 
                            onClick={handleSave} 
                            disabled={loading}
                        >
                            {loading ? "SAVING..." : "COMPLETE WORKOUT"}
                        </Button>
                    </div>
                </div>
             ) : (
                // ========== Custom UI (DL, OHP) - Unification ==========
                <div className="space-y-4">
                    {/* Weight Input */}
                    <div className="relative p-6 rounded-[32px] border-2 border-zinc-800 bg-zinc-900 flex flex-col items-center justify-center">
                        <div className="text-xs font-black tracking-[0.3em] uppercase mb-4 text-zinc-500">Target Weight</div>
                        <div className="flex items-baseline gap-1">
                            <Input 
                                type="number" 
                                value={weight || ""} 
                                onFocus={(e) => e.target.select()} 
                                onChange={(e) => setWeight(Number(e.target.value))} 
                                className="bg-transparent border-none text-center text-6xl font-black text-white h-auto p-0 focus-visible:ring-0 w-40" 
                            />
                            <span className="text-xl font-bold text-zinc-600">kg</span>
                        </div>
                    </div>

                    {/* DEADLIFT (1 Set) */}
                    {selectedCode === "DL" && (
                        <div 
                            onClick={() => toggleDone('s1')}
                            className={`flex items-center justify-between p-5 rounded-3xl border-2 transition-all cursor-pointer select-none ${doneSets.s1 ? 'bg-green-500 border-green-500' : 'bg-zinc-900 border-zinc-800'}`}
                        >
                            <span className={`text-[10px] font-bold uppercase tracking-widest ${doneSets.s1 ? 'text-black/60' : 'text-zinc-500'}`}>Target Reps</span>
                            <div onClick={(e) => e.stopPropagation()} className="w-20">
                                <Input 
                                    type="number" 
                                    value={reps || ""} 
                                    onFocus={(e) => e.target.select()} 
                                    onChange={(e) => setReps(Number(e.target.value))} 
                                    className={`h-12 text-center text-xl font-bold rounded-xl border-none focus-visible:ring-0 ${doneSets.s1 ? 'bg-black/20 text-black placeholder:text-black/40' : 'bg-black/40 text-white'}`} 
                                />
                                <div className={`text-[8px] text-center font-bold mt-1 ${doneSets.s1 ? 'text-black/60' : 'text-zinc-500'}`}>REPS</div>
                            </div>
                        </div>
                    )}

                    {/* OHP (3 Sets) */}
                    {selectedCode === "OHP" && (
                        <div className="space-y-2">
                            {['s1', 's2', 's3'].map((key, i) => {
                                const isDone = doneSets[key as keyof typeof doneSets];
                                return (
                                    <div 
                                        key={key} 
                                        onClick={() => toggleDone(key as keyof typeof doneSets)}
                                        className={`flex items-center justify-between p-5 rounded-3xl border-2 transition-all cursor-pointer select-none ${isDone ? 'bg-green-500 border-green-500' : 'bg-zinc-900 border-zinc-800'}`}
                                    >
                                        <span className={`text-[10px] font-bold uppercase tracking-widest ${isDone ? 'text-black/60' : 'text-zinc-500'}`}>SET {i+1}</span>
                                        <div onClick={(e) => e.stopPropagation()} className="w-20">
                                            <Input 
                                                type="number" 
                                                value={ohpSets[key as keyof typeof ohpSets] || ""} 
                                                onFocus={(e) => e.target.select()} 
                                                onChange={(e) => setOhpSets({...ohpSets, [key]: Number(e.target.value)})} 
                                                className={`h-12 text-center text-xl font-bold rounded-xl border-none focus-visible:ring-0 ${isDone ? 'bg-black/20 text-black placeholder:text-black/40' : 'bg-black/40 text-white'}`} 
                                            />
                                            <div className={`text-[8px] text-center font-bold mt-1 ${isDone ? 'text-black/60' : 'text-zinc-500'}`}>REPS</div>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    )}

                    <div className="pt-4 pb-4">
                        <Button 
                            className="w-full h-20 rounded-[28px] text-xl font-black bg-violet-600 text-white hover:bg-violet-500 shadow-[0_0_30px_rgba(124,58,237,0.5)] transition-all active:scale-[0.98]" 
                            onClick={handleSave}
                        >
                            COMPLETE WORKOUT
                        </Button>
                    </div>
                </div>
             )}
          </div>
        )}

        {/* HISTORY TAB */}
        {activeTab === "history" && (
          <div key={`history-${selectedCode}`} className="animate-in fade-in slide-in-from-bottom-4 duration-500">
             {historyLoading ? (
               <div className="flex flex-col items-center justify-center mt-32 text-zinc-600">
                  <div className="w-8 h-8 border-4 border-zinc-700 border-t-white rounded-full animate-spin mb-4"></div>
                  <p className="text-xs font-bold tracking-widest uppercase">Loading...</p>
               </div>
             ) : historyLogs.length > 0 ? (
               historyLogs.map((log) => (
                 <div key={log.id} onClick={() => setViewLog(log)} className="bg-zinc-900 rounded-[24px] p-5 flex items-center gap-5 mb-3 border border-zinc-800/50 hover:bg-zinc-800 transition-colors cursor-pointer active:scale-95 duration-200">
                    <div className="w-14 h-14 bg-zinc-800 rounded-2xl flex flex-col items-center justify-center shrink-0 border border-zinc-700/50">
                        <span className="text-sm font-black text-white">{log.exercise_code}</span>
                        <span className="text-[9px] font-bold text-zinc-500">{log.workout_date.substring(5).replace('-', '.')}</span>
                    </div>
                    <div className="flex-1">
                        <div className="text-2xl font-black text-white tracking-tight">
                            {log.exercise_type === "531" ? `${log.data.top_weight}kg × ${log.data.s3_reps}` : `${log.data.weight}kg`}
                        </div>
                        <div className="text-xs font-bold text-zinc-500 uppercase tracking-wide mt-0.5">
                            {log.exercise_type === "531" ? `Session ${log.data.session?.toUpperCase()} (TM ${log.data.tm})` : `RPE ${log.data.rpe}`}
                        </div>
                    </div>
                 </div>
               ))
             ) : (
               <div className="text-center text-zinc-500 mt-20">
                 <div className="text-4xl mb-4">📭</div>
                 <p className="font-bold">No history for {selectedCode}.</p>
               </div>
             )}
          </div>
        )}

        {/* SETTINGS TAB */}
        {activeTab === "settings" && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-4">
             <div className="bg-zinc-900 rounded-[32px] p-6 border border-zinc-800">
                <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-4">Your Metrics</div>
                <div className="flex items-center justify-between">
                   <span className="text-xl font-bold text-white">Body Weight</span>
                   <div className="flex items-center gap-2">
                      <Input type="number" value={settingsForm.body_weight || ""} onFocus={(e) => e.target.select()} onChange={(e) => setSettingsForm({...settingsForm, body_weight: Number(e.target.value)})} className="w-24 bg-zinc-950/50 border-zinc-800 h-12 text-center text-xl font-bold text-white" />
                      <span className="text-sm font-bold text-zinc-600">kg</span>
                   </div>
                </div>
             </div>
             <div className="bg-zinc-900 rounded-[32px] p-6 border border-zinc-800 space-y-6">
                <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2">Increment Units</div>
                <div className="flex items-center justify-between">
                   <span className="text-lg font-bold text-white">Standard Unit</span>
                   <div className="flex items-center gap-2">
                      <Input type="number" value={settingsForm.unit_standard || ""} onFocus={(e) => e.target.select()} onChange={(e) => setSettingsForm({...settingsForm, unit_standard: Number(e.target.value)})} className="w-24 bg-zinc-950/50 border-zinc-800 h-12 text-center text-xl font-bold text-white" />
                      <span className="text-sm font-bold text-zinc-600">kg</span>
                   </div>
                </div>
                <div className="flex items-center justify-between">
                   <span className="text-lg font-bold text-white">Pull-up Unit</span>
                   <div className="flex items-center gap-2">
                      <Input type="number" value={settingsForm.unit_pullup || ""} onFocus={(e) => e.target.select()} onChange={(e) => setSettingsForm({...settingsForm, unit_pullup: Number(e.target.value)})} className="w-24 bg-zinc-950/50 border-zinc-800 h-12 text-center text-xl font-bold text-white" />
                      <span className="text-sm font-bold text-zinc-600">kg</span>
                   </div>
                </div>
             </div>
             <div className="pt-4">
                <Button className="w-full h-20 rounded-[28px] text-xl font-black bg-violet-600 text-white hover:bg-violet-500 shadow-[0_0_30px_rgba(124,58,237,0.5)] transition-all active:scale-[0.98]" onClick={handleSaveConfig} disabled={loading}>SAVE SETTINGS</Button>
             </div>
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="fixed bottom-0 left-0 right-0 h-[90px] bg-zinc-950/90 backdrop-blur-xl border-t border-white/5 flex justify-around items-center z-50 pt-6 pb-2">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full h-full">
          <TabsList className="w-full h-full bg-transparent p-0 flex justify-around items-center">
            <TabsTrigger value="record" className="flex-1 h-full flex flex-col items-center justify-center gap-1.5 bg-transparent data-[state=active]:bg-transparent data-[state=active]:text-white text-zinc-600 transition-colors">
              <div className="h-7 flex items-center justify-center mb-1"><div className={`w-6 h-6 rounded-full border-2 ${activeTab === 'record' ? 'bg-white border-white' : 'border-zinc-600'}`}></div></div>
              <span className="text-[10px] font-bold tracking-widest uppercase leading-none">Record</span>
            </TabsTrigger>
            <TabsTrigger value="history" className="flex-1 h-full flex flex-col items-center justify-center gap-1.5 bg-transparent data-[state=active]:bg-transparent data-[state=active]:text-white text-zinc-600 transition-colors">
              <div className="h-7 flex items-center justify-center mb-1"><div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${activeTab === 'history' ? 'border-white' : 'border-zinc-600'}`}><div className={`w-2 h-[2px] ${activeTab === 'history' ? 'bg-white' : 'bg-zinc-600'}`}></div></div></div>
              <span className="text-[10px] font-bold tracking-widest uppercase leading-none">History</span>
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex-1 h-full flex flex-col items-center justify-center gap-1.5 bg-transparent data-[state=active]:bg-transparent data-[state=active]:text-white text-zinc-600 transition-colors">
              <div className="h-7 flex items-center justify-center mb-1">
                 <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`${activeTab === 'settings' ? 'text-white' : 'text-zinc-600'}`}><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"></path><circle cx="12" cy="12" r="3"></circle></svg>
              </div>
              <span className="text-[10px] font-bold tracking-widest uppercase leading-none">Settings</span>
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Detail Modal */}
      {viewLog && (
        <div className={`fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-6 duration-200 ${isClosing ? 'animate-out fade-out' : 'animate-in fade-in'}`} onClick={closeDetailModal}>
          <div className={`w-full max-w-sm bg-zinc-900 border border-zinc-800 rounded-[32px] p-6 shadow-2xl duration-200 ${isClosing ? 'animate-out zoom-out-95 slide-out-to-bottom-10' : 'animate-in zoom-in-95 slide-in-from-bottom-10'}`} onClick={(e) => e.stopPropagation()}>
             <div className="flex justify-between items-start mb-6">
                <div>
                   <h2 className="text-3xl font-black text-white tracking-tighter">{viewLog.exercise_code}</h2>
                   <p className="text-xs font-bold text-zinc-500 mt-1">{viewLog.workout_date}</p>
                </div>
                <button onClick={closeDetailModal} className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center text-white font-bold hover:bg-zinc-700">✕</button>
             </div>
             <div className="space-y-4">
                {viewLog.exercise_type === "531" && (
                  <>
                    <div className="grid grid-cols-2 gap-3 mb-2">
                       <div className="bg-zinc-950/50 rounded-2xl p-3 border border-zinc-800/50">
                          <div className="text-[9px] font-bold text-zinc-500 uppercase mb-1">TM</div>
                          <div className="text-xl font-black text-white">{viewLog.data.tm} <span className="text-xs font-medium text-zinc-600">kg</span></div>
                       </div>
                       <div className="bg-zinc-950/50 rounded-2xl p-3 border border-zinc-800/50">
                          <div className="text-[9px] font-bold text-zinc-500 uppercase mb-1">Est. 1RM</div>
                          <div className="text-xl font-black text-green-400">{calculate1RM(viewLog.data.top_weight!, viewLog.data.s3_reps!)} <span className="text-xs font-medium text-green-400/50">kg</span></div>
                       </div>
                    </div>
                    <div className="space-y-2">
                        {getHistoricalSets(viewLog).map((set, idx) => (
                            <div key={idx} className={`flex items-center justify-between p-4 rounded-2xl border ${set.isTop ? 'bg-violet-900/10 border-violet-500/30' : 'bg-zinc-800/30 border-zinc-800'}`}>
                                <span className={`text-[10px] font-bold uppercase tracking-widest ${set.isTop ? 'text-violet-400' : 'text-zinc-500'}`}>{set.label}</span>
                                <div className="flex items-baseline gap-1">
                                    <span className={`text-xl font-black ${set.isTop ? 'text-white' : 'text-zinc-300'}`}>{set.weight}</span>
                                    <span className="text-xs font-medium text-zinc-600 mr-2">kg</span>
                                    <span className="text-sm font-bold text-zinc-500">× {set.reps}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                  </>
                )}
                {viewLog.exercise_type !== "531" && (
                   <div className="bg-zinc-950 rounded-3xl p-6 border border-zinc-800 text-center">
                      <div className="text-xs font-bold text-zinc-500 uppercase mb-2">Result</div>
                      <div className="text-5xl font-black text-white tracking-tighter">{viewLog.data.weight} <span className="text-xl text-zinc-600">kg</span></div>
                      {viewLog.data.reps && <div className="text-2xl font-bold text-zinc-400 mt-2">× {viewLog.data.reps} reps</div>}
                   </div>
                )}
                {viewLog.memo && (
                   <div className="bg-zinc-800/30 rounded-2xl p-4 border border-zinc-800/50">
                      <div className="text-[9px] font-bold text-zinc-500 uppercase mb-1">Memo</div>
                      <p className="text-xs text-zinc-300 leading-relaxed">{viewLog.memo}</p>
                   </div>
                )}
             </div>
          </div>
        </div>
      )}
    </div>
  );
}