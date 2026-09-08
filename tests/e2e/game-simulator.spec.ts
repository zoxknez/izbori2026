import { expect, test } from "@playwright/test";

test.describe("2D Game Simulator Spike (Milestone 1)", () => {
  test("otvara /izborni-dan, omogućava prebacivanje na 2D režim i montira Phaser canvas", async ({ page }) => {
    // Slušamo konzolne greške da bismo osigurali da Phaser ne baca greške
    const errors: string[] = [];
    page.on("pageerror", (err) => {
      console.error("CLIENT PAGEERROR:", err);
      errors.push(err.message);
    });
    page.on("console", (msg) => {
      if (msg.type() === "error") {
        console.error("CLIENT CONSOLE ERROR:", msg.text());
      }
    });

    await page.goto("/izborni-dan");
    await expect(page.locator("h1")).toContainText("Izborni dan");
    await expect(page.getByText("55 realnih situacija")).toBeVisible();
    await expect(page.getByText(/136 odluka od pripreme do noćnog brojanja/i)).toBeVisible();

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

    // The game-facing controls must remain usable after Phaser mounts.
    const resetCameraBtn = page.getByTestId("reset-camera-button");
    await expect(resetCameraBtn).toBeVisible();
    await resetCameraBtn.click();
    const muteBtn = page.getByRole("button", { name: /Isključi zvuk/i });
    await expect(muteBtn).toHaveAttribute("aria-pressed", "false");
    await muteBtn.click();
    await expect(page.getByRole("button", { name: /Uključi zvuk/i })).toHaveAttribute("aria-pressed", "true");
    await page.getByLabel("Jačina zvuka").fill("0.35");

    // Proveravamo HUD kontrole: sat (06:xx), dugme za pauzu i 1x/2x/4x
    await expect(page.getByRole("button", { name: /Pauziraj simulaciju/i })).toBeVisible();
    await expect(page.getByRole("button", { name: "1x" })).toBeVisible();
    await expect(page.getByRole("button", { name: "2x" })).toBeVisible();

    // Proveravamo "Pitaj ZmAI" dugme koje vodi na /zmai u novom tabu
    const askZmaiBtn = page.getByTestId("ask-zmai-button");
    await expect(askZmaiBtn).toBeVisible();
    await expect(askZmaiBtn).toHaveAttribute("href", "/zmai");
    await expect(askZmaiBtn).toHaveAttribute("target", "_blank");

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
    const evidenceDialog = page.getByRole("dialog", { name: /Beležnica dokaza i zapažanja/i });
    await expect(evidenceDialog).toBeVisible();
    await expect.poll(() => page.evaluate(() => document.body.style.overflow)).toBe("hidden");
    await page.getByRole("button", { name: /Nova zabeleška/i }).click();
    await expect(page.getByText(/2\/4 kompletno/i)).toBeVisible();
    await page.getByRole("button", { name: /Otkaži/i }).click();
    await page.getByRole("button", { name: /Zatvori beležnicu/i }).click();
    await expect(evidenceDialog).not.toBeVisible();
    await expect.poll(() => page.evaluate(() => document.body.style.overflow)).toBe("");

    // Otvaramo završni debrief smene
    const debriefBtn = page.getByRole("button", { name: /Završi smenu/i });
    await expect(debriefBtn).toBeVisible();
    await debriefBtn.click();
    const debriefDialog = page.getByRole("dialog", { name: /Debrief smene i odložene posledice/i });
    await expect(debriefDialog).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(debriefDialog).not.toBeVisible();

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

    // Nova partija može brzo doći do legalnog početka glasanja, bez skoka na kraj dana.
    const openingBtn = page.getByTestId("fast-forward-to-opening-button");
    await expect(openingBtn).toBeVisible();
    await openingBtn.click();
    await expect(page.getByTestId("close-polls-button")).toBeVisible();

    // Milestone 6: Prebacivanje na fazu prebrojavanja (20:00) po čl. 91, 99 i 100 ZINP
    // Premotavamo do 20:00 (kraj glasanja)
    const ffBtn = page.getByTestId("fast-forward-to-closing-button");
    await expect(ffBtn).toBeVisible({ timeout: 10_000 });
    await ffBtn.click();

    // Zatvaramo biračko mesto u 20:00 (čl. 99 ZINP)
    const closePollsBtn = page.getByTestId("close-polls-button");
    await expect(closePollsBtn).toBeEnabled({ timeout: 10_000 });
    await closePollsBtn.click();

    // Prelazak u brojanje (nakon pražnjenja reda po čl. 99 ZINP)
    const finishClosingBtn = page.getByTestId("finish-closing-button");
    await expect(finishClosingBtn).toBeEnabled({ timeout: 20_000 });
    await finishClosingBtn.click();

    // Verifikujemo da je faza prešla u Prebrojavanje i Zapisnik
    await expect(page.getByText(/Prebrojavanje i Zapisnik \(20:00\+\)/i)).toBeVisible();

    // Zvanični zapisnik biračkog odbora se automatski otvara na početku prebrojavanja
    const countingModal = page.getByTestId("counting-protocol-modal");
    await expect(countingModal).toBeVisible();
    await expect(countingModal).toHaveAttribute("role", "dialog");
    await expect(countingModal).toHaveAttribute("aria-modal", "true");
    await expect(countingModal.getByText(/Zapisnik o radu biračkog odbora/i)).toBeVisible();

    // Proveravamo tab 2 (Kontrolni list i forenzika)
    await countingModal.getByRole("button", { name: /Kontrolni list i Forenzika/i }).click();
    await expect(countingModal.getByText(/Status kontrolnog lista u kutiji/i)).toBeVisible();

    // Posmatrač upisuje primedbu u svoj poseban zapisnik, ne u zapisnik BO.
    await countingModal.getByRole("button", { name: /Primedbe i Potpisi/i }).click();
    await expect(countingModal.getByText(/Zapisnik o prisustvu posmatrača/i)).toBeVisible();
    await expect(countingModal.getByText(/Upiši primedbu u zapisnik posmatrača/i)).toBeVisible();
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

    // Ponovo otvaramo zapisnik i evidentiramo tri potpisa člana BO (prag iz čl. 115).
    const openProtocolBtn = page.getByTestId("open-protocol-button");
    await expect(openProtocolBtn).toBeVisible();
    await openProtocolBtn.click();
    await expect(countingModal).toBeVisible();
    const signBtn = countingModal.getByTestId("sign-protocol-button");
    await expect(signBtn).toBeVisible();
    await signBtn.click();

    // Dodajemo još 2 potpisa kako bi bio dostignut prag iz čl. 115.
    const signMember1 = countingModal.getByTestId("sign-member-1");
    if (await signMember1.isVisible()) {
      await signMember1.click();
    }
    const signMember2 = countingModal.getByTestId("sign-member-2");
    if (await signMember2.isVisible()) {
      await signMember2.click();
    }

    await expect(countingModal.getByText(/Evidentirano je najmanje tri potpisa/i)).toBeVisible();
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
    await expect(replayModal).toHaveAttribute("role", "dialog");
    await expect(replayModal.getByText(/Replay & Revizija toka glasanja/i)).toBeVisible();
    await expect(replayModal.getByText(/Domain replay paritet potvrđen/i)).toBeVisible();

    // Zatvaramo Replay modal
    await replayModal.getByRole("button", { name: "Zatvori" }).click();
    await expect(replayModal).not.toBeVisible();

    // Nema fatalnih grešaka na stranici
    expect(errors.filter((e) => !e.includes("download the React DevTools"))).toHaveLength(0);
  });
});
