"use client"

import { useState } from "react"
import { v4 as uuidv4 } from "uuid"
import ChatWindow from "@/components/chat/chat-window"

export default function Page() {
    const [chatId, setChatId] = useState(uuidv4())

    const createNewChat = () => {
        setChatId(uuidv4()) // новый chatId
    }

    return (
        <div className="flex flex-col h-screen">
            <div className="p-4 border-b">
                <button
                    onClick={createNewChat}
                    className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                    Новый чат
                </button>
            </div>

            <div className="flex-1">
                {/* ключ гарантирует полное пересоздание компонента */}
                <ChatWindow key={chatId} chatId={chatId} />
            </div>
        </div>
    )
}