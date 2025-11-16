require('dotenv').config();
const { genAI, DEFAULT_MODEL } = require('../config/gemini');
const { getFunctionDefinitions } = require('../config/functions');
const memoryService = require('./memoryService');
const voterApiService = require('./voterApiService');
const { normalizeGender, normalizeDate, extractRegistrationData } = require('../utils/dataNormalizer');

class GeminiService {
  constructor() {
    this.functionDefinitions = getFunctionDefinitions();
  }

  async chat(userId, sessionId, userMessage) {
    try {
      // Pre-process user message to extract and normalize data from comma-separated format
      const parts = userMessage.split(',').map(p => p.trim());
      if (parts.length >= 9) {
        // Likely format: aadhaar, name, fatherName, dob, gender, mobile, email, address, state, district
        // Also handle: email, password, mobile format for login
        let extractedData = {};
        
        // Check if it's login format (email, password, mobile)
        if (parts.length === 3 && parts[1].includes('@') === false && parts[1].length > 5) {
          // Likely password in middle
          extractedData = {
            email: parts[0],
            password: parts[1],
            mobile: parts[2]
          };
        } else {
          // Registration format
          extractedData = {
            aadhaar: parts[0] || extractRegistrationData(userMessage).aadhaar,
            fullName: parts[1],
            fatherName: parts[2],
            dob: normalizeDate(parts[3]) || parts[3],
            gender: normalizeGender(parts[4]) || parts[4],
            mobile: parts[5] || extractRegistrationData(userMessage).mobile,
            email: parts[6] || extractRegistrationData(userMessage).email,
            address: parts[7],
            state: parts[8],
            district: parts[9] || parts[8] // Sometimes district might be in state position
          };
        }
        
        // Remove undefined values
        Object.keys(extractedData).forEach(key => {
          if (!extractedData[key]) delete extractedData[key];
        });
        
        if (Object.keys(extractedData).length > 0) {
          await memoryService.updateUserMemory(userId, extractedData);
          console.log('[GEMINI] Extracted comma-separated data:', extractedData);
        }
      } else {
        // Try regular extraction
        const extractedData = extractRegistrationData(userMessage);
        if (extractedData.gender) {
          extractedData.gender = normalizeGender(extractedData.gender);
        }
        if (extractedData.dob) {
          extractedData.dob = normalizeDate(extractedData.dob);
        }
        if (Object.keys(extractedData).length > 0) {
          await memoryService.updateUserMemory(userId, extractedData);
          console.log('[GEMINI] Extracted data:', extractedData);
        }
      }
      
      const userMemory = await memoryService.getUserMemory(userId);
      const conversationHistory = await memoryService.getConversationHistory(sessionId);

      // Build system prompt
      const systemPrompt = this.buildSystemPrompt(userMemory);

      // Build conversation history for Gemini
      const history = this.buildHistory(conversationHistory);

      // Prepare contents array
      const contents = [
        ...history,
        { role: 'user', parts: [{ text: userMessage }] }
      ];

      // Convert function definitions to tools format
      const functionDeclarations = this.functionDefinitions.map(func => ({
        name: func.name,
        description: func.description,
        parametersJsonSchema: func.parameters
      }));

      // Generate content using the correct API
      const result = await genAI.models.generateContent({
        model: DEFAULT_MODEL,
        contents: contents,
        systemInstruction: { parts: [{ text: systemPrompt }] },
        config: {
          tools: [{
            functionDeclarations: functionDeclarations
          }]
        }
      });

      // The result structure: result.candidates[0].content.parts
      let responseText = '';
      let functionCalls = [];

      // Get the first candidate
      const candidate = result.candidates?.[0];
      if (!candidate || !candidate.content) {
        // Fallback: try to get text directly
        responseText = result.text || 'I apologize, but I encountered an error processing your request.';
      } else {
        const content = candidate.content;
        const parts = content.parts || [];
        
        // Check for function calls in parts
        const functionCallParts = parts.filter(p => p.functionCall);
        const textParts = parts.filter(p => p.text).map(p => p.text);
        
        if (functionCallParts.length > 0) {
          // Extract function calls
          functionCalls = functionCallParts.map(p => ({
            name: p.functionCall.name,
            args: p.functionCall.args || p.functionCall.parameters || {}
          }));
          
          console.log(`[GEMINI] Found ${functionCalls.length} function call(s):`, functionCalls.map(f => f.name));
          
          // Execute function calls
          const functionResults = await this.executeFunctionCalls(functionCalls, userId);
          
          // Send function results back to model
          const followUpContents = [
            ...contents,
            { role: 'model', parts: functionCallParts },
            { role: 'user', parts: [{ text: functionResults }] }
          ];

          const followUpResult = await genAI.models.generateContent({
            model: DEFAULT_MODEL,
            contents: followUpContents,
            systemInstruction: { parts: [{ text: systemPrompt }] },
            config: {
              tools: [{
                functionDeclarations: functionDeclarations
              }]
            }
          });
          
          // Get text from follow-up result
          const followUpCandidate = followUpResult.candidates?.[0];
          if (followUpCandidate?.content?.parts) {
            const followUpTextParts = followUpCandidate.content.parts
              .filter(p => p.text)
              .map(p => p.text);
            responseText = followUpTextParts.join(' ') || 'Task completed successfully.';
          } else {
            responseText = followUpResult.text || 'Task completed successfully.';
          }
        } else {
          // No function calls, get text response
          responseText = textParts.join(' ') || result.text || 'I apologize, but I encountered an error processing your request.';
        }
      }

      // Extract and update memory from conversation
      await this.updateMemoryFromConversation(userId, userMessage, responseText, functionCalls);

      // Save conversation
      await memoryService.saveConversation(userId, sessionId, {
        role: 'user',
        content: userMessage,
        timestamp: new Date()
      });

      await memoryService.saveConversation(userId, sessionId, {
        role: 'assistant',
        content: responseText,
        functionCalled: functionCalls.length > 0 ? functionCalls[0].name : null,
        functionResult: functionCalls.length > 0 ? functionCalls[0].args : null,
        timestamp: new Date()
      });

      return { message: responseText };
    } catch (error) {
      console.error('[GEMINI SERVICE ERROR]', error);
      console.error('[GEMINI SERVICE ERROR] Stack:', error.stack);
      
      // Fallback: try without function calling
      try {
        const userMemory = await memoryService.getUserMemory(userId);
        const systemPrompt = this.buildSystemPrompt(userMemory);
        const conversationHistory = await memoryService.getConversationHistory(sessionId);
        const history = this.buildHistory(conversationHistory);
        
        const contents = [
          ...history,
          { role: 'user', parts: [{ text: userMessage }] }
        ];
        
        const result = await genAI.models.generateContent({
          model: DEFAULT_MODEL,
          contents: contents,
          systemInstruction: { parts: [{ text: systemPrompt }] }
        });
        
        // Get text from result
        let responseText = '';
        const candidate = result.candidates?.[0];
        if (candidate?.content?.parts) {
          const parts = candidate.content.parts;
          const textParts = parts.filter(p => p.text).map(p => p.text);
          responseText = textParts.join(' ') || '';
        }
        
        if (!responseText) {
          responseText = result.text || 'I apologize, but I encountered an error processing your request.';
        }
        
        // Save conversation
        await memoryService.saveConversation(userId, sessionId, {
          role: 'user',
          content: userMessage,
          timestamp: new Date()
        });

        await memoryService.saveConversation(userId, sessionId, {
          role: 'assistant',
          content: responseText,
          timestamp: new Date()
        });

        return { message: responseText };
      } catch (fallbackError) {
        console.error('[GEMINI SERVICE FALLBACK ERROR]', fallbackError);
        throw new Error(`AI service error: ${fallbackError.message}`);
      }
    }
  }

