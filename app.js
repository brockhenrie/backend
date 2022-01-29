const express = require('express');
require('dotenv/config');
const  mongoose = require('mongoose');
const morgan = require("morgan");
const cors = require('cors');
const authJwt = require('./helpers/jwt');
const errorHandler = require('./helpers/error-handler')


const app = express();

const api = process.env.API_URL;

app.use(cors());
app.options('*', cors());


const productsRouter = require('./routers/products.router');
const categoriesRouter = require('./routers/categories.router');
const usersRouter = require('./routers/users.router');
const ordersRouter = require('./routers/orders.router');


//middleware
app.use(express.json());
app.use(morgan('tiny'));
app.use(authJwt());
app.use(errorHandler);


//routes
app.use(`${api}products/`,productsRouter );
app.use(`${api}users/`,usersRouter );
app.use(`${api}orders/`,ordersRouter );
app.use(`${api}categories/`,categoriesRouter );


mongoose.connect(process.env.DATABASE_CONNECT_DOCKER,{
    useNewUrlParser: true,
    useUnifiedTopology: true,
    dbName: 'eshop-database'
})
.then(()=>{
    console.log('DB connection ready')
})
.catch((err)=>{
    console.log(err);
});

app.listen(3000, ()=>{
    
    console.log('Server is running on http://localhost:3000')
})




