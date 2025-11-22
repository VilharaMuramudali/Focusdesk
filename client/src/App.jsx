import "./app.scss";
import { createBrowserRouter, Outlet, RouterProvider } from "react-router-dom";
import React from "react";
import Home from "./pages/home/Home";
import Login from "./pages/login/Login";
import Register from "./pages/register/Register";
import Add from "./pages/add/Add";
import Messages from "./pages/messages/Messages";
import Message from "./pages/message/Message";
import EducatorProfile from "./pages/educatorProfile/EducatorProfile";
import StudentDashboard from "./pages/dashboard/student/StudentDashboard";
import EducatorDashboard from "./pages/dashboard/educator/EducatorDashboard";
import PackageDetail from "./pages/dashboard/student/packageDetail";
import {
  QueryClient,
  QueryClientProvider,
} from "@tanstack/react-query";
import Success from "./pages/success/Success";
import { ChatProvider } from "./context/ChatContext.jsx";
import { CurrencyProvider } from "./context/CurrencyContext.jsx";
import { Toaster } from "react-hot-toast";
import ReviewSystemTest from "./components/ReviewSystemTest";
import RatingSystemDemo from "./components/RatingSystemDemo";

function App() {
  const queryClient = new QueryClient();

  const Layout = () => {
    return (
      <div className="app">
        <QueryClientProvider client={queryClient}>
          <CurrencyProvider>
            <ChatProvider>
              <Outlet />
              <Toaster position="top-right" />
            </ChatProvider>
          </CurrencyProvider>
        </QueryClientProvider>
      </div>
    );
  };

  const router = createBrowserRouter([
    {
      path: "/",
      element: <Layout />,
      children: [
        {
          path: "/",
          element: <Home />,
        },

        {
          path: "/messages",
          element: <Messages />,
        },
        {
          path: "/message/:id",
          element: <Message />,
        },
        {
          path: "/add",
          element: <Add />,
        },

        {
          path: "/register",
          element: <Register />,
        },
        {
          path: "/login",
          element: <Login />,
        },

        {
          path: "/success",
          element: <Success />,
        },
        {
          path: "/student-dashboard",
          element: <StudentDashboard />,
        },
        {
          path: "/find-tutors",
          element: <StudentDashboard />,
        },
        {
          path: "/my-sessions",
          element: <StudentDashboard />,
        },
        {
          path: "/learning-progress",
          element: <StudentDashboard />,
        },
        {
          path: "/my-learning",
          element: <StudentDashboard />,
        },
        {
          path: "/messages",
          element: <StudentDashboard />,
        },
        {
          path: "/payments",
          element: <StudentDashboard />,
        },
        {
          path: "/review-test",
          element: <ReviewSystemTest />,
        },
        {
          path: "/rating-demo",
          element: <RatingSystemDemo />,
        },
        {
          path: "/settings",
          element: <StudentDashboard />,
        },
        {
          path: "/educator-dashboard",
          element: <EducatorDashboard />,
        },
        {
          path: "/package/:id",
          element: <PackageDetail />,
        },
        {
          path: "/educator/:educatorId",
          element: <EducatorProfile />,
        },
      ],
    },
  ]);

  return <RouterProvider router={router} />;
}

export default App;
