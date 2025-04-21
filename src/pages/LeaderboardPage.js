import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ethers } from 'ethers';

const CONTRACT_ADDRESS = '0x5e4C6B87B644430Fa71F9158B5292808756b7D44';
const SONIC_RPC = 'https://sonic.drpc.org';
const contractABI = require('../abi/LIGHTTHEJOINT.json');

export default function LeaderboardPage() {
  const [leaderboard, setLeaderboard] = useState([]);
  const [displayCount, setDisplayCount] = useState(50);
  const [walletAddress, setWalletAddress] = useState(null);
  const [walletRank, setWalletRank] = useState(null);

  const fetchLeaderboard = async (detectedWallet = null) => {
    try {
      const provider = new ethers.JsonRpcProvider(SONIC_RPC);
      const contract = new ethers.Contract(CONTRACT_ADDRESS, contractABI, provider);

      const totalBN = await contract.totalSupply();
      const total = totalBN.toNumber();
      const litMap = {};
      const batchSize = 250;

      for (let i = 1; i <= total; i += batchSize) {
        const end = Math.min(total, i + batchSize - 1);
        const statusPromises = [];
        for (let j = i; j <= end; j++) {
          statusPromises.push(
            contract
              .getLitStatus(j)
              .then((isLit) => (isLit ? j : null))
              .catch(() => null)
          );
        }

        const litTokenIds = (await Promise.all(statusPromises)).filter((id) => id !== null);
        if (litTokenIds.length) {
          const ownerPromises = litTokenIds.map((id) =>
            contract.ownerOf(id).catch(() => null)
          );
          const owners = await Promise.all(ownerPromises);
          owners.forEach((owner) => {
            if (owner) litMap[owner.toLowerCase()] = (litMap[owner.toLowerCase()] || 0) + 1;
          });
        }
      }

      const sorted = Object.entries(litMap)
        .sort(([, a], [, b]) => b - a)
        .map(([address, count], index) => ({ rank: index + 1, address, count }));

      setLeaderboard(sorted);

      if (detectedWallet) {
        const entry = sorted.find(
          (entry) => entry.address.toLowerCase() === detectedWallet.toLowerCase()
        );
        if (entry) setWalletRank(entry.rank);
      }
    } catch (err) {
      console.error(err);
    }
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
      alert('MetaMask not found. Please install it to connect your wallet.');
    }
  };

  useEffect(() => {
    if (window.ethereum && window.ethereum.selectedAddress) {
      const wallet = window.ethereum.selectedAddress.toLowerCase();
      setWalletAddress(wallet);
      fetchLeaderboard(wallet);
    } else {
      fetchLeaderboard(null); // still fetch leaderboard for read-only view
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
      margin: 0,
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
      color: 'white',
      maxWidth: '95%',
      width: '600px',
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
      fontSize: 'clamp(1.5rem, 6vw, 2.5rem)',
      marginBottom: '1rem',
      fontWeight: 'bold',
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
      margin: '1rem auto 0',
      padding: '0.5rem 1rem',
      fontSize: '1rem',
      borderRadius: '4px',
      cursor: 'pointer',
      backgroundColor: 'white',
      color: '#075ad0',
      fontWeight: 'bold',
      border: 'none',
    },
    backLink: {
      display: 'block',
      textAlign: 'center',
      marginBottom: '1rem',
      textDecoration: 'none',
      fontWeight: 'bold',
      color: 'white',
    },
    yourRankText: {
      textAlign: 'center',
      fontSize: '1.25rem',
      marginBottom: '1rem',
      fontWeight: '600',
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

      {walletAddress && walletRank && (
        <p style={styles.yourRankText}>
          Your Wallet Rank: {getRankIcon(walletRank)}
        </p>
      )}

      <p style={styles.leaderboardNote}>
        Climb the leaderboard to secure whitelist spots for Pass the $JOINT's upcoming project
      </p>

      <div style={styles.leaderboard}>
        <ol style={styles.leaderboardList}>
          {leaderboard.slice(0, displayCount).map(({ rank, address, count }) => {
            const isUser = walletAddress && address.toLowerCase() === walletAddress;
            return (
              <li
                key={rank}
                style={{
                  ...styles.leaderboardItem,
                  backgroundColor: isUser ? '#d0e6ff' : 'transparent',
                  fontWeight: isUser ? 'bold' : 'normal',
                  color: isUser ? '#000' : 'white',
                }}
              >
                <span style={styles.rank}>{getRankIcon(rank)}</span>
                <span style={styles.addressText}>{address}</span>
                <span style={styles.count}>{count} lit</span>
              </li>
            );
          })}
        </ol>

        {leaderboard.length > displayCount && (
          <button
            style={styles.loadMoreBtn}
            onClick={() => setDisplayCount(displayCount + 50)}
          >
            Load More
          </button>
        )}
      </div>
    </div>
  );
}
