
import Link from "next/link";
import { Terminal, Users, User, Radio, Settings } from "lucide-react";
import clsx from "clsx";

interface HeaderProps {
    toggleEnabled: boolean;
    onToggleChange: (val: boolean) => void;
    onSettingsClick: () => void;
}

export function Header({ toggleEnabled, onToggleChange, onSettingsClick }: HeaderProps) {
    return (
        <header className="fixed top-0 left-0 right-0 h-12 border-b border-grid-line bg-void z-50 flex items-center justify-between px-4 font-mono select-none">
            {/* Left: Brand & Status */}
            <div className="flex items-center gap-4">
                <div className="flex items-center gap-6">
                    {/* Master AI Toggle */}
                    <div
                        className={clsx("flex items-center gap-2 cursor-pointer group", toggleEnabled ? "opacity-100" : "opacity-60 hover:opacity-100")}
                        onClick={() => onToggleChange(!toggleEnabled)}
                    >
                        <div className={clsx("w-3 h-3 rounded-full border border-current shadow-[0_0_10px_currentColor] transition-all", toggleEnabled ? "bg-amber-500 text-amber-500" : "bg-transparent text-neutral-600")}></div>
                        <span className={clsx("text-[10px] font-mono tracking-widest", toggleEnabled ? "text-amber-500 font-bold" : "text-neutral-500")}>COUNCIL_OVERLAY</span>
                    </div>

                    {/* Settings Trigger */}
                    <button onClick={onSettingsClick} className="group flex items-center gap-2 opacity-60 hover:opacity-100 transition-opacity">
                        <Settings className="w-4 h-4 text-neutral-400 group-hover:text-white" />
                    </button>

                    <div className="w-[1px] h-4 bg-neutral-800"></div>
                </div>
            </div>

            {/* Center: Master AI Toggle */}
            <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-4">
                <span className={clsx("text-xs tracking-wider", "text-neutral-500")}>
                    COUNCIL_OVERLAY
                </span>
                {/* Skeletal Toggle Switch */}
                <label className="relative inline-flex items-center cursor-pointer group">
                    <input
                        type="checkbox"
                        className="sr-only peer"
                        checked={toggleEnabled}
                        onChange={(e) => onToggleChange?.(e.target.checked)}
                    />
                    <div className="w-11 h-6 bg-transparent border border-neutral-700 peer-focus:outline-none peer-focus:ring-1 peer-focus:ring-alert rounded-none peer-checked:border-alert transition-all duration-200"></div>
                    <div className="absolute left-[3px] top-[3px] bg-neutral-700 w-4 h-4 transition-all peer-checked:bg-alert peer-checked:translate-x-full group-hover:bg-neutral-500 rounded-none"></div>
                </label>
                <span className={clsx("text-xs tracking-wider", toggleEnabled ? "text-alert font-bold" : "text-neutral-600")}>
                    [{toggleEnabled ? "ON" : "OFF"}]
                </span>
            </div>

            {/* Right: Avatars & Tools */}
            <div className="flex items-center gap-4">
                <div className="flex -space-x-2">
                    <div className="w-8 h-8 flex items-center justify-center bg-neutral-900 border border-neutral-700 rounded-full relative">
                        <User className="w-4 h-4 text-white" />
                        <div className="absolute bottom-0 right-0 w-2 h-2 bg-synced rounded-full border border-black"></div>
                    </div>
                    <div className="w-8 h-8 flex items-center justify-center bg-neutral-900 border border-neutral-700 rounded-full text-xs text-neutral-400">
                        +1
                    </div>
                </div>
                <div className="h-4 w-[1px] bg-grid-line" />
                <button className="text-neutral-400 hover:text-white transition-colors">
                    <Settings className="w-4 h-4" />
                </button>
            </div>
        </header>
    );
}
