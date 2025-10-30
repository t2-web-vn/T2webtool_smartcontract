#!/usr/bin/env node
/*
    scripts/manage-role.js

    Usage:
        npx hardhat run scripts/manage-role.js --network <network> -- <contractAddress> <action> <role> <account>
        
        action: 'grant' or 'revoke'
        role: role name (DEFAULT_ADMIN_ROLE, MINTER_ROLE, PAUSER_ROLE, etc.) or bytes32 hash
        account: address to grant/revoke role to/from

    Alternative with environment variables:
        CONTRACT_ADDRESS=<address> ACTION=<grant|revoke> ROLE=<role> ACCOUNT=<address> npx hardhat run scripts/manage-role.js --network <network>

    Optional environment variables:
        MAX_PRIORITY_FEE_GWEI - e.g. 25
        MAX_FEE_GWEI - e.g. 50

    This script will:
        - attach to an AccessControl contract at the provided address
        - call grantRole(role, account) or revokeRole(role, account)
        - print role status before and after
        - optionally loop to perform multiple role operations
*/

const hre = require("hardhat");
const readline = require('readline');

// Common role names mapped to their bytes32 hashes
const COMMON_ROLES = {
    'DEFAULT_ADMIN_ROLE': '0x0000000000000000000000000000000000000000000000000000000000000000',
    'MINTER_ROLE': hre.ethers.utils.keccak256(hre.ethers.utils.toUtf8Bytes('MINTER_ROLE')),
    'PAUSER_ROLE': hre.ethers.utils.keccak256(hre.ethers.utils.toUtf8Bytes('PAUSER_ROLE')),
    'BURNER_ROLE': hre.ethers.utils.keccak256(hre.ethers.utils.toUtf8Bytes('BURNER_ROLE')),
    'UPGRADER_ROLE': hre.ethers.utils.keccak256(hre.ethers.utils.toUtf8Bytes('UPGRADER_ROLE')),
};

function getRoleHash(roleInput) {
    // If it's already a bytes32 hash (0x...), return it
    if (roleInput.startsWith('0x') && roleInput.length === 66) {
        return roleInput;
    }
    
    // Check if it's a common role name
    const upperRole = roleInput.toUpperCase();
    if (COMMON_ROLES[upperRole]) {
        return COMMON_ROLES[upperRole];
    }
    
    // Otherwise, hash it as a custom role
    return hre.ethers.utils.keccak256(hre.ethers.utils.toUtf8Bytes(roleInput));
}

async function performRoleManagement(contractAddress, action, role, account, signer) {
    // Convert role to bytes32 hash
    const roleHash = getRoleHash(role);
    console.log(`Role hash: ${roleHash}`);

    // Minimal AccessControl ABI
    const AccessControlABI = [
        "function hasRole(bytes32 role, address account) view returns (bool)",
        "function grantRole(bytes32 role, address account)",
        "function revokeRole(bytes32 role, address account)",
        "function getRoleAdmin(bytes32 role) view returns (bytes32)",
        "event RoleGranted(bytes32 indexed role, address indexed account, address indexed sender)",
        "event RoleRevoked(bytes32 indexed role, address indexed account, address indexed sender)"
    ];

    const contract = new hre.ethers.Contract(contractAddress, AccessControlABI, signer);

    // Check current role status
    const hasRoleBefore = await contract.hasRole(roleHash, account);
    console.log(`Account ${account} has role before: ${hasRoleBefore}`);

    // Determine action
    const isGrant = action.toLowerCase() === 'grant';
    
    if (isGrant && hasRoleBefore) {
        console.log("Account already has this role — nothing to do.");
        return;
    }
    
    if (!isGrant && !hasRoleBefore) {
        console.log("Account does not have this role — nothing to revoke.");
        return;
    }

    // Ask for confirmation before sending the transaction
    const rlConfirm = readline.createInterface({ input: process.stdin, output: process.stdout });
    const confirm = await new Promise(resolve => {
        rlConfirm.question(`Proceed to ${action} role ${roleHash} ${isGrant ? 'to' : 'from'} ${account}? (y/N): `, ans => {
            rlConfirm.close();
            resolve(ans.trim().toLowerCase() === 'y');
        });
    });

    if (!confirm) {
        console.log('Aborted by user. No transaction was sent.');
        return;
    }

    // Build optional tx overrides for EIP-1559
    const txOverrides = {};
    if (process.env.MAX_PRIORITY_FEE_GWEI) {
        try {
            txOverrides.maxPriorityFeePerGas = hre.ethers.utils.parseUnits(process.env.MAX_PRIORITY_FEE_GWEI, "gwei");
            const maxFeeGwei = process.env.MAX_FEE_GWEI || String(Number(process.env.MAX_PRIORITY_FEE_GWEI) * 2);
            txOverrides.maxFeePerGas = hre.ethers.utils.parseUnits(maxFeeGwei, "gwei");
            console.log(`Using maxPriorityFeePerGas=${process.env.MAX_PRIORITY_FEE_GWEI} gwei, maxFeePerGas=${maxFeeGwei} gwei`);
        } catch (e) {
            console.warn("Failed to parse fee env vars, proceeding without overrides:", e.message);
        }
    }

    console.log(`Sending ${action}Role(${roleHash}, ${account}) to ${contractAddress} ...`);
    
    let tx;
    if (isGrant) {
        tx = await contract.grantRole(roleHash, account, txOverrides);
    } else {
        tx = await contract.revokeRole(roleHash, account, txOverrides);
    }
    
    console.log(`Sent tx: ${tx.hash}`);
    const receipt = await tx.wait();
    console.log(`Transaction mined in block ${receipt.blockNumber} (status ${receipt.status})`);

    const hasRoleAfter = await contract.hasRole(roleHash, account);
    console.log(`Account ${account} has role after: ${hasRoleAfter}`);
}

