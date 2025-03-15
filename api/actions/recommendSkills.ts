import { GoogleGenerativeAI } from "@google/generative-ai";

export const params = {
  userId: { type: "string" }
};

export const run: ActionRun = async ({ params, logger, api, config }) => {
  // Define fallback recommendations to use if anything goes wrong
  const defaultRecommendations = [
    {
      name: "Project Management",
      description: "The practice of leading the work of a team to achieve desired outcomes within specific constraints.",
      reason: "A universal skill that complements technical abilities with organizational competence."
    },
    {
      name: "Data Analysis",
      description: "The process of inspecting, cleansing, transforming, and modeling data to discover useful information.",
      reason: "Growing in demand across virtually all industries and complementary to most technical skills."
    },
    {
      name: "Public Speaking",
      description: "The act of performing a speech to a live audience to inform, persuade or entertain.",
      reason: "Enhances your ability to communicate ideas effectively regardless of your field."
    },
    {
      name: "Technical Writing",
      description: "Creating documentation that helps users understand and use a product or service.",
      reason: "Critical for sharing knowledge and documenting processes in any technical role."
    },
    {
      name: "Time Management",
      description: "Planning and controlling how much time to spend on specific activities.",
      reason: "Foundational for productivity and effectiveness in any professional context."
    }
  ];

  if (!params.userId) {
    logger.warn("User ID parameter is missing");
    return {
      recommendations: defaultRecommendations,
      source: "default"
    };
  }

  try {
    // Fetch the user's existing skills from the database
    logger.info("Fetching user skills", { userId: params.userId });
    const userSkills = await api.userSkill.findMany({
      filter: {
        userId: { equals: params.userId }
      },
      select: {
        skill: {
          id: true,
          name: true,
          description: true
        },
        proficiencyLevel: true
      }
    });

    logger.info("Found user skills", { count: userSkills.length, userId: params.userId });

    if (userSkills.length === 0) {
      logger.info("No skills found for user, returning empty recommendations", { userId: params.userId });
      return {
        recommendations: [],
        source: "empty"
      };
    }

    // Format the user's skills for the Gemini API
    const formattedSkills = userSkills.map(userSkill => ({
      name: userSkill.skill.name,
      description: userSkill.skill.description || "",
      proficiency: userSkill.proficiencyLevel
    }));

    // Initialize the Gemini API client
    logger.debug("Initializing Gemini API client");
    const genAI = new GoogleGenerativeAI(config.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro-latest" });

    // Create the prompt for skill recommendations
    const prompt = `
      Based on the following skills a user has, suggest 5 new skills they should learn next.
      
      User's current skills:
      ${JSON.stringify(formattedSkills, null, 2)}
      
      Please provide a JSON array of objects with the following structure:
      [
        {
          "name": "Skill Name",
          "description": "Brief description of the skill",
          "reason": "Why this skill complements their existing skillset"
        }
      ]
      
      Return ONLY the JSON array, with no additional text.
    `;

    try {
      // Generate recommendations with Gemini
      logger.info("Calling Gemini API for recommendations");
      const result = await model.generateContent(prompt);
      const response = result.response;
      const text = response.text();
      
      logger.debug("Received raw response from Gemini", { responseLength: text.length });

      // Extract and parse the JSON array from the response more robustly
      let recommendations;
      
      // First, try to parse the entire response as JSON
      try {
        recommendations = JSON.parse(text);
        logger.info("Successfully parsed complete response as JSON");
      } catch (directParseError) {
        logger.debug("Could not parse entire response as JSON, trying to extract JSON array", { 
          error: directParseError.message 
        });
        
        // If that fails, try to extract a JSON array using regex
        const jsonMatch = text.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
          try {
            recommendations = JSON.parse(jsonMatch[0]);
            logger.info("Successfully extracted and parsed JSON array from response");
          } catch (extractParseError) {
            logger.error("Failed to parse extracted JSON array", { 
              error: extractParseError.message,
              extractedText: jsonMatch[0].substring(0, 100) + "..." 
            });
            throw new Error("Invalid JSON format in extracted array");
          }
        } else {
          logger.error("Failed to find JSON array in response", { 
            responseSample: text.substring(0, 100) + "..." 
          });
          throw new Error("No JSON array found in response");
        }
      }
      
      // Validate that we got an array of recommendation objects
      if (!Array.isArray(recommendations)) {
        logger.error("Parsed result is not an array", { type: typeof recommendations });
        throw new Error("Expected array of recommendations");
      }
      
      logger.info("Successfully generated recommendations", { count: recommendations.length });
      return { 
        recommendations,
        source: "gemini" 
      };
    } catch (aiError) {
      logger.error("Error with Gemini API", { 
        error: aiError.message,
        stack: aiError.stack
      });
      
      // Return default recommendations instead of failing
      logger.info("Falling back to default recommendations");
      return { 
        recommendations: defaultRecommendations,
        source: "default-ai-error" 
      };
    }
  } catch (error) {
    // Catch any other errors in the overall process
    logger.error("Unexpected error in recommendSkills action", { 
      error: error.message,
      stack: error.stack,
      userId: params.userId
    });
    
    // Always return something useful rather than throwing
    return { 
      recommendations: defaultRecommendations,
      source: "default-unexpected-error" 
    };
  }
};