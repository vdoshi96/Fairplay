# Learned

- T08's five-item cap needs enforcement at both API validation and the agenda builder boundary because the service can be called directly in tests and internal code.
- The existing fixture has six agenda sources, which is enough to prove that `maxItems: 8` previously escaped the intended cap.
