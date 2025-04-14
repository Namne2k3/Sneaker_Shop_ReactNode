import { Provider } from 'react-redux'
import { Route, BrowserRouter as Router, Routes } from 'react-router-dom'
import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import Footer from './components/layout/Footer'
import Header from './components/layout/Header'
import LoginPage from './pages/auth/LoginPage'
import RegisterPage from './pages/auth/RegisterPage'
import HomePage from './pages/Home/HomePage'
import { store } from './store'

// Admin pages
import AdminLayout from './components/admin/AdminLayout'
import BrandDetailPage from './pages/admin/brands/BrandDetailPage'
import BrandsPage from './pages/admin/brands/BrandsPage'
import CreateBrandPage from './pages/admin/brands/CreateBrandPage'
import EditBrandPage from './pages/admin/brands/EditBrandPage'
import CategoriesPage from './pages/admin/categories/CategoriesPage'
import CategoryDetailsPage from './pages/admin/categories/CategoryDetailsPage'
import CreateCategoryPage from './pages/admin/categories/CreateCategoryPage'
import EditCategoryPage from './pages/admin/categories/EditCategoryPage'
import DashboardPage from './pages/admin/DashboardPage'
import CreateProductPage from './pages/admin/products/CreateProductPage'
import EditProductPage from './pages/admin/products/EditProductPage'
import EditProductVariantPage from './pages/admin/products/EditProductVariantPage'
import ProductDetailPage from './pages/admin/products/ProductDetailPage'
import ProductsPage from './pages/admin/products/ProductsPage'
import CreateUserPage from './pages/admin/users/CreateUserPage'
import UserDetailPage from './pages/admin/users/UserDetailPage'
import UsersPage from './pages/admin/users/UsersPage'
import ContactPage from './pages/ContactPage'
import ProductDetailClientPage from './pages/Products/ProductDetailPage'
import ProductsClientPage from './pages/Products/ProductsClientPage'
import CartPage from './pages/Cart/CartPage';
import CheckoutPage from './pages/Checkout/CheckoutPage'
import OrderSuccessPage from './pages/OrderSuccess/OrderSuccessPage'
import OrdersPage from './pages/Account/OrdersPage'
import AdminOrdersPage from './pages/admin/orders/OrdersPage'
import AdminOrderDetailPage from './pages/admin/orders/OrderDetailPage'
import OrderDetailPage from './pages/Account/OrderDetailPage'
import ProfilePage from './pages/Account/ProfilePage'
import CouponsPage from './pages/admin/coupons/CouponsPage'
import CreateCouponPage from './pages/admin/coupons/CreateCouponPage'
import EditCouponPage from './pages/admin/coupons/EditCouponPage'
import { Suspense } from 'react'
import LoadingSpinner from './components/common/LoadingSpinner'

