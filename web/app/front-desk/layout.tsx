import { ProfileShell } from "@/components/layout/ProfileShell"

export default function FrontDeskLayout({ children }: LayoutProps<"/front-desk">) {
  return <ProfileShell profile="front-desk">{children}</ProfileShell>
}
