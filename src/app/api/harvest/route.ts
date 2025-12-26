import { createClient } from "@supabase/supabase-js";
import Parser from "rss-parser";
import { NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

export async function POST() {
    try {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
        const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
        const supabase = createClient(supabaseUrl, supabaseKey);
        const parser = new Parser();

        // 1. Get Sources
        const { data: sources, error: sourceError } = await supabase
            .from('sources')
            .select('*')
            .eq('active', true);

        if (sourceError || !sources) {
            return NextResponse.json({ error: "Failed to fetch sources" }, { status: 500 });
        }

        let newItemsCount = 0;
        const allItems: any[] = [];
        
        // Helper to get feed ID (naive: get first system feed)
        let { data: feeds } = await supabase.from('feeds').select('id').limit(1);
        let feedId = feeds?.[0]?.id;
        
        if (!feedId) {
             // Create default feed if missing
             const { data: newFeed } = await supabase.from('feeds').insert({ title: 'HARVESTER_FEED', type: 'system' }).select().single();
             feedId = newFeed?.id;
        }

        // 2. Fetch Feeds
        for (const source of sources) {
            try {
                const feed = await parser.parseURL(source.url);
                // Take latest 5 items
                const recentItems = feed.items.slice(0, 5);
                
                for (const item of recentItems) {
                    if (!item.link) continue;
                    
                    allItems.push({
                        feed_id: feedId,
                        content: item.title + ": " + (item.contentSnippet || item.content || "").substring(0, 200) + "...",
                        // Store link in metadata for dedupe
                        metadata: {
                            source: source.name,
                            url: item.link,
                            handle: "RSS",
                            publishedAt: item.pubDate
                        }
                    });
                }
            } catch (err) {
                console.error(`Failed to parse ${source.name}:`, err);
            }
        }

        // 3. Deduplicate & Insert
        // Ideally we do this in SQL, but for now lets check existence in code or perform insert on conflict do nothing if we had a constraint.
        // We don't have a unique constraint on metadata->url. So we must query.
        
        // Optimization: Get all recent URLs from DB to compare? Or just check one by one?
        // Checking one by one is slow. Let's fetch all items from last 24h and compare URLs.
        // Actually, for MVP, let's just insert and rely on simple checks.
        // Let's grab all item metadata where source is one of our sources.
        
        // Better: For each item candidate, check if exists.
        // To save RCU, let's just insert blindly? No, defaults to duplicate spam.
        
        // Let's do a batch check.
        const candidateUrls = allItems.map(i => i.metadata.url);
        // This is tricky with JSONB column query.
        // Let's just create a new items list.
        
        // Alternative: Add a 'external_id' column to items for strict dedupe? 
        // We have 'id' (uuid).
        // Let's use `metadata->>url` check.
        
        // Fetch existing URLs from last 100 items
        const { data: existingItems } = await supabase.from('items').select('metadata').order('created_at', { ascending: false }).limit(200);
        const existingUrls = new Set(existingItems?.map((i: any) => i.metadata?.url).filter(Boolean));
        
        const itemsToInsert = allItems.filter(i => !existingUrls.has(i.metadata.url));
        
        if (itemsToInsert.length > 0) {
            const { error: insertError } = await supabase.from('items').insert(itemsToInsert);
            if (!insertError) {
                newItemsCount = itemsToInsert.length;
            } else {
                console.error("Insert Error:", insertError);
            }
        }

        return NextResponse.json({ status: 'success', newItemsCount, sourcesCount: sources.length });

    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
