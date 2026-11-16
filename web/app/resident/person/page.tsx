import { Suspense } from "react"
import { PersonScreen } from "@/components/profile/PersonScreen"

// useSearchParams (?id=) exige Suspense na exportação estática.
export default function Person() {
  return (
    <Suspense>
      <PersonScreen backHref="/resident/profile/" />
    </Suspense>
  )
}
