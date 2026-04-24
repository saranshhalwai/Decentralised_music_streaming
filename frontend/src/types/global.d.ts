/* eslint-disable @typescript-eslint/no-explicit-any */
export interface EthersError extends Error {
  code?: string | number;
  reason?: string;
  action?: string;
  transaction?: any;
  receipt?: any;
}

declare global {
  interface Window {
    ethereum?: any;
  }
}
