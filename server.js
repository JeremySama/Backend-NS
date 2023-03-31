const app = require("./app");
const connectDatabase = require("./config/database");
const path = require("path");
const cloudinary = require("cloudinary");
// const dotenv = require('dotenv');
require("dotenv").config({ path: "./config/.env" });

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// cloudinary.config({
//   cloudname: "dctuofruu",
//   api_key: "382973281519661",
//   api_secret: "JQJb8rw22rJ9Q9HVhXr_rj0dl5w",
// });

connectDatabase();
console.log(process.env.DATABASE);

app.listen(process.env.PORT, () => {
  console.log(
    `server started on port:' ${process.env.PORT} in ${process.env.NODE_ENV} mode`
  );
});
