# BeatChain — Final Upgrade Implementation Plan

> All open questions resolved. Pinata JWT security deferred to `see_later.md`.

---

## Part 1 — Environment Variable Changes

### `blockchain/.env.example` — New vars to add

Three new contracts need to be deployed; the deploy script needs to know their addresses after deployment. No new *input* env vars are needed — only the deploy script output changes.

```
# No new input vars needed for blockchain/.env
# SEPOLIA_RPC_URL and SEPOLIA_PRIVATE_KEY are sufficient
# The 3 new contract addresses are OUTPUT, pasted into frontend .env.local after deploy
```

### `frontend/.env.example` — New vars to add (3 new contract addresses)

Currently has 3 contract addresses + 1 Pinata JWT. After this upgrade, add:

```env
# ─── NEW: Dispute Resolution ────────────────────────────────
NEXT_PUBLIC_DISPUTE_RESOLUTION_ADDRESS=0x0000000000000000000000000000000000000000

# ─── NEW: Shared Ownership ──────────────────────────────────
NEXT_PUBLIC_SHARED_OWNERSHIP_ADDRESS=0x0000000000000000000000000000000000000000

# ─── NEW: NFT Marketplace ───────────────────────────────────
NEXT_PUBLIC_MARKETPLACE_ADDRESS=0x0000000000000000000000000000000000000000

# ─── NEW: Governance Token (for dispute DAO voting) ─────────
NEXT_PUBLIC_GOVERNANCE_TOKEN_ADDRESS=0x0000000000000000000000000000000000000000

# ─── IPFS Gateway (optional override) ───────────────────────
NEXT_PUBLIC_IPFS_GATEWAY=cloudflare-ipfs.com
```

**Total frontend env vars after upgrade:** 3 existing + 4 new = **7 contract addresses** + 1 Pinata JWT + 1 gateway = **9 vars**.

> Pinata JWT stays as `NEXT_PUBLIC_PINATA_JWT` for now — security fix deferred to `see_later.md`.

### `blockchain/scripts/deploy.ts` — Must be updated to deploy all 6 contracts

Deploy order (respects constructor dependencies):
1. `MusicRegistry` (no deps)
2. `Payment(registryAddress)` (depends on Registry)
3. `MusicNFT(registryAddress)` (depends on Registry)
4. `BeatToken()` — new ERC-20 governance token (no deps)
5. `DisputeResolution(registryAddress, beatTokenAddress)` (depends on Registry + Token)
6. `SharedOwnership(registryAddress, paymentAddress)` (depends on Registry + Payment)
7. `MusicMarketplace(musicNFTAddress)` (depends on NFT)

The script must also call post-deploy wiring:
- `registry.setDisputeResolver(disputeResolutionAddress)`

---

## Part 2 — Bug Fixes

| # | File | Fix |
|---|------|-----|
| SC-1 | `MusicRegistry.sol:101` | Fix `TrackUploaded` event — emit `artistName` param (currently missing) |
| SC-2 | `MusicRegistry.sol` | Add genre empty-check (`EmptyField("genre")`) |
| SC-3 | `MusicNFT.sol:129` | Change `burn()` error from `TokenNotFound` to a new `NotTokenOwner` error |
| SC-4 | `Counter.sol` | Delete file + its ignition module |
| SC-5 | `Payment.sol` | No change to tip validation — addressed by UI routing tips through `tipTrack(trackId)` |
| FE-1 | `explore/page.tsx` | Replace `getWeb3Provider()` with `getReadOnlyProvider()` |
| FE-2 | `track/[id]/page.tsx` | Replace `getWeb3Provider()` with `getReadOnlyProvider()` |
| FE-3 | `AudioPlayerContext.tsx` | Add `audioRef` to `useMemo` dependency array |
| FE-4 | `AudioPlayer.tsx:66` | Check `activeSrc.length > 0` instead of comparing to `window.location.href` |
| FE-5 | `profile/page.tsx:87` | Compare earnings using `BigInt` from contract directly, not `parseFloat` |
| FE-6 | `track/[id]/page.tsx` | Remove hardcoded Duration/Date/Format; fetch real release timestamp from contract |
| FE-7 | `track/[id]/page.tsx` | Wire "Collect" button to NFT marketplace; wire "Share" to clipboard copy |
| FE-8 | `Navbar.tsx` | Add `accountsChanged` + `chainChanged` MetaMask event listeners |
| FE-9 | `profile/page.tsx` | Fetch real NFT count from `MusicNFT` contract |
| FE-10 | `explore/page.tsx:53` | Sort by `playCount` descending (actual trending), fix label |

---

## Part 3 — New Smart Contracts

### 3A. `BeatToken.sol` [NEW]

