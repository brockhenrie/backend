const express = require("express");
const OrderItem = require("../models/order-item.model");
const router = express.Router();
const Order = require("../models/order.model");
const Product = require("../models/product.model");
const stripe = require('stripe')('sk_test_51KVk8kKj3kdwtQkGBA2TqyvkwU8w4nsGp2sLpCcYzjHT8vcCZijCGJA2RRBuzxIVll9QF6B13CAtXR7UqvUF4BAk00j172vJ9K');

router.get(`/`, async (req, res) => {
  const ordersList = await Order.find()
    .populate("user", "name")
    .sort({ dateOrdered: -1 });
 
  if (!ordersList) {
    es.status(500).json({
      error: err,
      success: false,
    });
  }

  res.status(200).json(ordersList);
});

router.get(`/allData`, async (req, res) => {
  const ordersList = await Order.find()
    .populate("user", "name")
    .populate({
      path: "orderItems",
      populate: {
        path: "product",
        populate: "category",
      },
    })
    .sort({ dateOrdered: -1 });
 
  if (!ordersList) {
    es.status(500).json({
      error: err,
      success: false,
    });

  }
  res.status(200).json(ordersList);
});

router.get(`/:id`, async (req, res) => {
  const order = await Order.findById(req.params.id)
    .populate("user", "name")
    .populate({
      path: "orderItems",
      populate: {
        path: "product",
        populate: "category",
      },
    })
    .sort({ dateOrdered: -1 });
  
  if (!order) {
    es.status(500).json({
      error: err,
      success: false,
    });
  }
  res.status(200).json(order);
});

router.get(`/get/userOrders/:id`, async (req, res) => {
    const ordersList = await Order.find({user: req.params.id})
      .populate({
        path: "orderItems",
        populate: {
          path: "product",
          populate: "category",
        },
      })
      .sort({ dateOrdered: -1 });
    
    if (!ordersList) {
      es.status(500).json({
        error: err,
        success: false,
      });
    }
    res.status(200).json(ordersList);
  });
  

router.get("/get/count", async (req, res) => {
    const orderCount = await Order.countDocuments();
    if (!orderCount) {
      return res.status(404).send(orderError(404, "Orders not Found!"));
    }
  
    res.status(200).json(orderCount);
  });

  //total sales
router.get('/get/totalsales', async (req,res)=>{
    const totalSales = await Order.aggregate([
        //find sum of all totalPrice
        {$group: {_id: null, totalsales: {$sum: '$totalPrice'}}}
    ])

    if(!totalSales){
        return res.status(400).send(orderError(400, 'The order sales cannot be generated'))
    }

    res.status(200).json(totalSales);
})

router.post(`/`, async (req, res) => {
  const orderItemIds = Promise.all(
    req.body.orderItems.map(async (orderItem) => {
      let newOrderItem = new OrderItem({
        quantity: orderItem.quantity,
        product: orderItem.product,
      });

      newOrderItem = await newOrderItem.save();

      return newOrderItem._id;
    })
  );

  const orderItemIdsResolved = await orderItemIds;

  const totalPrices = await Promise.all( orderItemIdsResolved.map(async (orderItemId)=>{
      const orderItem = await OrderItem.findById(orderItemId).populate('product', 'price');
      // console.log(orderItem)
      const totalPrice = orderItem.quantity * orderItem.product.price;
      return totalPrice;
  }))
  const totalPrice = totalPrices.reduce((a,b)=> a + b, 0);

  let order = new Order({
    orderItems: orderItemIdsResolved,
    shippingAddress1: req.body.shippingAddress1,
    shippingAddress2: req.body.shippingAddress2,
    city: req.body.city,
    state: req.body.state,
    country: req.body.country,
    zip: req.body.zip,
    status: req.body.status,
    totalPrice: totalPrice,
    user: req.body.user,
    dateOrdered: req.body.dateOrdered,
    phone: req.body.phone,
  });
  order = await order.save();
  if (!order) {
    return res.status(500).send(orderError(500, "Order not placed"));
  }

  res.status(200).json(order); 
});

router.put("/:id", async (req, res) => {
  const order = await Order.findByIdAndUpdate(
    req.params.id,
    {
      status: req.body.status,
    },
    { new: true }
  );

  if (!order) {
    return res.status(500).send(orderError(500, "Order not placed!"));
  }

  res.status(201).json(order);
});

router.delete("/:id", async (req, res) => {
  const order = await Order.findByIdAndDelete(req.params.id);
  if (!order) {
    return res.status(500).send(orderError(500, "Order not found!"));
  } else {
    const orderItemIds = Promise.all(
      order.orderItems.map(async (orderItemId) => {
        const deletedId = await OrderItem.findByIdAndDelete(orderItemId);
        if (!deletedId) {
          return res
            .status(500)
            .send(orderError(500, "Order item delete failed!"));
        }
        return deletedId;
      })
    );
    const deletedIds = await orderItemIds;

    res.status(201).json(order);
  };
});

router.post('/create-checkout-session', async (req,res)=>{
  const orderItems = req.body;
  if(!orderItems) return res.status(400).json(orderError(400, 'No order items'))
  console.log(orderItems)
  // map order to stripe format
  const lineItems= await Promise.all(
    orderItems.map(async (orderItem)=>{
      const product = await Product.findById(orderItem.product);
     
      return {
        price_data:{
          currency: 'usd',
          product_data:{
            name: product.name
          },
          unit_amount: product.price * 100,
        },
        quantity: orderItem.quantity
      };
    })
  )
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    line_items: lineItems,
    mode:'payment',
    success_url: 'http://localhost:4200/success',
    cancel_url:  'http://localhost:4200/paymentError',
  });

  res.json({
    id: session.id
  })
})



function orderError(code, message) {
  return {
    code: code,
    message: message,
    success: false,
  };
}

module.exports = router;

//  {
//      "orderItems": [
//          {
//              "quanitity": 3,
//              "product": "61f4865c747816e40f0dfa54"
//          },
//          {
//                  "quanitity": 2,
//                  "product": "61f4868bcbe0723cb8950889"
//           },
//           {
//             "quanitity": 1,
//             "product": "61f4868fcbe0723cb895088c"
//      }
//      ],
//      "shippingAddress1":"123 4th st",
//      "shippingAddress2":"411a",
//      "city":"mesa",
//      "state":"Az",
//      "zip": "85213",
//      "country": "USA",
//      "user":"61f493513a886bdc57b603df"
//  }
