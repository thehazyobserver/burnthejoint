import LightButton from './LightButton';

export default function NFTGallery({ nfts, onLight, loading }) {
  return (
    <div style={gridStyle}>
      {nfts.map(({ id, isLit, tokenURI }) => (
        <div key={id} style={cardStyle}>
          <img src={tokenURI} alt={`NFT ${id}`} style={imageStyle} />
          <p>#{id} {isLit ? '🔥' : '💨'}</p>
          {!isLit && <LightButton onLight={() => onLight(id)} loading={loading} />}
        </div>
      ))}
    </div>
  );
}

const gridStyle = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: '1rem',
  justifyContent: 'center',
};

const cardStyle = {
  border: '1px solid #ccc',
  padding: '0.8rem',
  borderRadius: '0.5rem',
  textAlign: 'center',
  width: '100%',
  maxWidth: '180px',
  backgroundColor: '#f8f8f8',
};

const imageStyle = {
  width: '100%',
  height: 'auto',
  borderRadius: '0.5rem',
};
