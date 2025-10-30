#!/usr/bin/env node
/*
    scripts/transfer-proxy-admin-ownership.js

    Usage:
        npx hardhat run scripts/transfer-proxy-admin-ownership.js --network <network> -- <proxyAdminAddress> <newOwnerAddress>

    Alternative with environment variables:
        PROXY_ADMIN_ADDRESS=<address> NEW_OWNER_ADDRESS=<address> npx hardhat run scripts/transfer-proxy-admin-ownership.js --network <network>

    Optional environment variables:
        MAX_PRIORITY_FEE_GWEI - e.g. 25
        MAX_FEE_GWEI - e.g. 50

    This script will:
        - attach to an existing ProxyAdmin at the provided address
        - call transferOwnership(newOwnerAddress)
        - print current owner and owner after transfer
*/

const hre = require("hardhat");

async function main() {
    // Accept positional args (after `--` when using `npx hardhat run`):
    const rawArgs = process.argv.slice(2);
    // `npx hardhat run -- <args>` places args after a `--` token; find first non-flag arg
    const posArgs = rawArgs.filter(a => !a.startsWith("--"));

    const proxyAdminAddress = posArgs[0] || process.env.PROXY_ADMIN_ADDRESS;
    const newOwnerAddress = posArgs[1] || process.env.NEW_OWNER_ADDRESS;

    if (!proxyAdminAddress || !newOwnerAddress) {
        console.error("Usage: npx hardhat run scripts/transfer-proxy-admin-ownership.js --network <network> -- <proxyAdminAddress> <newOwnerAddress>");
        console.error("Or set PROXY_ADMIN_ADDRESS and NEW_OWNER_ADDRESS env vars.");
        process.exit(1);
    }

    const [signer] = await hre.ethers.getSigners();
    console.log(`Using signer: ${signer.address}`);

    // Construct contract instance using the ABI and the ethers.Contract constructor
    // This mirrors usage like: new hre.ethers.Contract(address, ABI, signer)
    const proxyAdmin = new hre.ethers.Contract(proxyAdminAddress, [
        {
            "anonymous": false,
            "inputs": [
                {
                    "indexed": true,
                    "internalType": "address",
                    "name": "previousOwner",
                    "type": "address"
                },
                {
                    "indexed": true,
                    "internalType": "address",
                    "name": "newOwner",
                    "type": "address"
                }
            ],
            "name": "OwnershipTransferred",
            "type": "event"
        },
        {
            "inputs": [
                {
                    "internalType": "contract TransparentUpgradeableProxy",
                    "name": "proxy",
                    "type": "address"
                },
                {
                    "internalType": "address",
                    "name": "newAdmin",
                    "type": "address"
                }
            ],
            "name": "changeProxyAdmin",
            "outputs": [],
            "stateMutability": "nonpayable",
            "type": "function"
        },
        {
            "inputs": [
                {
                    "internalType": "contract TransparentUpgradeableProxy",
                    "name": "proxy",
                    "type": "address"
                }
            ],
            "name": "getProxyAdmin",
            "outputs": [
                {
                    "internalType": "address",
                    "name": "",
                    "type": "address"
                }
            ],
            "stateMutability": "view",
            "type": "function"
        },
        {
            "inputs": [
                {
                    "internalType": "contract TransparentUpgradeableProxy",
                    "name": "proxy",
                    "type": "address"
                }
            ],
            "name": "getProxyImplementation",
            "outputs": [
                {
                    "internalType": "address",
                    "name": "",
                    "type": "address"
                }
            ],
            "stateMutability": "view",
            "type": "function"
        },
        {
            "inputs": [
                {
                    "internalType": "address",
                    "name": "proxy",
                    "type": "address"
                }
            ],
            "name": "isAdminOf",
            "outputs": [
                {
                    "internalType": "bool",
                    "name": "",
                    "type": "bool"
                }
            ],
            "stateMutability": "view",
            "type": "function"
        },
        {
            "inputs": [],
            "name": "owner",
            "outputs": [
                {
                    "internalType": "address",
                    "name": "",
                    "type": "address"
                }
            ],
            "stateMutability": "view",
            "type": "function"
        },
        {
            "inputs": [],
            "name": "renounceOwnership",
            "outputs": [],
            "stateMutability": "nonpayable",
            "type": "function"
        },
        {
            "inputs": [
                {
                    "internalType": "address",
                    "name": "newOwner",
                    "type": "address"
                }
            ],
            "name": "transferOwnership",
            "outputs": [],
            "stateMutability": "nonpayable",
            "type": "function"
        },
        {
            "inputs": [
                {
                    "internalType": "contract TransparentUpgradeableProxy",
                    "name": "proxy",
                    "type": "address"
                },
                {
                    "internalType": "address",
                    "name": "implementation",
                    "type": "address"
                }
            ],
            "name": "upgrade",
            "outputs": [],
            "stateMutability": "nonpayable",
            "type": "function"
        },
        {
            "inputs": [
                {
                    "internalType": "contract TransparentUpgradeableProxy",
                    "name": "proxy",
                    "type": "address"
                },
                {
                    "internalType": "address",
                    "name": "implementation",
                    "type": "address"
                },
                {
                    "internalType": "bytes",
                    "name": "data",
                    "type": "bytes"
                }
            ],
            "name": "upgradeAndCall",
            "outputs": [],
            "stateMutability": "payable",
            "type": "function"
        }
    ], signer);

    const currentOwner = await proxyAdmin.owner();
    console.log(`Current owner: ${currentOwner}`);

    if (currentOwner.toLowerCase() === newOwnerAddress.toLowerCase()) {
        console.log("New owner is the same as current owner — nothing to do.");
        return;
    }

    // Build optional tx overrides for EIP-1559
    const txOverrides = {};
    if (process.env.MAX_PRIORITY_FEE_GWEI) {
        try {
            txOverrides.maxPriorityFeePerGas = hre.ethers.utils.parseUnits(process.env.MAX_PRIORITY_FEE_GWEI, "gwei");
            // If MAX_FEE_GWEI not provided, set it to 2x priority fee by default
            const maxFeeGwei = process.env.MAX_FEE_GWEI || String(Number(process.env.MAX_PRIORITY_FEE_GWEI) * 2);
            txOverrides.maxFeePerGas = hre.ethers.utils.parseUnits(maxFeeGwei, "gwei");
            console.log(`Using maxPriorityFeePerGas=${process.env.MAX_PRIORITY_FEE_GWEI} gwei, maxFeePerGas=${maxFeeGwei} gwei`);
        } catch (e) {
            console.warn("Failed to parse fee env vars, proceeding without overrides:", e.message);
        }
    }

    console.log(`Sending transferOwnership(${newOwnerAddress}) to ${proxyAdminAddress} ...`);
    const tx = await proxyAdmin.transferOwnership(newOwnerAddress, txOverrides);
    console.log(`Sent tx: ${tx.hash}`);
    const receipt = await tx.wait();
    console.log(`Transaction mined in block ${receipt.blockNumber} (status ${receipt.status})`);

    const ownerAfter = await proxyAdmin.owner();
    console.log(`Owner after: ${ownerAfter}`);
}

main()
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error);
        process.exit(1);
    });
