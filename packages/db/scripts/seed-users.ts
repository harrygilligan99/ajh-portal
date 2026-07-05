/** Shared between seed.ts and rls-test.ts (kept separate so importing it never runs the seed). */
export const SEED_USERS = {
  harry: { email: "harry@ajhwebsitemanagement.com", fullName: "Harry Gilligan", role: "agency_admin" as const },
  alexander: { email: "alexander@ajhwebsitemanagement.com", fullName: "Alexander H", role: "agency_member" as const },
  jamie: { email: "jamie@ajhwebsitemanagement.com", fullName: "Jamie H", role: "agency_member" as const },
  blushOwner: { email: "owner@blushandco.example", fullName: "Sophie Bailey", role: "client_owner" as const },
  willowOwner: { email: "owner@willowtherapy.example", fullName: "Megan Willow", role: "client_owner" as const },
};
