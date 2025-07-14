# Mentora

**Mentora** is a decentralized platform that revolutionizes mentorship through group-based learning and knowledge monetization. Connect with expert mentors worldwide through collaborative video sessions where mentees pay less and mentors earn more, making high quality education accessible to everyone, everywhere. 

# Problem to solve

Traditionally, one-on-one mentoring is expensive and inaccessible. Group mentoring with shared costs reduces this barrier. 

For instance, an expert consultant in North America might charge around USD $300 - $500 per hour, this cost is prohibited for most professionals, entrepreneurs or students in developing countries.

On the other hand, experts in several fields struggle to monetize their knowledge and there is no royalties benefit from the content generated in regular mentorship platforms, this is because those companies do not share or monetize the sessions.


# Our solution
We are building a decentralized marketplace for group mentoring on Arbitrum, designed to make expert knowledge more accessible and economically sustainable for both mentors and mentees.

The platform introduces group mentoring sessions with dynamic pricing that creates a win-win scenario: **mentees pay significantly less while mentors earn substantially more** by scaling their time across multiple participants.

**How it works:**
- A mentor typically charges 100 USDC per hour for one-on-one sessions
- With group sessions, the same mentor can serve multiple mentees simultaneously
- **Example**: In a 4-person group session, each mentee pays only 50 USDC (50% savings), while the mentor earns 200 USDC total (100% increase in earnings)
- **Result**: Mentees save 50% on costs, mentors double their hourly rate

This dynamic pricing model makes expert knowledge accessible to more people while creating sustainable income streams for mentors, effectively solving the accessibility and monetization challenges in traditional mentorship.

In the future, each mentoring session can also be recorded, tokenized, and rented as on-demand content, creating passive income opportunities for mentors and the session's organizer.

This project leverages Arbitrum’s scalability and cost-efficiency to pioneer a new type of creators economy focused on education and knowledge-sharing, with the goal of onboarding a global user base of learners and experts.

In future, we will introduce the royalties marketplace feature, where both mentors and mentees can sell or trade their rights to future earnings from session content. All transactions—bookings, rentals, royalty splits, and rights transfers—are governed by smart contracts deployed on Arbitrum to ensure transparency, fairness, and low fees.


---

## Repository layout

Our solution couples secure on-chain payments with LiveKit’s real-time video infrastructure to deliver a smooth end-to-end experience for both participants and mentors.


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
