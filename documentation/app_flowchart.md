flowchart TD
    A[User Login via Clerk] --> B[Chat Interface Loads]
    B --> C[Fetch User Interests and Competency]
    C --> D[Construct AI Prompt based on Context]
    D --> E[Invoke OpenAI AI Module]
    E --> F[Display Buddy Response]
    F --> G[User Sends Message]
    G --> H{Competency Mastered}
    H -->|No| D
    H -->|Yes| I[Update Competency Progress in Backend]
    I --> J[End Session]