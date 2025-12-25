import { createClient } from "@supabase/supabase-js";
import { streamText } from "ai";
import { anthropic } from "@ai-sdk/anthropic";
import { google } from "@ai-sdk/google";
import { createOpenAI } from "@ai-sdk/openai";

// Initialize Supabase Admin strictly for fetching the persona (Auth is handled, but here we just need raw read access for the prompt)
// Actually, we can just use the public key query if RLS allows it, or use the service role key if we had one.
// Since we enabled "Enable read access for all users" in the migration, the standard client works.
// BUT, route handlers are server-side. We should construct a client.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

// Initialize custom OpenAI provider for Grok
const grok = createOpenAI({
    baseURL: 'https://api.x.ai/v1',
    apiKey: process.env.XAI_API_KEY,
});

const openai = createOpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

export const maxDuration = 30;

export async function POST(req: Request) {
    const { content, personaId } = await req.json();

    if (!content || !personaId) {
        return new Response("Missing content or personaId", { status: 400 });
    }

    // 1. Fetch Persona from DB
    const { data: persona, error } = await supabase
        .from("personas")
        .select("*")
        .eq("id", personaId)
        .single();

    if (error || !persona) {
        return new Response("Persona not found", { status: 404 });
    }

    // 2. Select Model
    let model;
    if (persona.model === "claude-3-5-sonnet") {
        // Fallback if no anthropic key, or strictly use it
        if (process.env.ANTHROPIC_API_KEY) {
            model = anthropic("claude-3-5-sonnet-20240620");
        } else {
            // Fallback to OpenAI if desired, or error. 
            // For this user who provided Grok/OpenAI, let's map Claude -> GPT-4o as a fallback or just error.
            // But better yet, I will update the persona in DB to use 'grok-beta' or 'gpt-4o'.
            // If the DB still says claude, we'll try OpenAI GPT-4o as a "smart fallback" since they provided that key.
            model = openai("gpt-4o");
        }
    } else if (persona.model === "gemini-1.5-pro") {
        model = google("models/gemini-1.5-pro-latest");
    } else if (persona.model === "grok-beta") {
        model = grok("grok-beta");
    } else if (persona.model === "gpt-4o") {
        model = openai("gpt-4o");
    } else {
        // Default fallback
        model = google("models/gemini-1.5-pro-latest");
    }

    // 3. Stream Response
    const result = await streamText({
        model: model,
        system: persona.system_prompt,
        prompt: `Analyze this content:\n\n"${content}"`,
    });

    return result.toTextStreamResponse();
}
