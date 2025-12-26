"use client";

import { useEffect, useState } from "react";
import { X, Save, Terminal } from "lucide-react";
import { supabase } from "@/utils/supabase/client";

interface SettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
    onIntelInjected?: () => void;
}

type Persona = {
    id: string;
    name: string;
    system_prompt: string;
    model: string;
    icon_slug: string;
};

export function SettingsModal({ isOpen, onClose, onIntelInjected }: SettingsModalProps) {
    const [activeTab, setActiveTab] = useState<'personas' | 'sources'>('personas');

    // Pearsonas State
    const [personas, setPersonas] = useState<Persona[]>([]);
    const [selectedPersonaId, setSelectedPersonaId] = useState<string | null>(null);
    const [editedPrompt, setEditedPrompt] = useState("");

    // Sources State
    const [sources, setSources] = useState<any[]>([]);
    const [newSourceName, setNewSourceName] = useState("");
    const [newSourceUrl, setNewSourceUrl] = useState("");

    const [isSaving, setIsSaving] = useState(false);
    const [isHarvesting, setIsHarvesting] = useState(false);

    useEffect(() => {
        if (isOpen) {
            fetchPersonas();
            fetchSources();
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

    const fetchSources = async () => {
        const { data } = await supabase.from("sources").select("*").order("created_at");
        if (data) setSources(data);
    };

    const handlePersonaSelect = (persona: Persona) => {
        setSelectedPersonaId(persona.id);
        setEditedPrompt(persona.system_prompt);
    };

    const handleAddSource = async () => {
        if (!newSourceName || !newSourceUrl) return;
        const { error } = await supabase.from("sources").insert({ name: newSourceName, url: newSourceUrl });
        if (error) {
            alert("Error adding source: " + error.message);
        } else {
            setNewSourceName("");
            setNewSourceUrl("");
            fetchSources();
        }
    };

    const handleDeleteSource = async (id: string) => {
        if (!confirm("Remove this source?")) return;
        await supabase.from("sources").delete().eq("id", id);
        fetchSources();
    };

    const handleSavePersona = async () => {
        if (!selectedPersonaId) return;
        setIsSaving(true);
        const { error } = await supabase
            .from("personas")
            .update({ system_prompt: editedPrompt })
            .eq("id", selectedPersonaId);

        if (error) console.error("Error saving persona:", error);
        else {
            setPersonas(prev => prev.map(p =>
                p.id === selectedPersonaId ? { ...p, system_prompt: editedPrompt } : p
            ));
        }
        setIsSaving(false);
    };

    const handleHarvest = async () => {
        setIsHarvesting(true);
        try {
            const res = await fetch('/api/harvest', { method: 'POST' });
            const data = await res.json();
            if (data.error) throw new Error(data.error);

            alert(`Harvest Complete. ${data.newItemsCount} new items found.`);
            if (onIntelInjected) onIntelInjected();
            onClose();
        } catch (e: any) {
            alert("Harvest Failed: " + e.message);
        }
        setIsHarvesting(false);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="w-full max-w-4xl h-[600px] bg-void border border-grid-line shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">

                {/* Header */}
                <div className="h-12 border-b border-grid-line flex items-center justify-between px-4 bg-void/50">
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                            <Terminal className="w-4 h-4 text-brand-400" />
                            <span className="text-sm font-mono font-bold text-neutral-200">WAR_ROOM_CONFIG</span>
                        </div>
                        <div className="flex bg-neutral-900 rounded p-1 gap-1">
                            <button
                                onClick={() => setActiveTab('personas')}
                                className={`px-3 py-0.5 text-[10px] font-mono rounded ${activeTab === 'personas' ? 'bg-brand-900 text-white' : 'text-neutral-500 hover:text-neutral-300'}`}
                            >
                                PERSONAS
                            </button>
                            <button
                                onClick={() => setActiveTab('sources')}
                                className={`px-3 py-0.5 text-[10px] font-mono rounded ${activeTab === 'sources' ? 'bg-brand-900 text-white' : 'text-neutral-500 hover:text-neutral-300'}`}
                            >
                                SOURCES
                            </button>
                        </div>
                    </div>
                    <button onClick={onClose} className="text-neutral-500 hover:text-white transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 flex overflow-hidden">
                    {activeTab === 'personas' ? (
                        <>
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
                                <div className="h-14 border-t border-grid-line flex items-center justify-end px-4 bg-neutral-950">
                                    <button
                                        onClick={handleSavePersona}
                                        disabled={isSaving}
                                        className="flex items-center gap-2 px-4 py-2 bg-brand-950 border border-brand-900 text-brand-400 text-xs font-mono hover:bg-brand-900/50 hover:text-white transition-all disabled:opacity-50"
                                    >
                                        <Save className="w-3 h-3" />
                                        {isSaving ? "WRITING..." : "SAVE_CONFIG"}
                                    </button>
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="w-full flex flex-col bg-void p-6">
                            {/* Source Manager */}
                            <div className="flex-1 overflow-y-auto space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="col-span-2">
                                        <h3 className="text-sm font-mono text-brand-400 mb-2">ACTIVE_INTEL_SOURCES</h3>
                                        <div className="bg-neutral-950 border border-grid-line rounded divide-y divide-grid-line">
                                            {sources.map(source => (
                                                <div key={source.id} className="p-3 flex items-center justify-between hover:bg-white/5">
                                                    <div>
                                                        <div className="text-xs font-bold text-white">{source.name}</div>
                                                        <div className="text-[10px] text-neutral-500 font-mono truncate max-w-[300px]">{source.url}</div>
                                                    </div>
                                                    <button onClick={() => handleDeleteSource(source.id)} className="text-neutral-600 hover:text-red-500">
                                                        <X className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="col-span-2 bg-neutral-900/50 p-4 border border-dashed border-neutral-800 rounded">
                                        <h4 className="text-xs font-mono text-neutral-400 mb-2">ADD_NEW_SOURCE</h4>
                                        <div className="flex gap-2">
                                            <input
                                                value={newSourceName}
                                                onChange={e => setNewSourceName(e.target.value)}
                                                placeholder="SOURCE_NAME"
                                                className="bg-black border border-neutral-700 text-white text-xs px-2 py-1 flex-1 focus:border-brand-500 outline-none"
                                            />
                                            <input
                                                value={newSourceUrl}
                                                onChange={e => setNewSourceUrl(e.target.value)}
                                                placeholder="RSS_FEED_URL"
                                                className="bg-black border border-neutral-700 text-white text-xs px-2 py-1 flex-[2] focus:border-brand-500 outline-none"
                                            />
                                            <button onClick={handleAddSource} className="px-3 py-1 bg-white text-black text-xs font-bold">ADD</button>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Harvest Action */}
                            <div className="h-14 border-t border-grid-line flex items-center justify-between pt-4">
                                <span className="text-[10px] text-neutral-500 font-mono">
                                    LAST_HARVEST: {new Date().toLocaleTimeString()}
                                </span>
                                <button
                                    onClick={handleHarvest}
                                    disabled={isHarvesting}
                                    className="flex items-center gap-2 px-6 py-2 bg-brand-600 text-black text-sm font-bold font-mono hover:bg-brand-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <Terminal className="w-4 h-4" />
                                    {isHarvesting ? "HARVESTING..." : "HARVEST_NOW"}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
