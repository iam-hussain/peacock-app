# Troubleshooting: MongoDB DNS resolution failures (serverless)

## Symptom

Every API route that touches the database returns **500**, with logs like:

```
PrismaClientInitializationError: Invalid `prisma.<model>.<op>()` invocation:
Error in connector: Error creating a database connection.
(Kind: An error occurred during DNS resolution:
 no record found for Query {
   name: Name("_mongodb._tcp.peacock.gwe4u.mongodb.net.ec2.internal."),
   query_type: SRV, query_class: IN
 })
```

The app code is fine — the database connection never gets established.

## Root cause

The `DATABASE_URL` uses the **`mongodb+srv://`** scheme. That scheme requires the
driver to perform a **DNS SRV lookup** of `_mongodb._tcp.<cluster-host>` to
discover the cluster's nodes.

On some serverless hosts (AWS Lambda, which is what Vercel functions run on —
note `/var/task/` in the stack trace), the platform resolver appends an internal
**search domain** such as `ec2.internal` to the query. The lookup becomes:

```
_mongodb._tcp.peacock.gwe4u.mongodb.net.ec2.internal   ->  no record found
```

so the SRV resolution fails and no connection can be created. This is
environmental — it can start happening without any code change (resolver
behavior on a redeploy, a region move, or a paused Atlas cluster).

## Fix

### 1. Rule out a paused / locked-down cluster (Atlas)

- Confirm the cluster is **active** (free M0 tiers auto-pause after inactivity —
  resume it).
- Under **Network Access**, allow **`0.0.0.0/0`**. Serverless functions use
  dynamic egress IPs, so a fixed allowlist will intermittently reject them.

### 2. Use the non-SRV "seedlist" connection string (permanent fix)

The standard (non-`+srv`) string lists the shard hosts directly and **does not
do an SRV lookup**, so the `ec2.internal` search-domain problem disappears.

Get it from Atlas: **Connect → Drivers →** choose an **older Node.js driver
version (≤ 2.2.12)** and copy the displayed string. It looks like:

```
mongodb://<user>:<pass>@peacock-shard-00-00.gwe4u.mongodb.net:27017,peacock-shard-00-01.gwe4u.mongodb.net:27017,peacock-shard-00-02.gwe4u.mongodb.net:27017/prod_db?ssl=true&replicaSet=atlas-xxxxxx-shard-0&authSource=admin&retryWrites=true&w=majority
```

Set this as `DATABASE_URL` in your hosting platform's environment variables
(Vercel → Project → Settings → Environment Variables), then redeploy.

> `DATABASE_URL` lives in the deployment environment, not in the repository
> (`.env` is gitignored), so this change is made in the hosting dashboard — not
> in code.

## Why it was "working before"

No code regression — the most recent commits are UI/dashboard changes. The
failure is triggered by the serverless DNS environment (or a paused cluster),
which is why it can appear suddenly without a deploy of new code.
