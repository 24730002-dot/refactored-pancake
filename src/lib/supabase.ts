import { createClient } from '@supabase/supabase-js';

// 환경 변수를 안전하게 가져오는 함수
const getEnvVar = (key: string, fallback: string): string => {
  try {
    // @ts-ignore
    const envValue = import.meta?.env?.[key];
    if (envValue) {
      return envValue;
    }
  } catch (e) {
    // 환경 변수 접근 실패 시 fallback 사용
  }
  return fallback;
};

// Supabase 설정
// 프로덕션 배포 시 환경 변수로 교체하세요:
// VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY
const supabaseUrl = getEnvVar(
  'VITE_SUPABASE_URL',
  'https://wvpzkrdxmziiqamdpfpe.supabase.co'
);

const supabaseAnonKey = getEnvVar(
  'VITE_SUPABASE_ANON_KEY',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind2cHprcmR4bXppaXFhbWRwZnBlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDkwODU3NjgsImV4cCI6MjA2NDY2MTc2OH0.6PX4DyP2cW3WRd1iztF1FZKFuAWGTYLbQaqBdU8sYJk'
);

// Supabase 클라이언트 초기화
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false
  }
});

// Database types for TypeScript
export interface Profile {
  id: string;
  username?: string;
  display_name?: string;
  phone?: string;
  profile_photo_url?: string;
  is_pro: boolean;
  created_at: string;
  updated_at: string;
}