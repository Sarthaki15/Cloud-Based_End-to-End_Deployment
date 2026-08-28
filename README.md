# The Roasted Leaf — Cafe Website

A 3-tier web application for a cafe: a browsable/searchable menu, cart and
checkout, and account sign-up/sign-in backed by AWS Cognito. Built to be
deployed on scalable, managed AWS infrastructure.

## 1. Architecture (3-tier)

```
┌─────────────────────┐      ┌──────────────────────┐      ┌───────────────────────┐
│   PRESENTATION TIER  │      │   APPLICATION TIER    │      │      DATA TIER         │
│  React (Vite) SPA    │─────▶│  Node.js / Express API │─────▶│  DynamoDB (or RDS)     │
│  Hosted on S3 +       │ HTTPS│  Hosted on Elastic     │      │  CafeMenuItems table   │
│  CloudFront (CDN)     │      │  Beanstalk / ECS       │      │  CafeOrders table      │
│                       │      │  Fargate + ALB +       │      │                        │
│  Auth UI talks        │      │  Auto Scaling Group    │      │  Cognito User Pool     │
│  directly to Cognito  │      │                        │      │  (identity store)      │
└──────────┬────────────┘      └───────────┬────────────┘      └───────────┬───────────┘
           │                                │                              │
           └──────────── Amazon Cognito (sign-up / sign-in / JWT) ─────────┘
```

- **Presentation tier** (`/frontend`): React + Vite single-page app. Talks to
  Cognito directly for auth (via `amazon-cognito-identity-js`) and to the
  backend REST API for menu/orders.
- **Application tier** (`/backend`): Express REST API. Verifies Cognito JWTs
  on protected routes, applies business logic (filtering, order creation),
  and is the only tier allowed to talk to the database.
- **Data tier**: DynamoDB tables (`CafeMenuItems`, `CafeOrders`) — swap for
  Amazon RDS (Postgres/MySQL) if you prefer relational storage; the access
  layer is isolated in `backend/data/dynamo.js` so this is a contained change.

Separating tiers this way means each layer scales and fails independently —
you can scale the API's Auto Scaling Group under load without touching the
CDN-cached frontend, and DynamoDB scales on-demand without any capacity
planning on your part.

## 2. Features

- Menu browsing with live search, category tabs, and veg-only filter
- Shopping cart (client-side) with a slide-out drawer
- Sign-up / email verification / sign-in / sign-out via AWS Cognito
- Protected checkout and order-history routes (JWT-gated both client- and
  server-side)
- REST API with health check, rate limiting, and security headers
- Graceful fallback: menu API serves bundled JSON if DynamoDB isn't
  configured yet, so you can develop locally before AWS resources exist

## 3. Prerequisites & package requirements

| Tool | Version | Purpose |
|---|---|---|
| Node.js | 18.x or later | Runs both frontend build tooling and backend |
| npm | 9.x or later (ships with Node) | Package management |
| AWS account | — | Cognito, DynamoDB, S3, CloudFront, compute |
| AWS CLI v2 | latest | Creating AWS resources from the command line |

Key npm packages (already declared in each `package.json`, installed via
`npm install`):

**Frontend** (`/frontend/package.json`)
- `react`, `react-dom`, `react-router-dom` — UI and routing
- `amazon-cognito-identity-js` — Cognito sign-up/sign-in/session handling in the browser
- `vite`, `@vitejs/plugin-react` — dev server and production bundler

**Backend** (`/backend/package.json`)
- `express` — HTTP server/router
- `aws-jwt-verify` — verifies Cognito-issued JWTs against the User Pool's public keys
- `@aws-sdk/client-dynamodb`, `@aws-sdk/lib-dynamodb` — DynamoDB data access (AWS SDK v3)
- `cors`, `helmet`, `morgan`, `express-rate-limit` — CORS, security headers, logging, rate limiting
- `dotenv` — loads `.env` locally (not used in production; use IAM roles + environment config instead)
- `uuid` — order ID generation
- `nodemon` (dev only) — auto-restart during development

## 4. Local setup and compilation steps

### 4.1 Backend

```bash
cd backend
npm install                  # installs all dependencies above
cp .env.example .env         # fill in Cognito + DynamoDB values (step 5)
npm run dev                  # starts on http://localhost:4000 with auto-reload
# or for a production-style run:
npm start
```

