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
                <div className="p-4 border-b bg-gray-50">
                    <button
                        onClick={createNewChat}
                        // Меняем bg-blue-500 на bg-gray-200, а текст на более темный для контраста
                        className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium text-sm"
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