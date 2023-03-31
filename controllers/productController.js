const Product = require("../models/product");
const APIFeatures = require("../utils/apiFeatures");
const cloudinary = require("cloudinary");

//create new product
// exports.newProduct = async (req, res, next) => {
//   console.log(req.body);
//   const product = await Product.create(req.body);
//   res.status(201).json({
//     success: true,
//     product,
//   });
// };

exports.newProduct = async (req, res, next) => {
  let images = [];

  if (typeof req.body.images === "string") {
    images.push(req.body.images);
  } else {
    images = req.body.images;
  }

  let imagesLinks = [];

  for (let i = 0; i < images.length; i++) {
    const result = await cloudinary.v2.uploader.upload(images[i], {
      folder: "products",
    });

    imagesLinks.push({
      public_id: result.public_id,

      url: result.secure_url,
    });
  }

  req.body.images = imagesLinks;

  req.body.user = req.user.id;

  const product = await Product.create(req.body);

  res.status(201).json({
    success: true,

    product,
  });
};

// exports.getProducts = async (req, res, next) => {
// 	const products = await Product.find();
// 	res.status(200).json({
// 		success: true,
// 		count: products.length,
// 		products
// 	})
// }

exports.getProducts = async (req, res, next) => {
  const resPerPage = 4;
  const productsCount = await Product.countDocuments();
  // console.log(productsCount,req.query,Product.find())
  // console.log(Product.find())
  const apiFeatures = new APIFeatures(Product.find(), req.query)
    .search()
    .filter();
  // const apiFeatures = new APIFeatures(Product.find(), req.query).search()

  // const products = await Product.find();
  apiFeatures.pagination(resPerPage);
  let products = await apiFeatures.query;
  let filteredProductsCount = products.length;
  apiFeatures.pagination(resPerPage);

  // console.log(products)
  res.status(200).json({
    success: true,
    // count: products.length,
    productsCount,
    products,
    resPerPage,
    filteredProductsCount,
  });
};

// exports.getSingleProduct = async (req, res, next) => {
// 	const product = await Product.findById(req.params.id);
// 	if (!product) {
// 		return res.status(404).json({
// 			success: false,
// 			message: 'Product not found'
// 		})
// 	}
// 	res.status(200).json({
// 		success: true,
// 		product
// 	})
// }

exports.getSingleProduct = async (req, res, next) => {
  const product = await Product.findById(req.params.id);
  console.log(product);
  // if(!product) {
  // 		return res.status(404).json({
  // 			success: false,
  // 			message: 'Product not found'
  // 		});
  // }
  if (!product) {
    return next(new ErrorHandler("Product not found", 404));
  }
  res.status(200).json({
    success: true,
    product,
  });
};

// exports.updateProduct = async (req, res, next) => {
//   let product = await Product.findById(req.params.id);
//   console.log(req.params.id);
//   if (!product) {
//     // return res.status(404).json({
//     // 	success: false,
//     // 	message: 'Product not found'
//     // })
//     return next(new ErrorHandler("Product not found", 404));
//   }
//   product = await Product.findByIdAndUpdate(req.params.id, req.body, {
//     new: true,
//     runValidators: true,
//     useFindandModify: false,
//   });
//   return res.status(200).json({
//     success: true,
//     product,
//   });
// };
exports.updateProduct = async (req, res, next) => {
  let product = await Product.findById(req.params.id);

  if (!product) {
    return next(new ErrorHandler("Product not found", 404));
  }

  let images = [];

  if (typeof req.body.images === "string") {
    images.push(req.body.images);
  } else {
    images = req.body.images;
  }

  if (images !== undefined) {
    // Deleting images associated with the product

    for (let i = 0; i < product.images.length; i++) {
      const result = await cloudinary.v2.uploader.destroy(
        product.images[i].public_id
      );
    }

    let imagesLinks = [];

    for (let i = 0; i < images.length; i++) {
      const result = await cloudinary.v2.uploader.upload(images[i], {
        folder: "products",
      });

      imagesLinks.push({
        public_id: result.public_id,

        url: result.secure_url,
      });
    }

    req.body.images = imagesLinks;
  }

  product = await Product.findByIdAndUpdate(req.params.id, req.body, {
    new: true,

    runValidators: true,

    useFindAndModify: false,
  });

  res.status(200).json({
    success: true,

    product,
  });
};

exports.deleteProduct = async (req, res, next) => {
  const product = await Product.findById(req.params.id);
  if (!product) {
    // return res.status(404).json({
    // 	success: false,
    // 	message: 'Product not found'
    // })
    return next(new ErrorHandler("Product not found", 404));
  }
  await product.remove();
  res.status(200).json({
    success: true,
    message: "Product deleted",
  });
};

exports.createProductReview = async (req, res, next) => {
  const { rating, comment, productId } = req.body;

  const review = {
    user: req.user._id,

    name: req.user.name,

    rating: Number(rating),

    comment,
  };

  const product = await Product.findById(productId);

  const isReviewed = product.reviews.find(
    (r) => r.user.toString() === req.user._id.toString()
  );

  if (isReviewed) {
    product.reviews.forEach((review) => {
      if (review.user.toString() === req.user._id.toString()) {
        review.comment = comment;

        review.rating = rating;
      }
    });
  } else {
    product.reviews.push(review);

    product.numOfReviews = product.reviews.length;
  }

  product.ratings =
    product.reviews.reduce((acc, item) => item.rating + acc, 0) /
    product.reviews.length;

  await product.save({ validateBeforeSave: false });

  res.status(200).json({
    success: true,
  });
};

exports.getProductReviews = async (req, res, next) => {
  const product = await Product.findById(req.query.id);

  res.status(200).json({
    success: true,

    reviews: product.reviews,
  });
};

exports.deleteReview = async (req, res, next) => {
  const product = await Product.findById(req.query.productId);

  console.log(req);

  const reviews = product.reviews.filter(review => review._id.toString() !== req.query.id.toString());

  const numOfReviews = reviews.length;

  const ratings = product.reviews.reduce((acc, item) => item.rating + acc, 0) / reviews.length

  await Product.findByIdAndUpdate(req.query.productId, {
      reviews,
      ratings,
      numOfReviews
  }, {
      new: true,
      runValidators: true,
      useFindAndModify: false
  })

  res.status(200).json({
      success: true
  })
};

// Get all products (Admin)  =>   /api/v1/admin/products

exports.getAdminProducts = async (req, res, next) => {
  const products = await Product.find();

  res.status(200).json({
    success: true,

    products,
  });
};
