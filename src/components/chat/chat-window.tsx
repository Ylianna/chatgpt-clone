"use client"

import { useState } from "react"
import { useUser } from "@/hooks/use-user"
import { useEffect } from "react"

export default function ChatWindow({ chatId }: { chatId: string }) {
    const [messages, setMessages] = useState<any[]>([])
    const [input, setInput] = useState("")
    const [loading, setLoading] = useState(false)
    const [preview, setPreview] = useState<string | null>(null)
    const [file, setFile] = useState<File | null>(null)
    const [freeLeft, setFreeLeft] = useState(3)

    const user = useUser()

    // получаем количество бесплатных сообщений
    const getFreeQuestions = () => {
        if (typeof window === "undefined") return 0
        return Number(localStorage.getItem("free_questions") || "0")
    }

    useEffect(() => {
        const count = Number(localStorage.getItem("free_questions") || "0")
        setFreeLeft(3 - count)
    }, [])

    // увеличиваем счетчик
    const incrementFreeQuestions = () => {
        const count = getFreeQuestions() + 1
        localStorage.setItem("free_questions", count.toString())
    }

    const handleFileUpload = (e: any) => {
        const selectedFile = e.target.files[0]
        if (!selectedFile) return

        setFile(selectedFile)
        setPreview(URL.createObjectURL(selectedFile))
    }

    const sendMessage = async () => {
        if ((!input && !file) || loading) return

        const messageText = input

        const freeQuestions = getFreeQuestions()

        if (!user && freeQuestions >= 3) {
            alert("You reached the free limit. Please login.")
            window.location.href = "/login"
            return
        }

        setLoading(true)

        let imageUrl = null

        if (file) {
            const formData = new FormData()
            formData.append("file", file)
            formData.append("chatId", chatId)

            const res = await fetch("/api/upload", {
                method: "POST",
                body: formData,
            })

            const data = await res.json()
            imageUrl = data.url
        }

        const userMessage = {
            role: "user",
            content: messageText,
            image: imageUrl,
        }

        setMessages((prev) => [...prev, userMessage])

        setInput("")
        setPreview(null)
        setFile(null)

        try {
            const res = await fetch("/api/messages", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    chatId,
                    message: messageText,
                }),
            })

            const data = await res.json()

            setMessages((prev) => [
                ...prev,
                { role: "assistant", content: data.message },
            ])

            if (!user) {
                incrementFreeQuestions()
                setFreeLeft((prev) => prev - 1)
            }

        } catch (e) {
            console.error(e)
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
                        <div className="inline-block bg-gray-100 p-3 rounded-lg max-w-xs">

                            {m.image && (
                                <img
                                    src={m.image}
                                    className="w-full rounded mb-2"
                                />
                            )}

                            {m.content && <p>{m.content}</p>}

                        </div>
                    </div>
                ))}
            </div>

            {/* лимит сообщений */}
            {!user && (
                <p className="text-sm text-gray-500 mb-2">
                    Free questions left: {freeLeft}
                </p>
            )}

            {/* input */}
            {preview && (
                <div className="mb-2 flex items-center gap-2">
                    <img src={preview} className="w-16 h-16 object-cover rounded" />

                    <button
                        onClick={() => {
                            setPreview(null)
                            setFile(null)
                        }}
                        className="text-red-500 text-sm"
                    >
                        ✕
                    </button>
                </div>
            )}
            <div className="flex items-center gap-2 border rounded-lg px-2">
                <label className="cursor-pointer text-xl px-2">
                    +
                    <input
                        type="file"
                        accept="image/*"
                        onChange={handleFileUpload}
                        className="hidden"
                    />
                </label>

                {/* текстовый input */}
                <input
                    placeholder="Ask something..."
                    className="flex-1 p-2 outline-none"
                    value={input}
                    disabled={loading}
                    onKeyDown={(e) => {
                        if (e.key === "Enter") {
                            sendMessage()
                        }
                    }}
                    onChange={(e) => setInput(e.target.value)}
                />
            </div>

            {loading && (
                <p className="text-sm text-gray-400 mt-2">
                    Thinking...
                </p>
            )}

        </div>
    )
}