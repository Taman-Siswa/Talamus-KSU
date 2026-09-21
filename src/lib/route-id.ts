'use client';

import { usePathname } from 'next/navigation';

/**
 * The last segment of the address, e.g. the school id in /katalog/tn.
 *
 * Read from the browser's path on purpose, not from the route params: on the static Firebase build a
 * school the admin added after the build has no page of its own. A placeholder page ('_') is served
 * for it, and that page's params say '_' while the address still holds the real id.
 */
export const useRouteId = () => decodeURIComponent(usePathname().split('/').filter(Boolean).pop() ?? '');
