import { redirect } from 'next/navigation';

// Root redirect — send authenticated users to their portal
export default function Home() {
  redirect('/portal/dashboard');
}