ERC-20 governance token used for token-weighted dispute voting.

```solidity
// Key design:
- Standard OpenZeppelin ERC20 + ERC20Votes (snapshot-based voting weight)
- constructor mints initial supply to deployer (e.g. 1,000,000 BEAT)
- Artists earn BEAT when they upload tracks (MusicRegistry calls token.mint)
- Alternatively: deployer distributes manually to bootstrap governance
- Functions: standard ERC20 + delegate(), getVotes(address)
```

### 3B. `DisputeResolution.sol` [NEW]

Handles ownership conflicts with token-weighted DAO voting.

```solidity
struct Dispute {
  uint256 id;
  uint256 trackId;
  address claimant;          // person opening dispute
  address respondent;        // current track artist (from registry)
  string evidenceCIDClaimant;
  string evidenceCIDRespondent;
  uint256 votesFor;          // BEAT tokens supporting claimant
  uint256 votesAgainst;      // BEAT tokens supporting respondent
  uint256 deadline;          // block.timestamp + VOTING_PERIOD
  DisputeStatus status;      // Open | Resolved | Rejected
}

enum DisputeStatus { Open, Resolved, Rejected }

// State:
mapping(uint256 => Dispute) public disputes;
mapping(uint256 => mapping(address => bool)) public hasVoted;
uint256 public disputeCount;
uint256 public constant VOTING_PERIOD = 3 days;
uint256 public constant MIN_DISPUTE_STAKE = 0.01 ether; // anti-spam deposit
MusicRegistry public registry;
BeatToken public beatToken;
SharedOwnership public sharedOwnership; // reference to clear shares on resolution

// Functions:
function openDispute(uint256 trackId, string calldata evidenceCID)
  external payable returns (uint256 disputeId);
  // msg.value >= MIN_DISPUTE_STAKE (spam prevention)
  // claimant != current track artist

function submitRespondentEvidence(uint256 disputeId, string calldata evidenceCID)
  external;
  // only respondent (current track.artist)
  // only while status == Open and before deadline

function castVote(uint256 disputeId, bool supportClaimant) external;
  // msg.sender must have BEAT token balance > 0
  // weight = beatToken.getVotes(msg.sender)
  // one vote per address per dispute
  // only while Open and before deadline

function resolveDispute(uint256 disputeId) external;
  // callable by anyone after deadline
  // if votesFor > votesAgainst:
  //   registry.transferTrackOwnership(trackId, claimant)
  //   sharedOwnership.clearShares(trackId)  // user decision Q3
  //   status = Resolved
  // else:
  //   status = Rejected (original owner keeps track)
  // stake returned to claimant if won, to respondent if lost

function getDispute(uint256 id) external view returns (Dispute memory);
function getDisputesByTrack(uint256 trackId) external view returns (uint256[] memory);

// Events:
event DisputeOpened(uint256 indexed disputeId, uint256 indexed trackId, address claimant);
event EvidenceSubmitted(uint256 indexed disputeId, address submitter, string cid);
event VoteCast(uint256 indexed disputeId, address voter, bool support, uint256 weight);
event DisputeResolved(uint256 indexed disputeId, address winner, DisputeStatus status);
```

### 3C. `SharedOwnership.sol` [NEW]

```solidity
struct ShareConfig {
  address[] shareholders;
  uint256[] basisPoints; // must sum to 10000 (= 100%)
}

mapping(uint256 => ShareConfig) private _shares; // trackId => config
MusicRegistry public registry;

function setShares(
  uint256 trackId,
  address[] calldata shareholders,
  uint256[] calldata basisPoints
) external;
// only registry.getTrack(trackId).artist
// validates: lengths match, no zero addresses, sum == 10000

function distributeRevenue(uint256 trackId) external payable;
// splits msg.value proportionally, sends ETH directly to each shareholder
// nonReentrant; uses pull-payment style internally with a loop
// emits RevenueDistributed

function clearShares(uint256 trackId) external;
// only callable by DisputeResolution contract address
// deletes _shares[trackId]

function getShares(uint256 trackId)
  external view returns (address[] memory, uint256[] memory);

function hasShares(uint256 trackId) external view returns (bool);

// Events:
event SharesConfigured(uint256 indexed trackId, address[] shareholders, uint256[] basisPoints);
event RevenueDistributed(uint256 indexed trackId, uint256 totalAmount);
event SharesCleared(uint256 indexed trackId);
```

**Payment.sol modification:** In `streamPayment()`, after crediting artist, check `sharedOwnership.hasShares(trackId)`. If true, redirect `msg.value` to `sharedOwnership.distributeRevenue{value: msg.value}(trackId)` instead of `_earnings[artist]`.

