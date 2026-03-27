"use client"

import { useEffect } from "react"
import { supabase } from "@/lib/supabase-client"
import ChatWindow from "@/components/chat/chat-window"

export default function Page() {

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      console.log("SESSION", data.session)
    })
  }, [])

  return  <ChatWindow chatId="eb4b69d9-2bfc-4690-91ec-1b8123f2220a" />
}