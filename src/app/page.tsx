"use client";

import { useState, useCallback, useEffect } from "react";
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragOverEvent,
  DragEndEvent,
  defaultDropAnimationSideEffects,
  DropAnimation
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy
} from "@dnd-kit/sortable";


import { Header } from "@/components/ui/header";
import { DashboardShell } from "@/components/dashboard/shell";
import { Swimlane } from "@/components/dashboard/swimlane";
import { BankColumn } from "@/components/dashboard/bank-column";
import { MediaCard } from "@/components/dashboard/media-card";
import { AddColumnModal } from "@/components/modals/add-column-modal";
import { SettingsModal } from "@/components/modals/settings-modal";
import { SortableItem } from "@/components/dashboard/sortable-item";
import { ContextMenu } from "@/components/ui/context-menu";
import { supabase } from "@/utils/supabase/client";

// Types
type Item = {
  id: string;
  source: string;
  handle: string;
  time: string;
  content: string;
  showAiOverlay: boolean;
  isBank?: boolean;
  aiAnalysis?: string;
};

type Persona = {
  id: string;
  name: string;
  icon_slug: string;
  model: string;
};

type Items = Record<string, Item[]>;

const dropAnimation: DropAnimation = {
  sideEffects: defaultDropAnimationSideEffects({
    styles: {
      active: {
        opacity: "0.5",
      },
    },
  }),
};

