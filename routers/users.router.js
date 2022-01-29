const express = require("express");
const router = express.Router();
const User = require("../models/user.model");
const bcrypt = require("bcryptjs");
require("dotenv/config");
const jwt = require("jsonwebtoken");
const { token } = require("morgan");

router.get(`/`, async (req, res) => {
  const usersList = await User.find().select("-passwordHash");

  if (!usersList) {
    res.status(500).send(userError(500, "No users found!"));
  }
  res.status(200).send({
    users: usersList,
    success: true,
  });
});

router.get(`/:id`, async (req, res) => {
  const user = await User.findById(req.params.id).select("-passwordHash");

  if (!user) {
    res.status(500).send(userError(500, "No users found!"));
  }

  res.status(200).send({
    user: user,
    success: true,
  });
});

router.post(`/register`, async (req, res) => {
  const emailCheck = req.body.email;
  const userExist = await User.findOne({email: emailCheck});
  if(userExist){
    return res.status(404).send(userError(404,`Email: ${emailCheck} already exists!`))
  }
  
  let user = new User({
    name: req.body.name,
    email: req.body.email,
    passwordHash: bcrypt.hashSync(req.body.password, 10),
    phone: req.body.phone,
    isAdmin: req.body.isAdmin,
    street: req.body.street,
    apartment: req.body.apartment,
    zip: req.body.zip,
    city: req.body.city,
    state: req.body.state,
    country: req.body.country,
  });
  user = await user.save();
  if (!user) {
    return res.status(400).send(userError(400, "User not added"));
  }

  res.status(201).send({
    userId: user.id,
    success: true,
    message: `User with id ${user.id} added!`,
  });
});

router.put("/:id", async (req, res) => {
  const userExist = await User.findById(req.params.id);
  if(!userExist){
    res.status(404).send(userError(404,"User does not exist"))
  }
  let newPassword;
  if(req.body.password){
    newPassword = bcrypt.hashSync(req.body.password, 10);
  
  }else{
    newPassword = userExist.passwordHash
  }
  const user = await User.findByIdAndUpdate(
    req.params.id,
    {
      name: req.body.name,
      email: req.body.email,
      passwordHash: newPassword,
      phone: req.body.phone,
      isAdmin: req.body.isAdmin,
      street: req.body.street,
      apartment: req.body.apartment,
      zip: req.body.zip,
      city: req.body.city,
      state: req.body.state,
      country: req.body.country,
    },
    {
      new: true,
    });

  

  if (!user) {
    res.status(500).send(userError(500, "User not updated!"));
  }

  res.status(201).send({
    user: user,
    success: true,
    message: "User added!",
  });
});

router.post('/login', async(req,res)=>{
  const user = await User.findOne({email:req.body.email});

  if(!user){
    return res.status(400).send(userError(400,"Email invalid!"))
  }

  if(user && bcrypt.compareSync(req.body.password, user.passwordHash)){
    const secret = process.env.SECRET;


    const token = jwt.sign(
      {
        userId: user.id,
        isAdmin: user.isAdmin,
        

      },
      secret,
      {
        expiresIn: '1d'
      }
    )
    return res.status(200).send({
      user: user,
      token: token,
      success: true
    })
  }else{
    return res.status(400).send(userError(400,"The password is invalid!"));
  }

 
});

router.delete("/:id", async (req, res) => {
  let user = await User.findByIdAndRemove(req.params.id);
  if (!user) {
    return res.status(404).send(userError(404, "User not found"));
  }

  res.status(200).send({
     success: true, 
     message: "The user was removed",
     userId: user.id });
});

router.get("/get/count", async (req, res) => {
  const userCount = await User.countDocuments();
  if (!userCount) {
    return res.status(500).send(userError(404, "Users not Found!"));
  }

  res.status(200).send({
    userCount: userCount,
    success: true,
  });
});



function userError(code, message) {
  return {
    code: code,
    message: message,
    success: false,
  };
}

module.exports = router;