function App() {
  return (
    <Provider store={store}>
      <Router>
        <ToastContainer position="top-right" autoClose={3000} />
        <Routes>
          <Route path="/admin" element={
            <AdminLayout>
              <DashboardPage />
            </AdminLayout>
          } />
          <Route path="/admin/products" element={
            <AdminLayout>
              <ProductsPage />
            </AdminLayout>
          } />

          <Route path="/admin/products/:slug/edit" element={
            <AdminLayout>
              <EditProductPage />
            </AdminLayout>
          } />
          <Route path="/admin/products/:slug/variants" element={
            <AdminLayout>
              <EditProductVariantPage />
            </AdminLayout>
          } />

          <Route path="/admin/products/create" element={
            <AdminLayout>
              <CreateProductPage />
            </AdminLayout>
          } />
          <Route path="/admin/products/:id" element={
            <AdminLayout>
              <ProductDetailPage />
            </AdminLayout>
          } />

          <Route path="/admin/categories" element={
            <AdminLayout>
              <CategoriesPage />
            </AdminLayout>
          } />
          <Route path="/admin/categories/:slug" element={
            <AdminLayout>
              <CategoryDetailsPage />
            </AdminLayout>
          } />
          <Route path="/admin/categories/:slug/edit" element={
            <AdminLayout>
              <EditCategoryPage />
            </AdminLayout>
          } />
          <Route path="/admin/categories/create" element={
            <AdminLayout>
              <CreateCategoryPage />
            </AdminLayout>
          } />

          <Route path="/admin/brands" element={
            <AdminLayout>
              <BrandsPage />
            </AdminLayout>
          } />
          <Route path="/admin/brands/create" element={
            <AdminLayout>
              <CreateBrandPage />
            </AdminLayout>
          } />
          <Route path="/admin/brands/:slug/edit" element={
            <AdminLayout>
              <EditBrandPage />
            </AdminLayout>
          } />
          <Route path="/admin/brands/:slug" element={
            <AdminLayout>
              <BrandDetailPage />
            </AdminLayout>
          } />

          <Route path="/admin/users" element={
            <AdminLayout>
              <UsersPage />
            </AdminLayout>
          } />
          <Route path="/admin/users/:id" element={
            <AdminLayout>
              <UserDetailPage />
            </AdminLayout>
          } />
          <Route path="/admin/users/create" element={
            <AdminLayout>
              <CreateUserPage />
            </AdminLayout>
          } />
          <Route path="/admin/orders" element={
            <AdminLayout>
              <AdminOrdersPage />
            </AdminLayout>
          } />
          <Route path="/admin/orders/:id" element={
            <AdminLayout>
              <AdminOrderDetailPage />
            </AdminLayout>
          } />
          <Route path="/admin/coupons" element={
            <AdminLayout>
              <CouponsPage />
            </AdminLayout>
          } />
          <Route path="/admin/coupons/create" element={
            <AdminLayout>
              <CreateCouponPage />
            </AdminLayout>
          } />
          <Route path="/admin/coupons/edit/:id" element={
            <AdminLayout>
              <EditCouponPage />
            </AdminLayout>
          } />

          <Route path="/" element={
            <div className="flex flex-col min-h-screen">
              <Header />
              <main className="flex-grow">
                <HomePage />
              </main>
              <Footer />
            </div>
          } />
          <Route
            path='/contact'
            element={<ContactPage />}
          />
          <Route path="/products" element={
            <div className="flex flex-col min-h-screen">
              <Header />
              <main className="flex-grow">
                <ProductsClientPage />
              </main>
              <Footer />
            </div>
          } />

          <Route path="/products/:slug" element={
            <div className="flex flex-col min-h-screen">
              <Header />
              <main className="flex-grow">
                <Suspense fallback={<LoadingSpinner />}>
                  <ProductDetailClientPage />
                </Suspense>
              </main>
              <Footer />
            </div>
          } />

          <Route path="/login" element={
            <div className="flex flex-col min-h-screen">
              <Header />
              <main className="flex-grow">
                <Suspense fallback={<LoadingSpinner />}>
                  <LoginPage />
                </Suspense>
              </main>
              <Footer />
            </div>
          } />
          <Route path="/register" element={
            <div className="flex flex-col min-h-screen">
              <Header />
              <main className="flex-grow">
                <Suspense fallback={<LoadingSpinner />}>
                  <RegisterPage />
                </Suspense>
              </main>
              <Footer />
            </div>
          } />
          <Route path="/cart" element={
            <div className="flex flex-col min-h-screen">
              <Header />
              <main className="flex-grow">
                <Suspense fallback={<LoadingSpinner />}>
                  <CartPage />
                </Suspense>
              </main>
              <Footer />
            </div>
          } />
          <Route path="/checkout" element={
            <div className="flex flex-col min-h-screen">
              <Header />
              <main className="flex-grow">
                <Suspense fallback={<LoadingSpinner />}>
                  <CheckoutPage />
                </Suspense>
              </main>
              <Footer />
            </div>
          } />
          <Route path="/order-success" element={
            <div className="flex flex-col min-h-screen">
              <Header />
              <main className="flex-grow">
                <Suspense fallback={<LoadingSpinner />}>
                  <OrderSuccessPage />
                </Suspense>
              </main>
              <Footer />
            </div>
          } />
          <Route path="/orders" element={
            <div className="flex flex-col min-h-screen">
              <Header />
              <main className="flex-grow">
                <Suspense fallback={<LoadingSpinner />}>
                  <OrdersPage />
                </Suspense>
              </main>
              <Footer />
            </div>
          } />
          <Route path="/account/orders/:id" element={
            <div className="flex flex-col min-h-screen">
              <Header />
              <main className="flex-grow">
                <Suspense fallback={<LoadingSpinner />}>
                  <OrderDetailPage />
                </Suspense>
              </main>
              <Footer />
            </div>
          } />
          <Route path="/profile" element={
            <div className="flex flex-col min-h-screen">
              <Header />
              <main className="flex-grow">
                <Suspense fallback={<LoadingSpinner />}>
                  <ProfilePage />
                </Suspense>
              </main>
              <Footer />
            </div>
          } />
        </Routes>
      </Router>
    </Provider>
  )
}

export default App
