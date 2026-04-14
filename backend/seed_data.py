"""
Seed data for Career Navigation Platform.
Run this script to populate MongoDB with initial career and roadmap data.
"""
import asyncio
import os
import uuid
from datetime import datetime, timezone
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv
from pathlib import Path

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

mongo_url = os.environ['MONGO_URL']
db_name = os.environ['DB_NAME']

CAREERS = [
    {
        "id": str(uuid.uuid4()),
        "title": "Software Engineer",
        "domain": "IT",
        "description": "Design, develop, and maintain software applications and systems. Work with modern tech stacks to build scalable solutions.",
        "avg_salary": "$95,000 - $165,000",
        "demand": "Very High",
        "growth_rate": "25%",
        "skills": ["Python", "JavaScript", "React", "Node.js", "SQL", "Git", "Docker", "AWS"],
        "icon": "code",
        "color": "blue",
        "level": "Mid-Senior",
        "trending": True,
    },
    {
        "id": str(uuid.uuid4()),
        "title": "Data Scientist",
        "domain": "IT",
        "description": "Analyze complex datasets, build predictive models, and derive actionable insights using machine learning and statistics.",
        "avg_salary": "$100,000 - $170,000",
        "demand": "High",
        "growth_rate": "36%",
        "skills": ["Python", "R", "SQL", "TensorFlow", "PyTorch", "Statistics", "Tableau", "Spark"],
        "icon": "bar-chart",
        "color": "purple",
        "level": "Mid-Senior",
        "trending": True,
    },
    {
        "id": str(uuid.uuid4()),
        "title": "Product Manager",
        "domain": "Business",
        "description": "Define product vision and strategy, prioritize features, and work cross-functionally to deliver products that users love.",
        "avg_salary": "$110,000 - $180,000",
        "demand": "High",
        "growth_rate": "12%",
        "skills": ["Product Strategy", "User Research", "Agile", "Data Analysis", "Roadmapping", "A/B Testing", "SQL"],
        "icon": "target",
        "color": "green",
        "level": "Senior",
        "trending": True,
    },
    {
        "id": str(uuid.uuid4()),
        "title": "UX/UI Designer",
        "domain": "IT",
        "description": "Create user-centered designs, wireframes, prototypes, and visual interfaces that provide exceptional user experiences.",
        "avg_salary": "$80,000 - $140,000",
        "demand": "High",
        "growth_rate": "16%",
        "skills": ["Figma", "Adobe XD", "User Research", "Prototyping", "Design Systems", "HTML/CSS", "Accessibility"],
        "icon": "palette",
        "color": "pink",
        "level": "Mid",
        "trending": True,
    },
    {
        "id": str(uuid.uuid4()),
        "title": "DevOps Engineer",
        "domain": "IT",
        "description": "Build and maintain CI/CD pipelines, manage cloud infrastructure, and ensure reliable software delivery at scale.",
        "avg_salary": "$105,000 - $160,000",
        "demand": "Very High",
        "growth_rate": "22%",
        "skills": ["Docker", "Kubernetes", "AWS", "Terraform", "Jenkins", "Linux", "Python", "Monitoring"],
        "icon": "server",
        "color": "orange",
        "level": "Mid-Senior",
        "trending": False,
    },
    {
        "id": str(uuid.uuid4()),
        "title": "Machine Learning Engineer",
        "domain": "IT",
        "description": "Build and deploy ML models at scale, optimize algorithms, and create intelligent systems that learn from data.",
        "avg_salary": "$120,000 - $200,000",
        "demand": "Very High",
        "growth_rate": "40%",
        "skills": ["Python", "TensorFlow", "PyTorch", "MLOps", "Docker", "AWS SageMaker", "Deep Learning", "NLP"],
        "icon": "brain",
        "color": "violet",
        "level": "Senior",
        "trending": True,
    },
    {
        "id": str(uuid.uuid4()),
        "title": "Business Analyst",
        "domain": "Business",
        "description": "Bridge the gap between business needs and technology solutions by analyzing processes and recommending improvements.",
        "avg_salary": "$70,000 - $120,000",
        "demand": "Medium",
        "growth_rate": "11%",
        "skills": ["Requirements Gathering", "SQL", "Excel", "JIRA", "Process Mapping", "Stakeholder Management", "Data Visualization"],
        "icon": "briefcase",
        "color": "teal",
        "level": "Entry-Mid",
        "trending": False,
    },
    {
        "id": str(uuid.uuid4()),
        "title": "Cybersecurity Analyst",
        "domain": "IT",
        "description": "Protect organizations from cyber threats by monitoring systems, analyzing vulnerabilities, and implementing security measures.",
        "avg_salary": "$85,000 - $150,000",
        "demand": "Very High",
        "growth_rate": "33%",
        "skills": ["Network Security", "SIEM", "Penetration Testing", "Python", "Risk Assessment", "Compliance", "Incident Response"],
        "icon": "shield",
        "color": "red",
        "level": "Mid",
        "trending": True,
    },
    {
        "id": str(uuid.uuid4()),
        "title": "Mechanical Engineer",
        "domain": "Core",
        "description": "Design and develop mechanical systems, from consumer products to industrial machinery, using CAD and engineering principles.",
        "avg_salary": "$70,000 - $120,000",
        "demand": "Medium",
        "growth_rate": "7%",
        "skills": ["CAD/CAM", "SolidWorks", "MATLAB", "Thermodynamics", "FEA", "Manufacturing", "Project Management"],
        "icon": "wrench",
        "color": "slate",
        "level": "Mid",
        "trending": False,
    },
    {
        "id": str(uuid.uuid4()),
        "title": "Electrical Engineer",
        "domain": "Core",
        "description": "Design and develop electrical systems, circuits, and equipment for various industries including power and electronics.",
        "avg_salary": "$75,000 - $130,000",
        "demand": "Medium",
        "growth_rate": "9%",
        "skills": ["Circuit Design", "VHDL", "Embedded Systems", "MATLAB", "PCB Design", "Power Systems", "Control Systems"],
        "icon": "zap",
        "color": "yellow",
        "level": "Mid",
        "trending": False,
    },
    {
        "id": str(uuid.uuid4()),
        "title": "Cloud Architect",
        "domain": "IT",
        "description": "Design and oversee cloud computing strategies, ensuring scalable, secure, and cost-effective cloud infrastructure.",
        "avg_salary": "$130,000 - $200,000",
        "demand": "Very High",
        "growth_rate": "28%",
        "skills": ["AWS", "Azure", "GCP", "Terraform", "Microservices", "Security", "Networking", "Cost Optimization"],
        "icon": "cloud",
        "color": "cyan",
        "level": "Senior",
        "trending": True,
    },
    {
        "id": str(uuid.uuid4()),
        "title": "Marketing Manager",
        "domain": "Business",
        "description": "Develop and execute marketing strategies, manage campaigns, and drive brand awareness and customer acquisition.",
        "avg_salary": "$75,000 - $140,000",
        "demand": "Medium",
        "growth_rate": "10%",
        "skills": ["Digital Marketing", "SEO/SEM", "Content Strategy", "Analytics", "Social Media", "Brand Management", "CRM"],
        "icon": "megaphone",
        "color": "amber",
        "level": "Mid-Senior",
        "trending": False,
    },
]

