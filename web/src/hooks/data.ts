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

// ---------- Spec 003: comunicação ----------

/** Não lidas do sino (research R7): recarrega a cada 30 s e depois de qualquer mutação. */
export function useUnreadCount(enabled = true) {
  return useQuery({
    queryKey: ["notifications", "unread"],
    queryFn: () => getServices().notifications.unreadCount(ctx()),
    refetchInterval: 30_000,
    enabled,
  })
}

export function useNotices(filter: "all" | "unread" | "scheduled") {
  return useQuery({
    queryKey: ["notices", filter],
    queryFn: () => getServices().notices.list(ctx(), filter),
    placeholderData: (previous) => previous,
  })
}

/** Abre o aviso (marca como lido). */
export function useNotice(id: string | null) {
  const client = useQueryClient()
  return useQuery({
    queryKey: ["notice", id],
    queryFn: async () => {
      const notice = await getServices().notices.get(ctx(), id!)
      client.invalidateQueries({ queryKey: ["notifications", "unread"] })
      return notice
    },
    enabled: !!id,
    retry: false,
  })
}

export function useNoticeStats(id: string | null, enabled: boolean) {
  return useQuery({
    queryKey: ["notice-stats", id],
    queryFn: () => getServices().notices.stats(ctx(), id!),
    enabled: !!id && enabled,
  })
}

export function usePolls() {
  return useQuery({ queryKey: ["polls"], queryFn: () => getServices().polls.list(ctx()) })
}

export function useMeetings() {
  return useQuery({ queryKey: ["meetings"], queryFn: () => getServices().meetings.list(ctx()) })
}

export function useMeeting(id: string | null) {
  return useQuery({
    queryKey: ["meeting", id],
    queryFn: () => getServices().meetings.get(ctx(), id!),
    enabled: !!id,
    retry: false,
  })
}

export function useAgendaMonth(year: number, month: number) {
  return useQuery({
    queryKey: ["agenda", year, month],
    queryFn: () => getServices().agenda.month(ctx(), year, month),
    placeholderData: (previous) => previous,
  })
}

export function useUpcoming() {
  return useQuery({
    queryKey: ["agenda", "upcoming"],
    queryFn: () => getServices().agenda.upcoming(ctx()),
  })
}

export function useNotifications() {
  return useQuery({
    queryKey: ["notifications", "list"],
    queryFn: () => getServices().notifications.list(ctx()),
  })
}

export function useNotificationPrefs() {
  return useQuery({
    queryKey: ["notifications", "prefs"],
    queryFn: () => getServices().notifications.getPrefs(ctx()),
  })
}

// ---------- Spec 004: portaria ----------

export function useMyDeliveries() {
  return useQuery({
    queryKey: ["deliveries", "mine"],
    queryFn: () => getServices().deliveries.mine(ctx()),
  })
}

export function useDeskOverview() {
  return useQuery({
    queryKey: ["desk", "overview"],
    queryFn: () => getServices().desk.overview(ctx()),
    refetchInterval: 60_000,
  })
}

export function useDeskApartment(number: string | null) {
  return useQuery({
    queryKey: ["desk", "apartment", number],
    queryFn: () => getServices().desk.apartment(ctx(), number!),
    enabled: !!number,
    retry: false,
  })
}

export function useMyVisitors() {
  return useQuery({
    queryKey: ["visitors", "mine"],
    queryFn: () => getServices().visitors.mine(ctx()),
  })
}

export function useTodayVisitors() {
  return useQuery({
    queryKey: ["visitors", "today"],
    queryFn: () => getServices().visitors.today(ctx()),
    refetchInterval: 60_000,
  })
}

export function useMyTravel() {
  return useQuery({ queryKey: ["travel", "mine"], queryFn: () => getServices().travel.mine(ctx()) })
}

export function useActiveTravel() {
  return useQuery({
    queryKey: ["travel", "active"],
    queryFn: () => getServices().travel.active(ctx()),
  })
}

/** Equipe de plantão: recalcula a cada minuto (RF-020). */
export function useStaffBoard() {
  return useQuery({
    queryKey: ["staff", "board"],
    queryFn: () => getServices().staff.board(ctx(), new Date()),
    refetchInterval: 60_000,
  })
}

export function useMemos() {
  return useQuery({ queryKey: ["memos"], queryFn: () => getServices().memos.list(ctx()) })
}

export function useMemoById(id: string | null) {
  return useQuery({
    queryKey: ["memo", id],
    queryFn: () => getServices().memos.get(ctx(), id!),
    enabled: !!id,
    retry: false,
  })
}

export function useLostFound() {
  return useQuery({ queryKey: ["lost-found"], queryFn: () => getServices().lostFound.list(ctx()) })
}

export function useInboundMessages() {
  return useQuery({
    queryKey: ["dev", "inbound"],
    queryFn: () => getServices().whatsappInbox?.list() ?? Promise.resolve([]),
    refetchInterval: 3_000,
  })
}

// ---------- Spec 005: segurança ----------

/** Alerta do próprio apartamento e histórico; atualiza a cada 3 s para o morador ver o "Estou indo". */
export function useMyEmergency() {
  return useQuery({
    queryKey: ["emergency", "mine"],
    queryFn: () => getServices().emergency.mine(ctx()),
    refetchInterval: 3_000,
  })
}

/** Alertas de apartamento em aberto: a cada 1 s na portaria para caber nos 5 s do CS-001 (research R2). */
export function useOpenEmergencies(enabled = true, interval = 1_000) {
  return useQuery({
    queryKey: ["emergency", "open"],
    queryFn: () => getServices().emergency.open(ctx()),
    refetchInterval: interval,
    enabled,
  })
}

export function useEmergencyHistory(enabled = true) {
  return useQuery({
    queryKey: ["emergency", "history"],
    queryFn: () => getServices().emergency.history(ctx()),
    enabled,
  })
}

/** Alerta geral em aberto, para todos os perfis (a cada 3 s). */
export function useGeneralAlert(enabled = true) {
  return useQuery({
    queryKey: ["general-alert", "current"],
    queryFn: () => getServices().generalAlert.current(ctx()),
    refetchInterval: 3_000,
    enabled,
  })
}

export function useGeneralAlertHistory() {
  return useQuery({
    queryKey: ["general-alert", "history"],
    queryFn: () => getServices().generalAlert.history(ctx()),
  })
}

export function useContacts(search: string) {
  return useQuery({
    queryKey: ["contacts", search],
    queryFn: () => getServices().contacts.list(ctx(), search),
    placeholderData: (previous) => previous,
  })
}

export function useManualContacts() {
  return useQuery({
    queryKey: ["contacts", "manual"],
    queryFn: () => getServices().contacts.manual(ctx()),
  })
}
