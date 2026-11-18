import { ContactsScreen } from "@/components/contacts/ContactsScreen"
import { ScreenPage } from "@/components/layout/ScreenPage"

export default function FrontDeskContacts() {
  return (
    <ScreenPage profile="front-desk" slug="contacts" backHref="/front-desk/more/">
      <ContactsScreen />
    </ScreenPage>
  )
}
