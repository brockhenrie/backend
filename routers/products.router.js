const express = require("express");
const Category = require("../models/category.model");
const router = express.Router();
const Product = require("../models/product.model");
const mongoose = require("mongoose");
const multer = require('multer');

const FILE_TYPE_MAP = {
  'image/png': 'png',
  'image/jpeg': 'jpeg',
  'image/jpg': 'jpg',

}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const isValid = FILE_TYPE_MAP[file.mimetype];
    let uploadError = new Error('Invalid image type');

    if(isValid){
      uploadError = null
    }
    cb(uploadError, 'public/uploads')
  },
  filename: function (req, file, cb) {
    const extension = FILE_TYPE_MAP[file.mimetype];
    const fileName = file.originalname.split(' ').join('-');
    cb(null,`${fileName}-${Date.now()}.${extension}`)
  }
})

const uploadOptions = multer({ storage: storage })

router.get(`/`, async (req, res) => {
  const productsList = await Product.find().populate("category");
  if (!productsList) {
    return res.status(404).send(productError(404, "Products not Found!"));
  }
  //.select('name image -_id) after find() to get desired fields

  res.status(200).send({
    products: [...productsList],
    success: true,
  });
});

router.get(`/`, async (req, res) => {
  let filter = {};
  if (req.query.categories) {
    filter = { categories: req.query.categories.split(",") };
  }

  const productsList = await Product.find({ category: filter }).populate(
    "category"
  );
  if (!productsList) {
    return res.status(404).send(productError(404, "Products not Found!"));
  }
  //.select('name image -_id) after find() to get desired fields

  res.status(200).send({
    products: [...productsList],
    success: true,
  });
});

router.get("/:id", async (req, res) => {
  const id = req.params.id;
  const product = await Product.findById(id).populate("category");
  if (!product) {
    return res.status(500).send(productError(500, "Product id invalid!"));
  }

  res.status(200).send({
    product: product,
    success: true,
  });
});

router.get("/get/featured/", async (req, res) => {
  const products = await Product.find({
    isFeatured: true,
  });

  if (!products) {
    return res
      .status(404)
      .send(productError(404, "No featured products found!"));
  }

  res.status(200).send({
    featuredProducts: [...products],
    success: true,
  });
});

router.get("/get/count", async (req, res) => {
  const productCount = await Product.countDocuments();
  if (!productCount) {
    return res.status(404).send(productError(404, "Products not Found!"));
  }

  res.status(200).send({
    productCount: productCount,
    success: true,
  });
});

router.get("/get/featured/:count", async (req, res) => {
  const count = req.params.count ? req.params.count : 0;
  const products = await Product.find({
    isFeatured: true,
  }).limit(count);

  if (!products) {
    return res
      .status(404)
      .send(productError(404, "No featured products found!"));
  }

  res.status(200).send({
    featuredProducts: [...products],
    success: true,
  });
});


router.put("/:id", uploadOptions.single('image'), async (req, res) => {
if(!mongoose.isValidObjectId(req.params.id)){
  return res.status(400).json(productError(400,"Invalid product id"))
}

  const category = await Category.findById(req.body.category);
  if (!category)
    return res.status(500).send(categoryError(500, "Category id invalid!"));

    const product = await Product.findById(req.params.id);
    if(!product) return res.status(400).send(productError(400, "Product id invalid!"));

    const file = req.file;
    let imagePath;
    if(file){
      const fileName = file.filename;
      const basePath = `${req.protocol}://${req.get('host')}/public/upload/`;
      imagePath = `${basePath}${fileName}`;
    }else{
      imagePath = product.image;
    }

  const newProduct = await Product.findByIdAndUpdate(
    req.params.id,
    {
      name: req.body.name,
      description: req.body.description,
      richDescription: req.body.richDescription,
      image: imagePath,
      brand: req.body.brand,
      price: req.body.price,
      category: category,
      countInStock: req.body.countInStock,
      rating: req.body.rating,
      numReviews: req.body.numReviews,
      isFeatured: req.body.isFeatured,
    },
    { new: true }
  ).populate("category");

  if (!product) {
    return res.status(400).send(productError(400, "Product id invalid!"));
  }

  res.status(201).send({
    product: product,
    success: true,
    message: "Product updated!",
  });
});

router.delete("/:id", async (req, res) => {
  let product = await Product.findByIdAndRemove(req.params.id);
  if (!product) {
    return res.status(404).send(productError(404, "Product not found"));
  }

  res.status(200).send({ success: true, message: "The product was removed" });
});

router.post(`/`, uploadOptions.single('image'), async (req, res) => {
  const category = await Category.findById(req.body.category);
  const file = req.file;
  if (!category) {
    return res
      .status(400)
      .send(categoryError(err, 400, "Category id invalid!"));
  }
  if(!file){
    return res.status(400).json(productError(400,"No image in request"))
  }
 
  const fileName = file.filename;
  const basePath = `${req.protocol}://${req.get('host')}/public/upload/`;

  
  let product = new Product({
    name: req.body.name,
    description: req.body.description,
    richDescription: req.body.richDescription,
    image: `${basePath}${fileName}`,
    brand: req.body.brand,
    price: req.body.price,
    category: category,
    countInStock: req.body.countInStock,
    rating: req.body.rating,
    numReviews: req.body.numReviews,
    isFeatured: req.body.isFeatured,
  });

  product = await product.save();
  if (!product) {
    return res.status(400).send(productError(err, 500, "Product not saved!"));
  }

  res.status(201).send({
    product: product,
    success: true,
    message: "Product added!",
  });
});

router.put("/gallery-images/:id", uploadOptions.array('images', 10), async (req, res) => {
  if(!mongoose.isValidObjectId(req.params.id)){
    return res.status(400).json(productError(400,"Invalid product id"))
  }

  const files = req.files;
  let imagePaths = [];
  const basePath = `${req.protocol}://${req.get('host')}/public/upload/`;
  if(files){
    files.map(file=>
      imagePaths.push(`${basePath}${file.filename}`))
  }
  if(!files){
    return res.status(400).json(productError(400,"no images in request"));
  }
 
  const product = await Product.findByIdAndUpdate(
    req.params.id,
    {
      images: imagePaths
    },
    { new: true }
  ).populate("category");

  if (!product) {
    return res.status(500).send(productError(500, "Product id invalid!"));
  }

  res.status(201).send({
    product: product,
    success: true,
    message: "Product updated!",
  });

});

function productError(code, message) {
  return {
    code: code,
    message: message,
    success: false,
  };
}

function categoryError(code, message) {
  return {
    code: code,
    message: message,
    success: false,
  };
}

module.exports = router;
