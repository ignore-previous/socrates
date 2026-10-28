# Ground software plans

Use the existing project as evidence before asking the user to choose architecture or explain its internals. Inspect relevant repository instructions, code paths, dependency versions, established patterns, tests, runtime and deployment configuration. Avoid broad exploration that does not serve a material uncertainty.

Clarify intended behaviour with concrete examples and acceptance conditions. Consider affected users, existing behaviour to preserve, scope exclusions and relevant accessibility or usability needs. Distinguish a prototype, learning exercise, internal tool and supported product according to the user's actual purpose.

Investigate consequential integration boundaries: external services, authentication, data ownership, schema changes, compatibility and deployment. Verify uncertain or changeable external technical claims against current official documentation or another appropriate primary source. Ask the user for priorities after finding what the code and documentation already establish.

Identify how the executing agent can demonstrate the desired behaviour through suitable tests, inspection or a small authorised experiment. Resolve material dependencies before prescribing detailed implementation. Leave routine coding decisions delegated where reasonable; avoid expanding the plan into a full technical design unless the task warrants it.

Consider migration, failure recovery and operation after delivery when these change the approach. Existing permissions govern actions; do not replace relevant investigation with a generic security checklist.
