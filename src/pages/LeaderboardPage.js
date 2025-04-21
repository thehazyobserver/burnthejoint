import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

const GRAPH_ENDPOINT = 'https://api.studio.thegraph.com/query/109706/lightthejoint/version/latest';

async function fetchAllLitEvents() {
  const allEvents = [];
  let skip = 0;
  const batchSize = 1000;
  let keepFetching = true;

  while (keepFetching) {
    const query = `{
      jointLits(first: ${batchSize}, skip: ${skip}, orderBy: tokenId, orderDirection: asc) {
        tokenId
        id
        owner
      }
    }`;

    const response = await fetch(GRAPH_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query }),
    });

    const { data } = await response.json();
    const events = data?.jointLits || [];
    allEvents.push(...events);

    if (events.length < batchSize) {
      keepFetching = false;
    } else {
      skip += batchSize;
    }
  }

  return allEvents;
}

export default function LeaderboardPage() {
  const [leaderboard, setLeaderboard] = useState([]);
  const [displayCount, setDisplayCount] = useState(50);
  const [walletAddress, setWalletAddress] = useState(null);
  const [walletRank, setWalletRank] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchLeaderboard = async (detectedWallet = null) => {
    setLoading(true);
    try {
      const events = await fetchAllLitEvents();
      const litMap = {};

      for (const { owner } of events) {
        const addr = owner.toLowerCase();
        litMap[addr] = (litMap[addr] || 0) + 1;
      }

      const sorted = Object.entries(litMap)
        .sort(([, a], [, b]) => b - a)
        .map(([address, count], index) => ({ rank: index + 1, address, count }));

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
        <button style={styles.connectBtn} onClick={() => fetchLeaderboard(walletAddress)}>
          🔄 Refresh Leaderboard
        </button>
      )}

      {loading && <p style={{ textAlign: 'center', fontWeight: 'bold' }}>Loading leaderboard...</p>}

      {walletAddress && walletRank && (
        <p style={styles.yourRankText}>Your Wallet Rank: {getRankIcon(walletRank)}</p>
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
