import { describe, expect, it } from "vitest";
import { formatUzPhone } from "./phone";

describe("formatUzPhone", () => {
  it("maska qo'yadi", () => {
    expect(formatUzPhone("901234567")).toBe("+998 90 123 45 67");
    expect(formatUzPhone("+998901234567")).toBe("+998 90 123 45 67");
    expect(formatUzPhone("998901234567")).toBe("+998 90 123 45 67");
    expect(formatUzPhone("998 90 123 45 67")).toBe("+998 90 123 45 67");
    expect(formatUzPhone("8901234567")).toBe("+998 90 123 45 67");
    expect(formatUzPhone("+998 90 12")).toBe("+998 90 12");
    expect(formatUzPhone("90123456789999")).toBe("+998 90 123 45 67");
  });

  it("prefiks saqlanadi", () => {
    expect(formatUzPhone("")).toBe("+998 ");
    expect(formatUzPhone("+998 ")).toBe("+998 ");
    expect(formatUzPhone("+998")).toBe("+998 ");
    // kursor prefiksdan oldin bo'lganda yozilgan raqam
    expect(formatUzPhone("9+998 ")).toBe("+998 9");
    // har bir raqam ketma-ket yozilganda
    let v = "+998 ";
    for (const d of "901112233") v = formatUzPhone(v + d);
    expect(v).toBe("+998 90 111 22 33");
  });
});
