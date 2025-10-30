# manage-role script

This document explains how to use `scripts/manage-role.js` to grant or revoke roles on AccessControl contracts (e.g., NFT contracts with role-based access).

## Purpose

The script manages roles on OpenZeppelin AccessControl-based contracts. It:
- connects with the first signer provided by Hardhat's configured network provider
- checks if the account already has (or doesn't have) the role before acting
- calls `grantRole(role, account)` or `revokeRole(role, account)`
- supports common role names (DEFAULT_ADMIN_ROLE, MINTER_ROLE, etc.) or custom role hashes
- supports optional EIP-1559 gas overrides via environment variables
- includes interactive prompts and a confirmation step before sending transactions

Use this carefully — role management affects contract permissions.

## Prerequisites

- Node.js (use a Hardhat-supported version)
- Hardhat installed (project already uses it)
- Your network configuration in `hardhat.config.js` with an account that has permission to grant/revoke roles (typically needs DEFAULT_ADMIN_ROLE or the role's admin)
- The contract must implement OpenZeppelin's AccessControl interface

## File

- `scripts/manage-role.js` — the script that performs role management

## Usage

There are multiple ways to run the script: with environment variables, with positional args, or interactively.

### 1) Recommended: environment variables

This avoids CLI/argument parsing issues.

Example (zsh):

```bash
MAX_PRIORITY_FEE_GWEI=25 MAX_FEE_GWEI=50 \
CONTRACT_ADDRESS=0x1aD21C2c41949a1585c7190E7c8a3e119b652904 \
ACTION=grant \
ROLE=MINTER_ROLE \
ACCOUNT=0xf9209B6F49BB9fD73422BA834f4cD444aE7ceacE \
npx hardhat run --network amoy scripts/manage-role.js
```

### 2) npx with positional args

```bash
npx hardhat run --network amoy scripts/manage-role.js -- 0xContractAddress grant MINTER_ROLE 0xAccountAddress
```

Arguments order: `<contractAddress> <action> <role> <account>`

### 3) Interactive mode (prompts for all inputs)

If you don't provide arguments or env vars, the script will prompt you:

```bash
npx hardhat run --network amoy scripts/manage-role.js
```

You'll be asked:
- Contract address
- Action (grant or revoke)
- Role (shows common role names, or you can enter custom)
- Account address
- Confirmation (y/N) before sending the transaction

## Supported roles

### Common roles (predefined)

The script recognizes these common role names:
- `DEFAULT_ADMIN_ROLE` (0x0000...0000)
- `MINTER_ROLE` (keccak256("MINTER_ROLE"))
- `PAUSER_ROLE` (keccak256("PAUSER_ROLE"))
- `BURNER_ROLE` (keccak256("BURNER_ROLE"))
- `UPGRADER_ROLE` (keccak256("UPGRADER_ROLE"))

### Custom roles

You can also:
- Enter a custom role name (e.g., `MY_CUSTOM_ROLE`) — the script will hash it using `keccak256(toUtf8Bytes(roleName))`
- Provide a bytes32 hash directly (must start with `0x` and be 66 characters long)

## What the script does

1. Reads the signer from Hardhat
2. Constructs a contract instance with AccessControl ABI
3. Converts the role input to a bytes32 hash
4. Checks if the account currently has the role
5. Skips if the role is already in the desired state (already granted or not held)
6. Prompts for confirmation
7. Calls `grantRole()` or `revokeRole()` with optional tx overrides
8. Waits for the tx to be mined and prints the role status after

## Safety & sanity checks

- The script checks the current role status and will skip if the action is redundant (e.g., granting a role the account already has).
- Ensure the signer has permission to grant/revoke the role (typically needs the role's admin role, often DEFAULT_ADMIN_ROLE).
- Double-check addresses and role names before confirming.

## Troubleshooting

- **Signer doesn't have permission**
  - Error: "AccessControl: account 0x... is missing role ..."
  - Solution: Ensure the signer has the admin role for the role you're trying to grant/revoke. Check with `getRoleAdmin(roleHash)`.

- **Provider error: "transaction gas price below minimum"**
  - Set `MAX_PRIORITY_FEE_GWEI` and `MAX_FEE_GWEI` environment variables. Example: `MAX_PRIORITY_FEE_GWEI=25 MAX_FEE_GWEI=50`.

- **Role name not recognized**
  - If you enter a custom role name, the script will hash it. Make sure the contract uses the same role name/hash.
  - You can also provide the bytes32 hash directly if you know it.

## Example successful run

Grant MINTER_ROLE:

```
Using signer: 0x75c0C766C7a4D0744544B4f8D37C8362f64219eC
Role hash: 0x9f2df0fed2c77648de5860a4cc508cd0818c85b8b8a1ab4ceeef8d981c8956a6
Account 0xf9209B6F49BB9fD73422BA834f4cD444aE7ceacE has role before: false
Proceed to grant role 0x9f2df0... to 0xf9209B6F49BB...? (y/N): y
Using maxPriorityFeePerGas=25 gwei, maxFeePerGas=50 gwei
Sending grantRole(0x9f2df0..., 0xf9209B6F49BB...) to 0x1aD21C2c4194...
Sent tx: 0xabc123...
Transaction mined in block 28381900 (status 1)
Account 0xf9209B6F49BB9fD73422BA834f4cD444aE7ceacE has role after: true
```

Revoke role:

```bash
npx hardhat run --network amoy scripts/manage-role.js -- 0xContractAddress revoke MINTER_ROLE 0xAccountAddress
```

## Optional improvements

- Add batch grant/revoke for multiple accounts
- Add a `--yes` flag to skip confirmation for automation
- Add role enumeration to list all accounts with a given role

If you'd like any of these features, let me know!
