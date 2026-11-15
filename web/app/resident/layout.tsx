import { ProfileShell } from "@/components/layout/ProfileShell"

export default function ResidentLayout({ children }: LayoutProps<"/resident">) {
  return <ProfileShell profile="resident">{children}</ProfileShell>
}