Without valid AWS credentials configured, `/api/menu` still works — it
automatically falls back to the bundled `backend/data/menu.json` — but
`/api/orders` will fail until Cognito + DynamoDB are set up, since it's
protected by JWT verification.

### 4.2 Frontend

```bash
cd frontend
npm install
cp .env.example .env         # fill in Cognito + API URL (step 5)
npm run dev                  # dev server on http://localhost:5173, proxies /api to :4000
```

**Compiling for production:**

```bash
npm run build                # outputs static assets to frontend/dist
npm run preview              # optional: serve the production build locally to sanity-check it
```

`frontend/dist` is exactly what you upload to S3 in step 6 — it's a fully
static bundle (HTML/CSS/JS), no server required to serve it.

## 5. AWS Cognito setup (authentication tier)

You can do this in the Cognito console, or with the AWS CLI as below.

```bash
# 1. Create the User Pool
aws cognito-idp create-user-pool \
  --pool-name CafeUserPool \
  --auto-verified-attributes email \
  --policies "PasswordPolicy={MinimumLength=8,RequireUppercase=true,RequireLowercase=true,RequireNumbers=true,RequireSymbols=true}" \
  --schema Name=email,Required=true,Mutable=true Name=name,Required=true,Mutable=true

# Note the returned "Id", e.g. ap-south-1_AbCdEfGhI → this is COGNITO_USER_POOL_ID

# 2. Create an App Client (no client secret — required for browser-based SPA auth)
aws cognito-idp create-user-pool-client \
  --user-pool-id ap-south-1_AbCdEfGhI \
  --client-name CafeWebClient \
  --no-generate-secret \
  --explicit-auth-flows ALLOW_USER_PASSWORD_AUTH ALLOW_REFRESH_TOKEN_AUTH

# Note the returned "ClientId" → this is COGNITO_CLIENT_ID
```

Put these into:
- `backend/.env` → `COGNITO_USER_POOL_ID`, `COGNITO_CLIENT_ID`
- `frontend/.env` → `VITE_COGNITO_USER_POOL_ID`, `VITE_COGNITO_CLIENT_ID`

The frontend calls Cognito **directly** for sign-up/sign-in (no backend
round-trip needed for auth itself); the backend only ever *verifies* the
resulting JWT using the User Pool's public JWKS — it never sees passwords.

## 6. Data tier: DynamoDB setup

```bash
# Menu table
aws dynamodb create-table \
  --table-name CafeMenuItems \
  --attribute-definitions AttributeName=id,AttributeType=S \
  --key-schema AttributeName=id,KeyType=HASH \
  --billing-mode PAY_PER_REQUEST

# Orders table, with a Global Secondary Index so users can query their own history
aws dynamodb create-table \
  --table-name CafeOrders \
  --attribute-definitions \
      AttributeName=orderId,AttributeType=S \
      AttributeName=userSub,AttributeType=S \
      AttributeName=createdAt,AttributeType=S \
  --key-schema AttributeName=orderId,KeyType=HASH \
  --global-secondary-indexes \
    '[{
      "IndexName": "userSub-index",
      "KeySchema": [
        {"AttributeName":"userSub","KeyType":"HASH"},
        {"AttributeName":"createdAt","KeyType":"RANGE"}
      ],
      "Projection": {"ProjectionType":"ALL"}
    }]' \
  --billing-mode PAY_PER_REQUEST
```

Then seed the menu table from the bundled JSON:

```bash
cd backend
npm run seed
```

`PAY_PER_REQUEST` billing means the table scales automatically with traffic
with no capacity planning — a good fit for a cafe's variable order volume.

## 7. Deployment: scalable hosting on AWS

### 7.1 Presentation tier → S3 + CloudFront

```bash
npm run build                                   # from /frontend
aws s3 mb s3://your-cafe-frontend-bucket
aws s3 sync dist/ s3://your-cafe-frontend-bucket --delete
```

Then create a **CloudFront distribution** with that bucket as its origin
(use an Origin Access Control so the bucket itself stays private), and
attach an ACM certificate for HTTPS on your domain. CloudFront gives you:
global edge caching, HTTPS, and DDoS protection (AWS Shield Standard) at no
extra setup cost.

### 7.2 Application tier → Elastic Beanstalk (simplest) or ECS Fargate (more control)

**Option A — Elastic Beanstalk (fastest to stand up, auto-scales out of the box):**

