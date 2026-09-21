// Seed Workday Implementation Practice Questions
// Run: $env:DATABASE_URL="file:..."; node scripts/seed-workday-questions.js
// Or if dotenv is available it will be loaded from .env.local automatically.
const path = require("path");
try {
  require("dotenv").config({ path: path.resolve(__dirname, "../.env.local") });
} catch (_) { /* dotenv not installed — rely on env var being set */ }

const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const BOOK_TITLE = "Workday Tenant Build – Certification Practice Questions";

const questions = [
  // Q1
  {
    questionText: "Which security group can copy a business process?",
    optionA: "Role-based Security Group",
    optionB: "User-based Security Group",
    optionC: "Intersection Security Group",
    optionD: "Aggregation Security Group",
    correctOption: "A",
    explanation: "Role-based security groups are associated with business process security policies and can be used to copy business processes.",
    difficulty: "medium",
  },
  // Q2
  {
    questionText: "Which of the following is an example of tenanted data?",
    optionA: "Workday-delivered Standard Report",
    optionB: "Business Process Configuration",
    optionC: "Core Connector Integration Template",
    optionD: "Global System Configuration",
    correctOption: "B",
    explanation: "Business Process configurations are tenant-specific (tenanted) data that can differ between customer tenants.",
    difficulty: "medium",
  },
  // Q3
  {
    questionText: "What are third-party IDs used for in Workday integrations?",
    optionA: "WID (Workday ID)",
    optionB: "Reference ID",
    optionC: "External ID from an external system",
    optionD: "Sequence Generator ID",
    correctOption: "C",
    explanation: "Third-party IDs (External IDs) are identifiers originating from external systems and are used to map external records to Workday objects.",
    difficulty: "medium",
  },
  // Q4
  {
    questionText: "Managers can easily find information on workers via reports in which area?",
    optionA: "Standard Workday Reports",
    optionB: "Worker Profile",
    optionC: "My Team Management Worklet",
    optionD: "Integration Audit Reports",
    correctOption: "B",
    explanation: "The Worker Profile aggregates key worker data (including reports) that managers can quickly access.",
    difficulty: "easy",
  },
  // Q5
  {
    questionText: "To enable Cloud Skills in a Workday tenant, which task do you use?",
    optionA: "Edit Tenant Setup – Global",
    optionB: "Edit Tenant Setup – HCM",
    optionC: "Maintain Skills and Experience",
    optionD: "Enable Workday Cloud Services",
    correctOption: "B",
    explanation: "Cloud Skills are enabled through the Edit Tenant Setup – HCM task under the Skills and Experience section.",
    difficulty: "medium",
  },
  // Q6
  {
    questionText: "A sequence generator format is Jcode[Seq] with padding 4 and incrementor 5. The current sequence is Jcode1210. What is the next sequence value?",
    optionA: "Jcode1215",
    optionB: "Jcode01215",
    optionC: "Jcode001215",
    optionD: "Jcode1210-05",
    correctOption: "A",
    explanation: "Next value = 1210 + 5 = 1215. Padding of 4 means minimum 4 digits; 1215 already has 4 digits, so the result is Jcode1215.",
    difficulty: "medium",
  },
  // Q7
  {
    questionText: "You want to track the date while generating a sequence. Where do you configure this in the sequence generator?",
    optionA: "Include [Date] in the sequence format string",
    optionB: "Set date tracking in the incrementor field",
    optionC: "Configure date fields in Edit Tenant Setup",
    optionD: "Use a date-based prefix in the sequence name",
    correctOption: "A",
    explanation: "In Workday sequence generators you can embed date placeholders (e.g. [Year], [Month]) directly in the format string to capture the date at generation time.",
    difficulty: "medium",
  },
  // Q8  (Q52 is a duplicate — omitted)
  {
    questionText: "You want to add a new language to a tenant. Which task enables this?",
    optionA: "Edit Tenant Setup – System",
    optionB: "Edit Tenant Setup – Global",
    optionC: "Maintain Languages",
    optionD: "Configure Translation Rules",
    correctOption: "C",
    explanation: "The Maintain Languages task is used to add and enable additional languages in a Workday tenant.",
    difficulty: "easy",
  },
  // Q9
  {
    questionText: "What type of text can be translated in Workday?",
    optionA: "System-generated error messages only",
    optionB: "Business process notification text only",
    optionC: "Tenant-configured and custom text",
    optionD: "All text including Workday-delivered system labels",
    correctOption: "C",
    explanation: "Workday allows translation of tenant-configured objects such as custom labels, field names, and custom object names — not core Workday-delivered text.",
    difficulty: "medium",
  },
  // Q10
  {
    questionText: "Your customer has a new UK location being added. Which task do you use to update the timezone configuration?",
    optionA: "Edit Tenant Setup – Global",
    optionB: "Maintain Locations",
    optionC: "Manage Time Zone Settings",
    optionD: "Configure Business Sites",
    correctOption: "B",
    explanation: "The Maintain Locations task lets you configure location details including the time zone for each location.",
    difficulty: "easy",
  },
  // Q11
  {
    questionText: "Your customer wants to highlight an employee's manager and employee ID so other workers can find them quickly. Which task achieves this?",
    optionA: "Edit Tenant Setup – HCM",
    optionB: "Configure Business Process Security Policy",
    optionC: "Configure Worker Profile and Pages",
    optionD: "Edit Worker Data Security Policy",
    correctOption: "C",
    explanation: "Configure Worker Profile and Pages allows you to control which fields (including manager and employee ID) appear prominently in the worker profile header.",
    difficulty: "medium",
  },
  // Q12  (Q51 is a duplicate — omitted)
  {
    questionText: "What is the maximum number of items that can be displayed in the worker profile header?",
    optionA: "3",
    optionB: "5",
    optionC: "7",
    optionD: "10",
    correctOption: "C",
    explanation: "Workday supports a maximum of 7 objects/items in the worker profile header section.",
    difficulty: "easy",
  },
  // Q13
  {
    questionText: "You have completed building the customer's foundation tenant and the customer is ready to validate. What are the next steps?",
    optionA: "Immediately move the tenant to production",
    optionB: "Conduct a structured tenant walkthrough with the customer for validation",
    optionC: "Begin loading all employee master data",
    optionD: "Deploy all configured integrations",
    correctOption: "B",
    explanation: "After completing the foundation tenant build, the next step is a customer walkthrough/UAT session to validate the configuration before advancing.",
    difficulty: "medium",
  },
  // Q14
  {
    questionText: "You are using Advanced Load to assign user-based security. Which ID must be present in the load file?",
    optionA: "WID",
    optionB: "Reference ID",
    optionC: "Employee ID",
    optionD: "Security Group ID",
    correctOption: "A",
    explanation: "For user-based security assignments via Advanced Load, the WID (Workday ID) uniquely identifies the user and must be included in the load file.",
    difficulty: "medium",
  },
  // Q15
  {
    questionText: "A screenshot of the Skill Level setup shows all weightage values are zero. What is the impact?",
    optionA: "Skills can still be added to profiles without any issue",
    optionB: "Skill level calculations will not produce accurate results",
    optionC: "The skill assessment feature is fully disabled",
    optionD: "Skill levels will default to the highest configured value",
    correctOption: "B",
    explanation: "If all skill level weightage values are zero, the skill level calculation formula produces no meaningful results, making proficiency scoring inaccurate.",
    difficulty: "medium",
  },
  // Q16
  {
    questionText: "Which account type can load customer data into a Workday tenant?",
    optionA: "Integration System User (ISU) Account",
    optionB: "Standard Employee Self-Service Account",
    optionC: "Workday Report Writer Account",
    optionD: "Customer Central Security Admin Account",
    correctOption: "A",
    explanation: "An Integration System User (ISU) account is specifically designed for loading and extracting data in Workday.",
    difficulty: "medium",
  },
  // Q17
  {
    questionText: "Which types of web services enable adding and updating data in Workday? (Select 2)",
    optionA: "Put Web Services",
    optionB: "Get Web Services",
    optionC: "Change State Web Services",
    optionD: "Report-as-a-Service Web Services",
    correctOption: "A",
    explanation: "Put web services create/update records; Change State web services update the status/state of existing records. Both enable data modification. (Select A and C.)",
    difficulty: "hard",
  },
  // Q18
  {
    questionText: "Which globally unique identifier would you use to load organization visibility?",
    optionA: "Organization Reference ID",
    optionB: "WID (Workday ID)",
    optionC: "Company ID",
    optionD: "Supervisory Organization ID",
    correctOption: "B",
    explanation: "The WID (Workday ID) is the globally unique identifier used across Workday to reference any object, including organizations.",
    difficulty: "medium",
  },
  // Q19  (Q59 is kept separately as it asks about editing across functional areas)
  {
    questionText: "How can you update reference IDs in bulk when the reference ID type is different across records?",
    optionA: "Update each reference ID individually using the Maintain Reference ID task",
    optionB: "Use an EIB with the appropriate Reference ID object template",
    optionC: "Use the Configuration Catalog to sync reference IDs",
    optionD: "Use Advanced Load with a single reference ID type filter",
    correctOption: "B",
    explanation: "An EIB (Enterprise Interface Builder) with the Reference ID object allows bulk updates even when records have different reference ID types.",
    difficulty: "medium",
  },
  // Q20
  {
    questionText: "An error message is displayed for a Collective Agreement option type. Why does this error occur?",
    optionA: "The collective agreement has not been created in the tenant",
    optionB: "The security group lacks permission to view collective agreements",
    optionC: "The employee does not meet the collective agreement eligibility criteria",
    optionD: "The business process step referencing the option is not configured",
    correctOption: "A",
    explanation: "The error occurs because the Collective Agreement must first exist in the tenant before it can be selected as an option type.",
    difficulty: "hard",
  },
  // Q21
  {
    questionText: "For certain objects, the data load is done in two phases. Why?",
    optionA: "System performance requires splitting large data loads",
    optionB: "Some objects have self-referential or circular dependencies",
    optionC: "Data validation rules prevent single-phase loads",
    optionD: "Security restrictions limit single-phase processing",
    correctOption: "B",
    explanation: "Objects like supervisory organizations reference each other (parent-child), creating circular dependencies that require loading in two phases: first without references, then updating with references.",
    difficulty: "medium",
  },
  // Q22
  {
    questionText: "Which task allows implementers to set the password for iLoad?",
    optionA: "Edit Tenant Setup – Integration",
    optionB: "Set Password for Integration System User",
    optionC: "Manage Integration System Users",
    optionD: "Configure iLoad Security Settings",
    correctOption: "B",
    explanation: "The 'Set Password for Integration System User' task is used to configure credentials for iLoad (Integration System User accounts).",
    difficulty: "medium",
  },
  // Q23  (Q61 is a duplicate/variation — omitted)
  {
    questionText: "What tasks would you choose to create and initiate an EIB? (Select all correct responses)",
    optionA: "Create EIB",
    optionB: "Launch EIB / Schedule EIB",
    optionC: "Configure Integration System",
    optionD: "Manage Integration Attributes",
    correctOption: "A",
    explanation: "To create and initiate an EIB you use: 1) Create EIB (to define the integration) and 2) Launch EIB or Schedule EIB to run it. (Select A and B.)",
    difficulty: "medium",
  },
  // Q24
  {
    questionText: "In a screenshot of an Advanced Load template, what will be the key value used to reference the compensation partner in the upcoming grids?",
    optionA: "Compensation Grade Reference ID",
    optionB: "Integration ID",
    optionC: "WID of the compensation partner",
    optionD: "Compensation Plan Reference ID",
    correctOption: "C",
    explanation: "In Advanced Load templates, the WID (or a mapped integration ID) of the referenced object is used as the key to link related data grids.",
    difficulty: "hard",
  },
  // Q25
  {
    questionText: "What are the capabilities of the Customer Central Security Administrator account?",
    optionA: "Can only create new tenant assignments",
    optionB: "Can manage all customer accounts, run reports, and create tenant assignments in Customer Central",
    optionC: "Can load data into any tenant using any Workday tool",
    optionD: "Can directly access and configure all customer tenants",
    correctOption: "B",
    explanation: "The Customer Central Security Administrator has broad access to manage accounts and tenant assignments for all customers within Customer Central.",
    difficulty: "medium",
  },
  // Q26
  {
    questionText: "Which report provides a list of all accounts in Customer Central and can be run by the security administrator?",
    optionA: "All Workday Accounts",
    optionB: "Customer Central Security Audit Report",
    optionC: "Account Management Summary",
    optionD: "Tenant Account Report",
    correctOption: "A",
    explanation: "The 'All Workday Accounts' report lists all accounts in Customer Central and is accessible to the Security Administrator.",
    difficulty: "medium",
  },
  // Q27
  {
    questionText: "Where can you check if an object can be migrated with OX 2.0?",
    optionA: "Run the OX Migration Compatibility Report in the tenant",
    optionB: "Check the Configuration Catalog",
    optionC: "Review the Workday Community documentation",
    optionD: "Contact Workday Support for the object list",
    correctOption: "B",
    explanation: "The Configuration Catalog displays which objects are supported for migration via OX 2.0.",
    difficulty: "medium",
  },
  // Q28
  {
    questionText: "When populating an Advanced Load template, what field is a unique identifier to link data from different grids?",
    optionA: "WID",
    optionB: "Reference ID",
    optionC: "Employee ID",
    optionD: "Row Number",
    correctOption: "A",
    explanation: "The WID is the unique key used across grids in an Advanced Load template to associate related rows of data.",
    difficulty: "medium",
  },
  // Q29
  {
    questionText: "You need to find the web service for an object. What do you use?",
    optionA: "Workday Studio",
    optionB: "API Explorer or Implementation Task indicator",
    optionC: "Configuration Catalog",
    optionD: "Data Dictionary",
    correctOption: "B",
    explanation: "The API Explorer (available in the tenant) or the Implementation Task indicator on a task reveals which web service corresponds to an object.",
    difficulty: "easy",
  },
  // Q30
  {
    questionText: "A consultant needs to load supervisory organizations into a tenant. What tool should they use?",
    optionA: "EIB (Enterprise Interface Builder)",
    optionB: "iLoad",
    optionC: "Configuration Catalog",
    optionD: "Advanced Load",
    correctOption: "A",
    explanation: "EIBs are the standard tool for loading Supervisory Organization data into Workday tenants.",
    difficulty: "medium",
  },
  // Q31
  {
    questionText: "Which tasks do you use to find data loading details for Positions using iLoad?",
    optionA: "iLoad Configuration Report",
    optionB: "Implementation Tasks for Positions in iLoad documentation",
    optionC: "Position Data Dictionary",
    optionD: "EIB Template for Position",
    correctOption: "B",
    explanation: "Implementation Tasks within iLoad provide the full data loading details and field requirements for loading Positions.",
    difficulty: "medium",
  },
  // Q32
  {
    questionText: "What does the Configuration Catalog allow?",
    optionA: "Load employee data from external systems",
    optionB: "Migrate configuration items between Workday tenants",
    optionC: "Create custom integrations with external APIs",
    optionD: "Manage security group assignments in bulk",
    correctOption: "B",
    explanation: "The Configuration Catalog (OX) allows implementers and customers to migrate configuration items from a source tenant (e.g. WDSetup) to a customer tenant.",
    difficulty: "easy",
  },
  // Q33
  {
    questionText: "When using the Configuration Catalog, what tenant is the source?",
    optionA: "Customer Foundation Tenant",
    optionB: "WDSetup Tenant",
    optionC: "Production Tenant",
    optionD: "Sandbox Tenant",
    correctOption: "B",
    explanation: "WDSetup is the source tenant in the Configuration Catalog; it contains Workday-delivered configuration that can be migrated to customer tenants.",
    difficulty: "medium",
  },
  // Q34
  {
    questionText: "You need to do a tenant assignment and load data to a customer Foundation tenant. What type of security access do you need in Customer Central?",
    optionA: "Standard Implementer Access",
    optionB: "Customer Central Security Administrator",
    optionC: "Workday System Administrator",
    optionD: "Standard HR Partner Access",
    correctOption: "B",
    explanation: "Tenant assignment and Foundation tenant data loading requires Customer Central Security Administrator access.",
    difficulty: "medium",
  },
  // Q35
  {
    questionText: "You are working with a customer that does business in multiple countries. You need to load country-specific setup data from WDSetup. What tool can you use?",
    optionA: "EIB (Enterprise Interface Builder)",
    optionB: "Configuration Catalog",
    optionC: "Advanced Load",
    optionD: "iLoad",
    correctOption: "B",
    explanation: "The Configuration Catalog allows you to select and migrate country-specific setup data from WDSetup into a customer tenant.",
    difficulty: "medium",
  },
  // Q36
  {
    questionText: "What account type do you need to load and extract data using Advanced Load?",
    optionA: "ISU (Integration System User) Account",
    optionB: "Workday Implementation Account",
    optionC: "Report Writer Account",
    optionD: "Security Administrator Account",
    correctOption: "A",
    explanation: "Advanced Load uses an Integration System User (ISU) account for loading and extracting data.",
    difficulty: "medium",
  },
  // Q37
  {
    questionText: "Who can use EIBs? (Select two)",
    optionA: "Implementers",
    optionB: "Compensation Partners",
    optionC: "Customers / Tenants",
    optionD: "Workday Account Managers",
    correctOption: "A",
    explanation: "Both Implementers and Customers (tenant administrators) can create and use EIBs. (Select A and C.)",
    difficulty: "easy",
  },
  // Q38  (Q58 is a duplicate — omitted)
  {
    questionText: "You are loading role-based security assignments for the HR Partner assignable role. Which dependencies must exist before you can load these assignments? (Select two)",
    optionA: "The Supervisory Organization must exist in the tenant",
    optionB: "The HR Partner assignable role must be defined",
    optionC: "The business process must be published",
    optionD: "The security policy must be activated",
    correctOption: "A",
    explanation: "Role-based security assignments require: 1) the organization (where the role is assigned) and 2) the assignable role definition. (Select A and B.)",
    difficulty: "hard",
  },
  // Q39
  {
    questionText: "What type of security group is an HR Partner?",
    optionA: "User-based Security Group",
    optionB: "Role-based Security Group",
    optionC: "Intersection Security Group",
    optionD: "Aggregation Security Group",
    correctOption: "B",
    explanation: "HR Partner is a role-based security group — it is assigned to workers who hold the HR Partner role in a specific organization.",
    difficulty: "easy",
  },
  // Q40
  {
    questionText: "You want to include a sequence inside a sequence generator. What must be included in the format string?",
    optionA: "(Seq)",
    optionB: "[Seq]",
    optionC: "{Seq}",
    optionD: "$Seq$",
    correctOption: "B",
    explanation: "In Workday sequence generators, [Seq] is the placeholder that inserts the generated sequence number into the format string.",
    difficulty: "easy",
  },
  // Q41
  {
    questionText: "Which task allows implementers to set the default password for all user accounts?",
    optionA: "Edit Tenant Setup – Security",
    optionB: "Set Password Rules for All Users",
    optionC: "Set Passwords for All Implementer Accounts",
    optionD: "Manage User Accounts in Bulk",
    correctOption: "C",
    explanation: "The task 'Set Passwords for All Implementer Accounts' (or similar mass password task) allows implementers to set default passwords across all accounts at once.",
    difficulty: "medium",
  },
  // Q42
  {
    questionText: "A customer asks you to build a custom report providing a quick snapshot of a worker's compensation data. Which task do you use to add this to the worker profile?",
    optionA: "Create Custom Report",
    optionB: "Configure Worker Profile and Pages",
    optionC: "Edit Tenant Setup – HCM",
    optionD: "Maintain Worker Data Security",
    correctOption: "B",
    explanation: "Configure Worker Profile and Pages is used to add custom reports (and worklets) to the worker profile view.",
    difficulty: "medium",
  },
  // Q43
  {
    questionText: "During the Hire business process, your customer wants to allow selecting values outside position restrictions. Which option in Edit Tenant Setup – HCM do you configure?",
    optionA: "Enable Ad Hoc Position Creation",
    optionB: "Allow Override of Position Restrictions",
    optionC: "Skip Position Validation on Hire",
    optionD: "Enable Flexible Headcount Management",
    correctOption: "B",
    explanation: "The 'Allow Override of Position Restrictions' option in Edit Tenant Setup – HCM lets hiring managers select values that exceed defined position restrictions.",
    difficulty: "hard",
  },
  // Q44
  {
    questionText: "An employee wants feedback from their coworkers on various skills. What must you configure?",
    optionA: "Performance Review Process",
    optionB: "Talent Assessment Framework",
    optionC: "Anytime Feedback",
    optionD: "Peer Assessment Worklet",
    correctOption: "C",
    explanation: "Anytime Feedback in Workday allows employees to solicit and receive informal feedback from coworkers on specific skills or topics.",
    difficulty: "medium",
  },
  // Q45
  {
    questionText: "You are in the planning phase of implementation and ready to load position data, but the current business process definition does not meet data conversion needs. What can you configure?",
    optionA: "Create a new staffing model for the conversion",
    optionB: "Configure a custom integration to bypass the business process",
    optionC: "Edit the business process definition to add, remove, or skip steps for the load",
    optionD: "Modify position restrictions to allow direct data entry",
    correctOption: "C",
    explanation: "You can edit the business process definition to adjust steps (e.g. making steps optional or removing approvals) to accommodate the data conversion load.",
    difficulty: "medium",
  },
  // Q46
  {
    questionText: "The client has loaded their employee data and wants to do a spot check. Where will you go to verify the data?",
    optionA: "Run a Standard Workday Report",
    optionB: "View the Worker Profile",
    optionC: "Check the Integration Audit Report",
    optionD: "View EIB Load Results",
    correctOption: "B",
    explanation: "The Worker Profile is the quickest way to spot-check individual employee data after a load.",
    difficulty: "easy",
  },
  // Q47
  {
    questionText: "How do you know if a task supports implementation (i.e., is an implementation task)?",
    optionA: "Check the Workday Community documentation for the task",
    optionB: "Look for the Implementation Task indicator within the task in the tenant",
    optionC: "Contact Workday support for task classification",
    optionD: "Review the Configuration Workbook for task types",
    correctOption: "B",
    explanation: "In the Workday tenant, Implementation Tasks are flagged with an indicator that distinguishes them from standard operational tasks.",
    difficulty: "easy",
  },
  // Q48
  {
    questionText: "Which report do you use to set up and correct business site hierarchies?",
    optionA: "All Business Sites Report",
    optionB: "Location Configuration Report",
    optionC: "Organizational Hierarchy Audit Report",
    optionD: "Site Management Summary",
    correctOption: "A",
    explanation: "The 'All Business Sites' report lists all configured business sites and can be used to review and correct site hierarchy relationships.",
    difficulty: "medium",
  },
  // Q49
  {
    questionText: "An organization is ready to load data. Where can you find Organization Subtypes?",
    optionA: "Customer Central",
    optionB: "Configuration Catalog",
    optionC: "WDSetup Tenant",
    optionD: "Workday Community",
    correctOption: "C",
    explanation: "Organization Subtypes are maintained in the WDSetup tenant and can be migrated to customer tenants via the Configuration Catalog.",
    difficulty: "medium",
  },
  // Q50
  {
    questionText: "Which report do you use to verify a location data load?",
    optionA: "All Locations Report",
    optionB: "Location Verification Audit",
    optionC: "Tenant Load Verification Report",
    optionD: "Location Data Summary",
    correctOption: "A",
    explanation: "The 'All Locations' report displays all locations configured in the tenant and is used to verify the accuracy of a location data load.",
    difficulty: "easy",
  },
  // Q53
  {
    questionText: "Who can use Advanced Load in Customer Central?",
    optionA: "Any authenticated Workday user",
    optionB: "Implementers with the appropriate Customer Central access",
    optionC: "HR Partners with admin privileges only",
    optionD: "Workday Account Administrators only",
    correctOption: "B",
    explanation: "Advanced Load in Customer Central is accessible only to implementers who have been granted the appropriate access rights.",
    difficulty: "medium",
  },
  // Q54
  {
    questionText: "In a sequence generator for job codes, how do you include the current year?",
    optionA: "[CurrentYear]",
    optionB: "[Year]",
    optionC: "{YEAR}",
    optionD: "(Year)",
    correctOption: "B",
    explanation: "The [Year] placeholder in a Workday sequence generator format string inserts the current four-digit year at generation time.",
    difficulty: "medium",
  },
  // Q55
  {
    questionText: "Which globally unique identifier would you use to create a hierarchy in staffing organizations?",
    optionA: "Employee ID",
    optionB: "Organization Reference ID",
    optionC: "WID",
    optionD: "Company ID",
    correctOption: "C",
    explanation: "The WID (Workday ID) is the globally unique identifier used to reference and link staffing organizations when building hierarchies.",
    difficulty: "medium",
  },
  // Q56
  {
    questionText: "In a sequence generator format, what does [Seq] represent?",
    optionA: "The incrementor value",
    optionB: "The padding configuration",
    optionC: "The placeholder for the generated sequence number",
    optionD: "The sequence prefix",
    correctOption: "C",
    explanation: "[Seq] is the format placeholder that is replaced by the auto-incremented sequence number when a new value is generated.",
    difficulty: "easy",
  },
  // Q57
  {
    questionText: "What kind of tenant is used for Organization Subtypes? (Options: WDSetup, Implementation, Unified tenant, Customer Central)",
    optionA: "Customer Central",
    optionB: "WDSetup",
    optionC: "Implementation Tenant",
    optionD: "Unified Tenant",
    correctOption: "B",
    explanation: "Organization Subtypes are sourced from the WDSetup tenant, which contains Workday-delivered setup data.",
    difficulty: "medium",
  },
  // Q59  (different angle from Q19 — keeps the 'different functional areas' focus)
  {
    questionText: "How can you edit multiple reference IDs that belong to different functional areas all at once?",
    optionA: "Use individual Maintain Reference ID tasks for each functional area",
    optionB: "Export reference IDs to Excel via a report and re-import with an EIB",
    optionC: "Use the Mass Maintain Reference IDs report to update in bulk",
    optionD: "Use Advanced Load with a combined reference ID type",
    correctOption: "C",
    explanation: "The Mass Maintain Reference IDs report/task allows bulk editing of reference IDs across multiple functional areas in one operation.",
    difficulty: "medium",
  },
  // Q60
  {
    questionText: "Who can use the Configuration Catalog / OX 2.0?",
    optionA: "Implementers only",
    optionB: "Customers only",
    optionC: "Both Implementers and Customers",
    optionD: "Security Administrators only",
    correctOption: "C",
    explanation: "The Configuration Catalog is available to both Workday implementers and customer tenant administrators.",
    difficulty: "easy",
  },
  // Q62
  {
    questionText: "How do you identify if a specific task in Workday is a Web Service?",
    optionA: "Search for the keyword 'Web Service' in the task name",
    optionB: "Look for the Web Service indicator on the corresponding Implementation Task",
    optionC: "Run the task in test mode to see if it returns a SOAP response",
    optionD: "Check the Configuration Catalog for a web service mapping",
    correctOption: "B",
    explanation: "In Workday, each Implementation Task for a web service is labelled with a Web Service indicator that identifies it as such.",
    difficulty: "medium",
  },
  // Q63
  {
    questionText: "What type of ID is used when a Reference ID is not available for an object?",
    optionA: "External ID",
    optionB: "Integration ID",
    optionC: "WID (Workday ID)",
    optionD: "Employee ID",
    correctOption: "C",
    explanation: "When no Reference ID exists for an object, the WID (Workday ID) is used as the fallback unique identifier.",
    difficulty: "easy",
  },
  // Q64
  {
    questionText: "What type of ID is used to load data from an external system into Workday?",
    optionA: "WID (Workday ID)",
    optionB: "Reference ID",
    optionC: "Employee Number",
    optionD: "System-Generated Sequence ID",
    correctOption: "B",
    explanation: "Reference IDs are the preferred identifiers when loading data from external systems because they are meaningful, human-readable, and can be managed by the customer.",
    difficulty: "easy",
  },
  // Q65
  {
    questionText: "Using iLoad, which tasks can be used to create a Position? (Select all correct)",
    optionA: "Create Position",
    optionB: "Create Position for Job Requisition",
    optionC: "Maintain Staffing Models",
    optionD: "Position Restriction Setup",
    correctOption: "A",
    explanation: "In iLoad, 'Create Position' (and 'Create Position for Job Requisition' in a recruiting context) are the tasks used to load position data. (Select A and B.)",
    difficulty: "medium",
  },
  // Q66
  {
    questionText: "How do you configure which cards (worklets) display for users on the Workday home page?",
    optionA: "Edit Tenant Setup – System",
    optionB: "Configure Worker Profile and Pages",
    optionC: "Manage Home Page Worklets",
    optionD: "Edit User Preferences",
    correctOption: "C",
    explanation: "The Manage Home Page Worklets task controls which worklet cards are available and displayed on the Workday home page for users.",
    difficulty: "medium",
  },
  // Q67
  {
    questionText: "Which task do you use to reorder the tabs on a worker profile?",
    optionA: "Configure Worker Profile and Pages",
    optionB: "Edit Tenant Setup – HCM",
    optionC: "Maintain Worker Data Configuration",
    optionD: "Edit Business Process Definition",
    correctOption: "A",
    explanation: "Configure Worker Profile and Pages allows you to add, remove, and reorder the tabs displayed on a worker's profile page.",
    difficulty: "easy",
  },
  // Q68
  {
    questionText: "How do you create a custom report and add it to the worker profile?",
    optionA: "Create a Custom Report and configure it as a Worklet, then add it to the worker profile via Configure Worker Profile and Pages",
    optionB: "Edit an existing Standard Report and rename it",
    optionC: "Configure Worker Profile Settings and select a built-in report",
    optionD: "Add the report directly to the business process definition",
    correctOption: "A",
    explanation: "First create the custom report, then expose it as a worklet, and finally add it to the relevant worker profile section using Configure Worker Profile and Pages.",
    difficulty: "medium",
  },
];

