import { useState, useEffect } from 'react';
import { ethers } from 'ethers';

export default function LeaderboardPage({ contract, account }) {
  const [leaderboard, setLeaderboard] = useState([]);
  const [displayCount, setDisplayCount] = useState(50);

  const fetchLeaderboard = async () => {
    if (!contract) return;
    try {
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
            if (owner) litMap[owner] = (litMap[owner] || 0) + 1;
          });
        }
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
    if (contract) fetchLeaderboard();
  }, [contract]);

  const getRankIcon = (rank) => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return `#${rank}`;
  };

  const styles = {
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
      fontSize: '1.5rem',
    },
    leaderboardItem: {
      marginBottom: '0.5rem',
      display: 'flex',
      alignItems: 'center',
      borderRadius: '6px',
      padding: '0.3rem 0.5rem',
    },
    rank: {
      fontWeight: 'bold',
      marginRight: '0.5rem',
      width: '3rem',
    },
    addressText: {
      flexGrow: 1,
      overflowWrap: 'anywhere',
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
    },
  };

  return (
    <div style={{ padding: '1rem' }}>
      <h1 style={{ textAlign: 'center', marginBottom: '1rem' }}>🏆 Leaderboard</h1>
      <p style={styles.leaderboardNote}>
        Climb the leaderboard to secure whitelist spots for Pass the $JOINT's upcoming project
      </p>
      <div style={styles.leaderboard}>
        <ol style={styles.leaderboardList}>
          {leaderboard.slice(0, displayCount).map(({ rank, address, count }) => (
            <li
              key={rank}
              style={{
                ...styles.leaderboardItem,
                backgroundColor: address === account ? '#d0e6ff' : 'transparent',
                fontWeight: address === account ? 'bold' : 'normal',
              }}
            >
              <span style={styles.rank}>{getRankIcon(rank)}</span>{' '}
              <span style={styles.addressText}>{address}</span>{' '}
              <span style={styles.count}>{count} lit</span>
            </li>
          ))}
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