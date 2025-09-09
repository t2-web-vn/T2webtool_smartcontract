# NFT Mint Script Usage Guide

This guide explains how to use the NFT minting script to mint tokens from T2WebNFT contracts.

## Available Commands

### Main Command
```bash
yarn mint-nft --network <network-name>
```

### Network-Specific Commands
```bash
yarn mint-nft:goerli     # Goerli testnet
yarn mint-nft:mumbai     # Polygon Mumbai testnet
yarn mint-nft:bsc        # Binance Smart Chain
yarn mint-nft:shibuya    # Astar Shibuya testnet
yarn mint-nft:sandverse  # Sandverse network
yarn mint-nft:defiverse  # Defiverse network
```

## Usage Examples

### Example 1: Mint on Goerli Testnet

```bash
yarn mint-nft --network goerli
```

**Inputs:**
- Environment: `dev`
- NFT Contract Type: `ERC721 (T2WebNFT)`
- Recipient Address: `0x742d35Cc6634C0532925a3b844Bc454e4438f44e`
- Token URI: `https://metadata.example.com/token/1`

### Example 2: Mint ERC4907 NFT

```bash
yarn mint-nft --network mumbai
```

**Inputs:**
- Environment: `dev`
- NFT Contract Type: `ERC4907 (T2WebERC4907NFT)`
- Recipient Address: `0x1234567890123456789012345678901234567890`
- Token URI: `ipfs://QmYourMetadataHash`

## Supported Contract Types

1. **ERC721 (T2WebNFT)** - Standard ERC721 NFT
2. **ERC1125 (T2WebMultiNFT)** - Multi-token NFT
3. **ERC4907 (T2WebERC4907NFT)** - Rental NFT with ERC4907 extension

## Configuration

The script loads NFT contract addresses from network-specific config files:

- `networks/goerli-nft-dev.json`
- `networks/mumbai-dev.json`
- `networks/bsc-dev.json`
- etc.

Example config structure:
```json
{
  "ERC721": "0x03FC902F8118C05b28398dBc809eE00e67c4fD4B",
  "ERC1125": "0x281363f891dcDdB0807D7B59948228446a105806",
  "ERC4907": "0x789998DEAb126fbAe7C38235B7eE50519C36695a"
}
```

## Requirements

- NFT contracts must be deployed first using `yarn deploy-nft --network <network>`
- Valid recipient address (checksummed Ethereum address)
- Token URI (can be HTTP URL, IPFS hash, etc.)
- Sufficient gas fees for the network

## Output

After successful minting, the script will display:
- Transaction hash
- Current token ID (if available)
- Success confirmation

## Troubleshooting

### Contract Not Deployed
**Error**: `T2WebNFT contract not deployed on goerli-nft-dev`

**Solution**: Deploy the NFT contracts first:
```bash
yarn deploy-nft --network goerli
```

### Invalid Address
**Error**: `Invalid recipient address`

**Solution**: Ensure the address is a valid Ethereum address with proper checksum

### Network Issues
**Error**: Network connection or gas fee issues

**Solution**: 
- Verify network configuration in `hardhat.config.js`
- Ensure sufficient funds for gas fees
- Check network status

---

**Note**: Make sure to deploy NFT contracts before attempting to mint tokens. Use appropriate testnets for testing before mainnet deployment.</content>
<parameter name="filePath">/Users/mac/Documents/projects/t2-web/smartcontract/MINT_NFT_GUIDE.md
