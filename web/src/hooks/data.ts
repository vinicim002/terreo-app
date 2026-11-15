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
