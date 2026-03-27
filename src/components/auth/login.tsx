"use client"

import { supabase } from "@/lib/supabase-client"
import { useState } from "react"

export default function Login() {
    const [email, setEmail] = useState("")

    const login = async () => {
        if (!email) {
            alert("Enter a valid email");
            return;
        }

        const { data, error } = await supabase.auth.signInWithOtp({
            email,
            options: { emailRedirectTo: "http://localhost:3000" } // optional
        });

        if (error) {
            console.error("Error sending login link:", error);
            alert("Error sending login link: " + error.message);
            return;
        }

        console.log("Login link sent:", data);
        alert("Check your email for the login link");
    }

    return (
        <div className="flex flex-col gap-4 max-w-sm mx-auto mt-20">

            <h1 className="text-xl font-bold">Login</h1>

            <input
                className="border p-2"
                placeholder="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
            />

            <button
                className="bg-black text-white p-2"
                onClick={login}
            >
                Login
            </button>

        </div>
    )
}