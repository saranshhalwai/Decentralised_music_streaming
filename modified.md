# Modified Tasks

## 1. Smart Contract Bug Fixes
- [x] SC-1: `MusicRegistry.sol` Fix `TrackUploaded` event param
- [x] SC-2: `MusicRegistry.sol` Add genre empty-check
- [x] SC-3: `MusicNFT.sol` Change `burn()` error

## 2. New Smart Contracts
- [x] Create `BeatToken.sol`
- [x] Create `DisputeResolution.sol`
- [x] Create `SharedOwnership.sol`
- [x] Create `MusicMarketplace.sol`

## 3. Modify Existing Smart Contracts
- [x] `MusicRegistry.sol` (dispute resolver, ownership transfer, genre validation, event order)
- [x] `Payment.sol` (tipTrack, SharedOwnership reference, streamPayment routing)
- [x] `MusicNFT.sol` (custom NotTokenOwner error in burn)

## 5. Updates & Configs
- [x] Update `deploy.ts`
- [x] Update `blockchain/.env.example` and `frontend/.env.example`
- [x] Update `lib/contracts.ts`

## 6. Frontend Bug Fixes
- [x] FE-1: `explore/page.tsx` Use `getReadOnlyProvider()`
- [x] FE-2: `track/[id]/page.tsx` Use `getReadOnlyProvider()`
- [x] FE-3: `AudioPlayerContext.tsx` Add `audioRef` to dependencies
- [x] FE-4: `AudioPlayer.tsx` Check `activeSrc.length > 0`
- [x] FE-5: `profile/page.tsx` Compare earnings properly
- [x] FE-6: `track/[id]/page.tsx` Fetch real release info
- [x] FE-7: `track/[id]/page.tsx` Wire Collect and Share buttons
- [x] FE-8: `Navbar.tsx` Add MetaMask event listeners
- [x] FE-9: `profile/page.tsx` Fetch real NFT count
- [x] FE-10: `explore/page.tsx` Sort by `playCount` descending

## 7. Frontend New Features
- [x] `track/[id]/page.tsx` Tip Artist section
- [x] `TrackCard.tsx` Add quick-tip button
- [x] Create `/marketplace` pages
- [x] Create `/dispute` pages