### 3D. `MusicMarketplace.sol` [NEW]

```solidity
struct Listing {
  uint256 tokenId;
  address seller;
  uint256 price;   // in wei
  bool active;
}

mapping(uint256 => Listing) public listings;
uint256[] private _activeListingIds;
MusicNFT public musicNFT;
uint256 public platformFeeBps = 250; // 2.5%
address public feeRecipient;  // deployer/platform wallet

function listNFT(uint256 tokenId, uint256 price) external;
// caller must be NFT owner
// contract must be approved: nft.isApprovedForAll(seller, marketplace)
// price > 0
// emits NFTListed

function cancelListing(uint256 tokenId) external;
// only seller; sets active=false; emits NFTDelisted

function buyNFT(uint256 tokenId) external payable nonReentrant;
// listing must be active
// msg.value == listing.price
// 1. Deduct platform fee → feeRecipient
// 2. Check ERC-2981 royalty info (token, price) as best practice
//    (user Q2: follow standard, not enforce — royalty INFO is shown
//     but NOT deducted from seller; seller sees full price minus platform fee)
//    NOTE: This means royalty is informational only per user decision
// 3. Transfer remaining to seller
// 4. nft.safeTransferFrom(seller, buyer, tokenId)
// 5. active = false; emits NFTSold

function updatePrice(uint256 tokenId, uint256 newPrice) external;
// only current seller

function getListing(uint256 tokenId) external view returns (Listing memory);
function getActiveListings() external view returns (uint256[] memory);

// Events:
event NFTListed(uint256 indexed tokenId, address seller, uint256 price);
event NFTDelisted(uint256 indexed tokenId);
event NFTSold(uint256 indexed tokenId, address buyer, uint256 price);
event PriceUpdated(uint256 indexed tokenId, uint256 newPrice);
```

---

## Part 4 — MusicRegistry.sol Modifications

```solidity
// ADD: authorized dispute resolver address
address public disputeResolver;

// ADD: event for ownership transfer
event TrackOwnershipTransferred(uint256 indexed trackId, address oldOwner, address newOwner);

// ADD: fix TrackUploaded event to include artistName
event TrackUploaded(
  uint256 indexed trackId,
  address indexed artist,
  string title,
  string artistName,  // ← was missing
  string genre,
  string ipfsCID,
  string coverArtCID,
  uint256 timestamp
);

// ADD: genre validation in uploadTrack
if (bytes(genre).length == 0) revert EmptyField("genre");

// ADD: setDisputeResolver (owner-only, needs Ownable)
function setDisputeResolver(address resolver) external onlyOwner;

// ADD: transferTrackOwnership (only callable by disputeResolver)
function transferTrackOwnership(uint256 trackId, address newOwner) external {
  if (msg.sender != disputeResolver) revert Unauthorized();
  if (!_tracks[trackId].exists) revert TrackNotFound(trackId);
  address oldOwner = _tracks[trackId].artist;
  _tracks[trackId].artist = newOwner;
  // update _artistTracks: remove from old, add to new
  _artistTracks[newOwner].push(trackId);
  // (old owner's array retains the entry — acceptable for now)
  emit TrackOwnershipTransferred(trackId, oldOwner, newOwner);
}

// ADD: new error
error Unauthorized();

// ADD: import Ownable
import "@openzeppelin/contracts/access/Ownable.sol";
contract MusicRegistry is Ownable { ... }
```

---

## Part 5 — Payment.sol Modifications

```solidity
// ADD: tipTrack function (tip by track ID, no need to know artist address)
function tipTrack(uint256 trackId) external payable {
  if (msg.value == 0) revert ZeroValue();
  address artist = registry.getTrack(trackId).artist;
  _earnings[artist] += msg.value;
  trackEarnings[trackId] += msg.value;
  totalPlatformPayments += msg.value;
  emit TipTrackReceived(msg.sender, trackId, artist, msg.value);
}

// ADD: event
event TipTrackReceived(address indexed fan, uint256 indexed trackId, address indexed artist, uint256 amount);

// ADD: SharedOwnership reference
SharedOwnership public sharedOwnership;

// ADD: setSharedOwnership (only owner)
function setSharedOwnership(address _sharedOwnership) external onlyOwner;

// MODIFY: streamPayment to route through SharedOwnership if configured
function streamPayment(uint256 trackId) external payable {
  if (msg.value == 0) revert ZeroValue();
  address artist = registry.getTrack(trackId).artist;

  if (address(sharedOwnership) != address(0) && sharedOwnership.hasShares(trackId)) {
    sharedOwnership.distributeRevenue{value: msg.value}(trackId);
  } else {
    _earnings[artist] += msg.value;
  }
  trackEarnings[trackId] += msg.value;
  totalPlatformPayments += msg.value;
  emit StreamPayment(msg.sender, trackId, artist, msg.value);
}

// ADD: import + inherit Ownable
import "@openzeppelin/contracts/access/Ownable.sol";
contract Payment is ReentrancyGuard, Ownable { ... }
```

