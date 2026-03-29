"use client"

import { useState, useEffect } from "react"
import { v4 as uuidv4 } from "uuid"
import ChatWindow from "@/components/chat/chat-window"
import { useUser } from "@/hooks/use-user"

export default function Page() {
    const [chatId, setChatId] = useState<string | null>(null)
    const [chats, setChats] = useState<any[]>([])
    const user = useUser()

    // Загружаем чаты только после того как user доступен
    useEffect(() => {
        if (!user) return

        const fetchChats = async () => {
            try {
                const res = await fetch(`/api/chats?userId=${user.id}`)
                const data = await res.json()
                console.log("Чаты, полученные с бэка:", data)
                setChats(data)
                if (data.length && !chatId) setChatId(data[0].id) // первый чат выбран по умолчанию
            } catch (err) {
                console.error(err)
            }
        }

        fetchChats()
    }, [user])

    const createNewChat = async () => {
        if (user) {
            const res = await fetch("/api/chats", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ userId: user.id })
            })
            const data = await res.json()
            setChats(prev => [data, ...prev])
            setChatId(data.id)
        } else {
            const newId = uuidv4()
            setChatId(newId)
        }
    }

    // Ждем загрузки user, чтобы избежать SSR/CSR расхождения
    if (!user) return <div className="p-4">Loading user...</div>

    return (
        <div className="flex h-screen">
            {/* Левая панель */}
            <div className="w-64 border-r p-4 flex flex-col">
                <button
                    onClick={createNewChat}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 mb-4"
                >
                    Новый чат
                </button>

                <div className="flex-1 overflow-y-auto space-y-2">
                    {chats.map(chat => (
                        <div
                            key={chat.id}
                            onClick={() => setChatId(chat.id)}
                            className={`p-2 rounded cursor-pointer ${
                                chat.id === chatId ? "bg-blue-200" : "hover:bg-gray-200"
                            }`}
                        >
                            {chat.title || "Untitled chat"}
                        </div>
                    ))}
                </div>
            </div>

            {/* Основная область чата */}
            <div className="flex-1">
                {chatId && <ChatWindow key={chatId} chatId={chatId} />}
            </div>
        </div>
    )
}