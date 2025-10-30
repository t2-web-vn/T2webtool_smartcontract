# transfer-proxy-admin-ownership script

This document explains how to use `scripts/transfer-proxy-admin-ownership.js` to call `transferOwnership` on a deployed `T2WebProxyAdmin` contract.

## Purpose

The script transfers ownership of a `T2WebProxyAdmin` contract to a new address. It:
- connects with the first signer provided by Hardhat's configured network provider
- checks the current owner and skips the transfer if the address is unchanged
- supports optional EIP-1559 gas overrides via environment variables

Use this carefully — ownership transfers are sensitive operations.

## Prerequisites

- Node.js (use a Hardhat-supported version; if you see a Hardhat warning about your Node.js version, switch with `nvm` to an LTS supported by your Hardhat version)
- Hardhat installed (project already uses it)
- Your network configuration in `hardhat.config.js` (private key/provider) with an account that can send transactions and pay gas
- The `T2WebProxyAdmin` contract compiled (artifact available under `artifacts/`)

## File

- `scripts/transfer-proxy-admin-ownership.js` — the script that performs the ownership transfer

## Usage

There are two recommended ways to run the script: with environment variables, or with positional args using `npx hardhat run`.

### 1) Recommended: environment variables

This avoids CLI/argument parsing issues when running via `yarn` or when package scripts forward args differently.

Example (zsh):

```bash
MAX_PRIORITY_FEE_GWEI=25 MAX_FEE_GWEI=50 \
PROXY_ADMIN_ADDRESS=0x1aD21C2c41949a1585c7190E7c8a3e119b652904 \
NEW_OWNER_ADDRESS=0xf9209B6F49BB9fD73422BA834f4cD444aE7ceacE \
npx hardhat run --network amoy scripts/transfer-proxy-admin-ownership.js
```

- `MAX_PRIORITY_FEE_GWEI` and `MAX_FEE_GWEI` are optional but recommended on networks that enforce a minimum priority fee. They are parsed as gwei.

### 2) npx with positional args (correct ordering)

When passing args on the command line, make sure you place `--` after the script so Hardhat won't treat your positional args as its own options:

```bash
npx hardhat run --network amoy scripts/transfer-proxy-admin-ownership.js -- 0xProxyAdminAddress 0xNewOwnerAddress
```

Note: if you're using `yarn` scripts, argument forwarding rules can change across Yarn versions; prefer env vars to avoid surprises.

### 3) Using yarn

If `package.json` has a script that runs the hardhat command, prefer environment variables:

```bash
MAX_PRIORITY_FEE_GWEI=25 MAX_FEE_GWEI=50 \
PROXY_ADMIN_ADDRESS=0x... NEW_OWNER_ADDRESS=0x... \
yarn transfer-proxy-admin-ownership
```

## What the script does

1. Reads the signer from Hardhat
2. Constructs a `hre.ethers.Contract` instance for `T2WebProxyAdmin` (ABI embedded in script)
3. Calls `owner()` and logs it
4. If the current owner differs from the requested `NEW_OWNER_ADDRESS`, it calls `transferOwnership(newOwner)` with optional tx overrides
5. Waits for the tx to be mined and prints the owner after transfer

## Safety & sanity checks

- The script checks whether the `newOwnerAddress` is the same as the current owner and will exit early if so.
- Ensure the signer you use is the current owner (or an account with the permission to call `transferOwnership`) otherwise the transaction will revert.
- Double-check addresses before running; consider copying the address to the clipboard and pasting it in.

## Troubleshooting

- Hardhat CLI errors (HH305 / HH308)
  - If you see `Error HH308: Unrecognized positional argument` or `HH305: Unrecognized param --`, it's usually due to how arguments were forwarded. Use env vars or run `npx hardhat run --network <network> <script> -- <args>` (note the `--`).

- Provider error: "transaction gas price below minimum: gas tip cap 0, minimum needed ..."
  - Some networks require a minimum priority fee. Set `MAX_PRIORITY_FEE_GWEI` (and optionally `MAX_FEE_GWEI`). Example: `MAX_PRIORITY_FEE_GWEI=25 MAX_FEE_GWEI=50`.

- Hardhat Node.js version warning
  - Hardhat may warn if you're using an unsupported Node.js version. It may still work, but switch to a recommended Node version using `nvm` if you see unexpected behaviour.

## Example successful run (for reference)

Output when successful:

```
Using signer: 0x75c0C766C7a4D0744544B4f8D37C8362f64219eC
Current owner: 0x75c0C766C7a4D0744544B4f8D37C8362f64219eC
Using maxPriorityFeePerGas=25 gwei, maxFeePerGas=50 gwei
Sending transferOwnership(0xf9209B6F49BB...) to 0x1aD21C2c4194...
Sent tx: 0x32b64d...8833c
Transaction mined in block 28381863 (status 1)
Owner after: 0xf9209B6F49BB9fD73422BA834f4cD444aE7ceacE
```

## Optional improvements

- Add interactive confirmation before sending txs (n/y prompt) to avoid accidental transfers.
- Move the ABI into a shared helper so multiple scripts can reuse it.
- Add a test that deploys a test `T2WebProxyAdmin` and asserts ownership transfer.

If you'd like, I can add an interactive confirmation prompt or a package.json wrapper script to make usage with `yarn` simpler.
