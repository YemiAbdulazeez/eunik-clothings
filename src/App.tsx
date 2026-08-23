import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import Layout from "./components/Layout";
import { AccountGate, AtelierGate, StudioGate } from "./components/os/Gates";
import About from "./pages/About";
import AccountAppointments from "./pages/account/AccountAppointments";
import AccountCustom from "./pages/account/AccountCustom";
import AccountHome from "./pages/account/AccountHome";
import AccountMeasurements from "./pages/account/AccountMeasurements";
import AccountOrders from "./pages/account/AccountOrders";
import AccountPayments from "./pages/account/AccountPayments";
import AccountProfile from "./pages/account/AccountProfile";
import AccountReviews from "./pages/account/AccountReviews";
import AccountSupport from "./pages/account/AccountSupport";
import AccountWishlist from "./pages/account/AccountWishlist";
import AtelierAppointments from "./pages/atelier/AtelierAppointments";
import AtelierAttendance from "./pages/atelier/AtelierAttendance";
import AtelierBench from "./pages/atelier/AtelierBench";
import AtelierFittings from "./pages/atelier/AtelierFittings";
import AtelierProfile from "./pages/atelier/AtelierProfile";
import AtelierQueue from "./pages/atelier/AtelierQueue";
import ForgotPassword from "./pages/auth/ForgotPassword";
import ResetPassword from "./pages/auth/ResetPassword";
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import StudioLogin from "./pages/auth/StudioLogin";
import Bespoke from "./pages/Bespoke";
import Book from "./pages/Book";
import CartPage from "./pages/Cart";
import CategoryPage from "./pages/Category";
import Checkout from "./pages/Checkout";
import Collection from "./pages/Collection";
import Contact from "./pages/Contact";
import EventDetail from "./pages/EventDetail";
import Events from "./pages/Events";
import Home from "./pages/Home";
import Journal from "./pages/Journal";
import JournalPost from "./pages/JournalPost";
import Lookbook from "./pages/Lookbook";
import MadeToMeasure from "./pages/MadeToMeasure";
import NotFound from "./pages/NotFound";
import PolicyPage from "./pages/PolicyPage";
import ProductDetail from "./pages/ProductDetail";
import SearchPage from "./pages/Search";
import Shop from "./pages/Shop";
import StudioAnalytics from "./pages/studio/StudioAnalytics";
import StudioAttendance from "./pages/studio/StudioAttendance";
import StudioCollections from "./pages/studio/StudioCollections";
import StudioContent from "./pages/studio/StudioContent";
import StudioCustom from "./pages/studio/StudioCustom";
import StudioCustomer from "./pages/studio/StudioCustomer";
import StudioCustomers from "./pages/studio/StudioCustomers";
import StudioEvents from "./pages/studio/StudioEvents";
import StudioHome from "./pages/studio/StudioHome";
import StudioOrderDetail from "./pages/studio/StudioOrderDetail";
import StudioOrders from "./pages/studio/StudioOrders";
import StudioPayments from "./pages/studio/StudioPayments";
import StudioPeople from "./pages/studio/StudioPeople";
import StudioProduction from "./pages/studio/StudioProduction";
import StudioProducts from "./pages/studio/StudioProducts";
import StudioProfile from "./pages/studio/StudioProfile";
import StudioQuotes from "./pages/studio/StudioQuotes";
import StudioSettings from "./pages/studio/StudioSettings";
import StudioSupport from "./pages/studio/StudioSupport";
import ThankYou from "./pages/ThankYou";
import TrackOrder from "./pages/Track";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Home />} />
          <Route path="/shop" element={<Shop />} />
          <Route path="/shop/:sku" element={<ProductDetail />} />
          <Route path="/collection" element={<Collection />} />
          <Route path="/collection/:slug" element={<CategoryPage />} />
          <Route path="/aranbada" element={<CategoryPage forcedSlug="aranbada" />} />
          <Route path="/men-senator" element={<CategoryPage forcedSlug="men-senator" />} />
          <Route path="/agbada" element={<CategoryPage forcedSlug="agbada" />} />
          <Route path="/esiki" element={<CategoryPage forcedSlug="esiki" />} />
          <Route path="/suit" element={<CategoryPage forcedSlug="suit" />} />
          <Route path="/lookbook" element={<Lookbook />} />
          <Route path="/bespoke" element={<Bespoke />} />
          <Route path="/made-to-measure/:sku" element={<MadeToMeasure />} />
          <Route path="/about" element={<About />} />
          <Route path="/about-us" element={<Navigate to="/about" replace />} />
          <Route path="/journal" element={<Journal />} />
          <Route path="/journal/:slug" element={<JournalPost />} />
          <Route path="/events" element={<Events />} />
          <Route path="/events/:slug" element={<EventDetail />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/contact-us" element={<Navigate to="/contact" replace />} />
          <Route path="/book" element={<Book />} />
          <Route path="/track" element={<TrackOrder />} />
          <Route path="/cart" element={<CartPage />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/orders/thank-you/:id" element={<ThankYou />} />
          <Route path="/search" element={<SearchPage />} />
          <Route path="/policies/:kind" element={<PolicyPage />} />
        </Route>

        <Route path="/account/login" element={<Login />} />
        <Route path="/account/register" element={<Register />} />
        <Route path="/account/forgot-password" element={<ForgotPassword />} />
        <Route path="/account/reset-password" element={<ResetPassword />} />
        <Route path="/studio/login" element={<StudioLogin />} />

        <Route element={<AccountGate />}>
          <Route path="/account" element={<AccountHome />} />
          <Route path="/account/shop" element={<Shop />} />
          <Route path="/account/shop/:sku" element={<ProductDetail />} />
          <Route path="/account/made-to-measure/:sku" element={<MadeToMeasure />} />
          <Route path="/account/journal" element={<Journal />} />
          <Route path="/account/journal/:slug" element={<JournalPost />} />
          <Route path="/account/orders" element={<AccountOrders />} />
          <Route path="/account/custom" element={<AccountCustom />} />
          <Route path="/account/measurements" element={<AccountMeasurements />} />
          <Route path="/account/appointments" element={<AccountAppointments />} />
          <Route path="/account/payments" element={<AccountPayments />} />
          <Route path="/account/wishlist" element={<AccountWishlist />} />
          <Route path="/account/reviews" element={<AccountReviews />} />
          <Route path="/account/support" element={<AccountSupport />} />
          <Route path="/account/profile" element={<AccountProfile />} />
        </Route>

        <Route element={<StudioGate />}>
          <Route path="/studio" element={<StudioHome />} />
          <Route path="/studio/orders" element={<StudioOrders />} />
          <Route path="/studio/orders/:id" element={<StudioOrderDetail />} />
          <Route path="/studio/products" element={<StudioProducts />} />
          <Route path="/studio/products/:id" element={<StudioProducts />} />
          <Route path="/studio/collections" element={<StudioCollections />} />
          <Route path="/studio/customers" element={<StudioCustomers />} />
          <Route path="/studio/customers/:id" element={<StudioCustomer />} />
          <Route path="/studio/custom" element={<StudioCustom />} />
          <Route path="/studio/quotes" element={<StudioQuotes />} />
          <Route path="/studio/production" element={<StudioProduction />} />
          <Route path="/studio/payments" element={<StudioPayments />} />
          <Route path="/studio/analytics" element={<StudioAnalytics />} />
          <Route path="/studio/support" element={<StudioSupport />} />
          <Route path="/studio/content" element={<StudioContent />} />
          <Route path="/studio/events" element={<StudioEvents />} />
          <Route path="/studio/people" element={<StudioPeople />} />
          <Route path="/studio/appointments" element={<AtelierAppointments />} />
          <Route path="/studio/attendance" element={<StudioAttendance />} />
          <Route path="/studio/profile" element={<StudioProfile />} />
          <Route path="/studio/settings" element={<StudioSettings />} />
        </Route>

        <Route element={<AtelierGate />}>
          <Route path="/atelier" element={<AtelierBench />} />
          <Route path="/atelier/queue" element={<AtelierQueue />} />
          <Route path="/atelier/fittings" element={<AtelierFittings />} />
          <Route path="/atelier/appointments" element={<AtelierAppointments />} />
          <Route path="/atelier/attendance" element={<AtelierAttendance />} />
          <Route path="/atelier/profile" element={<AtelierProfile />} />
        </Route>

        <Route element={<Layout />}>
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
