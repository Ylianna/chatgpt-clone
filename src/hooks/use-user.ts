"use client"

import { supabase } from "@/lib/supabase-client"
import { useEffect, useState } from "react"

export function useUser() {
    const [user, setUser] = useState<any>(null)

    useEffect(() => {
        supabase.auth.getUser().then(({ data }) => {
            setUser(data.user)
        })
    }, [])

    return user
}