async function main() {
  // Resolve DATABASE_URL
  if (!process.env.DATABASE_URL) {
    console.error("ERROR: DATABASE_URL is not set.");
    console.error('Run: $env:DATABASE_URL="file:...path.../prisma/dev.db"; node scripts/seed-workday-questions.js');
    process.exit(1);
  }

  // Require at least one admin user
  const admin = await prisma.user.findFirst({ where: { role: "admin" } });
  if (!admin) {
    console.error("ERROR: No admin user found. Run npm run setup first.");
    process.exit(1);
  }

  // Create (or reuse) the questions book
  let book = await prisma.book.findFirst({ where: { title: BOOK_TITLE } });
  if (!book) {
    book = await prisma.book.create({
      data: {
        title: BOOK_TITLE,
        filename: "workday-practice-questions-seeded.txt",
        filePath: "seeded",
        extractedText: "",
        uploadedById: admin.id,
      },
    });
    console.log(`Created book: "${book.title}"`);
  } else {
    console.log(`Reusing existing book: "${book.title}"`);
  }

  let inserted = 0;
  let skipped = 0;

  for (const q of questions) {
    // Deduplicate by exact question text
    const exists = await prisma.question.findFirst({
      where: { questionText: q.questionText },
    });
    if (exists) {
      skipped++;
      continue;
    }

    await prisma.question.create({
      data: {
        bookId: book.id,
        questionText: q.questionText,
        optionA: q.optionA,
        optionB: q.optionB,
        optionC: q.optionC,
        optionD: q.optionD,
        correctOption: q.correctOption,
        explanation: q.explanation || "",
        difficulty: q.difficulty || "medium",
        aiGenerated: false,
        approved: true,
      },
    });
    inserted++;
    console.log(`  + ${q.questionText.substring(0, 70)}...`);
  }

  console.log(`\nDone — ${inserted} inserted, ${skipped} already existed.`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
