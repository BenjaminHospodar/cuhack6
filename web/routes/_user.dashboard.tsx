import { useFindMany, useUser } from "@gadgetinc/react";
import { api } from "../api";
import { 
  Card,
  CardContent, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  PieChart, 
  BadgePlus, 
  Award, 
  TrendingUp
} from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Link } from "react-router";

export default function Dashboard() {
  const user = useUser();
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

  if (skillsError) {
    return <div className="p-6">Error loading skills: {skillsError.message}</div>;
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Overview of your profile and important metrics
        </p>
      </div>

      {/* Stats cards */}
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
      
      <div className="flex justify-center mt-8">
        <Link to="/profile">
          <Button size="lg" className="gap-2">
            Manage Your Skills
          </Button>
        </Link>
      </div>
    </div>
  );
}