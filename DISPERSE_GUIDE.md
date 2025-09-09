# Disperse Script Usage Guide

This guide explains how to use the token dispersal script for distributing ERC20 tokens to multiple recipients.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Quick Start](#quick-start)
- [Available Commands](#available-commands)
- [Usage Examples](#usage-examples)
- [CSV File Format](#csv-file-format)
- [Configuration](#configuration)
- [Troubleshooting](#troubleshooting)

## Prerequisites

1. **Node.js and Yarn**: Make sure you have Node.js installed and use Yarn as package manager
2. **Environment Setup**: Configure your `.env` file with necessary private keys and API keys
3. **Network Configuration**: Ensure Hardhat networks are properly configured in `hardhat.config.js`
4. **Token Balance**: Ensure the signer account has sufficient token balance

## Quick Start

### Basic Usage
```bash
# Run disperse on Goerli testnet
yarn disperse --network goerli

# Or use pre-configured network scripts
yarn disperse:goerli
```

### What the script will ask:
1. **Environment**: Choose between `local`, `dev`, or `prod`
2. **Token Address**: Enter the ERC20 token contract address
3. **Input Method**: Choose between `CSV file` or `Manual input`
4. **Signer**: Enter private key or leave empty to use default account

## Available Commands

### Main Command
```bash
yarn disperse --network <network-name>
```

## Usage Examples

### Example 1: Manual Input (Small Distribution)

```bash
yarn disperse --network goerli
```

**Inputs:**
- Environment: `dev`
- Token Address: `0xA0b86a33E6441e88C5F2712C3E9b74F5c4e3e3e3`
- Input Method: `Manual input`
- Recipients: `0x742d35Cc6634C0532925a3b844Bc454e4438f44e,0x742d35Cc6634C0532925a3b844Bc454e4438f44f`
- Values: `100,200`
- Private Key: (leave empty for default account)

### Example 2: CSV File Input (Large Distribution)

```bash
yarn disperse --network mumbai
```

**Inputs:**
- Environment: `dev`
- Token Address: `0xB8c77482e45F1F44dE1745F52C74426C631bDD52`
- Input Method: `CSV file`
- CSV Path: `airdrop-recipients.csv`
- Private Key: `0x1234567890abcdef...`

### Example 3: Using Specific Private Key

```bash
yarn disperse --network bsc
```

**Inputs:**
- Environment: `prod`
- Token Address: `0x55d398326f99059fF775485246999027B3197955`
- Input Method: `Manual input`
- Recipients: `0x123...,0x456...,0x789...`
- Values: `50,75,25`
- Private Key: `0xabcdef1234567890...` (your specific private key)

## CSV File Format

### Basic Format
Create a CSV file with the following format:
```
address,value
0x742d35Cc6634C0532925a3b844Bc454e4438f44e,100
0x742d35Cc6634C0532925a3b844Bc454e4438f44f,200
0x742d35Cc6634C0532925a3b844Bc454e4438f44g,150
```

### Advanced Format with Comments
```
# This is a comment line
# Format: recipient_address,amount_in_token_units

0x742d35Cc6634C0532925a3b844Bc454e4438f44e,100
0x742d35Cc6634C0532925a3b844Bc454e4438f44f,200
# Another comment
0x742d35Cc6634C0532925a3b844Bc454e4438f44g,150
```

### Sample CSV File
A sample file `sample-disperse.csv` is provided in the project root:

```csv
0x742d35Cc6634C0532925a3b844Bc454e4438f44e,100
0x742d35Cc6634C0532925a3b844Bc454e4438f44f,200
0x742d35Cc6634C0532925a3b844Bc454e4438f44g,150
0x742d35Cc6634C0532925a3b844Bc454e4438f44h,75
```

### CSV Guidelines

1. **File Location**: Place CSV files in the project root or provide relative paths
2. **Address Validation**: Only valid Ethereum addresses will be processed
3. **Value Format**: Use token units (not wei). Decimals are handled automatically
4. **Comments**: Lines starting with `#` are ignored
5. **Empty Lines**: Automatically skipped
6. **Encoding**: Use UTF-8 encoding

## Configuration

### Network Configuration Files

The script loads Disperse contract addresses from network-specific config files:

- `networks/goerli-nft-dev.json`
- `networks/mumbai-dev.json`
- `networks/bsc-dev.json`
- etc.

Example config file structure:
```json
{
  "Disperse": "0x68f984fE9A69B1165c690a36aFc6D77EFe817837",
  "T2WebNFT": "",
  "T2WebMultiNFT": "",
  // ... other contracts
}
```

### Environment Variables

Make sure your `.env` file contains:
```env
PRIVATE_KEY=your_private_key_here
INFURA_API_KEY=your_infura_key
ALCHEMY_API_KEY=your_alchemy_key
```

## Troubleshooting

### Common Issues

#### 1. "Disperse contract not deployed"
**Error**: `Disperse contract not deployed on goerli-dev`

**Solution**:
- Check if the Disperse contract address is set in the network config file
- Deploy the Disperse contract first using deployment scripts
- Verify the network name matches the config file naming convention

#### 2. "Insufficient token balance"
**Error**: `Insufficient token balance`

**Solution**:
- Check the signer account balance for the token
- Ensure the private key corresponds to an account with sufficient tokens
- Verify token address is correct

#### 3. "Invalid address" in CSV
**Warning**: `Skipping invalid address on line X: invalid_address`

**Solution**:
- Verify Ethereum addresses are properly formatted (0x prefix, 40 hex characters)
- Check for typos in the CSV file
- Remove or fix invalid addresses

#### 4. "CSV file not found"
**Error**: `CSV file not found: path/to/file.csv`

**Solution**:
- Verify the file path is correct and relative to project root
- Ensure the file exists and has proper permissions
- Check for typos in the file path

#### 5. "Network not configured"
**Error**: Issues with network connection

**Solution**:
- Verify network configuration in `hardhat.config.js`
- Check RPC URLs and API keys
- Ensure network is accessible

### Debug Mode

For additional debugging information, you can:
1. Check the console output for detailed logs
2. Verify transaction hashes on block explorers
3. Check gas usage and transaction status

### Getting Help

If you encounter issues:
1. Check this guide for common solutions
2. Verify all prerequisites are met
3. Ensure network configurations are correct
4. Check token balances and approvals

## Advanced Usage

### Batch Processing
For very large distributions, consider:
- Splitting into multiple smaller CSV files
- Processing in batches to avoid gas limit issues
- Using optimized contract deployments

### Custom Networks
To add support for new networks:
1. Add network configuration to `hardhat.config.js`
2. Create network config file in `networks/` directory
3. Deploy Disperse contract to the new network
4. Add npm script in `package.json`

### Gas Optimization
- The script automatically calculates total amounts for approval
- Monitor gas prices for optimal transaction timing
- Consider using different gas strategies for different networks

---

**Note**: Always test on testnets before performing mainnet transactions. Double-check all addresses and amounts before confirming transactions.</content>
<parameter name="filePath">/Users/mac/Documents/projects/t2-web/smartcontract/DISPERSE_GUIDE.md
