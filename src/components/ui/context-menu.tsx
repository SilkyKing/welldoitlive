"use client";

import { useEffect, useRef } from "react";
import { Brain, Trash2, ShieldAlert } from "lucide-react";

interface Persona {
    id: string;
    name: string;
    icon_slug: string;
    model: string;
}

interface ContextMenuProps {
    x: number;
    y: number;
    onClose: () => void;
    onOptionSelect: (option: string, personaId?: string) => void;
    personas: Persona[];
}

export function ContextMenu({ x, y, onClose, onOptionSelect, personas }: ContextMenuProps) {
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                onClose();
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [onClose]);

    return (
        <div
            ref={menuRef}
            className="fixed z-[100] w-64 bg-neutral-950 border border-neutral-800 shadow-2xl animate-in fade-in zoom-in-95 duration-100 p-1"
            style={{ top: y, left: x }}
        >
            <div className="flex items-center gap-2 px-3 py-2 border-b border-neutral-900 mb-1">
                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                <span className="text-[10px] uppercase tracking-widest text-neutral-500 font-mono">Context: Node_Alpha_04</span>
            </div>
            <div className="flex flex-col">
                {personas.map((persona) => (
                    <button
                        key={persona.id}
                        onClick={() => onOptionSelect("consult", persona.id)}
                        className="flex items-center gap-3 px-3 py-3 text-left hover:bg-neutral-900 group transition-colors"
                    >
                        {persona.icon_slug === 'crown' ? <Brain className="w-4 h-4 text-emerald-600 group-hover:text-emerald-400" /> :
                            persona.icon_slug === 'skull' ? <ShieldAlert className="w-4 h-4 text-amber-600 group-hover:text-amber-400" /> :
                                <Brain className="w-4 h-4 text-neutral-600 group-hover:text-white" />
                        }
                        <div className="flex flex-col">
                            <span className="text-xs font-mono font-bold text-neutral-300 group-hover:text-white uppercase">{">"} CONSULT: {persona.name.replace("The ", "")}</span>
                            <span className="text-[10px] text-neutral-600 font-mono uppercase">PROTOCOL: {persona.model.split("-")[0]}</span>
                        </div>
                    </button>
                ))}

                <div className="h-[1px] bg-neutral-900 my-1" />
                <button
                    onClick={() => onOptionSelect("delete")}
                    className="flex items-center gap-3 px-3 py-3 text-left hover:bg-red-950/20 group transition-colors"
                >
                    <Trash2 className="w-4 h-4 text-red-900 group-hover:text-red-500" />
                    <span className="text-xs font-mono font-bold text-red-900 group-hover:text-red-500">{">"} DELETE ASSET</span>
                </button>
            </div>
        </div>
    );
}
