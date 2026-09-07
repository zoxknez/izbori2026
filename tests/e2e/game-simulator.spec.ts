import { expect, test } from "@playwright/test";

test.describe("2D Game Simulator Spike (Milestone 1)", () => {
  test("otvara /izborni-dan, omogućava prebacivanje na 2D režim i montira Phaser canvas", async ({ page }) => {
    // Slušamo konzolne greške da bismo osigurali da Phaser ne baca greške
    const errors: string[] = [];
    page.on("pageerror", (err) => errors.push(err.message));

    await page.goto("/izborni-dan");
    await expect(page.locator("h1")).toContainText("Izborni dan");

    // Proveravamo da prekidač režima postoji
    const classicBtn = page.getByRole("button", { name: /Klasične kartice/i });
    const game2dBtn = page.getByRole("button", { name: /2D Biračko mesto/i });
    await expect(classicBtn).toBeVisible();
    await expect(game2dBtn).toBeVisible();

    // Prebacujemo na 2D simulator
    await game2dBtn.click();

    // Čekamo da se Phaser container i canvas pojave
    const container = page.locator("#phaser-game-container");
    await expect(container).toBeVisible({ timeout: 15_000 });
    const canvas = container.locator("canvas");
    await expect(canvas).toBeVisible({ timeout: 15_000 });

    // Proveravamo HUD kontrole: sat (06:xx), dugme za pauzu i 1x/2x/4x
    await expect(page.getByRole("button", { name: /Pauziraj simulaciju/i })).toBeVisible();
    await expect(page.getByRole("button", { name: "1x" })).toBeVisible();
    await expect(page.getByRole("button", { name: "2x" })).toBeVisible();

    // Proveravamo A11y DOM fallback panel i klikćemo na UV stanicu
    const uvButton = page.getByRole("button", { name: "UV lampa" });
    await expect(uvButton).toBeVisible();
    await uvButton.click();

    // Kontekstualni panel prikazuje selekciju
    await expect(page.getByText(/Selektovano: UV lampa/i)).toBeVisible();

    // Otvaramo beležnicu dokaza
    const evidenceBtn = page.getByRole("button", { name: /Dokazi:/i });
    await expect(evidenceBtn).toBeVisible();
    await evidenceBtn.click();
    await expect(page.getByText(/Beležnica dokaza i zapažanja/i)).toBeVisible();
    await page.getByRole("button", { name: /Zatvori beležnicu/i }).click();

    // Otvaramo završni debrief smene
    const debriefBtn = page.getByRole("button", { name: /Završi smenu/i });
    await expect(debriefBtn).toBeVisible();
    await debriefBtn.click();
    await expect(page.getByText(/Debrief smene i odložene posledice/i)).toBeVisible();
    await page.getByRole("button", { name: /Nastavi smenu/i }).click();

    // Otvaramo vodič kroz uloge i menjamo ulogu u Posmatrača
    const roleBtn = page.getByTestId("role-selector-button");
    await expect(roleBtn).toBeVisible();
    await roleBtn.click();
    const roleModal = page.getByTestId("role-guidance-modal");
    await expect(roleModal).toBeVisible();
    await expect(page.getByText(/Pravni položaj i uloga u simulaciji/i)).toBeVisible();

    // Izaberi ulogu Posmatrač unutar modala i aktiviraj je
    await roleModal.getByRole("button", { name: /Posmatrač/i }).click();
    const activateBtn = roleModal.getByRole("button", { name: /Aktiviraj ulogu/i });
    if (await activateBtn.isVisible()) {
      await activateBtn.click();
    } else {
      await roleModal.getByRole("button", { name: /Zatvori/i }).click();
    }
    await expect(roleBtn).toContainText(/Posmatrač/i);

    // Milestone 6: Prebacivanje na fazu prebrojavanja (20:00)
    const startCountingBtn = page.getByTestId("start-counting-button");
    await expect(startCountingBtn).toBeVisible();
    await startCountingBtn.click();

    // Verifikujemo da je faza prešla u Prebrojavanje i Zapisnik
    await expect(page.getByText(/Prebrojavanje i Zapisnik \(20:00\+\)/i)).toBeVisible();

    // Otvaramo zvanični zapisnik biračkog odbora
    const openProtocolBtn = page.getByTestId("open-protocol-button");
    await expect(openProtocolBtn).toBeVisible();
    await openProtocolBtn.click();

    const countingModal = page.getByTestId("counting-protocol-modal");
    await expect(countingModal).toBeVisible();
    await expect(countingModal.getByText(/Zapisnik o radu biračkog odbora/i)).toBeVisible();

    // Proveravamo tab 2 (Kontrolni list i forenzika)
    await countingModal.getByRole("button", { name: /Kontrolni list i Forenzika/i }).click();
    await expect(countingModal.getByText(/Status kontrolnog lista u kutiji/i)).toBeVisible();

    // Proveravamo tab 3 (Primedbe) i upisujemo primedbu posmatrača
    await countingModal.getByRole("button", { name: /Primedbe i Potpisi/i }).click();
    await expect(countingModal.getByText(/Podnesi zvaničnu primedbu/i)).toBeVisible();
    await countingModal.locator("textarea").fill("Primedba posmatrača: uredan tok prebrojavanja.");
    await countingModal.getByRole("button", { name: /Upiši primedbu u zapisnik/i }).click();
    await expect(countingModal.getByText(/Primedba posmatrača: uredan tok prebrojavanja./i)).toBeVisible();

    // Zatvaramo modal zapisnika
    await countingModal.getByRole("button", { name: "Zatvori" }).click();
    await expect(countingModal).not.toBeVisible();

    // Vraćamo ulogu na Član biračkog odbora kako bismo potpisali zapisnik
    await roleBtn.click();
    await expect(roleModal).toBeVisible();
    await roleModal.getByRole("button", { name: /Član BO/i }).click();
    const activateBoBtn = roleModal.getByRole("button", { name: /Aktiviraj ulogu/i });
    if (await activateBoBtn.isVisible()) {
      await activateBoBtn.click();
    } else {
      await roleModal.getByRole("button", { name: /Zatvori/i }).click();
    }
    await expect(roleBtn).toContainText(/Član BO/i);

    // Ponovo otvaramo zapisnik i potpisujemo ga kao Član BO
    await openProtocolBtn.click();
    await expect(countingModal).toBeVisible();
    const signBtn = countingModal.getByTestId("sign-protocol-button");
    await expect(signBtn).toBeVisible();
    await signBtn.click();
    await expect(countingModal.getByText(/Zapisnik je potpisan i overen/i)).toBeVisible();
    await countingModal.getByRole("button", { name: "Zatvori" }).click();

    // Milestone 7: Testiranje čuvanja stanja (Save) i determinističkog Replay pregleda
    const saveBtn = page.getByTestId("save-game-button");
    await expect(saveBtn).toBeVisible();
    await saveBtn.click();
    await expect(saveBtn).toContainText(/Sačuvano!/i);

    // Otvaramo deterministički Replay modal
    const replayBtn = page.getByTestId("replay-button");
    await expect(replayBtn).toBeVisible();
    await replayBtn.click();

    const replayModal = page.getByTestId("replay-modal");
    await expect(replayModal).toBeVisible();
    await expect(replayModal.getByText(/Replay & Revizija toka glasanja/i)).toBeVisible();
    await expect(replayModal.getByText(/100% Deterministički paritet/i)).toBeVisible();

    // Zatvaramo Replay modal
    await replayModal.getByRole("button", { name: "Zatvori" }).click();
    await expect(replayModal).not.toBeVisible();

    // Nema fatalnih grešaka na stranici
    expect(errors.filter((e) => !e.includes("download the React DevTools"))).toHaveLength(0);
  });
});
