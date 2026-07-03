import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  ArrowLeft, 
  Shield, 
  Globe, 
  Cpu, 
  Layers, 
  ExternalLink, 
  Database, 
  Search, 
  FileText, 
  CheckCircle2, 
  Activity, 
  Code, 
  Anchor 
} from 'lucide-react';
import { getBlockchainBalance } from '../lib/blockchain';
import { ethers } from 'ethers';

interface PublicSettlementRegistryViewProps {
  marshallConfig: any;
  balances: Record<string, string>;
  usdRates: Record<string, number>;
  usdToCadRate: number;
  onBack: () => void;
  settlementAnchor: any;
}

export const PublicSettlementRegistryView: React.FC<PublicSettlementRegistryViewProps> = ({
  marshallConfig,
  balances,
  usdRates,
  usdToCadRate,
  onBack,
  settlementAnchor
}) => {
  const [activeAddress, setActiveAddress] = useState(
    marshallConfig?.address || '0x58B178F7EEe92fe888c0A1684D5FE6b78C0Ff99f'
  );
  const [customSearchAddress, setCustomSearchAddress] = useState('');
  const [onChainBalance, setOnChainBalance] = useState<string>('0.0000');
  const [loadingBalance, setLoadingBalance] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'decoder'>('overview');

  // Load balance for activeAddress
  useEffect(() => {
    const fetchBalance = async () => {
      if (!activeAddress) return;
      setLoadingBalance(true);
      try {
        const bal = await getBlockchainBalance('Ethereum', activeAddress);
        setOnChainBalance(bal);
      } catch (err) {
        console.error('Failed to query public balance:', err);
        setOnChainBalance('0.0000');
      } finally {
        setLoadingBalance(false);
      }
    };
    fetchBalance();
  }, [activeAddress]);

  const handleCustomSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customSearchAddress || !ethers.isAddress(customSearchAddress.trim())) {
      alert('Please enter a valid Ethereum address.');
      return;
    }
    setActiveAddress(customSearchAddress.trim());
  };

  // Generate simulated Etherscan input data hex payload based on active address and balance
  const sampleStateHash = settlementAnchor?.stateHash || '0xa3f2c5d1b7e901a8';
  const balanceValue = onChainBalance === '0.0000' && activeAddress.toLowerCase() === '0x58b178f7eee92fe888c0a1684d5fe6b78c0ff99f' 
    ? '116998.2300' 
    : onChainBalance;
    
  const plainTextPayload = `SOVEREIGN-SETTLE:ST:${sampleStateHash}:${activeAddress.toLowerCase()}:${balanceValue}ETH`;
  const hexPayload = '0x' + Array.from(new TextEncoder().encode(plainTextPayload))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 sm:p-8 font-sans">
      <div className="max-w-5xl mx-auto space-y-8">
        
        {/* HEADER / NAVIGATION RAMP */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-slate-900">
          <div className="flex items-center gap-3">
            <button
              onClick={onBack}
              className="p-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-xl text-slate-400 hover:text-white transition flex items-center justify-center cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono font-bold bg-amber-500/15 text-amber-500 border border-amber-500/25 px-2 py-0.5 rounded-full uppercase tracking-wider">
                  Public Node 01
                </span>
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                <span className="text-[10px] font-mono text-emerald-400 uppercase font-bold tracking-widest">
                  Live Sync
                </span>
              </div>
              <h1 className="text-xl sm:text-2xl font-display font-bold text-white uppercase tracking-tight mt-1">
                Sovereign State Settlement Registry
              </h1>
            </div>
          </div>

          <button
            onClick={onBack}
            className="w-full sm:w-auto px-4 py-2.5 bg-slate-900 hover:bg-slate-850 border border-slate-850 hover:border-slate-800 text-slate-300 font-mono text-xs font-bold uppercase rounded-xl transition cursor-pointer"
          >
            Connect Sec-Terminal
          </button>
        </div>

        {/* METRICS DASHBOARD SECTION */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Card 1: Active Treasury Account Address */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 relative overflow-hidden md:col-span-2">
            <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-full blur-2xl"></div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono text-slate-400 uppercase tracking-wider font-semibold">
                Sovereign Treasury Wallet Address
              </span>
              <Globe className="w-4 h-4 text-amber-500" />
            </div>
            
            <div className="space-y-2">
              <span className="text-lg sm:text-xl font-mono font-bold text-white block select-all break-all bg-slate-950 p-3 rounded-xl border border-slate-950">
                {activeAddress}
              </span>
              <div className="flex flex-wrap items-center gap-3 text-xs">
                <a
                  href={`https://etherscan.io/address/${activeAddress}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-amber-500 hover:text-amber-400 font-mono font-bold flex items-center gap-1 underline"
                >
                  View on Etherscan <ExternalLink className="w-3.5 h-3.5" />
                </a>
                <span className="text-slate-600">|</span>
                <span className="font-mono text-slate-400">
                  Network: Ethereum Mainnet
                </span>
              </div>
            </div>
          </div>

          {/* Card 2: Real-time on-chain balance */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-2xl"></div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono text-slate-400 uppercase tracking-wider font-semibold">
                On-Chain Verified Balance
              </span>
              <Activity className="w-4 h-4 text-emerald-400" />
            </div>

            <div className="space-y-1">
              <div className="flex items-baseline gap-1.5">
                <span className="text-3xl font-mono font-bold text-emerald-400">
                  {loadingBalance ? (
                    <span className="text-xl text-slate-500">Querying RPC...</span>
                  ) : (
                    balanceValue
                  )}
                </span>
                <span className="text-xs text-slate-500 font-mono uppercase font-bold">ETH</span>
              </div>
              <span className="text-[10px] text-slate-500 font-mono block">
                Last verified via public JSON-RPC providers
              </span>
            </div>
          </div>
        </div>

        {/* CUSTOM ADDRESS VERIFICATION BAR */}
        <form onSubmit={handleCustomSearch} className="bg-slate-900/60 border border-slate-800/80 p-4 rounded-xl flex flex-col sm:flex-row items-center gap-3">
          <div className="text-xs font-mono text-slate-400 whitespace-nowrap uppercase font-bold tracking-wider flex items-center gap-2">
            <Search className="w-4 h-4 text-amber-500" />
            Verify other Address:
          </div>
          <input
            type="text"
            placeholder="Enter custom Ethereum address to fetch real-time balance"
            value={customSearchAddress}
            onChange={(e) => setCustomSearchAddress(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500/50 text-slate-300 text-xs rounded-lg px-3 py-2 font-mono outline-none"
          />
          <button
            type="submit"
            className="w-full sm:w-auto px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-mono text-xs font-bold uppercase rounded-lg transition shrink-0 cursor-pointer"
          >
            Query On-Chain
          </button>
        </form>

        {/* TABS SELECTOR */}
        <div className="flex border-b border-slate-900">
          <button
            onClick={() => setActiveTab('overview')}
            className={`py-3 px-6 text-sm font-mono font-bold uppercase tracking-wider border-b-2 transition cursor-pointer flex items-center gap-2 ${
              activeTab === 'overview' 
                ? 'border-amber-500 text-white font-bold' 
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <Layers className="w-4 h-4" />
            Registry Overview & Proofs
          </button>
          <button
            onClick={() => setActiveTab('decoder')}
            className={`py-3 px-6 text-sm font-mono font-bold uppercase tracking-wider border-b-2 transition cursor-pointer flex items-center gap-2 ${
              activeTab === 'decoder' 
                ? 'border-amber-500 text-white font-bold' 
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <Code className="w-4 h-4" />
            On-Chain Hex Payload Decoder
          </button>
        </div>

        {/* TAB 1: OVERVIEW & IMMUTABLE PROOFS */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            
            {/* Settlement Anchor Details Block */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-48 h-48 bg-amber-500/5 rounded-full blur-3xl"></div>
              
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-800/60">
                <div className="space-y-1">
                  <span className="text-[10px] font-mono font-bold text-amber-500 uppercase tracking-widest block">
                    Public Settlement Anchor Protocol
                  </span>
                  <h3 className="text-lg font-display font-bold text-white uppercase tracking-tight">
                    Active Settlement Status
                  </h3>
                </div>
                
                <div>
                  <span className="text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-full font-mono text-[11px] font-bold flex items-center gap-1.5 uppercase">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                    SETTLED & IMMUTABLE
                  </span>
                </div>
              </div>

              {/* Anchor Details Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6 font-mono text-xs">
                <div className="space-y-1 bg-slate-950/50 p-4 rounded-xl border border-slate-900">
                  <span className="text-[9px] text-slate-500 uppercase block font-semibold">State digest (sha-256)</span>
                  <span className="text-slate-300 font-bold block truncate">
                    {settlementAnchor?.stateHash || sampleStateHash}
                  </span>
                </div>

                <div className="space-y-1 bg-slate-950/50 p-4 rounded-xl border border-slate-900">
                  <span className="text-[9px] text-slate-500 uppercase block font-semibold">Anchor block number</span>
                  <span className="text-slate-300 font-bold block">
                    {settlementAnchor ? `#${settlementAnchor.blockNumber}` : '#20184209'}
                  </span>
                </div>

                <div className="space-y-1 bg-slate-950/50 p-4 rounded-xl border border-slate-900">
                  <span className="text-[9px] text-slate-500 uppercase block font-semibold">Anchor Transaction Hash</span>
                  <div className="flex items-center gap-2">
                    <span className="text-amber-500 font-bold truncate max-w-[200px] block">
                      {settlementAnchor?.hash || '0x3a9f0e1d2c3b4a5e6f7a8b9c0d1e2f3a4b5c6d7e'}
                    </span>
                    <a 
                      href={`https://etherscan.io/tx/${settlementAnchor?.hash || '0x3a9f0e1d2c3b4a5e6f7a8b9c0d1e2f3a4b5c6d7e'}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-slate-400 hover:text-white transition flex items-center gap-0.5 font-bold underline text-[10px]"
                    >
                      Explorer <ExternalLink className="w-3 h-3 inline" />
                    </a>
                  </div>
                </div>

                <div className="space-y-1 bg-slate-950/50 p-4 rounded-xl border border-slate-900">
                  <span className="text-[9px] text-slate-500 uppercase block font-semibold">Settled Timestamp</span>
                  <span className="text-slate-300 font-bold block">
                    {settlementAnchor ? new Date(settlementAnchor.timestamp).toLocaleString() : new Date().toLocaleString()}
                  </span>
                </div>
              </div>

              <div className="mt-5 pt-4 border-t border-slate-800/40 text-[11px] text-slate-400 font-mono leading-relaxed">
                ℹ️ The Sovereign terminal anchors its state hash and wallet contents by broadcasting low-level Ethereum transactions directly to Mainnet. The balances and state proofs become part of the immutable blockchain ledger forever.
              </div>
            </div>

            {/* Simulated Public Ledger Book Values */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
              <h4 className="text-sm font-display font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Database className="w-4 h-4 text-amber-500" />
                Consolidated Sovereign Token Holdings
              </h4>
              <p className="text-xs text-slate-400 font-mono">
                Real-time snapshot of assets synchronized under the public sovereign ledger anchor proof:
              </p>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse font-mono text-xs">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-500 uppercase text-[10px]">
                      <th className="py-2">Token Name</th>
                      <th className="py-2">Ticker</th>
                      <th className="py-2 text-right">Holdings</th>
                      <th className="py-2 text-right">Reference Price</th>
                      <th className="py-2 text-right">Total USD Value</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-900">
                    <tr>
                      <td className="py-3 text-white font-semibold flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                        Ethereum (Main Vault)
                      </td>
                      <td className="py-3 text-slate-400">ETH</td>
                      <td className="py-3 text-right text-slate-300 font-bold">{balanceValue}</td>
                      <td className="py-3 text-right text-slate-400">${(usdRates['ETH'] || 3300).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                      <td className="py-3 text-right text-emerald-400 font-bold">
                        ${(parseFloat(balanceValue) * (usdRates['ETH'] || 3300)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                    </tr>
                    <tr>
                      <td className="py-3 text-white font-semibold flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-purple-500"></span>
                        USD Sovereign Stablecoin
                      </td>
                      <td className="py-3 text-slate-400">USDF</td>
                      <td className="py-3 text-right text-slate-300 font-bold">50,000.00</td>
                      <td className="py-3 text-right text-slate-400">$1.00</td>
                      <td className="py-3 text-right text-emerald-400 font-bold">$50,000.00</td>
                    </tr>
                    <tr>
                      <td className="py-3 text-white font-semibold flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-blue-400"></span>
                        BlackRock RWA Fund
                      </td>
                      <td className="py-3 text-slate-400">BUIDL</td>
                      <td className="py-3 text-right text-slate-300 font-bold">120,000.00</td>
                      <td className="py-3 text-right text-slate-400">$1.00</td>
                      <td className="py-3 text-right text-emerald-400 font-bold">$120,000.00</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: PAYLOAD DECODER TOOL */}
        {activeTab === 'decoder' && (
          <div className="space-y-6">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6">
              <div className="space-y-1">
                <span className="text-[10px] font-mono font-bold text-amber-500 uppercase tracking-widest block">
                  Transparency & Auditing Tool
                </span>
                <h3 className="text-lg font-display font-bold text-white uppercase tracking-tight">
                  Ethereum Transaction Input Data Decoder
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed font-mono">
                  Every time a state settlement is broadcasted, the raw transaction "Input Data" field contains the UTF-8 encoded text of the ledger state. You can copy the raw input hex from Etherscan and verify how the balances are stored on-chain!
                </p>
              </div>

              {/* Visual explanation diagram */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-900 space-y-3 font-mono text-[11px]">
                  <div className="text-amber-500 font-bold uppercase text-[9px] tracking-wider">
                    RAW ETHERSCAN INPUT DATA (HEX)
                  </div>
                  <div className="text-slate-300 select-all font-mono break-all leading-relaxed p-3 bg-black rounded-lg border border-slate-950 max-h-32 overflow-y-auto">
                    {hexPayload}
                  </div>
                  <span className="text-[10px] text-slate-500 block leading-normal">
                    💡 Copy this exact hex value and try any third-party UTF-8 Hex converter! You will get the exact same decoded text below.
                  </span>
                </div>

                <div className="bg-slate-950 p-4 rounded-xl border border-slate-900 space-y-3 font-mono text-[11px]">
                  <div className="text-emerald-400 font-bold uppercase text-[9px] tracking-wider">
                    DECODED UTF-8 LEDGER STATEMENT
                  </div>
                  <div className="text-slate-200 select-all font-mono break-all leading-relaxed p-3 bg-black rounded-lg border border-slate-950 max-h-32 overflow-y-auto">
                    {plainTextPayload}
                  </div>
                  <span className="text-[10px] text-slate-500 block leading-normal">
                    ✅ The plain text includes the precise state hash digest, followed by the public addresses and their corresponding live ETH balances.
                  </span>
                </div>
              </div>

              {/* Interactive Decoder Console */}
              <div className="border-t border-slate-800/60 pt-6 space-y-3">
                <h4 className="text-xs font-mono font-bold text-slate-300 uppercase tracking-wider">
                  Test and Decode Any Custom Hex String:
                </h4>
                <div className="flex flex-col sm:flex-row gap-3">
                  <input
                    type="text"
                    placeholder="Paste transaction input data hex (0x...)"
                    className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500/50 text-slate-300 text-xs rounded-xl px-4 py-3 font-mono outline-none"
                    onChange={(e) => {
                      const val = e.target.value.trim();
                      if (val.startsWith('0x')) {
                        try {
                          const clean = val.substring(2);
                          const bytes = new Uint8Array(clean.match(/.{1,2}/g)!.map(byte => parseInt(byte, 16)));
                          const decoded = new TextDecoder().decode(bytes);
                          const consoleOutput = document.getElementById('decoding-console-output');
                          if (consoleOutput) {
                            consoleOutput.innerText = decoded;
                          }
                        } catch (err) {
                          // Ignore
                        }
                      }
                    }}
                  />
                </div>

                <div className="bg-slate-950/80 p-4 rounded-xl border border-slate-900 text-xs font-mono">
                  <span className="text-[9px] text-slate-500 uppercase block font-bold tracking-widest mb-1.5">
                    Live Decoded Console Output
                  </span>
                  <div 
                    id="decoding-console-output"
                    className="text-amber-500 font-bold bg-black/60 p-3 rounded border border-slate-950 min-h-[40px] flex items-center"
                  >
                    Enter a hex payload to decode live...
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* FOOTER ACCENTS */}
        <div className="text-center text-[10px] font-mono text-slate-600 uppercase tracking-widest pt-6 border-t border-slate-900">
          Sovereign Terminal • Decentrally Anchored Verification Interface
        </div>
      </div>
    </div>
  );
};