  buildSystemPrompt(userMemory) {
    const remembered = userMemory.rememberedDetails;
    const hasDetails = Object.values(remembered).some(v => v);

    let prompt = `You are a helpful AI assistant for the National Voter Registration Portal. Your role is to help users register to vote in India.

Your capabilities:
1. Help users create accounts and login to the portal
2. Collect voter registration information (Aadhaar, name, DOB, address, etc.)
3. Submit voter registration applications automatically
4. Check application status
5. Search for voter information

Important guidelines:
- Always be polite, professional, and helpful
- Be SMART and UNDERSTANDING - extract information from user messages even if format is not perfect
- Date formats: Accept ANY format (e.g., "feb 01 2005", "01-02-2005", "2005-02-01") and convert to YYYY-MM-DD
- Gender: Accept "male", "Male", "M", "female", "Female", "F", "other", "Other" - normalize to "Male", "Female", or "Other"
- If user provides multiple details in one message (comma-separated), extract all of them
- Don't ask for confirmation if you can understand the information clearly
- Remember user details across the conversation
- Use the available functions to perform actions on the portal
- When you have ALL required information, automatically submit the registration
- Be efficient - don't ask unnecessary questions

Date Format Instructions:
- Accept: "feb 01 2005", "February 1, 2005", "01-02-2005", "2005-02-01", "1/2/2005"
- Convert ALL to: YYYY-MM-DD format (e.g., "2005-02-01")
- If year is less than 18 years ago, ask for correction

Gender Format Instructions:
- Accept: "male", "Male", "M", "man", "female", "Female", "F", "woman", "other", "Other"
- Convert ALL to: "Male", "Female", or "Other" (exact capitalization)

Required fields for registration:
- aadhaar (12 digits)
- fullName
- fatherName
- dob (YYYY-MM-DD format)
- gender (Male/Female/Other)
- mobile (10 digits)
- email
- address
- state
- district

`;

    if (hasDetails) {
      prompt += `\nRemembered user details:\n`;
      if (remembered.fullName) prompt += `- Name: ${remembered.fullName}\n`;
      if (remembered.mobile) prompt += `- Mobile: ${remembered.mobile}\n`;
      if (remembered.email) prompt += `- Email: ${remembered.email}\n`;
      if (remembered.aadhaar) prompt += `- Aadhaar: ${remembered.aadhaar}\n`;
      if (remembered.address) prompt += `- Address: ${remembered.address}\n`;
      if (remembered.state) prompt += `- State: ${remembered.state}\n`;
      if (remembered.district) prompt += `- District: ${remembered.district}\n`;
      if (remembered.lastApplicationId) prompt += `- Last Application ID: ${remembered.lastApplicationId}\n`;
    }

    prompt += `\nWhen the user provides registration details, use the submitVoterRegistration function to complete the registration.

CRITICAL WORKFLOW - DO THIS AUTOMATICALLY:
1. When user provides registration data → Save it to memory
2. If user needs login → FIRST ASK: "Do you have an existing account?" 
   - If user says YES → Use autoSignupAndLogin (it will try login first)
   - If user says NO → Use autoSignupAndLogin (it will create account and login)
3. If already logged in and have all registration data → IMMEDIATELY call submitVoterRegistration
4. Complete the ENTIRE flow automatically - don't stop halfway!

IMPORTANT: 
- ALWAYS check remembered user details first before asking for information
- If user says "use the above ones", "use above data", "use previous data", or similar, use ALL remembered details
- For login/signup: If user says "use above data" and you have email/mobile from registration, use those!
- When calling functions, the system will automatically merge remembered data with new data
- Be smart - if you have most information from memory, only ask for missing fields
- For login/signup, ALWAYS use remembered email and mobile if available - don't ask again
- Only ask for password if not remembered
- BEFORE calling autoSignupAndLogin, ALWAYS ask: "Do you have an existing account?" unless user explicitly says they do/don't
- AFTER successful login, if you have all registration data, AUTOMATICALLY submit registration - don't wait for user to ask!
- Complete the ENTIRE task end-to-end automatically

VOTER ID HANDLING:
- Applications are auto-approved and voter ID is generated immediately
- Voter ID is automatically saved to memory when registration is submitted or status is checked
- When user says "check my name in the voterlist" or "search my name", use the remembered voter ID automatically
- Don't ask for voter ID if you have it in memory - just use it!
- Only search by voter ID (name search is not available)`;

    return prompt;
  }

