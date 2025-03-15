import { ActionOptions } from "gadget-server";
import { GoogleGenerativeAI, GenerativeModel } from "@google/generative-ai";
import { UserSkillProficiencyLevelEnum } from "@gadget-client/skillissuesz";

export const params = {
  content: { type: "string" }
};

export const run: ActionRun = async ({ params, logger, api, config }) => {
  try {
    if (!params.content) {
      throw new Error("Content is required for skill extraction");
    }

    // Initialize the Google Generative AI with API key
    const genAI = new GoogleGenerativeAI(config.GEMINI_API_KEY as string);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro-latest" });
    // Create a prompt to extract skills
    const prompt = `
    Analyze the following text and extract a list of technical skills mentioned.
    For each skill:
    1. Provide the skill name
    2. Write a brief description of the skill
    3. Estimate the proficiency level as either "Beginner", "Intermediate", or "Expert" based on context clues
    
    Please format your response as a JSON array with objects containing "name", "description", and "proficiencyLevel" fields.
    Only include technical skills, not soft skills or personal traits. The proficiency level must be exactly one of: "Beginner", "Intermediate", or "Expert".
    
    Text to analyze:
    ${params.content}
    `;

    // Generate response from Gemini
    const result = await model.generateContent(prompt);
    const response = result.response;
    const text = response.text();

    // Extract JSON from the response text
    // The model might return the JSON inside markdown code blocks or with explanation text
    let jsonMatch = text.match(/```json\s*([\s\S]*?)\s*```/) ||
      text.match(/```\s*([\s\S]*?)\s*```/) ||
      text.match(/\[\s*\{[\s\S]*\}\s*\]/);

    let skills = [];

    if (jsonMatch && jsonMatch[1]) {
      try {
        // Parse the JSON string
        skills = JSON.parse(jsonMatch[1]);
      } catch (error) {
        logger.error("Failed to parse JSON from Gemini response", { error });
        // Try to extract just the JSON array
        const fullJsonMatch = text.match(/\[\s*\{[\s\S]*\}\s*\]/);
        if (fullJsonMatch) {
          try {
            skills = JSON.parse(fullJsonMatch[0]);
          } catch (innerError) {
            logger.error("Failed to parse JSON array from response", { innerError });
            throw new Error("Unable to parse skills from AI response");
          }
        }
      }
    } else {
      // If no JSON blocks found, try parsing the entire response
      try {
        skills = JSON.parse(text);
      } catch (error) {
        logger.error("Failed to parse entire response as JSON", { error, text });
        throw new Error("Unable to extract skills from the provided content");
      }
    }

    // Validate and normalize skills
    const validatedSkills = skills.map(skill => {
      // Make sure each skill has the required properties
      if (!skill.name) {
        throw new Error("A skill without a name was returned");
      }

      // Ensure proficiency level is one of the allowed values
      const allowedLevels = ["Beginner", "Intermediate", "Expert"];
      if (!skill.proficiencyLevel || !allowedLevels.includes(skill.proficiencyLevel)) {
        // Default to Intermediate if invalid or missing
        skill.proficiencyLevel = "Intermediate";
      }

      return {
        name: skill.name,
        description: skill.description || "",
        proficiencyLevel: skill.proficiencyLevel as UserSkillProficiencyLevelEnum
      };
    });

    return validatedSkills;
  } catch (error) {
    logger.error("Error extracting skills", { error });
    throw error;
  }
};

export const options: ActionOptions = {
  // Ensure this action is available via the API
  triggers: { api: true }
};