ROADMAPS = [
    {
        "id": str(uuid.uuid4()),
        "title": "Full-Stack Developer Path",
        "description": "From beginner to professional full-stack developer. Master frontend, backend, and deployment.",
        "career": "Software Engineer",
        "domain": "IT",
        "duration": "6-12 months",
        "difficulty": "Intermediate",
        "steps": [
            {"id": str(uuid.uuid4()), "order": 1, "title": "HTML, CSS & JavaScript Fundamentals", "description": "Master the building blocks of web development. Learn semantic HTML, responsive CSS, and core JavaScript concepts.", "skills": ["HTML5", "CSS3", "JavaScript ES6+"], "duration": "4 weeks", "resources": ["MDN Web Docs", "freeCodeCamp", "JavaScript.info"]},
            {"id": str(uuid.uuid4()), "order": 2, "title": "React & Modern Frontend", "description": "Build dynamic user interfaces with React. Learn hooks, state management, and component architecture.", "skills": ["React", "TypeScript", "Tailwind CSS"], "duration": "6 weeks", "resources": ["React Docs", "Scrimba", "Frontend Masters"]},
            {"id": str(uuid.uuid4()), "order": 3, "title": "Node.js & Backend Development", "description": "Build server-side applications with Node.js. Learn REST APIs, authentication, and database integration.", "skills": ["Node.js", "Express", "REST APIs"], "duration": "5 weeks", "resources": ["Node.js Docs", "The Odin Project", "Udemy"]},
            {"id": str(uuid.uuid4()), "order": 4, "title": "Databases & Data Modeling", "description": "Master both SQL and NoSQL databases. Learn data modeling, queries, and optimization.", "skills": ["PostgreSQL", "MongoDB", "Redis"], "duration": "4 weeks", "resources": ["PostgreSQL Tutorial", "MongoDB University", "SQLBolt"]},
            {"id": str(uuid.uuid4()), "order": 5, "title": "DevOps & Deployment", "description": "Learn to deploy and manage applications. Master Docker, CI/CD, and cloud platforms.", "skills": ["Docker", "AWS", "CI/CD", "Git"], "duration": "4 weeks", "resources": ["Docker Docs", "AWS Free Tier", "GitHub Actions"]},
            {"id": str(uuid.uuid4()), "order": 6, "title": "Build Portfolio Projects", "description": "Apply everything you've learned by building 3-5 real-world projects for your portfolio.", "skills": ["Full-Stack Apps", "API Integration", "Testing"], "duration": "6 weeks", "resources": ["GitHub", "Vercel", "Personal Blog"]},
        ],
    },
    {
        "id": str(uuid.uuid4()),
        "title": "Data Science Career Path",
        "description": "Become a data scientist from scratch. Learn statistics, Python, ML, and data visualization.",
        "career": "Data Scientist",
        "domain": "IT",
        "duration": "8-14 months",
        "difficulty": "Advanced",
        "steps": [
            {"id": str(uuid.uuid4()), "order": 1, "title": "Python Programming", "description": "Master Python programming fundamentals, data structures, and object-oriented programming.", "skills": ["Python", "NumPy", "Pandas"], "duration": "4 weeks", "resources": ["Python.org", "Automate the Boring Stuff", "Kaggle"]},
            {"id": str(uuid.uuid4()), "order": 2, "title": "Statistics & Probability", "description": "Build a strong foundation in statistics, probability, and hypothesis testing.", "skills": ["Statistics", "Probability", "Hypothesis Testing"], "duration": "5 weeks", "resources": ["Khan Academy", "StatQuest", "Think Stats"]},
            {"id": str(uuid.uuid4()), "order": 3, "title": "Data Visualization & EDA", "description": "Learn to explore and visualize data effectively using Python libraries.", "skills": ["Matplotlib", "Seaborn", "Plotly", "EDA"], "duration": "3 weeks", "resources": ["Kaggle Courses", "Towards Data Science", "DataCamp"]},
            {"id": str(uuid.uuid4()), "order": 4, "title": "Machine Learning Foundations", "description": "Master core ML algorithms: regression, classification, clustering, and ensemble methods.", "skills": ["Scikit-learn", "Regression", "Classification", "Clustering"], "duration": "6 weeks", "resources": ["Andrew Ng's Course", "Scikit-learn Docs", "Fast.ai"]},
            {"id": str(uuid.uuid4()), "order": 5, "title": "Deep Learning & Neural Networks", "description": "Dive into deep learning with TensorFlow/PyTorch. Build CNNs, RNNs, and transformers.", "skills": ["TensorFlow", "PyTorch", "Deep Learning"], "duration": "6 weeks", "resources": ["Deep Learning Book", "Fast.ai", "PyTorch Tutorials"]},
            {"id": str(uuid.uuid4()), "order": 6, "title": "Real-World Projects & Kaggle", "description": "Apply your skills to real datasets and competitions. Build an impressive portfolio.", "skills": ["Kaggle", "Portfolio", "End-to-End ML"], "duration": "8 weeks", "resources": ["Kaggle Competitions", "GitHub", "Medium Blog"]},
        ],
    },
    {
        "id": str(uuid.uuid4()),
        "title": "Product Management Path",
        "description": "Transition into product management. Learn strategy, user research, and agile methodologies.",
        "career": "Product Manager",
        "domain": "Business",
        "duration": "4-8 months",
        "difficulty": "Intermediate",
        "steps": [
            {"id": str(uuid.uuid4()), "order": 1, "title": "Product Thinking & Strategy", "description": "Understand product lifecycle, market analysis, and strategic frameworks for product development.", "skills": ["Product Strategy", "Market Analysis", "Competitive Research"], "duration": "3 weeks", "resources": ["Inspired by Marty Cagan", "Product School", "Lenny's Newsletter"]},
            {"id": str(uuid.uuid4()), "order": 2, "title": "User Research & Discovery", "description": "Learn user interview techniques, persona creation, and customer journey mapping.", "skills": ["User Research", "Personas", "Journey Mapping"], "duration": "3 weeks", "resources": ["UX Research Methods", "UserTesting.com", "IDEO"]},
            {"id": str(uuid.uuid4()), "order": 3, "title": "Agile & Scrum Mastery", "description": "Master agile methodologies, sprint planning, and cross-functional team collaboration.", "skills": ["Agile", "Scrum", "JIRA", "Sprint Planning"], "duration": "3 weeks", "resources": ["Scrum Guide", "Atlassian", "Mountain Goat Software"]},
            {"id": str(uuid.uuid4()), "order": 4, "title": "Data-Driven Decision Making", "description": "Learn analytics, A/B testing, and metrics-driven product development.", "skills": ["SQL", "A/B Testing", "Product Metrics", "Analytics"], "duration": "4 weeks", "resources": ["Mode Analytics", "Google Analytics", "Amplitude"]},
            {"id": str(uuid.uuid4()), "order": 5, "title": "Roadmapping & Prioritization", "description": "Create effective product roadmaps, prioritize features, and communicate with stakeholders.", "skills": ["Roadmapping", "Prioritization", "Stakeholder Management"], "duration": "3 weeks", "resources": ["ProductPlan", "Aha!", "Product Board"]},
        ],
    },
    {
        "id": str(uuid.uuid4()),
        "title": "Cloud & DevOps Path",
        "description": "Master cloud computing and DevOps practices. From infrastructure to automation.",
        "career": "Cloud Architect",
        "domain": "IT",
        "duration": "6-10 months",
        "difficulty": "Advanced",
        "steps": [
            {"id": str(uuid.uuid4()), "order": 1, "title": "Linux & Networking Fundamentals", "description": "Build a strong foundation in Linux administration, networking concepts, and system administration.", "skills": ["Linux", "Networking", "Bash Scripting"], "duration": "4 weeks", "resources": ["Linux Academy", "Cisco Networking", "OverTheWire"]},
            {"id": str(uuid.uuid4()), "order": 2, "title": "Cloud Platforms (AWS/Azure/GCP)", "description": "Learn core cloud services: compute, storage, networking, and managed services on major platforms.", "skills": ["AWS", "Azure", "GCP", "Cloud Services"], "duration": "6 weeks", "resources": ["AWS Free Tier", "A Cloud Guru", "Cloud Academy"]},
            {"id": str(uuid.uuid4()), "order": 3, "title": "Containers & Orchestration", "description": "Master Docker containerization and Kubernetes orchestration for scalable deployments.", "skills": ["Docker", "Kubernetes", "Container Registry"], "duration": "5 weeks", "resources": ["Docker Docs", "Kubernetes.io", "KodeKloud"]},
            {"id": str(uuid.uuid4()), "order": 4, "title": "Infrastructure as Code", "description": "Automate infrastructure provisioning with Terraform, CloudFormation, and Ansible.", "skills": ["Terraform", "CloudFormation", "Ansible"], "duration": "4 weeks", "resources": ["Terraform Docs", "HashiCorp Learn", "Ansible Docs"]},
            {"id": str(uuid.uuid4()), "order": 5, "title": "CI/CD & Monitoring", "description": "Build automated pipelines and implement comprehensive monitoring and observability.", "skills": ["Jenkins", "GitHub Actions", "Prometheus", "Grafana"], "duration": "4 weeks", "resources": ["Jenkins Docs", "GitHub Actions", "Prometheus.io"]},
            {"id": str(uuid.uuid4()), "order": 6, "title": "Security & Cost Optimization", "description": "Implement cloud security best practices and optimize costs across cloud infrastructure.", "skills": ["Cloud Security", "IAM", "Cost Management"], "duration": "3 weeks", "resources": ["AWS Security", "Cloud Security Alliance", "FinOps Foundation"]},
        ],
    },
    {
        "id": str(uuid.uuid4()),
        "title": "Cybersecurity Path",
        "description": "Enter the cybersecurity field. Learn defense, offense, and compliance frameworks.",
        "career": "Cybersecurity Analyst",
        "domain": "IT",
        "duration": "6-12 months",
        "difficulty": "Intermediate",
        "steps": [
            {"id": str(uuid.uuid4()), "order": 1, "title": "Networking & Security Fundamentals", "description": "Understand network protocols, security concepts, and the CIA triad.", "skills": ["Networking", "TCP/IP", "Security Concepts"], "duration": "4 weeks", "resources": ["CompTIA Network+", "Cybrary", "Professor Messer"]},
            {"id": str(uuid.uuid4()), "order": 2, "title": "Operating System Security", "description": "Harden Windows and Linux systems. Learn system administration and security configurations.", "skills": ["Linux Security", "Windows Security", "Hardening"], "duration": "4 weeks", "resources": ["CIS Benchmarks", "SANS", "Linux Academy"]},
            {"id": str(uuid.uuid4()), "order": 3, "title": "Threat Detection & SIEM", "description": "Learn to detect and respond to threats using SIEM tools and threat intelligence.", "skills": ["SIEM", "Threat Detection", "Log Analysis"], "duration": "5 weeks", "resources": ["Splunk", "ELK Stack", "MITRE ATT&CK"]},
            {"id": str(uuid.uuid4()), "order": 4, "title": "Penetration Testing", "description": "Learn ethical hacking, vulnerability assessment, and penetration testing methodologies.", "skills": ["Penetration Testing", "Kali Linux", "Metasploit", "Burp Suite"], "duration": "6 weeks", "resources": ["HackTheBox", "TryHackMe", "OWASP"]},
            {"id": str(uuid.uuid4()), "order": 5, "title": "Compliance & Incident Response", "description": "Understand compliance frameworks and build incident response procedures.", "skills": ["NIST", "ISO 27001", "Incident Response"], "duration": "4 weeks", "resources": ["NIST Framework", "SANS Incident Handler", "ISO Standards"]},
        ],
    },
]

