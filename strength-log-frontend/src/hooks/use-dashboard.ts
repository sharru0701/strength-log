import { useState, useEffect, useMemo, useRef } from "react";
import { UserConfig, WorkoutLog } from "@/types";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "";

export function useDashboard() {
  // ... (기존 State들: loading, config, sheets, ... settingsForm, dateInputRef 까지 동일) ...
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
  const [isAlertClosing, setIsAlertClosing] = useState(false);
  
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

  // ... (showAlert, closeAlert, closeDetailModal, handleOpenLog 함수들 동일) ...
  const showAlert = (title: string, message: string, onConfirm?: () => void) => {
      setAlertState({ isOpen: true, title, message, onConfirm, isConfirmType: false });
  };
  
  const showConfirm = (title: string, message: string, onConfirm: () => void) => {
      setAlertState({ isOpen: true, title, message, onConfirm, isConfirmType: true });
  };

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

  // --- [추가된 부분] Derived State (여기가 누락되어 에러 발생) ---
  const currentLog = sheets[selectedCode];
  const is531 = currentLog?.exercise_type === "531";

  // ... (toggleDone, handleRepsChange, initForm, handleExerciseChange, handleReorder, preview, getHistoricalSets 함수들 동일) ...
  const toggleDone = (key: 's1' | 's2' | 's3') => { 
      if (doneSets[key]) {
          setDoneSets(prev => ({ ...prev, [key]: false }));
          return;
      }
      // currentLog와 is531은 위에서 선언한 변수 사용
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
  
  const initForm = (code: string, log: WorkoutLog) => {
    const data = log.data; 
    setDoneSets({ s1: false, s2: false, s3: false }); 
    setMemo(""); 

    if (log.exercise_type === "531") { 
        setTm(data.tm || 100); 
        setSession(data.session || "a"); 
        setActualReps({ s1: 0, s2: 0, s3: 0 }); 
    } else if (log.exercise_type.startsWith("custom")) { 
        setWeight(data.weight || (code === "DL" ? 100 : 40)); 
        setOhpSets({s1:0,s2:0,s3:0}); 
        setReps(0); 
    }
  };

  const handleExerciseChange = (code: string) => { 
      setSelectedCode(code); 
      if (sheets[code]) initForm(code, sheets[code]); 
  };
  
  const handleReorder = (newOrder: string[]) => { 
      setDisplayOrder(newOrder); 
      setSettingsForm(prev => ({ ...prev, exercise_order: newOrder.join(",") })); 
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

  const getHistoricalSets = (log: WorkoutLog) => {
    if (!log || !log.data) return [];

    const { weight, reps, s1, s2, s3, tm, session, s1_reps, s2_reps, s3_reps, top_weight } = log.data;
    
    if (log.exercise_type === '531' && config) {
        const isPullUp = log.exercise_code === 'PU';
        const unit = isPullUp ? config.unit_pullup : config.unit_standard;
        const bw = config.body_weight;
        const calc = (r: number) => Math.max(0, Math.round((tm * r - (isPullUp ? bw : 0)) / unit) * unit);
        
        let r1 = 0.65, r2 = 0.75; 
        if (session === 'b') { r1 = 0.70; r2 = 0.80; } 
        if (session === 'c') { r1 = 0.75; r2 = 0.85; }
        
        return [ 
            { label: "Set 1", weight: calc(r1), reps: s1_reps }, 
            { label: "Set 2", weight: calc(r2), reps: s2_reps }, 
            { label: "Top Set", weight: top_weight, reps: s3_reps, isTop: true } 
        ];
    }
    if (s1 !== undefined && s2 !== undefined && s3 !== undefined) return [ { label: "Set 1", weight: weight, reps: s1 }, { label: "Set 2", weight: weight, reps: s2 }, { label: "Set 3", weight: weight, reps: s3, isTop: true } ];
    if (reps !== undefined) return [ { label: "Target Set", weight: weight, reps: reps, isTop: true } ];
    return [];
  };

  // ... (useEffect, handleSave, handleSaveConfig, handleUpdateLog, handleDeleteLog 동일) ...
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
                if (order.length > 0) { 
                    setDisplayOrder(order); 
                    if (!order.includes(selectedCode)) setSelectedCode(order[0]); 
                }
            }
        }
        setSheets(dashData.sheets);
        
        const firstCode = dashData.config?.exercise_order ? dashData.config.exercise_order.split(",")[0] : "SQ";
        if (dashData.sheets[firstCode]) initForm(firstCode, dashData.sheets[firstCode]);
        else setSelectedCode(firstCode); 
        
        setHistoryLoading(true);
        const histRes = await fetch(`${API_URL}/api/history?code=${selectedCode}`, { credentials: 'include' });
        if (histRes.ok) setHistoryLogs(await histRes.json() || []);
        
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
        const res = await fetch(`${API_URL}/api/history?code=${selectedCode}`, { credentials: 'include' });
        if (res.ok) setHistoryLogs(await res.json() || []);
      } catch (err) { console.error(err); } finally { setHistoryLoading(false); }
    };
    if (activeTab === 'history' || !loading) fetchHistory();
  }, [selectedCode, activeTab, loading]);

  const handleSave = async () => {
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

  return {
    loading, isSaving, historyLoading, config, sheets, historyLogs, activeTab, setActiveTab,
    viewLog, isEditing, editForm, isClosing, isAlertClosing,
    selectedCode, todayDate, tm, session, actualReps, doneSets, weight, reps, ohpSets, memo,
    settingsForm, displayOrder, alertState, dateInputRef, preview,
    
    // [중요] 계산된 값을 반환 객체에 추가
    currentLog,
    is531,
    
    setTodayDate, setTm, setSession, setActualReps, setWeight, setReps, setOhpSets, setMemo,
    setSettingsForm, setEditForm, setIsEditing, setSelectedCode, setDoneSets,
    
    handleExerciseChange, handleReorder, handleSave, handleSaveConfig, 
    handleUpdateLog, handleDeleteLog, handleOpenLog, closeDetailModal,
    toggleDone, handleRepsChange, closeAlert, showAlert, showConfirm,
    
    getHistoricalSets
  };
}