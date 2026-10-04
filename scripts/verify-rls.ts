/**
 * Proves Row Level Security isolates orders between users, using only the HTTP API.
 *   pnpm verify:rls
 * Creates two throwaway users (service role), places an order as A via create_order(),
 * then checks B and anon cannot see it. Everything is deleted afterwards.
 */
import { loadEnv, need } from "./env";

loadEnv();
const URL_ = need("NEXT_PUBLIC_SUPABASE_URL");
const ANON = need("NEXT_PUBLIC_SUPABASE_ANON_KEY");
const SERVICE = need("SUPABASE_SERVICE_ROLE_KEY");

const results: string[] = [];
const check = (name: string, cond: boolean, extra = "") => results.push(`${cond ? "PASS" : "FAIL"} ${name}${extra ? " " + extra : ""}`);

async function api(path: string, key: string, init: RequestInit = {}, bearer = key) {
  const res = await fetch(`${URL_}${path}`, {
    ...init,
    headers: { apikey: key, Authorization: `Bearer ${bearer}`, "Content-Type": "application/json", ...(init.headers ?? {}) },
  });
  const text = await res.text();
  let json: unknown = null;
  try {
    json = JSON.parse(text);
  } catch {
    /* not json */
  }
  return { status: res.status, json, text };
}

async function createUser(label: string) {
  const email = `primecoat.rls.${label}.${Date.now()}@example.com`;
  const password = `Rls-${Math.random().toString(36).slice(2)}A1!`;
  const r = await api("/auth/v1/admin/users", SERVICE, { method: "POST", body: JSON.stringify({ email, password, email_confirm: true, user_metadata: { full_name: `RLS ${label}` } }) });
  if (r.status !== 200) throw new Error(`create user ${label}: ${r.status} ${r.text}`);
  const t = await api("/auth/v1/token?grant_type=password", ANON, { method: "POST", body: JSON.stringify({ email, password }) }, ANON);
  const token = (t.json as { access_token?: string })?.access_token;
  if (!token) throw new Error(`sign in ${label}: ${t.status} ${t.text}`);
  return { id: (r.json as { id: string }).id, email, token };
}

