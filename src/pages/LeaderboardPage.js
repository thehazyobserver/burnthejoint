import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ethers } from 'ethers';

const CONTRACT_ADDRESS = '0x5e4C6B87B644430Fa71F9158B5292808756b7D44';
const SONIC_RPC = 'https://sonic.drpc.org';
const contractABI = require('../abi/LIGHTTHEJOINT.json');

const CACHE_KEY = 'lit_leaderboard_cache';
const CACHE_EXPIRY_MINUTES = 10;

export default function LeaderboardPage() {
  const [leaderboard, setLeaderboard] = useState([]);
  const [displayCount, setDisplayCount] = useState(50);
  const [walletAddress, setWalletAddress] = useState(null);
  const [walletRank, setWalletRank] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchLeaderboard = async (detectedWallet = null, forceRefresh = false) => {
    setLoading(true);

    try {
      const cached = JSON.parse(localStorage.getItem(CACHE_KEY));
      const now = Date.now();

      if (!forceRefresh && cached && now - cached.timestamp < CACHE_EXPIRY_MINUTES * 60 * 1000) {
        setLeaderboard(cached.leaderboard);
        if (detectedWallet) {
          const entry = cached.leaderboard.find(e => e.address === detectedWallet.toLowerCase());
          setWalletRank(entry ? entry.rank : '-');
        }
        setLoading(false);
        return;
      }

      const provider = new ethers.JsonRpcProvider(SONIC_RPC);
      const contract = new ethers.Contract(CONTRACT_ADDRESS, contractABI, provider);
      const total = Number(await contract.totalSupply());
      const batchSize = 250;
      const litMap = {};

      for (let i = 1; i <= total; i += batchSize) {
        const end = Math.min(i + batchSize - 1, total);
        const ids = Array.from({ length: end - i + 1 }, (_, idx) => i + idx);

        const statusResults = await Promise.allSettled(
          ids.map(id => contract.getLitStatus(id).then(res => res ? id : null))
        );
        const litTokenIds = statusResults
          .map(res => res.status === 'fulfilled' ? res.value : null)
          .filter(Boolean);

        const ownerResults = await Promise.allSettled(
          litTokenIds.map(id => contract.ownerOf(id).catch(() => null))
        );
        ownerResults.forEach(res => {
          if (res.status === 'fulfilled' && res.value) {
            const owner = res.value.toLowerCase();
            litMap[owner] = (litMap[owner] || 0) + 1;
          }
        });
      }

      const sorted = Object.entries(litMap)
        .sort(([, a], [, b]) => b - a)
        .map(([address, count], index) => ({ rank: index + 1, address, count }));

      localStorage.setItem(CACHE_KEY, JSON.stringify({
        leaderboard: sorted,
        timestamp: now
      }));

      setLeaderboard(sorted);
      if (detectedWallet) {
        const entry = sorted.find(e => e.address === detectedWallet.toLowerCase());
        setWalletRank(entry ? entry.rank : '-');
      }
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  const detectWallet = async () => {
    if (window.ethereum) {
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      if (accounts.length > 0) {
        const wallet = accounts[0].toLowerCase();
        setWalletAddress(wallet);
        fetchLeaderboard(wallet);
      }
    } else {
      alert('MetaMask not found. Please install it.');
    }
  };

  useEffect(() => {
    if (window.ethereum && window.ethereum.selectedAddress) {
      const wallet = window.ethereum.selectedAddress.toLowerCase();
      setWalletAddress(wallet);
      fetchLeaderboard(wallet);
    } else {
      fetchLeaderboard(null);
    }
  }, []);

  const getRankIcon = (rank) => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return `#${rank}`;
  };

  const styles = {
    container: {
      maxWidth: '100%',
      padding: '1rem',
      fontFamily: 'Arial, sans-serif',
      backgroundColor: '#075ad0',
      minHeight: '100vh',
      color: 'white',
    },
    leaderboard: {
      marginTop: '2rem',
      padding: '1rem',
      background: '#ffffff11',
      borderRadius: '8px',
      maxWidth: '95%',
      width: '600px',
      marginLeft: 'auto',
      marginRight: 'auto',
    },
    leaderboardTitle: {
      textAlign: 'center',
      fontSize: 'clamp(1.5rem, 6vw, 2.5rem)',
      marginBottom: '1rem',
      fontWeight: 'bold',
    },
    yourRankText: {
      textAlign: 'center',
      fontSize: '1.25rem',
      marginBottom: '1rem',
      fontWeight: '600',
    },
    leaderboardList: {
      listStyle: 'none',
      paddingLeft: 0,
      fontSize: '1.1rem',
    },
    leaderboardItem: {
      marginBottom: '0.5rem',
      display: 'flex',
      flexWrap: 'wrap',
      alignItems: 'center',
      borderRadius: '6px',
      padding: '0.3rem 0.5rem',
    },
    rank: {
      fontWeight: 'bold',
      marginRight: '0.5rem',
      minWidth: '3rem',
    },
    addressText: {
      flexGrow: 1,
      wordBreak: 'break-word',
      marginRight: '0.5rem',
    },
    count: {
      fontWeight: 'bold',
    },
    loadMoreBtn: {
      display: 'block',
      margin: '1rem auto',
      padding: '0.5rem 1rem',
      backgroundColor: 'white',
      color: '#075ad0',
      borderRadius: '4px',
      fontWeight: 'bold',
      border: 'none',
      cursor: 'pointer',
    },
    backLink: {
      display: 'block',
      textAlign: 'center',
      marginBottom: '1rem',
      textDecoration: 'none',
      fontWeight: 'bold',
      color: 'white',
    },
    connectBtn: {
      display: 'block',
      margin: '1rem auto',
      padding: '0.5rem 1rem',
      fontSize: '1rem',
      fontWeight: 'bold',
      color: '#075ad0',
      backgroundColor: 'white',
      border: 'none',
      borderRadius: '5px',
      cursor: 'pointer',
    },
  };

  return (
    <div style={styles.container}>
      <Link to="/" style={styles.backLink}>← Back to Mint</Link>
      <h1 style={styles.leaderboardTitle}>🏆 Leaderboard</h1>

      {!walletAddress && (
        <button style={styles.connectBtn} onClick={detectWallet}>
          Connect Wallet to See Your Rank
        </button>
      )}

      {walletAddress && (
        <button style={styles.connectBtn} onClick={() => fetchLeaderboard(walletAddress, true)}>
          🔄 Refresh Leaderboard
        </button>
      )}

      {walletAddress && walletRank && (
        <p style={styles.yourRankText}>
          Your Wallet Rank: {getRankIcon(walletRank)}
        </p>
      )}

      <div style={styles.leaderboard}>
        <ol style={styles.leaderboardList}>
          {leaderboard.slice(0, displayCount).map(({ rank, address, count }) => {
            const isUser = walletAddress && address === walletAddress;
            return (
              <li key={rank} style={{
                ...styles.leaderboardItem,
                backgroundColor: isUser ? '#d0e6ff' : 'transparent',
                color: isUser ? '#000' : 'white',
                fontWeight: isUser ? 'bold' : 'normal'
              }}>
                <span style={styles.rank}>{getRankIcon(rank)}</span>
                <span style={styles.addressText}>{address}</span>
                <span style={styles.count}>{count} lit</span>
              </li>
            );
          })}
        </ol>

        {leaderboard.length > displayCount && (
          <button style={styles.loadMoreBtn} onClick={() => setDisplayCount(displayCount + 50)}>
            Load More
          </button>
        )}
      </div>
    </div>
  );
}
