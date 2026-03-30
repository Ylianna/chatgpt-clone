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
        const { chatId, message, userId } = body

        if (!message) {
            return NextResponse.json({ error: "Message required" }, { status: 400 })
        }

        let conversation = []

        if (userId) {
            const { data: existingUser } = await supabaseServer
                .from("users")
                .select("id")
                .eq("id", userId)
                .single();

            if (!existingUser) {
                const { error: createUserError } = await supabaseServer
                    .from("users")
                    .insert({ id: userId, email: `${userId}@temp.com` });

                if (createUserError) throw createUserError;
            }
            const { data: chatData } = await supabaseServer
                .from("chats")
                .select("id")
                .eq("id", chatId)
                .single()

            if (!chatData) {
                const { data: newChat, error: insertError } = await supabaseServer
                    .from("chats")
                    .insert({ id: chatId, user_id: userId })
                    .select()
                    .single()
                if (insertError) throw insertError
            }

            const { error: userMsgError } = await supabaseServer
                .from("messages")
                .insert({ chat_id: chatId, role: "user", content: message })

            if (userMsgError) {
                console.error("ОШИБКА БАЗЫ (User Message):", userMsgError)
                throw new Error(`DB Error: ${userMsgError.message}`)
            }

            const { count } = await supabaseServer
                .from("messages")
                .select("*", { count: "exact", head: true })
                .eq("chat_id", chatId)

            if (count === 1) {
                const newTitle = message.length > 40 ? message.slice(0, 40) + "..." : message
                await supabaseServer.from("chats").update({ title: newTitle }).eq("id", chatId)
            }

            const { data: dbMessages } = await supabaseServer
                .from("messages")
                .select("role, content")
                .eq("chat_id", chatId)
                .order("created_at", { ascending: true })

            conversation = dbMessages?.map((m: any) => ({
                role: m.role,
                content: m.content,
            })) || []

        } else {
            conversation = [{ role: "user", content: message }]
        }

        const response = await fetch(
            "https://openrouter.ai/api/v1/chat/completions",
            {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    model: "openrouter/free",
                    messages: conversation,
                }),
            }
        )

        if (!response.ok) {
            const errorText = await response.text()
            console.error("OpenRouter Error:", errorText)
            return NextResponse.json({ error: "LLM failed" }, { status: 500 })
        }

        const result = await response.json()
        const assistantMessage = result?.choices?.[0]?.message?.content || "No response"

        if (userId) {
            const { error: aiMsgError } = await supabaseServer.from("messages").insert({
                chat_id: chatId,
                role: "assistant",
                content: assistantMessage
            })
            if (aiMsgError) console.error("ОШИБКА БАЗЫ (AI Message):", aiMsgError)
        }

        return NextResponse.json({ message: assistantMessage })

    } catch (e: any) {
        console.error("API ERROR:", e.message)
        return NextResponse.json({ error: e.message || "Internal error" }, { status: 500 })
    }
}