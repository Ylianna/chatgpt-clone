import { NextResponse } from "next/server"
import { supabaseServer } from "@/lib/supabase-server"

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url)
        const chatId = searchParams.get("chatId")

        if (!chatId) {
            return NextResponse.json(
                { error: "chatId required" },
                { status: 400 }
            )
        }

        const { data, error } = await supabaseServer
            .from("messages")
            .select("*")
            .eq("chat_id", chatId)
            .order("created_at", { ascending: true })

        if (error) {
            return NextResponse.json(
                { error: error.message },
                { status: 500 }
            )
        }

        return NextResponse.json(data)

    } catch {
        return NextResponse.json(
            { error: "Failed to fetch messages" },
            { status: 500 }
        )
    }
}

export async function POST(req: Request) {
    try {
        const body = await req.json()
        const { chatId, message } = body

        if (!chatId || !message) {
            return NextResponse.json(
                { error: "chatId and message required" },
                { status: 400 }
            )
        }

        await supabaseServer.from("messages").insert({
            chat_id: chatId,
            role: "user",
            content: message,
        })
        const { count } = await supabaseServer
            .from("messages")
            .select("*", { count: "exact", head: true })
            .eq("chat_id", chatId)

        if (count === 1) {
            const newTitle =
                message.length > 40
                    ? message.slice(0, 40) + "..."
                    : message

            await supabaseServer
                .from("chats")
                .update({ title: newTitle })
                .eq("id", chatId)
        }
        const { data: messages } = await supabaseServer
            .from("messages")
            .select("role, content")
            .eq("chat_id", chatId)
            .order("created_at", { ascending: true })

        const conversation =
            messages?.map((m: any) => ({
                role: m.role,
                content: m.content,
            })) || []

        const response = await fetch(
            "https://openrouter.ai/api/v1/chat/completions",
            {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    model: "openai/gpt-3.5-turbo",
                    messages: conversation,
                }),
            }
        )

        if (!response.ok) {
            const text = await response.text()
            console.error(text)

            return NextResponse.json(
                { error: "LLM failed" },
                { status: 500 }
            )
        }

        const result = await response.json()

        const assistantMessage =
            result?.choices?.[0]?.message?.content || "No response"

        await supabaseServer.from("messages").insert({
            chat_id: chatId,
            role: "assistant",
            content: assistantMessage,
        })

        return NextResponse.json({ message: assistantMessage })

    } catch (e: any) {
        console.error("API ERROR:", e)

        return NextResponse.json(
            { error: "Internal error" },
            { status: 500 }
        )
    }
}