"use client"

import { useState, useEffect } from "react";
import { useUser } from "@/hooks/use-user";
import { useRouter } from "next/navigation";

export default function ChatWindow({ chatId, initialMessages = [] }: { chatId: string, initialMessages?: any[] }) {
    const [messages, setMessages] = useState<any[]>([]);
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);
    const [preview, setPreview] = useState<string | null>(null);
    const [file, setFile] = useState<File | null>(null);
    const [freeLeft, setFreeLeft] = useState<number | null>(null)
    const router = useRouter();

    const user = useUser();

    const getFreeQuestions = () => {
        if (typeof window === "undefined") return 0;
        return Number(localStorage.getItem("free_questions") || "0");
    }

    useEffect(() => {
        if (typeof window !== "undefined" && window.location.hash.includes("access_token")) {
            return;
        }
    }, [user, freeLeft, router]);

    useEffect(() => {
        const count = getFreeQuestions()
        setFreeLeft(3 - count)
    }, [])

    useEffect(() => {
        setMessages(initialMessages);
    }, [initialMessages]);

    useEffect(() => {
        const count = getFreeQuestions();
        setFreeLeft(3 - count);
    }, []);

    const handleFileUpload = (e: any) => {
        const selectedFile = e.target.files[0];
        if (!selectedFile) return;

        setFile(selectedFile);
        setPreview(URL.createObjectURL(selectedFile));
    }

    const sendMessage = async () => {
        console.log(user, "User");
        if ((!input && !file) || loading) return;

        if (!user && freeLeft !== null && freeLeft <= 0) {
            router.push("/login");
            return;
        }

        const messageText = input;
        setLoading(true);

        setMessages(prev => [...prev, { role: "user", content: messageText }]);
        setInput("");

        try {
            let aiResponse = "";

            if (!user) {
                const res = await fetch("/api/messages", { // Используем тот же эндпоинт
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        message: messageText,
                        chatId,
                        userId: null
                    }),
                });
                const data = await res.json();
                aiResponse = data.message;
                const currentCount = Number(localStorage.getItem("free_questions") || "0");
                const newCount = currentCount + 1;
                localStorage.setItem("free_questions", String(newCount));
                setFreeLeft(3 - newCount);

            } else {
                const res = await fetch("/api/messages", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        chatId,
                        message: messageText,
                        userId: user.id
                    }),
                });
                const data = await res.json();
                aiResponse = data.message;
            }

            setMessages(prev => [...prev, { role: "assistant", content: aiResponse }]);

        } catch (e) {
            console.error(e);
            setMessages(prev => [...prev, { role: "assistant", content: "⚠️ Ошибка связи." }]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col h-screen p-6 max-w-3xl mx-auto">
            <div className="flex-1 overflow-y-auto space-y-4 mb-4">
                {messages.map((m, i) => (
                    <div key={i} className={m.role === "user" ? "text-right" : "text-left text-gray-700"}>
                        <div className="inline-block bg-gray-100 p-3 rounded-lg max-w-xs">
                            {m.image && <img src={m.image} className="w-full rounded mb-2" />}
                            {m.content && <p>{m.content}</p>}
                        </div>
                    </div>
                ))}
            </div>

            {!user && freeLeft !== null && (
                <p className="text-sm text-gray-500 mb-2">
                    Free questions left: {freeLeft}
                </p>
            )}

            {typeof window !== "undefined" && preview && (
                <div className="mb-2 flex items-center gap-2">
                    <img src={preview} className="w-16 h-16 object-cover rounded" />
                    <button onClick={() => { setPreview(null); setFile(null); }} className="text-red-500 text-sm">✕</button>
                </div>
            )}

            <div className="flex items-center gap-2 border rounded-lg px-2">
                <label className="cursor-pointer text-xl px-2">
                    +
                    <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
                </label>
                <input
                    placeholder="Ask something..."
                    className="flex-1 p-2 outline-none"
                    value={input}
                    disabled={loading}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={e => { if (e.key === "Enter") sendMessage(); }}
                />
            </div>

            {loading && <p className="text-sm text-gray-400 mt-2">Thinking...</p>}
        </div>
    )
}