async function main() {
  const a = await createUser("a");
  const b = await createUser("b");
  try {
    const { json: products } = await api("/rest/v1/products?select=id&is_active=eq.true&stock_quantity=gt.0&limit=1", ANON);
    const productId = (products as { id: string }[])[0]?.id;
    check("anon can read an active product", Boolean(productId));

    // ---- cart_items isolation
    const addA = await api("/rest/v1/rpc/cart_add_item", ANON, { method: "POST", body: JSON.stringify({ p_product_id: productId, p_quantity: 2 }) }, a.token);
    check("A can add to her cart via cart_add_item()", addA.status === 200 && addA.json === 2, `status=${addA.status} qty=${addA.text}`);
    const cartA = await api(`/rest/v1/cart_items?select=product_id,quantity`, ANON, {}, a.token);
    check("A sees her cart line", Array.isArray(cartA.json) && (cartA.json as unknown[]).length === 1);
    const cartB = await api(`/rest/v1/cart_items?select=id`, ANON, {}, b.token);
    check("B sees zero cart lines", Array.isArray(cartB.json) && (cartB.json as unknown[]).length === 0);
    const updB = await api(`/rest/v1/cart_items?product_id=eq.${productId}`, ANON, { method: "PATCH", body: JSON.stringify({ quantity: 99 }), headers: { Prefer: "return=representation" } }, b.token);
    check("B cannot change A's cart", Array.isArray(updB.json) && (updB.json as unknown[]).length === 0, `status=${updB.status}`);
    const insB = await api(`/rest/v1/cart_items`, ANON, { method: "POST", body: JSON.stringify({ user_id: a.id, product_id: productId, quantity: 1 }) }, b.token);
    check("B cannot insert into A's cart", insB.status >= 400, `status=${insB.status}`);
    const anonCart = await api(`/rest/v1/cart_items?select=id`, ANON);
    check("anon sees zero cart lines", Array.isArray(anonCart.json) && (anonCart.json as unknown[]).length === 0);

    const created = await api("/rest/v1/rpc/create_order", ANON, {
      method: "POST",
      body: JSON.stringify({
        p_customer: { fullName: "RLS A", email: a.email, phone: "08031234567", deliveryAddress: "1 Test Close", city: "Lagos", state: "Lagos" },
        p_items: [{ productId, quantity: 1 }],
      }),
    }, a.token);
    const order = created.json as { id?: string; order_number?: string; user_id?: string } | null;
    check("A can create an order via create_order()", created.status === 200 && Boolean(order?.id), `status=${created.status}`);
    check("order is owned by A", order?.user_id === a.id);

    const cartAfter = await api(`/rest/v1/cart_items?select=id`, ANON, {}, a.token);
    check("create_order emptied A's cart in the same transaction", Array.isArray(cartAfter.json) && (cartAfter.json as unknown[]).length === 0);
    const asA = await api(`/rest/v1/orders?select=id,order_items(id)`, ANON, {}, a.token);
    check("A sees exactly her order", Array.isArray(asA.json) && (asA.json as unknown[]).length === 1);

    const asB = await api(`/rest/v1/orders?select=id`, ANON, {}, b.token);
    check("B sees zero orders", Array.isArray(asB.json) && (asB.json as unknown[]).length === 0);
    const asBById = await api(`/rest/v1/orders?id=eq.${order?.id}&select=id`, ANON, {}, b.token);
    check("B cannot fetch A's order by id", Array.isArray(asBById.json) && (asBById.json as unknown[]).length === 0);
    const itemsB = await api(`/rest/v1/order_items?order_id=eq.${order?.id}&select=id`, ANON, {}, b.token);
    check("B cannot fetch A's order items", Array.isArray(itemsB.json) && (itemsB.json as unknown[]).length === 0);
    const profB = await api(`/rest/v1/profiles?id=eq.${a.id}&select=id`, ANON, {}, b.token);
    check("B cannot read A's profile", Array.isArray(profB.json) && (profB.json as unknown[]).length === 0);

    const anonOrders = await api(`/rest/v1/orders?select=id`, ANON);
    check("anon sees zero orders", Array.isArray(anonOrders.json) && (anonOrders.json as unknown[]).length === 0);
    const anonRpc = await api("/rest/v1/rpc/create_order", ANON, { method: "POST", body: JSON.stringify({ p_customer: {}, p_items: [] }) });
    check("anon cannot call create_order", anonRpc.status === 401 || anonRpc.status === 403, `status=${anonRpc.status}`);

    const upd = await api(`/rest/v1/orders?id=eq.${order?.id}`, ANON, { method: "PATCH", body: JSON.stringify({ total: 1 }), headers: { Prefer: "return=representation" } }, a.token);
    check("A cannot update her own order's total", upd.status >= 400 || (Array.isArray(upd.json) && (upd.json as unknown[]).length === 0), `status=${upd.status}`);
    const del = await api(`/rest/v1/orders?id=eq.${order?.id}`, ANON, { method: "DELETE", headers: { Prefer: "return=representation" } }, a.token);
    check("A cannot delete her own order", del.status >= 400 || (Array.isArray(del.json) && (del.json as unknown[]).length === 0), `status=${del.status}`);
    const ins = await api(`/rest/v1/orders`, ANON, {
      method: "POST",
      body: JSON.stringify({ user_id: a.id, order_number: "X", customer_name: "x", email: "x", phone: "x", delivery_address: "x", city: "x", state: "x", subtotal: 0, delivery_fee: 0, total: 0 }),
    }, a.token);
    check("A cannot insert an order directly (must use create_order)", ins.status >= 400, `status=${ins.status}`);
  } finally {
    await api(`/auth/v1/admin/users/${a.id}`, SERVICE, { method: "DELETE" });
    await api(`/auth/v1/admin/users/${b.id}`, SERVICE, { method: "DELETE" });
  }
  console.log(results.join("\n"));
  if (results.some((r) => r.startsWith("FAIL"))) process.exit(1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
