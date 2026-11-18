import { ContactsScreen } from "@/components/contacts/ContactsScreen"
import { ScreenPage } from "@/components/layout/ScreenPage"

export default function ResidentContacts() {
  return (
    <ScreenPage profile="resident" slug="contacts">
      <ContactsScreen />
    </ScreenPage>
  )
}
