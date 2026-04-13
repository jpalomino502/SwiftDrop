import { ReactNode } from "react";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";

export function AdminLayout({ children }: { children: ReactNode }) {
    return (
        <div className="flex min-h-screen bg-gray-50/50 font-sans text-gray-900">
            <Sidebar />
            <div className="flex flex-1 flex-col md:ml-64 transition-all duration-300">
                <Header />
                <main className="flex-1 p-4 md:p-8 lg:p-10 max-w-[1600px] mx-auto w-full">{children}</main>
            </div>
        </div>
    );
}
