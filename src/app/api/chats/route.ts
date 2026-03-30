import { NextResponse } from "next/server"
import { supabaseServer } from "@/lib/supabase-server"

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url)
        const userId = searchParams.get("userId")

        if (!userId) {
            return NextResponse.json({ error: "User must be logged in" }, { status: 401 })
        }

        const { data, error } = await supabaseServer
            .from("chats")
            .select("*")
            .eq("user_id", userId)
            .order("created_at", { ascending: false })

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 })
        }

        return NextResponse.json(data)
    } catch (error) {
        return NextResponse.json({ error: "Failed to fetch chats" }, { status: 500 })
    }
}

export async function POST(req: Request) {
    try {
        const body = await req.json()
        const { userId, title, firstMessage } = body

        if (!userId) {
            return NextResponse.json(
                { error: "User must be logged in" },
                { status: 401 }
            )
        }

        let chatTitle = "New chat"

        if (firstMessage && firstMessage.trim().length > 0) {
            chatTitle =
                firstMessage.length > 40
                    ? firstMessage.slice(0, 40) + "..."
                    : firstMessage
        } else if (title) {
            chatTitle = title
        }

        const { data, error } = await supabaseServer
            .from("chats")
            .insert({
                user_id: userId,
                title: chatTitle,
            })
            .select()
            .single()

        if (error) {
            return NextResponse.json(
                { error: error.message },
                { status: 500 }
            )
        }

        return NextResponse.json(data)

    } catch (error) {
        return NextResponse.json(
            { error: "Failed to create chat" },
            { status: 500 }
        )
    }
}