import "./app.scss";
import { createBrowserRouter, Outlet, RouterProvider } from "react-router-dom";
import React from "react";
import Home from "./pages/home/Home";
import Gigs from "./pages/gigs/Gigs";
import Gig from "./pages/gig/Gig";
import Login from "./pages/login/Login";
import Register from "./pages/register/Register";
import Add from "./pages/add/Add";
import Orders from "./pages/orders/Orders";
import Messages from "./pages/messages/Messages";
import Message from "./pages/message/Message";
import MyGigs from "./pages/myGigs/MyGigs";
import EducatorProfile from "./pages/educatorProfile/EducatorProfile";
import StudentDashboard from "./pages/dashboard/student/StudentDashboard";
import EducatorDashboard from "./pages/dashboard/educator/EducatorDashboard";
import PackageDetail from "./pages/dashboard/student/packageDetail";
import {
  QueryClient,
  QueryClientProvider,
} from "@tanstack/react-query";
import Pay from "./pages/pay/Pay";
import Success from "./pages/success/Success";
import { ChatProvider } from "./context/ChatContext.jsx";
import { Toaster } from "react-hot-toast";

function App() {
  const queryClient = new QueryClient();

  const Layout = () => {
    return (
      <div className="app">
        <QueryClientProvider client={queryClient}>
          <ChatProvider>
            <Outlet />
            <Toaster position="top-right" />
          </ChatProvider>
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
          path: "/gigs",
          element: <Gigs />,
        },
        {
          path: "/myGigs",
          element: <MyGigs />,
        },
        {
          path: "/orders",
          element: <Orders />,
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
          path: "/gig/:id",
          element: <Gig />,
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
          path: "/pay/:id",
          element: <Pay />,
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
