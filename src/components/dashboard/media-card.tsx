"use client";

import { useState } from "react";
import { User, MoreHorizontal, Crown } from "lucide-react";
import clsx from "clsx";
import { twMerge } from "tailwind-merge";

interface MediaCardProps {
    id: string;
    source: string;
    handle: string;
    time: string;
    content: string;
    showAiOverlay?: boolean;
    aiContent?: string;
    isBank?: boolean;
    onContextMenu?: (e: React.MouseEvent) => void;
    className?: string;
}

export function MediaCard({
    id,
    source,
    handle,
    time,
    content,
    showAiOverlay = false,
    aiContent,
    isBank = false,
    onContextMenu,
    className,
}: MediaCardProps) {
    const [isHovered, setIsHovered] = useState(false);

    return (
        <div
            className={twMerge(
                clsx(
                    "relative group select-none transition-transform duration-200",
                    "bg-void border mb-4 w-full cursor-grab active:cursor-grabbing hover:scale-[1.02]",
                    isBank ? "border-synced/50 shadow-[0_0_10px_rgba(0,255,65,0.1)]" : "border-neutral-800 hover:border-neutral-600"
                ),
                className
            )}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            onContextMenu={onContextMenu}
        >
            {/* AI AI Sidecar Overlay */}
            {showAiOverlay && (
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-amber-500 z-10 transition-all duration-300 ease-out group-hover:w-1">
                    <div className={clsx(
                        "absolute left-1 top-0 bottom-0 bg-neutral-900 border-r border-y border-neutral-700 w-0 overflow-hidden transition-all duration-300 group-hover:w-64 flex flex-col z-20",
                        "opacity-0 group-hover:opacity-100"
                    )}>
                        <div className="p-3 w-64">
                            <div className="flex items-center gap-2 mb-2 text-amber-500">
                                <Crown className="w-3 h-3" />
                                <span className="text-[10px] font-bold font-mono whitespace-nowrap">COUNCIL_NOTE</span>
                            </div>
                            <p className="text-[10px] text-neutral-400 leading-relaxed overflow-y-auto max-h-[150px]">
                                {aiContent || "High leverage opportunity detected. Align with Q3 strategy."}
                            </p>
                        </div>
                    </div>
                </div>
            )}

            <div className="p-4 relative z-0">
                {/* Header */}
                <div className="flex items-center justify-between mb-3 font-mono text-[10px] text-neutral-500 tracking-wider">
                    <div className="flex items-center gap-2">
                        <span className="uppercase text-neutral-400">[{source}]</span>
                        <span>•</span>
                        <span className="text-white">@{handle}</span>
                    </div>
                    <span>{time}</span>
                </div>

                {/* Body */}
                <div className="font-sans text-sm text-white leading-relaxed whitespace-pre-wrap">
                    {content}
                </div>
            </div>

            {/* Context Menu Trigger (Visual only for now) */}
            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button className="text-neutral-500 hover:text-white" onClick={(e) => {
                    onContextMenu?.(e);
                }}>
                    <MoreHorizontal className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
}