---

## Part 6 — MusicNFT.sol Modifications

```solidity
// ADD: new error
error NotTokenOwner();

// MODIFY: burn() — fix wrong error
function burn(uint256 tokenId) external {
  if (_ownerOf(tokenId) != msg.sender) revert NotTokenOwner(); // was TokenNotFound
  _burn(tokenId);
  _resetTokenRoyalty(tokenId);
}
```

---

## Part 7 — Frontend Changes (Detailed)

### 7A. `lib/web3.ts` — Add read-only provider

```typescript
const PUBLIC_SEPOLIA_RPC = process.env.NEXT_PUBLIC_SEPOLIA_RPC
  || "https://rpc.sepolia.org";

export const getReadOnlyProvider = () => {
  return new JsonRpcProvider(PUBLIC_SEPOLIA_RPC);
};
```

### 7B. `lib/contracts.ts` — Add 4 new contract factories

```typescript
export const DISPUTE_RESOLUTION_ADDRESS = process.env.NEXT_PUBLIC_DISPUTE_RESOLUTION_ADDRESS || "0x00...";
export const SHARED_OWNERSHIP_ADDRESS   = process.env.NEXT_PUBLIC_SHARED_OWNERSHIP_ADDRESS   || "0x00...";
export const MARKETPLACE_ADDRESS         = process.env.NEXT_PUBLIC_MARKETPLACE_ADDRESS         || "0x00...";
export const GOVERNANCE_TOKEN_ADDRESS    = process.env.NEXT_PUBLIC_GOVERNANCE_TOKEN_ADDRESS    || "0x00...";

export const getDisputeResolutionContract = (s) => new Contract(DISPUTE_RESOLUTION_ADDRESS, DisputeResolutionABI, s);
export const getSharedOwnershipContract   = (s) => new Contract(SHARED_OWNERSHIP_ADDRESS, SharedOwnershipABI, s);
export const getMarketplaceContract       = (s) => new Contract(MARKETPLACE_ADDRESS, MarketplaceABI, s);
export const getGovernanceTokenContract   = (s) => new Contract(GOVERNANCE_TOKEN_ADDRESS, BeatTokenABI, s);
```

### 7C. Page & Component Changes

| File | Change |
|------|--------|
| `explore/page.tsx` | Use `getReadOnlyProvider()`; sort by `playCount` desc; add genre filter dropdown |
| `track/[id]/page.tsx` | Use `getReadOnlyProvider()`; show real `timestamp` as release date; wire Share to clipboard; wire Collect to `/marketplace` |
| `track/[id]/page.tsx` | **NEW: Tip Artist section** — preset buttons (0.001/0.005/0.01 ETH) + custom; calls `payment.tipTrack(trackId)` |
| `track/[id]/page.tsx` | Show co-owners panel if `sharedOwnership.hasShares(trackId)` |
| `track/[id]/page.tsx` | Show NFT badge + "Buy NFT" if track has active marketplace listing |
| `dashboard/page.tsx` | Add 3 tabs: **Upload** (existing), **Co-Owners** (set share %), **Mint NFT** (mint + list) |
| `profile/page.tsx` | Fix earnings comparison using BigInt; fetch real NFT count; add tip vs stream breakdown |
| `Navbar.tsx` | Add `accountsChanged` + `chainChanged` listeners; add Marketplace nav link |
| `AudioPlayerContext.tsx` | Add `audioRef` to `useMemo` deps |
| `AudioPlayer.tsx` | Fix `audio.src` empty check |
| `TrackCard.tsx` | Add quick-tip button (coin icon, 0.001 ETH, calls `tipTrack`) |

### 7D. New Pages

| Route | Description |
|-------|-------------|
| `/marketplace` | Grid of all active NFT listings; filter by price/genre; Buy button |
| `/marketplace/[tokenId]` | Single listing detail: NFT image, seller, price, royalty info, Buy Now |
| `/dispute` | List all open + resolved disputes |
| `/dispute/new` | Form: track ID, evidence IPFS CID, staking 0.01 ETH, submit |
| `/dispute/[id]` | Detail: both evidence CIDs, vote tally bar, countdown, Vote button (requires BEAT tokens) |

### 7E. New Components

