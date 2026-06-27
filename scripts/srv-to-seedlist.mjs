#!/usr/bin/env node
// Convert a MongoDB Atlas `mongodb+srv://` URL into the equivalent non-SRV
// `mongodb://` seedlist URL (skips the SRV DNS lookup that fails on some
// serverless hosts, e.g. the ".ec2.internal" search-domain leak on Lambda/Vercel).
//
// Usage:
//   node scripts/srv-to-seedlist.mjs "mongodb+srv://user:pass@host/db?opts"
// or, if DATABASE_URL is already set in your shell:
//   node scripts/srv-to-seedlist.mjs

import dns from "node:dns/promises";

const input = process.argv[2] || process.env.DATABASE_URL;
if (!input) {
  console.error("Pass the mongodb+srv:// URL as an argument or set DATABASE_URL.");
  process.exit(1);
}
if (!input.startsWith("mongodb+srv://")) {
  console.error("Input is not a mongodb+srv:// URL — nothing to convert.");
  process.exit(1);
}

const u = new URL(input);
const cluster = u.hostname; // e.g. peacock.gwe4u.mongodb.net
const user = u.username;
const pass = u.password;
const dbName = u.pathname.replace(/^\//, ""); // e.g. peacock_prod

const srv = await dns.resolveSrv(`_mongodb._tcp.${cluster}`);
const hosts = srv.map((r) => `${r.name}:${r.port}`).join(",");

// TXT record carries default options (replicaSet, authSource, ...)
let txtOpts = {};
try {
  const txt = await dns.resolveTxt(cluster);
  const flat = txt.map((chunks) => chunks.join("")).join("&");
  for (const pair of flat.split("&")) {
    const [k, v] = pair.split("=");
    if (k) txtOpts[k] = v;
  }
} catch {
  /* some clusters have no TXT record */
}

// SRV scheme implies TLS; merge TXT defaults + original query params.
const params = new URLSearchParams({ ssl: "true", ...txtOpts });
for (const [k, v] of u.searchParams) params.set(k, v);

const auth = user ? `${encodeURIComponent(user)}:${encodeURIComponent(pass)}@` : "";
const out = `mongodb://${auth}${hosts}/${dbName}?${params.toString()}`;

console.log("\nNon-SRV seedlist connection string:\n");
console.log(out + "\n");
