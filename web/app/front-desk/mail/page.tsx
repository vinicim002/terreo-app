import { ScreenPage } from "@/components/layout/ScreenPage"
import { MailScreen } from "@/components/desk/MailScreen"

export default function FrontDeskMail() {
  return (
    <ScreenPage profile="front-desk" slug="mail" backHref="/front-desk/">
      <MailScreen />
    </ScreenPage>
  )
}
