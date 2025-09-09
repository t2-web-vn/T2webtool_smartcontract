const hre = require("hardhat");
const deployUtils = require("./deploy.utils");
const fs = require("fs");
const path = require("path");

// Function to parse CSV data
function parseCSV(csvContent) {
    const lines = csvContent.trim().split('\n');
    const recipients = [];
    const values = [];

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line || line.startsWith('#')) continue; // Skip empty lines and comments

        // Split by comma, but handle commas within quotes if needed
        const parts = line.split(',').map(part => part.trim());

        if (parts.length >= 2) {
            const address = parts[0];
            const value = parts[1];

            // Basic validation
            if (hre.ethers.utils.isAddress(address)) {
                recipients.push(address);
                values.push(value);
            } else {
                console.warn(`Skipping invalid address on line ${i + 1}: ${address}`);
            }
        } else {
            console.warn(`Skipping malformed line ${i + 1}: ${line}`);
        }
    }

    return { recipients, values };
}

async function main() {
    let envName = await deployUtils.promptChoices("Choose environment", [
        "local",
        "dev",
        "prod",
    ]);
    let networkName = hre.network.name;
    let suffixConfig = `${envName}`;
    let deployConfig = deployUtils.loadConfig(
        networkName,
        {
            Disperse: "",
        },
        suffixConfig
    );

    if (!deployConfig.Disperse) {
        console.error(`Disperse contract not deployed on ${networkName}-${suffixConfig}`);
        return;
    }

    console.log(`Using Disperse contract at: ${deployConfig.Disperse}`);

    // Get token address
    const tokenAddress = await deployUtils.prompt("Enter token address");

    // Choose input method
    const inputMethod = await deployUtils.promptChoices("Choose input method", [
        "CSV",
        "Manual"
    ]);

    let recipients, values;

    if (inputMethod === "CSV") {
        // Get CSV file path
        const csvPath = await deployUtils.prompt("Enter CSV file path (relative to project root)\nExpected format: address,value (one per line)");

        try {
            const fullPath = path.resolve(process.cwd(), csvPath);
            console.log(`Reading CSV file: ${fullPath}`);

            if (!fs.existsSync(fullPath)) {
                console.error(`CSV file not found: ${fullPath}`);
                console.log("Please ensure the file exists and the path is correct.");
                return;
            }

            const csvContent = fs.readFileSync(fullPath, 'utf8');
            const parsed = parseCSV(csvContent);
            recipients = parsed.recipients;
            values = parsed.values;

            console.log(`Parsed ${recipients.length} recipients from CSV file`);

            // Show first few entries as preview
            if (recipients.length > 0) {
                console.log("Preview of first 3 entries:");
                for (let i = 0; i < Math.min(3, recipients.length); i++) {
                    console.log(`  ${recipients[i]} -> ${values[i]}`);
                }
                if (recipients.length > 3) {
                    console.log(`  ... and ${recipients.length - 3} more entries`);
                }
            }

        } catch (error) {
            console.error(`Error reading CSV file: ${error.message}`);
            return;
        }
    } else {
        // Manual input
        const recipientsInput = await deployUtils.prompt("Enter recipient addresses (comma-separated)");
        const valuesInput = await deployUtils.prompt("Enter values (comma-separated, in token units)");

        recipients = recipientsInput.split(',').map(addr => addr.trim());
        values = valuesInput.split(',').map(val => val.trim());
    }

    if (recipients.length !== values.length) {
        console.error("Number of recipients must match number of values");
        return;
    }

    if (recipients.length === 0) {
        console.error("No valid recipients found");
        return;
    }

    // Get signer
    const [signer] = await hre.ethers.getSigners();
    console.log(`Executing from: ${signer.address}`);

    // Get token contract using standard ERC20 ABI
    const ERC20_ABI = [
        "function balanceOf(address owner) view returns (uint256)",
        "function transfer(address to, uint256 amount) returns (bool)",
        "function transferFrom(address from, address to, uint256 amount) returns (bool)",
        "function approve(address spender, uint256 amount) returns (bool)",
        "function allowance(address owner, address spender) view returns (uint256)",
        "function decimals() view returns (uint8)",
        "function symbol() view returns (string)",
        "function name() view returns (string)",
        "function totalSupply() view returns (uint256)"
    ];

    const tokenContract = new hre.ethers.Contract(tokenAddress, ERC20_ABI, signer);    // Get token decimals
    const decimals = await tokenContract.decimals();
    console.log(`Token decimals: ${decimals}`);

    // Convert values to BigNumber using correct decimals
    const parsedValues = values.map(val => hre.ethers.utils.parseUnits(val, decimals));

    // Calculate total amount
    const totalAmount = parsedValues.reduce((sum, val) => sum.add(val), hre.ethers.BigNumber.from(0));
    console.log(`Total amount to disperse: ${hre.ethers.utils.formatUnits(totalAmount, decimals)}`);

    // Check balance
    const balance = await tokenContract.balanceOf(signer.address);
    console.log(`Your token balance: ${hre.ethers.utils.formatUnits(balance, decimals)}`);

    if (balance.lt(totalAmount)) {
        console.error("Insufficient token balance");
        return;
    }

    // Get Disperse contract
    const disperseContract = await hre.ethers.getContractAt("Disperse", deployConfig.Disperse, signer);

    // Check current allowance
    const currentAllowance = await tokenContract.allowance(signer.address, deployConfig.Disperse);
    console.log(`Current allowance: ${currentAllowance.toString()}`);

    if (currentAllowance.lt(totalAmount)) {
        // Approve Disperse contract to spend tokens
        console.log("Approving tokens...");
        const approveTx = await tokenContract.approve(
            deployConfig.Disperse,
            totalAmount,
            {
                maxPriorityFeePerGas: hre.ethers.utils.parseUnits("25", "gwei"),
                maxFeePerGas: hre.ethers.utils.parseUnits("50", "gwei")
            }
        );
        await approveTx.wait();
        console.log("Approval successful");
    } else {
        console.log("Sufficient allowance already exists, skipping approval");
    }

    // Execute disperseToken
    console.log("Executing disperseToken...");
    const disperseTx = await disperseContract.disperseToken(tokenAddress, recipients, parsedValues);
    await disperseTx.wait();

    console.log("Disperse successful!");
    console.log(`Transaction hash: ${disperseTx.hash}`);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
