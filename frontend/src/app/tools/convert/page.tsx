import { redirect } from 'next/navigation';

// Redirect /tools/convert to homepage which shows all tools
export default function ConvertPage() {
  redirect('/');
}
