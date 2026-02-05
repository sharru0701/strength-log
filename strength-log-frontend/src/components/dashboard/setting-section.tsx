"use client";

import React, { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Icons } from "@/components/icons"; // 아이콘 컴포넌트 경로 확인 필요

interface SettingSectionProps {
  title: string;
  icon: React.ElementType; // 아이콘 컴포넌트를 prop으로 받음
  children: React.ReactNode; // 내부에 들어갈 컨텐츠
  defaultOpen?: boolean; // 초기 펼침 상태
}

export const SettingSection: React.FC<SettingSectionProps> = ({ 
  title, 
  icon: Icon, 
  children, 
  defaultOpen = false 
}) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="bg-card rounded-[32px] overflow-hidden border border-white/5 shadow-sm mb-4 transition-all">
      {/* 헤더 (클릭 시 토글) */}
      <button 
        onClick={() => setIsOpen(!isOpen)} 
        className="w-full flex items-center justify-between p-6 bg-secondary/20 active:bg-secondary/40 transition-colors"
      >
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-secondary/50 flex items-center justify-center text-foreground">
            <Icon />
          </div>
          <span className="text-lg font-bold">{title}</span>
        </div>
        {/* 화살표 회전 애니메이션 */}
        <div className={`transition-transform duration-300 ${isOpen ? 'rotate-180' : ''} text-muted-foreground`}>
            <Icons.ChevronDown />
        </div>
      </button>
      
      {/* 본문 (애니메이션 적용) */}
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.04, 0.62, 0.23, 0.98] }}
          >
            <div className="p-6 pt-2 border-t border-border/50">
                {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};