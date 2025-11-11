import { Routes, Route } from "react-router-dom";
import RoleRoute from "@/components/RoleRoute";
import EmailProcessor from "@/components/EmailProcessor";
import Index from "./pages/Index";
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import ForgotPassword from "./pages/auth/ForgotPassword";
import ChangePassword from "./pages/auth/ChangePassword";
import NotFound from "./pages/NotFound";
import OwnerDashboard from "./pages/dashboard/OwnerDashboard";
import RenterDashboard from "./pages/dashboard/RenterDashboard";
import Profile from "./pages/profile/Profile";
import AddCar from "./pages/cars/AddCar";
import EditCar from "./pages/cars/EditCar";
import VehicleAvailability from "./pages/cars/VehicleAvailability";
import VehicleStats from "./pages/cars/VehicleStats";
import CarDetail from "./pages/cars/CarDetail";
import SearchResults from "./pages/cars/SearchResults";
import BecomeOwner from "./pages/owner/BecomeOwner";
import HowItWorks from "./pages/how-it-works/HowItWorks";
import Contact from "./pages/contact/Contact";
import Legal from "./pages/legal/Legal";
import Privacy from "./pages/legal/Privacy";
import Insurance from "./pages/legal/Insurance";
import OwnerTools from "./pages/owner/OwnerTools";
import DocumentVerification from "./pages/documents/DocumentVerification";
import ReservationPage from "./pages/cars/ReservationPage";
import Settings from "./pages/settings/Settings";
import Notifications from "./pages/notifications/Notifications";
import OwnerVehicles from "./pages/dashboard/OwnerVehicles";
import EmailDashboard from "./pages/admin/EmailDashboard";
import AdminDashboard from "./pages/admin/AdminDashboard";
import OwnerBookingsDashboard from "./pages/dashboard/OwnerBookingsDashboard";
import RenterBookingsDashboard from "./pages/dashboard/RenterBookingsDashboard";
import BookingDetailsPage from "./pages/bookings/BookingDetailsPage";
import BookingConfirmation from "./pages/bookings/BookingConfirmation";
import SubmitReview from "./pages/bookings/SubmitReview";
import CheckInPage from "./pages/bookings/CheckInPage";
import CheckOutPage from "./pages/bookings/CheckOutPage";
import VehicleReviews from "./pages/cars/VehicleReviews";
import AgencyReviews from "./pages/dashboard/AgencyReviews";
import OwnerRevenueDashboard from "./pages/dashboard/OwnerRevenueDashboard";
import OwnerDepositsDashboard from "./pages/dashboard/OwnerDepositsDashboard";
import OwnerRefundsDashboard from "./pages/dashboard/OwnerRefundsDashboard";
import OwnerCancellationsDashboard from "./pages/dashboard/OwnerCancellationsDashboard";
import OwnerClaimsDashboard from "./pages/dashboard/OwnerClaimsDashboard";
import InvoicePage from "./pages/bookings/InvoicePage";
import ReceiptPage from "./pages/bookings/ReceiptPage";
import ContractPage from "./pages/bookings/ContractPage";
import CancelBookingPage from "./pages/bookings/CancelBookingPage";
import DamageReportPage from "./pages/bookings/DamageReportPage";
import AdminVehiclesPage from "./pages/admin/AdminVehiclesPage";
import AdminDocumentsPage from "./pages/admin/AdminDocumentsPage";
import AdminUsersPage from "./pages/admin/AdminUsersPage";
import AdminBookings from "./pages/admin/AdminBookings";
import BeforeOwner from "@/pages/owner/BeforeOwner";
import Favorites from "@/pages/favorites/Favorites";
import About from "@/pages/about/About";
import Blog from "@/pages/blog/Blog";
import Rent from "@/pages/rent/Rent";
import Help from "@/pages/help/Help";
import Pricing from "@/pages/pricing/Pricing";
import Guide from "@/pages/guide/Guide";
import FaqPage from "@/pages/faq/Faq";
import Emergency from "@/pages/emergency/Emergency";
import MessagesList from "@/pages/messaging/MessagesList";
import MessageThreadPage from "@/pages/messaging/MessageThread";
import BlogPost from "@/pages/blog/BlogPost";

