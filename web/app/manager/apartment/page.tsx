import { Suspense } from "react"
import { ApartmentScreen } from "@/components/manager/ApartmentScreen"

// useSearchParams (?id=) exige Suspense na exportação estática.
export default function Page() {
  return (
    <Suspense>
      <ApartmentScreen />
    </Suspense>
  )
}