```bash
cd backend
zip -r ../backend.zip . -x "node_modules/*" ".env"
eb init cafe-api --platform "Node.js 18" --region ap-south-1
eb create cafe-api-env --instance-type t3.small --min-instances 2 --max-instances 6
eb setenv COGNITO_USER_POOL_ID=... COGNITO_CLIENT_ID=... DYNAMO_MENU_TABLE=... DYNAMO_ORDERS_TABLE=... CLIENT_ORIGIN=https://your-cloudfront-domain
```

Elastic Beanstalk provisions an Application Load Balancer + Auto Scaling
Group for you, scaling the `min`/`max` instance range based on CPU/traffic.

**Option B — ECS Fargate (containerized, no servers to patch):**
1. Add a `Dockerfile` to `/backend` (Node 18-alpine base, `npm ci`, `CMD ["node","server.js"]`).
2. Push the image to Amazon ECR.
3. Create an ECS Fargate service behind an Application Load Balancer, with
   an Auto Scaling policy on target CPU (e.g., scale out above 60% CPU).

Either way: **attach an IAM role to the compute (EC2 instance profile / ECS
task role) with the policy below**, instead of putting AWS access keys in
`.env` — this is the secure, production-correct pattern.

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "dynamodb:GetItem",
        "dynamodb:PutItem",
        "dynamodb:Query",
        "dynamodb:Scan",
        "dynamodb:UpdateItem",
        "dynamodb:DeleteItem"
      ],
      "Resource": [
        "arn:aws:dynamodb:ap-south-1:ACCOUNT_ID:table/CafeMenuItems",
        "arn:aws:dynamodb:ap-south-1:ACCOUNT_ID:table/CafeOrders",
        "arn:aws:dynamodb:ap-south-1:ACCOUNT_ID:table/CafeOrders/index/*"
      ]
    }
  ]
}
```

### 7.3 Data tier

DynamoDB is fully managed and scales on demand under `PAY_PER_REQUEST`
billing — no servers to provision. If you'd rather use a relational
database, replace `backend/data/dynamo.js` with equivalent calls to an
Amazon RDS instance (put it in a private subnet, reachable only from the
application tier's security group) — the rest of the app is unaffected
since routes only ever import from that one data-access module.

### 7.4 Tying it together

- Point your domain's DNS (Route 53) at the CloudFront distribution for the
  frontend, and at the Elastic Beanstalk/ALB endpoint (e.g. `api.yourcafe.com`)
  for the backend.
- Set `CLIENT_ORIGIN` on the backend to your real frontend domain, and
  `VITE_API_BASE_URL` on the frontend to your real API domain, then rebuild
  and redeploy the frontend.
- Because the frontend is static and CDN-cached, and the backend/database
  scale independently behind their own managed services, the whole stack
  scales horizontally with traffic without manual intervention.

## 8. Project structure

```
cafe-website/
├── README.md
├── frontend/
│   ├── src/
│   │   ├── components/     Navbar, Footer, MenuCard, CartDrawer, ProtectedRoute
│   │   ├── context/        AuthContext (Cognito), CartContext
│   │   ├── pages/          Home, Menu, Login, Signup, ConfirmSignup, Checkout, Profile
│   │   ├── aws-config.js   Cognito + API config from env vars
│   │   └── App.jsx / main.jsx
│   ├── index.html, vite.config.js, package.json
│   └── .env.example
└── backend/
    ├── server.js            Express entrypoint
    ├── middleware/
    │   └── verifyToken.js   Cognito JWT verification
    ├── routes/
    │   ├── menu.js           public menu endpoints (with filters/search)
    │   └── orders.js         protected order endpoints
    ├── data/
    │   ├── dynamo.js         DynamoDB data-access layer
    │   ├── menu.json         seed data / local fallback
    │   └── seed.js           loads menu.json into DynamoDB
    ├── package.json
    └── .env.example
```

## 9. Testing checklist before going live

- [ ] `npm run build` in `/frontend` completes with no errors
- [ ] `npm start` in `/backend` boots and `/api/health` returns `200`
- [ ] Sign-up creates a user in the Cognito User Pool and sends a verification email
- [ ] Sign-in returns a valid access token and `/api/orders` accepts it
- [ ] `/api/orders` returns `401` without a token (already verified above)
- [ ] Placing an order writes to the `CafeOrders` DynamoDB table
- [ ] CloudFront serves the frontend over HTTPS with the custom domain
- [ ] Backend Auto Scaling Group has `min-instances >= 2` for high availability
