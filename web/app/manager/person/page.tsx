import { Suspense } from "react"
import { PersonScreen } from "@/components/profile/PersonScreen"

export default function ManagerPerson() {
  return (
    <Suspense>
      <PersonScreen backHref="/manager/residents/" asManager />
    </Suspense>
  )
}
