import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

// 1. 데이터 타입 정의 (백엔드 Go 구조체와 맞춤)
interface WorkoutSet {
  set_no: number;
  weight: number;
  reps: number;
  rpe: number;
}

interface Exercise {
  exercise: string;
  sets: WorkoutSet[];
}

interface WorkoutLog {
  id: number;
  workout_date: string;
  title: string;
  condition: string;
  workout_data: Exercise[]; // JSON 데이터가 배열로 들어옴
}

// 2. 데이터 가져오기 (비동기 함수)
// 이 함수는 브라우저가 아니라 'Next.js 서버'에서 실행됩니다.
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

async function getWorkouts() {
  console.log("Fetching from:", API_URL); // 디버깅용 로그
  const res = await fetch(`${API_URL}/workouts`, {
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error("데이터를 가져오는데 실패했습니다.");
  }

  return res.json();
}

// 3. 메인 페이지 컴포넌트
export default async function Home() {
  const workouts: WorkoutLog[] = await getWorkouts();

  return (
    <main className="min-h-screen bg-slate-50 p-4">
      <div className="max-w-md mx-auto space-y-6">
        <h1 className="text-2xl font-bold text-slate-900 mb-6">
          💪 오늘의 운동 기록
        </h1>

        {/* 운동 일지 리스트 반복 출력 */}
        {workouts.map((log) => (
          <Card key={log.id} className="shadow-lg border-slate-200">
            <CardHeader className="bg-white pb-3">
              <div className="flex justify-between items-center mb-1">
                <span className="text-sm text-slate-500">
                  {new Date(log.workout_date).toLocaleDateString()}
                </span>
                <Badge variant={log.condition === "Good" ? "default" : "destructive"}>
                  {log.condition}
                </Badge>
              </div>
              <CardTitle className="text-xl">{log.title}</CardTitle>
            </CardHeader>
            
            <CardContent className="pt-4 space-y-4">
              {/* 종목별 반복 */}
              {log.workout_data.map((exercise, idx) => (
                <div key={idx} className="bg-slate-100 rounded-lg p-3">
                  <h3 className="font-semibold text-slate-700 mb-2">
                    {exercise.exercise}
                  </h3>
                  
                  {/* 세트별 데이터 표 */}
                  <div className="space-y-1">
                    {exercise.sets.map((set, sIdx) => (
                      <div key={sIdx} className="flex justify-between text-sm">
                        <span className="text-slate-600 w-8">{set.set_no}세트</span>
                        <span className="font-bold w-16 text-right">{set.weight}kg</span>
                        <span className="text-slate-600 w-12 text-right">{set.reps}회</span>
                        <span className={`w-16 text-right font-medium ${set.rpe >= 9 ? 'text-red-600' : 'text-blue-600'}`}>
                          RPE {set.rpe}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        ))}
      </div>
    </main>
  );
}