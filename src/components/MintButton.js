export default function MintButton({ onMint, loading }) {
    return (
      <button style={buttonStyle} onClick={onMint} disabled={loading}>
        Mint 1 JOINT NFT!
      </button>
    );
  }
  
  const buttonStyle = {
    backgroundColor: '#222',
    color: '#fff',
    padding: '0.7rem 1.4rem',
    fontSize: '1rem',
    border: 'none',
    borderRadius: '0.5rem',
    margin: '0.5rem auto',
    cursor: 'pointer',
    display: 'block',
    width: '90%',
    maxWidth: '300px',
  };
  