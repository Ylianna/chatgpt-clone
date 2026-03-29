import { NextResponse } from "next/server"
import { supabaseServer } from "@/lib/supabase-server"

export async function POST(req: Request) {
    try {
        const formData = await req.formData()
        const file = formData.get("file") as File
        const chatId = formData.get("chatId") as string

        if (!file || !chatId) {
            return NextResponse.json({ error: "Missing file or chatId" }, { status: 400 })
        }

        const fileName = `${Date.now()}-${file.name}`

        // загружаем в storage
        const { error: uploadError } = await supabaseServer.storage
            .from("chat-images")
            .upload(fileName, file)

        if (uploadError) {
            return NextResponse.json({ error: uploadError.message }, { status: 500 })
        }

        // получаем публичный URL
        const { data } = supabaseServer.storage
            .from("chat-images")
            .getPublicUrl(fileName)

        const fileUrl = data.publicUrl

        // сохраняем в таблицу files
        await supabaseServer.from("files").insert({
            chat_id: chatId,
            filename: file.name,
            url: fileUrl,
        })

        return NextResponse.json({ url: fileUrl })
    } catch (error) {
        return NextResponse.json({ error: "Upload failed" }, { status: 500 })
    }
}