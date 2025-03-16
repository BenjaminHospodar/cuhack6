import React from "react";
import { useFindMany, useAction } from "@gadgetinc/react";
import { api } from "../api";
import { useOutletContext } from "react-router";
import type { AuthOutletContext } from "./_user";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { RefreshCcw, Check } from "lucide-react";

export default function RequestsPage() {
  const { user } = useOutletContext<AuthOutletContext>();
  
  // Standard selection fields for requests
  const requestSelection = {
    id: true,
    createdAt: true,
    status: true,
    sender: {
      id: true,
      firstName: true,
      lastName: true,
      email: true
    },
    receiver: {
      id: true,
      firstName: true,
      lastName: true,
      email: true
    },
    receiverId: true, // Include receiverId to check if it exists even when receiver is null
    senderId: true
  };

  // Fetch incoming pending requests (where current user is the receiver)
  const [{ data: incomingRequests, fetching: fetchingIncoming, error: incomingError }, refreshIncoming] = useFindMany(api.request, {
    filter: {
      receiverId: { equals: user.id },
      status: { equals: "pending" }
    },
    select: requestSelection,
    sort: { createdAt: "Descending" }
  });
  
  // Fetch outgoing pending requests (where current user is the sender)
  const [{ data: outgoingRequests, fetching: fetchingOutgoing, error: outgoingError }, refreshOutgoing] = useFindMany(api.request, {
    filter: {
      senderId: { equals: user.id },
      status: { equals: "pending" }
    },
    select: requestSelection,
    sort: { createdAt: "Descending" }
  });

  // Fetch accepted requests (where current user is either the sender or receiver)
  const [{ data: acceptedRequests, fetching: fetchingAccepted, error: acceptedError }, refreshAccepted] = useFindMany(api.request, {
    filter: {
      OR: [
        { senderId: { equals: user.id } },
        { receiverId: { equals: user.id } }
      ],
      status: { equals: "accepted" }
    },
    select: requestSelection,
    sort: { createdAt: "Descending" }
  });

  // Action to respond to an incoming request (accept or reject)
  const [{ fetching: respondingToRequest }, respondToRequest] = useAction(api.request.respond);

  // Action to delete an outgoing request
  const [{ fetching: cancellingRequest }, deleteRequest] = useAction(api.request.delete);

  // Helper to refresh all request data
  const refreshAllData = () => {
    refreshIncoming();
    refreshOutgoing();
    refreshAccepted();
  };

  // Handle accepting a request
  const handleAccept = async (requestId: string) => {
    try {
      await respondToRequest({
        id: requestId,
        status: "accepted"
      });
      toast.success("Request accepted successfully!");
      refreshAllData();
    } catch (error) {
      toast.error("Failed to accept request: " + (error as Error).message);
    }
  };

  // Handle rejecting a request
  const handleReject = async (requestId: string) => {
    try {
      await respondToRequest({
        id: requestId,
        status: "rejected"
      });
      toast.success("Request rejected successfully!");
      refreshAllData();
    } catch (error) {
      toast.error("Failed to reject request: " + (error as Error).message);
    }
  };

  // Handle cancelling an outgoing request
  const handleCancel = async (requestId: string) => {
    try {
      await deleteRequest({
        id: requestId
      });
      toast.success("Request cancelled successfully!");
      refreshAllData();
    } catch (error) {
      toast.error("Failed to cancel request: " + (error as Error).message);
    }
  };

  // Helper function to format date
  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  // Helper function to get status badge
  const StatusBadge = ({ status }: { status: string }) => {
    switch (status) {
      case "pending":
        return <Badge variant="outline" className="bg-yellow-100 text-yellow-800">Pending</Badge>;
      case "accepted":
        return <Badge variant="outline" className="bg-green-100 text-green-800">Accepted</Badge>;
      case "rejected":
        return <Badge variant="outline" className="bg-red-100 text-red-800">Rejected</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  // Render loading state
  if ((fetchingIncoming || fetchingOutgoing || fetchingAccepted) && 
      (!incomingRequests && !outgoingRequests && !acceptedRequests)) {
    return (
      <div className="container py-10">
        <h1 className="text-2xl font-bold mb-6">Loading requests...</h1>
      </div>
    );
  }

  // Helper function to safely get receiver info
  const getReceiverInfo = (request: any) => {
    if (!request.receiver) {
      return {
        name: "Unknown User",
        email: "User data unavailable",
        isMissing: true
      };
    }
    return {
      name: `${request.receiver.firstName || ''} ${request.receiver.lastName || ''}`.trim() || "Unnamed User",
      email: request.receiver.email || "No email available",
      isMissing: false
    };
  };

  // Render error state
  if (incomingError || outgoingError || acceptedError) {
    return (
      <div className="container py-10">
        <h1 className="text-2xl font-bold mb-6">Connection Requests</h1>
        <div className="bg-red-100 text-red-800 p-4 rounded-md">
          {incomingError && <p>Error loading incoming requests: {incomingError.message}</p>}
          {outgoingError && <p>Error loading outgoing requests: {outgoingError.message}</p>}
          {acceptedError && <p>Error loading accepted connections: {acceptedError.message}</p>}
        </div>
      </div>
    );
  }

  return (
    <div className="container py-10">
      <div className="flex justify-between items-center mb-2">
        <h1 className="text-3xl font-bold">Connection Requests</h1>
        <Button 
          variant="outline" 
          size="sm" 
          className="flex items-center gap-2" 
          onClick={refreshAllData}
          disabled={fetchingIncoming || fetchingOutgoing}
        >
          <RefreshCcw className="h-4 w-4" />
          Refresh
        </Button>
      </div>
      <p className="text-gray-500 mb-6">Manage your incoming and outgoing connection requests</p>

      <Tabs defaultValue="incoming" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="incoming">
            Incoming Requests
            {incomingRequests && incomingRequests.length > 0 && (
              <Badge className="ml-2" variant="secondary">{incomingRequests.length}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="outgoing">
            Outgoing Requests
            {outgoingRequests && outgoingRequests.length > 0 && (
              <Badge className="ml-2" variant="secondary">{outgoingRequests.length}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="accepted">
            Accepted Connections
            {acceptedRequests && acceptedRequests.length > 0 && (
              <Badge className="ml-2" variant="secondary">{acceptedRequests.length}</Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="incoming" className="space-y-4">
          <h2 className="text-xl font-semibold mb-4">Incoming Requests</h2>
          {incomingRequests && incomingRequests.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2">
              {incomingRequests.map((request) => (
                <Card key={request.id}>
                  <CardHeader>
                    <CardTitle>
                      Request from {request.sender.firstName || ''} {request.sender.lastName || ''}
                    </CardTitle>
                    <CardDescription>
                      <div className="flex justify-between items-center">
                        <span>{formatDate(request.createdAt)}</span>
                        <StatusBadge status={request.status} />
                      </div>
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p>Email: {request.sender.email}</p>
                  </CardContent>
                  {request.status === "pending" && (
                    <CardFooter className="flex gap-2 justify-end">
                      <Button 
                        variant="outline" 
                        onClick={() => handleReject(request.id)}
                        disabled={respondingToRequest}
                      >
                        Reject
                      </Button>
                      <Button 
                        onClick={() => handleAccept(request.id)}
                        disabled={respondingToRequest}
                      >
                        Accept
                      </Button>
                    </CardFooter>
                  )}
                </Card>
              ))}
            </div>
          ) : (
            <p className="text-gray-500">No incoming requests found</p>
          )}
        </TabsContent>

        <TabsContent value="outgoing" className="space-y-4">
          <h2 className="text-xl font-semibold mb-4">Outgoing Requests</h2>
          {outgoingRequests && outgoingRequests.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2">
              {outgoingRequests.map((request) => {
                const receiverInfo = getReceiverInfo(request);
                
                return (
                  <Card key={request.id}>
                    <CardHeader>
                      <CardTitle>
                        Request to {receiverInfo.name}
                      </CardTitle>
                      <CardDescription>
                        <div className="flex justify-between items-center">
                          <span>{formatDate(request.createdAt)}</span>
                          <StatusBadge status={request.status} />
                        </div>
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p>Email: {receiverInfo.email}</p>
                      {receiverInfo.isMissing && (
                        <div className="mt-2 p-2 bg-yellow-100 text-yellow-800 rounded-md text-sm">
                          The user this request was sent to is no longer available.
                        </div>
                      )}
                    </CardContent>
                    {request.status === "pending" && (
                      <CardFooter className="flex justify-end">
                        <Button 
                          variant="outline" 
                          onClick={() => handleCancel(request.id)}
                          disabled={cancellingRequest}
                        >
                          Cancel Request
                        </Button>
                      </CardFooter>
                    )}
                  </Card>
                );
              })}
            </div>
          ) : (
            <p className="text-gray-500">No outgoing requests found</p>
          )}
        </TabsContent>
        
        <TabsContent value="accepted" className="space-y-4">
          <h2 className="text-xl font-semibold mb-4">Accepted Connections</h2>
          {acceptedRequests && acceptedRequests.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2">
              {acceptedRequests.map((request) => {
                // Determine if current user is sender or receiver
                const isCurrentUserSender = request.senderId === user.id;
                const otherUser = isCurrentUserSender ? request.receiver : request.sender;
                const otherUserInfo = otherUser ? {
                  name: `${otherUser.firstName || ''} ${otherUser.lastName || ''}`.trim() || "Unnamed User",
                  email: otherUser.email || "No email available",
                  isMissing: false
                } : {
                  name: "Unknown User",
                  email: "User data unavailable",
                  isMissing: true
                };
                
                return (
                  <Card key={request.id} className="border-green-200">
                    <CardHeader className="bg-green-50 bg-opacity-50">
                      <CardTitle className="flex items-center gap-2">
                        <Check className="h-5 w-5 text-green-600" />
                        Connected with {otherUserInfo.name}
                      </CardTitle>
                      <CardDescription>
                        <div className="flex justify-between items-center">
                          <span>{formatDate(request.createdAt)}</span>
                          <Badge variant="outline" className="bg-green-100 text-green-800">Accepted</Badge>
                        </div>
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="pt-4">
                      <p>Email: {otherUserInfo.email}</p>
                      {otherUserInfo.isMissing && (
                        <div className="mt-2 p-2 bg-yellow-100 text-yellow-800 rounded-md text-sm">
                          This user's data is no longer available.
                        </div>
                      )}
                      <p className="mt-2 text-sm text-gray-500">
                        {isCurrentUserSender ? "You sent this request" : "This user sent you a request"}
                      </p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            <p className="text-gray-500">No accepted connections found</p>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
