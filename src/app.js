import { useEffect, useState } from 'react';
import { ethers } from 'ethers';
import Web3Modal from 'web3modal';
import contractABI from './abi/LIGHTTHEJOINT.json';
import ConnectWallet from './components/ConnectWallet';
import MintButton from './components/MintButton';
import NFTGallery from './components/NFTGallery';

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

  const connectWallet = async () => {
    const web3Modal = new Web3Modal({
      cacheProvider: false,
      providerOptions: {},
    });
    const connection = await web3Modal.connect();

    const _provider = new ethers.BrowserProvider(connection, SONIC_CHAIN_ID);
    const _signer = await _provider.getSigner();
    const _account = await _signer.address;
    const _contract = new ethers.Contract(CONTRACT_ADDRESS, contractABI, _signer);

    setProvider(_provider);
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
          const tokenURI = await contract.tokenURI(id);
          return { id: id.toString(), isLit, tokenURI };
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

  useEffect(() => {
    if (contract && account) {
      fetchOwnedNFTs();
      fetchTotals();
    }
  }, [contract, account]);

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>🔥 Light The Joint</h1>
      {!account ? (
        <ConnectWallet onConnect={connectWallet} />
      ) : (
        <>
          <p style={styles.address}>Connected: {account}</p>
          <p style={styles.stats}>Total Minted: {totalMinted} | Total Lit: {totalLit}</p>
          <MintButton onMint={mint} loading={loading} />
          <NFTGallery nfts={ownedNFTs} onLight={lightJoint} loading={loading} />
        </>
      )}
    </div>
  );
}

const styles = {
  container: {
    maxWidth: '100%',
    padding: '1rem',
    margin: '0 auto',
    fontFamily: 'Arial, sans-serif',
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
};
