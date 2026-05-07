import { expect, test, type Page } from "@playwright/test";

async function mockCheckInFlow(page: Page) {
  await page.route("**/app/check-ins/new**", async (route) => {
    await route.fulfill({
      contentType: "text/html",
      body: `
        <main>
          <h1>New check-in</h1>
          <section aria-label="Agenda preview">
            <article><h2>Meal plan review</h2><span>Review due</span></article>
            <article id="partner-topic"><h2>Clarify morning handoff</h2><span>Check-in only</span></article>
          </section>
          <button id="start">Start check-in</button>
          <section aria-label="Current item" id="current"></section>
          <section aria-label="Decision form" id="decision" hidden>
            <label>Decision type
              <select id="type" aria-label="Decision type">
                <option value="assign_owner">Assign owner</option>
                <option value="schedule_review">Schedule review</option>
              </select>
            </label>
            <label>Owner
              <select id="owner" aria-label="Owner">
                <option value="alex">Alex</option>
                <option value="max">Max</option>
              </select>
            </label>
            <label>Decision summary <textarea aria-label="Decision summary" id="summary"></textarea></label>
            <label>Review date <input aria-label="Review date" id="review" type="date" /></label>
            <button id="record">Record decision</button>
          </section>
          <section aria-label="Check-in summary" id="complete"></section>
          <script>
            document.getElementById("start").addEventListener("click", () => {
              document.getElementById("current").innerHTML =
                '<h2>Meal plan review</h2><button id="discuss">Discuss</button><button id="defer">Defer</button>';
              document.getElementById("decision").hidden = false;
              document.getElementById("defer").addEventListener("click", () => {
                document.getElementById("current").innerHTML =
                  '<h2>Clarify morning handoff</h2><p>Deferred</p><button id="finish">Complete check-in</button>';
                document.getElementById("finish").addEventListener("click", () => {
                  document.getElementById("complete").innerHTML =
                    '<h2>Completed</h2><p>Decisions: Alex owns meal planning until June review.</p><p>Deferred: Clarify morning handoff.</p>';
                });
              });
            });
            document.getElementById("record").addEventListener("click", () => {
              document.getElementById("current").innerHTML =
                '<h2>Clarify morning handoff</h2><p>Check-in only</p><button id="defer">Defer</button>';
              document.getElementById("defer").addEventListener("click", () => {
                document.getElementById("current").innerHTML =
                  '<h2>Clarify morning handoff</h2><p>Deferred</p><button id="finish">Complete check-in</button>';
                document.getElementById("finish").addEventListener("click", () => {
                  document.getElementById("complete").innerHTML =
                    '<h2>Completed</h2><p>Decisions: Alex owns meal planning until June review.</p><p>Deferred: Clarify morning handoff.</p>';
                });
              });
            });
          </script>
        </main>
      `
    });
  });
}

test("check-in flow records one decision, defers one topic, and shows summary", async ({
  page
}) => {
  await mockCheckInFlow(page);

  await page.goto("/app/check-ins/new");
  await expect(page.getByRole("region", { name: "Agenda preview" })).toContainText(
    "Meal plan review"
  );
  await expect(page.getByText("Check-in only")).toBeVisible();

  await page.getByRole("button", { name: "Start check-in" }).click();
  await page.getByLabel("Decision type").selectOption("assign_owner");
  await page.getByLabel("Owner").selectOption("alex");
  await page.getByLabel("Decision summary").fill("Alex owns meal planning until June review.");
  await page.getByLabel("Review date").fill("2026-06-04");
  await page.getByRole("button", { name: "Record decision" }).click();

  await expect(page.getByRole("region", { name: "Current item" })).toContainText(
    "Clarify morning handoff"
  );
  await page.getByRole("button", { name: "Defer" }).click();
  await expect(page.getByRole("region", { name: "Current item" })).toContainText(
    "Deferred"
  );

  await page.getByRole("button", { name: "Complete check-in" }).click();
  await expect(page.getByRole("region", { name: "Check-in summary" })).toContainText(
    "Decisions: Alex owns meal planning until June review."
  );
  await expect(page.getByRole("region", { name: "Check-in summary" })).toContainText(
    "Deferred: Clarify morning handoff."
  );
});
