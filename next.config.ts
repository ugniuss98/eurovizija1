import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  env: {
    NEXT_PUBLIC_SUPABASE_URL: "https://ukldverypycfevulynvi.supabase.co",
    NEXT_PUBLIC_SUPABASE_ANON_KEY:
      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVrbGR2ZXJ5cHljZmV2dWx5bnZpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkwOTY2MTYsImV4cCI6MjA5NDY3MjYxNn0.1ylOJULpeKNGKH46NMyx4UKv6bMvGkM966KaqLeJJbY",
  },
};

export default nextConfig;