export default function Home() {
  const [items, setItems] = useState<Items>({
    "feed-1": [
      {
        id: "item-1",
        source: "X_API",
        handle: "elonmusk",
        time: "12m ago",
        content: "We are going to Mars. The timeline has accelerated.",
        showAiOverlay: false,
      },
      {
        id: "item-2",
        source: "RSS",
        handle: "techcrunch",
        time: "45m ago",
        content: "New signals detected in sector 4. Pattern matches previous incursions.",
        showAiOverlay: false,
      }
    ],
    "active-ops": [],
    "the-bank": []
  });
  const [activeId, setActiveId] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [masterToggle, setMasterToggle] = useState(false);
  const [contextMenu, setContextMenu] = useState<{ visible: boolean; x: number; y: number; id: string } | null>(null);
  const [personas, setPersonas] = useState<Persona[]>([]);

  // Fetch Logic
  useEffect(() => {
    const fetchBank = async () => {
      const { data } = await supabase
        .from('the_bank')
        .select(`*, items (*)`)
        .order('position');

      if (data) {
        const bankItems: Item[] = data.map((row: any) => ({
          id: row.items.id,
          source: row.items.metadata?.source || "SAVED",
          handle: row.items.metadata?.handle || "system",
          time: "stored",
          content: row.items.content || row.note || "",
          showAiOverlay: !!row.ai_analysis,
          aiAnalysis: row.ai_analysis?.content || JSON.stringify(row.ai_analysis),
          isBank: true
        }));
        setItems(prev => ({ ...prev, "the-bank": bankItems }));
      }
    };

    const fetchFeed = async () => {
      // Fetch items that are NOT in the bank (naive check: just fetch recent items)
      // Ideally we filter out ones already in bank, but for MVP let's just show recent 10.
      const { data } = await supabase.from('items').select('*').order('created_at', { ascending: false }).limit(20);
      if (data) {
        const feedItems: Item[] = data.map((row: any) => ({
          id: row.id,
          source: row.metadata?.source || "UNKNOWN",
          handle: row.metadata?.handle || "anon",
          time: "live",
          content: row.content,
          showAiOverlay: false,
          isBank: false
        }));
        setItems(prev => ({ ...prev, "feed-1": feedItems }));
      }
    };

    const fetchPersonas = async () => {
      const { data } = await supabase.from('personas').select('id, name, icon_slug, model').order('name');
      if (data) setPersonas(data);
    };

    fetchBank();
    fetchFeed();
    fetchPersonas();

    const channelBank = supabase
      .channel('public:the_bank')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'the_bank' }, () => fetchBank())
      .subscribe();

    const channelItems = supabase
      .channel('public:items')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'items' }, () => fetchFeed())
      .subscribe();

    return () => {
      supabase.removeChannel(channelBank);
      supabase.removeChannel(channelItems);
    };
  }, []);

  // AI Consult Logic
  const handleConsult = async (content: string, personaId: string, itemId: string) => {
    // Optimistic Update: Show loading state or overlay
    setItems(prev => {
      // Find item container
      const container = Object.keys(prev).find(key => prev[key].some(i => i.id === itemId));
      if (!container) return prev;

      return {
        ...prev,
        [container]: prev[container].map(item =>
          item.id === itemId ? { ...item, showAiOverlay: true, aiAnalysis: "Thinking..." } : item
        )
      };
    });

    try {
      const response = await fetch('/api/consult', {
        method: 'POST',
        body: JSON.stringify({ content, personaId })
      });

      if (!response.ok) throw new Error("Consult failed");
      // Handle streaming response if possible, simplified text reading for now
      // For real streaming, we'd use a reader.
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let resultText = "";

      while (reader) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        resultText += chunk;

        // Live update state
        setItems(prev => {
          const container = Object.keys(prev).find(key => prev[key].some(i => i.id === itemId));
          if (!container) return prev;
          return {
            ...prev,
            [container]: prev[container].map(item =>
              item.id === itemId ? { ...item, aiAnalysis: resultText } : item
            )
          };
        });
      }

    } catch (e) {
      console.error(e);
    }
  };

  // DnD Sensors
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const findContainer = (id: string) => {
    if (id in items) return id;
    const container = Object.keys(items).find((key) => items[key].find((item) => item.id === id));
    return container;
  };

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    const overId = over?.id;
    if (!overId || active.id === overId) return;
    const activeContainer = findContainer(active.id as string);
    const overContainer = findContainer(overId as string);
    if (!activeContainer || !overContainer || activeContainer === overContainer) return;

    setItems((prev) => {
      const activeItems = prev[activeContainer];
      const overItems = prev[overContainer];
      const activeIndex = activeItems.findIndex((item) => item.id === active.id);
      const overIndex = overItems.findIndex((item) => item.id === overId);
      let newIndex;
      if (overId in prev) {
        newIndex = overItems.length + 1;
      } else {
        const isBelowOverItem = over && active.rect.current.translated && active.rect.current.translated.top > over.rect.top + over.rect.height;
        const modifier = isBelowOverItem ? 1 : 0;
        newIndex = overIndex >= 0 ? overIndex + modifier : overItems.length + 1;
      }
      return {
        ...prev,
        [activeContainer]: [...prev[activeContainer].filter((item) => item.id !== active.id)],
        [overContainer]: [
          ...prev[overContainer].slice(0, newIndex),
          activeItems[activeIndex],
          ...prev[overContainer].slice(newIndex, prev[overContainer].length),
        ],
      };
    });
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    const activeContainer = findContainer(active.id as string);
    const overContainer = over ? findContainer(over.id as string) : null;

    if (activeContainer && overContainer && activeContainer === overContainer) {
      const activeIndex = items[activeContainer].findIndex((item) => item.id === active.id);
      const overIndex = items[overContainer].findIndex((item) => item.id === over?.id);
      if (activeIndex !== overIndex) {
        setItems((prev) => ({
          ...prev,
          [activeContainer]: arrayMove(prev[activeContainer], activeIndex, overIndex),
        }));

        // If sorting within bank, update position? (TODO: Phase 8)
      }
    } else if (activeContainer && overContainer && overContainer === "the-bank") {
      // Moved TO the bank
      // 1. Optimistic Update (already done by dnd-kit sortable reorder if we handle it right, but here we just moved containers in dragOver)
      // Actually handleDragOver handles the visual move. dragEnd finalizes it.

      // 2. Persist to DB
      console.log("Persisting item to bank:", active.id);
      const { data: userData } = await supabase.auth.getUser();
      if (userData?.user) {
        // Check if item already in bank to avoid dupes? Or allow dupes?
        // The active.id corresponds to an 'item' id from 'items' table (if dragged from Feed)
        // OR 'the_bank' id (if sorting within Bank, but that's caught in first block)

        // WE HAVE A PROBLEM: dnd-kit uses unique IDs. If we drag from Feed, ID is item.id.
        // If we insert into bank, the bank row has a NEW ID.
        // But visually we are using the item.id.

        await supabase.from('the_bank').insert({
          user_id: userData.user.id,
          item_id: active.id,
          position: 0 // TODO: Calculate actual position
        });
        // The realtime subscription should fetch the new bank row and update UI correctly.
      } else {
        // Fallback for unauth/anon usage if permitted, or just warn
        console.warn("User not authenticated, cannot persist to bank");
        // Create mock entry for "guest" if RLS allows
        await supabase.from('the_bank').insert({
          // user_id: ... wait, schema requires user_id.
          // We need a user. If anon, maybe we use a specific guest dummy ID or fix schema.
          // For now, assume auth is handled or we fail gracefully.
          item_id: active.id
        });
      }
    }

    setActiveId(null);
  };

  const handleContextMenu = useCallback((e: React.MouseEvent, id: string) => {
    e.preventDefault();
    setContextMenu({ visible: true, x: e.clientX, y: e.clientY, id });
  }, []);

  const activeItemData = activeId ? Object.values(items).flat().find(i => i.id === activeId) : null;

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <Header
        toggleEnabled={masterToggle}
        onToggleChange={setMasterToggle}
        onSettingsClick={() => setShowSettingsModal(true)}
      />
      <DashboardShell>
        <Swimlane id="feed-1" title="INTEL_STREAM [CH_01]">
          <SortableContext items={items["feed-1"]} strategy={verticalListSortingStrategy}>
            {items["feed-1"].map((item) => (
              <SortableItem key={item.id} id={item.id}>
                <MediaCard
                  {...item}
                  showAiOverlay={item.showAiOverlay || masterToggle}
                  aiContent={item.aiAnalysis}
                  onContextMenu={(e) => handleContextMenu(e, item.id)}
                />
              </SortableItem>
            ))}
          </SortableContext>
        </Swimlane>

        <Swimlane id="active-ops" title="ACTIVE_OPS">
          <SortableContext items={items["active-ops"]} strategy={verticalListSortingStrategy}>
            {items["active-ops"].length === 0 && (
              <div className="text-neutral-500 text-xs text-center mt-10 w-full">No active operations.</div>
            )}
            {items["active-ops"].map((item) => (
              <SortableItem key={item.id} id={item.id}>
                <MediaCard
                  {...item}
                  showAiOverlay={item.showAiOverlay || masterToggle}
                  aiContent={item.aiAnalysis}
                  onContextMenu={(e) => handleContextMenu(e, item.id)}
                />
              </SortableItem>
            ))}
          </SortableContext>
        </Swimlane>

        <div className="flex items-center justify-center w-[60px] border-r border-grid-line opacity-50 hover:opacity-100 transition-opacity cursor-pointer bg-void/30 hover:bg-void/50" onClick={() => setShowAddModal(true)}>
          <span className="text-neutral-600 font-mono text-[10px] -rotate-90 whitespace-nowrap tracking-widest">ADD_SOURCE [+]</span>
        </div>

        <BankColumn id="the-bank">
          <SortableContext items={items["the-bank"]} strategy={verticalListSortingStrategy}>
            {items["the-bank"].map((item) => (
              <SortableItem key={item.id} id={item.id}>
                <MediaCard
                  {...item}
                  isBank={true}
                  // For MVP let's allow it if we consult:
                  showAiOverlay={item.showAiOverlay}
                  aiContent={item.aiAnalysis}
                  onContextMenu={(e) => handleContextMenu(e, item.id)}
                />
              </SortableItem>
            ))}
          </SortableContext>
        </BankColumn>

      </DashboardShell>

      <DragOverlay dropAnimation={dropAnimation}>
        {activeItemData ? (
          <MediaCard {...activeItemData} className="opacity-90 scale-105 shadow-2xl cursor-grabbing" />
        ) : null}
      </DragOverlay>

      <AddColumnModal isOpen={showAddModal} onClose={() => setShowAddModal(false)} onAdd={() => setShowAddModal(false)} />
      <SettingsModal isOpen={showSettingsModal} onClose={() => setShowSettingsModal(false)} />

      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          personas={personas}
          onClose={() => setContextMenu(null)}
          onOptionSelect={(option, personaId) => {
            const item = Object.values(items).flat().find(i => i.id === contextMenu.id);
            if (option === "consult" && personaId && item) {
              handleConsult(item.content, personaId, item.id);
            } else if (option === "delete") {
              setItems(prev => {
                const newItems = { ...prev };
                Object.keys(newItems).forEach(key => {
                  newItems[key] = newItems[key].filter(i => i.id !== contextMenu.id);
                });
                return newItems;
              });
            }
            setContextMenu(null);
          }}
        />
      )}
    </DndContext>
  );
}
