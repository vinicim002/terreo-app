"use client"

import { useTranslations } from "next-intl"
import { ContactsEditor } from "@/components/contacts/ContactsEditor"
import { ScreenPage } from "@/components/layout/ScreenPage"

export default function ManagerContactsEdit() {
  const t = useTranslations("security.contacts")
  return (
    <ScreenPage
      profile="manager"
      slug="contacts"
      title={t("editPage")}
      backHref="/manager/contacts/"
      inner
    >
      <ContactsEditor />
    </ScreenPage>
  )
}
