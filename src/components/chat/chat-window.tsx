"use client"

import { useState } from "react"

export default function ChatWindow({ chatId }: { chatId: string }) {
    const [messages, setMessages] = useState<any[]>([])
    const [input, setInput] = useState("")
    const [loading, setLoading] = useState(false)

    const sendMessage = async () => {
        if (!input) return

        const userMessage = {
            role: "user",
            content: input,
        }

        setMessages((prev) => [...prev, userMessage])
        setInput("")
        setLoading(true)

        const res = await fetch("/api/messages", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                chatId,
                message: input,
            }),
        })

        const data = await res.json()

        setMessages((prev) => [
            ...prev,
            { role: "assistant", content: data.message },
        ])

        setLoading(false)
    }

    return (
        <div className="flex flex-col h-screen p-6">

            <div className="flex-1 overflow-y-auto space-y-4">
                {messages.map((m, i) => (
                    <div key={i}>
                        <b>{m.role}:</b> {m.content}
                    </div>
                ))}
            </div>

            <div className="flex gap-2 mt-4">
                <input
                    className="border p-2 flex-1"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                />

                <button
                    onClick={sendMessage}
                    className="bg-black text-white px-4 py-2"
                >
                    Send
                </button>
            </div>

            {loading && <p>Thinking...</p>}
        </div>
    )
}