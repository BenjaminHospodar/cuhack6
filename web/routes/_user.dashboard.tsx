import { useFindMany, useUser } from "@gadgetinc/react";
import { api } from "../api";
import { 
  Card,
  CardContent, 
  CardHeader, 
  CardTitle,
  CardDescription,
  CardFooter
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  PieChart, 
  BadgePlus, 
  Award, 
  TrendingUp,
  UserRound,
  MapPin,
  AlertCircle,
  CheckCircle2,
  Clock,
  Users
} from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Link } from "react-router";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

export default function Dashboard() {
  const user = useUser();
  
  // Fetch user skills
  const [{ data: userSkills, fetching: fetchingSkills, error: skillsError }] = useFindMany(api.userSkill, {
    select: {
      id: true,
      proficiencyLevel: true,
      createdAt: true,
      skill: {
        id: true,
        name: true,
        description: true
      }
    },
    filter: user?.id ? {
      userId: {
        equals: user?.id
      }
    } : {},
    sort: {
      createdAt: "Descending"
    }
  });
  
  // Fetch requests to check connections
  const [{ data: requests, fetching: fetchingRequests, error: requestsError }] = useFindMany(api.request, {
    select: {
      id: true,
      status: true,
      sender: {
        id: true,
        firstName: true,
        lastName: true
      },
      receiver: {
        id: true,
        firstName: true,
        lastName: true
      }
    },
    filter: user?.id ? {
      OR: [
        { senderId: { equals: user.id } },
        { receiverId: { equals: user.id } }
      ],
      status: { equals: "accepted" }
    } : {}
  });

  // Calculate statistics
  const totalSkills = userSkills?.length || 0;
  
  // Count skills by proficiency level
  const proficiencyCount = {
    "Beginner": userSkills?.filter(skill => skill.proficiencyLevel === "Beginner").length || 0,
    "Intermediate": userSkills?.filter(skill => skill.proficiencyLevel === "Intermediate").length || 0,
    "Expert": userSkills?.filter(skill => skill.proficiencyLevel === "Expert").length || 0
  };

  // Get recently added skills (last 30 days)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  
  const recentlyAddedSkills = userSkills?.filter(skill => 
    new Date(skill.createdAt) > thirtyDaysAgo
  );
  
  // Calculate profile completion
  const profileChecklist = [
    { item: "First Name", completed: !!user?.firstName },
    { item: "Last Name", completed: !!user?.lastName },
    { item: "City", completed: !!user?.city },
    { item: "At least one skill", completed: totalSkills > 0 }
  ];
  
  const completedItems = profileChecklist.filter(item => item.completed).length;
  const profileCompletionPercentage = Math.round((completedItems / profileChecklist.length) * 100);
  
  // Calculate connection stats
  const connections = requests?.filter(req => 
    (req.sender?.id === user?.id || req.receiver?.id === user?.id) && req.status === "accepted"
  ) || [];
  const connectionCount = connections.length;
  
  if (skillsError) {
    return <div className="p-6">Error loading skills: {skillsError.message}</div>;
  }
  
  if (requestsError) {
    return <div className="p-6">Error loading connection data: {requestsError.message}</div>;
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col space-y-2 mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome back{user?.firstName ? `, ${user.firstName}` : ""}! Here's an overview of your profile.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Profile completion section */}
        <Card className={profileCompletionPercentage === 100 ? "border-green-300" : "border-amber-300"}>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle>Profile Completion</CardTitle>
              <Badge variant={profileCompletionPercentage === 100 ? "success" : "outline"}>
                {profileCompletionPercentage}%
              </Badge>
            </div>
            <CardDescription>
              Complete your profile to get discovered by others
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Progress 
              className={`h-2 ${profileCompletionPercentage === 100 ? "bg-green-100" : "bg-amber-100"}`}
              value={profileCompletionPercentage}
            />
            
            <div className="space-y-2">
              {profileChecklist.map((item, i) => (
                <div key={i} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {item.completed ? (
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                    ) : (
                      <AlertCircle className="h-4 w-4 text-amber-500" />
                    )}
                    <span className={item.completed ? "text-muted-foreground" : "font-medium"}>
                      {item.item}
                    </span>
                  </div>
                  {!item.completed && (
                    <Link to="/profile">
                      <Button variant="ghost" size="sm">Add</Button>
                    </Link>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
          <CardFooter>
            <Link to="/profile" className="w-full">
              <Button size="sm" variant="outline" className="w-full">
                {profileCompletionPercentage === 100 ? "View Profile" : "Complete Your Profile"}
              </Button>
            </Link>
          </CardFooter>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Skills you've added in the last 30 days</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {recentlyAddedSkills && recentlyAddedSkills.length > 0 ? (
              <div className="space-y-3">
                {recentlyAddedSkills.slice(0, 5).map(skill => (
                  <div key={skill.id} className="flex items-start gap-3">
                    <Clock className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="font-medium">{skill.skill.name}</p>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                          {skill.proficiencyLevel}
                        </Badge>
                        <p className="text-xs text-muted-foreground">
                          {new Date(skill.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-6 text-center">
                <Award className="h-10 w-10 text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground mb-4">
                  You haven't added any skills recently
                </p>
                <Link to="/profile">
                  <Button size="sm" variant="secondary">Add Your First Skill</Button>
                </Link>
              </div>
            )}
          </CardContent>
          <CardFooter>
            <Link to="/explore" className="w-full">
              <Button size="sm" variant="outline" className="w-full">
                Explore More Skills
              </Button>
            </Link>
          </CardFooter>
        </Card>
      </div>

      <Separator className="my-6" />

      <div className="space-y-4">
        <h2 className="text-xl font-semibold tracking-tight">Skill Statistics</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Skills</CardTitle>
              <Award className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalSkills}</div>
              <p className="text-xs text-muted-foreground">
                Skills in your portfolio
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Beginner</CardTitle>
              <BadgePlus className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{proficiencyCount.Beginner}</div>
              <Progress 
                className="h-2" 
                value={totalSkills ? (proficiencyCount.Beginner / totalSkills) * 100 : 0} 
              />
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Intermediate</CardTitle>
              <TrendingUp className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{proficiencyCount.Intermediate}</div>
              <Progress 
                className="h-2" 
                value={totalSkills ? (proficiencyCount.Intermediate / totalSkills) * 100 : 0} 
              />
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Expert</CardTitle>
              <PieChart className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{proficiencyCount.Expert}</div>
              <Progress 
                className="h-2" 
                value={totalSkills ? (proficiencyCount.Expert / totalSkills) * 100 : 0} 
              />
            </CardContent>
          </Card>
        </div>
      </div>
      
      <div className="space-y-4 mt-6">
        <h2 className="text-xl font-semibold tracking-tight">Network</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Connections</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{connectionCount}</div>
              <p className="text-xs text-muted-foreground">
                People in your network
              </p>
            </CardContent>
            <CardFooter>
              <Link to="/requests" className="w-full">
                <Button size="sm" variant="outline" className="w-full">
                  Manage Connections
                </Button>
              </Link>
            </CardFooter>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Profile Details</CardTitle>
              <UserRound className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-2">
                <UserRound className="h-4 w-4 text-muted-foreground" />
                <p className="text-sm">
                  {user?.firstName && user?.lastName 
                    ? `${user.firstName} ${user.lastName}`
                    : "Name not set"}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <p className="text-sm">{user?.city || "Location not set"}</p>
              </div>
            </CardContent>
            <CardFooter>
              <Link to="/profile" className="w-full">
                <Button size="sm" variant="outline" className="w-full">
                  Edit Profile
                </Button>
              </Link>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
}