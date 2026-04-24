# **App Name**: Prevención al Día

## Core Features:

- FUF Step-by-Step Guide: Interactive guide through the 60 questions of the FUF (Formulario Único de Fiscalización), explaining each requirement, identifying applicable articles of DS 44/2024, and determining compliance status (Cumple, No Cumple, No Aplica).
 - FUF Step-by-Step Guide: Interactive guide through the 60 questions of the FUF (Formulario Único de Fiscalización), explaining each requirement, mapping them to the FUF, and determining compliance status (Cumple, No Cumple, No Aplica).
- Technical Advice Assistant: Provide detailed explanations of legal and technical foundations, practical examples, best practices, and corrective measures for each requirement of the FUF, considering company size.
- Automated Report Generation: Generate compliance reports, identify gaps, prioritize corrective actions, create action plans with deadlines, and suggest required documentary evidence.
	- Note: Generated PDFs no longer include an embedded JSON annex; full form payloads are stored externally via the app API (`/api/reports`) and can be retrieved using the PDF serial (QR links to `/reports/{serial}`).
- Document Library: Centralized repository for storing and managing all safety-related documents, including risk assessments, training records, committee meeting minutes, and internal regulations.
- Risk Map Visualization: Interactive maps of workplace hazards with integrated risk levels and control measures, allowing users to visualize and understand potential risks within the facility.
- Action Item Tracking: Manage and track corrective actions and improvements in safety and health. Schedule periodic task reviews for teams to complete. Send tasks reminders to team members, with dynamic adjustment for priorities and deadlines

## Style Guidelines:

- Primary color: Dark green (#386641) to evoke trust, safety, and compliance.
- Background color: Light gray (#F2F4F3) for a clean and professional feel.
- Accent color: Yellow-Orange (#ECAA42) for attention-grabbing calls to action.
- Body font: 'Inter', a grotesque sans-serif font, to provide a clean, objective feel to the user experience. Suitable for headlines or body text
- Headline font: 'Space Grotesk', a proportional sans-serif with a computerized feel; if longer text is anticipated, use this for headlines and 'Inter' for body
- Use clear, standardized icons related to safety, health, and compliance, ensuring consistency and easy recognition.
- Organize information using a clear, logical hierarchy, ensuring ease of navigation and intuitive access to key features and data.
- Employ subtle animations for user feedback, transitions, and data visualization to enhance usability without distracting from content.