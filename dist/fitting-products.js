const gorur = 'Gorur Ghash';
const rebels = 'Wrongs & Rebels';
const gg = 'https://gorurghash.com/product/';
const wr = 'https://wrclo.com/products/';

export const products = [
  ['maroon', 'Diamond Knit Polo in Maroon', gorur, 1500, 'Polo', gg + 'diamond-knit-polo-in-maroon/', ['S','M','L','XL','XXL']],
  ['flight', 'W&R Flight Boxy T-Shirt', rebels, 1399, 'T-Shirts', wr + 'wr-flight-boxy-tshirt-black', ['XS','S','M','L','XL','2XL']],
  ['pearl', 'W&R Pearl Boxy T-Shirt', rebels, 1399, 'T-Shirts', wr + 'wr-pearl-boxy-tshirt'],
  ['yard', 'W&R Yard Baggy Pants', rebels, 1899, 'Bottoms', wr + 'wr-yard-baggy-denim-pants'],
  ['coast', 'W&R Coast Boxy Shirt', rebels, 1799, 'Shirts', wr + 'wr-coast-boxy-check-shirt'],
  ['stripe', 'Unisex Half-Sleeve Knitted Polo in Navy, Maroon and Cream', gorur, 1750, 'Polo', gg + 'unisex-half-sleeve-knitted-polo-in-navy-maroon-and-cream/'],
  ['stallion', 'W&R Black Stallion Baggy Denim Pant', rebels, 1499, 'Bottoms', wr + 'w-r-black-stallion-baggy-denim-pant']
].map(([asset,name,brand,price,category,url,sizes])=>({image:'assets/'+asset+'.jpg',name,brand,price,category,url,sizes}));
