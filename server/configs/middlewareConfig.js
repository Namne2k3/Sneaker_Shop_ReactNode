import express from 'express'
import cors from 'cors'
import errorHandler from '../middlewares/errorMiddleware.js'

const configMiddlewares = (app) => {
    // Enable CORS
    app.use(cors({
        origin: 'http://localhost:5173', // Allow all origins
        methods: ['GET', 'POST', 'PUT', 'DELETE'], // Allowed HTTP methods
        allowedHeaders: ['Content-Type', 'Authorization'], // Allowed headers
    }))

    // Body parser
    app.use(express.json())
    app.use(express.urlencoded({ extended: true }))

    // Static files
    app.use(express.static('public'))


    // Custom middleware for logging requests
    app.use((req, res, next) => {
        console.log(`${req.method} ${req.url}`)
        next()
    })
    app.use(errorHandler)
}

export default configMiddlewares