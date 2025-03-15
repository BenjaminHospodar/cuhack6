import { useUser } from "@gadgetinc/react";
import { api } from "../api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "react-router";

export default function SignedInPage() {
  const user = useUser(api);
  
  return (
    <div className="container mx-auto py-10">
      <h1 className="text-3xl font-bold mb-6">
        Welcome, {user.firstName || user.email}!
      </h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
        <Card>
          <CardHeader>
            <CardTitle>Skill Management</CardTitle>
            <CardDescription>
              Track and manage your skills and proficiency levels
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Skill Issues helps you organize your skills, track your progress, and identify areas for improvement.
              Add skills to your profile, set your proficiency level, and manage your skill development journey.
            </p>
          </CardContent>
          <CardFooter>
            <Button asChild>
              <Link to="/profile">View My Skills</Link>
            </Button>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Skill Exploration</CardTitle>
            <CardDescription>
              Discover and explore new skills to add to your repertoire
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Browse through our database of skills, discover trending technologies, and find new areas to expand your knowledge.
              Adding skills to your profile helps you keep track of what you're learning.
            </p>
          </CardContent>
          <CardFooter>
            <Button variant="secondary" asChild>
              <Link to="/explore">Explore Skills</Link>
            </Button>
          </CardFooter>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Getting Started</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="list-disc pl-6 space-y-2">
            <li>Visit your <Link to="/profile" className="text-primary underline hover:no-underline">Profile</Link> to add your skills and set your proficiency levels</li>
            <li>See all available skills in the <Link to="/explore" className="text-primary underline hover:no-underline">Explore</Link> section</li>
            <li>Track your progress over time by updating your skill proficiency levels</li>
            <li>Search for specific skills to see details and add them to your profile</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}