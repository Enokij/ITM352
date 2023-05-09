function setPrice(item_id, products, sales_record, discount, dynamic) {
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
  };
  
  