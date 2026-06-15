name: Pull Request
description: Submit a new feature, bug fix, or architectural improvement for IRIS.
title: 'feat/fix(module): '
labels:

- 'needs-review'
  body:
- type: markdown
  attributes:
  value: | ### 👁️ Submit a Pull Request
  Thank you for contributing to the IRIS ecosystem. To ensure a fast and secure review process, please provide concrete details about your implementation, its scope, and any security implications.

      *Note: If you are modifying the closed-source execution core, ensure you are working within your designated `iris-insiders` branch.*

- type: textarea
  id: summary
  attributes:
  label: Executive Summary
  description: Provide a high-level overview of the problem and your solution.
  placeholder: | - **Problem:** The WebRTC audio stream drops when the user switches virtual desktops. - **Impact:** Breaks continuous voice-first execution. - **Resolution:** Implemented a persistent background audio context loop in the main process. - **Scope Boundary:** Did NOT alter the actual TTS/STT generation engines, only the audio transport layer.
  validations:
  required: true

- type: checkboxes
  id: change_type
  attributes:
  label: Change Type
  description: Select all that apply.
  options: - label: Bug fix (Non-breaking change which fixes an issue) - label: New Feature / OS Tool (Non-breaking change which adds functionality) - label: Breaking Change (Fix or feature that alters existing IPC channels or Tool signatures) - label: Refactoring (Code cleanup without functional changes) - label: Security Hardening (Patching vulnerabilities or tightening permissions) - label: Infrastructure / CI-CD (Changes to electron-builder, GitHub Actions) - label: Documentation (Updates to README, Wiki, or inline comments)

- type: checkboxes
  id: scope
  attributes:
  label: Architecture Scope
  description: Select all systems touched by this PR.
  options: - label: Electron Main Process (Node.js backend) - label: Context Bridge / IPC (`preload.ts`) - label: React Frontend / UI / Animations - label: OS Automation (`nut.js`, shell execution, window management) - label: Local RAG / Memory (`LanceDB`, Vector Embeddings) - label: Agentic Routing / LLM Prompts & Schemas - label: Security Vault (`safeStorage`, Local Decryption)

- type: input
  id: linked_issue
  attributes:
  label: Linked Issue
  description: Which issue does this PR resolve? (e.g., Closes #123)
  placeholder: 'Closes #'
  validations:
  required: false

- type: textarea
  id: root*cause
  attributes:
  label: Root Cause Analysis (If Bug Fix)
  description: Explain \_why* this bug occurred, not just what you changed. If this is a new feature, write N/A.
  placeholder: | - Root Cause: The IPC listener was using `.once` instead of `.on`, causing it to detach after the first execution failure. - Why it was missed: Automated tests only simulated successful ("happy path") executions.
  validations:
  required: false

- type: markdown
  attributes:
  value: | ### 🚨 Security Assessment
  Because IRIS executes local OS commands, security reviews are mandatory. Answer the following carefully.

- type: dropdown
  id: sec_permissions
  attributes:
  label: 1. New OS Permissions?
  description: Does this PR request new hardware access (Camera, Mic, Accessibility, Disk)?
  options: - 'No' - 'Yes'
  validations:
  required: true

- type: dropdown
  id: sec_ipc
  attributes:
  label: 2. IPC Channel Changes?
  description: Did you add, expose, or modify data payloads crossing the `preload.ts` bridge?
  options: - 'No' - 'Yes'
  validations:
  required: true

- type: dropdown
  id: sec_execution
  attributes:
  label: 3. Execution Surface Expanded?
  description: Did you add new OS tools (e.g., shell commands, file writing, network requests)?
  options: - 'No' - 'Yes'
  validations:
  required: true

- type: textarea
  id: sec_mitigation
  attributes:
  label: Security Mitigation (If 'Yes' to above)
  description: If you answered 'Yes' to any security questions, explain the risk and how you mitigated it (e.g., payload sanitization, path traversal checks).
  placeholder: 'I added a new IPC channel to read files. I mitigated path traversal by using `path.normalize()` and ensuring the target resolves strictly within the `userData` directory.'
  validations:
  required: false

- type: textarea
  id: diagram
  attributes:
  label: ASCII Diagram / Flow (Optional but Appreciated)
  description: For complex IPC data flows or agent routing logic, include a quick ASCII diagram to help reviewers understand the state change.
  placeholder: |
  Before:
  [React UI] -> [IPC invoke] -> [Direct Shell Execution]

      After:
      [React UI] -> [IPC invoke] -> [Sanitization Middleware] -> [Shell Execution]

  validations:
  required: false
