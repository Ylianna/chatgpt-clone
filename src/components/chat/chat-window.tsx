"use client"

import { useState } from "react"
import { useUser } from "@/hooks/use-user"

export default function ChatWindow({ chatId }: { chatId: string }) {
    const [messages, setMessages] = useState<any[]>([])
    const [input, setInput] = useState("")
    const [loading, setLoading] = useState(false)

    const user = useUser()

    // получаем количество бесплатных сообщений
    const getFreeQuestions = () => {
        if (typeof window === "undefined") return 0
        return Number(localStorage.getItem("free_questions") || "0")
    }

    // увеличиваем счетчик
    const incrementFreeQuestions = () => {
        const count = getFreeQuestions() + 1
        localStorage.setItem("free_questions", count.toString())
    }

    const sendMessage = async () => {
        if (!input || loading) return

        const freeQuestions = getFreeQuestions()

        // проверяем лимит
        if (!user && freeQuestions >= 3) {
            alert("You reached the free limit. Please login.")
            window.location.href = "/login"
            return
        }

        const userMessage = {
            role: "user",
            content: input,
        }

        setMessages((prev) => [...prev, userMessage])
        setInput("")
        setLoading(true)

        try {
            const res = await fetch("/api/messages", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    chatId,
                    message: userMessage.content,
                }),
            })

            const data = await res.json()

            setMessages((prev) => [
                ...prev,
                { role: "assistant", content: data.message },
            ])

            // увеличиваем счетчик если пользователь анонимный
            if (!user) {
                incrementFreeQuestions()
            }

        } catch (error) {
            console.error(error)
        }

        setLoading(false)
    }

    return (
        <div className="flex flex-col h-screen p-6 max-w-3xl mx-auto">

            {/* сообщения */}
            <div className="flex-1 overflow-y-auto space-y-4 mb-4">
                {messages.map((m, i) => (
                    <div
                        key={i}
                        className={
                            m.role === "user"
                                ? "text-right"
                                : "text-left text-gray-700"
                        }
                    >
                        <div className="inline-block bg-gray-100 p-3 rounded-lg">
                            {m.content}
                        </div>
                    </div>
                ))}
            </div>

            {/* лимит сообщений */}
            {!user && (
                <p className="text-sm text-gray-500 mb-2">
                    Free questions left: {3 - getFreeQuestions()}
                </p>
            )}

            {/* input */}
            <div className="flex gap-2">
                <input
                    placeholder="Ask something..."
                    className="border rounded-lg p-2 flex-1"
                    value={input}
                    disabled={loading}
                    onKeyDown={(e) => {
                        if (e.key === "Enter") {
                            sendMessage()
                        }
                    }}
                    onChange={(e) => setInput(e.target.value)}
                />

                <button
                    onClick={sendMessage}
                    disabled={loading}
                    className="bg-black text-white px-4 rounded-lg"
                >
                    Send
                </button>
            </div>

            {loading && (
                <p className="text-sm text-gray-400 mt-2">
                    Thinking...
                </p>
            )}

        </div>
    )
}