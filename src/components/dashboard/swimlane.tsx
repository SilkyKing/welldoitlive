"use client";

import { useDroppable } from "@dnd-kit/core";
import { rectSortingStrategy, SortableContext } from "@dnd-kit/sortable";
import clsx from "clsx";
import { Settings } from "lucide-react";
import { ReactNode } from "react";

interface SwimlaneProps {
    id: string;
    title: string;
    children?: ReactNode;
}

export function Swimlane({ id, title, children }: SwimlaneProps) {
    const { setNodeRef } = useDroppable({
        id,
    });

    return (
        <div
            ref={setNodeRef}
            className="h-full w-[400px] min-w-[400px] flex flex-col border-r border-grid-line bg-void/50 backdrop-blur-sm relative"
        >
            {/* Header */}
            <div className="h-12 border-b border-grid-line flex items-center justify-between px-4 shrink-0">
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-neutral-600" />
                    <h2 className="text-white font-mono text-sm tracking-widest uppercase">{title}</h2>
                </div>
                <button className="text-neutral-600 hover:text-white transition-colors">
                    <Settings className="w-3 h-3" />
                </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                {children}
            </div>
        </div>
    );
}
