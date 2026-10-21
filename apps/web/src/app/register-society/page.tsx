import { notFound } from 'next/navigation';

export const metadata = {
  title: 'Register Society | GrievEase',
  description: 'Register your housing society on GrievEase',
};

export default function RegisterSocietyPage() {
  const isEnabled = process.env.FEATURE_REGISTER_SOCIETY === 'true' || process.env.NEXT_PUBLIC_FEATURE_REGISTER_SOCIETY === 'true';

  if (!isEnabled) {
    notFound();
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-slate-50 dark:bg-slate-950">
      <div className="max-w-md w-full bg-white dark:bg-slate-900 p-8 rounded-2xl shadow-xl text-center space-y-4">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Society Registration</h1>
        <p className="text-slate-600 dark:text-slate-400">
          Society registration is currently available by invitation or Super Admin onboarding only.
        </p>
      </div>
    </div>
  );
}
