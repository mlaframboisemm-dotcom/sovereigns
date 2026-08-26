export function shortAddress(address: string) {
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}

export function formatBaseBalance(rawBalance: string) {
  try {
    const wei = BigInt(rawBalance);
    const unit = 10n ** 18n;
    const whole = wei / unit;
    const fractional = (wei % unit).toString().padStart(18, '0').slice(0, 6).replace(/0+$/, '');
    return fractional ? `${whole}.${fractional} ETH` : `${whole} ETH`;
  } catch {
    return 'Unavailable';
  }
}

export async function getBaseBalance(address: string) {
  const response = await fetch('https://mainnet.base.org', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: address,
      method: 'eth_getBalance',
      params: [address, 'latest'],
    }),
  });

  if (!response.ok) {
    throw new Error('Base RPC request failed');
  }

  const payload = (await response.json()) as { result?: string };
  if (!payload.result) {
    throw new Error('Base RPC response did not include a balance');
  }

  return formatBaseBalance(payload.result);
}
