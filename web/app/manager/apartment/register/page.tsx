import { Suspense } from "react"
import { RegisterResponsibleScreen } from "@/components/manager/RegisterResponsibleScreen"

// useSearchParams (?id=) exige Suspense na exportação estática.
export default function Page() {
  return (
    <Suspense>
      <RegisterResponsibleScreen />
    </Suspense>
  )
}
