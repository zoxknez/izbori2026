import { describe, it, expect } from "vitest";
import {
  hasRolePermission,
  filterActionsForRole,
  validateRoleAction,
  getRoleGuidance,
} from "./role-permissions";
import { WORLD_INCIDENT_BINDINGS } from "./incident-binding";
import type { WorldAction } from "./live-types";

describe("Milestone 5: Role Permissions & Differentiation (Član BO, Posmatrač, Birač)", () => {
  it("svaka uloga ima jasno definisan pravni položaj i skup dozvola", () => {
    // 1. Član biračkog odbora
    expect(hasRolePermission("clan_odbora", "manipulate_materials")).toBe(true);
    expect(hasRolePermission("clan_odbora", "sign_protocol")).toBe(true);
    expect(hasRolePermission("clan_odbora", "inspect_voter_id")).toBe(true);
    expect(hasRolePermission("clan_odbora", "apply_spray_and_uv")).toBe(true);
    expect(hasRolePermission("clan_odbora", "relocate_booths")).toBe(true);
    expect(hasRolePermission("clan_odbora", "interrupt_voting_for_order")).toBe(true);
    expect(hasRolePermission("clan_odbora", "add_board_member_remark")).toBe(true);
    expect(hasRolePermission("clan_odbora", "cast_ballot")).toBe(false);

    // 2. Posmatrač: stroga zabrana rukovanja materijalom i mešanja u rad odbora
    expect(hasRolePermission("posmatrac", "manipulate_materials")).toBe(false);
    expect(hasRolePermission("posmatrac", "sign_protocol")).toBe(false);
    expect(hasRolePermission("posmatrac", "inspect_voter_id")).toBe(false);
    expect(hasRolePermission("posmatrac", "apply_spray_and_uv")).toBe(false);
    expect(hasRolePermission("posmatrac", "relocate_booths")).toBe(false);
    expect(hasRolePermission("posmatrac", "record_evidence")).toBe(true);
    expect(hasRolePermission("posmatrac", "request_board_attention")).toBe(true);
    expect(hasRolePermission("posmatrac", "add_observer_record_remark")).toBe(true);
    expect(hasRolePermission("posmatrac", "contact_observer_mission")).toBe(true);

    // 3. Birač: ostvarivanje ličnog prava glasa i pravno sredstvo (čl. 148-149)
    expect(hasRolePermission("birac", "cast_ballot")).toBe(true);
    expect(hasRolePermission("birac", "protect_ballot_secrecy")).toBe(true);
    expect(hasRolePermission("birac", "prepare_voter_legal_remedy")).toBe(true);
    expect(hasRolePermission("birac", "manipulate_materials")).toBe(false);
    expect(hasRolePermission("birac", "inspect_voter_id")).toBe(false);
  });

  it("filterActionsForRole vraća samo radnje primerene trenutnoj ulozi", () => {
    const testActions: WorldAction[] = [
      {
        worldActionId: "act-board",
        label: "Radnja za člana odbora",
        choiceId: "E01-a",
        requiredRole: "clan_odbora",
      },
      {
        worldActionId: "act-observer",
        label: "Radnja za posmatrača",
        choiceId: "E01-b",
        requiredRole: "posmatrac",
      },
      {
        worldActionId: "act-voter",
        label: "Radnja za birača",
        choiceId: "E01-c",
        requiredRole: "birac",
      },
    ];

    const boardActions = filterActionsForRole(testActions, "clan_odbora");
    expect(boardActions).toHaveLength(1);
    expect(boardActions[0].worldActionId).toBe("act-board");

    const observerActions = filterActionsForRole(testActions, "posmatrac");
    expect(observerActions).toHaveLength(1);
    expect(observerActions[0].worldActionId).toBe("act-observer");

    const voterActions = filterActionsForRole(testActions, "birac");
    expect(voterActions).toHaveLength(1);
    expect(voterActions[0].worldActionId).toBe("act-voter");
  });

  it("validateRoleAction odbija radnje rezervisane za drugu ulogu", () => {
    const boardOnlyAction: WorldAction = {
      worldActionId: "manage-materials",
      label: "Prebroj rezervne listiće",
      choiceId: "E02-a",
      requiredRole: "clan_odbora",
    };

    const observerValidation = validateRoleAction("posmatrac", boardOnlyAction);
    expect(observerValidation.allowed).toBe(false);
    expect(observerValidation.reason).toContain("zahteva ulogu: Član biračkog odbora");

    const boardValidation = validateRoleAction("clan_odbora", boardOnlyAction);
    expect(boardValidation.allowed).toBe(true);
  });

  it("getRoleGuidance obezbeđuje detaljne odgovornosti i stroge zabrane za sve 3 uloge", () => {
    for (const role of ["clan_odbora", "posmatrac", "birac"] as const) {
      const guidance = getRoleGuidance(role);
      expect(guidance.label).toBeDefined();
      expect(guidance.summary.length).toBeGreaterThan(20);
      expect(guidance.coreResponsibilities.length).toBeGreaterThanOrEqual(3);
      expect(guidance.strictProhibitions.length).toBeGreaterThanOrEqual(2);
    }
  });

  it("sva autorska mapiranja u incident-binding.ts imaju radnje za svaku ulogu u ključnim incidentima", () => {
    for (const [bindingId, binding] of Object.entries(WORLD_INCIDENT_BINDINGS)) {
      const rolesInBinding = new Set(
        binding.actions.map((a) => a.requiredRole).filter(Boolean),
      );

      const expectedRoles = binding.roleFilter ?? ["clan_odbora", "posmatrac", "birac"];
      for (const role of expectedRoles) {
        expect(
          rolesInBinding.has(role),
          `Binding ${bindingId} mora imati definisanu akciju za ulogu ${role}`,
        ).toBe(true);
      }
    }
  });
});
