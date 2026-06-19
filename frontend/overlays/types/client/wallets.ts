// SPDX-License-Identifier: LicenseRef-Blockscout
//
// Rebrand overlay: register VoltusWave Wallet as a first-class supported wallet.
// 'voltuswave' flows to: WalletType, WALLETS_INFO, detect-wallet, and the env
// validator (which imports SUPPORTED_WALLETS), so NEXT_PUBLIC_WEB3_WALLETS
// accepts ["voltuswave"]. The extension itself is unchanged.

import type { ArrayElement } from 'types/utils';

import type { IconName } from 'ui/shared/IconSvg';

export const SUPPORTED_WALLETS = [
  'voltuswave',
  'metamask',
  'coinbase',
  'token_pocket',
  'rabby',
  'okx',
  'trust',
] as const;

export type WalletType = ArrayElement<typeof SUPPORTED_WALLETS>;

export interface WalletInfo {
  name: string;
  icon: IconName;
  color: string;
}
