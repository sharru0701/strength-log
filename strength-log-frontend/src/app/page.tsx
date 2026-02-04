"use client";

import { useEffect, useState, useMemo, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { WorkoutLog } from "@/types/api";
import { Reorder } from "framer-motion";

interface UserConfig {
  id: number;
  body_weight: number;
  unit_standard: number;
  unit_pullup: number;
  exercise_order?: string; 
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://8080-cs-2da8b2c6-a3aa-47a1-aa9d-0ee863dca331.cs-asia-east1-jnrc.cloudshell.dev";

// --- Icons ---
const Icons = {
  Record: () => <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor" className="w-7 h-7"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 14c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4z"/></svg>,
  History: () => <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-7 h-7"><path d="M12 8v4l3 3"/><circle cx="12" cy="12" r="9"/></svg>,
  Settings: () => <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-7 h-7"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>,
  ArrowDown: () => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>,
  Calendar: () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
  Grip: () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground"><circle cx="9" cy="12" r="1" /><circle cx="9" cy="5" r="1" /><circle cx="9" cy="19" r="1" /><circle cx="15" cy="12" r="1" /><circle cx="15" cy="5" r="1" /><circle cx="15" cy="19" r="1" /></svg>,
  Pencil: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></svg>,
  Trash: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-red-500"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>,
  Check: () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>,
  X: () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>,
  Alert: () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-primary"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
};

const GhostInput = ({ value, onChange, placeholder, className, isDone, readOnly, onAutoComplete }: any) => {
  const handleBlur = () => {
    if (value && Number(value) > 0 && !isDone && onAutoComplete) {
      onAutoComplete();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.currentTarget.blur();
    }
  };

  return (
    <div className={`relative h-14 w-20 flex items-center justify-center rounded-2xl overflow-hidden transition-colors duration-200 ${isDone ? 'bg-green-500/20 text-green-500' : 'bg-muted dark:bg-white/10 text-foreground'}`}>
        <Input 
            type="number" 
            value={value === 0 ? "" : value?.toString()} 
            placeholder={placeholder} 
            onFocus={(e) => !readOnly && e.target.select()} 
            onChange={onChange}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            readOnly={readOnly}
            className={`w-full h-full !bg-transparent !border-none !shadow-none !rounded-none !ring-0 text-center text-2xl font-bold p-0 placeholder:text-muted-foreground/30 ${className} ${isDone ? 'text-green-500' : 'text-foreground'} ${readOnly ? 'pointer-events-none' : ''}`} 
        />
    </div>
  );
};

export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [config, setConfig] = useState<UserConfig | null>(null);
  const [sheets, setSheets] = useState<Record<string, WorkoutLog>>({});
  const [historyLogs, setHistoryLogs] = useState<WorkoutLog[]>([]);
  const [activeTab, setActiveTab] = useState("record");
  
  const [viewLog, setViewLog] = useState<WorkoutLog | null>(null);
  const [isEditing, setIsEditing] = useState(false); 
  const [editForm, setEditForm] = useState<any>(null);

  const [isClosing, setIsClosing] = useState(false);
  const [isAlertClosing, setIsAlertClosing] = useState(false); // [NEW] 알림창 닫힘 상태
  
  const [selectedCode, setSelectedCode] = useState("SQ");
  const [todayDate, setTodayDate] = useState(new Date().toISOString().split("T")[0]);
  const [tm, setTm] = useState(100);
  const [session, setSession] = useState<"a" | "b" | "c">("a");

  const [actualReps, setActualReps] = useState({ s1: 0, s2: 0, s3: 0 }); 
  const [doneSets, setDoneSets] = useState({ s1: false, s2: false, s3: false });
  const [weight, setWeight] = useState(0);
  const [reps, setReps] = useState(0);
  const [ohpSets, setOhpSets] = useState({ s1: 0, s2: 0, s3: 0 }); 
  const [memo, setMemo] = useState("");
  
  const [settingsForm, setSettingsForm] = useState<UserConfig>({ id: 0, body_weight: 0, unit_standard: 0, unit_pullup: 0, exercise_order: "SQ,BP,PU,DL,OHP" });
  const [displayOrder, setDisplayOrder] = useState(["SQ", "BP", "PU", "DL", "OHP"]);
  
  const [alertState, setAlertState] = useState<{isOpen: boolean, title: string, message: string, onConfirm?: () => void, isConfirmType?: boolean}>({
      isOpen: false, title: "", message: "", isConfirmType: false
  });

  const dateInputRef = useRef<HTMLInputElement>(null);

  const showAlert = (title: string, message: string, onConfirm?: () => void) => {
      setAlertState({ isOpen: true, title, message, onConfirm, isConfirmType: false });
  };
  
  const showConfirm = (title: string, message: string, onConfirm: () => void) => {
      setAlertState({ isOpen: true, title, message, onConfirm, isConfirmType: true });
  };

  // [MODIFIED] History Modal과 동일한 방식으로 애니메이션 적용
  const closeAlert = () => {
      setIsAlertClosing(true);
      setTimeout(() => {
          setAlertState(prev => ({ ...prev, isOpen: false }));
          setIsAlertClosing(false);
      }, 300);
  };

  const closeDetailModal = () => { 
      setIsClosing(true); 
      setTimeout(() => { 
          setViewLog(null); 
          setIsClosing(false); 
          setIsEditing(false); 
      }, 300); 
  };

  const handleOpenLog = (log: WorkoutLog) => {
      setViewLog(log);
      setEditForm(JSON.parse(JSON.stringify(log)));
      setIsEditing(false);
  };

  const toggleDone = (key: 's1' | 's2' | 's3') => { 
      if (doneSets[key]) {
          setDoneSets(prev => ({ ...prev, [key]: false }));
          return;
      }
      const currentLog = sheets[selectedCode];
      const is531 = currentLog?.exercise_type === "531";
      
      let val = 0;
      if (is531) {
          val = actualReps[key];
      } else {
          if (selectedCode === 'DL') {
             val = reps;
          } else {
             val = ohpSets[key];
          }
      }

      if (val <= 0) {
          showAlert("Input Required", "Please enter valid reps before checking.");
          return;
      }

      setDoneSets(prev => ({ ...prev, [key]: true })); 
      if (navigator.vibrate) navigator.vibrate(10); 
  };

  const handleRepsChange = (key: 's1' | 's2' | 's3', newVal: number, type: '531' | 'custom' | 'custom_dl') => {
    if (type === '531') {
        setActualReps(prev => ({ ...prev, [key]: newVal }));
    } else if (type === 'custom_dl') {
        setReps(newVal);
    } else {
        setOhpSets(prev => ({ ...prev, [key]: newVal }));
    }

    if ((!newVal || newVal === 0) && doneSets[key]) {
        setDoneSets(prev => ({ ...prev, [key]: false }));
    }
  };
  
  const handleExerciseChange = (code: string) => { setSelectedCode(code); if (sheets[code]) initForm(code, sheets[code]); };
  
  const initForm = (code: string, log: WorkoutLog) => {
    const data = log.data; setDoneSets({ s1: false, s2: false, s3: false }); setMemo(""); 
    if (log.exercise_type === "531") { setTm(data.tm || 100); setSession(data.session || "a"); setActualReps({ s1: 0, s2: 0, s3: 0 }); } 
    else if (log.exercise_type.startsWith("custom")) { setWeight(data.weight || (code === "DL" ? 100 : 40)); setOhpSets({s1:0,s2:0,s3:0}); setReps(0); }
  };
  const handleReorder = (newOrder: string[]) => { setDisplayOrder(newOrder); setSettingsForm(prev => ({ ...prev, exercise_order: newOrder.join(",") })); };

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

  useEffect(() => {
    const fetchData = async () => {
      try {
        const dashRes = await fetch(`${API_URL}/api/dashboard`, { credentials: 'include' });
        const dashData = await dashRes.json();
        setConfig(dashData.config);
        if (dashData.config) {
            setSettingsForm(dashData.config);
            if (dashData.config.exercise_order) {
                const order = dashData.config.exercise_order.split(",");
                if (order.length > 0) { setDisplayOrder(order); if (!order.includes(selectedCode)) setSelectedCode(order[0]); }
            }
        }
        setSheets(dashData.sheets);
        const firstCode = dashData.config?.exercise_order ? dashData.config.exercise_order.split(",")[0] : "SQ";
        if (dashData.sheets[firstCode]) initForm(firstCode, dashData.sheets[firstCode]);
        else setSelectedCode(firstCode); 
        setHistoryLoading(true);
        const histRes = await fetch(`${API_URL}/api/history?code=${selectedCode}`, { credentials: 'include' });
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
        const res = await fetch(`${API_URL}/api/history?code=${selectedCode}`, { credentials: 'include' });
        if (res.ok) setHistoryLogs(await res.json() || []);
      } catch (err) { console.error(err); } finally { setHistoryLoading(false); }
    };
    if (activeTab === 'history' || !loading) fetchHistory();
  }, [selectedCode]);

  const handleSave = async () => {
    const currentLog = sheets[selectedCode];
    const is531 = currentLog?.exercise_type === "531";

    if (is531) {
        if (!tm || tm <= 0) { showAlert("Invalid TM", "Please enter a valid TM."); return; }
        if (actualReps.s1 <= 0 || actualReps.s2 <= 0 || actualReps.s3 <= 0) {
            showAlert("Incomplete Data", "Please enter reps for all sets."); return; 
        }
    } else {
        if (!weight || weight <= 0) { showAlert("Invalid Weight", "Please enter a valid weight."); return; }
        if (selectedCode === 'DL') {
             if (reps <= 0) { showAlert("Invalid Reps", "Please enter target reps."); return; }
        } else {
             if (ohpSets.s1 <= 0 || ohpSets.s2 <= 0 || ohpSets.s3 <= 0) {
                showAlert("Incomplete Data", "Please enter reps for all sets."); return; 
             }
        }
    }

    setIsSaving(true);
    try {
      const res = await fetch(`${API_URL}/api/workouts`, {
        method: "POST", credentials: 'include', headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
            workout_date: todayDate, exercise_code: selectedCode, 
            data: is531 ? { tm, session, s1_reps: Number(actualReps.s1), s2_reps: Number(actualReps.s2), s3_reps: Number(actualReps.s3), top_weight: preview?.w3 } : { weight, reps, s1: ohpSets.s1, s2: ohpSets.s2, s3: ohpSets.s3 }, 
            memo: memo 
        }),
      });
      if (res.ok) {
        showAlert("Workout Complete", "Great job! Your workout has been recorded.", () => {
            window.location.reload();
        });
      }
    } catch(e) {
        showAlert("Error", "Failed to save workout.");
    } finally { 
        setIsSaving(false); 
    }
  };

  const handleSaveConfig = async () => {
    setLoading(true);
    try { 
        await fetch(`${API_URL}/api/config`, { method: "POST", credentials: 'include', headers: { "Content-Type": "application/json" }, body: JSON.stringify(settingsForm) }); 
        showAlert("Success", "Settings saved successfully."); setConfig(settingsForm); 
    } catch(e) {} finally { setLoading(false); }
  };

  const handleUpdateLog = async () => {
      if (!editForm) return;

      const is531 = viewLog?.exercise_type === "531";
      const d = editForm.data;
      if (is531) {
          if (d.tm <= 0) { showAlert("Error", "TM must be greater than 0"); return; }
          if (d.s1_reps <= 0 || d.s2_reps <= 0 || d.s3_reps <= 0) { showAlert("Error", "Reps must be greater than 0"); return; }
      } else {
          if (d.weight <= 0) { showAlert("Error", "Weight must be greater than 0"); return; }
          if (viewLog?.exercise_code === 'DL') {
              if (d.reps <= 0) { showAlert("Error", "Reps must be greater than 0"); return; }
          } else {
              if (d.s1 <= 0 || d.s2 <= 0 || d.s3 <= 0) { showAlert("Error", "Reps must be greater than 0"); return; }
          }
      }

      try {
          const res = await fetch(`${API_URL}/api/workouts`, {
              method: "PUT", credentials: 'include', headers: { "Content-Type": "application/json" },
              body: JSON.stringify(editForm)
          });
          if (res.ok) {
              setHistoryLogs(prev => prev.map(log => log.id === editForm.id ? editForm : log));
              setViewLog(editForm); 
              setIsEditing(false); 
              showAlert("Updated", "Record updated successfully.");
          }
      } catch(e) { showAlert("Error", "Failed to update record."); }
  };

  const handleDeleteLog = () => {
      if (!viewLog) return;
      showConfirm("Delete Record", "Are you sure you want to delete this workout?", async () => {
          try {
              const res = await fetch(`${API_URL}/api/workouts?id=${viewLog.id}`, { method: "DELETE", credentials: 'include' });
              if (res.ok) {
                  setHistoryLogs(prev => prev.filter(l => l.id !== viewLog.id)); 
                  closeDetailModal(); 
                  closeAlert();
              }
          } catch(e) { showAlert("Error", "Failed to delete."); }
      });
  };

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
    <div className="flex flex-col min-h-dvh bg-background text-foreground font-sans selection:bg-primary/30 overflow-x-hidden">
      
      {/* --- [MODIFIED] Custom Alert Modal (History Modal Style) --- */}
      {alertState.isOpen && (
          <div 
             className={`fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm transition-opacity duration-300 ${isAlertClosing ? 'opacity-0' : 'opacity-100'}`} 
             onClick={closeAlert}
          >
              <div 
                 className={`w-full max-w-xs bg-card border border-white/10 rounded-[32px] p-6 shadow-2xl transition-transform duration-300 ${isAlertClosing ? 'scale-90' : 'scale-100 animate-scale-up'}`} 
                 onClick={(e) => e.stopPropagation()}
              >
                  <div className="flex flex-col items-center text-center gap-4">
                      <div className="w-12 h-12 bg-secondary/50 rounded-full flex items-center justify-center text-primary">
                          <Icons.Alert/>
                      </div>
                      <div>
                          <h3 className="text-xl font-black mb-1">{alertState.title}</h3>
                          <p className="text-sm font-bold text-muted-foreground leading-relaxed">{alertState.message}</p>
                      </div>
                      <div className="flex gap-3 w-full mt-2">
                          {alertState.isConfirmType ? (
                              <>
                                  <Button onClick={closeAlert} className="flex-1 rounded-2xl bg-secondary text-foreground font-bold h-12">Cancel</Button>
                                  <Button onClick={alertState.onConfirm} className="flex-1 rounded-2xl bg-primary text-white font-bold h-12">Confirm</Button>
                              </>
                          ) : (
                              <Button onClick={() => { if(alertState.onConfirm) alertState.onConfirm(); closeAlert(); }} className="w-full rounded-2xl bg-primary text-white font-bold h-12">OK</Button>
                          )}
                      </div>
                  </div>
              </div>
          </div>
      )}

      <div className="pt-[env(safe-area-inset-top)] px-6 pb-2 z-20 sticky top-0 bg-background/80 backdrop-blur-xl border-b border-white/5 transition-all">
        <div className="flex justify-between items-center h-16"><h1 className="text-3xl font-black tracking-tighter">{activeTab === 'record' ? 'Workout' : activeTab === 'history' ? 'History' : 'Settings'}</h1></div>
      </div>

      <div className="flex-1 pt-4 pb-40 space-y-8">
        {activeTab !== 'settings' && (
            <div className="w-full overflow-x-auto py-4 scrollbar-hide">
                <div className="flex gap-3 px-6 w-max"> 
                    {displayOrder.map((code) => {
                    const isActive = selectedCode === code;
                    return ( <button key={code} onClick={() => handleExerciseChange(code)} className={`shrink-0 px-7 py-4 rounded-[24px] font-black text-xl tracking-tight transition-all duration-300 active:scale-95 ${isActive ? 'bg-primary text-white scale-105' : 'bg-secondary text-muted-foreground'}`}>{code}</button> )})}
                </div>
            </div>
        )}

        {activeTab === "record" && (
          <div key={selectedCode} className="px-6 space-y-6 animate-slide-up">
             {currentLog && currentLog.workout_date && (<div className="bg-card rounded-[24px] p-5 shadow-sm border border-white/5 flex items-center justify-between animate-fade-in"><div><div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1.5 flex items-center gap-2">Last Session <span className="w-1 h-1 rounded-full bg-muted-foreground/50"/> {currentLog.workout_date}</div><div className="flex items-center gap-3">{currentLog.exercise_type === "531" ? (<><span className="bg-primary/10 text-primary px-2 py-0.5 rounded text-xs font-bold">{currentLog.data.session?.toUpperCase()} Type</span><div className="text-sm font-medium text-foreground">TM <span className="font-bold">{currentLog.data.tm}</span><span className="mx-1.5 text-muted-foreground/50">|</span>AMRAP <span className="font-bold text-primary">{currentLog.data.s3_reps}</span></div></>) : (<div className="text-sm font-medium">{currentLog.data.weight}kg <span className="text-muted-foreground mx-1">×</span> {currentLog.exercise_code === 'DL' ? currentLog.data.reps : currentLog.data.s3}</div>)}</div></div></div>)}
             <div className="bg-card rounded-[32px] p-6 flex items-center justify-between shadow-sm border border-white/5 cursor-pointer active:scale-[0.98] transition-all duration-200 relative"><div><div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Date</div><div className="text-2xl font-black font-variant-numeric">{todayDate}</div></div><div className="w-12 h-12 rounded-full bg-secondary dark:bg-white/5 flex items-center justify-center text-primary"><Icons.Calendar/></div><Input ref={dateInputRef} type="date" value={todayDate} onChange={(e) => setTodayDate(e.target.value)} className="absolute inset-0 w-full h-full opacity-0 z-50 cursor-pointer"/></div>
             {is531 && preview ? (
                <>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-card rounded-[32px] p-6 flex flex-col items-center justify-center relative shadow-sm border border-white/5"><span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">TM</span><div className="flex items-center justify-center gap-1"><Input type="number" value={tm.toString()} onChange={(e) => setTm(Number(e.target.value))} className="w-24 text-center !bg-transparent !border-none !shadow-none !ring-0 text-3xl font-black p-0 text-foreground"/><span className="text-sm font-bold text-muted-foreground mt-2">kg</span></div></div>
                        <div className="bg-card rounded-[32px] p-6 flex flex-col items-center justify-center relative shadow-sm border border-white/5 cursor-pointer active:scale-[0.98] transition-all duration-200">
                            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Session</span>
                            <div className="flex items-center gap-2 text-4xl font-black text-primary">
                                {session.toUpperCase()}
                                <Icons.ArrowDown/>
                            </div>
                            <select
                                value={session}
                                onChange={(e) => setSession(e.target.value as "a" | "b" | "c")}
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer appearance-none"
                            >
                                <option value="a">Type A (5/5/5+)</option>
                                <option value="b">Type B (3/3/3+)</option>
                                <option value="c">Type C (5/3/1+)</option>
                            </select>
                        </div>
                    </div>
                    
                    <div className="bg-card rounded-[32px] overflow-hidden shadow-sm border border-white/5">
                        {[{ label: 'Warmup 1', weight: preview.w1, reps: actualReps.s1, key: 's1' as const, target: preview.s1_target }, { label: 'Warmup 2', weight: preview.w2, reps: actualReps.s2, key: 's2' as const, target: preview.s2_target }].map((set, i) => (
                        <div 
                            key={i} 
                            onClick={() => doneSets[set.key] && toggleDone(set.key)} 
                            className={`p-6 flex items-center justify-between border-b border-border/50 transition-all duration-200 ${doneSets[set.key] ? 'bg-green-500/10 cursor-pointer' : ''}`}
                        >
                            <div><div className={`text-[10px] font-bold uppercase mb-1 ${doneSets[set.key] ? 'text-green-500' : 'text-muted-foreground'}`}>{set.label}</div><div className={`text-3xl font-black tracking-tight ${doneSets[set.key] ? 'text-green-500' : 'text-foreground'}`}>{set.weight}<span className="text-lg font-medium ml-1 opacity-60">kg</span></div></div>
                            <div onClick={(e) => e.stopPropagation()}><GhostInput value={set.reps} placeholder={set.target} onChange={(e:any) => handleRepsChange(set.key, Number(e.target.value), '531')} isDone={doneSets[set.key]} onAutoComplete={() => toggleDone(set.key)} /></div>
                        </div>))}
                        
                        <div 
                            onClick={() => doneSets.s3 && toggleDone('s3')} 
                            className={`p-6 flex items-center justify-between transition-all duration-200 ${doneSets.s3 ? 'bg-green-500/10 cursor-pointer' : 'bg-primary/5'}`}
                        >
                            <div><div className={`text-[10px] font-black uppercase mb-1 tracking-widest ${doneSets.s3 ? 'text-green-500' : 'text-primary'}`}>TOP SET (AMRAP)</div><div className={`text-4xl font-black tracking-tight ${doneSets.s3 ? 'text-green-500' : 'text-primary'}`}>{preview.w3}<span className="text-xl opacity-60 ml-1">kg</span></div></div>
                            <div onClick={(e) => e.stopPropagation()}><GhostInput value={actualReps.s3} placeholder="?" onChange={(e:any) => handleRepsChange('s3', Number(e.target.value), '531')} isDone={doneSets.s3} onAutoComplete={() => toggleDone('s3')} className={doneSets.s3 ? 'text-green-500' : 'text-primary'}/></div>
                        </div>
                    </div>
                </>
             ) : (
                <>
                    <div className="bg-card rounded-[32px] p-6 flex flex-col items-center justify-center relative shadow-sm border border-white/5"><span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Target Weight</span><div className="flex items-center justify-center gap-2"><Input type="number" value={weight === 0 ? "" : weight.toString()} placeholder="0" onChange={(e) => setWeight(Number(e.target.value))} className="w-40 h-20 text-center !bg-transparent !border-none !shadow-none !ring-0 text-4xl font-black leading-none p-0 text-foreground placeholder:text-muted-foreground/30"/><span className="text-xl font-bold text-muted-foreground mt-4 shrink-0">kg</span></div></div>
                    <div className="bg-card rounded-[32px] overflow-hidden shadow-sm border border-white/5">
                        {selectedCode === "DL" ? (
                            <div onClick={() => doneSets.s1 && toggleDone('s1')} className={`p-6 flex items-center justify-between transition-all duration-200 ${doneSets.s1 ? 'bg-green-500/10 cursor-pointer' : ''}`}>
                                <span className="font-bold text-lg">Target Reps</span>
                                <div onClick={(e) => e.stopPropagation()}><GhostInput value={reps} placeholder="5" onChange={(e:any) => handleRepsChange('s1', Number(e.target.value), 'custom_dl')} isDone={doneSets.s1} onAutoComplete={() => toggleDone('s1')} /></div>
                            </div>
                        ) : (
                            ['s1','s2','s3'].map((key, i) => (
                                <div key={key} onClick={() => doneSets[key as keyof typeof doneSets] && toggleDone(key as any)} className={`p-6 flex items-center justify-between border-b border-border/50 last:border-none transition-all duration-200 ${doneSets[key as keyof typeof doneSets] ? 'bg-green-500/10 cursor-pointer' : ''}`}>
                                    <span className={`text-[10px] font-bold uppercase tracking-widest ${doneSets[key as keyof typeof doneSets] ? 'text-green-500' : 'text-muted-foreground'}`}>Set {i+1}</span>
                                    <div onClick={(e) => e.stopPropagation()}><GhostInput value={ohpSets[key as keyof typeof ohpSets]} placeholder="5" onChange={(e:any) => handleRepsChange(key as any, Number(e.target.value), 'custom')} isDone={doneSets[key as keyof typeof doneSets]} onAutoComplete={() => toggleDone(key as any)} /></div>
                                </div>
                            ))
                        )}
                    </div>
                </>
             )}
             <div className="bg-card rounded-[32px] p-6 shadow-sm border border-white/5 relative"><span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2 block">Memo</span><textarea value={memo} onChange={(e) => setMemo(e.target.value)} placeholder="Leave a note..." className="w-full bg-transparent border-none resize-none outline-none text-xl font-bold placeholder:text-muted-foreground/30 h-24 p-0 text-foreground"/></div>
             <Button className="w-full h-20 rounded-[32px] text-xl font-bold bg-primary text-white shadow-xl shadow-primary/20 active:scale-95 transition-all" onClick={handleSave} disabled={loading || isSaving}>{isSaving ? "Saving..." : "Complete Workout"}</Button>
          </div>
        )}

        {activeTab === "history" && (
          <div key={`hist-${selectedCode}`} className="px-6 space-y-4 animate-slide-up pb-20">
             {historyLogs.map((log) => (
                 <div key={log.id} onClick={() => handleOpenLog(log)} className="bg-card p-6 rounded-[32px] flex items-center justify-between shadow-sm active:scale-[0.98] transition-transform cursor-pointer border border-white/5">
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
        
        {activeTab === "settings" && (
             <div className="px-6 space-y-6 animate-slide-up"><div className="bg-card rounded-[32px] overflow-hidden shadow-sm border border-white/5"><div className="p-6 border-b border-border/50 flex justify-between items-center"><span className="font-bold text-lg">Body Weight</span><div className="w-24 h-14"><GhostInput value={settingsForm.body_weight} onChange={(e:any) => setSettingsForm({...settingsForm, body_weight: Number(e.target.value)})} /></div></div><div className="p-6 border-b border-border/50 flex justify-between items-center"><span className="font-bold text-lg">Standard Inc</span><div className="w-24 h-14"><GhostInput value={settingsForm.unit_standard} onChange={(e:any) => setSettingsForm({...settingsForm, unit_standard: Number(e.target.value)})} /></div></div><div className="p-6 flex justify-between items-center"><span className="font-bold text-lg">Pull-up Inc</span><div className="w-24 h-14"><GhostInput value={settingsForm.unit_pullup} onChange={(e:any) => setSettingsForm({...settingsForm, unit_pullup: Number(e.target.value)})} /></div></div><div className="p-6 border-t border-border/50"><span className="font-bold text-lg mb-4 block">Exercise Order</span><Reorder.Group axis="y" values={displayOrder} onReorder={handleReorder} className="space-y-2">{displayOrder.map((code) => (<Reorder.Item key={code} value={code} className="flex items-center justify-between bg-secondary/50 rounded-2xl p-4 shadow-sm active:scale-[0.98] active:bg-secondary cursor-grab active:cursor-grabbing border border-white/5 select-none touch-none"><span className="text-xl font-black">{code}</span><div className="p-2 cursor-grab active:cursor-grabbing"><Icons.Grip/></div></Reorder.Item>))}</Reorder.Group></div></div><Button className="w-full h-16 rounded-[24px] font-bold text-lg" onClick={handleSaveConfig}>Save Changes</Button></div>
        )}
      </div>

      <div className="fixed bottom-8 left-0 right-0 px-8 z-50 flex justify-center pointer-events-none"><div className="pointer-events-auto bg-background/80 backdrop-blur-2xl border border-white/10 rounded-full shadow-2xl p-2.5 flex items-center gap-4"><Tabs value={activeTab} onValueChange={setActiveTab} className="w-auto"><TabsList className="bg-transparent h-auto p-0 flex gap-4">{['record', 'history', 'settings'].map(tab => (<TabsTrigger key={tab} value={tab} className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 shadow-none border-none active:scale-90 data-[state=active]:bg-primary data-[state=active]:text-white text-muted-foreground data-[state=active]:shadow-[0_0_15px_rgba(var(--primary),0.5)]`}>{tab === 'record' && <Icons.Record/>}{tab === 'history' && <Icons.History/>}{tab === 'settings' && <Icons.Settings/>}</TabsTrigger>))}</TabsList></Tabs></div></div>

      {viewLog && editForm && (
        <div className={`fixed inset-0 z-[60] flex items-center justify-center p-6 bg-black/40 backdrop-blur-md transition-opacity duration-300 ${isClosing ? 'opacity-0' : 'opacity-100'}`} onClick={closeDetailModal}>
            <div className={`w-full max-w-sm bg-card rounded-[40px] p-8 shadow-2xl transition-transform duration-300 ${isClosing ? 'scale-90' : 'scale-100 animate-scale-up'}`} onClick={(e) => e.stopPropagation()}>
                
                <div className="flex justify-between items-start mb-6">
                    <div className="flex-1">
                        <h2 className="text-3xl font-black tracking-tight">{viewLog.exercise_code}</h2>
                        {isEditing ? (
                            <input 
                                type="date"
                                className="bg-transparent text-sm font-bold text-muted-foreground border-b border-border/50 outline-none w-auto mt-1"
                                value={editForm.workout_date}
                                onChange={(e) => setEditForm({...editForm, workout_date: e.target.value})}
                            />
                        ) : (
                            <p className="text-sm font-bold text-muted-foreground">{viewLog.workout_date}</p>
                        )}
                    </div>
                    
                    <div className="flex gap-2">
                        {isEditing ? (
                            <>
                                <button onClick={() => setIsEditing(false)} className="w-10 h-10 bg-secondary rounded-full flex items-center justify-center text-muted-foreground"><Icons.X/></button>
                                <button onClick={handleUpdateLog} className="w-10 h-10 bg-primary rounded-full flex items-center justify-center text-white shadow-lg"><Icons.Check/></button>
                            </>
                        ) : (
                            <>
                                <button onClick={handleDeleteLog} className="w-10 h-10 bg-red-500/10 rounded-full flex items-center justify-center text-red-500 hover:bg-red-500/20"><Icons.Trash/></button>
                                <button onClick={() => setIsEditing(true)} className="w-10 h-10 bg-secondary rounded-full flex items-center justify-center text-foreground hover:bg-secondary/80"><Icons.Pencil/></button>
                                <button onClick={closeDetailModal} className="w-10 h-10 bg-secondary rounded-full flex items-center justify-center text-muted-foreground ml-2">✕</button>
                            </>
                        )}
                    </div>
                </div>
                
                <div className={`space-y-6 ${isEditing ? 'opacity-100' : 'opacity-90'}`}>
                    
                    {viewLog.exercise_type === "531" && (
                        <div className="grid grid-cols-2 gap-2">
                            <div className="bg-secondary/50 rounded-2xl p-3 flex flex-col items-center justify-center border border-white/5 relative">
                                <span className="text-[9px] font-bold text-muted-foreground uppercase">Session</span>
                                <span className="text-xl font-black text-primary">{editForm.data.session?.toUpperCase()}</span>
                                {isEditing && (
                                    <select
                                        value={editForm.data.session}
                                        onChange={(e) => setEditForm({...editForm, data: {...editForm.data, session: e.target.value}})}
                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer appearance-none"
                                    >
                                        <option value="a">Type A</option>
                                        <option value="b">Type B</option>
                                        <option value="c">Type C</option>
                                    </select>
                                )}
                            </div>
                            <div className="bg-secondary/50 rounded-2xl p-3 flex flex-col items-center justify-center border border-white/5 relative">
                                <span className="text-[9px] font-bold text-muted-foreground uppercase">TM</span>
                                <span className="text-xl font-black">{editForm.data.tm}</span>
                                {isEditing && (
                                    <Input 
                                        type="number" 
                                        value={editForm.data.tm === 0 ? "" : editForm.data.tm}
                                        placeholder="0"
                                        onChange={(e) => setEditForm({...editForm, data: {...editForm.data, tm: Number(e.target.value)}})}
                                        className="absolute inset-0 opacity-0 cursor-pointer h-full"
                                    />
                                )}
                            </div>
                        </div>
                    )}

                    <div className="space-y-2">
                        {getHistoricalSets(isEditing ? editForm : viewLog).map((set, i) => {
                            const currentValue = set.isTop ? editForm.data.s3_reps : (i===0 ? editForm.data.s1_reps : editForm.data.s2_reps);
                            return (
                            <div key={i} className={`flex justify-between items-center p-4 rounded-[20px] ${set.isTop ? 'bg-primary/10 text-primary' : 'bg-secondary/50'}`}>
                                <span className="text-xs font-bold uppercase tracking-wider opacity-70">{set.label}</span>
                                <div className="flex items-baseline gap-1">
                                    <span className="text-xl font-black">{set.weight}</span>
                                    <span className="text-sm font-bold opacity-70">kg</span>
                                    <span className="text-lg font-bold mx-1 opacity-50">×</span>
                                    
                                    {isEditing ? (
                                        <div className="w-12 h-8 relative">
                                                <Input 
                                                    type="number" 
                                                    value={currentValue === 0 ? "" : currentValue}
                                                    placeholder="?"
                                                    onChange={(e) => {
                                                        const val = Number(e.target.value);
                                                        const newData = {...editForm.data};
                                                        if (set.isTop) newData.s3_reps = val;
                                                        else if (i===0) newData.s1_reps = val;
                                                        else newData.s2_reps = val;
                                                        setEditForm({...editForm, data: newData});
                                                    }}
                                                    className="w-full h-full text-center text-xl font-black bg-white/10 border-none p-0 placeholder:text-muted-foreground/30"
                                                />
                                        </div>
                                    ) : (
                                        <span className="text-xl font-black">{set.reps}</span>
                                    )}
                                </div>
                            </div>
                        )})}
                    </div>

                    {viewLog.exercise_type !== "531" && isEditing && (
                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-secondary/30 rounded-2xl p-3">
                                <span className="text-[10px] block mb-1">Weight</span>
                                <Input type="number" 
                                value={editForm.data.weight === 0 ? "" : editForm.data.weight}
                                placeholder="0"
                                onChange={(e) => setEditForm({...editForm, data: {...editForm.data, weight: Number(e.target.value)}})} className="bg-transparent text-xl font-black border-none text-center h-8 placeholder:text-muted-foreground/30" />
                            </div>
                            <div className="bg-secondary/30 rounded-2xl p-3">
                                <span className="text-[10px] block mb-1">Reps/Set3</span>
                                {(() => {
                                    const val = viewLog.exercise_code==='DL' ? editForm.data.reps : editForm.data.s3;
                                    return (
                                        <Input type="number" 
                                        value={val === 0 ? "" : val}
                                        placeholder="0"
                                        onChange={(e) => {
                                            const v = Number(e.target.value);
                                            const newData = {...editForm.data};
                                            if (viewLog.exercise_code==='DL') newData.reps = v; else newData.s3 = v;
                                            setEditForm({...editForm, data: newData});
                                        }} className="bg-transparent text-xl font-black border-none text-center h-8 placeholder:text-muted-foreground/30" />
                                    );
                                })()}
                            </div>
                        </div>
                    )}
                    
                    <div className="mt-4 p-6 bg-secondary/30 rounded-[24px]">
                        <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest block mb-2">Memo</span>
                        {isEditing ? (
                            <textarea
                                value={editForm.memo}
                                onChange={(e) => setEditForm({...editForm, memo: e.target.value})}
                                className="w-full bg-transparent border-b border-border/50 resize-none outline-none text-lg font-medium h-24 p-0 text-foreground"
                            />
                        ) : (
                            <p className="text-lg font-medium whitespace-pre-wrap">{viewLog.memo || "-"}</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
      )}
    </div>
  );
}