| Component | Description |
|-----------|-------------|
| `NFTCard.tsx` | NFT listing card with image, price, seller |
| `DisputeCard.tsx` | Dispute summary card with status badge, track info, deadline |
| `TipModal.tsx` | Modal with preset amounts + custom ETH input + confirm |
| `SharesPanel.tsx` | Shows co-owner list with % bars |
| `VotePanel.tsx` | Dispute vote UI with BEAT balance display |

---

## Part 8 — New Test Files

| File | Tests |
|------|-------|
| `test/BeatToken.ts` | Minting, delegation, vote weight |
| `test/DisputeResolution.ts` | Open dispute, evidence, vote, resolve (win + lose), stake return |
| `test/SharedOwnership.ts` | Set shares, distribute revenue, clear shares |
| `test/MusicMarketplace.ts` | List, buy, cancel, update price, platform fee |

---

## Part 9 — Deploy Script Updates

`blockchain/scripts/deploy.ts` must deploy all 7 contracts and print all addresses:

```
✅ MusicRegistry:        0x...
✅ Payment:              0x...
✅ MusicNFT:             0x...
✅ BeatToken:            0x...
✅ DisputeResolution:    0x...
✅ SharedOwnership:      0x...
✅ MusicMarketplace:     0x...

Post-deploy wiring done:
  registry.setDisputeResolver(disputeResolutionAddress)
  payment.setSharedOwnership(sharedOwnershipAddress)
```

---

## Execution Order

1. Bug fixes (smart contracts)
2. `BeatToken.sol`
3. `DisputeResolution.sol`
4. `SharedOwnership.sol`
5. `MusicMarketplace.sol`
6. Modify `MusicRegistry.sol`, `Payment.sol`, `MusicNFT.sol`
7. Write all test files
8. Update `deploy.ts`
9. Update `blockchain/.env.example` and `frontend/.env.example`
10. Frontend bug fixes (`web3.ts`, `AudioPlayerContext`, `Navbar`, etc.)
11. Frontend new features (dashboard tabs, tip modal, marketplace pages, dispute pages)
12. Add new ABIs to `frontend/src/lib/abis/`
13. Update `lib/contracts.ts`

## Platform Overview (Current State)

**What works today:**
- `MusicRegistry.sol` — On-chain track catalog (upload, play-count, fetch)
- `Payment.sol` — Stream micropayments + artist tips (accumulate & withdraw) with reentrancy guard
- `MusicNFT.sol` — ERC-721 collectibles with ERC-2981 royalties, linked to registry tracks
- Next.js frontend with 5 pages: Home, Explore, Track Detail, Artist Dashboard, Profile
- IPFS (via Pinata) for audio + cover art storage
- MetaMask / ethers v6 wallet integration (Sepolia testnet)
- Persistent `AudioPlayer` component with multi-gateway IPFS fallback
- Stream-payment gating (0.0001 ETH per play)

---

## 🐛 Bugs & Errors — Existing Codebase

### Smart Contract Bugs

| # | File | Issue | Severity |
|---|------|-------|----------|
| SC-1 | `MusicRegistry.sol:101` | `TrackUploaded` event emits `genre` in wrong parameter slot — `artistName` is missing from event | Medium |
| SC-2 | `MusicRegistry.sol` | No access control on `incrementPlayCount` — anyone can spam free play-count inflation with no cost | Medium |
| SC-3 | `MusicNFT.sol:129` | `burn()` uses wrong error: throws `TokenNotFound` when the real issue is caller is not the owner (should be `NotOwner` or `Unauthorized`) | Low |
| SC-4 | `MusicNFT.sol` | No marketplace logic at all despite NFT existing — there is no `listForSale`, `buy`, or price mechanism despite the frontend hinting at it ("Exclusive NFTs") | High |
| SC-5 | `Payment.sol` | `tipArtist` does NOT validate that `artist` is a real registered artist — any arbitrary address can receive tips (no registry cross-check) | Medium |
| SC-6 | `MusicRegistry.sol` | No `genre` validation — empty genre is silently accepted (`genre` is not checked with `EmptyField`) | Low |
| SC-7 | `Counter.sol` | Unused stub contract left in `contracts/` — causes unnecessary compilation noise | Low |

### Frontend Bugs

