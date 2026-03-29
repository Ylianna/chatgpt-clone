import { NextResponse } from "next/server"
import { supabaseServer } from "@/lib/supabase-server"

export async function POST(req: Request) {
    try {
        const body = await req.json()
        const { chatId, message } = body

        if (!chatId || !message) {
            return NextResponse.json({ error: "chatId and message required" }, { status: 400 })
        }

        // **Проверяем, существует ли чат**
        const { data: existingChat } = await supabaseServer
            .from("chats")
            .select("id")
            .eq("id", chatId)
            .single()

        if (!existingChat) {
            const { error: chatError } = await supabaseServer
                .from("chats")
                .insert({ id: chatId })
            if (chatError) {
                return NextResponse.json({ error: chatError.message }, { status: 500 })
            }
        }

        // 1. Сохраняем сообщение пользователя
        const { error: userMessageError } = await supabaseServer
            .from("messages")
            .insert({ chat_id: chatId, role: "user", content: message })

        if (userMessageError) {
            return NextResponse.json({ error: userMessageError.message }, { status: 500 })
        }

        // 2. Получаем историю чата
        const { data: chatHistory } = await supabaseServer
            .from("messages")
            .select("role, content")
            .eq("chat_id", chatId)
            .order("created_at", { ascending: true })

        const conversation = (chatHistory || []).map((m: any) => ({
            role: m.role === "user" ? "user" : "assistant",
            content: m.content,
        }))

        // Добавляем текущее сообщение в конец истории
        conversation.push({ role: "user", content: message })

        // 3. Запрос к AI
        const orResponse = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                model: "openrouter/free",
                messages: conversation,
            }),
        })

        const orResult = await orResponse.json()

        if (!orResult?.choices?.length) {
            console.error("OpenRouter returned no choices", orResult)
            return NextResponse.json({ error: "AI did not respond" }, { status: 500 })
        }

        const assistantMessage = orResult.choices[0].message.content.trim()

        // 4. Сохраняем ответ ассистента
        await supabaseServer.from("messages").insert({
            chat_id: chatId,
            role: "assistant",
            content: assistantMessage,
        })

        return NextResponse.json({ message: assistantMessage })

    } catch (error: any) {
        console.error("Chat API error:", error)
        return NextResponse.json({ error: error.message || "Internal Error" }, { status: 500 })
    }
}