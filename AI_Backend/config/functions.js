// config/functions.js
function getFunctionDefinitions() {
  return [
    {
      name: 'autoSignupAndLogin',
      description: 'Login to existing account OR create new account and login. This function will first try to login with the provided credentials. If login fails (invalid credentials), it will automatically create a new account and login. Use this when user needs to access the portal.',
      parameters: {
        type: 'object',
        properties: {
          email: { type: 'string' },
          password: { type: 'string' },
          mobile: { type: 'string', pattern: '^[0-9]{10}$' }
        },
        required: ['email', 'password', 'mobile']
      },
    },

    {
      name: 'submitVoterRegistration',
      description: 'Submit complete voter registration form. Accept dates in ANY format (e.g., "feb 01 2005", "01-02-2005") and convert to YYYY-MM-DD. Accept gender as "male", "Male", "M", "female", "Female", "F" and convert to "Male", "Female", or "Other".',
      parameters: {
        type: 'object',
        properties: {
          aadhaar: { type: 'string' },
          fullName: { type: 'string' },
          fatherName: { type: 'string' },
          dob: { type: 'string', description: 'Date of birth in ANY format - will be converted to YYYY-MM-DD' },
          gender: { type: 'string', description: 'Gender: "male"/"Male"/"M" -> "Male", "female"/"Female"/"F" -> "Female", "other"/"Other" -> "Other"' },
          mobile: { type: 'string' },
          email: { type: 'string' },
          address: { type: 'string' },
          state: { type: 'string' },
          district: { type: 'string' }
        },
        required: [
          'aadhaar','fullName','fatherName','dob','gender',
          'mobile','email','address','state','district'
        ]
      },
    },

    {
      name: 'checkApplicationStatus',
      description: 'Check status of voter application.',
      parameters: {
        type: 'object',
        properties: { applicationId: { type: 'string' } },
        required: ['applicationId']
      },
    },

    {
      name: 'searchVoter',
      description: 'Search for voter by voter ID. If voter ID is not provided, use the remembered voter ID from memory. Applications are auto-approved and voter ID is generated immediately upon registration.',
      parameters: {
        type: 'object',
        properties: { 
          voterId: { 
            type: 'string',
            description: 'Voter ID to search for. If not provided, will use remembered voter ID from previous registration.'
          } 
        },
        required: []
      },
    },
  ];
}

module.exports = { getFunctionDefinitions };
