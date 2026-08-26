import { describe, expect, it } from 'vitest';
import { formatBaseBalance, shortAddress } from './cdpWallet';

describe('CDP wallet formatting', () => {
  it('shortens a public wallet address without altering its prefix or suffix', () => {
    expect(shortAddress('0x1234567890abcdef1234567890abcdef12345678')).toBe('0x1234…5678');
  });

  it('formats a Base native balance from wei', () => {
    expect(formatBaseBalance('1234567000000000000')).toBe('1.234567 ETH');
  });

  it('does not present malformed balance data as an asset amount', () => {
    expect(formatBaseBalance('not-a-balance')).toBe('Unavailable');
  });
});