async function main() {
    // Accept positional args (after `--` when using `npx hardhat run`):
    const rawArgs = process.argv.slice(2);
    const posArgs = rawArgs.filter(a => !a.startsWith("--"));

    const [signer] = await hre.ethers.getSigners();
    console.log(`Using signer: ${signer.address}\n`);

    let continueLoop = true;

    while (continueLoop) {
        let contractAddress = posArgs[0] || process.env.CONTRACT_ADDRESS;
        let action = posArgs[1] || process.env.ACTION;
        let role = posArgs[2] || process.env.ROLE;
        let account = posArgs[3] || process.env.ACCOUNT;

        // If values weren't provided via args or env, prompt interactively
        if (!contractAddress || !action || !role || !account) {
            const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
            const question = (q) => new Promise(resolve => rl.question(q, ans => resolve(ans.trim())));

            while (!contractAddress) {
                const answer = await question('Enter contract address: ');
                if (answer) contractAddress = answer;
            }

            while (!action || !['grant', 'revoke'].includes(action.toLowerCase())) {
                const answer = await question('Enter action (grant/revoke): ');
                if (answer && ['grant', 'revoke'].includes(answer.toLowerCase())) {
                    action = answer.toLowerCase();
                }
            }

            console.log('\nCommon roles: DEFAULT_ADMIN_ROLE, MINTER_ROLE, PAUSER_ROLE, BURNER_ROLE, UPGRADER_ROLE');
            console.log('Or enter a custom role name (will be hashed) or bytes32 hash directly.\n');
            
            while (!role) {
                const answer = await question('Enter role: ');
                if (answer) role = answer;
            }

            while (!account) {
                const answer = await question('Enter account address: ');
                if (answer) account = answer;
            }

            rl.close();
        }

        // Validate inputs
        if (!contractAddress || !action || !role || !account) {
            console.error("Usage: npx hardhat run scripts/manage-role.js --network <network> -- <contractAddress> <action> <role> <account>");
            console.error("Or set CONTRACT_ADDRESS, ACTION, ROLE, and ACCOUNT env vars.");
            process.exit(1);
        }

        if (!['grant', 'revoke'].includes(action.toLowerCase())) {
            console.error("Action must be 'grant' or 'revoke'");
            process.exit(1);
        }

        // Perform the role management operation
        await performRoleManagement(contractAddress, action, role, account, signer);

        // Ask if user wants to perform another operation
        console.log('\n');
        const rlContinue = readline.createInterface({ input: process.stdin, output: process.stdout });
        const continueAnswer = await new Promise(resolve => {
            rlContinue.question('Do you want to grant/revoke another role? (y/N): ', ans => {
                rlContinue.close();
                resolve(ans.trim().toLowerCase() === 'y');
            });
        });

        if (!continueAnswer) {
            continueLoop = false;
            console.log('Exiting script.');
        } else {
            // Reset posArgs so prompts will be triggered for next iteration
            posArgs.length = 0;
            process.env.CONTRACT_ADDRESS = '';
            process.env.ACTION = '';
            process.env.ROLE = '';
            process.env.ACCOUNT = '';
            console.log('\n--- Starting new role operation ---\n');
        }
    }
}

main()
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error);
        process.exit(1);
    });
