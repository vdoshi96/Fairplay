# Learned

- Running `next build` at the same time as Playwright's `next dev` can contend over `.next` and create misleading RSC/devtool and `/_document` failures. Sequential reruns from a clean generated `.next` state passed.
- This workspace still has the same DB limitation noted by earlier T03/T10 work: Docker is unavailable and Postgres is not listening at `localhost:5432`.
- The route-mocked e2e suite is useful for auth/onboarding/radar/check-in UX regressions, but it does not prove a live persisted auth/data flow.
- The signed-out production pages can be browser-checked without DB because `/login` renders and protected `/app/home` redirects to login without needing a valid session.
- No production `src/` browser storage usage was found for local/session storage or client-side cookie writes.