SKILLS_CATEGORIES = [
    {
        "id": str(uuid.uuid4()),
        "category": "Programming Languages",
        "skills": [
            {"name": "Python", "level": "Beginner to Advanced", "popularity": 95},
            {"name": "JavaScript", "level": "Beginner to Advanced", "popularity": 92},
            {"name": "TypeScript", "level": "Intermediate", "popularity": 78},
            {"name": "Java", "level": "Beginner to Advanced", "popularity": 75},
            {"name": "Go", "level": "Intermediate", "popularity": 60},
            {"name": "Rust", "level": "Advanced", "popularity": 45},
        ],
    },
    {
        "id": str(uuid.uuid4()),
        "category": "Frontend Frameworks",
        "skills": [
            {"name": "React", "level": "Beginner to Advanced", "popularity": 90},
            {"name": "Next.js", "level": "Intermediate", "popularity": 75},
            {"name": "Vue.js", "level": "Beginner to Advanced", "popularity": 65},
            {"name": "Angular", "level": "Intermediate to Advanced", "popularity": 55},
            {"name": "Svelte", "level": "Intermediate", "popularity": 40},
        ],
    },
    {
        "id": str(uuid.uuid4()),
        "category": "Backend & DevOps",
        "skills": [
            {"name": "Node.js", "level": "Beginner to Advanced", "popularity": 85},
            {"name": "Docker", "level": "Intermediate", "popularity": 80},
            {"name": "Kubernetes", "level": "Advanced", "popularity": 65},
            {"name": "AWS", "level": "Beginner to Advanced", "popularity": 82},
            {"name": "PostgreSQL", "level": "Beginner to Advanced", "popularity": 78},
            {"name": "MongoDB", "level": "Beginner to Advanced", "popularity": 70},
        ],
    },
    {
        "id": str(uuid.uuid4()),
        "category": "Data & AI",
        "skills": [
            {"name": "Machine Learning", "level": "Intermediate to Advanced", "popularity": 85},
            {"name": "TensorFlow", "level": "Intermediate", "popularity": 72},
            {"name": "PyTorch", "level": "Intermediate", "popularity": 75},
            {"name": "SQL", "level": "Beginner to Advanced", "popularity": 88},
            {"name": "Data Visualization", "level": "Beginner to Intermediate", "popularity": 70},
            {"name": "NLP", "level": "Advanced", "popularity": 55},
        ],
    },
    {
        "id": str(uuid.uuid4()),
        "category": "Soft Skills & Business",
        "skills": [
            {"name": "Product Management", "level": "Intermediate", "popularity": 70},
            {"name": "Agile/Scrum", "level": "Beginner to Intermediate", "popularity": 80},
            {"name": "Communication", "level": "All Levels", "popularity": 95},
            {"name": "Leadership", "level": "Intermediate to Advanced", "popularity": 75},
            {"name": "Problem Solving", "level": "All Levels", "popularity": 90},
        ],
    },
]


