'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { homeFor, roleOf, useCurrentUser } from '@/lib/auth';

// Each role has its own front page: students start at the Katalog, admins at Database SMA.
export default function Home() {
  const router = useRouter();
  const role = roleOf(useCurrentUser());
  useEffect(() => { router.replace(homeFor(role)); }, [role, router]);
  return null;
}
