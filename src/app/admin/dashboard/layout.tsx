"use client";

import React from 'react';

export default function AdminDashboardLayout({ children }: { children: React.ReactNode }) {
  // Navigation is now handled by the parent /admin/layout.tsx
  return <>{children}</>;
}