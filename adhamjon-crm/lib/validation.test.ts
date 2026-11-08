import { describe, expect, it } from "vitest";
import { leadFormSchema } from "./validation";

describe("leadFormSchema", () => {
  it("to'g'ri ma'lumotni qabul qiladi va bo'sh maydonlarni null qiladi", () => {
    const r = leadFormSchema.parse({ full_name: "  Ali  ", phone: "+998 90 123 45 67", product: "", comment: " ", source: "instagram" });
    expect(r).toMatchObject({ full_name: "Ali", product: null, comment: null, source: "instagram" });
  });

  it("noma'lum manba 'sayt' bo'ladi", () => {
    expect(leadFormSchema.parse({ full_name: "Ali", phone: "+998 90 123 45 67", source: "xxx" }).source).toBe("sayt");
  });

  it("noto'g'ri telefon va ismni rad etadi", () => {
    const r = leadFormSchema.safeParse({ full_name: "A", phone: "+998 90" });
    expect(r.success).toBe(false);
    if (!r.success) expect(r.error.issues.map((i) => i.path[0]).sort()).toEqual(["full_name", "phone"]);
  });
});
