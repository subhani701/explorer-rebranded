// SPDX-License-Identifier: LicenseRef-Blockscout
//
// Rebrand overlay: when the VoltusWave Wallet is detected, show "Add <chain>"
// (default behaviour). When NO wallet is detected, instead of hiding the button,
// show a "Get VoltusWave Wallet" CTA linking to the Chrome Web Store.

import React from 'react';

import useAddChainClick from 'client/shared/web3/useAddChainClick';
import useProvider from 'client/shared/web3/useProvider';
import { WALLETS_INFO } from 'client/shared/web3/wallets';

import config from 'configs/app';
import { Button } from 'toolkit/chakra/button';
import IconSvg from 'ui/shared/IconSvg';

const VOLTUSWAVE_WALLET_URL = 'https://chromewebstore.google.com/detail/voltuswave-wallet/mclhjmmihhfbafjhlajapgpijeipkkjc';
const VOLTUSWAVE_COLOR = '#E6262A';

interface Props {
  source: 'Footer' | 'Top bar';
  onAddSuccess?: () => void;
}

const NetworkAddToWallet = ({ source, onAddSuccess }: Props) => {
  const { data: { wallet } = {} } = useProvider();

  const handleClick = useAddChainClick({ source, onSuccess: onAddSuccess });

  const handleGetWalletClick = React.useCallback(() => {
    window.open(VOLTUSWAVE_WALLET_URL, '_blank', 'noopener,noreferrer');
  }, []);

  if (!wallet) {
    // No wallet detected — prompt the visitor to install the VoltusWave Wallet.
    return (
      <Button
        variant="outline"
        size="2xs"
        borderWidth="1px"
        fontWeight="500"
        color={ VOLTUSWAVE_COLOR }
        borderColor={ VOLTUSWAVE_COLOR }
        onClick={ handleGetWalletClick }
        _hover={{
          color: 'link.primary.hover',
          borderColor: 'link.primary.hover',
        }}
      >
        <IconSvg name="wallets/voltuswave" boxSize={ 3 }/>
        Get VoltusWave Wallet
      </Button>
    );
  }

  const walletInfo = WALLETS_INFO[wallet];

  return (
    <Button
      variant="outline"
      size="2xs"
      borderWidth="1px"
      fontWeight="500"
      color={ walletInfo.color }
      borderColor={ walletInfo.color }
      onClick={ handleClick }
      _hover={{
        color: 'link.primary.hover',
        borderColor: 'link.primary.hover',
      }}
    >
      <IconSvg name={ walletInfo.icon } boxSize={ 3 }/>
      Add { config.chain.name }
    </Button>
  );
};

export default React.memo(NetworkAddToWallet);
