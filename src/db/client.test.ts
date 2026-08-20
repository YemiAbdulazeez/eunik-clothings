import { beforeEach, describe, expect, it } from "vitest";
import { replaceState } from "@/db/persist";
import { createSeed } from "@/db/seed";
import { writeSession } from "@/db/session";
import { db, ForbiddenError, DEMO_PASSWORD } from "@/db/database";

beforeEach(() => {
  localStorage.clear();
  replaceState(createSeed());
  writeSession(null);
});

describe("auth.login", () => {
  it("signs in a seeded client", async () => {
    const session = await db.auth.login("ade@eunik.demo", DEMO_PASSWORD);
    expect(session.role).toBe("client");
  });

  it("rejects bad credentials", async () => {
    await expect(db.auth.login("ade@eunik.demo", "wrong")).rejects.toThrow(/not recognised/);
  });
});

describe("assertCanShop / cart", () => {
  it("blocks staff from adding to bag", async () => {
    await db.auth.login("olamide@eunik.demo", DEMO_PASSWORD);
    await expect(
      db.cart.add({ productId: "sen3002", qty: 1, kind: "rtw" }),
    ).rejects.toBeInstanceOf(ForbiddenError);
  });

  it("merges guest cart on login", async () => {
    await db.cart.add({ productId: "sen3002", qty: 1, kind: "rtw" });
    await db.auth.login("ade@eunik.demo", DEMO_PASSWORD);
    const cart = await db.cart.get();
    expect(cart.lines.length).toBeGreaterThan(0);
  });
});

describe("ensureAtCheckout A03", () => {
  it("returns needsLogin for an existing email", async () => {
    const result = await db.auth.ensureAtCheckout({
      email: "ade@eunik.demo",
      name: "Ade",
      phone: "0800",
    });
    expect(result).toEqual({ needsLogin: true, email: "ade@eunik.demo" });
  });
});

describe("quotations.accept", () => {
  it("creates an order for the client", async () => {
    await db.auth.login("ade@eunik.demo", DEMO_PASSWORD);
    const order = await db.quotations.accept("quote_ade_12");
    expect(order.number).toBeTruthy();
    expect(order.customerId).toBe("user_ade");
  });
});

describe("production.moveStage", () => {
  it("updates order status when ready", async () => {
    await db.auth.login("olamide@eunik.demo", DEMO_PASSWORD);
    const job = await db.production.moveStage("prod_1001", "ready");
    expect(job.stage).toBe("ready");
    const order = await db.orders.get("order_1001");
    expect(order?.status).toBe("ready");
  });
});

describe("analytics.traffic ACL", () => {
  it("allows super_admin", async () => {
    await db.auth.login("olamide@eunik.demo", DEMO_PASSWORD);
    const report = await db.analytics.traffic("7d");
    expect(report.summary.views).toBeGreaterThanOrEqual(0);
  });

  it("forbids finance", async () => {
    await db.auth.login("finance@eunik.demo", DEMO_PASSWORD);
    await expect(db.analytics.traffic("7d")).rejects.toBeInstanceOf(ForbiddenError);
  });
});

describe("analytics.track", () => {
  it("records a page view without throwing", async () => {
    await expect(db.analytics.track("page_view", { path: "/shop" })).resolves.toBeUndefined();
  });
});
