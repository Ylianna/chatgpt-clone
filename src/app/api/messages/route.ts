// GET /api/messages?chatId=...
import { NextResponse } from "next/server"
import { supabaseServer } from "@/lib/supabase-server"

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url)
        const chatId = searchParams.get("chatId")

        if (!chatId) {
            return NextResponse.json({ error: "chatId required" }, { status: 400 })
        }

        const { data, error } = await supabaseServer
            .from("messages")
            .select("*")
            .eq("chat_id", chatId)
            .order("created_at", { ascending: true })

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 })
        }

        return NextResponse.json(data)
    } catch (err) {
        return NextResponse.json({ error: "Failed to fetch messages" }, { status: 500 })
    }
}