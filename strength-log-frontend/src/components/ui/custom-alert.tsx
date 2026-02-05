"use client";
import { Button } from "@/components/ui/button";
import { Icons } from "@/components/icons";

interface CustomAlertProps {
  isOpen: boolean;
  isClosing: boolean;
  title: string;
  message: string;
  isConfirmType?: boolean;
  onConfirm?: () => void;
  onClose: () => void;
}

export const CustomAlert = ({ isOpen, isClosing, title, message, isConfirmType, onConfirm, onClose }: CustomAlertProps) => {
  if (!isOpen) return null;
  return (
    <div className={`fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm transition-opacity duration-300 ${isClosing ? 'opacity-0' : 'opacity-100'}`} onClick={onClose}>
        <div className={`w-full max-w-xs bg-card border border-white/10 rounded-[32px] p-6 shadow-2xl transition-transform duration-300 ${isClosing ? 'scale-90' : 'scale-100 animate-scale-up'}`} onClick={(e) => e.stopPropagation()}>
            <div className="flex flex-col items-center text-center gap-4">
                <div className="w-12 h-12 bg-secondary/50 rounded-full flex items-center justify-center text-primary"><Icons.Alert/></div>
                <div><h3 className="text-xl font-black mb-1">{title}</h3><p className="text-sm font-bold text-muted-foreground leading-relaxed">{message}</p></div>
                <div className="flex gap-3 w-full mt-2">
                    {isConfirmType ? (
                        <>
                            <Button onClick={onClose} className="flex-1 rounded-2xl bg-secondary text-foreground font-bold h-12">Cancel</Button>
                            <Button onClick={onConfirm} className="flex-1 rounded-2xl bg-primary text-white font-bold h-12">Confirm</Button>
                        </>
                    ) : (
                        <Button onClick={() => { if(onConfirm) onConfirm(); onClose(); }} className="w-full rounded-2xl bg-primary text-white font-bold h-12">OK</Button>
                    )}
                </div>
            </div>
        </div>
    </div>
  );
};