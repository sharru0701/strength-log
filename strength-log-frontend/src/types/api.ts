// src/types/api.ts

export interface UserConfig {
  id: number;
  body_weight: number;
  unit_standard: number;
  unit_pullup: number;
}

export interface WorkoutLog {
  id: number;
  workout_date: string;
  exercise_code: string;
  exercise_name: string;
  exercise_type: string; // "531" | "custom_dl" | "custom_ohp"
  data: any;             // JSON 데이터 (종목별로 다름)
  memo: string;
}

export interface DashboardResponse {
  config: UserConfig;
  sheets: Record<string, WorkoutLog>; // 예: { "SQ": { ... }, "DL": { ... } }
}