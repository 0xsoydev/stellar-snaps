'use client';

/**
 * React SDK Demo Page
 * 
 * Showcases all components and hooks from @stellar-snaps/react
 */

import { useState } from 'react';
import {
  StellarSnapsProvider,
  ConnectButton,
  PayButton,
  PaymentCard,
  PaymentModal,
  DonationWidget,
  TxStatus,
  usePaymentModal,
  useFreighter,
  useStellarSnaps,
} from '@stellar-snaps/react';
import '@stellar-snaps/react/styles.css';

// Demo destination wallet (testnet)
const DEMO_DESTINATION = 'GCNZMNUTQ5UMQ5QLOFUAW3CUADWBGWKLS4RN2NOLPAY757CYORI4TQ55';

function DemoContent() {
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');
  const [lastTxHash, setLastTxHash] = useState<string | null>(null);
  const { isOpen, open, close } = usePaymentModal();
  const { wallet, connected } = useFreighter();
  const { network } = useStellarSnaps();

  return (
    <div style={{ 
      minHeight: '100vh',
      background: theme === 'dark' 
        ? 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #1a1a2e 100%)'
        : 'linear-gradient(135deg, #f5f7fa 0%, #e4e8eb 100%)',
      padding: '40px 20px',
      color: theme === 'dark' ? '#fff' : '#1a1a1a',
    }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '48px' }}>
          <h1 style={{ fontSize: '2.5rem', fontWeight: 'bold', marginBottom: '8px' }}>
            @stellar-snaps/react Demo
          </h1>
          <p style={{ color: theme === 'dark' ? '#a0a0a0' : '#666', marginBottom: '24px' }}>
            Interactive demo of all React components and hooks
          </p>
          
          {/* Theme Toggle */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginBottom: '16px' }}>
            <button
              onClick={() => setTheme('light')}
              style={{
                padding: '8px 16px',
                borderRadius: '8px',
                border: 'none',
                background: theme === 'light' ? '#6366f1' : 'transparent',
                color: theme === 'light' ? '#fff' : theme === 'dark' ? '#fff' : '#1a1a1a',
                cursor: 'pointer',
              }}
            >
              Light
            </button>
            <button
              onClick={() => setTheme('dark')}
              style={{
                padding: '8px 16px',
                borderRadius: '8px',
                border: 'none',
                background: theme === 'dark' ? '#6366f1' : 'transparent',
                color: '#fff',
                cursor: 'pointer',
              }}
            >
              Dark
            </button>
          </div>
          
          {/* Connection Status */}
          <div style={{ 
            display: 'inline-block',
            padding: '8px 16px', 
            borderRadius: '8px',
            background: theme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
            fontSize: '14px',
          }}>
            {connected ? (
              <>Connected: <code>{wallet?.slice(0, 8)}...{wallet?.slice(-4)}</code> ({network})</>
            ) : (
              'Not connected'
            )}
          </div>
        </div>

        {/* Components Grid */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
          gap: '24px',
          marginBottom: '48px',
        }}>
          
          {/* ConnectButton Demo */}
          <DemoCard title="ConnectButton" theme={theme}>
            <p style={{ marginBottom: '16px', fontSize: '14px', opacity: 0.7 }}>
              Wallet connection button with dropdown menu
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '12px', opacity: 0.6 }}>Default:</label>
                <div style={{ marginTop: '4px' }}>
                  <ConnectButton />
                </div>
              </div>
              <div>
                <label style={{ fontSize: '12px', opacity: 0.6 }}>Outline variant:</label>
                <div style={{ marginTop: '4px' }}>
                  <ConnectButton variant="outline" />
                </div>
              </div>
              <div>
                <label style={{ fontSize: '12px', opacity: 0.6 }}>Custom label:</label>
                <div style={{ marginTop: '4px' }}>
                  <ConnectButton 
                    connectLabel="Link Wallet" 
                    connectedLabel={(addr) => `${addr.slice(0, 4)}...${addr.slice(-4)}`}
                  />
                </div>
              </div>
            </div>
            <CodeBlock theme={theme}>{`<ConnectButton 
  variant="outline"
  connectLabel="Link Wallet"
/>`}</CodeBlock>
          </DemoCard>

          {/* PayButton Demo */}
          <DemoCard title="PayButton" theme={theme}>
            <p style={{ marginBottom: '16px', fontSize: '14px', opacity: 0.7 }}>
              Simple one-click payment button
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <PayButton
                destination={DEMO_DESTINATION}
                amount="1.00"
                label="Pay 1 XLM"
                onSuccess={(hash) => setLastTxHash(hash)}
              />
              <PayButton
                destination={DEMO_DESTINATION}
                amount="5.00"
                variant="outline"
                label="Pay 5 XLM"
                onSuccess={(hash) => setLastTxHash(hash)}
              />
              <PayButton
                destination={DEMO_DESTINATION}
                amount="0.5"
                size="sm"
                label="Small Button"
              />
            </div>
            <CodeBlock theme={theme}>{`<PayButton
  destination="GABC..."
  amount="5.00"
  label="Pay 5 XLM"
  onSuccess={(hash) => console.log(hash)}
/>`}</CodeBlock>
          </DemoCard>

          {/* PaymentCard Demo */}
          <DemoCard title="PaymentCard" theme={theme}>
            <p style={{ marginBottom: '16px', fontSize: '14px', opacity: 0.7 }}>
              Full payment card with amount display
            </p>
            <PaymentCard
              title="Coffee Purchase"
              description="Thanks for your order!"
              destination={DEMO_DESTINATION}
              amount="3.50"
              network="testnet"
              onSuccess={(hash) => setLastTxHash(hash)}
            />
            <CodeBlock theme={theme}>{`<PaymentCard
  title="Coffee Purchase"
  description="Thanks for your order!"
  destination="GABC..."
  amount="3.50"
  network="testnet"
/>`}</CodeBlock>
          </DemoCard>

          {/* PaymentModal Demo */}
          <DemoCard title="PaymentModal" theme={theme}>
            <p style={{ marginBottom: '16px', fontSize: '14px', opacity: 0.7 }}>
              Modal dialog for payments
            </p>
            <button
              onClick={open}
              className="snaps-btn snaps-btn-solid snaps-btn-md"
              style={{ width: '100%' }}
            >
              Open Payment Modal
            </button>
            <PaymentModal
              isOpen={isOpen}
              onClose={close}
              title="Complete Purchase"
              description="You're about to pay for your order"
              destination={DEMO_DESTINATION}
              amount="10.00"
              network="testnet"
              onSuccess={(hash) => {
                setLastTxHash(hash);
              }}
            />
            <CodeBlock theme={theme}>{`const { isOpen, open, close } = usePaymentModal();

<button onClick={open}>Pay Now</button>
<PaymentModal
  isOpen={isOpen}
  onClose={close}
  destination="GABC..."
  amount="10.00"
/>`}</CodeBlock>
          </DemoCard>

          {/* DonationWidget Demo */}
          <DemoCard title="DonationWidget" theme={theme}>
            <p style={{ marginBottom: '16px', fontSize: '14px', opacity: 0.7 }}>
              Preset amount donation component
            </p>
            <DonationWidget
              destination={DEMO_DESTINATION}
              title="Support this project"
              description="Your donation helps us build more!"
              presets={[1, 5, 10, 25]}
              allowCustom
              network="testnet"
              onSuccess={(hash, amount) => {
                setLastTxHash(hash);
                console.log(`Donated ${amount} XLM`);
              }}
            />
            <CodeBlock theme={theme}>{`<DonationWidget
  destination="GABC..."
  presets={[1, 5, 10, 25]}
  allowCustom
/>`}</CodeBlock>
          </DemoCard>

          {/* TxStatus Demo */}
          <DemoCard title="TxStatus" theme={theme}>
            <p style={{ marginBottom: '16px', fontSize: '14px', opacity: 0.7 }}>
              Transaction status display
            </p>
            {lastTxHash ? (
              <TxStatus
                txHash={lastTxHash}
                network="testnet"
                showLink
              />
            ) : (
              <div style={{ 
                padding: '16px', 
                background: theme === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
                borderRadius: '8px',
                textAlign: 'center',
                fontSize: '14px',
                opacity: 0.7,
              }}>
                Make a payment to see the TxStatus component
              </div>
            )}
            <CodeBlock theme={theme}>{`<TxStatus
  txHash="abc123..."
  network="testnet"
  showLink
  onConfirmed={() => console.log('Confirmed!')}
/>`}</CodeBlock>
          </DemoCard>

          {/* Headless Mode Demo */}
          <DemoCard title="Headless Mode (render prop)" theme={theme}>
            <p style={{ marginBottom: '16px', fontSize: '14px', opacity: 0.7 }}>
              Full control with custom UI
            </p>
            <PayButton
              destination={DEMO_DESTINATION}
              amount="2.00"
              render={({ pay, paying, connected, connect, status }) => (
                <div style={{ 
                  padding: '20px',
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  borderRadius: '12px',
                  textAlign: 'center',
                }}>
                  <div style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '8px' }}>
                    2.00 XLM
                  </div>
                  <div style={{ fontSize: '12px', marginBottom: '16px', opacity: 0.8 }}>
                    Status: {status}
                  </div>
                  <button
                    onClick={connected ? pay : connect}
                    disabled={paying}
                    style={{
                      padding: '12px 24px',
                      background: 'rgba(255,255,255,0.2)',
                      border: '2px solid white',
                      borderRadius: '8px',
                      color: 'white',
                      fontWeight: 'bold',
                      cursor: paying ? 'not-allowed' : 'pointer',
                    }}
                  >
                    {paying ? 'Processing...' : connected ? 'Custom Pay Button' : 'Connect First'}
                  </button>
                </div>
              )}
            />
            <CodeBlock theme={theme}>{`<PayButton
  destination="GABC..."
  amount="2.00"
  render={({ pay, paying, status }) => (
    <CustomUI onClick={pay} />
  )}
/>`}</CodeBlock>
          </DemoCard>

          {/* Hooks Demo */}
          <DemoCard title="Hooks" theme={theme}>
            <p style={{ marginBottom: '16px', fontSize: '14px', opacity: 0.7 }}>
              Available hooks for custom implementations
            </p>
            <div style={{ 
              background: theme === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
              borderRadius: '8px',
              padding: '16px',
              fontSize: '14px',
            }}>
              <div style={{ marginBottom: '8px' }}>
                <strong>useFreighter()</strong> - Wallet connection
              </div>
              <div style={{ marginBottom: '8px' }}>
                <strong>usePayment()</strong> - Payment flow
              </div>
              <div style={{ marginBottom: '8px' }}>
                <strong>useSnap()</strong> - Fetch snap metadata
              </div>
              <div style={{ marginBottom: '8px' }}>
                <strong>useStellarSnaps()</strong> - Global context
              </div>
              <div>
                <strong>usePaymentModal()</strong> - Modal state
              </div>
            </div>
            <CodeBlock theme={theme}>{`const { wallet, connect, disconnect } = useFreighter();
const { pay, paying, txHash } = usePayment({ ... });
const { snap, loading } = useSnap(snapId);`}</CodeBlock>
          </DemoCard>
        </div>

        {/* Footer */}
        <div style={{ textAlign: 'center', opacity: 0.6, fontSize: '14px' }}>
          <p>
            Install: <code style={{ background: 'rgba(255,255,255,0.1)', padding: '2px 8px', borderRadius: '4px' }}>
              npm install @stellar-snaps/react
            </code>
          </p>
          <p style={{ marginTop: '8px' }}>
            <a href="/" style={{ color: '#6366f1' }}>Back to Home</a>
            {' | '}
            <a href="/demo" style={{ color: '#6366f1' }}>UI Components Demo</a>
          </p>
        </div>
      </div>
    </div>
  );
}

