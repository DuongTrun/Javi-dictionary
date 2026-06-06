import {
    createBrowserRouter,
    RouterProvider,
    Navigate,
} from "react-router-dom";
import ProtectedRoute from "@/components/common/ProtectedRoute";
import RequirePermission from "@/components/common/RequirePermission";
import MainLayout from "../layouts/MainLayout";
import NotFound from "../components/common/NotFount";
import LoginPage from "../pages/auth/LoginPage";
import SearchLayout from "../layouts/SearchLayout";
import SearchHome from "../pages/search/SearchHome";
import VocabularyResult from "../pages/search/VocabularyResult";
import RegisterPage from "../pages/auth/RegisterPage";
import VerifyEmailPage from "../pages/auth/VerifyEmailPage";
import UserDetailPage from "@/pages/user/UserDetailPage";
import ResetPasswordPage from "@/pages/auth/ResetPasswordPage";
import OAuthCallbackPage from "@/pages/auth/OAuthCallbackPage";
import KanjiResult from "@/pages/search/KanjiResult";
import GrammarSearchHome from "@/components/grammar/GrammarSearchHome";
import GrammarResult from "@/pages/search/GrammarResult";
import SearchHomeContent from "@/components/search/SearchHomeContent";
import TranslatePage from "@/pages/translate/TranslatePage";
import IntroPage from "@/pages/intro/introPage";
import AdminUsers from "@/pages/admin/AdminUsers";
import AdminVocabulary from "@/pages/admin/AdminVocabulary";
import AdminKanji from "@/pages/admin/AdminKanji";
import AdminGrammar from "@/pages/admin/AdminGrammar";
import JlptPage from "@/pages/jlpt/JlptPage";
import AdminPermissions from "@/pages/admin/AdminPermissions";
import AdminRoles from "@/pages/admin/AdminRoles";
import UpgradePage from "@/pages/premium/UpgradePage";
import ConfirmPremiumPage from "@/pages/premium/ConfirmPremiumPage";
import BankPaymentConfirmPage from "@/pages/premium/BankPaymentConfirmPage";
import TopicsPage from "@/pages/topic/TopicsPage";
import StudyDeckPage from "@/pages/study-deck/StudyDeckPage";
import FlashcardReviewPage from "@/pages/study-deck/FlashcardReviewPage";
import AdminPaymentOrders from "@/pages/admin/AdminPaymentOrders";

export default function App() {
    const router = createBrowserRouter([
        {
            path: "/",
            element: <MainLayout />,
            children: [
                { index: true, element: <Navigate to="/search" replace /> },

                {
                    path: "search",
                    element: <SearchLayout />, // Layout ngoài (padding + outlet)
                    children: [
                        {
                            path: "",
                            element: <SearchHome />, // Layout con của nhóm search
                            children: [
                                {
                                    index: true,
                                    element: <Navigate to="word" replace />,
                                },
                                {
                                    path: "word",
                                    element: <SearchHomeContent />,
                                },
                                {
                                    path: "kanji",
                                    element: <SearchHomeContent />,
                                },
                                {
                                    path: "grammar",
                                    element: <GrammarSearchHome />,
                                },
                            ],
                        },
                        {
                            path: "word/:keyword",
                            element: <VocabularyResult />,
                        },
                        { path: "kanji/:keyword", element: <KanjiResult /> },
                        {
                            path: "grammar/:keyword",
                            element: <GrammarResult />,
                        },
                    ],
                },
                { path: "translate", element: <TranslatePage /> },
                { path: "/jlpt", element: <JlptPage /> },
                { path: "/premium", element: <UpgradePage /> },
                { path: "/premium/confirm", element: <ConfirmPremiumPage /> },
                {
                    path: "/premium/bank-confirm",
                    element: <BankPaymentConfirmPage />,
                },
                { path: "/users/my-info", element: <UserDetailPage /> },
                { path: "intro", element: <IntroPage /> },
                { path: "topics", element: <TopicsPage /> },
                {
                    path: "study-decks",
                    element: (
                        <ProtectedRoute>
                            <StudyDeckPage />
                        </ProtectedRoute>
                    ),
                },
                {
                    path: "study-decks/:deckId/review",
                    element: (
                        <ProtectedRoute>
                            <FlashcardReviewPage />
                        </ProtectedRoute>
                    ),
                },
                {
                    path: "/users/profile/:username",
                    element: <UserDetailPage />,
                },
                {
                    path: "oauth2/callback/google",
                    element: <OAuthCallbackPage />,
                },
                { path: "login", element: <LoginPage /> },
                { path: "register", element: <RegisterPage /> },
                { path: "verify", element: <VerifyEmailPage /> },
                { path: "/reset-password", element: <ResetPasswordPage /> },
                // =====================
                //     ADMIN ROUTES
                // =====================
                {
                    path: "admin/grammar",
                    element: (
                        <ProtectedRoute>
                            <RequirePermission
                                required={[
                                    "CREATE_GRAMMAR",
                                    "UPDATE_GRAMMAR",
                                    "DELETE_GRAMMAR",
                                ]}
                            >
                                <AdminGrammar />
                            </RequirePermission>
                        </ProtectedRoute>
                    ),
                },
                {
                    path: "admin/word",
                    element: (
                        <ProtectedRoute>
                            <RequirePermission
                                required={[
                                    "CREATE_VOCABULARY",
                                    "UPDATE_VOCABULARY",
                                    "DELETE_VOCABULARY",
                                ]}
                            >
                                <AdminVocabulary />
                            </RequirePermission>
                        </ProtectedRoute>
                    ),
                },
                {
                    path: "admin/kanji",
                    element: (
                        <ProtectedRoute>
                            <RequirePermission
                                required={[
                                    "CREATE_KANJI",
                                    "UPDATE_KANJI",
                                    "DELETE_KANJI",
                                ]}
                            >
                                <AdminKanji />
                            </RequirePermission>
                        </ProtectedRoute>
                    ),
                },
                {
                    path: "admin/users",
                    element: (
                        <ProtectedRoute>
                            <RequirePermission
                                required={["MANAGE_USER", "CREATE_USER"]}
                            >
                                <AdminUsers />
                            </RequirePermission>
                        </ProtectedRoute>
                    ),
                },
                {
                    path: "admin/roles",
                    element: (
                        <ProtectedRoute>
                            <RequirePermission required={["MANAGE_ROLE"]}>
                                <AdminRoles />
                            </RequirePermission>
                        </ProtectedRoute>
                    ),
                },
                {
                    path: "admin/permissions",
                    element: (
                        <ProtectedRoute>
                            <RequirePermission required={["MANAGE_PERMISSION"]}>
                                <AdminPermissions />
                            </RequirePermission>
                        </ProtectedRoute>
                    ),
                },
                {
                    path: "admin/payment-orders",
                    element: (
                        <ProtectedRoute>
                            <RequirePermission required={["MANAGE_USER"]}>
                                <AdminPaymentOrders />
                            </RequirePermission>
                        </ProtectedRoute>
                    ),
                },
                { path: "*", element: <NotFound /> },
            ],
        },
    ]);

    return <RouterProvider router={router} />;
}
