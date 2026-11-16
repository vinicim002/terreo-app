import { Suspense } from "react"
import { PetScreen } from "@/components/profile/ApartmentItemScreens"

// useSearchParams (?id=) exige Suspense na exportação estática.
export default function Page() {
  return (
    <Suspense>
      <PetScreen />
    </Suspense>
  )
}
