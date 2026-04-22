---
title: "RFC: "
labels:
  - rfc
body:
  - type: markdown
    attributes:
      value: |
        Use this template for Team Skills Platform or ECC harness skeleton changes that alter canonical structure, generated assets, plugin manifests, or workflow rules.
  - type: textarea
    id: motivation
    attributes:
      label: Motivation
      description: Why is this platform or workflow change needed?
      placeholder: Describe the usability, governance, or workflow problem being addressed.
    validations:
      required: true
  - type: textarea
    id: proposed-change
    attributes:
      label: Proposed Change
      description: What repository areas or generated artifacts will change?
      placeholder: Describe the directories, manifests, rules, commands, or skills that will be affected.
    validations:
      required: true
  - type: textarea
    id: alternatives
    attributes:
      label: Alternatives Considered
      description: What other approaches were evaluated and why were they not chosen?
      placeholder: List viable alternatives, tradeoffs, and rejected directions.
    validations:
      required: true
  - type: textarea
    id: compatibility
    attributes:
      label: Compatibility
      description: What backward-compatibility or installation risks should reviewers evaluate?
      placeholder: Note install behavior, generated path changes, plugin compatibility, and rollout concerns.
    validations:
      required: true
  - type: textarea
    id: migration-plan
    attributes:
      label: Migration Plan
      description: How will this be introduced without breaking current users?
      placeholder: Describe rollout steps, validation, documentation updates, and fallback strategy.
    validations:
      required: true
