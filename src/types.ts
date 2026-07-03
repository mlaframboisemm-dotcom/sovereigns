/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type ChainType = 'Ethereum' | 'Bitcoin' | 'Solana' | 'Polygon' | 'Base' | 'BNB Chain';

export interface ChainConfig {
  name: ChainType;
  symbol: string;
  decimals: number;
  rpcUrl: string;
  explorerUrl: string;
  icon: string;
  color: string;
}

export interface UserProfile {
  userId: string;
  email: string;
  mfaEnabled: boolean;
  mfaSecret?: string;
  registeredDevices: string[];
  createdAt: string;
  updatedAt: string;
}

export interface EncryptedWalletData {
  walletId: string;
  userId: string;
  name: string;
  address: string;
  encryptedPrivateKey: string; // AES-GCM encrypted private key
  encryptedEntropy?: string;    // AES-GCM encrypted mnemonic seed
  encryptionSalt: string;       // PBKDF2 salt
  encryptionIv: string;         // AES-GCM initialization vector
  chainType: ChainType;
  createdAt: string;
}

export interface DecryptedWallet {
  walletId: string;
  name: string;
  address: string;
  privateKey: string;
  mnemonic?: string;
  chainType: ChainType;
}

export interface WalletBalance {
  chainType: ChainType;
  balance: string; // Crypto balance (e.g., "1.23")
  usdValue: string; // Calculated USD fiat value (e.g., "3450.50")
  symbol: string;
}

export interface BlockchainTransaction {
  txId: string;
  userId: string;
  walletId: string;
  chain: ChainType;
  type: 'send' | 'receive';
  fromAddress: string;
  toAddress: string;
  amount: string;
  hash: string;
  status: 'pending' | 'confirmed' | 'failed';
  timestamp: string;
}

export interface AuditLogEntry {
  logId: string;
  userId: string;
  action: string;
  details: string;
  userAgent: string;
  timestamp: string;
}

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
  };
}
