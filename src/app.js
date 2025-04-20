import { useEffect, useState } from 'react';
import { ethers } from 'ethers';
import Web3Modal from 'web3modal';
import contractABI from './abi/LIGHTTHEJOINT.json';
import ConnectWallet from './components/ConnectWallet';
import MintButton from './components/MintButton';
import NFTGallery from './components/NFTGallery';
import litJointImg from './assets/images/litjoint.png';
import unlitJointImg from './assets/images/unlitjoint.png';
import xLogo from './assets/images/x.png';

const CONTRACT_ADDRESS = '0x5e4C6B87B644430Fa71F9158B5292808756b7D44';
const SONIC_RPC = 'https://sonic.drpc.org';
const SONIC_CHAIN_ID = 146;

export default function App() {
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [contract, setContract] = useState(null);
  const [account, setAccount] = useState('');
  const [ownedNFTs, setOwnedNFTs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [totalMinted, setTotalMinted] = useState(0);
  const [totalLit, setTotalLit] = useState(0);
  const [leaderboard, setLeaderboard] = useState([]);

  const connectWallet = async () => {
    const web3Modal = new Web3Modal({
      cacheProvider: false,
      providerOptions: {},
    });
    const connection = await web3Modal.connect();
    const provider = new ethers.BrowserProvider(connection);
    const network = await provider.getNetwork();

    if (network.chainId !== SONIC_CHAIN_ID) {
      try {
        await window.ethereum.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: '0x92' }],
        });
      } catch (switchError) {
        if (switchError.code === 4902) {
          try {
            await window.ethereum.request({
              method: 'wallet_addEthereumChain',
              params: [
                {
                  chainId: '0x92',
                  chainName: 'Sonic',
                  rpcUrls: [SONIC_RPC],
                  nativeCurrency: { name: 'S', symbol: 'S', decimals: 18 },
                  blockExplorerUrls: ['https://sonicscan.io'],
                },
              ],
            });
          } catch (addError) {
            console.error('Add chain error:', addError);
            return;
          }
        } else {
          console.error('Switch chain error:', switchError);
          return;
        }
      }
    }

    const _signer = await provider.getSigner();
    const _account = await _signer.getAddress();
    const _contract = new ethers.Contract(CONTRACT_ADDRESS, contractABI, _signer);

    setProvider(provider);
    setSigner(_signer);
    setAccount(_account);
    setContract(_contract);
  };

  const mint = async () => {
    if (!contract) return;
    setLoading(true);
    try {
      const tx = await contract.mint({ value: ethers.parseEther('0') });
      await tx.wait();
      await fetchOwnedNFTs();
      await fetchTotals();
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  const lightJoint = async (tokenId) => {
    if (!contract) return;
    setLoading(true);
    try {
      const tx = await contract.lightTheJoint(tokenId);
      await tx.wait();
      await fetchOwnedNFTs();
      await fetchTotals();
      await fetchLeaderboard();
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  const fetchOwnedNFTs = async () => {
    if (!contract || !account) return;
    try {
      const ids = await contract.walletOfOwner(account);
      const nfts = await Promise.all(
        ids.map(async (id) => {
          const isLit = await contract.getLitStatus(id);
          const image = isLit ? litJointImg : unlitJointImg;
          return { id: id.toString(), isLit, image };
        })
      );
      setOwnedNFTs(nfts);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchTotals = async () => {
    if (!contract) return;
    try {
      const total = await contract.totalSupply();
      setTotalMinted(total.toString());

      let lit = 0;
      for (let i = 1; i <= total; i++) {
        try {
          const status = await contract.getLitStatus(i);
          if (status) lit++;
        } catch {}
      }
      setTotalLit(lit);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchLeaderboard = async () => {
    if (!contract) return;
    try {
      const total = await contract.totalSupply();
      const litMap = {};

      for (let i = 1; i <= total; i++) {
        try {
          const isLit = await contract.getLitStatus(i);
          if (isLit) {
            const owner = await contract.ownerOf(i);
            litMap[owner] = (litMap[owner] || 0) + 1;
          }
        } catch {}
      }

      const sorted = Object.entries(litMap)
        .sort(([, a], [, b]) => b - a)
        .map(([address, count], index) => ({ rank: index + 1, address, count }));

      setLeaderboard(sorted);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (contract && account) {
      fetchOwnedNFTs();
      fetchTotals();
      fetchLeaderboard();
    }
  }, [contract, account]);

  const getRankIcon = (rank) => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return `#${rank}`;
  };

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>🔥 Light The Joint</h1>
      {!account ? (
        <ConnectWallet onConnect={connectWallet} />
      ) : (
        <>
          <p style={styles.address}>Connected: {account}</p>
          <p style={styles.stats}>Total Minted: {totalMinted} | Total Lit: {totalLit}</p>
          <p style={styles.mintNote}>
  🎉 Happy 4/20! Grab a JOINT & light it! Join us in celebration! Mint is live for roughly 24 hours — don’t wait!
</p>
          <MintButton onMint={mint} loading={loading} />
          <NFTGallery nfts={ownedNFTs} onLight={lightJoint} loading={loading} />
          <div style={styles.leaderboard}>
            <p style={styles.leaderboardNote}>Climb the leaderboard to secure whitelist spots for Pass the $JOINT's upcoming project</p>
            <h2 style={styles.leaderboardTitle}>🏆 Leaderboard</h2>
            <ol style={styles.leaderboardList}>
              {leaderboard.map(({ rank, address, count }) => (
                <li
                  key={rank}
                  style={{
                    ...styles.leaderboardItem,
                    backgroundColor: address === account ? '#d0e6ff' : 'transparent',
                    fontWeight: address === account ? 'bold' : 'normal',
                    borderRadius: '6px',
                    padding: '0.3rem 0.5rem',
                  }}
                >
                  <span style={styles.rank}>{getRankIcon(rank)}</span>{' '}
                  <span style={styles.addressText}>{address}</span> -{' '}
                  <span style={styles.count}>{count} lit</span>
                </li>
              ))}
            </ol>
          </div>
          <div style={styles.links}>
            <a href="https://x.com/PassThe_JOINT" target="_blank" rel="noopener noreferrer">
              <img src={xLogo} alt="X" style={styles.icon} />
            </a>
            <a href="https://paintswap.io/sonic/collections/0x5e4c6b87b644430fa71f9158b5292808756b7d44/nfts" target="_blank" rel="noopener noreferrer">
              <img src={unlitJointImg} alt="PaintSwap" style={styles.icon} />
            </a>
          </div>
        </>
      )}
    </div>
  );
}

const styles = {
  container: {
    maxWidth: '100%',
    padding: '1rem',
    margin: 0,
    fontFamily: 'Arial, sans-serif',
    backgroundColor: '#075ad0',
    minHeight: '100vh',
    color: 'white',
    overflowX: 'hidden',
  },
  title: {
    fontSize: 'clamp(1.5rem, 6vw, 2.5rem)',
    textAlign: 'center',
    marginBottom: '1rem',
  },
  address: {
    fontSize: '0.9rem',
    textAlign: 'center',
    marginBottom: '0.5rem',
    wordBreak: 'break-word',
  },
  stats: {
    fontSize: '1rem',
    textAlign: 'center',
    marginBottom: '1rem',
  },
  mintNote: {
    fontSize: '1rem',
    textAlign: 'center',
    marginBottom: '1rem',
    fontWeight: '500',
  },
  leaderboard: {
    marginTop: '2rem',
    padding: '1rem',
    background: '#f0f0f0',
    borderRadius: '8px',
    color: '#000',
    maxWidth: '600px',
    marginLeft: 'auto',
    marginRight: 'auto',
  },
  leaderboardNote: {
    textAlign: 'center',
    fontSize: '1rem',
    marginBottom: '0.5rem',
    fontWeight: '500',
  },
  leaderboardTitle: {
    textAlign: 'center',
    fontSize: '1.5rem',
    marginBottom: '1rem',
  },
  leaderboardList: {
    listStyle: 'none',
    paddingLeft: 0,
  },
  leaderboardItem: {
    marginBottom: '0.5rem',
    display: 'flex',
    alignItems: 'center',
  },
  rank: {
    fontWeight: 'bold',
    marginRight: '0.5rem',
    width: '3rem',
  },
  addressText: {
    flexGrow: 1,
    overflowWrap: 'anywhere',
  },
  count: {
    fontWeight: 'bold',
  },
  links: {
    display: 'flex',
    justifyContent: 'center',
    gap: '1rem',
    marginTop: '2rem',
  },
  icon: {
    width: '40px',
    height: '40px',
    borderRadius: '8px',
    background: 'white',
    padding: '5px',
  },
};
