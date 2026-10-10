
import { ReactNode } from "react";
import Link from 'next/link';

export default function AuthLayout({ children }: { children: ReactNode }) {
    return (
        <div className="flex min-h-screen w-full items-center justify-center bg-gray-100 dark:bg-gray-900 p-4">
           <div className="absolute top-8 left-8">
                <Link href="/" className="text-2xl font-bold text-primary">
                    Aluplan Digital
                </Link>
           </div>
           {children}
        </div>
    );
}