async def seed_database():
    client = AsyncIOMotorClient(mongo_url)
    db = client[db_name]

    # Clear existing data
    await db.careers.delete_many({})
    await db.roadmaps.delete_many({})
    await db.skills_categories.delete_many({})

    # Insert careers
    for career in CAREERS:
        career["created_at"] = datetime.now(timezone.utc).isoformat()
        await db.careers.insert_one(career)
    print(f"Inserted {len(CAREERS)} careers")

    # Insert roadmaps
    for roadmap in ROADMAPS:
        roadmap["created_at"] = datetime.now(timezone.utc).isoformat()
        await db.roadmaps.insert_one(roadmap)
    print(f"Inserted {len(ROADMAPS)} roadmaps")

    # Insert skills categories
    for cat in SKILLS_CATEGORIES:
        cat["created_at"] = datetime.now(timezone.utc).isoformat()
        await db.skills_categories.insert_one(cat)
    print(f"Inserted {len(SKILLS_CATEGORIES)} skill categories")

    # Create indexes
    await db.careers.create_index("domain")
    await db.careers.create_index("trending")
    await db.roadmaps.create_index("domain")
    await db.user_progress.create_index("user_id")

    print("Database seeded successfully!")
    client.close()


if __name__ == "__main__":
    asyncio.run(seed_database())
