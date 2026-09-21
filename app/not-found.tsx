import Link from 'next/link';
import { DonghuaLogo } from '@/components/DonghuaLogo';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#08080b] flex flex-col items-center justify-center p-4 text-center">
      <div className="max-w-md w-full p-8 rounded-3xl bg-[#0f0f18] border border-[#202030] shadow-2xl space-y-6">
        <DonghuaLogo />
        <div className="space-y-2">
          <h1 className="text-4xl font-extrabold text-white font-mono">404</h1>
          <h2 className="text-xl font-bold text-gray-200">Realm Not Found</h2>
          <p className="text-xs text-gray-400">
            The cultivator saga or page you are seeking does not exist or has ascended to another plane.
          </p>
        </div>
        <Link
          href="/"
          className="inline-block w-full py-3 px-6 rounded-xl font-bold text-xs text-white bg-gradient-to-r from-red-600 to-amber-600 hover:brightness-110 shadow-lg transition-all"
        >
          Return to Decent Animation Home
        </Link>
      </div>
    </div>
  );
}
