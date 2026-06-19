// SPDX-License-Identifier: LicenseRef-Blockscout
//
// Hardening overlay: guard against an undefined/empty `hash`. The prop is typed
// as `string`, but at runtime it can arrive undefined (e.g. placeholder/loading
// rows on the Tokens and Search pages), and `hash.length` then crashed the whole
// page via the error boundary. Render nothing instead of crashing.

import { chakra } from '@chakra-ui/react';
import React from 'react';

import shortenString from 'client/shared/text/shorten-string';

import { Tooltip } from 'toolkit/chakra/tooltip';

interface Props {
  hash: string;
  noTooltip?: boolean;
  tooltipInteractive?: boolean;
  type?: 'long' | 'short';
  maxSymbols?: number;
  as?: React.ElementType;
}

const HashStringShorten = ({ hash, noTooltip, as = 'span', type, tooltipInteractive, maxSymbols }: Props) => {
  if (!hash) {
    return <chakra.span as={ as }/>;
  }

  const charNumber = maxSymbols ?? (type === 'long' ? 16 : 8);
  if (hash.length <= charNumber) {
    return <chakra.span as={ as }>{ hash }</chakra.span>;
  }

  const content = <chakra.span as={ as }>{ shortenString(hash, charNumber) }</chakra.span>;

  if (noTooltip) {
    return content;
  }

  return (
    <Tooltip content={ hash } interactive={ tooltipInteractive }>
      { content }
    </Tooltip>
  );
};

export default HashStringShorten;
