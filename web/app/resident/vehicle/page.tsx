import { Suspense } from "react"
import { VehicleScreen } from "@/components/profile/ApartmentItemScreens"

// useSearchParams (?id=) exige Suspense na exportação estática.
export default function Page() {
  return (
    <Suspense>
      <VehicleScreen />
    </Suspense>
  )
}
