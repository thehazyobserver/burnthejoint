export default function LightButton({ onLight, loading }) {
    return (
      <button style={buttonStyle} onClick={onLight} disabled={loading}>
        Light it
      </button>
    );
  }
  
  const buttonStyle = {
    backgroundColor: '#222',
    color: '#fff',
    padding: '0.5rem',
    fontSize: '0.9rem',
    border: 'none',
    borderRadius: '0.5rem',
    cursor: 'pointer',
    marginTop: '0.5rem',
    width: '100%',
  };
  