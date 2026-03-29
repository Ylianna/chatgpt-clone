import { supabaseServer } from "@/lib/supabase-server";

export async function POST(req: Request) {
    try {
        const formData = await req.formData();
        const file = formData.get("file") as File;

        if (!file) {
            return new Response(JSON.stringify({ error: "No file uploaded" }), { status: 400 });
        }

        // Конвертируем файл в Buffer
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        // Уникальное имя файла
        const fileName = `${Date.now()}-${file.name}`;

        // Загружаем в Supabase
        const { data, error } = await supabaseServer.storage
            .from("chat-images")
            .upload(`images/${fileName}`, buffer, {
                contentType: file.type,
                upsert: true,
            });

        if (error) {
            return new Response(JSON.stringify({ error: error.message }), { status: 500 });
        }

        // Получаем публичный URL
        const { data: publicUrl } = supabaseServer.storage
            .from("chat-images")
            .getPublicUrl(data.path);

        return new Response(JSON.stringify({ url: publicUrl.publicUrl }), { status: 200 });

    } catch (e: any) {
        console.error("UPLOAD ERROR:", e);
        return new Response(JSON.stringify({ error: e.message }), { status: 500 });
    }
}