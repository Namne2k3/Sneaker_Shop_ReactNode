import authRoutes from '../routes/authRoutes.js'
import productRoutes from '../routes/productRoutes.js'
import categoryRoutes from '../routes/categoryRoutes.js'
import brandRoutes from '../routes/brandRoutes.js'
import sizeRoutes from '../routes/sizeRoutes.js'
import colorRoutes from '../routes/colorRoutes.js'
import userRoutes from '../routes/userRoutes.js'
import orderRoutes from '../routes/orderRoutes.js'
import wishlistRoutes from '../routes/wishlistRoutes.js'

const configRoutes = (app) => {
    // API routes
    app.use('/api/auth', authRoutes)
    app.use('/api/products', productRoutes)
    app.use('/api/categories', categoryRoutes)
    app.use('/api/brands', brandRoutes)
    app.use('/api/sizes', sizeRoutes)
    app.use('/api/colors', colorRoutes)
    app.use('/api/users', userRoutes)
    app.use('/api/orders', orderRoutes)
    app.use('/api/wishlist', wishlistRoutes)

    // Root route
    app.get('/', (req, res) => {
        res.send('API đang chạy...')
    })
}

export default configRoutes