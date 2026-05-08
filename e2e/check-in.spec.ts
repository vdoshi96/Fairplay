import { expect, test, type Page } from "@playwright/test";

async function mockCheckInFlow(page: Page) {
  await page.route("**/app/check-ins/new**", async (route) => {
    await route.fulfill({
      contentType: "text/html",
      body: `
        <main>
          <h1 id="title">Schedule check-in</h1>
          <section aria-label="Schedule a check-in" id="schedule">
            <label>Date and time <input aria-label="Date and time" id="when" type="datetime-local" /></label>
            <button id="schedule-button">Schedule</button>
          </section>
          <section aria-label="Confirm check-in" id="confirm" hidden>
            <h2>Scheduled check-in</h2>
            <label>Minutes / notes <textarea aria-label="Minutes / notes" id="notes"></textarea></label>
            <button id="confirm-button">Confirm it happened</button>
          </section>
          <section aria-label="Meeting notes" id="record" hidden>
            <h2>Check-in record</h2>
            <label>Minutes / notes <textarea aria-label="Minutes / notes" id="record-notes"></textarea></label>
            <button id="update-button">Update notes</button>
            <p id="status"></p>
          </section>
          <script>
            document.getElementById("schedule-button").addEventListener("click", () => {
              document.getElementById("schedule").hidden = true;
              document.getElementById("title").textContent = "Scheduled check-in";
              document.getElementById("confirm").hidden = false;
            });
            document.getElementById("confirm-button").addEventListener("click", () => {
              document.getElementById("confirm").hidden = true;
              document.getElementById("title").textContent = "Check-in record";
              document.getElementById("record-notes").value = document.getElementById("notes").value;
              document.getElementById("record").hidden = false;
              document.getElementById("status").textContent = "Check-in recorded.";
            });
            document.getElementById("update-button").addEventListener("click", () => {
              document.getElementById("status").textContent = "Notes updated.";
            });
          </script>
        </main>
      `
    });
  });
}

test("check-in flow schedules, confirms, and updates notes", async ({ page }) => {
  await mockCheckInFlow(page);

  await page.goto("/app/check-ins/new");
  await expect(page.getByRole("heading", { name: "Schedule check-in" })).toBeVisible();
  await page.getByLabel("Date and time").fill("2026-05-20T18:30");
  await page.getByRole("button", { name: "Schedule" }).click();

  await expect(page.getByRole("region", { name: "Confirm check-in" })).toBeVisible();
  await page.getByLabel("Minutes / notes").fill("Discussed summer routines.");
  await page.getByRole("button", { name: "Confirm it happened" }).click();

  await expect(page.getByRole("heading", { name: "Check-in record" })).toBeVisible();
  await expect(page.getByRole("region", { name: "Meeting notes" })).toContainText(
    "Check-in recorded."
  );
  await page.getByLabel("Minutes / notes").fill("Updated minutes.");
  await page.getByRole("button", { name: "Update notes" }).click();
  await expect(page.getByRole("region", { name: "Meeting notes" })).toContainText(
    "Notes updated."
  );
});
