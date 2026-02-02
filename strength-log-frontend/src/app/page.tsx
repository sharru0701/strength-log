"use client";

import { useEffect, useState, useMemo, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DashboardResponse, UserConfig, WorkoutLog } from "@/types/api";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

// --- Icons ---
const Icons = {
  Record: () => <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor" className="w-7 h-7"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 14c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4z"/></svg>,
  History: () => <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-7 h-7"><path d="M12 8v4l3 3"/><circle cx="12" cy="12" r="9"/></svg>,
  Settings: () => <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-7 h-7"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>,
  ArrowDown: () => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>,
  Calendar: () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
};

// --- GhostInput Component ---
const GhostInput = ({ value, onChange, placeholder, className, isDone }: any) => (
  <div className={`relative h-14 w-20 flex items-center justify-center rounded-2xl overflow-hidden transition-colors duration-200 ${isDone ? 'bg-green-500/20 text-green-500' : 'bg-muted dark:bg-white/10 text-foreground'}`}>
      <Input 
          type="number" 
          value={value === 0 ? "" : value?.toString()} 
          placeholder={placeholder} 
          onFocus={(e) => e.target.select()} 
          onChange={onChange} 
          className={`w-full h-full !bg-transparent !border-none !shadow-none !rounded-none !ring-0 text-center text-3xl font-bold p-0 ${className} ${isDone ? 'text-green-500' : 'text-foreground'}`} 
      />
  </div>
);

