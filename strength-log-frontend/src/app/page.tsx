"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
// [Fix] Reorder 추가
import { Reorder, motion } from "framer-motion";
import { Icons } from "@/components/icons";
import { GhostInput } from "@/components/ui/ghost-input";
import { SettingSection } from "@/components/dashboard/setting-section";
import { useDashboard } from "@/hooks/use-dashboard";

export default function Dashboard() {
  const {
    loading, isSaving, historyLoading, historyLogs, activeTab, setActiveTab,
    viewLog, isEditing, editForm, isClosing, isAlertClosing,
    selectedCode, todayDate, tm, session, actualReps, doneSets, weight, reps, ohpSets, memo,
    settingsForm, displayOrder, alertState, dateInputRef, preview,
    
    currentLog,
    is531,
    
    setTodayDate, setTm, setSession, setSettingsForm, setEditForm, setIsEditing, setMemo, setWeight, setReps, setOhpSets,
    handleExerciseChange, handleReorder, handleSave, handleSaveConfig, 
    handleUpdateLog, handleDeleteLog, handleOpenLog, closeDetailModal,
    toggleDone, handleRepsChange, closeAlert, getHistoricalSets
  } = useDashboard();

  if (loading) return <div className="flex h-dvh items-center justify-center bg-background text-primary font-black tracking-widest text-2xl animate-pulse">LOADING...</div>;

  return (
    <div className="flex flex-col min-h-dvh bg-background text-foreground font-sans selection:bg-primary/30 overflow-x-hidden">
      
      {/* --- [Global] Custom Alert Modal --- */}
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

      {/* --- Header --- */}
      <div className="pt-[env(safe-area-inset-top)] px-6 pb-2 z-20 sticky top-0 bg-background/80 backdrop-blur-xl border-b border-white/5 transition-all">
        <div className="flex justify-between items-center h-16"><h1 className="text-3xl font-black tracking-tighter">{activeTab === 'record' ? 'Workout' : activeTab === 'history' ? 'History' : 'Settings'}</h1></div>
      </div>

      <div className="flex-1 pt-4 pb-40 space-y-8">
        
        {/* --- Exercise Category Tabs (Record/History only) --- */}
        {activeTab !== 'settings' && (
            <div className="w-full overflow-x-auto py-4 scrollbar-hide">
                <div className="flex gap-3 px-6 w-max"> 
                    {displayOrder.map((code) => {
                    const isActive = selectedCode === code;
                    return ( <button key={code} onClick={() => handleExerciseChange(code)} className={`shrink-0 px-7 py-4 rounded-[24px] font-black text-xl tracking-tight transition-all duration-300 active:scale-95 ${isActive ? 'bg-primary text-white scale-105' : 'bg-secondary text-muted-foreground'}`}>{code}</button> )})}
                </div>
            </div>
        )}

        {/* --- TAB: RECORD --- */}
        {activeTab === "record" && (
          <div key={selectedCode} className="px-6 space-y-6 animate-slide-up">
             {/* Last Session Info */}
             {currentLog && currentLog.workout_date && (<div className="bg-card rounded-[24px] p-5 shadow-sm border border-white/5 flex items-center justify-between animate-fade-in"><div><div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1.5 flex items-center gap-2">Last Session <span className="w-1 h-1 rounded-full bg-muted-foreground/50"/> {currentLog.workout_date}</div><div className="flex items-center gap-3">{currentLog.exercise_type === "531" ? (<><span className="bg-primary/10 text-primary px-2 py-0.5 rounded text-xs font-bold">{currentLog.data.session?.toUpperCase()} Type</span><div className="text-sm font-medium text-foreground">TM <span className="font-bold">{currentLog.data.tm}</span><span className="mx-1.5 text-muted-foreground/50">|</span>AMRAP <span className="font-bold text-primary">{currentLog.data.s3_reps}</span></div></>) : (<div className="text-sm font-medium">{currentLog.data.weight}kg <span className="text-muted-foreground mx-1">×</span> {currentLog.exercise_code === 'DL' ? currentLog.data.reps : currentLog.data.s3}</div>)}</div></div></div>)}
             
             {/* Date Picker */}
             <div className="bg-card rounded-[32px] p-6 flex items-center justify-between shadow-sm border border-white/5 cursor-pointer active:scale-[0.98] transition-all duration-200 relative"><div><div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Date</div><div className="text-2xl font-black font-variant-numeric">{todayDate}</div></div><div className="w-12 h-12 rounded-full bg-secondary dark:bg-white/5 flex items-center justify-center text-primary"><Icons.Calendar/></div><Input ref={dateInputRef} type="date" value={todayDate} onChange={(e) => setTodayDate(e.target.value)} className="absolute inset-0 w-full h-full opacity-0 z-50 cursor-pointer"/></div>
             
             {/* 531 Logic UI */}
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
                            <div onClick={(e) => e.stopPropagation()}>
                                <GhostInput 
                                    value={set.reps} 
                                    placeholder={set.target?.toString()} 
                                    onChange={(e:any) => handleRepsChange(set.key, Number(e.target.value), '531')} 
                                    isDone={doneSets[set.key]} 
                                    onAutoComplete={() => toggleDone(set.key)} 
                                />
                            </div>
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
                /* Custom Logic UI */
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
             
             {/* Memo & Save */}
             <div className="bg-card rounded-[32px] p-6 shadow-sm border border-white/5 relative"><span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2 block">Memo</span><textarea value={memo} onChange={(e) => setMemo(e.target.value)} placeholder="Leave a note..." className="w-full bg-transparent border-none resize-none outline-none text-xl font-bold placeholder:text-muted-foreground/30 h-24 p-0 text-foreground"/></div>
             <Button className="w-full h-20 rounded-[32px] text-xl font-bold bg-primary text-white shadow-xl shadow-primary/20 active:scale-95 transition-all" onClick={handleSave} disabled={loading || isSaving}>{isSaving ? "Saving..." : "Complete Workout"}</Button>
          </div>
        )}

        {/* --- TAB: HISTORY --- */}
        {activeTab === "history" && (
          <div key={`hist-${selectedCode}`} className="px-6 space-y-4 animate-slide-up pb-20">
             {/* Empty State */}
             {!historyLoading && historyLogs.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center animate-fade-in">
                    <div className="w-24 h-24 bg-secondary/50 rounded-full flex items-center justify-center mb-6 border border-white/5">
                        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground/50">
                            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z"/>
                        </svg>
                    </div>
                    <h3 className="text-xl font-black text-foreground mb-2">No History Yet</h3>
                    <p className="text-sm text-muted-foreground font-medium mb-8 max-w-[200px] leading-relaxed">
                        There are no workout records for <span className="text-primary font-bold">{selectedCode}</span> yet.
                    </p>
                    <Button 
                        onClick={() => setActiveTab("record")} 
                        className="rounded-[24px] px-8 py-6 text-lg font-bold bg-secondary text-foreground hover:bg-secondary/80 transition-all active:scale-95"
                    >
                        Start Workout
                    </Button>
                </div>
             ) : (
                 /* History List */
                 historyLogs.map((log) => (
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
                 ))
             )}
          </div>
        )}
        
        {/* --- TAB: SETTINGS --- */}
        {activeTab === "settings" && (
             <div className="px-6 space-y-2 animate-slide-up pb-32">
                <SettingSection title="Workout Parameters" icon={Icons.Scale} defaultOpen={true}>
                    <div className="space-y-6 mt-2">
                        {/* Body Weight */}
                        <div className="flex justify-between items-center">
                            <div>
                                <span className="font-bold text-lg block">Body Weight</span>
                                <span className="text-xs text-muted-foreground font-medium">For Pull-up calculations</span>
                            </div>
                            <div className="w-24 h-14"><GhostInput value={settingsForm.body_weight} onChange={(e:any) => setSettingsForm({...settingsForm, body_weight: Number(e.target.value)})} /></div>
                        </div>
                        
                        <div className="w-full h-px bg-border/50" />

                        {/* Standard Unit */}
                        <div className="flex justify-between items-center">
                            <div>
                                <span className="font-bold text-lg block">Standard Unit</span>
                                <span className="text-xs text-muted-foreground font-medium">Weight increment step</span>
                            </div>
                            <div className="w-24 h-14"><GhostInput value={settingsForm.unit_standard} onChange={(e:any) => setSettingsForm({...settingsForm, unit_standard: Number(e.target.value)})} /></div>
                        </div>

                        <div className="w-full h-px bg-border/50" />

                        {/* Pull-up Unit */}
                        <div className="flex justify-between items-center">
                            <div>
                                <span className="font-bold text-lg block">Pull-up Unit</span>
                                <span className="text-xs text-muted-foreground font-medium">Weighted Pull-up step</span>
                            </div>
                            <div className="w-24 h-14"><GhostInput value={settingsForm.unit_pullup} onChange={(e:any) => setSettingsForm({...settingsForm, unit_pullup: Number(e.target.value)})} /></div>
                        </div>
                    </div>
                </SettingSection>

                <SettingSection title="Exercise Arrangement" icon={Icons.List}>
                    <div className="mt-2">
                        <div className="mb-4 text-xs font-bold text-muted-foreground uppercase tracking-widest text-center">Drag to Reorder</div>
                        <Reorder.Group axis="y" values={displayOrder} onReorder={handleReorder} className="space-y-2">
                            {displayOrder.map((code) => (
                                <Reorder.Item key={code} value={code} className="flex items-center justify-between bg-secondary/30 rounded-2xl p-4 shadow-sm active:scale-[0.98] active:bg-secondary cursor-grab active:cursor-grabbing border border-white/5 select-none touch-none">
                                    <span className="text-xl font-black ml-2">{code}</span>
                                    <div className="p-2 cursor-grab active:cursor-grabbing text-muted-foreground">
                                        <Icons.Grip/>
                                    </div>
                                </Reorder.Item>
                            ))}
                        </Reorder.Group>
                    </div>
                </SettingSection>

                <div className="pt-4">
                    <Button className="w-full h-16 rounded-[24px] font-bold text-lg bg-primary text-white shadow-xl shadow-primary/20 active:scale-95 transition-all" onClick={handleSaveConfig}>
                        Save All Changes
                    </Button>
                </div>
             </div>
        )}
      </div>

      {/* --- Bottom Navigation Bar (Squircle Design) --- */}
      <div className="fixed bottom-8 left-0 right-0 px-6 z-50 flex justify-center pointer-events-none">
        <div className="pointer-events-auto bg-background/90 backdrop-blur-3xl border border-white/10 rounded-[24px] shadow-2xl p-1.5 flex items-center">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-auto">
            <TabsList className="bg-transparent h-auto p-0 flex gap-1 relative">
              {['record', 'history', 'settings'].map((tab) => {
                const isActive = activeTab === tab;
                return (
                  <TabsTrigger
                    key={tab}
                    value={tab}
                    className="relative w-16 h-12 rounded-[18px] flex items-center justify-center transition-all duration-300 border-none shadow-none text-muted-foreground data-[state=active]:text-white bg-transparent z-10 hover:bg-white/5"
                  >
                    {isActive && (
                      <motion.div
                        layoutId="active-tab-bg"
                        className="absolute inset-0 bg-primary rounded-[18px] shadow-[0_4px_20px_-2px_rgba(var(--primary),0.4)]"
                        transition={{ type: "spring", stiffness: 400, damping: 30 }}
                      />
                    )}
                    <div className="relative z-20 mix-blend-normal scale-90">
                        {tab === 'record' && <Icons.Record/>}
                        {tab === 'history' && <Icons.History/>}
                        {tab === 'settings' && <Icons.Settings/>}
                    </div>
                  </TabsTrigger>
                );
              })}
            </TabsList>
          </Tabs>
        </div>
      </div>

      {/* --- Detail Modal (View/Edit Log) --- */}
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