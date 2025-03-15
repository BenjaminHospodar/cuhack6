import { useState, useEffect, useRef } from "react";
import { useFindMany, useGlobalAction } from "@gadgetinc/react";
import { useOutletContext } from "react-router";
import { api } from "../api";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Search, User, Mail, Sparkles } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { AuthOutletContext } from "./_user";

export default function ExplorePage() {
  const { user } = useOutletContext<AuthOutletContext>();
  const [searchMethod, setSearchMethod] = useState("name");
  const [nameQuery, setNameQuery] = useState("");
  const [selectedSkillId, setSelectedSkillId] = useState<string | null>(null);
  const [recommendations, setRecommendations] = useState<any[]>([]);

  // Use the recommendSkills global action
  const [{ data: recommendData, fetching: loadingRecommendations, error: recommendError }, recommend] =
    useGlobalAction(api.recommendSkills);

  // Track if we've already made the initial recommendations call
  const hasCalledRecommend = useRef(false);

  // Fetch recommendations when component mounts
  useEffect(() => {
    if (user?.id && !hasCalledRecommend.current) {
      console.log('[Recommendations] Making initial API call for user ID:', user.id);
      recommend({ userId: user.id });
      hasCalledRecommend.current = true;
    }
  }, [user?.id]); // recommend intentionally omitted from dependencies

  // Update recommendations whenever the action data changes
  useEffect(() => {
    if (recommendData) {
      console.log('[Recommendations] Received data:', recommendData);
      console.log('[Recommendations] Data structure details:', {
        hasSuccess: 'success' in recommendData,
        successValue: recommendData.success,
        hasResult: 'result' in recommendData,
        resultType: recommendData.result ? typeof recommendData.result : 'null',
        resultIsArray: Array.isArray(recommendData.result),
        hasErrors: 'errors' in recommendData,
        errorsLength: recommendData.errors?.length,
      });
      
      // Case 1: Check if result is an array directly
      if (recommendData.success && Array.isArray(recommendData.result)) {
        console.log('[Recommendations] Found recommendations as direct array in result');
        setRecommendations(recommendData.result);
      } 
      // Case 2: Check if result contains recommendations property
      else if (recommendData.success && recommendData.result?.recommendations && Array.isArray(recommendData.result.recommendations)) {
        console.log('[Recommendations] Found recommendations in result.recommendations');
        setRecommendations(recommendData.result.recommendations);
      }
      // Case 3: Check if data itself contains recommendations array at top level
      else if (recommendData.recommendations && Array.isArray(recommendData.recommendations)) {
        console.log('[Recommendations] Found recommendations at top level');
        setRecommendations(recommendData.recommendations);
      }
      // Error case
      else if (recommendData.success === false) {
        console.error('[Recommendations] Error in recommendation data:', recommendData.errors || recommendData.error);
      }
      else {
        console.error('[Recommendations] Could not find recommendations in response structure:', recommendData);
      }
    }
    else {
      console.log('[Recommendations] No recommendation data received yet');
    }
  }, [recommendData]);

  // Fetch all skills for the skill selector
  const [{ data: skills, fetching: loadingSkills }] = useFindMany(api.skill, {
    select: {
      id: true,
      name: true,
    },
    sort: { name: "Ascending" }
  });

  // Fetch all users with their skills and detailed userSkill info (including proficiency)
  const [{ data: users, fetching: loadingUsers }] = useFindMany(api.user, {
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      skills: {
        edges: {
          node: {
            id: true,
            name: true,
          }
        }
      },
      userSkills: {
        edges: {
          node: {
            id: true,
            proficiencyLevel: true,
            skill: {
              id: true,
              name: true,
            }
          }
        }
      }
    }
  });

  // Filter users based on search criteria
  const filteredUsers = users?.filter(user => {
    if (searchMethod === "name" && nameQuery) {
      const query = nameQuery.toLowerCase();
      const fullName = `${user.firstName || ""} ${user.lastName || ""}`.toLowerCase();
      return fullName.includes(query) ||
        (user.firstName?.toLowerCase() || "").includes(query) ||
        (user.lastName?.toLowerCase() || "").includes(query);
    } else if (searchMethod === "skill" && selectedSkillId) {
      return user.userSkills?.edges.some(edge => edge.node.skill.id === selectedSkillId);
    }
    return searchMethod === "name" && !nameQuery || searchMethod === "skill" && !selectedSkillId;
  });

  // Get user initials for avatar
  const getUserInitials = (user: any) => {
    return (
      (user.firstName?.slice(0, 1) || "") +
      (user.lastName?.slice(0, 1) || "")
    ).toUpperCase() || "U";
  };

  // Get badge color based on proficiency level
  const getProficiencyBadgeColor = (level: string) => {
    switch (level) {
      case "Beginner": return "bg-blue-100 hover:bg-blue-100 text-blue-800";
      case "Intermediate": return "bg-yellow-100 hover:bg-yellow-100 text-yellow-800";
      case "Expert": return "bg-green-100 hover:bg-green-100 text-green-800";
      default: return "";
    }
  };

  return (
    <div className="container mx-auto py-8">
      {/* Recommended Skills Section */}
      <section className="mb-12">
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">Recommended Skills for You</h1>
          <p className="text-muted-foreground">
            Based on your current skills, here are some skills you might be interested in learning.
          </p>
        </div>

        {loadingRecommendations && (
          <div className="mt-6 text-center">
            <Sparkles className="h-8 w-8 mx-auto text-primary animate-pulse" />
            <p className="mt-2">Finding personalized recommendations for you...</p>
          </div>
        )}

        {recommendError && (
          <div className="mt-6 p-4 border border-red-200 bg-red-50 rounded-md text-red-600">
            <p>There was an error fetching your recommendations. Please try again later.</p>
          </div>
        )}

        {!loadingRecommendations && !recommendError && recommendations.length === 0 && hasCalledRecommend.current && (
          <div className="mt-6 text-center p-6 border border-dashed rounded-md bg-muted/20">
            <Sparkles className="h-8 w-8 mx-auto text-muted-foreground opacity-40" />
            <p className="mt-2">No skill recommendations found. Add more skills to your profile to get personalized recommendations.</p>
            <Button className="mt-4" variant="outline" asChild>
              <a href="/profile">Update Your Skills</a>
            </Button>
          </div>
        )}

        {!loadingRecommendations && recommendations.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {recommendations.map((rec, index) => (
              <Card key={index} className="overflow-hidden hover:shadow-md transition-shadow">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg flex items-center">
                    <Sparkles className="h-4 w-4 mr-2 text-primary" />
                    {rec.name}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {rec.description && (
                    <CardDescription className="mt-1 mb-3">
                      {rec.description}
                    </CardDescription>
                  )}
                  <div className="mt-2">
                    <p className="text-sm font-medium mb-1">Why it's recommended:</p>
                    <p className="text-sm text-muted-foreground">{rec.reason}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>

      <Separator className="my-8" />

      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Explore Users</h1>
        <p className="text-muted-foreground">
          Search for users by name or by skills. Connect with others who share your interests or have skills you're looking to learn.
        </p>
      </div>

      <Tabs value={searchMethod} onValueChange={setSearchMethod} className="mb-8">
        <TabsList className="mb-6">
          <TabsTrigger value="name">Search by Name</TabsTrigger>
          <TabsTrigger value="skill">Search by Skill</TabsTrigger>
        </TabsList>

        <TabsContent value="name">
          <div className="relative mb-6">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search users by name..."
              className="pl-8"
              value={nameQuery}
              onChange={(e) => setNameQuery(e.target.value)}
            />
          </div>
        </TabsContent>

        <TabsContent value="skill">
          <div className="mb-6">
            <Select value={selectedSkillId || ""} onValueChange={setSelectedSkillId}>
              <SelectTrigger>
                <SelectValue placeholder="Select a skill" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Skills</SelectItem>
                {skills?.map(skill => (
                  <SelectItem key={skill.id} value={skill.id}>
                    {skill.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </TabsContent>
      </Tabs>

      {loadingUsers ? (
        <div className="flex justify-center my-8">
          <p>Loading users...</p>
        </div>
      ) : (
        <>
          <h2 className="text-xl font-semibold mb-4">
            {filteredUsers?.length || 0} Users Found
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredUsers?.map(user => (
              <Card key={user.id} className="overflow-hidden">
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarFallback>{getUserInitials(user)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <CardTitle className="text-lg">
                        {user.firstName} {user.lastName}
                      </CardTitle>
                      <div className="flex items-center text-sm text-muted-foreground">
                        <Mail className="h-3.5 w-3.5 mr-1" />
                        {user.email}
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="mt-3">
                    <p className="text-sm font-medium mb-2">Skills:</p>
                    {user.userSkills?.edges.length ? (
                      <div className="flex flex-wrap gap-2">
                        {user.userSkills.edges.map(({ node }) => (
                          <Badge
                            key={node.id}
                            variant="outline"
                            className={`${getProficiencyBadgeColor(node.proficiencyLevel)}`}
                          >
                            {node.skill.name} - {node.proficiencyLevel}
                          </Badge>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">No skills added yet</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredUsers?.length === 0 && (
            <div className="text-center my-12 py-8">
              <User className="h-12 w-12 mx-auto text-muted-foreground opacity-20" />
              <h3 className="mt-4 text-lg font-medium">No users found</h3>
              <p className="text-muted-foreground">
                Try adjusting your search criteria
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
}