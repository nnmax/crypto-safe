import type { Connector } from 'wagmi'
import { useMemo, useState } from 'react'
import { Heading } from 'react-aria-components'
import { ConnectorAlreadyConnectedError, useAccount, useChainId, useConnect, useSignMessage } from 'wagmi'
import { MESSAGE_KEY, SIGNATURE_KEY } from '../constants'
import { useWalletModalOpen } from '../store/hooks'
import Modal from './Modal'

export default function WalletModal() {
  const [pendingWallet, setPendingWallet] = useState<Connector>()
  // const queryClient = useQueryClient()
  const { data: walletModalOpen, setData: setWalletModalOpen } = useWalletModalOpen()
  const { connectAsync } = useConnect()
  // const { data: userInfo } = useUserInfo()
  const chainId = useChainId()
  const { addresses: accountAddresses } = useAccount()
  const { signMessageAsync } = useSignMessage()

  // const updateUserInfo = (data: ConnectWalletData) => {
  //   queryClient.setQueryData<GetUserData | undefined>(['get-current-login-user'], data)
  // }

  const tryActivation = async (connector: Connector) => {
    setPendingWallet(connector) // set wallet for pending view

    try {
      const { accounts } = await connectAsync({
        connector,
        chainId,
      }).catch((error) => {
        if (error instanceof ConnectorAlreadyConnectedError) {
          // if (userInfo) {
          //   toggleWalletModal()
          //   throw error
          // }
          // else if (accountAddresses) {
          return { accounts: accountAddresses }
          // }
        }
        throw error
      })

      const s = window.localStorage.getItem(SIGNATURE_KEY)
      const m = window.localStorage.getItem(MESSAGE_KEY)

      const connectWalletResponse: string /* | ConnectWalletData */ | false = 'Test Sign Message'
      if (m && s) {
        // connectWalletResponse = await connectWallet({
        //   address: accounts[0],
        //   signature: s,
        //   message: m,
        //   disabledErrorToast: true,
        // }).catch((err) => {
        //   console.error(err)
        //   return false
        // })
      }
      // if (connectWalletResponse === false) {
      //   connectWalletResponse = await connectWallet({
      //     address: accounts[0],
      //   })
      // }

      if (accounts && typeof connectWalletResponse === 'string') {
        const signature = await signMessageAsync({
          message: connectWalletResponse,
          account: accounts[0],
        })
        // const connectWalletResponse2 = await connectWallet({
        //   address: accounts![0],
        //   signature,
        //   message: connectWalletResponse,
        // })
        // if (typeof connectWalletResponse2 === 'string') {
        //   setPendingWallet(undefined)
        //   return
        // }
        window.localStorage.setItem(SIGNATURE_KEY, signature)
        window.localStorage.setItem(MESSAGE_KEY, connectWalletResponse)
        // updateUserInfo(connectWalletResponse2)
      }
      else {
        // updateUserInfo(connectWalletResponse)
      }
      // queryClient.invalidateQueries()
      setPendingWallet(undefined)
      setWalletModalOpen(false)
    }
    catch (error) {
      // eslint-disable-next-line no-console
      console.log('%c [ error ]-93', 'font-size:13px; background:pink; color:#bf2c9f;', error)
      setPendingWallet(undefined)
    }
  }

  const connectors = useOrderedConnections()

  return (
    <WalletModalWrapper open={walletModalOpen} onClose={() => setWalletModalOpen(false)}>
      {connectors.map((connector) => {
        return (
          <WalletModalListItem
            key={connector.uid}
            name={connector.name}
            icon={connector.icon!}
            loading={connector === pendingWallet}
            disabled={!!pendingWallet}
            onClick={() => {
              tryActivation(connector)
            }}
          />
        )
      })}
    </WalletModalWrapper>
  )
}

export function WalletModalWrapper(props: { open: boolean, onClose: () => void, children: React.ReactNode }) {
  const { open, onClose, children } = props

  return (
    <Modal isOpen={open} onClose={onClose} padding="24px 36px" maxWidth="384px">
      <Heading slot="title" className="mb-2 text-lg/6 font-bold text-[#576FAA]">
        Connect Wallet
      </Heading>
      <p className="text-xs font-medium text-[#6E86C2]">
        Choose how you want to connect. lf you don't have a wallet, you can select a provider and create one.
      </p>

      <ul className="mt-6 flex flex-col gap-6" role="menu">
        {children}
      </ul>
    </Modal>
  )
}

const liClasses
  = 'flex h-8 items-center aria-disabled:pointer-events-none gap-6 text-sm font-bold text-[#3255AC] cursor-pointer'

