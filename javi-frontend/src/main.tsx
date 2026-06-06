import { createRoot } from "react-dom/client";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "antd/dist/reset.css";
import "./index.css";
import "./styles/fonts.css";
import AppRoutes from "./routes/AppRoutes.tsx";

createRoot(document.getElementById("root")!).render(
    // <StrictMode>
    //     <AppRoutes />
    //     <ToastContainer
    //         position="top-right"
    //         autoClose={3000}
    //         hideProgressBar={false}
    //         newestOnTop={false}
    //         closeOnClick
    //         pauseOnHover
    //         draggable
    //         theme="light"
    //     />
    // </StrictMode>
    <>
        <AppRoutes />
        <ToastContainer
            position="top-right"
            autoClose={3000}
            hideProgressBar={false}
            newestOnTop={false}
            closeOnClick
            pauseOnHover
            draggable
            theme="light"
        />
    </>
);
