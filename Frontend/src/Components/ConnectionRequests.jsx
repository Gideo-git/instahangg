import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { Store } from "react-notifications-component";
import Navbar from "./Navbar";
import { UserPlus, UserCheck, UserX, RefreshCw, Clock, Eye } from "lucide-react";
import "./styles/Requests.css";

const showNotification = (title, message, type = "success", duration = 3000) => {
  Store.addNotification({
    title,
    message,
    type,
    insert: "top",
    container: "top-right",
    animationIn: ["animate__animated", "animate__fadeIn"],
    animationOut: ["animate__animated", "animate__fadeOut"],
    dismiss: { duration },
  });
};

function ConnectionRequests() {
  const [receivedRequests, setReceivedRequests] = useState([]);
  const [sentRequests, setSentRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("received");
  const navigate = useNavigate();

  useEffect(() => {
    fetchConnectionRequests();
  }, []);

  const fetchConnectionRequests = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return navigate("/login");

      setLoading(true);

      const [receivedResponse, sentResponse] = await Promise.all([
        axios.get(`https://backend-3ex6nbvuga-el.a.run.app/connections/requests`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        axios.get(`https://backend-3ex6nbvuga-el.a.run.app/connections/requests/sent`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      setReceivedRequests(receivedResponse.data.requests || []);
      setSentRequests(sentResponse.data.requests || []);
    } catch (error) {
      console.error("Error fetching connection requests:", error);
      showNotification("Error", "Failed to load connection requests", "danger");
    } finally {
      setLoading(false);
    }
  };

  const handleRespondToRequest = async (connectionId, action) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return navigate("/login");

      await axios.post(
        `https://backend-3ex6nbvuga-el.a.run.app/connections/respond`,
        { connectionId, action },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      showNotification(
        "Success",
        `Request ${action === "accept" ? "accepted" : "declined"}`
      );
      fetchConnectionRequests();
    } catch (error) {
      console.error(`Error ${action} request:`, error);
      showNotification("Failed", "Something went wrong", "danger");
    }
  };

  const viewProfile = (userId) => {
    navigate(`/profile/${userId}`);
  };

  const formatDate = (dateString) =>
    new Date(dateString).toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });

  return (
    <div className="requests-bg min-h-screen flex flex-col">
      <Navbar />

      <div className="container mx-auto max-w-4xl px-6 py-10 mt-20">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight">
            Connection Requests
          </h1>

          <button
            onClick={fetchConnectionRequests}
            className="refresh-btn flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-all"
          >
            <RefreshCw size={16} />
            Refresh
          </button>
        </div>

        {/* Tabs */}
        <div className="tab-container mb-6">
          <button
            className={`tab-btn ${activeTab === "received" ? "active-tab" : ""}`}
            onClick={() => setActiveTab("received")}
          >
            Received
          </button>

          <button
            className={`tab-btn ${activeTab === "sent" ? "active-tab" : ""}`}
            onClick={() => setActiveTab("sent")}
          >
            Sent
          </button>
        </div>

        {/* Loading */}
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-indigo-500"></div>
          </div>
        ) : activeTab === "received" ? (
          <>
            {receivedRequests.length === 0 ? (
              <div className="empty-state">
                <UserPlus size={48} className="mx-auto mb-4 text-gray-400" />
                <h3 className="text-xl font-semibold text-gray-700">No requests</h3>
                <p className="text-sm text-gray-500 mt-1">Nobody wants you yet. Sad.</p>
              </div>
            ) : (
              <div className="space-y-5">
                {receivedRequests.map((req) => (
                  <div key={req._id} className="request-card">
                    <div className="flex items-center justify-between">
                      {/* User Info */}
                      <div className="flex items-center gap-4">
                        <img
                          src={`https://api.dicebear.com/7.x/thumbs/svg?seed=${
                            req.requesterId?.UserName || "user"
                          }`}
                          alt="User avatar"
                          className="avatar"
                        />

                        <div>
                          <h3 className="font-semibold text-gray-800">
                            {req.requesterId?.name}
                          </h3>
                          <p className="text-sm text-gray-500">
                            @{req.requesterId?.UserName}
                          </p>

                          <div className="flex items-center mt-1 text-xs text-gray-500">
                            <Clock size={12} className="mr-1 text-indigo-500" />
                            Sent {formatDate(req.createdAt)}
                          </div>
                        </div>
                      </div>

                      {/* Buttons */}
                      <div className="flex gap-2">
                        <button
                          className="view-btn"
                          onClick={() => viewProfile(req.requesterId?._id)}
                        >
                          <Eye size={15} />
                          View
                        </button>

                        <button
                          onClick={() => handleRespondToRequest(req._id, "reject")}
                          className="decline-btn flex items-center gap-1"
                        >
                          <UserX size={15} />
                          Decline
                        </button>

                        <button
                          onClick={() => handleRespondToRequest(req._id, "accept")}
                          className="accept-btn flex items-center gap-1"
                        >
                          <UserCheck size={15} />
                          Accept
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        ) : (
          <>
            {sentRequests.length === 0 ? (
              <div className="empty-state">
                <UserPlus size={48} className="mx-auto mb-4 text-gray-400" />
                <h3 className="text-xl font-semibold text-gray-700">No sent requests</h3>
                <p className="text-sm text-gray-500 mt-1">You haven't sent any yet.</p>
              </div>
            ) : (
              <div className="space-y-5">
                {sentRequests.map((req) => (
                  <div key={req._id} className="request-card">
                    <div className="flex items-center justify-between">
                      {/* User Info */}
                      <div className="flex items-center gap-4">
                        <img
                          src={`https://api.dicebear.com/7.x/thumbs/svg?seed=${
                            req.receiverId?.UserName || "user"
                          }`}
                          alt="User avatar"
                          className="avatar"
                        />

                        <div>
                          <h3 className="font-semibold text-gray-800">
                            {req.receiverId?.name}
                          </h3>
                          <p className="text-sm text-gray-500">
                            @{req.receiverId?.UserName}
                          </p>

                          <div className="flex items-center mt-1 text-xs text-gray-500">
                            <Clock size={12} className="mr-1 text-indigo-500" />
                            Sent {formatDate(req.createdAt)}
                          </div>
                        </div>
                      </div>

                      <div className="flex gap-2 items-center">
                        <button
                          className="view-btn"
                          onClick={() => viewProfile(req.receiverId?._id)}
                        >
                          <Eye size={15} />
                          View
                        </button>

                        <div className="pending-tag">Pending</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default ConnectionRequests;
