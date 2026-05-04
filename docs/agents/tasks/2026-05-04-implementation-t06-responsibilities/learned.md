# Learned

- T03 already provided responsibility, radar, persona, and load-snapshot repositories, but responsibility edit/status/event behavior needed a service-level orchestration layer.
- T04 current-session returns the household id and selected persona id needed for all responsibility scoping.
- T05 app pages commonly use `getAppSessionView`; responsibility pages additionally need `getCurrentSession` because service calls accept the current session shape.
- Existing e2e strategy mocks protected app handoffs when DB-backed verification is unavailable, so the T06 flow follows that pattern explicitly.
