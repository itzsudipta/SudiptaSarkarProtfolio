// Personal profile and IDE configuration. Catalogs are loaded from public/data/.
export const portfolio = {
  name: "Sudipta Sarkar",
  developerCredit: "Developed By Sudipta",
  role: "Backend Dev & Researcher",
  location: "Kolkata, India",
  intro:
    "I build Java backend systems and AI applications that turn complex data into useful tools.",
  bio: "I’m a Computer Science Engineer from Narula Institute of Technology, Kolkata, with a strong foundation in software development and a keen interest in academic research. My work centers on designing and building scalable, maintainable backend systems using Java, complemented by clean frontend implementations to deliver complete backend architecture. I have practical experience deploying and managing these applications on AWS, with a focus on reliability and scalability.\n\nIn parallel with development work, I actively pursue research in Computer Vision and Deep Learning, with particular interest in translating emerging AI methodologies into applied solutions. My research experience includes work on Diffusion Models, with applications explored in Fashion Engineering and AI-driven fashion design. I have also authored a patent journal on UAV and LiDAR sensor technology integrated with Computer Vision.",
  education:
    "B.Tech in Computer Science & Technology · Narula Institute of Technology, Kolkata · Class of 2026",
  techGroups: [
    ["Programming Languages", ["Java", "C", "Python"]],
    ["Frontend", ["React", "TypeScript", "JavaScript", "HTML5", "CSS3"]],
    [
      "Backend",
      [
        "Spring Boot",
        "Spring MVC",
        "Spring Data JPA",
        "Hibernate",
        "Spring Security",
        "Maven",
      ],
    ],
    [
      "Machine Learning & AI",
      ["YOLOv8", "OpenCV", "Scikit-learn", "NumPy", "Pandas", "Matplotlib"],
    ],
    ["Database Management", ["PostgreSQL", "MySQL"]],
    ["Cloud & Platforms", ["AWS", "Docker", "Git", "GitHub", "Postman"]],
    [
      "AI Platforms",
      ["Claude", "Microsoft Copilot", "Codex", "Antigravity", "Gemini", "Cursor"],
    ],
  ],
  academicJourney: [
    [
      "Sep 2023 – Jun 2026",
      "Bachelor of Technology (B.Tech) · Computer Science & Information Technology",
      "Narula Institute of Technology (NiT)",
      "Grade: 8.52\n\nActivities and societies:\n• Researched Diffusion Models for applications in Fashion Engineering.\n• Led the college project team as Team Lead, managing collaboration and project execution.\n• Participated in the Hack-O-NiT 2026 Inter-College Hackathon.\n• Served on the Management Team for the College Farewell, coordinating event operations.",
    ],
    [
      "Dec 2020 – Jun 2023",
      "Diploma in Computer Science and Technology · Computer Science and Information Technology",
      "BPC Institute of Technology (Govt.)",
      "Grade: Distinction [I] · OGPA: 8.3\n\nActivities and societies:\n• Attended the Science and Science Conference (2022) on Artificial Intelligence vs. Natural Intelligence.",
    ],
    [
      "2019–2021",
      "Higher Secondary",
      "Chakdaha Ramlal Academy",
      "Grade: B+\n\nActivities and societies:\n• Participated in the Inter-School Science Fair (2017), demonstrating interest in science and innovation.\n• Participated in the National Olympiad in Computer and English, showcasing analytical and problem-solving skills.",
    ],
  ],
  building:
    "Developing Java-based backend systems while researching machine learning applications in disaster management, with a focus on UAV-assisted communication networks for post-disaster respons",
  // Fourth value: images, e.g. [{ src: "/images/experience/gssoc.webp", alt: "GSSoC contribution" }].
  experience: [
    [
      "College project",
      "College Project Team Lead",
      "Led the college project team, coordinated development tasks, and worked with teammates to deliver project milestones.",
      [],
    ],
    [
      "2024 & 2025",
      "GirlScript Summer of Code",
      "Contributed to community projects by fixing bugs and improving features.",
      [],
    ],
    [
      "2025",
      "Apertre 3.0",
      "Worked on open-source projects and collaborated with maintainers to deliver improvements.",
      [],
    ],
    [
      "2025",
      "Hacktoberfest",
      "Submitted pull requests to open-source projects and collaborated with maintainers.",
      [],
    ],
  ],
  github: "https://github.com/itzsudipta",
  socialProfiles: {
    LinkedIn: "https://www.linkedin.com/in/infosudipta/",
    LeetCode: "https://leetcode.com/u/itzsudipta/",
    HackerRank: "https://www.hackerrank.com/profile/info_sudipta1271",
    Kaggle: "https://www.kaggle.com/infosudipta",
    GeeksforGeeks: "https://www.geeksforgeeks.org/profile/thesudiptaverse95",
  },
  website: "https://iamsudiptasarkar.me/",
  email: "info.sudipta127001@gmail.com",
  cvUrl: "/files/resume/SUDIPTA_SDE_RESUME.pdf",
  photoUrl:
    "/images/profile/SudiptaSarkar.webp",
  files: {
    // home: "home.tsx",
    profile: "profile.ts",
    academics: "academics.ts",
    experience: "experience.ts",
    projects: "projects/projects.ts",
    research: "research/research.md",
    certificates: "Achievements.md",
    contact: "connect.md",
  },
  research: [
    {
      id: "paper-rag",
      type: "Published Research Paper",
      title:
        "A Multimodal AI Approach for Fashion Design using Retrieval-Augmented Generation and Diffusion Models",
      details:
        "Co-authored with Prof. Ritwika Mukherjee, Assistant Professor, NiT Kolkata",
      linkLabel: "IEEE Xplore",
      url: "https://ieeexplore.ieee.org/search/searchresult.jsp?queryText=Retrieval-Augmented%20Generation%20(RAG)%20Combined%20with%20Diffusion%20Models",
      demo: false,
    },
    {
      id: "patent-tof",
      type: "Patent 1",
      title:
        "AI-Driven Victim Detection Using ToF Sensor Data in Multi-Sensor UAVs",
      details: "Published Application",
      linkLabel: "View Patent",
      url: "https://drive.google.com/file/d/1DiMry3BJEAi0ZBCadyPuSsucYeeXf_HJ/view?usp=drive_link",
      demo: false,
    },
    {
      id: "patent-uav",
      type: "Patent 2",
      title:
        "UAVs Integrated with AI Accelerator for Real-Time Delay-Tolerant Intelligence System in Disaster Management",
      details: "Published Application",
      linkLabel: "View Patent",
      url: "https://patents.google.com/?q=UAVs%20Integrated%20with%20AI%20Accelerator%20for%20Real-Time%20Delay-Tolerant%20Intelligence%20System%20in%20Disaster%20Management",
      demo: false,
    },
  ],
};
