import React, { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { MessageCircle, Send, AlertCircle, Award, Star } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useOutletContext } from "react-router";
import { useFindMany, useAction } from "@gadgetinc/react";
import type { AuthOutletContext } from "./_user";
import { api } from "../api";
import { toast } from "sonner";

interface Connection {
  id: string;
  connectedUser: {
    id: string;
    firstName?: string;
    lastName?: string;
    email: string;
    googleImageUrl?: string;
  };
}

interface StarRatingProps {
  rating: number;
  onRatingChange: (rating: number) => void;
}

const StarRating: React.FC<StarRatingProps> = ({ rating, onRatingChange }) => {
  return (
    <div className="flex items-center space-x-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onRatingChange(star)}
          className="focus:outline-none"
          aria-label={`${star} star${star !== 1 ? 's' : ''}`}
        >
          <Star
            className={`h-6 w-6 ${
              rating >= star 
                ? 'fill-yellow-400 text-yellow-400' 
                : 'text-gray-300'
            } transition-colors`}
          />
        </button>
      ))}
    </div>
  );
};

export default function Messages() {
  const { user } = useOutletContext<AuthOutletContext>();
  const [selectedUser, setSelectedUser] = useState<Connection["connectedUser"] | null>(null);
  const [newMessage, setNewMessage] = useState("");
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [ratingDialogOpen, setRatingDialogOpen] = useState(false);
  const [rating, setRating] = useState(0);
  const [connectionToRemove, setConnectionToRemove] = useState<string | null>(null);

  // Fetch requests (connections) where current user is involved and status is "accepted"
  const [{ data: requestsData, fetching: loadingConnections }] = useFindMany(api.request, {
    filter: {
      AND: [
        { status: { equals: "accepted" } },
        { 
          OR: [
            { senderId: { equals: user.id } },
            { receiverId: { equals: user.id } }
          ]
        }
      ]
    },
    select: {
      id: true,
      createdAt: true,
      sender: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        googleImageUrl: true,
      },
      receiver: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        googleImageUrl: true,
      }
    }
  });

  // Process requests to get connections (the other user, not the current user)
  const connections: Connection[] = React.useMemo(() => {
    if (!requestsData) return [];
    
    // Map requests to connections
    const connectionsMap = new Map<string, Connection>();
    
    requestsData.forEach(request => {
      const isSender = request.sender.id === user.id;
      const connectedUser = isSender ? request.receiver : request.sender;
      
      if (!connectionsMap.has(connectedUser.id)) {
        connectionsMap.set(connectedUser.id, {
          id: request.id,
          connectedUser
        });
      }
    });
    
    return Array.from(connectionsMap.values());
  }, [requestsData, user.id]);

  // Fetch messages between current user and selected user
  const [{ data: messagesData, fetching: loadingMessages }, refreshMessages] = useFindMany(api.message, {
    filter: selectedUser ? {
      OR: [
        { 
          AND: [
            { senderId: { equals: user.id } },
            { receiverId: { equals: selectedUser.id } }
          ]
        },
        {
          AND: [
            { senderId: { equals: selectedUser.id } },
            { receiverId: { equals: user.id } }
          ]
        }
      ]
    } : undefined,
    sort: { createdAt: "Ascending" },
    select: {
      id: true,
      content: true,
      createdAt: true,
      read: true,
      sender: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        googleImageUrl: true,
      },
      receiver: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
      }
    }
  });

  // Action to create a new message
  const [{ fetching: sendingMessage }, createMessage] = useAction(api.message.create);

  // Action to mark messages as read
  const [, updateMessage] = useAction(api.message.update);

  // Action to delete a request (connection)
  const [{ fetching: deletingRequest }, deleteRequest] = useAction(api.request.delete);
  
  // Action to create a rating
  const [{ fetching: creatingRating }, createRating] = useAction(api.userRating.create);

  // Select a user to chat with
  const handleSelectUser = (connection: Connection) => {
    setSelectedUser(connection.connectedUser);
    setError(null);
  };

  // Open rating dialog
  const handleSkillEarned = (connectionId: string) => {
    setConnectionToRemove(connectionId);
    setRatingDialogOpen(true);
    setRating(0);
  };
  
  // Handle rating submission
  const handleSubmitRating = async () => {
    // Clear any existing errors
    setError(null);

    // Validate all required data
    if (!connectionToRemove) {
      console.error("Missing connection ID");
      setError("Missing connection data. Please try again.");
      toast.error("Cannot process: Missing connection data");
      return;
    }
    
    if (!selectedUser || !selectedUser.id) {
      console.error("Missing or invalid selected user:", selectedUser);
      setError("Missing user data. Please try again.");
      toast.error("Cannot process: Missing user information");
      return;
    }
    
    if (!user || !user.id) {
      console.error("Missing or invalid current user:", user);
      setError("Session error. Please sign in again.");
      toast.error("Cannot process: Session error");
      return;
    }
    
    if (rating === 0 || rating < 1 || rating > 5) {
      console.error("Invalid rating value:", rating);
      setError("Please select a valid rating between 1 and 5 stars");
      toast.error("Please select a rating before submitting");
      return;
    }
    
    try {
      // Log detailed information about the submission
      console.log("Starting rating submission process with data:", { 
        rating: rating, 
        ratedUser: {
          id: selectedUser.id,
          name: [selectedUser.firstName, selectedUser.lastName].filter(Boolean).join(' ') || selectedUser.email
        },
        raterUser: {
          id: user.id,
          name: [user.firstName, user.lastName].filter(Boolean).join(' ') || user.email
        },
        connectionId: connectionToRemove
      });
      
      // Create rating with properly structured data
      console.log("Calling createRating action with parameters:", {
        rating: rating,
        ratedId: selectedUser.id,
        raterId: user.id
      });
      
      const ratingResult = await createRating({
        rating: rating, // Explicit number value
        rated: { _link: selectedUser.id }, // Properly structured belongsTo relationship
        rater: { _link: user.id } // Properly structured belongsTo relationship
      });
      
      console.log("Rating creation successful:", ratingResult);
      
      // Remove the connection after successful rating
      console.log("Now removing connection with ID:", connectionToRemove);
      
      const deleteResult = await deleteRequest({ id: connectionToRemove });
      console.log("Connection removal successful:", deleteResult);
      
      // Update UI and show success message
      toast.success("Rating submitted and connection removed. Skill earned!");
      setSelectedUser(null);
      setRefreshTrigger(prev => prev + 1);
      setRatingDialogOpen(false);
    } catch (err) {
      // Detailed error handling
      console.error("Rating submission process failed:", err);
      
      let errorMessage = "Failed to submit rating. Please try again.";
      
      if (err instanceof Error) {
        console.error("Error details:", {
          message: err.message,
          stack: err.stack
        });
        errorMessage = err.message;
      }
      
      setError(errorMessage);
      toast.error("Failed to submit rating");
    }
  };

  // Send a new message
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedUser || !newMessage.trim()) return;
    
    try {
      await createMessage({
        content: newMessage.trim(),
        receiver: { _link: selectedUser.id },
        read: false
      });
      
      setNewMessage("");
      refreshMessages();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to send message. Please try again.";
      setError(errorMessage);
      console.error("Send message error:", err);
    }
  };

  // Mark messages as read when viewed
  useEffect(() => {
    if (messagesData && selectedUser) {
      // Find unread messages where current user is the receiver
      const unreadMessages = messagesData.filter(
        message => !message.read && message.senderId === selectedUser.id && message.receiverId === user.id
      );
      
      // Mark each unread message as read
      if (unreadMessages.length > 0) {
        Promise.all(
          unreadMessages.map(message => 
            updateMessage({
              id: message.id,
              read: true
            })
          )
        ).then(() => {
          // Refresh messages after marking as read
          refreshMessages();
        }).catch(err => {
          console.error("Error marking messages as read:", err);
        });
      }
    }
  }, [messagesData, selectedUser, user.id, updateMessage, refreshMessages]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messagesData]);

  // Set up polling for messages
  useEffect(() => {
    const intervalId = setInterval(() => {
      if (selectedUser) {
        refreshMessages();
      }
    }, 5000); // Poll every 5 seconds
    
    return () => clearInterval(intervalId);
  }, [selectedUser, refreshMessages, refreshTrigger]);

  // Helper functions
  const getInitials = (firstName?: string, lastName?: string, email?: string) => {
    if (firstName && lastName) {
      return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
    } else if (firstName) {
      return firstName.charAt(0).toUpperCase();
    } else if (email) {
      return email.charAt(0).toUpperCase();
    }
    return "??";
  };

  const formatTime = (timestamp: string | Date) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (timestamp: string | Date) => {
    const date = new Date(timestamp);
    const today = new Date();
    
    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    }
    
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    }
    
    return date.toLocaleDateString();
  };

  return (
    <div className="container py-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Messages</h1>
      </div>
      
      {/* Rating Dialog */}
      <Dialog open={ratingDialogOpen} onOpenChange={setRatingDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rate Your Experience</DialogTitle>
            <DialogDescription>
              How would you rate working with {selectedUser ? [selectedUser.firstName, selectedUser.lastName].filter(Boolean).join(' ') || selectedUser?.email : 'this user'}?
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col space-y-4 py-4">
            <div className="flex justify-center py-4">
              <StarRating rating={rating} onRatingChange={setRating} />
            </div>
            {rating === 0 && (
              <div className="text-center text-sm text-orange-500">
                Please select a rating before submitting
              </div>
            )}
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setRatingDialogOpen(false)}
              disabled={creatingRating || deletingRequest}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleSubmitRating} 
              disabled={rating === 0 || creatingRating || deletingRequest}
            >
              {creatingRating || deletingRequest ? "Submitting..." : "Submit Rating"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      <div className="flex h-[70vh] gap-6">
        <Card className="w-1/4 max-w-xs">
          <CardHeader>
            <CardTitle>Connections</CardTitle>
            <CardDescription>
              Chat with your connections
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[calc(70vh-120px)] w-full">
              {loadingConnections ? (
                <div className="space-y-2 p-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex items-center gap-3 p-2">
                      <Skeleton className="h-10 w-10 rounded-full" />
                      <div className="space-y-1">
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-3 w-20" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : connections.length === 0 ? (
                <div className="p-4 text-center text-muted-foreground">
                  <p>No connections yet</p>
                </div>
              ) : (
                <div className="space-y-1">
                  {connections.map((connection) => {
                    const user = connection.connectedUser;
                    const fullName = [user.firstName, user.lastName].filter(Boolean).join(' ');
                    
                    return (
                      <button
                        key={connection.id}
                        className={`flex items-center gap-3 w-full p-3 text-left hover:bg-muted transition-colors ${
                          selectedUser?.id === user.id ? 'bg-muted' : ''
                        }`}
                        onClick={() => handleSelectUser(connection)}
                      >
                        <Avatar>
                          <AvatarImage src={user.googleImageUrl || undefined} />
                          <AvatarFallback>
                            {getInitials(user.firstName, user.lastName, user.email)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{fullName || user.email}</p>
                          <p className="text-xs text-muted-foreground truncate">
                            {user.email}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
        
        {/* Message display area */}
        <Card className="flex-1 flex flex-col">
          {selectedUser ? (
            <>
              <CardHeader className="border-b px-4 py-3 flex flex-row items-center justify-between">
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarImage src={selectedUser.googleImageUrl || undefined} />
                    <AvatarFallback>
                      {getInitials(selectedUser.firstName, selectedUser.lastName, selectedUser.email)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <CardTitle className="text-lg">
                      {[selectedUser.firstName, selectedUser.lastName].filter(Boolean).join(' ') || selectedUser.email}
                    </CardTitle>
                    <CardDescription>{selectedUser.email}</CardDescription>
                  </div>
                </div>
                <Button 
                  variant="destructive"
                  size="sm"
                  disabled={deletingRequest}
                  onClick={() => {
                    // Find the connection ID for the selected user
                    const connection = connections.find(c => c.connectedUser.id === selectedUser.id);
                    if (connection) {
                      handleSkillEarned(connection.id);
                    } else {
                      toast.error("Connection not found");
                    }
                  }}
                  className="flex items-center gap-1"
                >
                  <Award className="h-4 w-4 mr-1" />
                  Skill Earned
                </Button>
              </CardHeader>
              
              <ScrollArea className="flex-1 p-4">
                {loadingMessages ? (
                  <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className={`flex ${i % 2 === 0 ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[80%] ${i % 2 === 0 ? 'bg-primary text-primary-foreground' : 'bg-muted'} rounded-lg p-4`}>
                          <Skeleton className="h-4 w-48" />
                          <Skeleton className="h-4 w-32 mt-2" />
                          <div className="flex justify-end mt-1">
                            <Skeleton className="h-3 w-16" />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : messagesData && messagesData.length > 0 ? (
                  <div className="space-y-4">
                    {messagesData.map((message, index) => {
                      const isFromCurrentUser = message.senderId === user.id;
                      const showDate = index === 0 || formatDate(message.createdAt) !== formatDate(messagesData[index - 1]?.createdAt);
                      
                      return (
                        <React.Fragment key={message.id}>
                          {showDate && (
                            <div className="flex justify-center my-2">
                              <Badge variant="outline">{formatDate(message.createdAt)}</Badge>
                            </div>
                          )}
                          <div className={`flex items-start ${message.senderId === user.id ? 'justify-end' : 'justify-start'} mb-3`}>
                            {message.senderId !== user.id && (
                              <Avatar className="mr-2 flex-shrink-0 mt-1">
                                <AvatarImage src={message.sender.googleImageUrl || undefined} />
                                <AvatarFallback>
                                  {getInitials(message.sender.firstName, message.sender.lastName, message.sender.email)}
                                </AvatarFallback>
                              </Avatar>
                            )}
                            <div 
                              className={`max-w-[75%] rounded-lg p-3 ${
                                message.senderId === user.id 
                                  ? 'bg-primary text-primary-foreground' 
                                  : 'bg-muted'
                              }`}
                            >
                              <p className="break-words">{message.content}</p>
                              <div className="flex justify-end items-center gap-1 mt-1">
                                <span className="text-xs opacity-70">{formatTime(message.createdAt)}</span>
                                {message.senderId === user.id && (
                                  <span className="text-xs">{message.read ? '✓✓' : '✓'}</span>
                                )}
                              </div>
                            </div>
                          </div>
                        </React.Fragment>
                      );
                    })}
                    <div ref={messagesEndRef} />
                  </div>
                ) : (
                  <div className="h-full flex items-center justify-center">
                    <div className="text-center text-muted-foreground">
                      <MessageCircle className="mx-auto h-12 w-12 mb-3 opacity-30" />
                      <p>No messages yet</p>
                      <p className="text-sm">Send a message to start the conversation</p>
                    </div>
                  </div>
                )}
              </ScrollArea>
              
              {error && (
                <Alert variant="destructive" className="mx-4 my-2">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              
              <form onSubmit={handleSendMessage} className="border-t p-4 flex gap-2">
                <Input
                  placeholder="Type your message..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  disabled={sendingMessage}
                  className="flex-1"
                />
                <Button type="submit" disabled={sendingMessage || !newMessage.trim()}>
                  <Send className="h-4 w-4 mr-1" />
                  Send
                </Button>
              </form>
            </>
          ) : (
            <div className="h-full flex items-center justify-center">
              <div className="text-center text-muted-foreground">
                <MessageCircle className="mx-auto h-16 w-16 mb-4 opacity-30" />
                <h3 className="text-xl font-medium mb-2">No conversation selected</h3>
                <p>Choose a connection from the list to start chatting</p>
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