| # | File | Issue | Severity |
|---|------|-------|----------|
| FE-1 | `explore/page.tsx:25` | `getWeb3Provider()` is called to just READ data — forces MetaMask popup even for non-wallet browsing. Should use a public JSON-RPC `JsonRpcProvider` for read-only calls | High |
| FE-2 | `track/[id]/page.tsx:25` | Same issue — `getWeb3Provider()` used for a read-only fetch, forces wallet prompt | High |
| FE-3 | `AudioPlayerContext.tsx:26` | `audioRef` is NOT in the `useMemo` dependency array → stale closure risk | Medium |
| FE-4 | `AudioPlayer.tsx:66` | `audio.src !== window.location.href` is a fragile check for empty src — should check `activeSrc` length | Low |
| FE-5 | `profile/page.tsx:87` | `parseFloat(earnings) === 0` comparison is unsafe with floating point; earnings can be `"0.000000001"` — should compare `BigInt` or use `ethers.parseEther` | Medium |
| FE-6 | `track/[id]/page.tsx:138-140` | Duration, Release Date, and Format are hardcoded placeholder values (`"3:45"`, `"April 2026"`, `"MP3 / IPFS"`) — not pulled from actual data | Medium |
| FE-7 | `track/[id]/page.tsx:127-134` | "Collect" and "Share" buttons are non-functional UI stubs — clicking does nothing | Medium |
| FE-8 | `TrackCard.tsx:40` | "Heart" (favourite) button is a non-functional stub | Low |
| FE-9 | `profile/page.tsx:249` | "Collection Size" is hardcoded `"0 NFTs"` — not fetched from `MusicNFT` contract | Low |
| FE-10 | `Navbar.tsx` | No wallet account-change listener (`accountsChanged` event) — UI stays stale if user switches MetaMask account | Medium |
| FE-11 | `ipfs.ts:15` | Pinata JWT is exposed client-side via `NEXT_PUBLIC_PINATA_JWT` — anyone can inspect the network tab and steal the API key | High |
| FE-12 | `explore/page.tsx:53` | Tracks sorted by `.reverse()` (newest-first) but labeled "Trending" — no actual play-count sort; label is misleading | Low |
| FE-13 | `dashboard/page.tsx` | No wallet connection check before upload — the form allows input without a connected wallet; only errors at submit time | Low |

---

## 🆕 New Features — Implementation Plan

### Feature 1: Dispute Resolution System

**Concept:** When two artists claim ownership of the same track, either party (or a moderator) can open a dispute. Both sides submit evidence (IPFS hashes). A DAO vote among token-weighted holders (or simple admin arbitration initially) resolves it on-chain.

#### Smart Contract — `DisputeResolution.sol` [NEW]

```
Structs:
  Dispute { id, trackId, claimant, respondent, evidenceCIDClaimant, evidenceCIDRespondent,
            votesFor, votesAgainst, deadline, status (Open/Resolved/Rejected), resolution }

State:
  mapping(uint256 => Dispute) disputes
  mapping(uint256 => mapping(address => bool)) hasVoted
  uint256 public disputeCount
  uint256 public constant VOTING_PERIOD = 3 days
  MusicRegistry public registry

Functions:
  openDispute(trackId, evidenceCID) → disputeId
    - Anyone (usually rival claimant) can open; stores claimant as msg.sender
  submitRespondentEvidence(disputeId, evidenceCID)
    - Only the track's current artist (from registry) can respond
  castVote(disputeId, bool support)
    - Any address can vote once during the voting window
  resolveDispute(disputeId)
    - Callable after deadline; if votesFor > votesAgainst → transfers track ownership
    - Requires `MusicRegistry` to expose a `transferTrackOwnership(trackId, newOwner)` function

Events: DisputeOpened, EvidenceSubmitted, VoteCast, DisputeResolved
```

**Changes to `MusicRegistry.sol`:**
- Add `transferTrackOwnership(uint256 trackId, address newOwner) external` restricted to an authorized `disputeResolver` address
- Add `setDisputeResolver(address resolver) external` (owner-only)
- Update `_artistTracks` mapping when ownership transfers

#### Frontend — New Pages & Components

- **`/dispute`** page — List all open disputes, browse by track
- **`/dispute/[id]`** page — Detail view: evidence, vote tally, vote button, countdown timer
- **`/dispute/new`** page — Form: select track ID, paste evidence IPFS CID, submit
- **`DisputeCard`** component

---

### Feature 2: Shared Ownership (Shareholder Model)

**Concept:** A track can have multiple owners with defined percentage splits. When payment comes in, it's automatically distributed pro-rata on-chain.

#### Smart Contract — `SharedOwnership.sol` [NEW]

```
Structs:
  ShareConfig { address[] shareholders; uint256[] basisPoints; } // must sum to 10000

State:
  mapping(uint256 => ShareConfig) trackShares  // trackId => share config
  MusicRegistry public registry
  Payment public payment

Functions:
  setShares(trackId, shareholders[], basisPoints[])
    - Only track owner can call; validates sum == 10000, no zero addresses
  distributeRevenue(trackId) external payable
    - Sends msg.value split proportionally to each shareholder (direct transfer)
    - Emits RevenueDistributed event
  getShares(trackId) → (shareholders[], basisPoints[])

Events: SharesConfigured, RevenueDistributed
```

