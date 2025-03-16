import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { MessageCircle } from "lucide-react";

export default function Messages() {
  return (
    <div className="container py-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Messages</h1>
      </div>
      
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Your Conversations</CardTitle>
          <CardDescription>
            Connect and chat with other users through direct messages
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[300px] w-full rounded-md border p-4">
            <div className="flex flex-col items-center justify-center h-full space-y-4 text-center">
              <MessageCircle className="h-12 w-12 text-muted-foreground" />
              <Alert>
                <AlertTitle>Coming Soon!</AlertTitle>
                <AlertDescription>
                  The messaging feature is currently under development and will be available soon.
                  Check back later to connect and chat with other users.
                </AlertDescription>
              </Alert>
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}