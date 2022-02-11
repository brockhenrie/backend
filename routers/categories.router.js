const express = require("express");
const router = express.Router();
const Category = require("../models/category.model");

router.get(`/`, async (req, res) => {
  
  const categoriesList = await Category.find()
  if(!categoriesList){
    return res.status(404).send(categoryError(404, "Category not found"))
    }

  res.status(200).json(categoriesList);
});

router.get("/:id", async (req, res) => {
  const category = await Category.findById(req.params.id);

  if(!category){
    return res.status(404).send(categoryError(404, "Category not found"))
    }

  res.status(200).json(category);
});

router.put("/:id", async (req, res) => {
  const id = req.params.id;
  const category = await Category.findByIdAndUpdate(
    id,
    {
      name: req.body.name,
      icon: req.body.icon,
      color: req.body.color,
    },
    { new: true }
  );
  if(!category){
    return res.status(404).send(categoryError( 404, "Category not found"));
    }   

  res.status(201).json({
    category: category,
    success: true,
    message: "Category updated!",
  });
});

router.post(`/`, async (req, res) => {
  let category = new Category({
    name: req.body.name,
    icon: req.body.icon,
    color: req.body.color,
  });
  category = await category
    .save()
    if(!category){
        return res.status(404).send(categoryError(500, "Category not found"))
        }
  

  res.status(201).send({
    category: category,
    success: true,
    message: "Category added!",
  });
});

router.delete("/:categoryId", async (req, res) => {
  let category = await Category.findByIdAndRemove(req.params.categoryId)
  if(!category){
    return res.status(404).send(categoryError(404, "Category not found"))
    }

  res.status(200).send({ success: true, message: "The category was removed" });
});

function categoryError( code, message) {
  return{
    code: code,
    message: message,
    success: false,
  };
}

module.exports = router;
