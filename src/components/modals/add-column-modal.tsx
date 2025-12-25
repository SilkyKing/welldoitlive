"use client";

import { useState, useRef, useEffect } from "react";
import clsx from "clsx";

export function AddColumnModal({ isOpen, onClose, onAdd }: { isOpen: boolean; onClose: () => void; onAdd: (source: string, lens: string) => void }) {
    const [source, setSource] = useState("");
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (isOpen) {
            inputRef.current?.focus();
        }
    }, [isOpen]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center">
            <div className="w-[600px] border border-red-900/50 bg-black p-1 shadow-2xl shadow-red-900/20">
                {/* Header */}
                <div className="flex items-center justify-between px-4 py-2 border-b border-red-900/30 bg-red-950/10 mb-4">
                    <div className="flex items-center gap-2">
                        <span className="text-red-500 font-mono text-sm font-bold">{">"} INITIATE_NEW_COLUMN_PROTOCOL</span>
                    </div>
                    <div className="flex gap-1">
                        <div className="w-2 h-2 bg-neutral-800"></div>
                        <div className="w-2 h-2 bg-neutral-800"></div>
                        <div className="w-2 h-2 bg-red-900"></div>
                    </div>
                </div>

                <div className="p-6 space-y-6">
                    {/* Input */}
                    <div className="space-y-2">
                        <label className="text-neutral-500 font-mono text-xs uppercase tracking-wider">{">"} ENTER SOURCE:</label>
                        <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-red-500 font-mono text-sm">{">"}</span>
                            <input
                                ref={inputRef}
                                type="text"
                                value={source}
                                onChange={(e) => setSource(e.target.value)}
                                className="w-full bg-transparent border border-red-900/50 text-white font-mono text-sm pl-8 pr-4 py-3 focus:outline-none focus:border-red-500 transition-colors"
                                placeholder=""
                            />
                        </div>
                        <div className="text-neutral-700 font-mono text-[10px] pl-2">
                            Examples: "twitter/hormozi", "rss/techcrunch", "api/custom"
                        </div>
                    </div>

                    {/* Lens Selection */}
                    <div className="space-y-2">
                        <label className="text-neutral-500 font-mono text-xs uppercase tracking-wider">{">"} SELECT LENS FILTER:</label>
                        <div className="flex gap-4">
                            {["NONE", "HORMOZI", "SKEPTIC", "ACCEL"].map((lens) => (
                                <button key={lens} className="border border-neutral-800 px-4 py-2 text-neutral-500 font-mono text-xs hover:border-red-500 hover:text-red-500 transition-colors uppercase">
                                    [ {lens} ]
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="border-t border-red-900/30 p-2 flex justify-end gap-4">
                    <div className="flex items-center gap-2">
                        <span className="text-[10px] text-neutral-600 font-mono bg-neutral-900 px-1 border border-neutral-800">ENTER</span>
                        <span className="text-[10px] text-neutral-500 font-mono">EXECUTE</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-[10px] text-neutral-600 font-mono bg-neutral-900 px-1 border border-neutral-800">ESC</span>
                        <span className="text-[10px] text-neutral-500 font-mono">ABORT</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
