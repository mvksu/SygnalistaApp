import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"

interface Assignee {
  id?: string
  name: string
  avatarUrl?: string
}

interface Props {
  assignees: Assignee[]
  maxVisible?: number
  children?: React.ReactNode
}

function initials(name?: string) {
  if (!name) return "?"
  const parts = name.trim().split(/\s+/)
  const a = parts[0]?.[0] || ""
  const b = parts.length > 1 ? parts[parts.length - 1][0] : ""
  return (a + b).toUpperCase()
}

export function Assignees({ assignees, maxVisible = 4, children }: Props) {
  const visible = assignees.slice(0, maxVisible)
  const extra = assignees.length - visible.length

  return (
    <div className="flex -space-x-3">
      {visible.map(a => (
        <Avatar
          key={a.id || a.name}
          className="ring-background size-10 rounded-full ring-2"
        >
          {a.avatarUrl ? (
            <AvatarImage src={a.avatarUrl} alt={a.name} />
          ) : (
            <AvatarFallback>{initials(a.name)}</AvatarFallback>
          )}
        </Avatar>
      ))}
      {extra > 0 && (
        <Button
          variant="secondary"
          size="icon"
          className="bg-secondary text-muted-foreground ring-background hover:bg-secondary hover:text-foreground flex size-10 items-center justify-center rounded-full text-xs ring-2"
        >
          +{extra}
        </Button>
      )}
      {children}
    </div>
  )
}

export default Assignees
