import { expect, test, type Page } from "@playwright/test";

async function mockRadarFlow(page: Page) {
  await page.route("**/app/radar**", async (route) => {
    await route.fulfill({
      contentType: "text/html",
      body: `
        <main>
          <h1>Concern board</h1>
          <label>Topic <input aria-label="Topic" id="topic" /></label>
          <label>Visibility
            <select aria-label="Visibility" id="visibility">
              <option value="private">Private draft</option>
              <option value="shared_household">Shared household</option>
              <option value="partner_visible">Partner visible</option>
              <option value="check_in_only">Check-in only</option>
            </select>
          </label>
          <button id="create">Create radar item</button>
          <section aria-label="Private drafts" id="private"></section>
          <section aria-label="Check-in topics" id="checkin"></section>
          <section aria-label="Deferred" id="deferred"></section>
          <section aria-label="Resolved" id="resolved"></section>
          <dialog aria-label="Publish to Check-in only?" id="publish-dialog">
            <p>make this visible as Check-in only</p>
            <button id="confirm-publish">Confirm publish</button>
          </dialog>
          <script>
            let topic = "";
            document.getElementById("create").addEventListener("click", () => {
              topic = document.getElementById("topic").value;
              document.getElementById("private").innerHTML =
                '<article><h2>' + topic + '</h2><span>Private draft</span>' +
                '<label>Publish visibility <select aria-label="Publish visibility" id="publish-visibility">' +
                '<option value="shared_household">Shared household</option>' +
                '<option value="check_in_only">Check-in only</option></select></label>' +
                '<button id="publish">Publish</button></article>';
              document.getElementById("publish").addEventListener("click", () => {
                document.getElementById("publish-dialog").showModal();
              });
            });
            document.getElementById("confirm-publish").addEventListener("click", () => {
              document.getElementById("publish-dialog").close();
              document.getElementById("private").innerHTML = "";
              document.getElementById("checkin").innerHTML =
                '<article><h2>' + topic + '</h2><span>Check-in only</span>' +
                '<button id="defer">Defer</button><button id="resolve">Resolve</button></article>';
              document.getElementById("defer").addEventListener("click", () => {
                document.getElementById("checkin").innerHTML = "";
                document.getElementById("deferred").innerHTML =
                  '<article><h2>' + topic + '</h2><span>Deferred</span>' +
                  '<button id="resolve-deferred">Resolve</button></article>';
                document.getElementById("resolve-deferred").addEventListener("click", () => {
                  document.getElementById("deferred").innerHTML = "";
                  document.getElementById("resolved").innerHTML =
                    '<article><h2>' + topic + '</h2><span>Resolved</span></article>';
                });
              });
            });
          </script>
        </main>
      `
    });
  });
}

test("radar flow creates a private draft, publishes to check-in only, defers, and resolves", async ({
  page
}) => {
  await mockRadarFlow(page);

  await page.goto("/app/radar");
  await page.getByRole("textbox", { name: "Topic" }).fill("Clarify morning handoff");
  await page.getByLabel("Visibility").selectOption("private");
  await page.getByRole("button", { name: "Create radar item" }).click();

  await expect(
    page.getByRole("region", { name: "Private drafts" })
  ).toContainText("Clarify morning handoff");
  await expect(
    page.getByRole("region", { name: "Private drafts" }).getByText("Private draft")
  ).toBeVisible();

  await page.getByLabel("Publish visibility").selectOption("check_in_only");
  await page.getByRole("button", { name: "Publish" }).click();
  await expect(
    page.getByRole("dialog", { name: "Publish to Check-in only?" })
  ).toBeVisible();
  await page.getByRole("button", { name: "Confirm publish" }).click();
  await expect(
    page.getByRole("region", { name: "Check-in topics" })
  ).toContainText("Clarify morning handoff");

  await page.getByRole("button", { name: "Defer" }).click();
  await expect(page.getByRole("region", { name: "Deferred" })).toContainText(
    "Clarify morning handoff"
  );

  await page.getByRole("button", { name: "Resolve" }).click();
  await expect(page.getByRole("region", { name: "Resolved" })).toContainText(
    "Clarify morning handoff"
  );
});