  buildHistory(conversationHistory) {
    if (!conversationHistory || conversationHistory.length === 0) {
      return [];
    }

    return conversationHistory.map(msg => ({
      role: msg.role === 'user' ? 'user' : 'model',
      parts: [{ text: msg.content }]
    }));
  }

  async executeFunctionCalls(functionCalls, userId) {
    const results = [];

    for (const funcCall of functionCalls) {
      // Handle different function call structures
      const name = funcCall.name || funcCall.function?.name;
      const args = funcCall.args || funcCall.function?.args || funcCall.parameters || {};
      let result;
      
      if (!name) {
        console.error('[FUNCTION CALL] No function name found:', funcCall);
        continue;
      }

      try {
        switch (name) {
          case 'autoSignupAndLogin':
            // Get remembered data from memory
            const userMemory = await memoryService.getUserMemory(userId);
            const remembered = userMemory.rememberedDetails;
            
            // Use remembered data if args are missing
            const email = args.email || remembered.email;
            const password = args.password || remembered.password;
            const mobile = args.mobile || remembered.mobile;
            
            console.log('[GEMINI] Login/Signup request:', { 
              email: email || 'MISSING', 
              mobile: mobile || 'MISSING', 
              hasPassword: !!password,
              passwordLength: password ? password.length : 0
            });
            
            if (!email || !mobile) {
              result = { 
                success: false, 
                message: 'Email and mobile number are required for login/signup. Please provide them.' 
              };
            } else if (!password) {
              result = { 
                success: false, 
                message: 'Password is required. Please provide a password for account creation or login.' 
              };
            } else {
              console.log('[GEMINI] Attempting login/signup with provided credentials');
              
              // Try login/signup - automation will try login first, then signup if login fails
              result = await voterApiService.autoSignupAndLogin(email, password, mobile);
              
              // Update memory with credentials
              await memoryService.updateUserMemory(userId, {
                email: email,
                password: password,
                mobile: mobile
              });
              
              console.log('[GEMINI] Login/Signup result:', result.success ? 'SUCCESS' : 'FAILED', result.message);
              
              // If login/signup successful, automatically check if we have registration data and submit
              if (result.success) {
                const regMemory = await memoryService.getUserMemory(userId);
                const regData = regMemory.rememberedDetails;
                
                // Check if we have all required registration fields
                const requiredFields = ['aadhaar', 'fullName', 'fatherName', 'dob', 'gender', 'mobile', 'email', 'address', 'state', 'district'];
                const hasAllFields = requiredFields.every(field => regData[field]);
                
                if (hasAllFields) {
                  console.log('[GEMINI] ✅ All registration data available, auto-submitting registration...');
                  const regResult = await voterApiService.submitVoterRegistration({
                    aadhaar: regData.aadhaar,
                    fullName: regData.fullName,
                    fatherName: regData.fatherName,
                    dob: normalizeDate(regData.dob) || regData.dob,
                    gender: normalizeGender(regData.gender) || regData.gender,
                    mobile: regData.mobile,
                    email: regData.email,
                    address: regData.address,
                    state: regData.state,
                    district: regData.district
                  });
                  
                  if (regResult.success) {
                    result = {
                      success: true,
                      message: `Logged in successfully. Registration also submitted successfully! ${regResult.message}`
                    };
                  } else {
                    result = {
                      success: true,
                      message: `Logged in successfully. However, registration submission failed: ${regResult.message}`
                    };
                  }
                }
              } else {
                // Login/signup failed - provide helpful error message
                result = {
                  success: false,
                  message: result.message || 'Login/signup failed. Please check your credentials and try again.'
                };
              }
            }
            break;

          case 'submitVoterRegistration':
            // Get remembered data from memory
            const regMemory = await memoryService.getUserMemory(userId);
            const regRemembered = regMemory.rememberedDetails;
            
            // Merge remembered data with function args (args take priority)
            const mergedArgs = {
              aadhaar: args.aadhaar || regRemembered.aadhaar,
              fullName: args.fullName || regRemembered.fullName,
              fatherName: args.fatherName || regRemembered.fatherName,
              dob: args.dob || regRemembered.dob,
              gender: args.gender || regRemembered.gender,
              mobile: args.mobile || regRemembered.mobile,
              email: args.email || regRemembered.email,
              address: args.address || regRemembered.address,
              state: args.state || regRemembered.state,
              district: args.district || regRemembered.district
            };
            
            // Normalize data before submission
            const normalizedArgs = {
              ...mergedArgs,
              gender: normalizeGender(mergedArgs.gender) || mergedArgs.gender,
              dob: normalizeDate(mergedArgs.dob) || mergedArgs.dob
            };
            
            console.log('[GEMINI] Registration data (merged + normalized):', {
              gender: `${mergedArgs.gender} -> ${normalizedArgs.gender}`,
              dob: `${mergedArgs.dob} -> ${normalizedArgs.dob}`,
              hasAllFields: Object.values(normalizedArgs).every(v => v)
            });
            
            result = await voterApiService.submitVoterRegistration(normalizedArgs);
            // Update memory with registration details
            await memoryService.updateUserMemory(userId, {
              fullName: normalizedArgs.fullName,
              fatherName: normalizedArgs.fatherName,
              dob: normalizedArgs.dob,
              gender: normalizedArgs.gender,
              mobile: normalizedArgs.mobile,
              email: normalizedArgs.email,
              aadhaar: normalizedArgs.aadhaar,
              address: normalizedArgs.address,
              state: normalizedArgs.state,
              district: normalizedArgs.district,
              registrationStatus: result.success ? 'submitted' : 'failed'
            });
            
            // Extract application ID and voter ID from result if available
            if (result.message) {
              const appIdMatch = result.message.match(/APP\d+X\d+/);
              const voterIdMatch = result.message.match(/Voter ID[:\s]+([A-Z0-9]+)/i) || 
                                   result.message.match(/\b(VOT\d{6})\b/i) ||
                                   result.message.match(/Your Voter ID is[:\s]+([A-Z0-9]+)/i);
              
              const updates = {};
              if (appIdMatch) {
                updates.lastApplicationId = appIdMatch[0];
              }
              if (voterIdMatch) {
                updates.voterId = voterIdMatch[1];
                console.log('[GEMINI] ✅ Voter ID extracted from registration response:', voterIdMatch[1]);
              }
              
              if (Object.keys(updates).length > 0) {
                await memoryService.updateUserMemory(userId, updates);
              }
            }
            
            // Also check result.applicationId and result.voterId if available
            if (result.applicationId) {
              await memoryService.updateUserMemory(userId, {
                lastApplicationId: result.applicationId
              });
            }
            if (result.voterId) {
              await memoryService.updateUserMemory(userId, {
                voterId: result.voterId
              });
              console.log('[GEMINI] ✅ Voter ID from result saved:', result.voterId);
            }
            break;

          case 'checkApplicationStatus':
            // Get application ID from args or memory
            const appId = args.applicationId || (await memoryService.getUserMemory(userId)).rememberedDetails.lastApplicationId;
            
            if (!appId) {
              result = { 
                success: false, 
                message: 'Application ID is required. Please provide it or check your previous registration.' 
              };
            } else {
              result = await voterApiService.checkApplicationStatus(appId);
              if (result.success && result.data) {
                const updates = {
                  lastApplicationId: appId,
                  registrationStatus: result.data.status
                };
                
                // If voter ID is available, save it
                if (result.data.voterId) {
                  updates.voterId = result.data.voterId;
                  console.log('[GEMINI] ✅ Voter ID saved to memory:', result.data.voterId);
                }
                
                await memoryService.updateUserMemory(userId, updates);
              }
            }
            break;

          case 'searchVoter':
            // Get voter ID from args or memory
            const searchMemory = await memoryService.getUserMemory(userId);
            const rememberedVoterId = searchMemory.rememberedDetails.voterId;
            const voterId = args.voterId || rememberedVoterId;
            
            if (!voterId) {
              result = { 
                success: false, 
                message: 'Voter ID is required. Please provide it or check your application status first to get your voter ID.' 
              };
            } else {
              console.log('[GEMINI] Searching voter with ID:', voterId);
              result = await voterApiService.searchVoter(voterId);
              
              // Update memory with voter ID if search was successful
              if (result.success) {
                await memoryService.updateUserMemory(userId, { voterId: voterId });
              }
            }
            break;

          default:
            result = { success: false, message: `Unknown function: ${name}` };
        }

        // Format result for Gemini - return as text that model can understand
        const resultText = typeof result === 'object' 
          ? JSON.stringify(result, null, 2)
          : String(result);
        
        results.push(resultText);
      } catch (error) {
        console.error(`[FUNCTION CALL ERROR] ${name}:`, error);
        results.push(JSON.stringify({ 
          function: name,
          success: false, 
          message: error.message 
        }, null, 2));
      }
    }

    // Return as a single message with all function results
    return results.join('\n\n');
  }

