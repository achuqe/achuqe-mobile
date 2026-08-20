export type ProfileRoleTone = "admin" | "business" | "member" | "guest";

export type ProfileRolePresentation = {
  tone: ProfileRoleTone;
  label: string;
  description: string;
  icon: "admin-panel-settings" | "storefront" | "person" | "person-outline";
};

export function getProfileRolePresentation({ authenticated, systemRole, appRole }: { authenticated: boolean; systemRole?: "user" | "admin"; appRole: "consumer" | "business" }): ProfileRolePresentation {
  if (!authenticated) {
    return { tone: "guest", label: "სტუმარი", description: "რეგისტრაციის შემდეგ შენი როლი გამოჩნდება აქ.", icon: "person-outline" };
  }
  if (systemRole === "admin") {
    return { tone: "admin", label: "ადმინისტრატორი", description: "ბიზნესების მოდერაციის სრული წვდომა", icon: "admin-panel-settings" };
  }
  if (appRole === "business") {
    return { tone: "business", label: "ბიზნეს-ანგარიში", description: "პროდუქტებისა და შეკვეთების მართვა", icon: "storefront" };
  }
  return { tone: "member", label: "მომხმარებელი", description: "საჩუქრების მოძებნა და შეკვეთების მართვა", icon: "person" };
}
