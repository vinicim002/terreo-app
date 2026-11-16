"use client"

// Hooks de dados (TanStack Query) sobre os serviços. As telas usam só estes hooks.
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { getServiceContext, getServices } from "@/services"

const ctx = () => getServiceContext()

export function useCondominium() {
  return useQuery({
    queryKey: ["condominium"],
    queryFn: () => getServices().condominium.getCurrent(ctx()),
  })
}

export function useApartments(filter?: { floor?: number; withoutResponsible?: boolean }) {
  return useQuery({
    queryKey: ["apartments", filter],
    queryFn: () => getServices().apartments.list(ctx(), filter),
  })
}

export function useResidents(apartmentId: string | undefined) {
  return useQuery({
    queryKey: ["residents", apartmentId],
    queryFn: () => getServices().residents.listByApartment(ctx(), apartmentId!),
    enabled: !!apartmentId,
  })
}

export function useStaff() {
  return useQuery({ queryKey: ["staff"], queryFn: () => getServices().staff.list(ctx()) })
}

/** Quem está de plantão agora (recalcula a cada minuto). */
export function useOnDuty() {
  return useQuery({
    queryKey: ["on-duty"],
    queryFn: () => getServices().staff.onDutyAt(ctx(), new Date()),
    refetchInterval: 60_000,
  })
}

export function useSchedule() {
  return useQuery({ queryKey: ["schedule"], queryFn: () => getServices().schedule.listWeek(ctx()) })
}

export function useDataCounts() {
  return useQuery({ queryKey: ["dev", "counts"], queryFn: () => getServices().dev.counts(ctx()) })
}

export function useResetSeed() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: () => getServices().dev.resetSeed(),
    onSuccess: () => client.invalidateQueries(),
  })
}

// ---------- Spec 002 ----------

export function useRules(search: string) {
  return useQuery({
    queryKey: ["rules", search],
    queryFn: () => getServices().rules.list(ctx(), search),
    placeholderData: (previous) => previous,
  })
}

export function useResidency(residencyId: string | undefined) {
  return useQuery({
    queryKey: ["residency", residencyId],
    queryFn: () => getServices().residents.get(ctx(), residencyId!),
    enabled: !!residencyId,
  })
}

export function useHousehold(apartmentId: string | undefined) {
  return useQuery({
    queryKey: ["household", apartmentId],
    queryFn: () => getServices().residents.listByApartment(ctx(), apartmentId!),
    enabled: !!apartmentId,
  })
}

export function useApartment(apartmentId: string | undefined) {
  return useQuery({
    queryKey: ["apartment", apartmentId],
    queryFn: () => getServices().apartments.get(ctx(), apartmentId!),
    enabled: !!apartmentId,
  })
}

/** Mutação que, ao terminar, recarrega todos os dados da tela. */
export function useServiceMutation<TArgs, TResult>(fn: (args: TArgs) => Promise<TResult>) {
  const client = useQueryClient()
  return useMutation({ mutationFn: fn, onSuccess: () => client.invalidateQueries() })
}

export { getServiceContext as serviceContext } from "@/services"

export function useVehicles(apartmentId: string | undefined) {
  return useQuery({
    queryKey: ["vehicles", apartmentId],
    queryFn: () => getServices().apartmentData.listVehicles(ctx(), apartmentId!),
    enabled: !!apartmentId,
  })
}

export function usePets(apartmentId: string | undefined) {
  return useQuery({
    queryKey: ["pets", apartmentId],
    queryFn: () => getServices().apartmentData.listPets(ctx(), apartmentId!),
    enabled: !!apartmentId,
  })
}

export function useEmergencyContact(apartmentId: string | undefined) {
  return useQuery({
    queryKey: ["emergency", apartmentId],
    queryFn: () => getServices().apartmentData.getEmergencyContact(ctx(), apartmentId!),
    enabled: !!apartmentId,
  })
}

export function useOverview(filter: "all" | "none" | "tenants", search: string) {
  return useQuery({
    queryKey: ["overview", filter, search],
    queryFn: () => getServices().admin.overview(ctx(), { filter, search }),
    placeholderData: (previous) => previous,
  })
}

export function useDirectory(number: string | undefined) {
  return useQuery({
    queryKey: ["directory", number],
    queryFn: () => getServices().directory.apartment(ctx(), number!),
    enabled: !!number,
  })
}
