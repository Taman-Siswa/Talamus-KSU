import { redirect } from 'next/navigation';

// FAQ became the Forum.
export default function FaqPage() {
  redirect('/forum');
}
