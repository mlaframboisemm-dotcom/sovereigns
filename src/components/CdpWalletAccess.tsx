import { SignIn } from '@coinbase/cdp-react';
import {
  useCurrentUser,
  useEvmAccounts,
  useEvmSmartAccounts,
  useIsSignedIn,
  useSignOut,
  useSolanaAccounts,
} from '@coinbase/cdp-hooks';
import { Check, Copy, ExternalLink, ShieldCheck, Wallet } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { getBaseBalance, shortAddress } from '../lib/cdpWallet';

type CopyState = string | null;

export default function CdpWalletAccess() {
  const { isSignedIn } = useIsSignedIn();
  const { currentUser } = useCurrentUser();
  const { evmAccounts } = useEvmAccounts();
  const { evmSmartAccounts } = useEvmSmartAccounts();
  const { solanaAccounts } = useSolanaAccounts();
  const { signOut } = useSignOut();
  const [baseBalances, setBaseBalances] = useState<Record<string, string>>({});
  const [copyState, setCopyState] = useState<CopyState>(null);

  const evmAddresses = useMemo(
    () => Array.from(new Set([...(evmAccounts ?? []), ...(evmSmartAccounts ?? [])].map((account) => account.address))),
    [evmAccounts, evmSmartAccounts],
  );

  useEffect(() => {
    let active = true;

    if (!isSignedIn || evmAddresses.length === 0) {
      setBaseBalances({});
      return () => {
        active = false;
      };
    }

    const loadBalances = async () => {
      const results = await Promise.all(
        evmAddresses.map(async (address) => {
          try {
            return [address, await getBaseBalance(address)] as const;
          } catch {
            return [address, 'Unavailable'] as const;
          }
        }),
      );

      if (active) {
        setBaseBalances(Object.fromEntries(results));
      }
    };

    void loadBalances();
    return () => {
      active = false;
    };
  }, [evmAddresses, isSignedIn]);

  const copyAddress = async (address: string) => {
    await navigator.clipboard.writeText(address);
    setCopyState(address);
    window.setTimeout(() => setCopyState(null), 1800);
  };

  if (!isSignedIn) {
    return (
      <section className="mt-6 rounded-2xl border border-emerald-500/20 bg-emerald-500/[0.04] p-4 text-left">
        <div className="mb-3 flex items-start gap-3">
          <div className="mt-0.5 rounded-lg bg-emerald-500/15 p-2 text-emerald-300">
            <Wallet className="h-4 w-4" />
          </div>
          <div>
            <p className="text-xs font-mono font-semibold uppercase tracking-[0.16em] text-emerald-300">Coinbase CDP wallet</p>
            <h2 className="mt-1 text-base font-semibold text-white">Sign in to your connected wallet</h2>
            <p className="mt-1 text-xs leading-5 text-slate-400">
              Use your existing CDP identity. The application reads authenticated wallet addresses and live Base native balances; it never asks for a seed phrase or private key.
            </p>
          </div>
        </div>
        <div className="rounded-xl bg-slate-950/70 p-3">
          <SignIn />
        </div>
      </section>
    );
  }

  return (
    <section className="mt-6 rounded-2xl border border-emerald-500/25 bg-slate-950/60 p-4 text-left shadow-lg shadow-emerald-950/20">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex gap-3">
          <div className="rounded-xl bg-emerald-500/15 p-2.5 text-emerald-300">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-semibold text-white">CDP wallet profile connected</h2>
              <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-mono font-bold uppercase tracking-wide text-emerald-300">Verified session</span>
            </div>
            <p className="mt-1 break-all text-xs text-slate-400">Profile ID: {currentUser?.userId ?? 'Authenticated CDP user'}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => void signOut()}
          className="rounded-lg border border-slate-700 px-3 py-2 text-xs font-semibold text-slate-300 transition hover:border-slate-500 hover:text-white"
        >
          Sign out wallet
        </button>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-2">
        {evmAddresses.map((address) => (
          <article key={address} className="rounded-xl border border-slate-800 bg-slate-900/60 p-3">
            <div className="flex items-center justify-between gap-2">
              <div>
                <p className="text-[10px] font-mono uppercase tracking-[0.14em] text-slate-500">EVM account · Base</p>
                <p className="mt-1 font-mono text-sm text-white" title={address}>{shortAddress(address)}</p>
              </div>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => void copyAddress(address)}
                  className="rounded-md p-2 text-slate-400 transition hover:bg-slate-800 hover:text-white"
                  aria-label={`Copy ${address}`}
                >
                  {copyState === address ? <Check className="h-4 w-4 text-emerald-300" /> : <Copy className="h-4 w-4" />}
                </button>
                <a
                  href={`https://basescan.org/address/${address}`}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-md p-2 text-slate-400 transition hover:bg-slate-800 hover:text-white"
                  aria-label={`Open ${address} in BaseScan`}
                >
                  <ExternalLink className="h-4 w-4" />
                </a>
              </div>
            </div>
            <div className="mt-3 flex items-center justify-between border-t border-slate-800 pt-3">
              <span className="text-xs text-slate-500">Live Base native balance</span>
              <span className="font-mono text-xs font-semibold text-emerald-300">{baseBalances[address] ?? 'Loading…'}</span>
            </div>
          </article>
        ))}

        {(solanaAccounts ?? []).map((account) => (
          <article key={account.address} className="rounded-xl border border-slate-800 bg-slate-900/60 p-3">
            <div className="flex items-center justify-between gap-2">
              <div>
                <p className="text-[10px] font-mono uppercase tracking-[0.14em] text-slate-500">Solana account</p>
                <p className="mt-1 font-mono text-sm text-white" title={account.address}>{shortAddress(account.address)}</p>
              </div>
              <a
                href={`https://explorer.solana.com/address/${account.address}`}
                target="_blank"
                rel="noreferrer"
                className="rounded-md p-2 text-slate-400 transition hover:bg-slate-800 hover:text-white"
                aria-label={`Open ${account.address} in Solana Explorer`}
              >
                <ExternalLink className="h-4 w-4" />
              </a>
            </div>
            <p className="mt-3 border-t border-slate-800 pt-3 text-xs text-slate-500">Open the verified explorer record to review current assets and activity.</p>
          </article>
        ))}
      </div>

      {evmAddresses.length === 0 && (solanaAccounts ?? []).length === 0 && (
        <p className="mt-4 rounded-lg border border-amber-500/20 bg-amber-500/5 p-3 text-xs leading-5 text-amber-200">
          Your CDP profile is signed in, but no wallet account is available yet. Complete the wallet account setup in your CDP profile before continuing.
        </p>
      )}

      <p className="mt-4 rounded-lg border border-slate-800 bg-slate-900/50 p-3 text-xs leading-5 text-slate-400">
        Signing remains guarded: this integration does not enable delegated signing, spend permissions, transfers, swaps, exports, seed phrases, or private-key handling.
      </p>
    </section>
  );
}
