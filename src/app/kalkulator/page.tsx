import { redirect } from 'next/navigation';

// The calculator became "Cek syarat" inside the Checklist.
export default function KalkulatorPage() {
  redirect('/checklist');
}