  async updateMemoryFromConversation(userId, userMessage, assistantResponse, functionCalls) {
    // Extract information from user message using enhanced patterns
    const updates = extractRegistrationData(userMessage);
    
    // Also try to extract names (if message contains comma-separated values)
    const parts = userMessage.split(',').map(p => p.trim());
    if (parts.length >= 3) {
      // Likely format: aadhaar, name, fatherName, ...
      if (!updates.fullName && parts[1]) {
        updates.fullName = parts[1];
      }
      if (!updates.fatherName && parts[2]) {
        updates.fatherName = parts[2];
      }
      // Try to find address, state, district
      if (parts.length >= 9) {
        if (!updates.address && parts[7]) updates.address = parts[7];
        if (!updates.state && parts[8]) updates.state = parts[8];
        if (!updates.district && parts[9]) updates.district = parts[9];
      }
    }
    
    // Normalize gender if found
    if (updates.gender) {
      updates.gender = normalizeGender(updates.gender) || updates.gender;
    }
    
    // Normalize date if found
    if (updates.dob) {
      const normalized = normalizeDate(updates.dob);
      if (normalized) updates.dob = normalized;
    }

    // Update memory if we found anything
    if (Object.keys(updates).length > 0) {
      await memoryService.updateUserMemory(userId, updates);
    }
  }
}

module.exports = new GeminiService();
