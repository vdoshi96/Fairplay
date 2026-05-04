import { expect, test, type Page } from "@playwright/test";

async function mockResponsibilityFlow(page: Page) {
  await page.route("**/app/load-map**", async (route) => {
    await route.fulfill({
      contentType: "text/html",
      body: `
        <main>
          <h1>Responsibility overview</h1>
          <a href="/app/responsibilities/new">Add responsibility</a>
          <section id="items"></section>
        </main>
      `
    });
  });
  await page.route("**/app/responsibilities/new**", async (route) => {
    await route.fulfill({
      contentType: "text/html",
      body: `
        <main>
          <h1>New responsibility</h1>
          <label>Title <input aria-label="Title" id="title" /></label>
          <label>Alex role
            <select aria-label="Alex role" id="alex-role">
              <option value="none">None</option>
              <option value="accountable_owner">Accountable owner</option>
            </select>
          </label>
          <button id="save">Save</button>
          <script>
            document.getElementById("save").addEventListener("click", () => {
              window.location.href = "/app/responsibilities/mock-responsibility";
            });
          </script>
        </main>
      `
    });
  });
  await page.route("**/app/responsibilities/mock-responsibility**", async (route) => {
    await route.fulfill({
      contentType: "text/html",
      body: `
        <main>
          <h1>Edit responsibility</h1>
          <p id="state">Active</p>
          <label>Alex role
            <select aria-label="Alex role" id="alex-role">
              <option value="accountable_owner" selected>Accountable owner</option>
              <option value="helper">Helper</option>
            </select>
          </label>
          <label>Max role
            <select aria-label="Max role" id="max-role">
              <option value="none" selected>None</option>
              <option value="accountable_owner">Accountable owner</option>
            </select>
          </label>
          <section id="handoff" hidden>
            <label>Handoff context <textarea aria-label="Handoff context"></textarea></label>
            <label>Revisit date <input aria-label="Revisit date" type="date" /></label>
          </section>
          <button id="save">Save assignment</button>
          <button id="pause">Pause</button>
          <button id="restore">Restore active</button>
          <button id="archive">Archive</button>
          <dialog aria-label="Archive responsibility?" id="archive-dialog">
            <button id="confirm-archive">Confirm archive</button>
          </dialog>
          <script>
            const handoff = document.getElementById("handoff");
            const alex = document.getElementById("alex-role");
            const max = document.getElementById("max-role");
            function updateHandoff() {
              handoff.hidden = !(alex.value === "helper" && max.value === "accountable_owner");
            }
            alex.addEventListener("change", updateHandoff);
            max.addEventListener("change", updateHandoff);
            document.getElementById("pause").addEventListener("click", () => {
              document.getElementById("state").textContent = "Paused";
            });
            document.getElementById("restore").addEventListener("click", () => {
              document.getElementById("state").textContent = "Active";
            });
            document.getElementById("archive").addEventListener("click", () => {
              document.getElementById("archive-dialog").showModal();
            });
            document.getElementById("confirm-archive").addEventListener("click", () => {
              document.getElementById("archive-dialog").close();
              document.getElementById("state").textContent = "Archived";
            });
          </script>
        </main>
      `
    });
  });
}

test("responsibility load map flow creates, reassigns, pauses, restores, and archives", async ({
  page
}) => {
  await mockResponsibilityFlow(page);

  await page.goto("/app/load-map");
  await page.getByRole("link", { name: "Add responsibility" }).click();
  await page.getByLabel("Title").fill("Weekly meal outline");
  await page.getByLabel("Alex role").selectOption("accountable_owner");
  await page.getByRole("button", { name: "Save" }).click();

  await expect(page).toHaveURL(/\/app\/responsibilities\/mock-responsibility/);
  await page.getByLabel("Alex role").selectOption("helper");
  await page.getByLabel("Max role").selectOption("accountable_owner");
  await expect(page.getByLabel("Handoff context")).toBeVisible();
  await page.getByLabel("Handoff context").fill("Max has the current plan.");
  await page.getByLabel("Revisit date").fill("2026-05-22");

  await page.getByRole("button", { name: "Pause" }).click();
  await expect(page.locator("#state")).toHaveText("Paused");
  await page.getByRole("button", { name: "Restore active" }).click();
  await expect(page.locator("#state")).toHaveText("Active");
  await page.getByRole("button", { name: "Archive" }).click();
  await expect(
    page.getByRole("dialog", { name: "Archive responsibility?" })
  ).toBeVisible();
  await page.getByRole("button", { name: "Confirm archive" }).click();
  await expect(page.locator("#state")).toHaveText("Archived");
});
