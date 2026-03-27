import { NextResponse } from "next/server"
import { supabaseServer } from "@/lib/supabase-server"

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

        // 1. Сохраняем сообщение пользователя
        const { error: userMessageError } = await supabaseServer
            .from("messages")
            .insert({ chat_id: chatId, role: "user", content: message })

        if (userMessageError) {
            return NextResponse.json(
                { error: userMessageError.message },
                { status: 500 }
            )
        }

        // 2. Получаем историю чата
        const { data: messages } = await supabaseServer
            .from("messages")
            .select("role, content")
            .eq("chat_id", chatId)
            .order("created_at", { ascending: true })

        const conversation = messages
            ?.map((m: any) => ({
                role: m.role === "user" ? "user" : "assistant",
                content: m.content,
            })) || []

        // Добавляем текущее сообщение в конец истории
        conversation.push({ role: "user", content: message })

        // 3. Запрос к OpenRouter
        const orResponse = await fetch(
            "https://openrouter.ai/api/v1/chat/completions",
            {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    model: "openrouter/free",
                    messages: conversation,
                }),
            }
        )

        if (!orResponse.ok) {
            const errorText = await orResponse.text()
            console.error("OpenRouter Error:", errorText)
            return NextResponse.json(
                { error: "OpenRouter rejection" },
                { status: orResponse.status }
            )
        }

        const orResult = await orResponse.json()

        const assistantMessage =
            orResult?.choices?.[0]?.message?.content?.trim() ||
            "Sorry, I couldn't generate a response."

        // 4. Сохраняем ответ ассистента
        await supabaseServer.from("messages").insert({
            chat_id: chatId,
            role: "assistant",
            content: assistantMessage,
        })

        return NextResponse.json({ message: assistantMessage })
    } catch (error: any) {
        console.error("Chat API error:", error)
        return NextResponse.json(
            { error: error.message || "Internal Error" },
            { status: 500 }
        )
    }
}