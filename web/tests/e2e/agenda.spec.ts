import { dayFromNow, expect, pickDate, signInAs, switchTo, test } from "./helpers"

// Spec 003, História 4: agenda e reuniões.
const MESES = [
  "janeiro",
  "fevereiro",
  "março",
  "abril",
  "maio",
  "junho",
  "julho",
  "agosto",
  "setembro",
  "outubro",
  "novembro",
  "dezembro",
]

test("H4: reunião marcada aparece no calendário e em Próximos", async ({ page }) => {
  const dia = dayFromNow(4)
  await signInAs(page, "manager")
  await page.goto("/manager/meeting/edit/")
  await pickDate(page, "Data", dia)
  await page.getByLabel("Horário", { exact: true }).fill("20:00")
  await page.getByLabel("Local").fill("Garagem do subsolo")
  await page.getByLabel("Assunto 1").fill("Vagas de visitantes")
  await page.getByRole("button", { name: "Salvar reunião" }).click()
  await expect(page.getByText("Garagem do subsolo")).toBeVisible()

  await switchTo(page, "responsible", "/resident/calendar/")
  const [, mes, d] = dia.split("-").map(Number)
  if (mes !== Number(dayFromNow(0).split("-")[1]))
    await page.getByRole("button", { name: "Próximo mês" }).click()
  const botao = page.getByRole("button", {
    name: new RegExp(`\\b${d} de ${MESES[mes - 1]}, \\d+ evento`),
  })
  await botao.click()
  await expect(botao).toHaveAttribute("aria-pressed", "true")
  const reuniao = page.getByRole("link", { name: /Reunião do conselho.*20:00/ }).first()
  await expect(reuniao).toBeVisible()
  await expect(page.getByTestId("upcoming").getByText("Coleta seletiva").first()).toBeVisible()
  await expect(page.getByTestId("upcoming").getByText("Toda semana").first()).toBeVisible()
  await reuniao.click()
  await expect(page.getByText("Vagas de visitantes")).toBeVisible()
})

test("H4-4: a síndica registra o resumo e o morador lê", async ({ page }) => {
  await signInAs(page, "manager")
  await page.goto("/manager/meetings/")
  await page.getByRole("button", { name: "Passadas" }).click()
  await page
    .getByRole("link", { name: /Resumo disponível/ })
    .first()
    .click()
  await page.getByRole("button", { name: "Editar resumo" }).click()
  await page.getByLabel("Resumo do que foi decidido").fill("Câmeras do hall aprovadas.")
  await page.getByRole("button", { name: "Salvar resumo" }).click()
  await expect(page.getByText("Câmeras do hall aprovadas.")).toBeVisible()

  await switchTo(page, "responsible", "/resident/meetings/")
  await page.getByRole("button", { name: "Passadas" }).click()
  await page
    .getByRole("link", { name: /Resumo disponível/ })
    .first()
    .click()
  await expect(page.getByText("Câmeras do hall aprovadas.")).toBeVisible()
  await expect(page.getByRole("button", { name: /resumo/i })).toBeHidden()
})
