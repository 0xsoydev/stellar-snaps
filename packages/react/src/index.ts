/**
 * @stellar-snaps/react
 * 
 * React hooks and components for Stellar Snaps payments
 * 
 * @example
 * ```tsx
 * import { StellarSnapsProvider, PayButton, useFreighter } from '@stellar-snaps/react';
 * import '@stellar-snaps/react/styles.css';
 * 
 * function App() {
 *   return (
 *     <StellarSnapsProvider network="testnet" theme="light">
 *       <PayButton
 *         destination="GABC..."
 *         amount="10.00"
 *         onSuccess={(txHash) => console.log('Paid!', txHash)}
 *       />
 *     </StellarSnapsProvider>
 *   );
 * }
 * ```
 */

// Context
export {
  StellarSnapsProvider,
  useStellarSnaps,
  useStellarSnapsOptional,
  type StellarSnapsProviderProps,
  type StellarSnapsContextValue,
  type WalletState,
} from './context/StellarSnapsProvider';

// Hooks
export {
  useFreighter,
  useSnap,
  useSnapMetadata,
  usePayment,
  type UseFreighterOptions,
  type UseFreighterResult,
  type UseSnapOptions,
  type UseSnapResult,
  type UseSnapMetadataOptions,
  type UsePaymentOptions,
  type UsePaymentResult,
  type PaymentStatus,
  type PaymentDetails,
} from './hooks';

// Components
export {
  ConnectButton,
  PayButton,
  PaymentCard,
  PaymentModal,
  usePaymentModal,
  TxStatus,
  DonationWidget,
  type ConnectButtonProps,
  type ConnectButtonRenderProps,
  type PayButtonProps,
  type PayButtonRenderProps,
  type PaymentCardProps,
  type PaymentCardRenderProps,
  type PaymentCardButtonProps,
  type PaymentModalProps,
  type PaymentModalRenderProps,
  type TxStatusProps,
  type TxStatusRenderProps,
  type TransactionStatusType,
  type DonationWidgetProps,
  type DonationWidgetRenderProps,
} from './components';

// Themes
export {
  lightTheme,
  darkTheme,
  themeToCssVars,
  getTheme,
  type Theme,
  type ThemeName,
} from './themes';

// Utils
export {
  cn,
  truncateAddress,
  formatAmount,
  getExplorerUrl,
  getAccountExplorerUrl,
} from './utils';
