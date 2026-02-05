export interface UserConfig {
  id: number;
  body_weight: number;
  unit_standard: number;
  unit_pullup: number;
  exercise_order?: string;
}

export interface WorkoutLog {
  id: number;
  workout_date: string;
  exercise_code: string;
  exercise_name: string;
  exercise_type: string;
  data: any;
  memo: string;
}

export interface DashboardResponse {
  config: UserConfig;
  sheets: Record<string, WorkoutLog>;
}