export interface Project {
  title: string;
  description: string;
  technologies: string[];
  image?: string;
  demoUrl?: string;
  repositoryUrl?: string;
}

export const projects: Project[] = [];
