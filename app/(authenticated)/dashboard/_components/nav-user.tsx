"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu"
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar
} from "@/components/ui/sidebar"
import { useClerk } from "@clerk/nextjs"
import {
  ChevronsUpDown,
  CreditCard,
  HelpCircle,
  LogOut,
  Moon,
  Sun,
  User
} from "lucide-react"
import { useTheme } from "next-themes"
import Link from "next/link"
import { useEffect, useState } from "react"

export function NavUser({
  user
}: {
  user: {
    name: string
    email: string
    avatar: string
    membership: string
  }
}) {
  const { isMobile } = useSidebar()
  const { theme, setTheme } = useTheme()
  const { signOut } = useClerk()
  const [role, setRole] = useState<"ADMIN" | "HANDLER" | "AUDITOR" | null>(null)
  const [roleLoaded, setRoleLoaded] = useState(false)

  useEffect(() => {
    let aborted = false
    ;(async () => {
      try {
        const res = await fetch("/api/auth/role", { cache: "no-store" })
        const data = await res.json()
        if (!aborted) {
          setRole((data?.role as typeof role) ?? null)
          setRoleLoaded(true)
        }
      } catch {
        if (!aborted) {
          setRole(null)
          setRoleLoaded(true)
        }
      }
    })()
    return () => {
      aborted = true
    }
  }, [])

  const getInitials = (name: string) => {
    const words = name.split(" ")
    if (words.length >= 2) {
      return words[0][0] + words[1][0]
    }
    return name.slice(0, 2).toUpperCase()
  }

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <Avatar className="h-8 w-8 rounded-lg">
                <AvatarImage src={user.avatar} alt={user.name} />
                <AvatarFallback className="rounded-lg">
                  {getInitials(user.name)}
                </AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">{user.name}</span>
                <div className="flex gap-1 mt-0.5">
                  <Badge
                    variant={user.membership === "pro" ? "default" : "secondary"}
                    className="w-fit px-2 py-0 text-xs"
                  >
                    {user.membership === "pro" ? "Pro" : "Free"}
                  </Badge>
                  {roleLoaded && (
                    <Badge
                      variant="outline"
                      className="w-fit px-2 py-0 text-xs"
                    >
                      {role ? role.charAt(0) + role.slice(1).toLowerCase() : "User"}
                    </Badge>
                  )}
                </div>
              </div>
              <ChevronsUpDown className="ml-auto size-4" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
            side={isMobile ? "bottom" : "right"}
            align="end"
            sideOffset={4}
          >
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                <Avatar className="h-8 w-8 rounded-lg">
                  <AvatarImage src={user.avatar} alt={user.name} />
                  <AvatarFallback className="rounded-lg">
                    {getInitials(user.name)}
                  </AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">{user.name}</span>
                  <span className="truncate text-xs">{user.email}</span>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem asChild>
                <Link href="/dashboard/account">
                  <User />
                  Account
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/dashboard/billing">
                  <CreditCard />
                  Billing
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/dashboard/support">
                  <HelpCircle />
                  Support
                </Link>
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            >
              {theme === "dark" ? <Sun /> : <Moon />}
              {theme === "dark" ? "Light Mode" : "Dark Mode"}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => signOut()}>
              <LogOut />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