export default function Dashboard() {
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
  const [isSessionOpen, setIsSessionOpen] = useState(false);
  
  const [actualReps, setActualReps] = useState({ s1: 5, s2: 5, s3: "" });
  const [doneSets, setDoneSets] = useState({ s1: false, s2: false, s3: false });
  const [weight, setWeight] = useState(0);
  const [reps, setReps] = useState(5);
  const [rpe, setRpe] = useState(8);
  const [ohpSets, setOhpSets] = useState({ s1: 5, s2: 5, s3: 5 });
  // [추가] 메모 상태 추가
  const [memo, setMemo] = useState("");
  const [settingsForm, setSettingsForm] = useState<UserConfig>({ id: 0, body_weight: 0, unit_standard: 0, unit_pullup: 0 });

  const dateInputRef = useRef<HTMLInputElement>(null);

  // --- Handlers ---
  const closeDetailModal = () => { setIsClosing(true); setTimeout(() => { setViewLog(null); setIsClosing(false); }, 300); };
  
  const openDatePicker = () => { 
    if (dateInputRef.current) {
        if (typeof dateInputRef.current.showPicker === 'function') {
            dateInputRef.current.showPicker();
        } else {
            dateInputRef.current.focus();
            dateInputRef.current.click();
        }
    }
  };

  const toggleDone = (key: 's1' | 's2' | 's3') => { setDoneSets(prev => ({ ...prev, [key]: !prev[key] })); if (navigator.vibrate) navigator.vibrate(10); };
  
  const handleExerciseChange = (code: string) => { setSelectedCode(code); if (sheets[code]) initForm(code, sheets[code]); };
  
  const initForm = (code: string, log: WorkoutLog) => {
    const data = log.data;
    setDoneSets({ s1: false, s2: false, s3: false }); 
    setMemo(""); // [추가] 운동 변경 시 메모 초기화
    if (log.exercise_type === "531") { setTm(data.tm || 100); setSession(data.session || "a"); setActualReps({ s1: 5, s2: 5, s3: "" }); } 
    else if (log.exercise_type.startsWith("custom")) { setWeight(data.weight || (code === "DL" ? 100 : 40)); }
  };

  const preview = useMemo(() => {
    if (!config || !selectedCode) return null;
    const isPullUp = selectedCode === "PU";
    const unit = isPullUp ? config.unit_pullup : config.unit_standard;
    const currentTm = tm;
    let r1 = 0.65, r2 = 0.75, r3 = 0.85;
    let s1_target = 5, s2_target = 5;
    if (session === "b") { r1 = 0.70; r2 = 0.80; r3 = 0.90; s1_target = 3; s2_target = 3; }
    if (session === "c") { r1 = 0.75; r2 = 0.85; r3 = 0.95; s1_target = 5; s2_target = 3; }
    const calc = (ratio: number) => Math.max(0, Math.round((currentTm * ratio - (isPullUp ? config.body_weight : 0)) / unit) * unit);
    return { w1: calc(r1), w2: calc(r2), w3: calc(r3), s1_target, s2_target };
  }, [config, selectedCode, tm, session]);

  useEffect(() => { if (preview) setActualReps(prev => ({ ...prev, s1: preview.s1_target, s2: preview.s2_target })); }, [preview?.s1_target, preview?.s2_target]);

  // Data Fetching
  useEffect(() => {
    const fetchData = async () => {
      try {
        const dashRes = await fetch(`${API_URL}/api/dashboard`);
        const dashData = await dashRes.json();
        setConfig(dashData.config);
        if (dashData.config) setSettingsForm(dashData.config);
        setSheets(dashData.sheets);
        if (dashData.sheets["SQ"]) initForm("SQ", dashData.sheets["SQ"]);
        setHistoryLoading(true);
        const histRes = await fetch(`${API_URL}/api/history?code=SQ`);
        if (histRes.ok) setHistoryLogs(await histRes.json() || []);
        setLoading(false); setHistoryLoading(false);
      } catch (err) { console.error(err); }
    };
    fetchData();
  }, []);

  useEffect(() => {
    const fetchHistory = async () => {
      setHistoryLoading(true); setHistoryLogs([]);
      try {
        const res = await fetch(`${API_URL}/api/history?code=${selectedCode}`);
        if (res.ok) setHistoryLogs(await res.json() || []);
      } catch (err) { console.error(err); } finally { setHistoryLoading(false); }
    };
    if (activeTab === 'history' || !loading) fetchHistory();
  }, [selectedCode]);

  const handleSave = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/workouts`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        // [수정] memo 필드 추가 전송
        body: JSON.stringify({ 
            workout_date: todayDate, 
            exercise_code: selectedCode, 
            data: sheets[selectedCode]?.exercise_type === "531" ? { tm, session, s1_reps: Number(actualReps.s1), s2_reps: Number(actualReps.s2), s3_reps: Number(actualReps.s3), top_weight: preview?.w3 } : { weight, reps, s1: ohpSets.s1, s2: ohpSets.s2, s3: ohpSets.s3 }, 
            memo: memo 
        }),
      });
      if (res.ok) window.location.reload();
    } catch(e) {} finally { setLoading(false); }
  };

  const handleSaveConfig = async () => {
    setLoading(true);
    try { await fetch(`${API_URL}/api/config`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(settingsForm) }); alert("Saved"); setConfig(settingsForm); } catch(e) {} finally { setLoading(false); }
  };

  const calculate1RM = (w: number, r: number) => (!w || !r) ? 0 : Math.round(w * (1 + r / 30));
  
  const getHistoricalSets = (log: WorkoutLog) => {
    const { weight, reps, s1, s2, s3, tm, session, s1_reps, s2_reps, s3_reps, top_weight } = log.data;

    if (log.exercise_type === '531' && config) {
        const isPullUp = log.exercise_code === 'PU';
        const unit = isPullUp ? config.unit_pullup : config.unit_standard;
        const bw = config.body_weight;
        const calc = (r: number) => Math.max(0, Math.round((tm * r - (isPullUp ? bw : 0)) / unit) * unit);
        let r1 = 0.65, r2 = 0.75; if (session === 'b') { r1 = 0.70; r2 = 0.80; } if (session === 'c') { r1 = 0.75; r2 = 0.85; }
        return [ { label: "Set 1", weight: calc(r1), reps: s1_reps }, { label: "Set 2", weight: calc(r2), reps: s2_reps }, { label: "Top Set", weight: top_weight, reps: s3_reps, isTop: true } ];
    }
    if (s1 !== undefined && s2 !== undefined && s3 !== undefined) return [ { label: "Set 1", weight: weight, reps: s1 }, { label: "Set 2", weight: weight, reps: s2 }, { label: "Set 3", weight: weight, reps: s3, isTop: true } ];
    if (reps !== undefined) return [ { label: "Target Set", weight: weight, reps: reps, isTop: true } ];
    return [];
  };

  if (loading) return <div className="flex h-dvh items-center justify-center bg-background text-primary font-black tracking-widest text-2xl animate-pulse">LOADING...</div>;

  const currentLog = sheets[selectedCode];
  const is531 = currentLog?.exercise_type === "531";

  return (
    <div className="flex flex-col h-dvh bg-background text-foreground font-sans selection:bg-primary/30 overflow-hidden">
      
      {/* 1. Header */}
      <div className="pt-[env(safe-area-inset-top)] px-6 pb-2 z-20 sticky top-0 bg-background/80 backdrop-blur-xl border-b border-white/5 transition-all">
        <div className="flex justify-between items-center h-16">
            <h1 className="text-3xl font-black tracking-tighter">
                {activeTab === 'record' ? 'Workout' : activeTab === 'history' ? 'History' : 'Settings'}
            </h1>
        </div>
      </div>

      {/* 2. Main Content */}
      <div className="flex-1 overflow-y-auto pt-4 pb-40 space-y-8 hide-scrollbar">
        
        {/* Exercise Chips */}
        {activeTab !== 'settings' && (
            <div className="w-full overflow-x-auto py-4 scrollbar-hide">
                <div className="flex gap-3 px-6 w-max"> 
                    {["SQ", "BP", "PU", "DL", "OHP"].map((code) => {
                    const isActive = selectedCode === code;
                    return (
                        <button key={code} onClick={() => handleExerciseChange(code)} 
                        className={`shrink-0 px-7 py-4 rounded-[24px] font-black text-xl tracking-tight transition-all duration-300 active:scale-95 ${isActive ? 'bg-primary text-white scale-105' : 'bg-secondary text-muted-foreground'}`}>
                            {code}
                        </button>
                    )})}
                </div>
            </div>
        )}

        {/* --- RECORD TAB --- */}
        {activeTab === "record" && (
          <div key={selectedCode} className="px-6 space-y-6 animate-slide-up">
             
             {/* Previous Session Info */}
             {currentLog && currentLog.workout_date && (
               <div className="bg-card rounded-[24px] p-5 shadow-sm border border-white/5 flex items-center justify-between animate-fade-in">
                  <div>
                     <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1.5 flex items-center gap-2">
                        Last Session <span className="w-1 h-1 rounded-full bg-muted-foreground/50"/> {currentLog.workout_date}
                     </div>
                     <div className="flex items-center gap-3">
                        {currentLog.exercise_type === "531" ? (
                           <>
                              <span className="bg-primary/10 text-primary px-2 py-0.5 rounded text-xs font-bold">{currentLog.data.session?.toUpperCase()} Type</span>
                              <div className="text-sm font-medium text-foreground">
                                 TM <span className="font-bold">{currentLog.data.tm}</span>
                                 <span className="mx-1.5 text-muted-foreground/50">|</span>
                                 AMRAP <span className="font-bold text-primary">{currentLog.data.s3_reps}</span>
                              </div>
                           </>
                        ) : (
                           <div className="text-sm font-medium">
                              {currentLog.data.weight}kg <span className="text-muted-foreground mx-1">×</span> {currentLog.exercise_code === 'DL' ? currentLog.data.reps : currentLog.data.s3}
                           </div>
                        )}
                     </div>
                  </div>
               </div>
             )}

             {/* Date Card */}
             <div onClick={openDatePicker} className="bg-card rounded-[32px] p-6 flex items-center justify-between shadow-sm border border-white/5 cursor-pointer active:scale-[0.98] transition-all duration-200 relative">
                <div>
                    <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Date</div>
                    <div className="text-2xl font-black font-variant-numeric">{todayDate}</div>
                </div>
                <div className="w-12 h-12 rounded-full bg-secondary dark:bg-white/5 flex items-center justify-center text-primary">
                    <Icons.Calendar/>
                </div>
                <Input 
                    ref={dateInputRef} 
                    type="date" 
                    value={todayDate} 
                    onChange={(e) => setTodayDate(e.target.value)} 
                    className="absolute bottom-0 left-0 w-full h-full opacity-0 z-0 pointer-events-none"
                />
             </div>

             {is531 && preview ? (
                <>
                    {/* [Flow 1] Context */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-card rounded-[32px] p-6 flex flex-col items-center justify-center relative shadow-sm border border-white/5">
                            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">TM</span>
                            <div className="flex items-center justify-center gap-1">
                                <Input 
                                    type="number" value={tm.toString()} onChange={(e) => setTm(Number(e.target.value))} 
                                    className="w-24 text-center !bg-transparent !border-none !shadow-none !ring-0 text-4xl font-black p-0 text-foreground"
                                />
                                <span className="text-sm font-bold text-muted-foreground mt-2">kg</span>
                            </div>
                        </div>
                        
                        {/* Session Card - Div 클릭 시 강제 열림 */}
                        <div 
                            onClick={() => setIsSessionOpen(true)} 
                            className="bg-card rounded-[32px] p-6 flex flex-col items-center justify-center relative shadow-sm border border-white/5 cursor-pointer active:scale-[0.98] transition-all duration-200"
                        >
                            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Session</span>
                            <div className="flex items-center gap-2 text-4xl font-black text-primary">
                                {session.toUpperCase()}
                                <Icons.ArrowDown/>
                            </div>

                            <Select 
                                open={isSessionOpen} 
                                onOpenChange={setIsSessionOpen} 
                                value={session} 
                                onValueChange={(v: any) => setSession(v)}
                            >
                                <SelectTrigger className="w-0 h-0 opacity-0 p-0 m-0 border-none shadow-none text-[0px] absolute">
                                    <SelectValue placeholder={session.toUpperCase()} />
                                </SelectTrigger>
                                <SelectContent className="bg-card border-white/10 text-foreground rounded-2xl p-2 min-w-[120px] font-bold z-50">
                                    <SelectItem value="a" className="rounded-xl py-3 pl-4 focus:bg-secondary/50 focus:text-primary cursor-pointer">A (5+)</SelectItem>
                                    <SelectItem value="b" className="rounded-xl py-3 pl-4 focus:bg-secondary/50 focus:text-primary cursor-pointer">B (3+)</SelectItem>
                                    <SelectItem value="c" className="rounded-xl py-3 pl-4 focus:bg-secondary/50 focus:text-primary cursor-pointer">C (1+)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {/* [Flow 2] Unified Sets List */}
                    <div className="bg-card rounded-[32px] overflow-hidden shadow-sm border border-white/5">
                        {[
                            { label: 'Warmup 1', weight: preview.w1, reps: actualReps.s1, key: 's1' as const },
                            { label: 'Warmup 2', weight: preview.w2, reps: actualReps.s2, key: 's2' as const }
                        ].map((set, i) => (
                            <div key={i} onClick={() => toggleDone(set.key)} className={`p-6 flex items-center justify-between border-b border-border/50 cursor-pointer active:scale-[0.98] transition-all duration-200 ${doneSets[set.key] ? 'bg-green-500/10' : ''}`}>
                                <div>
                                    <div className={`text-[10px] font-bold uppercase mb-1 ${doneSets[set.key] ? 'text-green-500' : 'text-muted-foreground'}`}>{set.label}</div>
                                    <div className={`text-3xl font-black tracking-tight ${doneSets[set.key] ? 'text-green-500' : 'text-foreground'}`}>{set.weight}<span className="text-lg font-medium ml-1 opacity-60">kg</span></div>
                                </div>
                                <div onClick={(e) => e.stopPropagation()}>
                                    <GhostInput value={set.reps} onChange={(e:any) => setActualReps({...actualReps, [set.key]: Number(e.target.value)})} isDone={doneSets[set.key]} />
                                </div>
                            </div>
                        ))}

                        {/* [Flow 3] Top Set */}
                        <div 
                            onClick={() => toggleDone('s3')} 
                            className={`p-6 flex items-center justify-between cursor-pointer active:scale-[0.98] transition-all duration-200 ${doneSets.s3 ? 'bg-green-500/10' : 'bg-primary/5'}`}
                        >
                            <div>
                                <div className={`text-[10px] font-black uppercase mb-1 tracking-widest ${doneSets.s3 ? 'text-green-500' : 'text-primary'}`}>TOP SET (AMRAP)</div>
                                <div className={`text-4xl font-black tracking-tight ${doneSets.s3 ? 'text-green-500' : 'text-primary'}`}>{preview.w3}<span className="text-xl opacity-60 ml-1">kg</span></div>
                            </div>
                            <div onClick={(e) => e.stopPropagation()}>
                                <GhostInput 
                                    value={actualReps.s3} placeholder="?"
                                    onChange={(e:any) => setActualReps({...actualReps, s3: e.target.value})} isDone={doneSets.s3}
                                    className={doneSets.s3 ? 'text-green-500' : 'text-primary'}
                                />
                            </div>
                        </div>
                    </div>
                </>
             ) : (
                // Custom Layout
                <>
                    <div className="bg-card rounded-[32px] p-6 flex flex-col items-center justify-center relative shadow-sm border border-white/5">
                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Target Weight</span>
                        <div className="flex items-center justify-center gap-2">
                            <Input 
                                type="number" value={weight.toString()} onChange={(e) => setWeight(Number(e.target.value))} 
                                className="w-full h-20 text-center !bg-transparent !border-none !shadow-none !ring-0 text-5xl font-black leading-none p-0 text-foreground"
                            />
                            <span className="text-xl font-bold text-muted-foreground mt-4 shrink-0">kg</span>
                        </div>
                    </div>

                    <div className="bg-card rounded-[32px] overflow-hidden shadow-sm border border-white/5">
                        {selectedCode === "DL" ? (
                            <div onClick={() => toggleDone('s1')} className={`p-6 flex items-center justify-between cursor-pointer active:scale-[0.98] transition-all duration-200 ${doneSets.s1 ? 'bg-green-500/10' : ''}`}>
                                <span className="font-bold text-lg">Target Reps</span>
                                <div onClick={(e) => e.stopPropagation()}>
                                    <GhostInput value={reps} onChange={(e:any) => setReps(Number(e.target.value))} isDone={doneSets.s1} />
                                </div>
                            </div>
                        ) : (
                            ['s1','s2','s3'].map((key, i) => (
                                <div key={key} onClick={() => toggleDone(key as any)} className={`p-6 flex items-center justify-between border-b border-border/50 last:border-none cursor-pointer active:scale-[0.98] transition-all duration-200 ${doneSets[key as keyof typeof doneSets] ? 'bg-green-500/10' : ''}`}>
                                    <span className={`text-[10px] font-bold uppercase tracking-widest ${doneSets[key as keyof typeof doneSets] ? 'text-green-500' : 'text-muted-foreground'}`}>Set {i+1}</span>
                                    <div onClick={(e) => e.stopPropagation()}>
                                        <GhostInput value={ohpSets[key as keyof typeof ohpSets]} onChange={(e:any) => setOhpSets({...ohpSets, [key]: Number(e.target.value)})} isDone={doneSets[key as keyof typeof doneSets]} />
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </>
             )}

             {/* [추가] 메모 입력 카드 (Complete Workout 버튼 위) */}
             <div className="bg-card rounded-[32px] p-6 shadow-sm border border-white/5 relative">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2 block">Memo</span>
                <textarea
                    value={memo}
                    onChange={(e) => setMemo(e.target.value)}
                    placeholder="Leave a note..."
                    className="w-full bg-transparent border-none resize-none outline-none text-xl font-bold placeholder:text-muted-foreground/30 h-24 p-0 text-foreground"
                />
             </div>

             <Button className="w-full h-20 rounded-[32px] text-xl font-bold bg-primary text-white shadow-xl shadow-primary/20 active:scale-95 transition-all" onClick={handleSave} disabled={loading}>
                {loading ? "Saving..." : "Complete Workout"}
             </Button>
          </div>
        )}

        {/* --- HISTORY TAB --- */}
        {activeTab === "history" && (
          <div key={`hist-${selectedCode}`} className="px-6 space-y-4 animate-slide-up pb-20">
             {historyLogs.map((log) => (
                 <div key={log.id} onClick={() => setViewLog(log)} className="bg-card p-6 rounded-[32px] flex items-center justify-between shadow-sm active:scale-[0.98] transition-transform cursor-pointer border border-white/5">
                    <div className="flex flex-col gap-1">
                        <span className="text-xs font-bold text-muted-foreground uppercase">{log.workout_date}</span>
                        <div className="flex items-baseline gap-2">
                            <span className="text-3xl font-black">{log.exercise_type === "531" ? log.data.top_weight : log.data.weight}</span>
                            <span className="text-sm font-bold text-muted-foreground">kg</span>
                            {log.exercise_type === "531" && <span className="ml-2 px-2 py-0.5 rounded bg-secondary/50 text-[10px] font-bold text-muted-foreground border border-white/5">{log.data.session?.toUpperCase()} / TM {log.data.tm}</span>}
                        </div>
                    </div>
                    <div className="flex flex-col items-end justify-center">
                        <span className="text-2xl font-black text-primary">{log.exercise_type === "531" ? log.data.s3_reps : (log.exercise_code === 'DL' ? log.data.reps : log.data.s3)}</span>
                        <span className="text-[9px] font-bold text-muted-foreground uppercase">{log.exercise_type === "531" ? "AMRAP" : (log.exercise_code === "DL" ? "REPS" : "SET 3")}</span>
                    </div>
                 </div>
             ))}
          </div>
        )}

        {/* --- SETTINGS TAB --- */}
        {activeTab === "settings" && (
          <div className="px-6 space-y-6 animate-slide-up">
             <div className="bg-card rounded-[32px] overflow-hidden shadow-sm border border-white/5">
                <div className="p-6 border-b border-border/50 flex justify-between items-center">
                    <span className="font-bold text-lg">Body Weight</span>
                    <div className="w-24 h-14"><GhostInput value={settingsForm.body_weight} onChange={(e:any) => setSettingsForm({...settingsForm, body_weight: Number(e.target.value)})} /></div>
                </div>
                <div className="p-6 border-b border-border/50 flex justify-between items-center">
                    <span className="font-bold text-lg">Standard Inc</span>
                    <div className="w-24 h-14"><GhostInput value={settingsForm.unit_standard} onChange={(e:any) => setSettingsForm({...settingsForm, unit_standard: Number(e.target.value)})} /></div>
                </div>
                <div className="p-6 flex justify-between items-center">
                    <span className="font-bold text-lg">Pull-up Inc</span>
                    <div className="w-24 h-14"><GhostInput value={settingsForm.unit_pullup} onChange={(e:any) => setSettingsForm({...settingsForm, unit_pullup: Number(e.target.value)})} /></div>
                </div>
             </div>
             <Button className="w-full h-16 rounded-[24px] font-bold text-lg" onClick={handleSaveConfig}>Save Changes</Button>
          </div>
        )}
      </div>

      {/* 3. Floating Tab Bar */}
      <div className="fixed bottom-8 left-0 right-0 px-8 z-50 flex justify-center pointer-events-none">
        <div className="pointer-events-auto bg-background/80 backdrop-blur-2xl border border-white/10 rounded-full shadow-2xl p-2.5 flex items-center gap-4">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-auto">
                <TabsList className="bg-transparent h-auto p-0 flex gap-4">
                    {['record', 'history', 'settings'].map(tab => (
                        <TabsTrigger 
                            key={tab} 
                            value={tab} 
                            className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 shadow-none border-none active:scale-90
                                data-[state=active]:bg-primary data-[state=active]:text-white text-muted-foreground
                                data-[state=active]:shadow-[0_0_15px_rgba(var(--primary),0.5)]
                            `}
                        >
                            {tab === 'record' && <Icons.Record/>}
                            {tab === 'history' && <Icons.History/>}
                            {tab === 'settings' && <Icons.Settings/>}
                        </TabsTrigger>
                    ))}
                </TabsList>
            </Tabs>
        </div>
      </div>

      {/* 4. Spatial Modal */}
      {viewLog && (
        <div className={`fixed inset-0 z-[60] flex items-center justify-center p-6 bg-black/40 backdrop-blur-md transition-opacity duration-300 ${isClosing ? 'opacity-0' : 'opacity-100'}`} onClick={closeDetailModal}>
            <div className={`w-full max-w-sm bg-card rounded-[40px] p-8 shadow-2xl transition-transform duration-300 ${isClosing ? 'scale-90' : 'scale-100 animate-scale-up'}`} onClick={(e) => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h2 className="text-3xl font-black tracking-tight">{viewLog.exercise_code}</h2>
                        <p className="text-sm font-bold text-muted-foreground">{viewLog.workout_date}</p>
                    </div>
                    <button onClick={closeDetailModal} className="w-10 h-10 bg-secondary rounded-full flex items-center justify-center font-bold text-muted-foreground hover:bg-secondary/80">✕</button>
                </div>
                
                {viewLog.exercise_type === "531" && (
                    <div className="grid grid-cols-2 gap-2 mb-6">
                        <div className="bg-secondary/50 rounded-2xl p-3 flex flex-col items-center justify-center border border-white/5">
                            <span className="text-[9px] font-bold text-muted-foreground uppercase">Session</span>
                            <span className="text-xl font-black text-primary">{viewLog.data.session?.toUpperCase()}</span>
                        </div>
                        <div className="bg-secondary/50 rounded-2xl p-3 flex flex-col items-center justify-center border border-white/5">
                            <span className="text-[9px] font-bold text-muted-foreground uppercase">TM</span>
                            <span className="text-xl font-black">{viewLog.data.tm}</span>
                        </div>
                    </div>
                )}

                <div className="space-y-2">
                    {getHistoricalSets(viewLog).map((set, i) => (
                        <div key={i} className={`flex justify-between items-center p-4 rounded-[20px] ${set.isTop ? 'bg-primary/10 text-primary' : 'bg-secondary/50'}`}>
                            <span className="text-xs font-bold uppercase tracking-wider opacity-70">{set.label}</span>
                            <div className="flex items-baseline gap-1">
                                <span className="text-xl font-black">{set.weight}</span>
                                <span className="text-sm font-bold opacity-70">kg</span>
                                <span className="text-lg font-bold mx-1 opacity-50">×</span>
                                <span className="text-xl font-black">{set.reps}</span>
                            </div>
                        </div>
                    ))}
                </div>
                
                <div className="mt-8 text-center p-4 bg-secondary/30 rounded-[24px]">
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Estimated 1RM</span>
                    <div className="text-5xl font-black text-foreground mt-2">
                        {(() => {
                            const sets = getHistoricalSets(viewLog);
                            const topSet = sets.find(s => s.isTop) || sets[sets.length - 1];
                            return calculate1RM(topSet?.weight || 0, topSet?.reps || 0);
                        })()}
                        <span className="text-xl text-muted-foreground ml-1">kg</span>
                    </div>
                </div>

                {/* [추가] 상세 모달 메모 표시 */}
                {viewLog.memo && (
                    <div className="mt-4 p-6 bg-secondary/30 rounded-[24px]">
                        <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest block mb-2">Memo</span>
                        <p className="text-lg font-medium whitespace-pre-wrap">{viewLog.memo}</p>
                    </div>
                )}
                
            </div>
        </div>
      )}
    </div>
  );
}