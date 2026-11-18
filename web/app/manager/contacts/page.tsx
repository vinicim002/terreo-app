import { ContactsScreen } from "@/components/contacts/ContactsScreen"
import { ScreenPage } from "@/components/layout/ScreenPage"

export default function ManagerContacts() {
  return (
    <ScreenPage profile="manager" slug="contacts" backHref="/manager/more/">
      <ContactsScreen editHref="/manager/contacts/edit/" />
    </ScreenPage>
  )
}
