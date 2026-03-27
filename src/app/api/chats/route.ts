import { NextResponse } from "next/server"
import { supabaseServer } from "@/lib/supabase-server"

export async function POST(req: Request) {
    try {
        const body = await req.json()
        const { userId, title } = body

        const { data, error } = await supabaseServer
            .from("chats")
            .insert({
                user_id: userId,
                title: title || "New chat"
            })
            .select()
            .single()

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 })
        }

        return NextResponse.json(data)
    } catch (error) {
        return NextResponse.json({ error: "Failed to create chat" }, { status: 500 })
    }
}