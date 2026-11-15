import { ProfileShell } from "@/components/layout/ProfileShell"

export default function ManagerLayout({ children }: LayoutProps<"/manager">) {
  return <ProfileShell profile="manager">{children}</ProfileShell>
}
