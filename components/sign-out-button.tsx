"use client"

import { LogOut } from "lucide-react"
import { Button } from "@/components/ui/button"
import { signout } from "@/app/actions/auth"

export function SignOutButton() {
  return (
    <form action={signout}>
      <Button variant="destructive" type="submit">
        <LogOut className="w-4 h-4 mr-2" />
        Sign Out
      </Button>
    </form>
  )
}
