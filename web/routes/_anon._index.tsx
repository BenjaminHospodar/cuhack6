import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "react-router";

export default function () {
  return (
    <Card className="p-8 max-w-4xl w-full">
      <CardHeader>
        <CardTitle className="text-xl font-semibold">👋 Welcome to Skill Issues</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <p className="text-base">
          Welcome to Skill Issues! Sign up or sign in to add your skills and track your proficiency.
        </p>
        
        <div className="flex flex-col gap-3 pt-4">
          <Button
            variant="default"
            size="lg"
            className="w-full"
            asChild
          >
            <Link to="/sign-up">Sign up</Link>
          </Button>
          <Button
            variant="outline"
            size="lg"
            className="w-full"
            asChild
          >
            <Link to="/sign-in">Sign in</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
