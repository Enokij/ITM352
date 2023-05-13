function setPrice(item_id, products, sales_record, discount, dynamic) {
<<<<<<< HEAD
    const now = new Date();
    const discountRates = {
      24: 10,
      48: 30,
      72: 60,
      96: 95, 
    };
  
  
    for (let category in products) {
      products[category].forEach((product) => {
        if (item_id === '*' || product.id === item_id) {
          if (dynamic) {
            const sales = sales_record.filter(
              (record) =>
                record.item_id === product.id &&
                now - new Date(record.date) < 96 * 60 * 60 * 1000
            );
            let dynamicDiscount = 0;
            for (let hours in discountRates) {
              if (sales.every((record) => now - new Date(record.date) >= hours * 60 * 60 * 1000)) {
                dynamicDiscount = discountRates[hours];
              }
            }
            product.price = product.price * (1 - dynamicDiscount / 100);
          } else {
            product.price = product.price * (1 - discount / 100);
          }
        }
      });
    }
  }
  
  
  module.exports = {
    setPrice,
=======
  const now = new Date();
  const discountRates = {
    24: 10,
    48: 30,
    72: 60,
    96: 95,
>>>>>>> c84ad11f290ae1d7a4fb129cdc4b51e98534de92
  };
  for (let category in products) {
    products[category].forEach((product) => {
      if (item_id === '*' || product.id === item_id) {
        if (dynamic) {
          const sales = sales_record.filter((record) =>
            record.item_id === product.id &&
            record.Customer_Id &&
            record.Quantity_sold > 0 &&
            record.date &&
            now - new Date(record.date) < 96 * 60 * 60 * 1000
          );
          let dynamicDiscount = 0;
          for (let hours in discountRates) {
            if (sales.every((record) => now - new Date(record.date) >= hours * 60 * 60 * 1000)) {
              dynamicDiscount = discountRates[hours];
            }
          }
          product.price = Number((product.price * (1 - dynamicDiscount / 100)).toFixed(2));
        } else {
          product.price = Number((product.price * (1 - discount / 100)).toFixed(2));
        }
      }
    });
  }
}

module.exports = {
  setPrice,
};