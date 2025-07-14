# Mentora

Mentora is a crypto-native platform that lets anyone book collaborative video sessions with mentors across the globe and pay for them in the same, borderless flow. It couples secure on-chain payments with LiveKit’s real-time video infrastructure to deliver a smooth end-to-end experience for both participants and mentors.

---

## Repository layout

```
apps/
├─ backend     # NestJS API – issues LiveKit access tokens and (soon) more
├─ contracts   # Solidity smart contracts – sessions, mentors, participants and payments
└─ frontend    # Next.js + LiveKit prototype – integrates with both backend & contracts
docker/        # Docker compose files for local dev
envs/          # Place your .env files here (git-ignored)
```

### Backend (`apps/backend`)

- **Stack**: NestJS, PostgreSQL
- **Today**: exposes a tiny REST API that manages LiveKit rooms and mints JWT access tokens so users can join them.
- **Tomorrow**: off-chain indexing, email notifications, analytics … we haven't decided yet.
- Runs inside Docker and connects to the `postgres` service defined in `docker/docker-compose.local.yml`.

### Smart contracts (`apps/contracts`)

- Solidity contracts that codify all business logic:
  - `Mentors.sol` – registry of verified mentors.
  - `Sessions.sol` – create / join / accept / complete paid sessions with configurable platform fee.
- Built and tested with Hardhat + Typechain.

### Frontend (`apps/frontend`)

- Next.js 14 App Router.
- Uses `@livekit/components-react` for the video UI.
- PoC that demonstrates a happy-path flow:
  1. Creates or joins a session on-chain.
  2. Requests an access token from the backend.
  3. Joins the LiveKit room.

---

## Quick start

Prerequisites: **Docker + Docker Compose, Node 18+, Yarn or PNPM**.

Clone the repo

```bash
git clone https://github.com/your-org/mentora.git
cd mentora
```

### 1. Environment variables

Create the `envs` files (check the examples!):

`envs/.env.postgres`

```env
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
POSTGRES_DB=mentora
```

`envs/.env.backend`

```env
# API
PORT=3000

# LiveKit credentials
LIVEKIT_URL=https://your-livekit.example.com
LIVEKIT_API_KEY=LKxxxx
LIVEKIT_API_SECRET=supersecret

# Database
DATABASE_URL=postgresql://postgres:postgres@postgres:5432/mentora
```

`envs/.env.frontend`

```env
LIVEKIT_API_KEY=
LIVEKIT_API_SECRET=
LIVEKIT_URL=https://your-livekit.example.com
NEXT_PUBLIC_SHOW_SETTINGS_MENU=true
NEXT_PUBLIC_RAINBOW_KIT_PROJECT_ID=
```

### 2. Start the backend + Postgres with Docker

From the repository root run:

```bash
npm run start:dev            # hot-reloaded backend
# or
npm run start:dev:build      # builds the backend image the first time
```

The API will be available at http://localhost:3000 once the containers are healthy.

Key endpoints (see `apps/backend/src/livekit`):

| Method | Path                   | Description                                     |
| ------ | ---------------------- | ----------------------------------------------- |
| POST   | `/livekit/rooms`       | Create a new LiveKit room                       |
| GET    | `/livekit/rooms`       | List rooms                                      |
| DELETE | `/livekit/rooms`       | Delete **all** rooms                            |
| DELETE | `/livekit/rooms/:name` | Delete a single room                            |
| POST   | `/livekit/tokens`      | Mint an access token (`{ sessionId, address }`) |

### 3. Run the contracts locally (optional)

```bash
cd apps/contracts
pnpm install
npx hardhat compile
# test suite is deprecated, correspond to an old contract version
# We keep the files for the record for building the new test suite.
# npx hardhat test

# start an ephemeral local chain
npx hardhat node
# deploy to the local chain
npx hardhat run scripts/deploy2-arbitrum-sepolia.ts --network localhost
```

### 4. Run the frontend

```bash
cd apps/frontend
pnpm install
pnpm dev
```

Navigate to http://localhost:3001 (or the port Next chooses) and try creating / joining a session.
Note: If you are testing this locally, you'll need to modify the smart contract addresses in apps/frontend/lib/contracts/addresses.ts
We will be migrating this values to envs soon.

---

## Roadmap

1. Wallet-based auth & role management.
2. Mentor discovery marketplace.
3. Calendar availability & scheduling.
4. Fiat on-ramps & L2 support.
5. Recording & transcription of sessions.

---

## Contributing

PRs and issues are welcome! Check out the tasks in the project board or open an issue to discuss ideas.

---

## License

MIT © 2024 Mentora contributors
