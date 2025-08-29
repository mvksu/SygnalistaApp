import { cn } from "@/lib/utils"
import {
  TooltipProvider,
  Tooltip,
  TooltipContent,
  TooltipTrigger
} from "@/components/ui/tooltip"

import { Code2, Book, RefreshCcw, Check } from "lucide-react"

type ChatMessageProps = {
  isUser?: boolean
  children: React.ReactNode
  senderLabel?: string
  createdAt?: string | Date
  avatarUrl?: string
}

function formatDate(input?: string | Date) {
  if (!input) return ""
  const d = typeof input === "string" ? new Date(input) : input
  return isNaN(d.getTime()) ? "" : d.toLocaleString()
}

export function ChatMessage({ isUser, children, senderLabel, createdAt, avatarUrl }: ChatMessageProps) {
  return (
    <article
      className={cn(
        "flex items-start gap-4 text-[15px] leading-relaxed",
        isUser && "justify-end"
      )}
    >
      <img
        className={cn(
          "rounded-full",
          isUser ? "order-1" : "border border-black/[0.08] shadow-sm"
        )}
        src={
          avatarUrl && avatarUrl.length > 0
            ? avatarUrl
            : isUser
              ? "https://raw.githubusercontent.com/origin-space/origin-images/refs/heads/main/exp2/user-02_mlqqqt.png"
              : "https://raw.githubusercontent.com/origin-space/origin-images/refs/heads/main/exp2/user-01_i5l7tp.png"
        }
        alt={isUser ? "User profile" : "Reporter"}
        width={40}
        height={40}
      />
      <div className={cn(isUser ? "bg-muted rounded-xl px-4 py-3" : "space-y-4")}>
        <div className="flex flex-col gap-1">
          {senderLabel && (
            <div className="text-sm font-medium">{senderLabel}</div>
          )}
          {createdAt && (
            <div className="text-xs text-muted-foreground">{formatDate(createdAt)}</div>
          )}
          <div className="flex flex-col gap-3">
            <p className="sr-only">{isUser ? "You" : "Sender"} said:</p>
            {children}
          </div>
        </div>
        {/* {!isUser && <MessageActions />} */}
      </div>
    </article>
  )
}

type ActionButtonProps = {
  icon: React.ReactNode
  label: string
}

function ActionButton({ icon, label }: ActionButtonProps) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button className="text-muted-foreground/80 hover:text-foreground before:bg-border focus-visible:outline-ring/70 relative flex size-8 items-center justify-center outline-offset-2 transition-colors before:absolute before:inset-y-1.5 before:left-0 before:w-px first:before:hidden first-of-type:rounded-s-lg last-of-type:rounded-e-lg focus-visible:z-10 focus-visible:outline-2">
          {icon}
          <span className="sr-only">{label}</span>
        </button>
      </TooltipTrigger>
      <TooltipContent side="bottom" className="dark px-2 py-1 text-xs">
        <p>{label}</p>
      </TooltipContent>
    </Tooltip>
  )
}

function MessageActions() {
  return (
    <div className="relative inline-flex -space-x-px rounded-md border border-black/[0.08] bg-white shadow-sm">
      <TooltipProvider delayDuration={0}>
        <ActionButton icon={<Code2 size={16} />} label="Show code" />
        <ActionButton icon={<Book size={16} />} label="Bookmark" />
        <ActionButton icon={<RefreshCcw size={16} />} label="Refresh" />
        <ActionButton icon={<Check size={16} />} label="Approve" /> 
      </TooltipProvider>
    </div>
  )
}