function WalletModalListItem(props: {
  loading?: boolean
  icon: string
  name: string
  disabled?: boolean
  onClick?: (e: React.MouseEvent<HTMLLIElement> | React.KeyboardEvent<HTMLLIElement>) => void
}) {
  const { onClick, loading, icon, name, disabled } = props

  const handleKeyDown = (e: React.KeyboardEvent<HTMLLIElement>) => {
    if (!onClick || loading || disabled) {
      return
    }
    if (e.key === 'Enter' || e.key === ' ') {
      onClick(e)
    }
  }

  const handleClick = (e: React.MouseEvent<HTMLLIElement>) => {
    if (!onClick || loading || disabled) {
      return
    }
    onClick(e)
  }

  return (
    <li
      className={liClasses}
      role="menuitem"
      tabIndex={loading || disabled ? -1 : 0}
      aria-disabled={loading || disabled}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
    >
      {loading ? <span className="size-8 loading" /> : <img src={icon} alt="" width="32" height="32" />}
      {name}
    </li>
  )
}

const CONNECTION = {
  WALLET_CONNECT_CONNECTOR_ID: 'walletConnect',
  INJECTED_CONNECTOR_ID: 'injected',
  INJECTED_CONNECTOR_TYPE: 'injected',
  COINBASE_SDK_CONNECTOR_ID: 'coinbaseWalletSDK',
  COINBASE_RDNS: 'com.coinbase.wallet',
  METAMASK_RDNS: 'io.metamask',
} as const

function getInjectedConnectors(connectors: readonly Connector[]) {
  const injectedConnectors = connectors.filter((c) => {
    if (c.id === CONNECTION.COINBASE_RDNS) {
      return false
    }

    return c.type === CONNECTION.INJECTED_CONNECTOR_TYPE && c.id !== CONNECTION.INJECTED_CONNECTOR_ID
  })

  // Special-case: Return deprecated window.ethereum connector when no eip6963 injectors are present.
  const fallbackInjector = getConnectorWithId(connectors, CONNECTION.INJECTED_CONNECTOR_ID, { shouldThrow: true })
  if (!injectedConnectors.length && Boolean(window.ethereum)) {
    return { injectedConnectors: [fallbackInjector] }
  }

  return { injectedConnectors }
}

type ConnectorID = (typeof CONNECTION)[keyof typeof CONNECTION]

function getConnectorWithId(
  connectors: readonly Connector[],
  id: ConnectorID,
  options: { shouldThrow: true },
): Connector
function getConnectorWithId(connectors: readonly Connector[], id: ConnectorID): Connector | undefined
function getConnectorWithId(
  connectors: readonly Connector[],
  id: ConnectorID,
  options?: { shouldThrow: true },
): Connector | undefined {
  const connector = connectors.find(c => c.id === id)
  if (!connector && options?.shouldThrow) {
    throw new Error(`Expected connector ${id} missing from wagmi context.`)
  }
  return connector
}

function useOrderedConnections() {
  const { connectors } = useConnect()

  return useMemo(() => {
    const { injectedConnectors } = getInjectedConnectors(connectors)
    const SHOULD_THROW = { shouldThrow: true } as const
    const coinbaseSdkConnector = getConnectorWithId(connectors, CONNECTION.COINBASE_SDK_CONNECTOR_ID, SHOULD_THROW)
    const walletConnectConnector = getConnectorWithId(connectors, CONNECTION.WALLET_CONNECT_CONNECTOR_ID, SHOULD_THROW)

    if (!coinbaseSdkConnector || !walletConnectConnector) {
      throw new Error('Expected connector(s) missing from wagmi context.')
    }

    const orderedConnectors: Connector[] = []

    // Injected connectors should appear next in the list, as the user intentionally installed/uses them.
    orderedConnectors.push(
      ...injectedConnectors.filter(item => ['com.okex.wallet', 'io.metamask'].includes(item.id)),
    )

    // WalletConnect and Coinbase are added last in the list.
    orderedConnectors.push(walletConnectConnector)
    orderedConnectors.push(coinbaseSdkConnector)

    // id 等于 io.metamask 的排在最前面，id 等于 com.okex.wallet 的排在最后面
    orderedConnectors.sort((a, b) => {
      if (a.id === 'io.metamask') {
        return -1
      }
      if (b.id === 'io.metamask') {
        return 1
      }
      if (a.id === 'com.okex.wallet') {
        return 1
      }
      if (b.id === 'com.okex.wallet') {
        return -1
      }
      return 0
    })

    return orderedConnectors
  }, [connectors])
}
