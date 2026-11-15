"use client"

import Link from "next/link"
import { useTranslations } from "next-intl"
import { Notice } from "@/components/layout/Notice"

export default function NotFound() {
  const t = useTranslations()
  return (
    <Notice
      title={t("errors.notFoundTitle")}
      text={t("errors.notFound")}
      action={
        <Link href="/" className="btn-primary">
          {t("common.backHome")}
        </Link>
      }
    />
  )
}
