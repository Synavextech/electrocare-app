import React from 'react';

interface Shop {
  id: string;
  name: string;
  // Add other shop properties as needed
}

interface ShopListProps {
  shops: Shop[];
}

const ShopList: React.FC<ShopListProps> = ({ shops }) => {
  return (
    <div>
      <h2>Shop List</h2>
      {shops.length > 0 ? (
        <ul>
          {shops.map((shop) => (
            <li key={shop.id}>{shop.name}</li>
          ))}
        </ul>
      ) : (
        <p>No shops available.</p>
      )}
    </div>
  );
};

export default ShopList;