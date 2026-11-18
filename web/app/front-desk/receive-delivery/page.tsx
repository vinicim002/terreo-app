import { Suspense } from "react"
import { ScreenPage } from "@/components/layout/ScreenPage"
import { ReceiveDelivery } from "@/components/desk/ReceiveDelivery"

export default function FrontDeskReceiveDelivery() {
  return (
    <Suspense>
      <ScreenPage profile="front-desk" slug="receive-delivery" backHref="/front-desk/">
        <ReceiveDelivery />
      </ScreenPage>
    </Suspense>
  )
}
