const express = require('express');
const fs = require('fs');
const dataHandler = require('./mobile.json'); // Assuming the file is in the same directory
let cart = require('./cart.json') || []; // Initialize cart with the content of cart.json or as an empty array if the file doesn't exist
const app = express();
// const port = 5000;
var port=process.env.PORT||5000
let admindata = [{
  email: 'admin@test.com',
  password: 'admin123', // Replace with the actual password
  role: 'admin'
},
{
  email: 'test@gmail.com',
  password: 'test123', // Replace with the actual password
  role: 'user'  
}
];

app.use(express.json());
app.use(function (req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept, , authorization"
  );
  res.header("Access-Control-Allow-Methods", "GET,POST,DELETE,PUT,OPTIONS");
  next();
});

app.get('/mobiles', (req, res) => {
  res.json(dataHandler);
});

app.get('/mobile/:id', (req, res) => {
  const mobileId = req.params.id
  console.log(mobileId)
  const mobile = dataHandler.find(mobile => mobile.id == mobileId);
  if (mobile) {
    res.json(mobile);
  } else {
    res.status(404).json({ error: 'Mobile not found' });
  }
});

app.get('/products/:category/:brand', (req, res) => {
  const category = req.params.category;
  const brand = req.params.brand;
console.log(req.query)
  // Get query parameters from the request
  const { assured, ram, rating, price, sort, page, q } = req.query;

  // Apply filters based on query parameters
  let filteredData = dataHandler.filter((mobile) => mobile.category === category && mobile.brand === brand);

  if (assured) {
    filteredData = filteredData.filter((mobile) => mobile.assured === (assured === 'true'));
  }

 // Inside the /products/:category/:brand route handler
if (ram) {
  const ramValues = ram.split(',').map(value => parseInt(value)); // Convert values to integers
  filteredData = filteredData.filter((mobile) => ramValues.includes(mobile.ram));
}


  if (rating) {
    filteredData = filteredData.filter((mobile) => mobile.rating >= parseFloat(rating));
  }

  if (price) {
    const [minPrice, maxPrice] = price.split('-');
    filteredData = filteredData.filter((mobile) => mobile.price >= parseInt(minPrice) && mobile.price <= parseInt(maxPrice));
  }

  // Apply sorting based on query parameter
  if (sort) {
    if (sort === 'asc') {
      filteredData.sort((a, b) => a.price - b.price);
    } else if (sort === 'desc') {
      filteredData.sort((a, b) => b.price - a.price);
    } else if (sort === 'popularity') {
      filteredData.sort((a, b) => b.popularity - a.popularity);
    }
  }

  // Paginate the results based on the page parameter
  if (page) {
    const pageSize = 10; // Adjust the page size as needed
    const startIndex = (page - 1) * pageSize;
    filteredData = filteredData.slice(startIndex, startIndex + pageSize);
  }

  // You can also add a search functionality based on the 'q' parameter
  if (q) {
    const searchQuery = q.toLowerCase();
    filteredData = filteredData.filter((mobile) => mobile.name.toLowerCase().includes(searchQuery));
  }

  res.json(filteredData);
});

app.post('/cart', (req, res) => {
  const { itemId, quantity } = req.body;
  // Validate the input data
  if (!itemId || !quantity || typeof quantity !== 'number' || quantity <= 0) {
    return res.status(400).json({ error: 'Invalid input data' });
  }
  const mobile = dataHandler.find(m => m.id == itemId);
  if (!mobile) {
    return res.status(404).json({ error: 'Mobile not found' });
  }
  // Assuming a cart array in memory
  const cartItem = { mobile, quantity };
  cart.push(cartItem);
  console.log(cart);

  // Write the updated cart data to the cart.json file
  fs.writeFile('./cart.json', JSON.stringify(cart), (err) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to update cart data' });
    }

    res.json({ message: 'Item added to the cart', cart: cartItem });
  });
});
app.post('/admin/login', (req, res) => {
  const { email, password } = req.body;

  // Find the admin with the provided email
  const adminUser = admindata.find(admin => admin.email === email);

  // Check if an admin with the provided email exists and the password matches
  if (adminUser && adminUser.password === password) {
    res.json({ role: adminUser.role });
  } else {
    res.status(401).json({ error: 'Invalid email or password' });
  }
});

// ... (your existing code)

app.get('/cart', (req, res) => {
  res.json(cart);
});

// ... (your existing code)

// ... (your existing code)

app.post('/addProduct', (req, res) => {
  const newProduct = req.body;

  // Validate the input data (Add your own validation logic as needed)
  if (!newProduct || Object.keys(newProduct).length === 0) {
    return res.status(400).json({ error: 'Invalid input data' });
  }

  // Generate a unique 3-digit ID for the new product
  newProduct.id = generateUniqueThreeDigitId();

  // Add the new product to your dataHandler (Assuming you have an array to store products)
  dataHandler.push(newProduct);

  // Write the updated data to the mobile.json file or your data storage
  fs.writeFile('./mobile.json', JSON.stringify(dataHandler), (err) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to update data' });
    }

    res.json({ message: 'Product added successfully', product: newProduct });
  });
});
// ... (your existing code)

// app.listen(port, () => {
//   console.log(`Server is running on port ${port}`);
// });
function generateUniqueThreeDigitId() {
  // Generate a random 3-digit number
  const randomId = Math.floor(100 + Math.random() * 900);

  // Check if the generated ID already exists, if yes, generate again
  if (dataHandler.some((product) => product.id === randomId.toString())) {
    return generateUniqueThreeDigitId();
  }

  return randomId.toString();
}

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
