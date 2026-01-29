"use client"; // 👈 중요: 얘는 클라이언트 컴포넌트입니다.

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function WorkoutInput() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [condition, setCondition] = useState("Good");
  const [isLoading, setIsLoading] = useState(false);

  const handleSave = async () => {
    if (!title) {
      alert("운동 제목을 입력해주세요!");
      return;
    }

    setIsLoading(true);

    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
      
      // 테스트를 위해 'workout_data'에는 임시 데이터를 넣어서 보냅니다.
      // 나중에 이 부분을 복잡한 폼으로 교체하면 됩니다.
      const payload = {
        title: title,
        condition: condition,
        workout_date: new Date().toISOString(),
        workout_data: [
          {
            exercise: "테스트 스쿼트",
            sets: [
              { set_no: 1, weight: 100, reps: 5, rpe: 8 },
              { set_no: 2, weight: 100, reps: 5, rpe: 9 }
            ]
          }
        ]
      };

      const res = await fetch(`${API_URL}/workouts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setTitle(""); // 입력창 초기화
        router.refresh(); // 👈 핵심: 서버 컴포넌트(리스트)를 새로고침해서 갱신된 데이터를 보여줍니다.
      } else {
        alert("저장 실패 ㅠㅠ 백엔드 로그를 확인하세요.");
      }
    } catch (e) {
      console.error(e);
      alert("서버 연결 오류!");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="mb-8 border-slate-300 bg-white">
      <CardContent className="pt-6 flex gap-2 items-center">
        <Input 
          placeholder="오늘의 운동 제목 (예: 하체 뿌시기)" 
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="flex-1"
        />
        
        <Select value={condition} onValueChange={setCondition}>
          <SelectTrigger className="w-[100px]">
            <SelectValue placeholder="컨디션" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Good">Good 😊</SelectItem>
            <SelectItem value="Bad">Bad 😫</SelectItem>
          </SelectContent>
        </Select>

        <Button onClick={handleSave} disabled={isLoading}>
          {isLoading ? "저장 중..." : "기록 저장"}
        </Button>
      </CardContent>
    </Card>
  );
}