// Demo Card Component
function DemoCard({ title, children, theme }: { title: string; children: React.ReactNode; theme: 'light' | 'dark' }) {
  return (
    <div style={{
      background: theme === 'dark' ? 'rgba(255,255,255,0.05)' : '#ffffff',
      border: `1px solid ${theme === 'dark' ? 'rgba(255,255,255,0.1)' : '#e5e5e5'}`,
      borderRadius: '12px',
      padding: '24px',
    }}>
      <h3 style={{ 
        fontSize: '18px', 
        fontWeight: '600', 
        marginBottom: '16px',
        color: theme === 'dark' ? '#fff' : '#1a1a1a',
      }}>
        {title}
      </h3>
      {children}
    </div>
  );
}

// Code Block Component
function CodeBlock({ children, theme }: { children: string; theme: 'light' | 'dark' }) {
  return (
    <pre style={{
      marginTop: '16px',
      padding: '12px',
      background: theme === 'dark' ? 'rgba(0,0,0,0.3)' : '#f5f5f5',
      borderRadius: '8px',
      fontSize: '12px',
      overflow: 'auto',
      color: theme === 'dark' ? '#a0a0a0' : '#666',
    }}>
      <code>{children}</code>
    </pre>
  );
}

// Main Page Component with Provider
export default function ReactDemoPage() {
  return (
    <StellarSnapsProvider network="testnet" theme="dark">
      <DemoContent />
    </StellarSnapsProvider>
  );
}
