import express from 'express'
import cors from 'cors'
import errorHandler from '../middlewares/errorMiddleware.js'
import bodyParser from 'body-parser'

const configMiddlewares = (app) => {
    // Enable CORS
    app.use(cors({
        origin: ['http://localhost:5173', 'http://localhost:5174'], // Allow all origins
        methods: ['GET', 'POST', 'PUT', 'DELETE'], // Allowed HTTP methods
        allowedHeaders: ['Content-Type', 'Authorization'], // Allowed headers
    }))

    // Body parser
    app.use(express.json())
    app.use(bodyParser.json())
    app.use(express.urlencoded({ extended: true }))

    // Static files
    app.use(express.static('public'))


    // Custom middleware for logging requests
    app.use((req, res, next) => {
        console.log(`${req.method} ${req.url}`)
        next()
    })
    app.use(errorHandler)

    return app;
}

export default configMiddlewares