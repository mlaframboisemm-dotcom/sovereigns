# Sovereign Wealth Terminal

The official sovereign wealth platform and secure treasury operations ledger for institutional-grade asset management. Deployed and live at **[www.sovereigns.ca](http://www.sovereigns.ca)**.

Designed for maximum sovereign autonomy, this application combines self-custodial cryptographic key structures, live multi-chain blockchain execution, institutional exchange reconciliations (Coinbase Advanced/Prime & Kraken Spot APIs), real-time yield optimizer calculations, and highly-grounded Gemini intelligence networks.

---

## ✦ Core Architecture & Features

### 1. Multi-Chain Cryptographic Wallets & Real On-Chain Execution
*   **True Self-Custody**: Generates secure BIP-39 compatible client-side wallets. Private keys are encrypted using AES-GCM (256-bit) with user-defined master keys and salts, never hitting server-side memory in unencrypted form.
*   **Real EVM Broadcasting**: Real-time transaction broadcasting on EVM chains (**Ethereum**, **Polygon**, **Base**, and **BNB Chain**) utilizing highly-optimized, geo-redundant RPC endpoints with automated simulation fallbacks when funds or gas are insufficient.
*   **Live Fee Estimation**: Establishes live JSON-RPC connection loops to query network fee structures (`gasPrice` / standard base rates) dynamically depending on network conditions.

### 2. Live-Grounding Strategic Intelligence (Gemini AI v3)
*   **Real-Time Context Grounding**: Integrated with the advanced Google Gemini model suite utilizing **Google Search Grounding tools**. 
*   **Up-to-Date Intelligence**: Resolves queries with live external web context, ensuring macroeconomic inputs, blockchain state upgrades, and staking parameters are current, correct, and authoritative.

### 3. Institutional Exchange Integrations
*   **Coinbase Advanced/Prime**: Integrates custom, secure JWT token structures mapped directly to the official Coinbase v3 accounts and brokerage endpoints for instant order execution and asset verification.
*   **Kraken Spot**: Leverages a robust SHA-256 and HMAC-SHA-512 cryptographic request signature engine to interface directly with private Kraken ledger books and accounts.
*   **Sovereign Book Reconciliation**: Syncs on-chain balances with official corporate books in a real-time Merkle-Tree Proof of Reserves simulation or production key mapping.

### 4. Yield Living Strategy & RWA Optimizer
*   **Beacon Chain & Liquid Staking**: Tracks live ETH liquid staking returns (e.g., Swiss Kiln/Figment node configurations at 3.6% - 3.85% APY).
*   **RWA Tokenization Integration**: Allocates capital to real-world-asset instruments like BlackRock's BUIDL or Ondo USDY (delivering stable, audited 5.0% - 5.2% yield streams).
*   **Yield Living Feasibility Engine**: Dynamic calculator indicating feasibility, coverage levels, and automated yield sweep redirection to designated secure cold wallets.

---

## ✦ Getting Started (Local Development)

### Prerequisites
*   [Node.js](https://nodejs.org/) (v18 or higher recommended)
*   An active internet connection for RPC and live exchange synchronization

### Installation
1.  **Clone / Download the Repository** and extract the package.
2.  **Install dependencies**:
    ```bash
    npm install
    ```
3.  **Configure Environment Variables**:
    Create a local environment configuration file (e.g., `.env`) based on the `.env.example` in the root folder:
    ```env
    # Gemini API Key
    GEMINI_API_KEY="your_gemini_api_key_here"

    # Coinbase Institutional API (JWT compatible keypairs)
    COINBASE_API_KEY_ID=""
    COINBASE_API_SECRET_RAW=""

    # Kraken Spot API
    KRAKEN_API_KEY=""
    KRAKEN_API_SECRET_BASE64=""
    ```
4.  **Launch the development server**:
    ```bash
    npm run dev
    ```
5.  Open your browser and navigate to the application terminal at **`http://localhost:3000`**.

---

## ✦ Production Build & Deployment

To bundle the application and compile the custom full-stack backend server for container or server hosting:

```bash
# Build both the client-side SPA bundle and server distribution
npm run build

# Start the optimized production service
npm run start
```

*The production build automatically bundles the backend typescript code into `dist/server.cjs` via highly optimized `esbuild` configurations to guarantee blazing fast cold-start performance.*

---

<div align="center">
<strong>Sovereign Wealth Terminal</strong> &bull; Securing Autonomous Institutional Capital &bull; <a href="http://www.sovereigns.ca">www.sovereigns.ca</a>
</div>