**Changes to `Payment.sol`:**
- Add `SharedOwnership public sharedOwnership` (optional address reference)
- Modify `streamPayment` to check if a SharedOwnership config exists; if so, call `sharedOwnership.distributeRevenue{value: msg.value}(trackId)` instead of crediting one artist

**Changes to `MusicRegistry.sol`:**
- No structural changes needed; SharedOwnership reads `registry.getTrack(trackId).artist` to verify caller

#### Frontend — Changes

- **`/dashboard`** page — Add "Co-ownership" tab section:
  - Input: list of wallet addresses + percentage sliders (must sum to 100%)
  - Button: "Set Shares" → calls `SharedOwnership.setShares()`
- **`/track/[id]`** page — Show shareholders list with percentages if configured
- **`/profile`** page — Show earnings from shared tracks separately

---

### Feature 3: NFT Marketplace Integration

**Concept:** Artists can list their NFTs for sale with a price. Buyers browse and purchase with ETH. The ERC-2981 royalty standard ensures the original creator gets a cut on secondary sales.

#### Smart Contract — `MusicMarketplace.sol` [NEW]

```
Structs:
  Listing { tokenId, seller, price, active }

State:
  mapping(uint256 => Listing) listings  // tokenId => Listing
  MusicNFT public musicNFT
  uint256 public platformFeeBps = 250   // 2.5% platform cut

Functions:
  listNFT(tokenId, priceWei)
    - Caller must be owner; contract must be approved as operator
    - Stores listing; emits NFTListed
  cancelListing(tokenId)
    - Only seller can cancel; emits NFTDelisted
  buyNFT(tokenId) external payable nonReentrant
    - Validates price; deducts platform fee; checks ERC-2981 royalty;
      pays royalty receiver; pays remaining to seller; transfers NFT
    - Emits NFTSold
  updatePrice(tokenId, newPrice)
    - Only seller; emits PriceUpdated
  getListing(tokenId) → Listing
  getActiveListings() → tokenId[]   // returns up to 100 active listings

Events: NFTListed, NFTDelisted, NFTSold, PriceUpdated
Errors: NotOwner, AlreadyListed, NotListed, PriceMismatch, InsufficientPayment
```

#### Frontend — New Pages & Components

- **`/marketplace`** page — Grid of all listed NFTs; filter by genre/price; "Buy" button
- **`NFTCard`** component — Show NFT image, price, seller, royalty %
- **`/dashboard`** — Add "Mint NFT" tab:
  - Select track from user's library, input royalty %, click mint
  - Then optionally "List for Sale" with price input
- **`/track/[id]`** — Show NFT badge if the track has been minted; show "Buy NFT" if listed
- **`/profile`** — Replace hardcoded `"0 NFTs"` with real count from `MusicNFT.totalMinted()` filtered by owner

---

### Feature 4: Tipping System (Enhanced)

The tipping function already exists in `Payment.sol`, but it has **zero UI integration** — no button anywhere on the frontend lets a fan tip an artist. This feature adds proper UI and UX.

#### Smart Contract — No new contract needed
Minor enhancement to `Payment.sol`:
- Add `tipTrack(uint256 trackId) external payable` — tips the artist of a specific track (cleaner UX for track-specific tips; re-uses `trackId` context rather than requiring the user to know the artist address)
- Add `TipTrackReceived(fan, trackId, artist, amount)` event

#### Frontend — Changes

- **`/track/[id]`** page — Add a prominent **"Tip Artist"** section:
  - Preset ETH amounts: 0.001, 0.005, 0.01 ETH + custom input
  - Calls `payment.tipTrack(trackId, {value: amount})`
  - Shows success toast with tx hash link to Etherscan
- **`TrackCard`** component — Add small tip button (coin icon) with quick 0.001 ETH tip
- **`/explore`** page — Show total tips received per track (from `trackEarnings` mapping)
- **`/profile`** page — Distinguish tips from stream payments in earnings breakdown

---

## 📁 Proposed Changes Summary

### Smart Contract Changes

| File | Action | Description |
|------|--------|-------------|
| `MusicRegistry.sol` | MODIFY | Fix `TrackUploaded` event arg order; add genre validation; add `transferTrackOwnership`; add `setDisputeResolver` |
| `Payment.sol` | MODIFY | Add `tipTrack(trackId)` function; add `SharedOwnership` reference; fix potential floating-point comparison issues |
| `MusicNFT.sol` | MODIFY | Fix `burn()` error name; no other structural changes needed |
| `Counter.sol` | DELETE | Remove unused stub |
| `DisputeResolution.sol` | NEW | Full dispute lifecycle contract |
| `SharedOwnership.sol` | NEW | Shareholder model with revenue distribution |
| `MusicMarketplace.sol` | NEW | NFT listing, buying, and royalty-aware secondary sales |

