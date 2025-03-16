import { useState, useEffect, useRef, useMemo } from "react";
import { useFindMany, useGlobalAction, useAction } from "@gadgetinc/react";
import { useOutletContext } from "react-router";
import { api } from "../api";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Search, Sparkles, Plus, Users, User, X, UserPlus, Clock, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { toast } from "sonner";
import { AuthOutletContext } from "./_user";

export default function ExplorePage() {
  const { user } = useOutletContext<AuthOutletContext>();
  const [searchQuery, setSearchQuery] = useState("");
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [selectedSkillId, setSelectedSkillId] = useState<string | null>(null);
  const [skillSearchQuery, setSkillSearchQuery] = useState('');
  const [userRequestMap, setUserRequestMap] = useState<Record<string, string>>({});

  // Fetch the user's sent requests to determine button states
  const [{ data: sentRequests }, refetchSentRequests] = useFindMany(api.request, {
    filter: {
      senderId: { equals: user?.id },
      status: { equals: "pending" }
    },
    select: {
      id: true,
      senderId: true,
      receiverId: true,
      status: true
    }
  });

  // Create a map of receiverId -> requestId for easy lookup
  useEffect(() => {
    if (sentRequests) {
      const requestMap: Record<string, string> = {};
      sentRequests.forEach(request => {
        // All requests in this fetch should be pending based on filter,
        // but we double-check for safety
        if (request.status === "pending") {
          requestMap[request.receiverId] = request.id;
        }
      });
      setUserRequestMap(requestMap);
    }
  }, [sentRequests]);

  // Actions for creating and deleting requests
  const [{ fetching: creatingRequest }, createRequest] = useAction(api.request.create);
  const [{ fetching: deletingRequest }, deleteRequest] = useAction(api.request.delete);

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

  // Action to add skills to user profile
  const [{ fetching: addingSkill }, addUserSkill] = useAction(api.userSkill.create);

  // Fetch all skills with user counts
  const [{ data: skills, fetching: loadingSkills, error: skillsError }] = useFindMany(api.skill, {
    select: {
      id: true,
      name: true,
      description: true,
      users: {
        edges: {
          node: {
            id: true,
            firstName: true,
            lastName: true
          }
        }
      }
    },
    sort: { name: "Ascending" }
  });

  // Fetch all users except the current user with their skills
  const [{ data: users, fetching: loadingUsers, error: usersError }] = useFindMany(api.user, {
    filter: {
      id: { notEquals: user.id }
    },
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
            description: true
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
              name: true
            }
          }
        }
      }
    }
  });

  // Debug log when skills are loaded or errors occur
  useEffect(() => {
    if (skills) {
      console.log('[Skills] Loaded skills:', skills.length);
    }
    if (skillsError) {
      console.error('[Skills] Error loading skills:', skillsError);
    }
  }, [skills, skillsError]);

  // Handler for adding a skill to user profile
  const handleAddSkill = async (skillId: string, skillName: string) => {
    try {
      await addUserSkill({
        skill: { _link: skillId },
        user: { _link: user.id },
        proficiencyLevel: "Beginner"
      });
      
      toast.success(`Added ${skillName} to your profile`, {
        description: "You can update your proficiency level in your profile"
      });
    } catch (error) {
      toast.error("Failed to add skill", {
        description: "This skill might already be in your profile or there was a server error"
      });
    }
  };

  // Filter skills based on search query
  const filteredSkills = skills?.filter(skill => {
    if (!searchQuery) return true;
    
    const query = searchQuery.toLowerCase();
    const matchesName = skill.name.toLowerCase().includes(query);
    const matchesDescription = skill.description && skill.description.toLowerCase().includes(query);
    const matchesUserCount = String(skill.users.edges.length).includes(query);
    
    return matchesName || matchesDescription || matchesUserCount;
  });

  // Handle skill selection for filtering users
  const handleSkillFilterSelect = (skillId: string) => {
    if (selectedSkillId === skillId) {
      // If same skill is clicked again, clear the filter
      setSelectedSkillId(null);
    } else {
      setSelectedSkillId(skillId);
    }
  };

  // Filter users by selected skill
  const filteredUsers = useMemo(() => {
    if (!users || users.length === 0) return [];
    if (!selectedSkillId) return users;

    return users.filter(user => {
      return user.skills?.edges.some(edge => edge.node.id === selectedSkillId);
    });
  }, [users, selectedSkillId]);

  // Get the name of the selected skill for display
  const selectedSkillName = useMemo(() => {
    if (!selectedSkillId || !skills) return null;
    const skill = skills.find(s => s.id === selectedSkillId);
    return skill ? skill.name : null;
  }, [selectedSkillId, skills]);

  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Explore Skills</h1>
        <p className="text-muted-foreground">
          Discover new skills to learn and add to your profile. Browse all available skills or get personalized recommendations.
        </p>
      </div>
      
      {/* Recommended Skills Section */}
      <section className="mb-12">
        <div className="mb-6">
          <h2 className="text-2xl font-bold mb-2">Recommended Skills for You</h2>
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
      
      {/* Browse Users by Skill Section */}
      <section>
        <div className="mb-6">
          <h2 className="text-2xl font-bold mb-2">Browse Other Users by Skill</h2>
          <p className="text-muted-foreground">
            Discover other users with specific skills. Click on a skill to filter the users.
          </p>
        </div>

        {/* Skill filter */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-2">Filter by Skill</h3>
          
          {/* Searchable skill filter */}
          <div className="relative mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search for skills..."
                className="pl-9"
                value={skillSearchQuery}
                onChange={(e) => setSkillSearchQuery(e.target.value)}
              />
            </div>
            
            {/* Display filtered skills below the search */}
            <div className="mt-3 flex flex-wrap gap-2">
              {loadingSkills ? (
                <p className="text-sm text-muted-foreground">Loading skills...</p>
              ) : skillsError ? (
                <p className="text-sm text-red-500">Error loading skills</p>
              ) : (
                skills && skills.length > 0 ? (
                  skills
                    .filter(skill => {
                      if (!skillSearchQuery) return true;
                      return skill.name.toLowerCase().includes(skillSearchQuery.toLowerCase()) || 
                             (skill.description && skill.description.toLowerCase().includes(skillSearchQuery.toLowerCase()));
                    })
                    .map(skill => (
                      <Badge 
                        key={skill.id}
                        className={`cursor-pointer px-3 py-1 ${selectedSkillId === skill.id ? 'bg-primary' : 'bg-secondary'}`}
                        onClick={() => handleSkillFilterSelect(skill.id)}
                      >
                        {skill.name}
                        {skill.users.edges.length > 0 && (
                          <span className="ml-1 text-xs">({skill.users.edges.length})</span>
                        )}
                      </Badge>
                    ))
                ) : (
                  <p className="text-sm text-muted-foreground">No skills available</p>
                )
              )}
            </div>
          </div>
          
          {selectedSkillId && (
            <div className="flex items-center gap-2 mb-4">
              <p className="text-sm">
                Showing users with skill: <span className="font-medium">{selectedSkillName}</span>
              </p>
              <Button 
                size="sm" 
                variant="ghost" 
                className="h-6 px-2" 
                onClick={() => setSelectedSkillId(null)}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          )}
        </div>

        {/* Display filtered users */}
        {loadingUsers ? (
          <div className="flex justify-center my-8">
            <p>Loading users...</p>
          </div>
        ) : usersError ? (
          <div className="mt-6 p-4 border border-red-200 bg-red-50 rounded-md text-red-600">
            <p>There was an error fetching users. Please try again later.</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredUsers.map(user => (
                <Card key={user.id} className="overflow-hidden hover:shadow-md transition-shadow">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg flex items-center">
                      <User className="h-4 w-4 mr-2 text-primary" />
                      {user.firstName && user.lastName 
                        ? `${user.firstName} ${user.lastName}`
                        : user.email}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="mb-3">
                      <h4 className="text-sm font-medium mb-1">Skills:</h4>
                      <div className="flex flex-wrap gap-1">
                        {user.userSkills.edges.length > 0 ? (
                          user.userSkills.edges.map(edge => (
                            <Badge 
                              key={edge.node.id} 
                              variant="outline"
                              className={selectedSkillId === edge.node.skill.id ? "border-primary text-primary" : ""}
                            >
                              {edge.node.skill.name}
                              <span className="ml-1 text-xs opacity-70">
                                ({edge.node.proficiencyLevel})
                              </span>
                            </Badge>
                          ))
                        ) : (
                          <p className="text-xs text-muted-foreground">No skills listed</p>
                        )}
                      </div>
                    </div>
                    <div className="mt-4">
                      {userRequestMap[user.id] ? (
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full flex items-center gap-2 text-yellow-600 border-yellow-200 hover:bg-yellow-50"
                          onClick={async () => {
                            try {
                              await deleteRequest({
                                id: userRequestMap[user.id]
                              });
                              // Refetch to update UI
                              await refetchSentRequests();
                              toast.success("Request canceled", {
                                description: "You've canceled your request to connect"
                              });
                            } catch (error) {
                              toast.error("Failed to cancel request", {
                                description: "There was a problem canceling your request"
                              });
                            }
                          }}
                          disabled={deletingRequest}
                        >
                          <Clock className="h-4 w-4" />
                          Pending
                        </Button>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full flex items-center gap-2 text-primary hover:bg-primary/5"
                          onClick={async () => {
                            try {
                              // Correctly set current user as sender and card user as receiver
                              await createRequest({
                                sender: { _link: user.id },
                                receiver: { _link: user.id }, // This user is the displayed user
                                status: "pending"
                              });
                              // Refetch to update UI
                              await refetchSentRequests();
                              toast.success("Request sent", {
                                description: "You've sent a request to connect"
                              });
                            } catch (error) {
                              toast.error("Failed to send request", {
                                description: "There was a problem sending your request"
                              });
                            }
                          }}
                          disabled={creatingRequest}
                        >
                          <UserPlus className="h-4 w-4" />
                          Request
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {filteredUsers.length === 0 && (
              <div className="text-center my-12 py-8">
                <User className="h-12 w-12 mx-auto text-muted-foreground opacity-20" />
                <h3 className="mt-4 text-lg font-medium">No users found</h3>
                <p className="text-muted-foreground">
                  {selectedSkillId 
                    ? "No users have this skill yet" 
                    : "Try selecting a skill to see users"
                  }
                </p>
              </div>
            )}
          </>
        )}
      </section>
    </div>
  );
}
