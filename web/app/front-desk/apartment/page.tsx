import { Suspense } from "react"
import { ApartmentDeskScreen } from "@/components/desk/ApartmentDeskScreen"

export default function FrontDeskApartment() {
  return (
    <Suspense>
      <ApartmentDeskScreen />
    </Suspense>
  )
}
