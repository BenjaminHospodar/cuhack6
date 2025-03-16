import { GoogleGenerativeAI } from "@google/generative-ai";
import { ActionOptions } from "gadget-server";

export const params = {
  userId: { type: "string" }
};

export const run: ActionRun = async ({ params, logger, api, config, signal }) => {
  //define fallback recommendations to use if anything goes wrong
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

  // Validate Gemini API key
  if (!config.GEMINI_API_KEY) {
    logger.error("Missing Gemini API key in configuration");
    return {
      recommendations: defaultRecommendations, 
      source: "default-missing-api-key"
    };
  }

  if (typeof config.GEMINI_API_KEY !== 'string' || !config.GEMINI_API_KEY.startsWith('AI')) {
    logger.error("Invalid Gemini API key format");
    return {
      recommendations: defaultRecommendations,
      source: "default-invalid-api-key"
    };
  }

  try {
    // Fetch the user's existing skills from the database
    const startTime = Date.now();
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
    logger.debug("User skills fetch completed", { 
      duration: `${Date.now() - startTime}ms`, 
      count: userSkills.length 
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
    const model = genAI.getGenerativeModel({ 
      model: "gemini-1.5-pro-latest",
      // Set safety settings if needed
      safetySettings: [
        {
          category: "HARM_CATEGORY_HARASSMENT",
          threshold: "BLOCK_MEDIUM_AND_ABOVE"
        }
      ]
    });

    // Create a more specific prompt for skill recommendations
    const prompt = `
      Based on the following skills a user has, suggest 5 new skills they should learn next.
      
      User's current skills:
      ${JSON.stringify(formattedSkills, null, 2)}
      
      Important instructions:
      1. Recommend 5 skills that complement but don't overlap with their existing skills
      2. Each skill should build on their current knowledge or open new career opportunities
      3. Provide recommendations that match their current skill level
      4. Be specific and practical with your recommendations
      
      Response requirements:
      - You MUST return ONLY a valid JSON array with no explanations or text before or after
      - Use this EXACT format with no variations:
      [
        {
          "name": "Skill Name",
          "description": "Brief description of the skill (15-25 words)",
          "reason": "Why this skill complements their existing skillset (15-25 words)"
        }
      ]
      
      Ensure the JSON is properly formatted with double quotes around property names and string values.
    `;

    // Implement retry logic for Gemini API calls
    const maxRetries = 3;
    let retryCount = 0;
    let recommendations;
    let lastError = null;

    while (retryCount < maxRetries) {
      try {
        // Generate recommendations with Gemini
        logger.info("Calling Gemini API for recommendations", { 
          attempt: retryCount + 1,
          maxRetries 
        });
        
        const apiCallStart = Date.now();
        
        // Use AbortSignal for timeout control
        const result = await model.generateContent({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.4,  // Lower temperature for more consistent, formatted results
            topP: 0.8,
            topK: 40,
          }
        }, { signal });
        
        const apiCallDuration = Date.now() - apiCallStart;
        logger.debug("Gemini API call completed", { duration: `${apiCallDuration}ms` });
        
        const response = result.response;
        const text = response.text();
        
        logger.debug("Received raw response from Gemini", { 
          responseLength: text.length,
          responseSample: text.substring(0, 200) + (text.length > 200 ? "..." : "")
        });

        // Extract and parse the JSON array from the response more robustly
        try {
          recommendations = JSON.parse(text);
          logger.info("Successfully parsed complete response as JSON");
        } catch (directParseError) {
          logger.debug("Could not parse entire response as JSON, trying to extract JSON array", { 
            error: directParseError.message,
            rawResponse: text.length > 1000 ? text.substring(0, 1000) + "..." : text
          });
          
          // Try multiple regex patterns to extract JSON
          const jsonPatterns = [
            /\[\s*\{[\s\S]*\}\s*\]/,      // Standard array of objects
            /\[\s*\{[\s\S]*\}\s*,?\s*\]/,  // Handle trailing comma
            /\{[\s\S]*"name"[\s\S]*\}/     // Try to find at least one object
          ];
          
          let extractedJson = null;
          for (const pattern of jsonPatterns) {
            const match = text.match(pattern);
            if (match) {
              extractedJson = match[0];
              logger.debug("Found potential JSON with pattern", { 
                pattern: pattern.toString(),
                extractedMatch: extractedJson.substring(0, 100) + "..." 
              });
              break;
            }
          }
          
          if (extractedJson) {
            try {
              // Try to fix common JSON formatting issues
              const cleanedJson = extractedJson
                .replace(/,(\s*[\]}])/g, '$1')  // Remove trailing commas
                .replace(/(['"])?([a-zA-Z0-9_]+)(['"])?:/g, '"$2":'); // Ensure property names are quoted
                
              recommendations = JSON.parse(cleanedJson);
              logger.info("Successfully extracted and parsed JSON array from response");
            } catch (extractParseError) {
              logger.error("Failed to parse extracted JSON array", { 
                error: extractParseError.message,
                extractedText: extractedJson.substring(0, 200) + "..." 
              });
              throw new Error(`Invalid JSON format in extracted array: ${extractParseError.message}`);
            }
          } else {
            logger.error("Failed to find JSON array in response", { 
              responseSample: text.substring(0, 300) + "..." 
            });
            throw new Error("No JSON array found in response");
          }
        }
        
        // Validate that we got an array of recommendation objects with required properties
        if (!Array.isArray(recommendations)) {
          logger.error("Parsed result is not an array", { type: typeof recommendations });
          throw new Error("Expected array of recommendations");
        }
        
        // Validate each recommendation has the required properties
        const validRecommendations = recommendations.filter(rec => {
          return rec && 
                 typeof rec === 'object' && 
                 typeof rec.name === 'string' && 
                 typeof rec.description === 'string' && 
                 typeof rec.reason === 'string';
        });
        
        if (validRecommendations.length === 0) {
          logger.error("No valid recommendations in response", { 
            originalCount: recommendations.length
          });
          throw new Error("No valid recommendations found");
        }
        
        if (validRecommendations.length < recommendations.length) {
          logger.warn("Some recommendations were invalid and filtered out", {
            originalCount: recommendations.length,
            validCount: validRecommendations.length
          });
          recommendations = validRecommendations;
        }
        
        // Limit to 5 recommendations
        if (recommendations.length > 5) {
          logger.info("Limiting recommendations to 5", { 
            originalCount: recommendations.length 
          });
          recommendations = recommendations.slice(0, 5);
        }
        
        // Success! Break out of the retry loop
        logger.info("Successfully generated recommendations", { 
          count: recommendations.length,
          totalApiTime: `${apiCallDuration}ms`,
          retries: retryCount
        });
        
        return { 
          recommendations,
          source: "gemini",
          metadata: {
            retries: retryCount,
            processingTime: apiCallDuration
          }
        };
      } catch (aiError) {
        lastError = aiError;
        retryCount++;
        
        if (retryCount < maxRetries) {
          // Exponential backoff for retries
          const backoffMs = Math.min(1000 * Math.pow(2, retryCount - 1), 10000);
          logger.warn(`Gemini API call failed, retrying in ${backoffMs}ms`, { 
            error: aiError.message, 
            attempt: retryCount,
            maxRetries
          });
          
          await new Promise(resolve => setTimeout(resolve, backoffMs));
        } else {
          logger.error("All Gemini API retry attempts failed", { 
            error: aiError.message,
            stack: aiError.stack,
            totalAttempts: retryCount
          });
        }
      }
    }
    
    // If we get here, all retries failed
    logger.error("Failed to get recommendations after all retries", {
      error: lastError?.message,
      userId: params.userId
    });
    
    // Return default recommendations instead of failing
    return { 
      recommendations: defaultRecommendations,
      source: "default-after-retries",
      error: lastError?.message
    };
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
      source: "default-unexpected-error",
      error: error.message
    };
  }
};

export const options: ActionOptions = {
  timeoutMS: 30000  // 30 seconds timeout
};