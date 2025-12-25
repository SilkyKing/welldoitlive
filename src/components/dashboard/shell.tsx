"use client";

import { PropsWithChildren } from "react";

export function DashboardShell({ children }: PropsWithChildren) {
    return (
        <main className="pt-12 h-screen w-screen overflow-hidden flex flex-row">
            {/* Horizontal Scroll Area for Feeds */}
            <div className="flex-1 overflow-x-auto overflow-y-hidden flex">
                {children}
            </div>
        </main>
    );
}