### Frontend Changes

| File/Area | Action | Description |
|-----------|--------|-------------|
| `lib/web3.ts` | MODIFY | Add `getReadOnlyProvider()` using public Sepolia RPC for read-only calls |
| `lib/contracts.ts` | MODIFY | Add factory functions for 3 new contracts; add `DISPUTE_ADDRESS`, `SHARED_OWNERSHIP_ADDRESS`, `MARKETPLACE_ADDRESS` env vars |
| `lib/ipfs.ts` | MODIFY | Move Pinata upload to a Next.js API route (`/api/upload`) to protect JWT server-side |
| `explore/page.tsx` | MODIFY | Switch to `getReadOnlyProvider()`; fix sort label; add genre filter |
| `track/[id]/page.tsx` | MODIFY | Switch to `getReadOnlyProvider()`; add real duration display; wire "Collect" to marketplace; add Tip Artist UI section |
| `dashboard/page.tsx` | MODIFY | Add tabs: Upload / Co-Owners / Mint NFT / My Listings |
| `profile/page.tsx` | MODIFY | Fix `earnings` comparison; fetch real NFT count; add earnings breakdown |
| `Navbar.tsx` | MODIFY | Add `accountsChanged` listener for live wallet switching |
| `AudioPlayerContext.tsx` | MODIFY | Fix `audioRef` missing from memo deps |
| `components/TrackCard.tsx` | MODIFY | Add quick-tip button |
| `app/marketplace/page.tsx` | NEW | NFT marketplace browse page |
| `app/marketplace/[id]/page.tsx` | NEW | Single NFT listing detail + buy |
| `app/dispute/page.tsx` | NEW | Dispute list page |
| `app/dispute/new/page.tsx` | NEW | Open new dispute form |
| `app/dispute/[id]/page.tsx` | NEW | Dispute detail + vote |
| `app/api/upload/route.ts` | NEW | Server-side Pinata upload proxy (protects JWT) |
| `components/NFTCard.tsx` | NEW | NFT listing card component |
| `components/DisputeCard.tsx` | NEW | Dispute status card component |
| `components/TipModal.tsx` | NEW | Tip amount selector modal |
| `types/track.ts` | MODIFY | Add optional `shareholders`, `listingPrice`, `isNFTMinted` fields |
| `lib/abis/` | ADD | JSON ABIs for 3 new contracts |

---

## Verification Plan

### Automated Tests (Blockchain)
- New test files: `DisputeResolution.ts`, `SharedOwnership.ts`, `MusicMarketplace.ts`
- Run: `npx hardhat test` from the `blockchain/` directory

### Manual Verification (Frontend)
1. Connect MetaMask on Sepolia
2. Browse Explore without wallet prompt (read-only provider fix)
3. Upload a track → verify IPFS + blockchain registration
4. Play a track → confirm stream payment modal
5. Tip an artist → verify ETH transfer + event on Etherscan
6. Mint NFT → verify in wallet + on marketplace
7. List NFT → buy from second account → verify royalty distribution
8. Open a dispute → submit evidence → vote → resolve
9. Set co-owners on a track → make stream payment → verify split in both wallets

---

## Open Questions

> [!IMPORTANT]
> **Q1: Dispute voting mechanism** — Should votes be token-weighted (requires a governance/DAO token), or simple 1-address-1-vote with a whitelist? Token-weighted is more decentralized but adds significant complexity (new token contract). Simple voting is faster to build.

> [!IMPORTANT]
> **Q2: Marketplace royalty payment** — ERC-2981 provides the royalty *info* but enforcement is voluntary. Should `MusicMarketplace.sol` hard-enforce royalty payment (deduct from sale proceeds), or follow the standard as a best practice only?

> [!IMPORTANT]
> **Q3: Co-ownership dispute** — If a track has co-owners via `SharedOwnership`, and a dispute transfers ownership to a new address, should the shared config be cleared? This edge case needs a policy decision.

> [!WARNING]
> **Q4: Pinata API key protection** — Implementing the `/api/upload` proxy route requires the Pinata JWT to be set as a **server-side** environment variable (`PINATA_JWT`, not `NEXT_PUBLIC_PINATA_JWT`). This is a breaking change for the current `.env.example`. Confirm you're okay with this security improvement.

> [!NOTE]
> **Q5: Network** — All new contracts will be deployed to Sepolia testnet (same as existing). Should deployment scripts also target a local Hardhat node for faster development iterations?
