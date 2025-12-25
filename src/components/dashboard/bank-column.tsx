"use client";

import { useDroppable } from "@dnd-kit/core";
import clsx from "clsx";
import { Lock } from "lucide-react";
import { ReactNode } from "react";

interface BankColumnProps {
    id: string; // usually "the-bank"
    children?: ReactNode;
}

export function BankColumn({ id, children }: BankColumnProps) {
    const { setNodeRef, isOver } = useDroppable({
        id,
    });

    return (
        <div
            ref={setNodeRef}
            className={clsx(
                "h-full w-[400px] min-w-[400px] flex flex-col border-l border-synced bg-void relative transition-colors duration-300",
                isOver && "bg-synced/5"
            )}
        >
            {/* Header */}
            <div className="h-12 border-b border-synced/30 flex items-center justify-between px-4 shrink-0">
                <div className="flex items-center gap-2">
                    <Lock className="w-3 h-3 text-synced" />
                    <h2 className="text-synced font-mono text-sm tracking-widest uppercase font-bold">THE BANK</h2>
                </div>
                <div className="text-[10px] text-synced/50 border border-synced/30 px-2 py-0.5">SECURE</div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                {children}
                {/* Placeholder if empty */}
                {!children && (
                    <div className="h-full flex items-center justify-center text-neutral-800 font-mono text-xs text-center border-2 border-dashed border-neutral-900 m-4 rounded">
                        DROP_ASSET_HERE
                    </div>
                )}
            </div>

            {/* Footer / Action */}
            <div className="p-4 border-t border-synced/30">
                <button className="w-full h-10 bg-synced text-black font-bold font-mono text-xs uppercase tracking-wider hover:bg-white transition-colors">
                    ⬆ DEPOSIT_ASSET
                </button>
            </div>
        </div>
    );
}