function AppRoutes() {
  return (
    <>
      <EmailProcessor />
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/search" element={<SearchResults />} />
        <Route path="/auth/login" element={<Login />} />
        <Route path="/auth/register" element={<Register />} />
        <Route path="/auth/forgot-password" element={<ForgotPassword />} />
        <Route path="/auth/change-password" element={<ChangePassword />} />
        <Route path="/dashboard/renter" element={<RoleRoute allowedRoles={['renter']}><RenterDashboard /></RoleRoute>} />
        <Route path="/dashboard/owner" element={<RoleRoute allowedRoles={['owner']}><OwnerDashboard /></RoleRoute>} />
        <Route path="/dashboard/owner/vehicles" element={<RoleRoute allowedRoles={['owner']}><OwnerVehicles /></RoleRoute>} />
        <Route path="/dashboard/owner/bookings" element={<RoleRoute allowedRoles={['owner']}><OwnerBookingsDashboard /></RoleRoute>} />
        <Route path="/dashboard/owner/reviews" element={<RoleRoute allowedRoles={['owner']}><AgencyReviews /></RoleRoute>} />
        <Route path="/dashboard/owner/revenue" element={<RoleRoute allowedRoles={['owner']}><OwnerRevenueDashboard /></RoleRoute>} />
        <Route path="/dashboard/owner/deposits" element={<RoleRoute allowedRoles={['owner']}><OwnerDepositsDashboard /></RoleRoute>} />
        <Route path="/dashboard/owner/refunds" element={<RoleRoute allowedRoles={['owner']}><OwnerRefundsDashboard /></RoleRoute>} />
        <Route path="/dashboard/owner/cancellations" element={<RoleRoute allowedRoles={['owner']}><OwnerCancellationsDashboard /></RoleRoute>} />
        <Route path="/dashboard/owner/claims" element={<RoleRoute allowedRoles={['owner']}><OwnerClaimsDashboard /></RoleRoute>} />
        <Route path="/dashboard/renter/bookings" element={<RoleRoute allowedRoles={['renter']}><RenterBookingsDashboard /></RoleRoute>} />
        <Route path="/profile" element={<RoleRoute allowedRoles={['renter', 'owner', 'admin']}><Profile /></RoleRoute>} />
        <Route path="/settings" element={<RoleRoute allowedRoles={['renter', 'owner', 'admin']}><Settings /></RoleRoute>} />
        <Route path="/notifications" element={<RoleRoute allowedRoles={['renter', 'owner', 'admin']}><Notifications /></RoleRoute>} />
        <Route path="/favorites" element={<RoleRoute allowedRoles={['renter', 'owner', 'admin']}><Favorites /></RoleRoute>} />
        <Route path="/cars/add" element={<RoleRoute allowedRoles={['owner']}><AddCar /></RoleRoute>} />
        <Route path="/cars/search" element={<SearchResults />} />
        <Route path="/cars/:id/edit" element={<RoleRoute allowedRoles={['owner']}><EditCar /></RoleRoute>} />
        <Route path="/cars/:id/availability" element={<RoleRoute allowedRoles={['owner']}><VehicleAvailability /></RoleRoute>} />
        <Route path="/cars/:id/stats" element={<RoleRoute allowedRoles={['owner']}><VehicleStats /></RoleRoute>} />
        <Route path="/cars/:id/reviews" element={<VehicleReviews />} />
        <Route path="/cars/:id/reserve" element={<ReservationPage />} />
        <Route path="/cars/:id" element={<CarDetail />} />
        <Route path="/before-owner" element={<BeforeOwner />} />
        <Route path="/become-owner" element={<BecomeOwner />} />
        <Route path="/how-it-works" element={<HowItWorks />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/legal" element={<Legal />} />
        <Route path="/legal/privacy" element={<Privacy />} />
        <Route path="/legal/insurance" element={<Insurance />} />
        <Route path="/owner/tools" element={<OwnerTools />} />
        <Route path="/documents/verification" element={<DocumentVerification />} />
        <Route path="/verify/tenant" element={<DocumentVerification />} />
        <Route path="/verify/host" element={<DocumentVerification />} />
        <Route path="/bookings/:id" element={<RoleRoute allowedRoles={['renter', 'owner']}><BookingDetailsPage /></RoleRoute>} />
        <Route path="/bookings/:id/review" element={<RoleRoute allowedRoles={['renter']}><SubmitReview /></RoleRoute>} />
        <Route path="/bookings/:id/check-in" element={<RoleRoute allowedRoles={['owner']}><CheckInPage /></RoleRoute>} />
        <Route path="/bookings/:id/check-out" element={<RoleRoute allowedRoles={['renter']}><CheckOutPage /></RoleRoute>} />
        <Route path="/bookings/:id/invoice" element={<RoleRoute allowedRoles={['renter', 'owner']}><InvoicePage /></RoleRoute>} />
        <Route path="/bookings/:id/receipt" element={<RoleRoute allowedRoles={['renter', 'owner']}><ReceiptPage /></RoleRoute>} />
        <Route path="/bookings/:id/contract" element={<RoleRoute allowedRoles={['renter', 'owner']}><ContractPage /></RoleRoute>} />
        <Route path="/bookings/:id/cancel" element={<RoleRoute allowedRoles={['renter', 'owner']}><CancelBookingPage /></RoleRoute>} />
        <Route path="/bookings/:id/damage-report" element={<RoleRoute allowedRoles={['owner']}><DamageReportPage /></RoleRoute>} />
        <Route path="/bookings/:id/confirm" element={<BookingConfirmation />} />
        <Route path="/messages" element={<RoleRoute allowedRoles={['renter', 'owner', 'admin']}><MessagesList /></RoleRoute>} />
        <Route path="/messages/:threadId" element={<RoleRoute allowedRoles={['renter', 'owner', 'admin']}><MessageThreadPage /></RoleRoute>} />
        <Route path="/admin" element={<RoleRoute allowedRoles={['admin']}><AdminDashboard /></RoleRoute>} />
        <Route path="/admin/emails" element={<RoleRoute allowedRoles={['admin']}><EmailDashboard /></RoleRoute>} />
        <Route path="/admin/vehicles" element={<RoleRoute allowedRoles={['admin']}><AdminVehiclesPage /></RoleRoute>} />
        <Route path="/admin/documents" element={<RoleRoute allowedRoles={['admin']}><AdminDocumentsPage /></RoleRoute>} />
        <Route path="/admin/users" element={<RoleRoute allowedRoles={['admin']}><AdminUsersPage /></RoleRoute>} />
        <Route path="/admin/bookings" element={<RoleRoute allowedRoles={['admin']}><AdminBookings /></RoleRoute>} />
        <Route path="/about" element={<About />} />
        <Route path="/blog" element={<Blog />} />
        <Route path="/blog/:id" element={<BlogPost />} />
        <Route path="/rent" element={<Rent />} />
        <Route path="/help" element={<Help />} />
        <Route path="/pricing" element={<Pricing />} />
        <Route path="/guide" element={<Guide />} />
        <Route path="/faq" element={<FaqPage />} />
        <Route path="/emergency" element={<Emergency />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </>
  );
}

export default AppRoutes;
