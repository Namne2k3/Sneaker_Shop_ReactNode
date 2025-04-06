import express from 'express'
import connectDB from './configs/mongodbConfig.js'
import dotenv from 'dotenv'
import configMiddlewares from './configs/middlewareConfig.js'
import configRoutes from './configs/routeConfig.js'

dotenv.config()

const app = express();

// Connect to MongoDB
connectDB();

// middlewares
configMiddlewares(app)
configRoutes(app)

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
})

