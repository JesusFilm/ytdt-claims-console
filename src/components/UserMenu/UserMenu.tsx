"use client"

import { useState } from "react"
import Image from "next/image"

import { useAuth } from "@/contexts/AuthContext"
import { logout } from "@/utils/auth"

export default function UserMenu() {
  const { user } = useAuth()
  const [open, setOpen] = useState(false)

  if (!user) return null

  return (
    <div className="relative">
      <div
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-100 cursor-pointer"
      >
        <Image
          src={user.picture}
          alt={user.name}
          width={32}
          height={32}
          className="rounded-full"
        />
        <span className="text-sm font-medium">{user.name}</span>
      </div>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg py-1 z-20">
            <div className="px-4 py-2 text-sm text-gray-500 border-b">
              {user.email}
            </div>
            <button
              onClick={logout}
              className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100"
            >
              Sign out
            </button>
          </div>
        </>
      )}
    </div>
  )
}
