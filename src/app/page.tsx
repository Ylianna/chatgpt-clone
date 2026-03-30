"use client"

import { useState, useEffect } from "react"
import { v4 as uuidv4 } from "uuid"
import ChatWindow from "@/components/chat/chat-window"
import { useUser } from "@/hooks/use-user"

export default function Page() {
    const [chatId, setChatId] = useState<string | null>(null)
    const [chats, setChats] = useState<any[]>([])
    const user = useUser()
    const [messages, setMessages] = useState<any[]>([])

    // 1. При загрузке страницы для анонима создаем временный chatId, если его нет
    useEffect(() => {
        if (!user && !chatId) {
            setChatId(uuidv4())
        }
    }, [user, chatId])

    useEffect(() => {
        if (!chatId) return

        const fetchMessages = async () => {
            try {
                const res = await fetch(`/api/messages?chatId=${chatId}`)
                if (!res.ok) return // Игнорируем ошибки для новых анонимных чатов
                const data = await res.json()
                setMessages(data)
            } catch (err) {
                console.error(err)
            }
        }

        fetchMessages()
    }, [chatId])

    useEffect(() => {
        if (!user) return

        const fetchChats = async () => {
            try {
                const res = await fetch(`/api/chats?userId=${user.id}`)
                const data = await res.json()
                setChats(data)
                if (data.length && !chatId) setChatId(data[0].id)
            } catch (err) {
                console.error(err)
            }
        }

        fetchChats()
    }, [user])

    const createNewChat = async () => {
        if (!user) return // Анонимы не создают новые чаты вручную

        const res = await fetch("/api/chats", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ userId: user.id })
        })
        const data = await res.json()
        setChats(prev => [data, ...prev])
        setChatId(data.id)
    }

    // 2. УДАЛЯЕМ жесткий return !user. Вместо него проверяем только состояние загрузки (если оно есть в вашем хуке)
    // Если ваш useUser возвращает undefined пока грузится, используйте:
    // if (user === undefined) return <div>Loading...</div>

    return (
        <div className="flex h-screen">
            {/* Левая панель - показываем только если есть юзер */}
            {user && (
                <div className="w-64 border-r p-4 flex flex-col">
                    <button
                        onClick={createNewChat}
                        className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 mb-4"
                    >
                        New chat
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
            )}

            {/* Основная область чата */}
            <div className="flex-1">
                {chatId ? (
                    <ChatWindow key={chatId} chatId={chatId} initialMessages={messages} />
                ) : (
                    <div className="flex items-center justify-center h-full">Preparing chat...</div>
                )}
            </div>
        </div>
    )
}