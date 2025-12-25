"use client";

import { useEffect, useState } from "react";
import { X, Save, Terminal } from "lucide-react";
import { supabase } from "@/utils/supabase/client";

interface SettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
}

type Persona = {
    id: string;
    name: string;
    system_prompt: string;
    model: string;
    icon_slug: string;
};

export function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
    const [personas, setPersonas] = useState<Persona[]>([]);
    const [selectedPersonaId, setSelectedPersonaId] = useState<string | null>(null);
    const [editedPrompt, setEditedPrompt] = useState("");
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (isOpen) {
            fetchPersonas();
        }
    }, [isOpen]);

    const fetchPersonas = async () => {
        const { data } = await supabase.from("personas").select("*").order("name");
        if (data) {
            setPersonas(data);
            if (data.length > 0 && !selectedPersonaId) {
                setSelectedPersonaId(data[0].id);
                setEditedPrompt(data[0].system_prompt);
            }
        }
    };

    const handlePersonaSelect = (persona: Persona) => {
        setSelectedPersonaId(persona.id);
        setEditedPrompt(persona.system_prompt);
    };

    const handleSave = async () => {
        if (!selectedPersonaId) return;
        setIsSaving(true);
        const { error } = await supabase
            .from("personas")
            .update({ system_prompt: editedPrompt })
            .eq("id", selectedPersonaId);

        if (error) {
            console.error("Error saving persona:", error);
        } else {
            // Refresh local state to ensure it's synced
            setPersonas(prev => prev.map(p =>
                p.id === selectedPersonaId ? { ...p, system_prompt: editedPrompt } : p
            ));
        }
        setIsSaving(false);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="w-full max-w-4xl h-[600px] bg-void border border-grid-line shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">

                {/* Header */}
                <div className="h-12 border-b border-grid-line flex items-center justify-between px-4 bg-void/50">
                    <div className="flex items-center gap-2">
                        <Terminal className="w-4 h-4 text-brand-400" />
                        <span className="text-sm font-mono font-bold text-neutral-200">WAR_ROOM_CONFIG // PERSONA_EDITOR</span>
                    </div>
                    <button onClick={onClose} className="text-neutral-500 hover:text-white transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 flex overflow-hidden">
                    {/* Sidebar List */}
                    <div className="w-1/3 border-r border-grid-line bg-neutral-950/50 flex flex-col overflow-y-auto">
                        <div className="p-2 space-y-1">
                            {personas.map(persona => (
                                <button
                                    key={persona.id}
                                    onClick={() => handlePersonaSelect(persona)}
                                    className={`w-full text-left px-3 py-3 text-xs font-mono border-l-2 transition-colors flex flex-col gap-1 ${selectedPersonaId === persona.id
                                        ? "bg-brand-950/20 border-brand-500 text-white"
                                        : "border-transparent text-neutral-500 hover:text-neutral-300 hover:bg-neutral-900"
                                        }`}
                                >
                                    <span className="font-bold uppercase tracking-wider">{persona.name}</span>
                                    <span className="text-[10px] opacity-60">{persona.model}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Editor Area */}
                    <div className="w-2/3 flex flex-col bg-void">
                        <div className="flex-1 p-4">
                            <label className="block text-[10px] font-mono text-brand-400 mb-2 uppercase tracking-widest">
                                System Prompt // {personas.find(p => p.id === selectedPersonaId)?.model}
                            </label>
                            <textarea
                                value={editedPrompt}
                                onChange={(e) => setEditedPrompt(e.target.value)}
                                className="w-full h-full bg-neutral-950 border border-grid-line text-neutral-300 font-mono text-xs p-4 focus:outline-none focus:border-brand-500/50 resize-none leading-relaxed"
                                spellCheck={false}
                            />
                        </div>

                        {/* Footer Actions */}
                        <div className="h-14 border-t border-grid-line flex items-center justify-between px-4 bg-neutral-950">
                            <button
                                onClick={async () => {
                                    setIsSaving(true);
                                    // Seed 5 items
                                    const seedItems = Array.from({ length: 5 }).map((_, i) => ({
                                        feed_id: "00000000-0000-0000-0000-000000000000", // Needs a valid feed ID or we handle null in RLS/Schema. Let's assume we need to fetch a feed first or create one? 
                                        // Actually schema says feed_id is not null. We need a default feed.
                                        // Simple hack: Create a dummy feed if not exists, or just use a known UUID if we had one.
                                        // Better: Let's just insert into 'items' and hope RLS lets us or we fix schema. 
                                        // Actually, let's just make a quick feed fetch or create.
                                        content: `INTEL_SEED_${i + 1}: Detected anomaly in sector ${Math.floor(Math.random() * 99)}. Market correlation pending.`,
                                        metadata: { source: "SIMULATION", handle: "GHOST_SIGNAL" }
                                    }));

                                    // We need to associate with a feed. Let's try to get the first feed or create one.
                                    let { data: feeds } = await supabase.from('feeds').select('id').limit(1);
                                    let feedId = feeds?.[0]?.id;

                                    if (!feedId) {
                                        const user = (await supabase.auth.getUser()).data.user;
                                        const feedPayload: any = {
                                            title: 'MAIN_FEED',
                                            type: 'system'
                                        };
                                        if (user) feedPayload.user_id = user.id;

                                        const { data: newFeed } = await supabase.from('feeds').insert(feedPayload).select().single();
                                        feedId = newFeed?.id;
                                    }

                                    if (feedId) {
                                        await supabase.from('items').insert(seedItems.map(item => ({ ...item, feed_id: feedId })));
                                        alert("Injected 5 Intel Items");
                                    } else {
                                        alert("Failed to find/create feed for injection. (Auth needed?)");
                                    }

                                    setIsSaving(false);
                                }}
                                disabled={isSaving}
                                className="flex items-center gap-2 px-3 py-1.5 bg-neutral-900 border border-neutral-800 text-neutral-500 text-[10px] font-mono hover:text-white transition-all"
                            >
                                <Terminal className="w-3 h-3" />
                                SIMULATE_INTEL
                            </button>

                            <button
                                onClick={handleSave}
                                disabled={isSaving}
                                className="flex items-center gap-2 px-4 py-2 bg-brand-950 border border-brand-900 text-brand-400 text-xs font-mono hover:bg-brand-900/50 hover:text-white transition-all disabled:opacity-50"
                            >
                                <Save className="w-3 h-3" />
                                {isSaving ? "WRITING_TO_DB..." : "SAVE_CONFIG"}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
