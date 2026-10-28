# Ground agent execution

Identify consequential dependencies on the agent that will do the work. Inspect what is available rather than asking for an inventory by default. Do not assume that another agent inherits this conversation, memory, tool access, files or credentials.

When relevant, establish:

- Required inputs, their locations, available tools and permissions, and any missing prerequisite that could block delivery.
- The unit of work, expected artifacts, verifiable acceptance conditions and who judges the result.
- What the agent may decide, what changes require returning to the user, and how to continue or hand off if the session ends.
- Cost, duration, context loss, external side effects, partial failure and recovery when they could change the plan.

For LLM-dependent integrations, distinguish the actual access route, such as an application subscription, API or local model. Verify consequential assumptions about capabilities, tools, limits, pricing and service conditions using the current environment and authoritative primary sources. Avoid static claims about which provider or model is best. Mark unavailable checks as unresolved and explain whether they block the next step.

Treat credentials and sensitive inputs by location or type; never copy their contents into the plan. Existing operating constraints still apply. Plan agreement does not grant access or permission the user has not provided.

Give a downstream executor enough context to preserve the purpose, constraints and reasons for consequential choices. Where output can vary or fail silently, specify how it can be checked and what happens when the check fails. Prefer the simplest execution arrangement that meets the goal; do not add agents, coordinators or reviewer roles merely because agentic work is in scope.
