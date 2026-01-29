"use client";

import { useEffect, useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DashboardResponse, UserConfig, WorkoutLog } from "@/types/api";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

export default function Dashboard() {
  // --- 1. 상태 관리 ---
  const [loading, setLoading] = useState(true);
  const [config, setConfig] = useState<UserConfig | null>(null);
  const [sheets, setSheets] = useState<Record<string, WorkoutLog>>({});
  
  // History 데이터
  const [historyLogs, setHistoryLogs] = useState<WorkoutLog[]>([]);
  const [activeTab, setActiveTab] = useState("record");

  // Record 탭 상태
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

  // --- 2. 데이터 로드 ---
  useEffect(() => {
    const fetchData = async () => {
      try {
        // 대시보드
        const dashRes = await fetch(`${API_URL}/api/dashboard`);
        const dashData: DashboardResponse = await dashRes.json();
        setConfig(dashData.config);
        setSheets(dashData.sheets);
        if (dashData.sheets["SQ"]) initForm("SQ", dashData.sheets["SQ"]);

        // 히스토리
        const histRes = await fetch(`${API_URL}/api/history`);
        if (histRes.ok) {
            const histData = await histRes.json();
            setHistoryLogs(histData || []);
        }
        setLoading(false);
      } catch (err) {
        console.error(err);
      }
    };
    fetchData();
  }, []);

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

  // --- 3. 5/3/1 계산 ---
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

  // --- 4. 저장 로직 ---
  const handleSave = async () => {
    const is531 = sheets[selectedCode]?.exercise_type === "531";
    if (is531 && !actualReps.s3) return alert("Top Set 횟수(AMRAP)를 입력해주세요!");

    setLoading(true);
    let payloadData: any = {};

    if (is531 && preview) {
      payloadData = {
        tm: tm, session: session, s1_reps: Number(actualReps.s1), s2_reps: Number(actualReps.s2), s3_reps: Number(actualReps.s3), top_weight: preview.w3
      };
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
      } else {
        alert("저장 실패: " + await res.text());
      }
    } catch (e) {
      alert("서버 오류!");
    } finally {
      setLoading(false);
    }
  };

  const toggleDone = (key: 's1' | 's2' | 's3') => {
    setDoneSets(prev => ({ ...prev, [key]: !prev[key] }));
    if (navigator.vibrate) navigator.vibrate(10);
  };

  if (loading) return <div className="flex h-[100dvh] items-center justify-center bg-black text-violet-500 font-bold tracking-widest animate-pulse">LOADING...</div>;

  const currentLog = sheets[selectedCode];
  const is531 = currentLog?.exercise_type === "531";

  // --- History Card ---
  const HistoryCard = ({ log }: { log: WorkoutLog }) => {
    const dateStr = log.workout_date.substring(5).replace('-', '.');
    let content = "", subContent = "";

    if (log.exercise_type === "531") {
      content = `${log.data.top_weight}kg × ${log.data.s3_reps}`;
      subContent = `Session ${log.data.session?.toUpperCase()} (TM ${log.data.tm})`;
    } else if (log.exercise_type === "custom_dl") {
      content = `${log.data.weight}kg × ${log.data.reps}`;
      subContent = `RPE ${log.data.rpe}`;
    } else {
      content = `${log.data.weight}kg`;
    }

    return (
      <div className="bg-zinc-900 rounded-[24px] p-5 flex items-center gap-5 mb-3 border border-zinc-800/50 hover:bg-zinc-800 transition-colors">
         <div className="w-14 h-14 bg-zinc-800 rounded-2xl flex flex-col items-center justify-center shrink-0 border border-zinc-700/50">
            <span className="text-sm font-black text-white">{log.exercise_code}</span>
            <span className="text-[9px] font-bold text-zinc-500">{dateStr}</span>
         </div>
         <div className="flex-1">
            <div className="text-2xl font-black text-white tracking-tight">{content}</div>
            <div className="text-xs font-bold text-zinc-500 uppercase tracking-wide mt-0.5">{subContent}</div>
         </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-[100dvh] bg-black text-white font-sans overflow-hidden relative">
      
      {/* Header */}
      <div className="px-5 pt-6 pb-2 bg-black/90 backdrop-blur-md z-20 shrink-0 border-b border-white/5">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h1 className="text-2xl font-black tracking-tighter italic">SMART 5/3/1</h1>
            <div className="flex items-center gap-2 mt-1">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"/>
              <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">System Ready</span>
            </div>
          </div>
          <div className="bg-zinc-900 rounded-full px-4 py-1.5 border border-zinc-800 flex items-center gap-2">
             <span className="text-[10px] text-zinc-500 font-bold">DATE</span>
             <Input type="date" value={todayDate} onChange={(e) => setTodayDate(e.target.value)} className="w-auto bg-transparent border-none text-sm font-bold text-white p-0 h-auto focus:ring-0" />
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="w-full bg-zinc-900 p-1 rounded-xl h-10">
            <TabsTrigger value="record" className="flex-1 rounded-lg text-xs font-bold data-[state=active]:bg-zinc-800 data-[state=active]:text-white">Record</TabsTrigger>
            <TabsTrigger value="history" className="flex-1 rounded-lg text-xs font-bold data-[state=active]:bg-zinc-800 data-[state=active]:text-white">History</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto px-5 pt-4 pb-40 space-y-6 scrollbar-hide">
        
        {/* === RECORD TAB === */}
        {activeTab === "record" && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-6">
            
            {/* Exercise Selector */}
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide snap-x">
              {["SQ", "BP", "PU", "DL", "OHP"].map((code) => {
                const isSelected = selectedCode === code;
                return (
                  <button key={code} onClick={() => handleExerciseChange(code)} className={`snap-start shrink-0 px-6 py-4 rounded-2xl border-2 transition-all duration-300 ${isSelected ? 'bg-white text-black border-white shadow-[0_0_20px_rgba(255,255,255,0.3)]' : 'bg-zinc-900 text-zinc-500 border-transparent hover:bg-zinc-800'}`}>
                    <span className="text-xl font-black tracking-tighter">{code}</span>
                  </button>
                )
              })}
            </div>

            {/* Last Session */}
            {currentLog && currentLog.workout_date && (
              <div className="flex items-center justify-between p-5 bg-zinc-900/50 rounded-2xl border border-zinc-800">
                <div>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest bg-zinc-950 px-2 py-1 rounded">{currentLog.workout_date}</span>
                      {currentLog.exercise_type === "531" && <span className="text-[10px] font-bold text-white bg-violet-600 px-2 py-1 rounded shadow-[0_0_10px_rgba(124,58,237,0.4)]">TM {currentLog.data.tm}kg</span>}
                    </div>
                    <div className="text-lg font-bold text-white">
                      {currentLog.exercise_type === "531" ? `Top: ${currentLog.data.top_weight}kg × ${currentLog.data.s3_reps}` : `${currentLog.data.weight}kg`}
                    </div>
                </div>
                <div className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest border border-zinc-800 px-3 py-2 rounded-full">LAST</div>
              </div>
            )}

            {/* Inputs */}
            {is531 && preview ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  
                  {/* ▼▼▼ 여기가 수정된 부분입니다 (Nuclear Option 적용) ▼▼▼ */}
                  <div className="relative w-full h-40">
                      <div className="absolute inset-0 bg-zinc-900 rounded-3xl flex flex-col items-center justify-center border border-zinc-800/50 pointer-events-none">
                          <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-2">Session</span>
                          <div className="text-5xl font-black text-white leading-none">{session.toUpperCase()}</div>
                          <div className="text-xs text-zinc-600 font-bold mt-2">TYPE</div>
                      </div>
                      <Select value={session} onValueChange={(v: any) => setSession(v)}>
                        <SelectTrigger 
                          className="w-full opacity-0 p-0 border-none bg-transparent"
                          // style 속성으로 높이와 위치를 강제하여 ShadCN 기본 스타일을 덮어씌웁니다.
                          style={{ 
                            position: 'absolute', 
                            top: 0, 
                            left: 0, 
                            width: '100%', 
                            height: '100%', 
                            zIndex: 50 
                          }}
                        >
                           <SelectValue placeholder="" />
                        </SelectTrigger>
                        <SelectContent className="bg-zinc-900 border-zinc-800 text-white rounded-xl z-50">
                          <SelectItem value="a" className="py-4 font-bold text-lg justify-center">A (5+)</SelectItem>
                          <SelectItem value="b" className="py-4 font-bold text-lg justify-center">B (3+)</SelectItem>
                          <SelectItem value="c" className="py-4 font-bold text-lg justify-center">C (1+)</SelectItem>
                        </SelectContent>
                      </Select>
                  </div>
                  {/* ▲▲▲ 수정 완료 ▲▲▲ */}

                  <div className="h-40 bg-zinc-900 rounded-3xl relative flex flex-col items-center justify-center overflow-hidden border border-zinc-800/50">
                    <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-2">TM</span>
                    <Input type="number" value={tm} onChange={(e) => setTm(Number(e.target.value))} className="bg-transparent border-none text-center text-5xl font-black text-white h-auto p-0 focus-visible:ring-0 w-full" />
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
                        <Input type="number" value={set.reps} onChange={(e) => setActualReps({...actualReps, [set.key]: Number(e.target.value)})} className={`h-12 text-center text-xl font-bold rounded-xl border-none focus-visible:ring-0 ${doneSets[set.key] ? 'bg-black/20 text-black placeholder:text-black/40' : 'bg-black/40 text-white'}`} />
                        <div className={`text-[8px] text-center font-bold mt-1 ${doneSets[set.key] ? 'text-black/60' : 'text-zinc-600'}`}>REPS</div>
                      </div>
                    </div>
                  ))}
                </div>

                <div onClick={() => toggleDone('s3')} className={`relative p-8 rounded-[32px] border-2 transition-all cursor-pointer overflow-hidden group select-none ${doneSets.s3 ? 'bg-green-500 border-green-500' : 'bg-zinc-800 border-zinc-700'}`}>
                   {!doneSets.s3 && <div className="absolute top-0 right-0 w-64 h-64 bg-violet-600/20 blur-[80px] rounded-full pointer-events-none group-hover:bg-violet-600/30 transition-all"/>}
                   <div className="relative z-10 flex flex-col items-center text-center">
                     <div className={`text-xs font-black tracking-[0.3em] uppercase mb-4 ${doneSets.s3 ? 'text-black/70' : 'text-violet-400'}`}>Top Set Target</div>
                     <div className="flex items-baseline gap-2 mb-8">
                        <span className={`text-8xl font-black tracking-tighter ${doneSets.s3 ? 'text-black' : 'text-white'}`}>{preview.w3}</span>
                        <span className={`text-2xl font-bold ${doneSets.s3 ? 'text-black/60' : 'text-zinc-500'}`}>kg</span>
                     </div>
                     <div onClick={(e) => e.stopPropagation()} className="w-full max-w-[180px]">
                        <Input placeholder="?" value={actualReps.s3} onChange={(e) => setActualReps({...actualReps, s3: e.target.value})} type="number" className={`h-20 text-center text-5xl font-black rounded-2xl border-none focus-visible:ring-0 shadow-xl ${doneSets.s3 ? 'bg-black/20 text-black placeholder:text-black/40' : 'bg-black/50 text-white placeholder:text-zinc-700'}`} />
                        <div className={`text-[10px] font-bold tracking-widest mt-3 ${doneSets.s3 ? 'text-black/70' : 'text-zinc-500'}`}>AMRAP REPS</div>
                     </div>
                   </div>
                </div>
              </div>
            ) : (
              <div className="bg-zinc-900 rounded-[32px] p-8 text-center space-y-8">
                 <div className="text-xs text-zinc-500 font-bold uppercase tracking-widest mb-4">Target Weight</div>
                 <Input type="number" value={weight} onChange={(e) => setWeight(Number(e.target.value))} className="bg-transparent border-b-2 border-zinc-700 rounded-none text-center text-8xl font-black text-white w-full h-32 p-0 focus-visible:ring-0" />
              </div>
            )}
          </div>
        )}

        {/* === HISTORY TAB === */}
        {activeTab === "history" && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
             {historyLogs.length > 0 ? (
               historyLogs.map((log) => (
                 <HistoryCard key={log.id} log={log} />
               ))
             ) : (
               <div className="text-center text-zinc-500 mt-20">
                 <div className="text-4xl mb-4">📭</div>
                 <p className="font-bold">No history yet.</p>
                 <p className="text-xs mt-1">Start your journey today!</p>
               </div>
             )}
          </div>
        )}

        <div className="h-32" /> 
      </div>

      {/* FAB */}
      {activeTab === "record" && (
        <div className="fixed bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black via-black/90 to-transparent z-50">
          <Button className="w-full h-20 rounded-[28px] text-xl font-black bg-white text-black hover:bg-zinc-200 shadow-[0_0_40px_rgba(255,255,255,0.15)] transition-all active:scale-[0.98]" onClick={handleSave} disabled={loading}>
            {loading ? "SAVING..." : "COMPLETE WORKOUT"}
          </Button>
        </div>
      )}

    </div>
  );
}